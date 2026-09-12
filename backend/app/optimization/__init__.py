"""Microgrid Energy Optimization Engine Package.

Provides mathematical linear programming (LP) dispatch models using PuLP
and the COIN-OR CBC solver.
"""

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
)
from app.optimization.models import (
    BatteryState,
    CostConfig,
    CarbonConfig,
    OptimizationWeights,
    OptimizationInput,
    EnergyAllocation,
    OptimizationResult,
)
from app.optimization.optimizer import MicrogridOptimizer
from app.optimization.service import OptimizationService

__all__ = [
    "OptimizationMode",
    "BatteryState",
    "CostConfig",
    "CarbonConfig",
    "OptimizationWeights",
    "OptimizationInput",
    "EnergyAllocation",
    "OptimizationResult",
    "MicrogridOptimizer",
    "OptimizationService",
    "DEFAULT_SOLAR_COST_PER_KWH",
    "DEFAULT_WIND_COST_PER_KWH",
    "DEFAULT_BATTERY_COST_PER_KWH",
    "DEFAULT_GRID_COST_PER_KWH",
    "DEFAULT_DIESEL_COST_PER_KWH",
    "DEFAULT_SOLAR_CO2_PER_KWH",
    "DEFAULT_WIND_CO2_PER_KWH",
    "DEFAULT_BATTERY_CO2_PER_KWH",
    "DEFAULT_GRID_CO2_PER_KWH",
    "DEFAULT_DIESEL_CO2_PER_KWH",
]
