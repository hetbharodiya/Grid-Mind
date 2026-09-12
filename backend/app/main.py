"""GridMind AI FastAPI Application Entry Point.

Provides core server lifecycle, middleware configuration, and baseline
health check infrastructure.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_v1_router
from app.api.handlers import register_exception_handlers

app = FastAPI(
    title=settings.app.APP_NAME,
    version=settings.app.APP_VERSION,
    description="AI-Powered Microgrid Energy Forecasting and Optimization Platform for Off-Grid Communities."
)

# Register centralized domain and global exception handlers
register_exception_handlers(app)

# Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.app.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_v1_router, prefix=settings.app.API_V1_STR)


@app.get("/", tags=["General"])
async def root():
    """Root endpoint verifying backend service status."""
    return {"message": "GridMind AI Backend is running"}


@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Health check endpoint for container and uptime monitoring."""
    return {"status": "healthy"}

