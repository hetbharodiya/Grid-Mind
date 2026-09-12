"""API Request and Response Schemas for GridMind AI.

Defines HTTP transport contracts for health monitoring, model metadata,
forward demand forecasting, and microgrid dispatch optimization.
Reuses existing domain models directly from app.optimization and app.integration.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.optimization.config import OptimizationMode
from app.optimization.models import (
    BatteryState,
    CostConfig,
    CarbonConfig,
    OptimizationWeights,
    OptimizationResult,
)
from app.integration.models import (
    HourlyAssetAvailability,
    ForecastInfo,
    HourlyDispatchStep,
    DailyDispatchSummary,
)


# ==============================================================================
# 1. Base Historical Telemetry Schema
# ==============================================================================

class HistoricalDataPoint(BaseModel):
    """Standardized hourly historical energy consumption data point."""
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="ISO 8601 timestamp of the measurement")
    energy_demand_kwh: float = Field(..., ge=0.0, description="Observed electricity consumption in kWh")


# ==============================================================================
# 2. System Health & Model Metadata Schemas
# ==============================================================================

class HealthResponse(BaseModel):
    """System health and component readiness response."""
    status: str = Field(default="healthy", description="Overall service status")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    model_loaded: bool = Field(..., description="Whether the ML model artifact is loaded and ready")
    dataset_available: bool = Field(..., description="Whether the processed historical dataset is accessible")


class ModelInfoResponse(BaseModel):
    """Safe model metadata and evaluation metrics read from model_metadata.json."""
    model_type: str = Field(..., description="Architecture of the forecasting model")
    algorithm: str = Field(..., description="Underlying algorithm name")
    dataset_used: str = Field(..., description="Dataset name used during training")
    target_column: str = Field(..., description="Target prediction variable name")
    feature_count: int = Field(..., description="Total number of engineered features")
    feature_columns: List[str] = Field(..., description="List of feature column names")
    total_records_trained_on: int = Field(..., description="Number of training samples")
    split_ratios: Optional[Dict[str, float]] = Field(default=None, description="Dataset split fractions")
    date_ranges: Optional[Dict[str, Any]] = Field(default=None, description="Temporal ranges for train/val/test splits")
    metrics: Optional[Dict[str, Any]] = Field(default=None, description="Performance evaluation metrics")
    top_feature_importances: Optional[Dict[str, float]] = Field(default=None, description="Top permutation feature importances")


# ==============================================================================
# 3. Demand Forecasting Schemas
# ==============================================================================

class ForecastStepItem(BaseModel):
    """Single step within a multi-horizon forecast trajectory."""
    step: int = Field(..., ge=1, le=24, description="Step index within horizon (1-24)")
    timestamp: str = Field(..., description="ISO 8601 target forecast timestamp")
    hour: int = Field(..., ge=0, le=23, description="Hour of day [0-23]")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week [0=Monday, 6=Sunday]")
    predicted_demand_kwh: float = Field(..., ge=0.0, description="Predicted electricity demand in kWh")


class NextHourForecastRequest(BaseModel):
    """Request payload for single-step forward demand forecasting."""
    historical_data: Optional[List[HistoricalDataPoint]] = Field(
        default=None,
        description="Optional custom historical demand records (requires at least 168 hours). If omitted, default dataset tail is used."
    )


class NextHourForecastResponse(BaseModel):
    """Response payload for single-step forward demand forecasting."""
    predicted_demand_kwh: float = Field(..., ge=0.0, description="Predicted electrical load for next hour (kWh)")
    forecast_timestamp: str = Field(..., description="ISO 8601 target timestamp for predicted hour")
    hour: int = Field(..., ge=0, le=23, description="Hour of day [0-23]")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week [0=Monday, 6=Sunday]")
    model_type: str = Field(default="HistGradientBoostingRegressor", description="Model architecture used")
    history_source: str = Field(..., description="Source of historical context ('user_provided' or 'default_dataset')")
    history_records_used: int = Field(..., description="Number of historical hourly records ingested")
    latency_ms: float = Field(..., ge=0.0, description="End-to-end execution time in milliseconds")


class Horizon24hForecastRequest(BaseModel):
    """Request payload for 24-hour multi-step forward demand forecasting."""
    historical_data: Optional[List[HistoricalDataPoint]] = Field(
        default=None,
        description="Optional custom historical demand records (requires at least 168 hours). If omitted, default dataset tail is used."
    )


class Horizon24hForecastResponse(BaseModel):
    """Response payload for 24-hour multi-step forward demand forecasting."""
    horizon_hours: int = Field(default=24, description="Total forecast steps")
    forecasts: List[ForecastStepItem] = Field(..., description="Chronological array of 24 hourly predictions")
    total_predicted_demand_kwh: float = Field(..., ge=0.0, description="Cumulative predicted demand over 24 hours (kWh)")
    history_source: str = Field(..., description="Source of historical context ('user_provided' or 'default_dataset')")
    history_records_used: int = Field(..., description="Number of historical hourly records ingested")
    latency_ms: float = Field(..., ge=0.0, description="End-to-end execution time in milliseconds")


# ==============================================================================
# 4. Microgrid Dispatch Schemas
# ==============================================================================

class NextHourDispatchRequest(BaseModel):
    """Request payload for live single-hour AI forecast and microgrid optimization dispatch."""
    historical_data: Optional[List[HistoricalDataPoint]] = Field(
        default=None,
        description="Optional custom historical demand records. If omitted, default dataset tail is used."
    )
    solar_available_kwh: float = Field(default=0.0, ge=0.0, description="Available solar generation for next hour (kWh)")
    wind_available_kwh: float = Field(default=0.0, ge=0.0, description="Available wind generation for next hour (kWh)")
    battery: BatteryState = Field(default_factory=BatteryState, description="Current battery asset state")
    grid_available_kwh: float = Field(default=100.0, ge=0.0, description="Utility grid connection capacity (kWh)")
    diesel_available_kwh: float = Field(default=75.0, ge=0.0, description="Backup diesel generator capacity (kWh)")
    mode: OptimizationMode = Field(default=OptimizationMode.BALANCED, description="Operational optimization preset")
    costs: CostConfig = Field(default_factory=CostConfig, description="Operational cost parameters ($/kWh)")
    carbon: CarbonConfig = Field(default_factory=CarbonConfig, description="Emissions factors (kg CO2/kWh)")
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights, description="Multi-objective weights for Balanced mode")


class NextHourDispatchResponse(BaseModel):
    """Response payload for live single-hour AI forecast and microgrid optimization dispatch."""
    forecast: ForecastInfo = Field(..., description="AI demand forecast metadata and prediction")
    optimization: OptimizationResult = Field(..., description="Microgrid LP optimization allocation and metrics")
    clean_energy_percentage: float = Field(..., ge=0.0, le=100.0, description="Clean energy share of total supplied energy")
    history_source: str = Field(..., description="Source of historical context ('user_provided' or 'default_dataset')")
    history_records_used: int = Field(..., description="Number of historical records used")
    latency_ms: float = Field(..., ge=0.0, description="End-to-end execution time in milliseconds")


class Horizon24hDispatchRequest(BaseModel):
    """Request payload for 24-hour sequential AI forecast and microgrid dispatch horizon."""
    historical_data: Optional[List[HistoricalDataPoint]] = Field(
        default=None,
        description="Optional custom historical demand records. If omitted, default dataset tail is used."
    )
    battery: BatteryState = Field(default_factory=BatteryState, description="Initial battery asset state at start of horizon")
    mode: OptimizationMode = Field(default=OptimizationMode.BALANCED, description="Operational optimization preset")
    costs: CostConfig = Field(default_factory=CostConfig, description="Operational cost parameters ($/kWh)")
    carbon: CarbonConfig = Field(default_factory=CarbonConfig, description="Emissions factors (kg CO2/kWh)")
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights, description="Multi-objective weights for Balanced mode")

    # Strategy A: Explicit 24-element structured hourly availability objects
    hourly_availability: Optional[List[HourlyAssetAvailability]] = Field(
        default=None,
        description="Strategy A: Explicit 24-element list of asset availability parameters for each hour."
    )

    # Strategy B: 24-element numeric arrays for renewables with scalar grid/diesel limits
    solar_profile_kwh: Optional[List[float]] = Field(
        default=None,
        description="Strategy B: 24-element array of solar generation in kWh."
    )
    wind_profile_kwh: Optional[List[float]] = Field(
        default=None,
        description="Strategy B: 24-element array of wind generation in kWh."
    )
    grid_available_kwh: float = Field(default=100.0, ge=0.0, description="Default or constant grid import limit (kWh)")
    diesel_available_kwh: float = Field(default=75.0, ge=0.0, description="Default or constant diesel generator capacity (kWh)")

    @model_validator(mode="after")
    def validate_availability_strategy(self) -> "Horizon24hDispatchRequest":
        """Enforce strict, non-ambiguous availability strategy rules."""
        has_strategy_a = self.hourly_availability is not None
        has_solar_profile = self.solar_profile_kwh is not None
        has_wind_profile = self.wind_profile_kwh is not None
        has_strategy_b = has_solar_profile or has_wind_profile

        # Rule A: Cannot provide both Strategy A and Strategy B simultaneously
        if has_strategy_a and has_strategy_b:
            raise ValueError(
                "Ambiguous asset availability input: 'hourly_availability' (Option A) cannot be provided "
                "together with 'solar_profile_kwh' or 'wind_profile_kwh' (Option B). Choose one availability strategy."
            )

        # Rule B: If Strategy A is provided, validate length and sequential hour numbering
        if has_strategy_a:
            if len(self.hourly_availability) != 24:
                raise ValueError(
                    f"hourly_availability must contain exactly 24 items, received {len(self.hourly_availability)}."
                )
            for idx, item in enumerate(self.hourly_availability, start=1):
                if item.hour_number != idx:
                    raise ValueError(
                        f"hourly_availability items must have sequential hour_number from 1 to 24; "
                        f"item at index {idx - 1} has hour_number {item.hour_number}."
                    )

        # Rule C: If Strategy B is provided, both solar and wind arrays must be provided, length 24, >= 0.0
        if has_strategy_b:
            if not (has_solar_profile and has_wind_profile):
                raise ValueError(
                    "Both 'solar_profile_kwh' and 'wind_profile_kwh' must be provided together when using Option B."
                )
            if len(self.solar_profile_kwh) != 24:
                raise ValueError(
                    f"solar_profile_kwh must contain exactly 24 values, received {len(self.solar_profile_kwh)}."
                )
            if len(self.wind_profile_kwh) != 24:
                raise ValueError(
                    f"wind_profile_kwh must contain exactly 24 values, received {len(self.wind_profile_kwh)}."
                )
            if any(val < 0.0 for val in self.solar_profile_kwh):
                raise ValueError("All values in 'solar_profile_kwh' must be non-negative (>= 0.0).")
            if any(val < 0.0 for val in self.wind_profile_kwh):
                raise ValueError("All values in 'wind_profile_kwh' must be non-negative (>= 0.0).")

        # Rule D: If neither is provided, request is allowed; fallback handled by integration layer
        return self


class Horizon24hDispatchResponse(BaseModel):
    """Response payload for 24-hour sequential AI forecast and microgrid dispatch horizon."""
    hourly_steps: List[HourlyDispatchStep] = Field(..., description="Array of 24 hourly dispatch steps")
    daily_summary: DailyDispatchSummary = Field(..., description="Consolidated 24-hour metrics and operational KPIs")
    battery_soc_trajectory: List[float] = Field(..., description="Chronological array of 24 ending battery SoC values")
    history_source: str = Field(..., description="Source of historical context ('user_provided' or 'default_dataset')")
    history_records_used: int = Field(..., description="Number of historical records used")
    latency_ms: float = Field(..., ge=0.0, description="End-to-end execution time in milliseconds")


# ==============================================================================
# 5. Error Envelope Schemas
# ==============================================================================

class ErrorDetail(BaseModel):
    """Standardized error detail representation."""
    error_code: str = Field(..., description="Machine-readable domain error code")
    message: str = Field(..., description="Human-readable description of the error")


class ErrorResponse(BaseModel):
    """Standardized JSON error response envelope."""
    detail: ErrorDetail = Field(..., description="Error detail object")
