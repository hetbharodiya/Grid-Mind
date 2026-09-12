"""Standardized Energy Data Preprocessing Pipeline.

Provides reusable data ingestion, column mapping, timestamp normalization,
hourly aggregation, missing value handling, and standardized schema transformation.
"""

from pathlib import Path
from typing import Optional, Union, Dict, Any, List
from dataclasses import dataclass, field
import pandas as pd
import numpy as np


class DataProcessingError(Exception):
    """Base exception for data preprocessing failures."""
    pass


class DataValidationError(DataProcessingError):
    """Raised when source data violates required schema or integrity constraints."""
    pass


@dataclass
class ColumnMapping:
    """Configurable column mapping to support heterogeneous external energy datasets.
    
    Supports single timestamp columns as well as separate date + time column pairs.
    Supports active power measurements (kW) converted to hourly energy demand (kWh).
    """
    timestamp_col: Optional[str] = "timestamp"
    date_col: Optional[str] = None
    time_col: Optional[str] = None
    demand_col: str = "energy_demand_kwh"
    unit_multiplier: float = 1.0  # Used if source is in Watts or MW
    is_power_measurement: bool = False  # If True, indicates power in kW where mean(kW) * 1h = kWh

    TIMESTAMP_ALIASES = [
        "timestamp", "time", "date", "datetime", "date_time", "datetime_utc", "utc_timestamp", "period"
    ]
    DATE_ALIASES = ["date", "Date", "DATE", "day", "Day"]
    TIME_ALIASES = ["time", "Time", "TIME"]
    DEMAND_ALIASES = [
        "global_active_power", "energy_demand_kwh", "demand", "load", "consumption", "power", "grid_load",
        "consumption_kwh", "demand_kwh", "load_kwh", "total_load", "active_power", "kw", "kwh"
    ]

    @classmethod
    def auto_detect(cls, columns: list[str]) -> "ColumnMapping":
        """Heuristically inspect available columns and build an auto-detected mapping."""
        cols_lower = {str(c).lower().strip(): c for c in columns}

        # 1. Check for split Date and Time columns
        detected_date = None
        detected_time = None
        for d_alias in ["date", "day"]:
            if d_alias in cols_lower:
                detected_date = cols_lower[d_alias]
                break

        for t_alias in ["time"]:
            if t_alias in cols_lower:
                detected_time = cols_lower[t_alias]
                break

        # 2. Check for single timestamp column if not split
        detected_ts = None
        if not (detected_date and detected_time):
            for alias in cls.TIMESTAMP_ALIASES:
                if alias in cols_lower:
                    detected_ts = cols_lower[alias]
                    break

            if not detected_ts:
                ts_keywords = ["timestamp", "datetime", "date", "time"]
                for col_lower, orig_col in cols_lower.items():
                    if any(kw in col_lower for kw in ts_keywords):
                        detected_ts = orig_col
                        break

        # 3. Check for demand / power column
        detected_demand = None
        is_power = False

        # Check explicit active power first
        if "global_active_power" in cols_lower:
            detected_demand = cols_lower["global_active_power"]
            is_power = True
        else:
            for alias in cls.DEMAND_ALIASES:
                if alias in cols_lower:
                    detected_demand = cols_lower[alias]
                    if "power" in alias or "kw" in alias:
                        is_power = True
                    break

        if not detected_demand:
            demand_keywords = ["demand", "load", "consumption", "power"]
            for col_lower, orig_col in cols_lower.items():
                if orig_col not in [detected_ts, detected_date, detected_time] and any(kw in col_lower for kw in demand_keywords):
                    detected_demand = orig_col
                    if "power" in col_lower or "kw" in col_lower:
                        is_power = True
                    break

        if not ((detected_date and detected_time) or detected_ts):
            raise DataValidationError(
                f"Could not auto-detect timestamp columns from: {columns}. "
                f"Please provide explicit ColumnMapping."
            )

        if not detected_demand:
            raise DataValidationError(
                f"Could not auto-detect demand column from: {columns}. "
                f"Please provide explicit ColumnMapping."
            )

        if detected_date and detected_time:
            return cls(
                timestamp_col=None,
                date_col=detected_date,
                time_col=detected_time,
                demand_col=detected_demand,
                is_power_measurement=is_power
            )

        return cls(
            timestamp_col=detected_ts,
            demand_col=detected_demand,
            is_power_measurement=is_power
        )


