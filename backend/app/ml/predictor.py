"""Reusable Prediction Service for Electricity Demand Forecasting.

Supports single-step inference and recursive 24-step multi-horizon forecasting
using the trained ML artifact.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Union, Optional
from datetime import datetime, timedelta
import joblib
import pandas as pd
import numpy as np

from app.ml.features import FeaturePipeline


class ModelLoadError(Exception):
    """Raised when model artifact or metadata cannot be loaded."""
    pass


class PredictionError(Exception):
    """Raised when prediction pipeline fails due to invalid history or features."""
    pass


class DemandPredictor:
    """Inference engine for loading trained models and generating future load predictions."""

    def __init__(self, model_path: Optional[Union[str, Path]] = None, metadata_path: Optional[Union[str, Path]] = None):
        backend_dir = Path(__file__).resolve().parent.parent.parent
        default_model_dir = backend_dir / "app" / "models"
        
        self.model_path = Path(model_path) if model_path else default_model_dir / "demand_model.joblib"
        self.metadata_path = Path(metadata_path) if metadata_path else default_model_dir / "model_metadata.json"
        
        self.model = None
        self.metadata = None
        self.feature_columns: List[str] = []
        self.feature_pipe = FeaturePipeline()
        
        self._load()

    def _load(self):
        """Load serialized model artifact and corresponding metadata."""
        if not self.model_path.exists():
            raise ModelLoadError(f"Model file not found at: {self.model_path}")
        if not self.metadata_path.exists():
            raise ModelLoadError(f"Metadata file not found at: {self.metadata_path}")

        try:
            self.model = joblib.load(self.model_path)
        except Exception as e:
            raise ModelLoadError(f"Failed to unpickle model artifact: {str(e)}")

        try:
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            self.feature_columns = self.metadata.get("feature_columns", [])
        except Exception as e:
            raise ModelLoadError(f"Failed to read model metadata: {str(e)}")

        if not self.feature_columns:
            raise ModelLoadError("No feature columns defined in model metadata.")

    def predict_features(self, X: np.ndarray) -> np.ndarray:
        """Raw prediction on an engineered feature matrix."""
        preds = self.model.predict(X)
        # Demand cannot be physically negative
        return np.maximum(0.0, preds)

    def forecast_24h(
        self,
        historical_df: pd.DataFrame,
        horizon_hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Generate a multi-step forward forecast for the next `horizon_hours` (default 24).
        
        Uses an iterative recursive strategy:
        At each step k, derives temporal features, draws historical lags from recent history
        combined with earlier predictions, computes the forecast, and appends to the history buffer.
        
        Requires at least 168 hours (1 full week) of historical demand for lag_168.
        """
        min_required_hours = max(FeaturePipeline.LAG_HOURS)
        if len(historical_df) < min_required_hours:
            raise PredictionError(
                f"Insufficient historical data for 24h forecasting. "
                f"Required at least {min_required_hours} hours, received {len(historical_df)} hours."
            )

        # Standardize history buffer
        df_hist = historical_df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df_hist[FeaturePipeline.TIMESTAMP_COL]):
            df_hist[FeaturePipeline.TIMESTAMP_COL] = pd.to_datetime(df_hist[FeaturePipeline.TIMESTAMP_COL])

        df_hist = df_hist.sort_values(by=FeaturePipeline.TIMESTAMP_COL).reset_index(drop=True)
        target_col = FeaturePipeline.TARGET_COL

        # Working buffer containing timestamps and demand (kWh)
        buffer_ts = list(df_hist[FeaturePipeline.TIMESTAMP_COL].values)
        buffer_demand = list(df_hist[target_col].values)

        last_timestamp = pd.to_datetime(buffer_ts[-1])
        forecast_results: List[Dict[str, Any]] = []

        for step in range(1, horizon_hours + 1):
            future_ts = last_timestamp + timedelta(hours=step)

            # 1. Calendar features
            hour = future_ts.hour
            dow = future_ts.dayofweek
            dom = future_ts.day
            month = future_ts.month
            is_weekend = 1 if dow >= 5 else 0

            sin_hour = np.sin(2 * np.pi * hour / 24.0)
            cos_hour = np.cos(2 * np.pi * hour / 24.0)
            sin_dow = np.sin(2 * np.pi * dow / 7.0)
            cos_dow = np.cos(2 * np.pi * dow / 7.0)
            sin_month = np.sin(2 * np.pi * month / 12.0)
            cos_month = np.cos(2 * np.pi * month / 12.0)

            # 2. Lag features (retrieved from end of buffer)
            lags = {}
            for lag in FeaturePipeline.LAG_HOURS:
                lags[f"lag_{lag}"] = buffer_demand[-lag]

            # 3. Rolling features (computed on recent buffer tail before current step)
            rolling = {}
            for w in FeaturePipeline.ROLLING_WINDOWS:
                tail = buffer_demand[-w:]
                rolling[f"rolling_mean_{w}h"] = float(np.mean(tail))
                rolling[f"rolling_std_{w}h"] = float(np.std(tail)) if len(tail) > 1 else 0.0
                rolling[f"rolling_max_{w}h"] = float(np.max(tail))
                rolling[f"rolling_min_{w}h"] = float(np.min(tail))

            # Assemble feature row in the EXACT order expected by the model
            feature_dict = {
                "hour": hour,
                "day_of_week": dow,
                "day_of_month": dom,
                "month": month,
                "is_weekend": is_weekend,
                "sin_hour": sin_hour,
                "cos_hour": cos_hour,
                "sin_dow": sin_dow,
                "cos_dow": cos_dow,
                "sin_month": sin_month,
                "cos_month": cos_month,
                **lags,
                **rolling
            }

            feature_vector = np.array([[feature_dict[c] for c in self.feature_columns]])
            pred_demand = float(self.predict_features(feature_vector)[0])
            pred_demand = round(pred_demand, 4)

            # Append prediction to history buffer for subsequent steps
            buffer_ts.append(future_ts)
            buffer_demand.append(pred_demand)

            forecast_results.append({
                "step": step,
                "timestamp": str(future_ts),
                "hour": hour,
                "day_of_week": dow,
                "predicted_demand_kwh": pred_demand
            })

        return forecast_results
