"""Feature Engineering Pipeline for Time Series Electricity Demand Forecasting.

Constructs calendar, cyclical, autoregressive lag, and rolling statistics features
with strict anti-data-leakage shifting.
"""

from typing import List, Tuple, Optional
import pandas as pd
import numpy as np


class FeatureEngineeringError(Exception):
    """Raised when feature generation fails or violates integrity."""
    pass


class FeaturePipeline:
    """Production-grade feature transformer for hourly electricity load forecasting."""

    TARGET_COL = "energy_demand_kwh"
    TIMESTAMP_COL = "timestamp"

    # Autoregressive lags (in hours): 1h, 2h, 3h, 24h (yesterday), 48h (2 days ago), 168h (1 week ago)
    LAG_HOURS: List[int] = [1, 2, 3, 24, 48, 168]

    # Rolling window sizes (in hours) calculated strictly on past values
    ROLLING_WINDOWS: List[int] = [6, 24]

    def __init__(self, target_col: str = TARGET_COL, timestamp_col: str = TIMESTAMP_COL):
        self.target_col = target_col
        self.timestamp_col = timestamp_col
        self.feature_columns: List[str] = []

    def create_calendar_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive cyclical and calendar features from timestamps."""
        df = df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df[self.timestamp_col]):
            df[self.timestamp_col] = pd.to_datetime(df[self.timestamp_col])

        # Base calendar properties
        df["hour"] = df[self.timestamp_col].dt.hour
        df["day_of_week"] = df[self.timestamp_col].dt.dayofweek
        df["day_of_month"] = df[self.timestamp_col].dt.day
        df["month"] = df[self.timestamp_col].dt.month
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

        # Cyclical diurnal (24-hour cycle)
        df["sin_hour"] = np.sin(2 * np.pi * df["hour"] / 24.0)
        df["cos_hour"] = np.cos(2 * np.pi * df["hour"] / 24.0)

        # Cyclical weekly (7-day cycle)
        df["sin_dow"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
        df["cos_dow"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)

        # Cyclical annual (12-month cycle)
        df["sin_month"] = np.sin(2 * np.pi * df["month"] / 12.0)
        df["cos_month"] = np.cos(2 * np.pi * df["month"] / 12.0)

        return df

    def create_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive autoregressive lag features strictly shifted from past observations."""
        df = df.copy()
        for lag in self.LAG_HOURS:
            col_name = f"lag_{lag}"
            # shift(lag) guarantees that row t only sees demand from t - lag
            df[col_name] = df[self.target_col].shift(lag)
        return df

    def create_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive rolling statistical features strictly using past observations (shift=1)."""
        df = df.copy()
        # CRITICAL ANTI-LEAKAGE: We shift the target series by 1 BEFORE computing rolling statistics
        # This ensures the current hour's target demand is NEVER included in rolling mean/std.
        shifted_target = df[self.target_col].shift(1)

        for window in self.ROLLING_WINDOWS:
            df[f"rolling_mean_{window}h"] = shifted_target.rolling(window=window).mean()
            df[f"rolling_std_{window}h"] = shifted_target.rolling(window=window).std()
            df[f"rolling_max_{window}h"] = shifted_target.rolling(window=window).max()
            df[f"rolling_min_{window}h"] = shifted_target.rolling(window=window).min()

        return df

    def transform(self, df: pd.DataFrame, drop_na: bool = True) -> pd.DataFrame:
        """Execute full feature engineering pipeline."""
        if self.timestamp_col not in df.columns or self.target_col not in df.columns:
            raise FeatureEngineeringError(
                f"Missing required columns. Expected {self.timestamp_col} and {self.target_col}, found {df.columns.tolist()}"
            )

        df = df.sort_values(by=self.timestamp_col).reset_index(drop=True)

        df = self.create_calendar_features(df)
        df = self.create_lag_features(df)
        df = self.create_rolling_features(df)

        # Define all feature column names (excluding raw timestamp and raw target)
        exclude_cols = [self.timestamp_col, self.target_col]
        self.feature_columns = [c for c in df.columns if c not in exclude_cols]

        if drop_na:
            # Initial max_lag rows (168 rows) will contain NaNs from lag_168 and rolling windows
            df = df.dropna().reset_index(drop=True)

        return df

    def get_feature_columns(self) -> List[str]:
        """Return the list of engineered feature names."""
        return list(self.feature_columns)