@dataclass
class DatasetInspectionReport:
    """Diagnostic profile of a user-provided dataset before preprocessing."""
    total_rows: int
    total_columns: int
    columns: list[str]
    column_dtypes: dict[str, str]
    null_counts: dict[str, int]
    null_percentages: dict[str, float]
    sample_head: list[dict[str, Any]]
    candidate_timestamp_columns: list[str]
    candidate_demand_columns: list[str]
    recommended_mapping: Optional[ColumnMapping]

    def summary(self) -> str:
        """Format a human-readable diagnostic summary for terminal inspection."""
        lines = [
            "=" * 65,
            "GRIDMIND AI — DATASET INSPECTION REPORT",
            "=" * 65,
            f"Total Records:  {self.total_rows:,}",
            f"Total Columns:  {self.total_columns}",
            f"Columns Found:  {', '.join(self.columns)}",
            "-" * 65,
            "Column Diagnostics (Type / Missingness):"
        ]
        for col in self.columns:
            lines.append(
                f"  • {col:<22}: dtype={self.column_dtypes[col]:<8} | nulls={self.null_counts[col]:<7} ({self.null_percentages[col]:.2f}%)"
            )
        lines.append("-" * 65)
        lines.append(f"Candidate Timestamp Columns : {self.candidate_timestamp_columns or ['None detected']}")
        lines.append(f"Candidate Demand Columns    : {self.candidate_demand_columns or ['None detected']}")
        if self.recommended_mapping:
            if self.recommended_mapping.date_col and self.recommended_mapping.time_col:
                lines.append(
                    f"Recommended Column Mapping  : date='{self.recommended_mapping.date_col}', "
                    f"time='{self.recommended_mapping.time_col}', "
                    f"demand='{self.recommended_mapping.demand_col}' "
                    f"(is_power={self.recommended_mapping.is_power_measurement})"
                )
            else:
                lines.append(
                    f"Recommended Column Mapping  : timestamp='{self.recommended_mapping.timestamp_col}', "
                    f"demand='{self.recommended_mapping.demand_col}' "
                    f"(is_power={self.recommended_mapping.is_power_measurement})"
                )
        else:
            lines.append("Recommended Column Mapping  : Manual column selection required.")
        lines.append("=" * 65)
        return "\n".join(lines)


