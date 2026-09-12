"""Optimization Data Models and Schema Definitions.

Defines Pydantic v2 schemas for validating optimization inputs,
microgrid asset states, source allocations, financial metrics,
and solver results.
"""

from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.optimization.config import (
    OptimizationMode,
    DEFAULT_SOLAR_COST_PER_KWH,
    DEFAULT_WIND_COST_PER_KWH,
    DEFAULT_BATTERY_COST_PER_KWH,
    DEFAULT_GRID_COST_PER_KWH,
    DEFAULT_DIESEL_COST_PER_KWH,
    DEFAULT_SOLAR_CO2_PER_KWH,
    DEFAULT_WIND_CO2_PER_KWH,
    DEFAULT_BATTERY_CO2_PER_KWH,
    DEFAULT_GRID_CO2_PER_KWH,
    DEFAULT_DIESEL_CO2_PER_KWH,
    DEFAULT_BATTERY_CAPACITY_KWH,
    DEFAULT_BATTERY_CURRENT_SOC,
    DEFAULT_BATTERY_MIN_SOC,
    DEFAULT_BATTERY_DISCHARGE_EFFICIENCY,
    DEFAULT_BATTERY_MAX_DISCHARGE_KW,
    DEFAULT_COST_WEIGHT,
    DEFAULT_CARBON_WEIGHT,
)


class BatteryState(BaseModel):
    """Electrochemical battery energy storage system state for dispatch."""
    model_config = ConfigDict(from_attributes=True)

    capacity_kwh: float = Field(
        default=DEFAULT_BATTERY_CAPACITY_KWH,
        gt=0.0,
        description="Nameplate battery storage capacity in kWh"
    )
    current_soc: float = Field(
        default=DEFAULT_BATTERY_CURRENT_SOC,
        ge=0.0,
        le=1.0,
        description="Current State of Charge fraction [0.0 - 1.0]"
    )
    minimum_soc: float = Field(
        default=DEFAULT_BATTERY_MIN_SOC,
        ge=0.0,
        le=1.0,
        description="Minimum allowable State of Charge reserve floor [0.0 - 1.0]"
    )
    discharge_efficiency: float = Field(
        default=DEFAULT_BATTERY_DISCHARGE_EFFICIENCY,
        gt=0.0,
        le=1.0,
        description="One-way discharge efficiency fraction [0.0 - 1.0]"
    )
    maximum_discharge_kw: float = Field(
        default=DEFAULT_BATTERY_MAX_DISCHARGE_KW,
        ge=0.0,
        description="Inverter maximum discharge power limit in kW"
    )

    @model_validator(mode="after")
    def validate_soc_bounds(self) -> "BatteryState":
        """Verify minimum_soc does not exceed 1.0."""
        if self.minimum_soc > 1.0:
            raise ValueError("minimum_soc cannot exceed 1.0")
        return self

    def get_deliverable_energy_kwh(self, time_horizon_hours: float = 1.0) -> float:
        """Calculate maximum deliverable energy to load over the specified time horizon.

        1. Usable chemical storage = max(0, current_soc - minimum_soc) * capacity_kwh
        2. Deliverable energy through inverter = usable_stored * discharge_efficiency
        3. Inverter maximum power limit = maximum_discharge_kw * time_horizon_hours
        Result is bounded by min(deliverable_from_storage, inverter_limit).
        """
        usable_stored = max(0.0, (self.current_soc - self.minimum_soc) * self.capacity_kwh)
        deliverable_from_storage = usable_stored * self.discharge_efficiency
        inverter_limit = self.maximum_discharge_kw * time_horizon_hours
        return min(deliverable_from_storage, inverter_limit)


class CostConfig(BaseModel):
    """Configurable operational unit costs for energy sources ($/kWh)."""
    model_config = ConfigDict(from_attributes=True)

    solar: float = Field(default=DEFAULT_SOLAR_COST_PER_KWH, ge=0.0, description="Solar cost ($/kWh)")
    wind: float = Field(default=DEFAULT_WIND_COST_PER_KWH, ge=0.0, description="Wind cost ($/kWh)")
    battery: float = Field(default=DEFAULT_BATTERY_COST_PER_KWH, ge=0.0, description="Battery wear cost ($/kWh)")
    grid: float = Field(default=DEFAULT_GRID_COST_PER_KWH, ge=0.0, description="Grid import cost ($/kWh)")
    diesel: float = Field(default=DEFAULT_DIESEL_COST_PER_KWH, ge=0.0, description="Diesel generation cost ($/kWh)")


