"""Renewable Generation Data Schemas.

Defines schemas for Solar and Wind generation records, future-ready for both
simulated physics models and external weather integration.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class SolarGenerationRecord(BaseModel):
    """Standardized single-hour solar photovoltaic generation record."""
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="Measurement timestamp")
    solar_generation_kwh: float = Field(..., ge=0.0, description="Active solar generation in kWh")
    cloud_cover_ratio: Optional[float] = Field(None, ge=0.0, le=1.0, description="Cloud attenuation factor (0=clear, 1=overcast)")


class WindGenerationRecord(BaseModel):
    """Standardized single-hour wind turbine generation record."""
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="Measurement timestamp")
    wind_generation_kwh: float = Field(..., ge=0.0, description="Active wind generation in kWh")
    wind_speed_ms: Optional[float] = Field(None, ge=0.0, description="Wind speed at hub height (m/s)")


class RenewableForecastBatch(BaseModel):
    """Container for aligned 24-hour renewable availability forecasts."""
    timestamps: List[datetime]
    solar_generation_kwh: List[float]
    wind_generation_kwh: List[float]
