"""Demand Forecasting API Endpoints.

Provides single-step and 24-hour recursive forward electricity demand forecasting
using the pre-trained HistGradientBoostingRegressor model artifact.
Supports both default historical context and caller-supplied telemetry.
"""

import time
from typing import Optional, List, Tuple
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException

from app.schemas.api import (
    HistoricalDataPoint,
    NextHourForecastRequest,
    NextHourForecastResponse,
    Horizon24hForecastRequest,
    Horizon24hForecastResponse,
    ForecastStepItem,
    ErrorResponse,
)
from app.ml.predictor import DemandPredictor
from app.api.deps import get_predictor
from app.api.history import resolve_historical_df

router = APIRouter()


@router.post(
    "/next-hour",
    response_model=NextHourForecastResponse,
    summary="1-Hour Forward AI Demand Forecast",
    responses={
        400: {"model": ErrorResponse, "description": "Insufficient historical demand records (< 168 hours)"},
        422: {"description": "Validation error or non-continuous hourly records"},
        500: {"model": ErrorResponse, "description": "Forecasting model prediction failure"},
    },
)
def forecast_next_hour(
    payload: NextHourForecastRequest = NextHourForecastRequest(),
    predictor: DemandPredictor = Depends(get_predictor),
) -> NextHourForecastResponse:
    """Predict electricity demand for the immediate next hour."""
    start_time = time.perf_counter()

    # Resolve historical demand buffer
    historical_df, history_source, history_records_used = resolve_historical_df(payload.historical_data)

    # Execute single-step forecast (domain exceptions handled globally)
    forecast_steps = predictor.forecast_24h(historical_df, horizon_hours=1)

    if not forecast_steps:
        raise HTTPException(status_code=500, detail="Forecasting model returned empty prediction.")

    step_data = forecast_steps[0]
    latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    return NextHourForecastResponse(
        predicted_demand_kwh=float(step_data["predicted_demand_kwh"]),
        forecast_timestamp=step_data["timestamp"],
        hour=step_data["hour"],
        day_of_week=step_data["day_of_week"],
        model_type="HistGradientBoostingRegressor",
        history_source=history_source,
        history_records_used=history_records_used,
        latency_ms=latency_ms,
    )


@router.post(
    "/24h",
    response_model=Horizon24hForecastResponse,
    summary="24-Hour Forward AI Demand Forecast",
    responses={
        400: {"model": ErrorResponse, "description": "Insufficient historical demand records (< 168 hours)"},
        422: {"description": "Validation error or non-continuous hourly records"},
        500: {"model": ErrorResponse, "description": "Multi-horizon forecasting pipeline failure"},
    },
)
def forecast_24h(
    payload: Horizon24hForecastRequest = Horizon24hForecastRequest(),
    predictor: DemandPredictor = Depends(get_predictor),
) -> Horizon24hForecastResponse:
    """Generate a multi-step 24-hour forward electricity demand forecast trajectory."""
    start_time = time.perf_counter()

    # Resolve historical demand buffer
    historical_df, history_source, history_records_used = resolve_historical_df(payload.historical_data)

    # Execute 24-step multi-horizon forecast (domain exceptions handled globally)
    forecast_steps = predictor.forecast_24h(historical_df, horizon_hours=24)

    if len(forecast_steps) != 24:
        raise HTTPException(
            status_code=500,
            detail=f"Expected 24 forecast steps from predictor, received {len(forecast_steps)}.",
        )

    # Convert dictionaries to ForecastStepItem
    forecast_items = [
        ForecastStepItem(
            step=item["step"],
            timestamp=item["timestamp"],
            hour=item["hour"],
            day_of_week=item["day_of_week"],
            predicted_demand_kwh=float(item["predicted_demand_kwh"]),
        )
        for item in forecast_steps
    ]

    total_demand_kwh = round(
        sum(item.predicted_demand_kwh for item in forecast_items),
        4,
    )
    latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    return Horizon24hForecastResponse(
        horizon_hours=24,
        forecasts=forecast_items,
        total_predicted_demand_kwh=total_demand_kwh,
        history_source=history_source,
        history_records_used=history_records_used,
        latency_ms=latency_ms,
    )
