"""Microgrid Optimization Configuration Module.

Maintains centralized operational assumptions, cost parameters,
emission factors, default battery thresholds, and optimization preset weights.

IMPORTANT NOTICE:
All default financial costs ($/kWh) and emission factors (kg CO2/kWh)
are CONFIGURABLE ASSUMPTIONS designed for simulation and evaluation.
They can be overridden dynamically per optimization request.
"""

from enum import Enum


class OptimizationMode(str, Enum):
    """Operational optimization preset modes."""
    ECONOMY = "economy"      # Prioritizes lowest operational monetary cost ($)
    GREEN = "green"          # Prioritizes lowest carbon emissions (kg CO2)
    BALANCED = "balanced"    # Normalizes cost and carbon into dimensionless trade-off score


# ==============================================================================
# CONFIGURABLE ASSUMPTIONS: Default Energy Source Costs ($/kWh)
# ==============================================================================
DEFAULT_SOLAR_COST_PER_KWH: float = 0.00       # Zero marginal fuel cost
DEFAULT_WIND_COST_PER_KWH: float = 0.00        # Zero marginal fuel cost
DEFAULT_BATTERY_COST_PER_KWH: float = 0.025    # Cell throughput degradation wear cost
DEFAULT_GRID_COST_PER_KWH: float = 0.15        # Standard off-peak / utility tariff
DEFAULT_DIESEL_COST_PER_KWH: float = 0.45      # Fuel consumption ($1.65/L, ~0.27 L/kWh)

# ==============================================================================
# CONFIGURABLE ASSUMPTIONS: Default Emission Factors (kg CO2 / kWh)
# ==============================================================================
DEFAULT_SOLAR_CO2_PER_KWH: float = 0.00        # Direct operational lifecycle emissions
DEFAULT_WIND_CO2_PER_KWH: float = 0.00         # Direct operational lifecycle emissions
DEFAULT_BATTERY_CO2_PER_KWH: float = 0.00      # Zero direct point-of-discharge emissions
DEFAULT_GRID_CO2_PER_KWH: float = 0.45         # Regional fossil-heavy utility grid mix
DEFAULT_DIESEL_CO2_PER_KWH: float = 0.72       # Combustion emissions (2.68 kg CO2/L diesel)

# ==============================================================================
# CONFIGURABLE ASSUMPTIONS: Battery Storage Baseline Parameters
# ==============================================================================
DEFAULT_BATTERY_CAPACITY_KWH: float = 200.0    # Nameplate capacity in kWh
DEFAULT_BATTERY_CURRENT_SOC: float = 0.50      # 50% State of Charge starting point
DEFAULT_BATTERY_MIN_SOC: float = 0.20          # 20% minimum safety reserve floor
DEFAULT_BATTERY_MAX_SOC: float = 0.95          # 95% maximum charge ceiling
DEFAULT_BATTERY_DISCHARGE_EFFICIENCY: float = 0.95  # Inverter + chemical one-way discharge efficiency
DEFAULT_BATTERY_MAX_DISCHARGE_KW: float = 60.0 # Maximum inverter power limit in kW

# ==============================================================================
# Optimization Constants & Numerical Guards
# ==============================================================================
EPSILON: float = 1e-6                          # Numerical tolerance for zero checks and denominators
UNMET_PENALTY_MULTIPLIER: float = 1000.0       # Penalty multiplier over active max coefficient
FALLBACK_UNMET_PENALTY: float = 1000.0         # Fallback penalty when all active coefficients are ~0

# Default weights for Balanced Mode
DEFAULT_COST_WEIGHT: float = 0.5
DEFAULT_CARBON_WEIGHT: float = 0.5
