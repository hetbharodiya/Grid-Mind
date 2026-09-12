"""Integration Data Models and Schema Contracts.

Defines Pydantic v2 schemas for combined forecast and dispatch execution,
single-hour results, hourly availability profiles, and 24-hour horizon trajectories.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.optimization.config import OptimizationMode
from app.optimization.models import (
    BatteryState,
    CostConfig,
    CarbonConfig,
    OptimizationWeights,
    OptimizationResult,
)


class ForecastInfo(BaseModel):
    """Metadata and predicted load output from the ML forecaster."""
    model_config = ConfigDict(from_attributes=True)

    predicted_demand_kwh: float = Field(..., ge=0.0, description="Predicted electrical load in kWh")
    forecast_timestamp: str = Field(..., description="ISO 8601 target timestamp for the forecast")
    horizon_step: int = Field(default=1, ge=1, description="Step index within the forecast horizon")
    hour: int = Field(..., ge=0, le=23, description="Hour of day [0-23]")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week [0=Monday, 6=Sunday]")
    model_type: str = Field(default="HistGradientBoostingRegressor", description="ML model architecture name")


class ForecastDispatchInput(BaseModel):
    """Configuration and asset availability parameters for single-hour dispatch."""
    model_config = ConfigDict(from_attributes=True)

    solar_available_kwh: float = Field(default=0.0, ge=0.0, description="Available solar generation (kWh)")
    wind_available_kwh: float = Field(default=0.0, ge=0.0, description="Available wind generation (kWh)")
    battery: BatteryState = Field(default_factory=BatteryState, description="Current battery asset state")
    grid_available_kwh: float = Field(default=100.0, ge=0.0, description="Utility grid connection capacity (kWh)")
    diesel_available_kwh: float = Field(default=75.0, ge=0.0, description="Backup diesel generator capacity (kWh)")
    mode: OptimizationMode = Field(default=OptimizationMode.BALANCED, description="Operational optimization preset")
    costs: CostConfig = Field(default_factory=CostConfig, description="Operational cost assumptions ($/kWh)")
    carbon: CarbonConfig = Field(default_factory=CarbonConfig, description="Carbon emission assumptions (kg CO2/kWh)")
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights, description="Weights for Balanced Mode")


class ForecastDispatchResult(BaseModel):
    """Combined single-hour result isolating the ML forecast from the LP optimization dispatch."""
    model_config = ConfigDict(from_attributes=True)

    forecast: ForecastInfo
    optimization: OptimizationResult
    clean_energy_percentage: float = Field(ge=0.0, le=100.0, description="Percentage of load met by zero-carbon sources")
    pipeline_execution_time_ms: float = Field(ge=0.0, description="End-to-end forecast + dispatch solve time in ms")


class HourlyAssetAvailability(BaseModel):
    """Explicit hourly asset availability for multi-period simulation."""
    model_config = ConfigDict(from_attributes=True)

    hour_number: int = Field(..., ge=1, le=24, description="Step index (1 to 24)")
    solar_available_kwh: float = Field(default=0.0, ge=0.0, description="Available solar for this hour")
    wind_available_kwh: float = Field(default=0.0, ge=0.0, description="Available wind for this hour")
    grid_available_kwh: float = Field(default=100.0, ge=0.0, description="Grid import capacity for this hour")
    diesel_available_kwh: float = Field(default=75.0, ge=0.0, description="Diesel capacity for this hour")


class Horizon24hDispatchInput(BaseModel):
    """Input specification for 24-hour sequential forecast and dispatch horizon."""
    model_config = ConfigDict(from_attributes=True)

    battery: BatteryState = Field(default_factory=BatteryState, description="Initial battery state at start of horizon")
    mode: OptimizationMode = Field(default=OptimizationMode.BALANCED, description="Operational preset across horizon")
    costs: CostConfig = Field(default_factory=CostConfig, description="Operational costs ($/kWh)")
    carbon: CarbonConfig = Field(default_factory=CarbonConfig, description="Emissions factors (kg CO2/kWh)")
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights, description="Balanced Mode weights")
    
    # Caller may supply structured list of 24 hourly availability objects
    hourly_availability: Optional[List[HourlyAssetAvailability]] = Field(
        default=None,
        description="Explicit 24-element list of asset availability parameters"
    )
    # Alternatively, caller may supply 24-element numeric arrays
    solar_profile_kwh: Optional[List[float]] = Field(
        default=None,
        description="24-element array of solar generation in kWh"
    )
    wind_profile_kwh: Optional[List[float]] = Field(
        default=None,
        description="24-element array of wind generation in kWh"
    )
    grid_available_kwh: float = Field(default=100.0, ge=0.0, description="Constant or default grid capacity")
    diesel_available_kwh: float = Field(default=75.0, ge=0.0, description="Constant or default diesel capacity")

    @model_validator(mode="after")
    def validate_profiles(self) -> "Horizon24hDispatchInput":
        """Verify profile array lengths if provided."""
        if self.hourly_availability is not None and len(self.hourly_availability) != 24:
            raise ValueError(f"hourly_availability must contain exactly 24 elements, got {len(self.hourly_availability)}")
        if self.solar_profile_kwh is not None and len(self.solar_profile_kwh) != 24:
            raise ValueError(f"solar_profile_kwh must contain exactly 24 elements, got {len(self.solar_profile_kwh)}")
        if self.wind_profile_kwh is not None and len(self.wind_profile_kwh) != 24:
            raise ValueError(f"wind_profile_kwh must contain exactly 24 elements, got {len(self.wind_profile_kwh)}")
        return self


class HourlyDispatchStep(BaseModel):
    """Detailed record of one hour within the 24-hour dispatch simulation."""
    model_config = ConfigDict(from_attributes=True)

    hour_number: int = Field(ge=1, le=24, description="Step in horizon (1-24)")
    timestamp: str = Field(description="Target forecast timestamp")
    predicted_demand_kwh: float = Field(ge=0.0)
    solar_used_kwh: float = Field(ge=0.0)
    wind_used_kwh: float = Field(ge=0.0)
    battery_used_kwh: float = Field(ge=0.0)
    grid_used_kwh: float = Field(ge=0.0)
    diesel_used_kwh: float = Field(ge=0.0)
    unmet_demand_kwh: float = Field(ge=0.0)
    battery_soc_after_dispatch: float = Field(ge=0.0, le=1.0, description="Updated battery SoC fraction")
    hourly_cost_usd: float = Field(ge=0.0)
    hourly_carbon_kg: float = Field(ge=0.0)
    solver_status: str


class DailyDispatchSummary(BaseModel):
    """Consolidated 24-hour metrics and operational KPIs."""
    model_config = ConfigDict(from_attributes=True)

    total_predicted_demand_kwh: float
    total_supplied_energy_kwh: float
    total_solar_used_kwh: float
    total_wind_used_kwh: float
    total_battery_used_kwh: float
    total_grid_used_kwh: float
    total_diesel_used_kwh: float
    total_unmet_demand_kwh: float
    total_operational_cost_usd: float
    total_carbon_emissions_kg: float
    starting_battery_soc: float
    ending_battery_soc: float
    average_clean_energy_percentage: float
    optimization_mode: OptimizationMode


class Horizon24hDispatchResult(BaseModel):
    """Comprehensive 24-hour horizon forecast and sequential dispatch result."""
    model_config = ConfigDict(from_attributes=True)

    hourly_steps: List[HourlyDispatchStep]
    daily_summary: DailyDispatchSummary
    battery_soc_trajectory: List[float] = Field(description="Array of 24 hourly ending SoC values")
    pipeline_execution_time_ms: float = Field(ge=0.0)
