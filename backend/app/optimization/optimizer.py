"""Microgrid Mathematical Dispatch Optimizer using PuLP.

Formulates and solves a single-period Linear Programming (LP) problem
to determine the optimal, cost-minimal, and emission-minimal hourly allocation
of Solar, Wind, Battery Storage, Grid Import, and Diesel Generation.
"""

import time
from typing import Dict, Tuple
import pulp

from app.optimization.config import (
    OptimizationMode,
    EPSILON,
    UNMET_PENALTY_MULTIPLIER,
    FALLBACK_UNMET_PENALTY,
)
from app.optimization.models import (
    OptimizationInput,
    OptimizationResult,
    EnergyAllocation,
)


class MicrogridOptimizer:
    """Core mathematical optimization engine for microgrid energy dispatch."""

    def __init__(self) -> None:
        """Initialize optimizer."""
        pass

    def solve(self, input_data: OptimizationInput) -> OptimizationResult:
        """Formulate and solve the single-period LP dispatch problem.

        Args:
            input_data: Validated OptimizationInput specification.

        Returns:
            OptimizationResult containing exact allocations, system balances,
            financial costs, carbon emissions, and solver diagnostics.
        """
        # ======================================================================
        # 1. Zero Demand Handling (Trivial Exact Result)
        # ======================================================================
        if input_data.demand_kwh <= EPSILON:
            unused_solar = float(input_data.solar_available_kwh)
            unused_wind = float(input_data.wind_available_kwh)
            return OptimizationResult(
                allocations=EnergyAllocation(
                    solar_used_kwh=0.0,
                    wind_used_kwh=0.0,
                    battery_used_kwh=0.0,
                    grid_used_kwh=0.0,
                    diesel_used_kwh=0.0,
                ),
                demand_kwh=float(input_data.demand_kwh),
                total_supplied_kwh=0.0,
                unmet_demand_kwh=0.0,
                is_demand_fully_met=True,
                unused_solar_kwh=unused_solar,
                unused_wind_kwh=unused_wind,
                total_unused_renewable_kwh=unused_solar + unused_wind,
                total_cost_usd=0.0,
                total_carbon_kg=0.0,
                normalized_cost_score=0.0,
                normalized_carbon_score=0.0,
                solver_status="Optimal",
                objective_value=0.0,
                mode_applied=input_data.mode,
                solve_time_ms=0.1,
            )

        start_time = time.perf_counter()

        # ======================================================================
        # 2. Source Availability & Battery Bounds (1-hour time horizon)
        # ======================================================================
        battery_deliverable_kwh = input_data.battery.get_deliverable_energy_kwh(time_horizon_hours=1.0)

        # ======================================================================
        # 3. Create PuLP LP Model
        # ======================================================================
        prob = pulp.LpProblem("Microgrid_Dispatch_Optimization", pulp.LpMinimize)

        # Decision Variables (continuous, non-negative, bounded by source capacity)
        x_solar = pulp.LpVariable(
            "solar_used",
            lowBound=0.0,
            upBound=input_data.solar_available_kwh,
            cat=pulp.LpContinuous
        )
        x_wind = pulp.LpVariable(
            "wind_used",
            lowBound=0.0,
            upBound=input_data.wind_available_kwh,
            cat=pulp.LpContinuous
        )
        x_battery = pulp.LpVariable(
            "battery_used",
            lowBound=0.0,
            upBound=battery_deliverable_kwh,
            cat=pulp.LpContinuous
        )
        x_grid = pulp.LpVariable(
            "grid_used",
            lowBound=0.0,
            upBound=input_data.grid_available_kwh,
            cat=pulp.LpContinuous
        )
        x_diesel = pulp.LpVariable(
            "diesel_used",
            lowBound=0.0,
            upBound=input_data.diesel_available_kwh,
            cat=pulp.LpContinuous
        )
        x_unmet = pulp.LpVariable(
            "unmet_demand",
            lowBound=0.0,
            cat=pulp.LpContinuous
        )

        # ======================================================================
        # 4. Energy Balance Constraint
        # ======================================================================
        prob += (
            x_solar + x_wind + x_battery + x_grid + x_diesel + x_unmet == input_data.demand_kwh,
            "Energy_Balance_Constraint"
        )

        # ======================================================================
        # 5. Determine Objective Coefficients & Mode-Consistent Unmet Penalty
        # ======================================================================
        coefficients, p_unmet, c_ref, e_ref = self._compute_objective_coefficients(input_data)

        # Set linear objective function
        prob += (
            coefficients["solar"] * x_solar
            + coefficients["wind"] * x_wind
            + coefficients["battery"] * x_battery
            + coefficients["grid"] * x_grid
            + coefficients["diesel"] * x_diesel
            + p_unmet * x_unmet,
            "Total_Objective_Function"
        )

        # ======================================================================
        # 6. Execute Solver (Bundled COIN-OR CBC Solver)
        # ======================================================================
        solver = pulp.PULP_CBC_CMD(msg=False)
        prob.solve(solver)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # ======================================================================
        # 7. Extract Decision Variable Allocations
        # ======================================================================
        solar_val = max(0.0, float(pulp.value(x_solar) or 0.0))
        wind_val = max(0.0, float(pulp.value(x_wind) or 0.0))
        battery_val = max(0.0, float(pulp.value(x_battery) or 0.0))
        grid_val = max(0.0, float(pulp.value(x_grid) or 0.0))
        diesel_val = max(0.0, float(pulp.value(x_diesel) or 0.0))
        unmet_val = max(0.0, float(pulp.value(x_unmet) or 0.0))

        # ======================================================================
        # 8. Compute Derived Metrics
        # ======================================================================
        total_supplied = solar_val + wind_val + battery_val + grid_val + diesel_val
        is_fully_met = unmet_val < EPSILON

        # Derived unused renewable energy
        unused_solar = max(0.0, input_data.solar_available_kwh - solar_val)
        unused_wind = max(0.0, input_data.wind_available_kwh - wind_val)
        total_unused_renewable = unused_solar + unused_wind

        # Financial results
        total_cost = (
            solar_val * input_data.costs.solar
            + wind_val * input_data.costs.wind
            + battery_val * input_data.costs.battery
            + grid_val * input_data.costs.grid
            + diesel_val * input_data.costs.diesel
        )

        # Environmental results
        total_carbon = (
            solar_val * input_data.carbon.solar
            + wind_val * input_data.carbon.wind
            + battery_val * input_data.carbon.battery
            + grid_val * input_data.carbon.grid
            + diesel_val * input_data.carbon.diesel
        )

        # Normalized scores for Balanced Mode reporting
        norm_cost_score = (total_cost / c_ref) if c_ref > EPSILON else 0.0
        norm_carbon_score = (total_carbon / e_ref) if e_ref > EPSILON else 0.0

        solver_status = pulp.LpStatus.get(prob.status, "Unknown")
        obj_value = float(pulp.value(prob.objective) or 0.0)

        return OptimizationResult(
            allocations=EnergyAllocation(
                solar_used_kwh=round(solar_val, 4),
                wind_used_kwh=round(wind_val, 4),
                battery_used_kwh=round(battery_val, 4),
                grid_used_kwh=round(grid_val, 4),
                diesel_used_kwh=round(diesel_val, 4),
            ),
            demand_kwh=float(input_data.demand_kwh),
            total_supplied_kwh=round(total_supplied, 4),
            unmet_demand_kwh=round(unmet_val, 4),
            is_demand_fully_met=is_fully_met,
            unused_solar_kwh=round(unused_solar, 4),
            unused_wind_kwh=round(unused_wind, 4),
            total_unused_renewable_kwh=round(total_unused_renewable, 4),
            total_cost_usd=round(total_cost, 4),
            total_carbon_kg=round(total_carbon, 4),
            normalized_cost_score=round(norm_cost_score, 4),
            normalized_carbon_score=round(norm_carbon_score, 4),
            solver_status=solver_status,
            objective_value=round(obj_value, 4),
            mode_applied=input_data.mode,
            solve_time_ms=round(elapsed_ms, 2),
        )

    def _compute_objective_coefficients(
        self,
        input_data: OptimizationInput
    ) -> Tuple[Dict[str, float], float, float, float]:
        """Compute linear objective coefficients and mode-consistent penalty.

        Returns:
            Tuple of (coefficients_dict, p_unmet, c_ref, e_ref)
        """
        c = input_data.costs
        e = input_data.carbon
        d = input_data.demand_kwh

        # Maximum cost and emission among active physical assets
        c_max = max(c.solar, c.wind, c.battery, c.grid, c.diesel)
        e_max = max(e.solar, e.wind, e.battery, e.grid, e.diesel)

        # Reference baselines for normalization (worst-case single-source supply)
        c_ref = c_max * d
        e_ref = e_max * d

        coefficients: Dict[str, float] = {}

        if input_data.mode == OptimizationMode.ECONOMY:
            # Minimize total monetary cost ($)
            coefficients = {
                "solar": c.solar,
                "wind": c.wind,
                "battery": c.battery,
                "grid": c.grid,
                "diesel": c.diesel,
            }

        elif input_data.mode == OptimizationMode.GREEN:
            # Minimize total operational carbon emissions (kg CO2)
            coefficients = {
                "solar": e.solar,
                "wind": e.wind,
                "battery": e.battery,
                "grid": e.grid,
                "diesel": e.diesel,
            }

        elif input_data.mode == OptimizationMode.BALANCED:
            # Normalized dimensionless combination of cost and carbon scores
            w_cost = input_data.weights.cost_weight
            w_carbon = input_data.weights.carbon_weight

            # Safe denominator guards: if c_max or e_max is ~0, omit that term cleanly
            denom_c = max(c_ref, EPSILON) if c_max > EPSILON else 1.0
            denom_e = max(e_ref, EPSILON) if e_max > EPSILON else 1.0

            sources = ["solar", "wind", "battery", "grid", "diesel"]
            for s in sources:
                cost_val = getattr(c, s)
                carb_val = getattr(e, s)

                cost_term = (w_cost * cost_val / denom_c) if c_max > EPSILON else 0.0
                carb_term = (w_carbon * carb_val / denom_e) if e_max > EPSILON else 0.0
                coefficients[s] = cost_term + carb_term

        # Determine mode-consistent unmet demand penalty
        k_max_mode = max(coefficients.values()) if coefficients else 0.0

        if k_max_mode > EPSILON:
            p_unmet = UNMET_PENALTY_MULTIPLIER * k_max_mode
        else:
            p_unmet = FALLBACK_UNMET_PENALTY

        return coefficients, p_unmet, c_ref, e_ref
