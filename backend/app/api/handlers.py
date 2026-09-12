"""Centralized Exception Handlers for GridMind AI API.

Provides structured error responses conforming to ErrorResponse and ErrorDetail
schemas for all domain exceptions (ML, Optimization, Integration, and Data Processing)
and unexpected internal server errors.
"""

import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.schemas.api import ErrorResponse, ErrorDetail
from app.integration.exceptions import (
    InsufficientHistoryError,
    ForecastingPipelineError,
    OptimizationDispatchError,
    IntegrationError,
)
from app.ml.predictor import ModelLoadError, PredictionError
from app.ml.features import FeatureEngineeringError
from app.services.data_preprocessor import DataProcessingError, DataValidationError

logger = logging.getLogger(__name__)


def create_error_response(status_code: int, error_code: str, message: str) -> JSONResponse:
    """Construct a standardized JSON error response adhering to ErrorResponse schema."""
    payload = ErrorResponse(
        detail=ErrorDetail(
            error_code=error_code,
            message=message,
        )
    ).model_dump()
    return JSONResponse(status_code=status_code, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    """Register domain and fallback exception handlers on the FastAPI application.

    Handlers are registered in order from most specific to least specific:
    1. Leaf domain exceptions (InsufficientHistoryError, ForecastingPipelineError, OptimizationDispatchError, DataValidationError)
    2. Mid-level domain exceptions (PredictionError, FeatureEngineeringError, ModelLoadError, IntegrationError, DataProcessingError)
    3. Fallback standard Exception
    """

    # 1. Specific Integration Exceptions (subclasses of IntegrationError)
    @app.exception_handler(InsufficientHistoryError)
    async def insufficient_history_handler(request: Request, exc: InsufficientHistoryError):
        logger.warning(f"Insufficient history error at {request.url.path}: {exc}")
        return create_error_response(
            status_code=400,
            error_code="INSUFFICIENT_HISTORY",
            message=str(exc),
        )

    @app.exception_handler(ForecastingPipelineError)
    async def forecasting_pipeline_error_handler(request: Request, exc: ForecastingPipelineError):
        logger.error(f"Forecasting pipeline error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=500,
            error_code="FORECASTING_PIPELINE_ERROR",
            message=str(exc),
        )

    @app.exception_handler(OptimizationDispatchError)
    async def optimization_dispatch_error_handler(request: Request, exc: OptimizationDispatchError):
        logger.error(f"Optimization dispatch error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=500,
            error_code="OPTIMIZATION_DISPATCH_ERROR",
            message=str(exc),
        )

    # 2. Base Integration Error
    @app.exception_handler(IntegrationError)
    async def integration_error_handler(request: Request, exc: IntegrationError):
        logger.error(f"Integration error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=500,
            error_code="INTEGRATION_ERROR",
            message=str(exc),
        )

    # 3. Machine Learning & Forecasting Exceptions
    @app.exception_handler(ModelLoadError)
    async def model_load_error_handler(request: Request, exc: ModelLoadError):
        logger.error(f"Model load error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=503,
            error_code="MODEL_UNAVAILABLE",
            message=str(exc),
        )

    @app.exception_handler(PredictionError)
    async def prediction_error_handler(request: Request, exc: PredictionError):
        logger.error(f"Prediction error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=500,
            error_code="PREDICTION_ERROR",
            message=str(exc),
        )

    @app.exception_handler(FeatureEngineeringError)
    async def feature_engineering_error_handler(request: Request, exc: FeatureEngineeringError):
        logger.error(f"Feature engineering error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=500,
            error_code="FEATURE_ENGINEERING_ERROR",
            message=str(exc),
        )

    # 4. Data Processing Exceptions (DataValidationError is subclass of DataProcessingError)
    @app.exception_handler(DataValidationError)
    async def data_validation_error_handler(request: Request, exc: DataValidationError):
        logger.warning(f"Data validation error at {request.url.path}: {exc}")
        return create_error_response(
            status_code=422,
            error_code="DATA_VALIDATION_ERROR",
            message=str(exc),
        )

    @app.exception_handler(DataProcessingError)
    async def data_processing_error_handler(request: Request, exc: DataProcessingError):
        logger.error(f"Data processing error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=500,
            error_code="DATA_PROCESSING_ERROR",
            message=str(exc),
        )

    # 5. Unexpected Internal Server Errors (Catch-all without leaking tracebacks)
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled server error at {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected internal server error occurred.",
        )
