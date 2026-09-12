"""Microgrid Conceptual Configuration Schemas.

Defines asset specifications, operational boundaries, and economic
constants for the energy optimization engine.
"""

from pydantic import BaseModel, Field, ConfigDict


class BatteryConfig(BaseModel):
    """Electrochemical Battery Energy Storage System (BESS) specifications."""
    model_config = ConfigDict(from_attributes=True)

    battery_capacity_kwh: float = Field(default=200.0, gt=0.0, description="Nameplate storage capacity in kWh")
    initial_battery_soc: float = Field(default=0.50, ge=0.0, le=1.0, description="Starting State of Charge fraction (0.0 - 1.0)")
    minimum_battery_soc: float = Field(default=0.20, ge=0.0, le=1.0, description="Safe minimum allowable State of Charge")
    maximum_battery_soc: float = Field(default=0.95, ge=0.0, le=1.0, description="Safe maximum allowable State of Charge")
    maximum_charge_rate_kw: float = Field(default=60.0, gt=0.0, description="Max charging inverter limit in kW")
    maximum_discharge_rate_kw: float = Field(default=60.0, gt=0.0, description="Max discharging inverter limit in kW")
    round_trip_efficiency: float = Field(default=0.90, gt=0.0, le=1.0, description="Charge/discharge round-trip efficiency")


class DieselGeneratorConfig(BaseModel):
    """Fossil-fuel backup diesel generator parameters."""
    model_config = ConfigDict(from_attributes=True)

    diesel_max_generation_kw: float = Field(default=75.0, gt=0.0, description="Nameplate maximum generator capacity in kW")
    diesel_min_load_ratio: float = Field(default=0.30, ge=0.0, le=1.0, description="Minimum engine loading to avoid wet-stacking")
    diesel_cost_per_kwh: float = Field(default=0.45, ge=0.0, description="Marginal generation fuel cost per kWh")
    diesel_cost_per_liter: float = Field(default=1.65, ge=0.0, description="Diesel price per liter")
    diesel_co2_per_kwh: float = Field(default=0.72, ge=0.0, description="Emissions factor in kg CO2 per generated kWh")


class EnergyCostsConfig(BaseModel):
    """Operational and levelized costs for each microgrid power stream."""
    model_config = ConfigDict(from_attributes=True)

    solar_cost_per_kwh: float = Field(default=0.00, ge=0.0, description="Marginal cost of solar power ($/kWh)")
    wind_cost_per_kwh: float = Field(default=0.00, ge=0.0, description="Marginal cost of wind power ($/kWh)")
    battery_cost_per_kwh: float = Field(default=0.025, ge=0.0, description="Battery throughput degradation cost ($/kWh)")


class MicrogridConfiguration(BaseModel):
    """Comprehensive microgrid configuration container."""
    name: str = Field(default="Community Microgrid", description="Human-readable microgrid asset name")
    battery: BatteryConfig = Field(default_factory=BatteryConfig)
    diesel: DieselGeneratorConfig = Field(default_factory=DieselGeneratorConfig)
    costs: EnergyCostsConfig = Field(default_factory=EnergyCostsConfig)
    solar_capacity_kw: float = Field(default=120.0, gt=0.0, description="Installed solar PV capacity")
    wind_capacity_kw: float = Field(default=60.0, gt=0.0, description="Installed wind turbine capacity")
