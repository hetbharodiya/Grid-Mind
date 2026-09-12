"""Historical Demand Data Processing and Validation Utilities.

Shared helper functions for resolving and validating caller-supplied
or default historical electricity consumption records.
"""

from typing import Optional, List, Tuple
import pandas as pd
from fastapi import HTTPException, status

from app.schemas.api import HistoricalDataPoint
from app.api.deps import get_default_history_df


def resolve_historical_df(
    historical_data: Optional[List[HistoricalDataPoint]],
) -> Tuple[pd.DataFrame, str, int]:
    """Resolve, validate, and structure the historical demand context.

    Args:
        historical_data: Optional list of HistoricalDataPoint objects.

    Returns:
        Tuple of (DataFrame, history_source, history_records_used).

    Raises:
        HTTPException(400): If user-provided history contains fewer than 168 records.
        HTTPException(422): If user-provided history contains duplicate timestamps.
        HTTPException(422): If user-provided history contains non-continuous hourly intervals (time gaps).
    """
    if historical_data is None:
        df = get_default_history_df()
        return df, "default", len(df)

    # 1. Validate minimum record count
    if len(historical_data) < 168:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient historical data: at least 168 continuous hourly records are required, received {len(historical_data)}.",
        )

    # 2. Convert to DataFrame
    records = [
        {"timestamp": pt.timestamp, "energy_demand_kwh": pt.energy_demand_kwh}
        for pt in historical_data
    ]
    df = pd.DataFrame(records)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # 3. Validate unique timestamps
    if not df["timestamp"].is_unique:
        raise HTTPException(
            status_code=422,
            detail="Historical demand data contains duplicate timestamps.",
        )

    # 4. Sort chronologically
    df = df.sort_values(by="timestamp").reset_index(drop=True)

    # 5. Validate continuous hourly intervals (no gaps)
    time_diffs = df["timestamp"].diff().iloc[1:]
    if (time_diffs != pd.Timedelta(hours=1)).any():
        raise HTTPException(
            status_code=422,
            detail="Historical demand data must contain continuous hourly records without time gaps.",
        )

    return df, "provided", len(df)
