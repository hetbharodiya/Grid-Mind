"""Health and System Readiness API Endpoint.

Provides detailed component diagnostics, model artifact readiness,
and dataset file availability.
"""

from pathlib import Path
from fastapi import APIRouter, Depends

from app.config import settings
from app.schemas.api import HealthResponse
from app.api.deps import get_predictor

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Monitoring"])
def get_system_health() -> HealthResponse:
    """Check API health, ML model availability, and dataset access."""
    # 1. Determine model readiness dynamically using cached predictor singleton
    try:
        predictor = get_predictor()
        model_loaded = predictor.model is not None and predictor.metadata is not None
    except Exception:
        model_loaded = False

    # 2. Determine processed dataset availability dynamically
    app_dir = Path(__file__).resolve().parents[3]
    dataset_path = app_dir / "data" / "processed" / "processed_energy_demand.csv"
    dataset_available = dataset_path.is_file()

    # 3. Overall status
    status = "healthy" if (model_loaded and dataset_available) else "degraded"

    return HealthResponse(
        status=status,
        app_name=settings.app.APP_NAME,
        version=settings.app.APP_VERSION,
        model_loaded=model_loaded,
        dataset_available=dataset_available,
    )
