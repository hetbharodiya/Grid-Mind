"""Energy Demand Data Schemas.

Defines standardized data models for historical demand records,
timeseries validation, and future feature-engineered ML payloads.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class EnergyDemandRecord(BaseModel):
    """Standardized single-hour electricity consumption record."""
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="ISO 8601 timestamp for the measurement hour")
    hour: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    energy_demand_kwh: float = Field(..., ge=0.0, description="Observed electricity consumption in kWh")


class EnergyDemandBatch(BaseModel):
    """Batch of standardized demand records for analysis or training."""
    records: List[EnergyDemandRecord] = Field(..., description="Chronologically sorted demand records")
    total_records: int = Field(..., ge=0, description="Total count of records")


class MLLoadFeatures(BaseModel):
    """Feature vector schema for ML model input during training or inference.
    
    Derived dynamically during feature engineering, not stored in raw data.
    """
    timestamp: datetime
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    is_weekend: int = Field(..., ge=0, le=1)
    
    # Cyclical encodings
    sin_hour: float
    cos_hour: float
    sin_dow: float
    cos_dow: float
    
    # Autoregressive lag features (optional during cold-start or inference)
    lag_1: Optional[float] = None
    lag_24: Optional[float] = None
    lag_168: Optional[float] = None
    
    # Rolling statistics
    rolling_mean_24h: Optional[float] = None
    rolling_std_24h: Optional[float] = None
    
    # Target value (present in training, None in future forecast)
    energy_demand_kwh: Optional[float] = None