class DataPreprocessor:
    """Robust, reusable preprocessor transforming raw energy timeseries to standard format."""

    STANDARDIZED_COLUMNS = ["timestamp", "hour", "day_of_week", "energy_demand_kwh"]

    def __init__(self, mapping: Optional[ColumnMapping] = None):
        self.mapping = mapping

    @staticmethod
    def detect_delimiter(filepath: Union[str, Path]) -> str:
        """Heuristically inspect first line of file to detect delimiter."""
        path = Path(filepath)
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            first_line = f.readline()
        if ";" in first_line:
            return ";"
        if "\t" in first_line:
            return "\t"
        return ","

    @classmethod
    def inspect(cls, source: Union[str, Path, pd.DataFrame]) -> DatasetInspectionReport:
        """Inspect and adapt to any arbitrary user-provided dataset without prior assumptions."""
        if isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise FileNotFoundError(f"Source file not found at: {path}")
            sep = cls.detect_delimiter(path)
            try:
                # Read sample for speed if large
                df = pd.read_csv(path, sep=sep, na_values=["?", "NA", "null", "nan", ""], nrows=50000, low_memory=False)
                # Count total lines for row count
                with open(path, "rb") as f:
                    total_rows = sum(1 for _ in f) - 1
            except Exception as e:
                raise DataProcessingError(f"Could not inspect dataset at {path}: {str(e)}")
        elif isinstance(source, pd.DataFrame):
            df = source.copy()
            total_rows = len(df)
        else:
            raise TypeError("Source must be a file path or a pandas DataFrame.")

        columns = df.columns.tolist()
        col_dtypes = {c: str(df[c].dtype) for c in columns}
        null_counts = {c: int(df[c].isna().sum()) for c in columns}
        null_pct = {c: (null_counts[c] / len(df) * 100) if len(df) > 0 else 0.0 for c in columns}
        sample_head = df.head(5).to_dict(orient="records")

        # Candidate timestamp detection
        candidate_ts = []
        for col in columns:
            col_l = str(col).lower().strip()
            if any(kw in col_l for kw in ["time", "date", "timestamp", "period", "utc"]):
                candidate_ts.append(col)

        # Candidate demand detection
        candidate_demand = []
        for col in columns:
            if col in candidate_ts:
                continue
            if pd.api.types.is_numeric_dtype(df[col]):
                candidate_demand.append(col)
            else:
                col_l = str(col).lower().strip()
                if any(kw in col_l for kw in ["load", "demand", "power", "consumption", "kwh", "kw"]):
                    candidate_demand.append(col)

        recommended = None
        try:
            recommended = ColumnMapping.auto_detect(columns)
        except Exception:
            pass

        return DatasetInspectionReport(
            total_rows=total_rows,
            total_columns=len(columns),
            columns=columns,
            column_dtypes=col_dtypes,
            null_counts=null_counts,
            null_percentages=null_pct,
            sample_head=sample_head,
            candidate_timestamp_columns=candidate_ts,
            candidate_demand_columns=candidate_demand,
            recommended_mapping=recommended
        )

    def load_csv(
        self,
        filepath: Union[str, Path],
        sep: Optional[str] = None,
        na_values: Optional[List[str]] = None,
        usecols: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """Load raw CSV/text data with automatic delimiter and missing value detection."""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Source file not found at: {path}")

        delimiter = sep or self.detect_delimiter(path)
        null_markers = na_values or ["?", "NA", "null", "nan", ""]

        try:
            df = pd.read_csv(
                path,
                sep=delimiter,
                na_values=null_markers,
                usecols=usecols,
                low_memory=False
            )
        except Exception as e:
            raise DataProcessingError(f"Failed to read CSV at {path}: {str(e)}")

        if df.empty:
            raise DataValidationError(f"Loaded file at {path} is empty.")

        return df

    def validate_and_map_columns(self, df: pd.DataFrame, mapping: Optional[ColumnMapping] = None) -> pd.DataFrame:
        """Ensure required fields exist, parse dates/times, and rename to standardized schema."""
        active_mapping = mapping or self.mapping

        if active_mapping is None:
            active_mapping = ColumnMapping.auto_detect(df.columns.tolist())

        df_out = pd.DataFrame()

        # Handle split Date and Time columns vs single timestamp column
        if active_mapping.date_col and active_mapping.time_col:
            if active_mapping.date_col not in df.columns:
                raise DataValidationError(f"Configured date column '{active_mapping.date_col}' not found.")
            if active_mapping.time_col not in df.columns:
                raise DataValidationError(f"Configured time column '{active_mapping.time_col}' not found.")

            # Combine date and time
            df_out["timestamp"] = pd.to_datetime(
                df[active_mapping.date_col].astype(str).str.strip() + " " + df[active_mapping.time_col].astype(str).str.strip(),
                dayfirst=True,
                errors="coerce"
            )
        elif active_mapping.timestamp_col:
            if active_mapping.timestamp_col not in df.columns:
                raise DataValidationError(f"Configured timestamp column '{active_mapping.timestamp_col}' not found.")
            df_out["timestamp"] = pd.to_datetime(df[active_mapping.timestamp_col], errors="coerce")
        else:
            raise DataValidationError("No timestamp or date+time columns configured in ColumnMapping.")

        # Map demand column
        if active_mapping.demand_col not in df.columns:
            raise DataValidationError(f"Configured demand column '{active_mapping.demand_col}' not found.")

        df_out["energy_demand_kwh"] = pd.to_numeric(df[active_mapping.demand_col], errors="coerce")

        if active_mapping.unit_multiplier != 1.0:
            df_out["energy_demand_kwh"] = df_out["energy_demand_kwh"] * active_mapping.unit_multiplier

        return df_out

    def parse_and_sort_timestamps(self, df: pd.DataFrame) -> pd.DataFrame:
        """Filter unparseable timestamps, drop duplicate timestamps, and sort chronologically."""
        df = df.copy()

        # Drop NaT timestamps
        invalid_ts_count = df["timestamp"].isna().sum()
        if invalid_ts_count > 0:
            df = df.dropna(subset=["timestamp"])

        if df.empty:
            raise DataValidationError("All timestamps were unparseable or NaT.")

        # Deduplicate timestamps if any duplicate rows exist (keep first)
        df = df.drop_duplicates(subset=["timestamp"], keep="first")

        # Sort chronologically
        df = df.sort_values(by="timestamp").reset_index(drop=True)
        return df

    def clean_missing_and_invalid(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing, null, negative, or infinite energy demand readings."""
        df = df.copy()

        # Replace non-positive or infinite values with NaN for interpolation
        df.loc[df["energy_demand_kwh"] < 0, "energy_demand_kwh"] = np.nan
        df.loc[np.isinf(df["energy_demand_kwh"]), "energy_demand_kwh"] = np.nan

        # Linear interpolation bounded by forward/backward fill
        df["energy_demand_kwh"] = df["energy_demand_kwh"].interpolate(method="linear", limit_direction="both")

        if df["energy_demand_kwh"].isna().all():
            raise DataValidationError("Demand series contains no valid positive numeric readings.")

        return df

    def aggregate_to_hourly(self, df: pd.DataFrame) -> pd.DataFrame:
        """Resample timeseries to uniform 1-hour intervals.
        
        If source data is minute-level active power (in kW), the average power over 1 hour
        multiplied by 1 hour produces the exact hourly energy consumption in kWh:
            Energy (kWh) = mean(Power_kW) * 1 hour.
        """
        df = df.copy()
        df = df.set_index("timestamp")
        
        # Resample to 1-hour interval, compute mean
        df_hourly = df.resample("1h").mean()

        # Interpolate any remaining hourly gaps resulting from prolonged outages
        df_hourly["energy_demand_kwh"] = df_hourly["energy_demand_kwh"].interpolate(
            method="linear", limit_direction="both"
        )

        df_hourly = df_hourly.reset_index()
        return df_hourly

    def extract_calendar_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive standard temporal components required by downstream ML models."""
        df = df.copy()
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek

        # Reorder to canonical standardized schema
        df = df[self.STANDARDIZED_COLUMNS]
        return df

    def process(
        self,
        source: Union[str, Path, pd.DataFrame],
        mapping: Optional[ColumnMapping] = None
    ) -> pd.DataFrame:
        """Execute the complete standardization pipeline.
        
        Pipeline:
        Load -> Validate & Map -> Parse & Sort -> Clean Values -> Hourly Resample -> Calendar Features
        """
        if isinstance(source, (str, Path)):
            raw_df = self.load_csv(source)
        elif isinstance(source, pd.DataFrame):
            raw_df = source.copy()
        else:
            raise TypeError("Source must be a file path or a pandas DataFrame.")

        mapped_df = self.validate_and_map_columns(raw_df, mapping=mapping)
        sorted_df = self.parse_and_sort_timestamps(mapped_df)
        cleaned_df = self.clean_missing_and_invalid(sorted_df)
        hourly_df = self.aggregate_to_hourly(cleaned_df)
        final_df = self.extract_calendar_features(hourly_df)

        return final_df

    def save_processed(self, df: pd.DataFrame, output_path: Union[str, Path]) -> Path:
        """Save clean standardized dataset to CSV."""
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(path, index=False)
        return path