class CarbonConfig(BaseModel):
    """Configurable carbon emission factors for energy sources (kg CO2/kWh)."""
    model_config = ConfigDict(from_attributes=True)

    solar: float = Field(default=DEFAULT_SOLAR_CO2_PER_KWH, ge=0.0, description="Solar emissions (kg CO2/kWh)")
    wind: float = Field(default=DEFAULT_WIND_CO2_PER_KWH, ge=0.0, description="Wind emissions (kg CO2/kWh)")
    battery: float = Field(default=DEFAULT_BATTERY_CO2_PER_KWH, ge=0.0, description="Battery emissions (kg CO2/kWh)")
    grid: float = Field(default=DEFAULT_GRID_CO2_PER_KWH, ge=0.0, description="Grid emissions (kg CO2/kWh)")
    diesel: float = Field(default=DEFAULT_DIESEL_CO2_PER_KWH, ge=0.0, description="Diesel emissions (kg CO2/kWh)")


class OptimizationWeights(BaseModel):
    """Configurable multi-objective weights for Balanced Mode."""
    model_config = ConfigDict(from_attributes=True)

    cost_weight: float = Field(default=DEFAULT_COST_WEIGHT, ge=0.0, description="Cost weight factor")
    carbon_weight: float = Field(default=DEFAULT_CARBON_WEIGHT, ge=0.0, description="Carbon weight factor")


class OptimizationInput(BaseModel):
    """Structured input container for a single-period optimization dispatch step."""
    model_config = ConfigDict(from_attributes=True)

    demand_kwh: float = Field(
        ...,
        ge=0.0,
        description="Electricity demand required to be satisfied (kWh)"
    )
    solar_available_kwh: float = Field(
        default=0.0,
        ge=0.0,
        description="Solar PV energy available for the 1-hour interval (kWh)"
    )
    wind_available_kwh: float = Field(
        default=0.0,
        ge=0.0,
        description="Wind energy available for the 1-hour interval (kWh)"
    )
    battery: BatteryState = Field(
        default_factory=BatteryState,
        description="Current battery asset state"
    )
    grid_available_kwh: float = Field(
        default=100.0,
        ge=0.0,
        description="Utility grid connection capacity for the 1-hour interval (kWh)"
    )
    diesel_available_kwh: float = Field(
        default=75.0,
        ge=0.0,
        description="Backup diesel generator capacity for the 1-hour interval (kWh)"
    )
    mode: OptimizationMode = Field(
        default=OptimizationMode.BALANCED,
        description="Operational optimization mode preset"
    )
    costs: CostConfig = Field(
        default_factory=CostConfig,
        description="Configurable unit cost assumptions"
    )
    carbon: CarbonConfig = Field(
        default_factory=CarbonConfig,
        description="Configurable unit carbon emission assumptions"
    )
    weights: OptimizationWeights = Field(
        default_factory=OptimizationWeights,
        description="Configurable weights for Balanced Mode"
    )


class EnergyAllocation(BaseModel):
    """Optimized energy quantities allocated from each microgrid source (kWh)."""
    solar_used_kwh: float = Field(ge=0.0)
    wind_used_kwh: float = Field(ge=0.0)
    battery_used_kwh: float = Field(ge=0.0)
    grid_used_kwh: float = Field(ge=0.0)
    diesel_used_kwh: float = Field(ge=0.0)


class OptimizationResult(BaseModel):
    """Complete, self-contained optimization result for one dispatch interval."""
    allocations: EnergyAllocation
    demand_kwh: float
    total_supplied_kwh: float
    unmet_demand_kwh: float
    is_demand_fully_met: bool

    # Derived renewable metrics
    unused_solar_kwh: float
    unused_wind_kwh: float
    total_unused_renewable_kwh: float

    # Financial and environmental results
    total_cost_usd: float
    total_carbon_kg: float
    normalized_cost_score: Optional[float] = None
    normalized_carbon_score: Optional[float] = None

    # Solver diagnostic metadata
    solver_status: str
    objective_value: float
    mode_applied: OptimizationMode
    solve_time_ms: float
