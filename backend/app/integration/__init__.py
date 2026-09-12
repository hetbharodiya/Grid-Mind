"""Forecast and Dispatch Integration Package.

Connects the trained ML demand forecaster (app.ml) with the
PuLP microgrid optimization engine (app.optimization).
"""

from app.integration.exceptions import (
    IntegrationError,
    InsufficientHistoryError,
    ForecastingPipelineError,
    OptimizationDispatchError,
)
from app.integration.models import (
    ForecastInfo,
    ForecastDispatchInput,
    ForecastDispatchResult,
    HourlyAssetAvailability,
    Horizon24hDispatchInput,
    HourlyDispatchStep,
    DailyDispatchSummary,
    Horizon24hDispatchResult,
)
from app.integration.service import GridMindIntegrationService

__all__ = [
    "IntegrationError",
    "InsufficientHistoryError",
    "ForecastingPipelineError",
    "OptimizationDispatchError",
    "ForecastInfo",
    "ForecastDispatchInput",
    "ForecastDispatchResult",
    "HourlyAssetAvailability",
    "Horizon24hDispatchInput",
    "HourlyDispatchStep",
    "DailyDispatchSummary",
    "Horizon24hDispatchResult",
    "GridMindIntegrationService",
]
