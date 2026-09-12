"""Microgrid Optimization Dispatch API Endpoints.

Provides single-hour live optimization dispatch and 24-hour sequential
horizon dispatch scheduling by coordinating the ML demand forecaster
and PuLP linear programming optimization engine.
"""

import time
import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.api import (
    NextHourDispatchRequest,
    NextHourDispatchResponse,
    Horizon24hDispatchRequest,
    Horizon24hDispatchResponse,
    ErrorResponse,
)
from app.api.deps import get_integration_service
from app.api.history import resolve_historical_df
from app.integration.service import GridMindIntegrationService
from app.integration.models import (
    ForecastDispatchInput,
    Horizon24hDispatchInput,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/next-hour",
    response_model=NextHourDispatchResponse,
    summary="1-Hour Forward AI Forecast & Microgrid Dispatch",
    responses={
        400: {"model": ErrorResponse, "description": "Insufficient historical demand records (< 168 hours)"},
        422: {"description": "Validation error or non-continuous hourly records"},
        500: {"model": ErrorResponse, "description": "Forecasting or optimization dispatch failure"},
    },
)
def dispatch_next_hour(
    payload: NextHourDispatchRequest = NextHourDispatchRequest(),
    integration_service: GridMindIntegrationService = Depends(get_integration_service),
) -> NextHourDispatchResponse:
    """Execute live single-hour AI forecast and optimal microgrid energy dispatch."""
    start_time = time.perf_counter()

    # 1. Resolve historical demand context
    historical_df, history_source, history_records_used = resolve_historical_df(payload.historical_data)

    # 2. Build domain input model
    dispatch_input = ForecastDispatchInput(
        solar_available_kwh=payload.solar_available_kwh,
        wind_available_kwh=payload.wind_available_kwh,
        battery=payload.battery,
        grid_available_kwh=payload.grid_available_kwh,
        diesel_available_kwh=payload.diesel_available_kwh,
        mode=payload.mode,
        costs=payload.costs,
        carbon=payload.carbon,
        weights=payload.weights,
    )

    # 3. Delegate to integration orchestration service (domain exceptions handled globally)
    result = integration_service.dispatch_next_hour(historical_df, dispatch_input)

    # 4. Measure end-to-end execution latency
    latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    # 5. Return HTTP transport schema
    return NextHourDispatchResponse(
        forecast=result.forecast,
        optimization=result.optimization,
        clean_energy_percentage=result.clean_energy_percentage,
        history_source=history_source,
        history_records_used=history_records_used,
        latency_ms=latency_ms,
    )


@router.post(
    "/24h",
    response_model=Horizon24hDispatchResponse,
    summary="24-Hour AI Forecast & Sequential Dispatch Horizon",
    responses={
        400: {"model": ErrorResponse, "description": "Insufficient historical demand records (< 168 hours)"},
        422: {"description": "Validation error or invalid asset availability profiles"},
        500: {"model": ErrorResponse, "description": "Forecasting or sequential dispatch optimization failure"},
    },
)
def dispatch_24h_horizon(
    payload: Horizon24hDispatchRequest = Horizon24hDispatchRequest(),
    integration_service: GridMindIntegrationService = Depends(get_integration_service),
) -> Horizon24hDispatchResponse:
    """Execute 24-hour forward forecast and sequential microgrid dispatch simulation."""
    start_time = time.perf_counter()

    # 1. Resolve historical demand context
    historical_df, history_source, history_records_used = resolve_historical_df(payload.historical_data)

    # 2. Build domain input model
    horizon_input = Horizon24hDispatchInput(
        battery=payload.battery,
        mode=payload.mode,
        costs=payload.costs,
        carbon=payload.carbon,
        weights=payload.weights,
        hourly_availability=payload.hourly_availability,
        solar_profile_kwh=payload.solar_profile_kwh,
        wind_profile_kwh=payload.wind_profile_kwh,
        grid_available_kwh=payload.grid_available_kwh,
        diesel_available_kwh=payload.diesel_available_kwh,
    )

    # 3. Delegate to integration orchestration service (domain exceptions handled globally)
    result = integration_service.dispatch_24h_horizon(historical_df, horizon_input)

    # 4. Measure end-to-end execution latency
    latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    # 5. Return HTTP transport schema
    return Horizon24hDispatchResponse(
        hourly_steps=result.hourly_steps,
        daily_summary=result.daily_summary,
        battery_soc_trajectory=result.battery_soc_trajectory,
        history_source=history_source,
        history_records_used=history_records_used,
        latency_ms=latency_ms,
    )
