"""Microgrid Optimization Service Layer.

Provides high-level dispatch orchestration, input validation wrappers,
and convenient multi-mode execution methods.
Decoupled entirely from machine learning forecasters.
"""

from typing import Optional
from app.optimization.config import OptimizationMode
from app.optimization.models import (
    OptimizationInput,
    OptimizationResult,
    BatteryState,
    CostConfig,
    CarbonConfig,
    OptimizationWeights,
)
from app.optimization.optimizer import MicrogridOptimizer


class OptimizationService:
    """High-level service interface for microgrid dispatch optimization."""

    def __init__(self, optimizer: Optional[MicrogridOptimizer] = None) -> None:
        """Initialize optimization service.

        Args:
            optimizer: Optional injected MicrogridOptimizer instance.
        """
        self.optimizer = optimizer or MicrogridOptimizer()

    def optimize_step(self, input_data: OptimizationInput) -> OptimizationResult:
        """Execute single-period microgrid dispatch optimization.

        Args:
            input_data: Validated OptimizationInput specification.

        Returns:
            OptimizationResult containing source allocations and metrics.
        """
        return self.optimizer.solve(input_data)

    def optimize_with_mode(
        self,
        demand_kwh: float,
        solar_available_kwh: float = 0.0,
        wind_available_kwh: float = 0.0,
        battery: Optional[BatteryState] = None,
        grid_available_kwh: float = 100.0,
        diesel_available_kwh: float = 75.0,
        mode: OptimizationMode = OptimizationMode.BALANCED,
        costs: Optional[CostConfig] = None,
        carbon: Optional[CarbonConfig] = None,
        weights: Optional[OptimizationWeights] = None,
    ) -> OptimizationResult:
        """Convenience method to run dispatch with granular parameters.

        Args:
            demand_kwh: Target electrical load in kWh.
            solar_available_kwh: Available solar generation for the hour.
            wind_available_kwh: Available wind generation for the hour.
            battery: Optional custom BatteryState.
            grid_available_kwh: Maximum grid import capacity.
            diesel_available_kwh: Maximum backup diesel generation capacity.
            mode: Operational preset (ECONOMY, GREEN, BALANCED).
            costs: Optional custom CostConfig.
            carbon: Optional custom CarbonConfig.
            weights: Optional custom OptimizationWeights.

        Returns:
            OptimizationResult containing allocations and performance metrics.
        """
        input_data = OptimizationInput(
            demand_kwh=demand_kwh,
            solar_available_kwh=solar_available_kwh,
            wind_available_kwh=wind_available_kwh,
            battery=battery or BatteryState(),
            grid_available_kwh=grid_available_kwh,
            diesel_available_kwh=diesel_available_kwh,
            mode=mode,
            costs=costs or CostConfig(),
            carbon=carbon or CarbonConfig(),
            weights=weights or OptimizationWeights(),
        )
        return self.optimizer.solve(input_data)
