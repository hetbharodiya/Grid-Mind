"""GridMind AI REST API v1 Main Router.

Aggregates sub-routers for component health, model metadata, forward
demand forecasting, and microgrid optimization dispatch.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, model, forecast, dispatch

api_v1_router = APIRouter()

# Mount endpoints under /api/v1
api_v1_router.include_router(health.router)
api_v1_router.include_router(model.router)
api_v1_router.include_router(forecast.router, prefix="/forecast", tags=["Forecasting"])
api_v1_router.include_router(dispatch.router, prefix="/dispatch", tags=["Microgrid Dispatch"])
