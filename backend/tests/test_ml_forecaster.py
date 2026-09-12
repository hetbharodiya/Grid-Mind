"""Unit tests for the Machine Learning Demand Forecasting module."""

from pathlib import Path
import pandas as pd
import numpy as np
import pytest

from app.ml.features import FeaturePipeline, FeatureEngineeringError
from app.ml.predictor import DemandPredictor, ModelLoadError, PredictionError


@pytest.fixture
def synthetic_load_timeseries() -> pd.DataFrame:
    """Generate 200 hours of synthetic hourly load data for testing."""
    dates = pd.date_range("2026-06-01 00:00:00", periods=200, freq="h")
    # Base diurnal pattern + random variation
    loads = [1.5 + 0.8 * np.sin(2 * np.pi * (i % 24) / 24.0) + 0.1 * (i % 5) for i in range(200)]
    return pd.DataFrame({
        "timestamp": dates,
        "energy_demand_kwh": loads
    })


def test_feature_pipeline_transformation(synthetic_load_timeseries: pd.DataFrame):
    """Verify FeaturePipeline generates expected calendar, lag, and rolling features."""
    pipe = FeaturePipeline()
    df_feat = pipe.transform(synthetic_load_timeseries, drop_na=True)

    # Required feature categories
    expected_calendar = ["hour", "day_of_week", "day_of_month", "month", "is_weekend"]
    expected_cyclical = ["sin_hour", "cos_hour", "sin_dow", "cos_dow", "sin_month", "cos_month"]
    expected_lags = ["lag_1", "lag_2", "lag_3", "lag_24", "lag_48", "lag_168"]
    expected_rolling = ["rolling_mean_6h", "rolling_std_6h", "rolling_mean_24h", "rolling_std_24h"]

    for col in expected_calendar + expected_cyclical + expected_lags + expected_rolling:
        assert col in df_feat.columns, f"Missing expected feature: {col}"

    # Verify no NaN values remain
    assert not df_feat.isna().any().any()
    # Initial 168 rows dropped due to lag_168
    assert len(df_feat) == len(synthetic_load_timeseries) - 168


def test_anti_data_leakage_guarantee(synthetic_load_timeseries: pd.DataFrame):
    """Verify that lag features and rolling features strictly use past values."""
    pipe = FeaturePipeline()
    df_feat = pipe.transform(synthetic_load_timeseries, drop_na=False)

    # For any row t >= 168, lag_1 must strictly equal energy_demand_kwh at row t - 1
    for t in [170, 180, 190]:
        assert df_feat.loc[t, "lag_1"] == synthetic_load_timeseries.loc[t - 1, "energy_demand_kwh"]
        assert df_feat.loc[t, "lag_24"] == synthetic_load_timeseries.loc[t - 24, "energy_demand_kwh"]
        assert df_feat.loc[t, "lag_168"] == synthetic_load_timeseries.loc[t - 168, "energy_demand_kwh"]

        # rolling_mean_6h at row t must be the mean of rows [t-6 to t-1]
        expected_roll6 = synthetic_load_timeseries.loc[t - 6:t - 1, "energy_demand_kwh"].mean()
        assert np.isclose(df_feat.loc[t, "rolling_mean_6h"], expected_roll6)


def test_feature_pipeline_missing_columns():
    """Verify FeatureEngineeringError raised when mandatory columns are absent."""
    invalid_df = pd.DataFrame({"some_time": [1, 2], "value": [10, 20]})
    pipe = FeaturePipeline()
    with pytest.raises(FeatureEngineeringError):
        pipe.transform(invalid_df)


def test_model_artifact_and_metadata_exist():
    """Verify that trained model artifact and metadata exist on disk."""
    model_dir = Path(__file__).resolve().parent.parent / "app" / "models"
    model_path = model_dir / "demand_model.joblib"
    metadata_path = model_dir / "model_metadata.json"

    assert model_path.exists(), "Trained model artifact demand_model.joblib is missing"
    assert metadata_path.exists(), "Model metadata model_metadata.json is missing"


def test_demand_predictor_initialization():
    """Verify DemandPredictor loads the trained model and metadata."""
    predictor = DemandPredictor()
    assert predictor.model is not None
    assert len(predictor.feature_columns) > 0
    assert "lag_1" in predictor.feature_columns
    assert "metrics" in predictor.metadata


def test_demand_predictor_forecast_24h(synthetic_load_timeseries: pd.DataFrame):
    """Verify that forecast_24h generates 24 valid non-negative hourly predictions."""
    predictor = DemandPredictor()
    forecast = predictor.forecast_24h(synthetic_load_timeseries, horizon_hours=24)

    assert len(forecast) == 24
    for i, pt in enumerate(forecast):
        assert pt["step"] == i + 1
        assert "timestamp" in pt
        assert 0 <= pt["hour"] <= 23
        assert pt["predicted_demand_kwh"] >= 0.0
        assert isinstance(pt["predicted_demand_kwh"], float)


def test_demand_predictor_insufficient_history():
    """Verify PredictionError raised when history has fewer than 168 hours."""
    short_df = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=50, freq="h"),
        "energy_demand_kwh": [1.0] * 50
    })
    predictor = DemandPredictor()
    with pytest.raises(PredictionError):
        predictor.forecast_24h(short_df, horizon_hours=24)
