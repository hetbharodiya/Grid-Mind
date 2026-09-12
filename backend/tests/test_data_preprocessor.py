"""Unit tests for the DataPreprocessor service, column mapping, and dataset processing."""

from pathlib import Path
import pandas as pd
import numpy as np
import pytest

from app.services.data_preprocessor import (
    DataPreprocessor,
    ColumnMapping,
    DatasetInspectionReport,
    DataValidationError
)


@pytest.fixture
def in_memory_raw_df() -> pd.DataFrame:
    """Dynamically generate a 48-hour synthetic in-memory DataFrame for unit testing."""
    dates = pd.date_range("2026-05-01 00:00:00", periods=48, freq="h")
    loads = [40.0 + (i % 24) * 2.5 for i in range(48)]
    return pd.DataFrame({"datetime_utc": dates, "consumption_kwh": loads})


@pytest.fixture
def split_date_time_minute_df() -> pd.DataFrame:
    """Simulate split Date and Time columns with sub-hourly (minute-level) active power readings."""
    timestamps = pd.date_range("2026-01-01 00:00:00", periods=180, freq="min")  # 3 full hours
    dates = timestamps.strftime("%d/%m/%Y")
    times = timestamps.strftime("%H:%M:%S")
    # Active power in kW oscillating around 2.0 kW
    powers = [2.0 + 0.5 * np.sin(i / 10.0) for i in range(180)]
    return pd.DataFrame({
        "Date": dates,
        "Time": times,
        "Global_active_power": powers,
        "Voltage": [235.0] * 180
    })


@pytest.fixture
def messy_dataframe() -> pd.DataFrame:
    """Create an in-memory DataFrame with missing and negative values."""
    timestamps = [
        "2026-03-01 00:00:00",
        "2026-03-01 01:00:00",
        "2026-03-01 02:00:00",
        "2026-03-01 03:00:00",
        "2026-03-01 04:00:00",
    ]
    loads = [45.0, -10.0, np.nan, 55.0, 60.0]
    return pd.DataFrame({"time": timestamps, "demand": loads})


def test_column_mapping_autodetect_single_col():
    """Verify auto-detection of single timestamp column."""
    cols = ["Date_Time", "Grid_Load", "Irrelevant_Col"]
    mapping = ColumnMapping.auto_detect(cols)
    assert mapping.timestamp_col == "Date_Time"
    assert mapping.demand_col == "Grid_Load"


def test_column_mapping_autodetect_split_datetime():
    """Verify auto-detection of split Date and Time columns and Global_active_power."""
    cols = ["Date", "Time", "Global_active_power", "Voltage"]
    mapping = ColumnMapping.auto_detect(cols)
    assert mapping.date_col == "Date"
    assert mapping.time_col == "Time"
    assert mapping.demand_col == "Global_active_power"
    assert mapping.is_power_measurement is True


def test_column_mapping_failure():
    """Verify DataValidationError raised when required columns cannot be found."""
    cols = ["User_ID", "Status"]
    with pytest.raises(DataValidationError):
        ColumnMapping.auto_detect(cols)


def test_dataset_inspection(in_memory_raw_df: pd.DataFrame):
    """Verify adaptive inspection reporting on an arbitrary dataset."""
    report = DataPreprocessor.inspect(in_memory_raw_df)

    assert isinstance(report, DatasetInspectionReport)
    assert report.total_rows == 48
    assert report.total_columns == 2
    assert "datetime_utc" in report.candidate_timestamp_columns
    assert "consumption_kwh" in report.candidate_demand_columns
    assert report.recommended_mapping is not None
    assert report.recommended_mapping.timestamp_col == "datetime_utc"
    assert report.recommended_mapping.demand_col == "consumption_kwh"
    
    summary_text = report.summary()
    assert "GRIDMIND AI — DATASET INSPECTION REPORT" in summary_text
    assert "Total Records:  48" in summary_text


def test_process_split_date_time_minute_data(split_date_time_minute_df: pd.DataFrame):
    """Verify that split Date+Time and 1-minute power data are cleanly converted to hourly energy."""
    preprocessor = DataPreprocessor()
    df_processed = preprocessor.process(split_date_time_minute_df)

    # 180 minutes should aggregate to exactly 3 hourly records
    assert len(df_processed) == 3
    assert list(df_processed.columns) == ["timestamp", "hour", "day_of_week", "energy_demand_kwh"]
    assert not df_processed["energy_demand_kwh"].isna().any()
    # Mean power ~2.0 kW * 1 hr = ~2.0 kWh
    assert 1.5 <= df_processed["energy_demand_kwh"].iloc[0] <= 2.5


def test_data_preprocessor_cleans_messy_data(messy_dataframe: pd.DataFrame):
    """Verify that negative and missing values are properly interpolated."""
    mapping = ColumnMapping(timestamp_col="time", demand_col="demand")
    preprocessor = DataPreprocessor(mapping=mapping)
    df_processed = preprocessor.process(messy_dataframe)

    assert len(df_processed) == 5
    assert not df_processed["energy_demand_kwh"].isna().any()
    assert df_processed.loc[1, "energy_demand_kwh"] > 0.0
    assert df_processed.loc[2, "energy_demand_kwh"] > 0.0


def test_save_processed_data(tmp_path: Path, in_memory_raw_df: pd.DataFrame):
    """Verify clean saving of processed data to destination file."""
    preprocessor = DataPreprocessor()
    df_processed = preprocessor.process(in_memory_raw_df)

    out_file = tmp_path / "processed_test.csv"
    saved_path = preprocessor.save_processed(df_processed, out_file)

    assert saved_path.exists()
    loaded_df = pd.read_csv(saved_path)
    assert len(loaded_df) == 48
    assert "energy_demand_kwh" in loaded_df.columns


def test_processed_dataset_integrity():
    """Verify the integrity of the real processed dataset if generated on disk."""
    processed_file = Path(__file__).resolve().parent.parent / "app" / "data" / "processed" / "processed_energy_demand.csv"
    if processed_file.exists():
        df = pd.read_csv(processed_file, nrows=1000)
        assert "timestamp" in df.columns
        assert "energy_demand_kwh" in df.columns
        assert not df["energy_demand_kwh"].isna().any()
        assert (df["energy_demand_kwh"] >= 0).all()
