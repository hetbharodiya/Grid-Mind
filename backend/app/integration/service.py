"""GridMind Integration and Orchestration Service.

Connects the trained Machine Learning demand forecaster (app.ml) with the
PuLP microgrid dispatch optimizer (app.optimization).
Supports single-hour dispatch and 24-hour sequential horizon simulations.
"""

import time
from typing import Optional, List
import pandas as pd

from app.ml.predictor import DemandPredictor, PredictionError, ModelLoadError
from app.optimization.service import OptimizationService
from app.optimization.models import OptimizationInput
from app.integration.exceptions import (
    IntegrationError,
    InsufficientHistoryError,
    ForecastingPipelineError,
    OptimizationDispatchError,
)
from app.integration.models import (
    ForecastInfo,
    ForecastDispatchInput,
    ForecastDispatchResult,
    Horizon24hDispatchInput,
    HourlyDispatchStep,
    DailyDispatchSummary,
    Horizon24hDispatchResult,
)


class GridMindIntegrationService:
    """Orchestrates end-to-end forecasting, asset coordination, and dispatch optimization."""

    MIN_HISTORY_RECORDS: int = 168

    def __init__(
        self,
        predictor: Optional[DemandPredictor] = None,
        optimizer: Optional[OptimizationService] = None,
    ) -> None:
        """Initialize the integration service with injected or default components.

        Args:
            predictor: Optional pre-initialized DemandPredictor.
            optimizer: Optional pre-initialized OptimizationService.
        """
        try:
            self.predictor = predictor or DemandPredictor()
        except Exception as e:
            raise IntegrationError(f"Failed to initialize ML forecaster: {str(e)}") from e

        self.optimizer = optimizer or OptimizationService()

    def dispatch_next_hour(
        self,
        historical_df: pd.DataFrame,
        dispatch_input: Optional[ForecastDispatchInput] = None,
    ) -> ForecastDispatchResult:
        """Execute a single-step live AI forecast and dispatch optimization.

        Workflow:
        1. Validate historical demand buffer (>= 168 hours).
        2. Query DemandPredictor for the immediate next hour load (horizon=1).
        3. Combine predicted demand with asset availabilities and battery state.
        4. Solve single-period LP dispatch via OptimizationService.
        5. Return structured result cleanly separating forecast from optimization.

        Args:
            historical_df: DataFrame containing at least 168 continuous hourly records.
            dispatch_input: Microgrid asset availability and mode parameters.

        Returns:
            ForecastDispatchResult containing forecast details and optimal dispatch plan.
        """
        start_time = time.perf_counter()
        self._validate_history(historical_df)

        dispatch_cfg = dispatch_input or ForecastDispatchInput()

        # 1. Generate single-step forecast from ML model
        try:
            forecast_steps = self.predictor.forecast_24h(historical_df, horizon_hours=1)
        except PredictionError as pe:
            raise InsufficientHistoryError(str(pe)) from pe
        except Exception as e:
            raise ForecastingPipelineError(f"ML demand forecasting failed: {str(e)}") from e

        if not forecast_steps:
            raise ForecastingPipelineError("ML predictor returned empty forecast array.")

        step_data = forecast_steps[0]
        predicted_kwh = float(step_data["predicted_demand_kwh"])

        # 2. Build OptimizationInput
        opt_input = OptimizationInput(
            demand_kwh=predicted_kwh,
            solar_available_kwh=dispatch_cfg.solar_available_kwh,
            wind_available_kwh=dispatch_cfg.wind_available_kwh,
            battery=dispatch_cfg.battery,
            grid_available_kwh=dispatch_cfg.grid_available_kwh,
            diesel_available_kwh=dispatch_cfg.diesel_available_kwh,
            mode=dispatch_cfg.mode,
            costs=dispatch_cfg.costs,
            carbon=dispatch_cfg.carbon,
            weights=dispatch_cfg.weights,
        )

        # 3. Solve microgrid dispatch
        try:
            opt_result = self.optimizer.optimize_step(opt_input)
        except Exception as e:
            raise OptimizationDispatchError(f"PuLP optimization failed: {str(e)}") from e

        # 4. Derived metrics
        clean_used = (
            opt_result.allocations.solar_used_kwh
            + opt_result.allocations.wind_used_kwh
            + opt_result.allocations.battery_used_kwh
        )
        clean_pct = (
            round((clean_used / opt_result.total_supplied_kwh * 100.0), 2)
            if opt_result.total_supplied_kwh > 0
            else 0.0
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return ForecastDispatchResult(
            forecast=ForecastInfo(
                predicted_demand_kwh=predicted_kwh,
                forecast_timestamp=step_data["timestamp"],
                horizon_step=1,
                hour=step_data["hour"],
                day_of_week=step_data["day_of_week"],
            ),
            optimization=opt_result,
            clean_energy_percentage=clean_pct,
            pipeline_execution_time_ms=elapsed_ms,
        )

    def dispatch_24h_horizon(
        self,
        historical_df: pd.DataFrame,
        horizon_input: Optional[Horizon24hDispatchInput] = None,
    ) -> Horizon24hDispatchResult:
        """Execute a 24-hour forward forecast and sequential dispatch horizon.

        Workflow:
        1. Validate historical demand buffer (>= 168 hours).
        2. Query DemandPredictor ONCE for the complete 24-hour forecast trajectory.
        3. Ingest explicit caller-supplied asset availability parameters.
        4. Sequentially optimize hours 1 to 24, updating the battery SoC after each hour:
           SoC_{t+1} = max(minimum_soc, SoC_t - battery_used / (capacity * efficiency))
        5. Return comprehensive 24-hour hourly schedule and daily summary.

        Args:
            historical_df: DataFrame containing at least 168 continuous hourly records.
            horizon_input: Microgrid 24-hour availability profiles and configuration.

        Returns:
            Horizon24hDispatchResult containing hourly dispatches, battery trajectory, and daily KPIs.
        """
        start_time = time.perf_counter()
        self._validate_history(historical_df)

        cfg = horizon_input or Horizon24hDispatchInput()

        # 1. Query ML Forecaster ONCE for all 24 steps
        try:
            forecast_24h = self.predictor.forecast_24h(historical_df, horizon_hours=24)
        except PredictionError as pe:
            raise InsufficientHistoryError(str(pe)) from pe
        except Exception as e:
            raise ForecastingPipelineError(f"24-hour forecasting failed: {str(e)}") from e

        if len(forecast_24h) != 24:
            raise ForecastingPipelineError(f"Expected 24 forecast steps, received {len(forecast_24h)}")

        # 2. Setup sequential simulation variables
        current_battery = cfg.battery.model_copy()
        starting_soc = float(current_battery.current_soc)

        hourly_steps: List[HourlyDispatchStep] = []
        soc_trajectory: List[float] = []

        total_demand = 0.0
        total_supplied = 0.0
        total_solar = 0.0
        total_wind = 0.0
        total_battery = 0.0
        total_grid = 0.0
        total_diesel = 0.0
        total_unmet = 0.0
        total_cost = 0.0
        total_carbon = 0.0

        # 3. Step sequentially through Hour 1 to Hour 24
        for k in range(1, 25):
            step_forecast = forecast_24h[k - 1]
            pred_kwh = float(step_forecast["predicted_demand_kwh"])
            ts_str = step_forecast["timestamp"]

            # Resolve asset availability for hour k
            solar_avail, wind_avail, grid_avail, diesel_avail = self._resolve_hourly_availability(cfg, k)

            # Build single-step OptimizationInput with current battery state
            opt_input = OptimizationInput(
                demand_kwh=pred_kwh,
                solar_available_kwh=solar_avail,
                wind_available_kwh=wind_avail,
                battery=current_battery,
                grid_available_kwh=grid_avail,
                diesel_available_kwh=diesel_avail,
                mode=cfg.mode,
                costs=cfg.costs,
                carbon=cfg.carbon,
                weights=cfg.weights,
            )

            try:
                opt_res = self.optimizer.optimize_step(opt_input)
            except Exception as e:
                raise OptimizationDispatchError(f"Optimization failed at step {k}: {str(e)}") from e

            # Sequential battery SoC update:
            # battery_used represents delivered energy at inverter output.
            # Chemical energy drawn = battery_used / discharge_efficiency.
            bat_used = opt_res.allocations.battery_used_kwh
            eta_dis = current_battery.discharge_efficiency
            cap_kwh = current_battery.capacity_kwh
            min_soc = current_battery.minimum_soc

            delta_soc = (bat_used / (cap_kwh * eta_dis)) if (cap_kwh * eta_dis > 0) else 0.0
            updated_soc = max(min_soc, min(1.0, current_battery.current_soc - delta_soc))
            updated_soc = round(updated_soc, 4)

            # Record step
            step_record = HourlyDispatchStep(
                hour_number=k,
                timestamp=ts_str,
                predicted_demand_kwh=pred_kwh,
                solar_used_kwh=opt_res.allocations.solar_used_kwh,
                wind_used_kwh=opt_res.allocations.wind_used_kwh,
                battery_used_kwh=bat_used,
                grid_used_kwh=opt_res.allocations.grid_used_kwh,
                diesel_used_kwh=opt_res.allocations.diesel_used_kwh,
                unmet_demand_kwh=opt_res.unmet_demand_kwh,
                battery_soc_after_dispatch=updated_soc,
                hourly_cost_usd=opt_res.total_cost_usd,
                hourly_carbon_kg=opt_res.total_carbon_kg,
                solver_status=opt_res.solver_status,
            )
            hourly_steps.append(step_record)
            soc_trajectory.append(updated_soc)

            # Accumulate daily summary sums
            total_demand += pred_kwh
            total_supplied += opt_res.total_supplied_kwh
            total_solar += opt_res.allocations.solar_used_kwh
            total_wind += opt_res.allocations.wind_used_kwh
            total_battery += bat_used
            total_grid += opt_res.allocations.grid_used_kwh
            total_diesel += opt_res.allocations.diesel_used_kwh
            total_unmet += opt_res.unmet_demand_kwh
            total_cost += opt_res.total_cost_usd
            total_carbon += opt_res.total_carbon_kg

            # Advance battery state for next hour
            current_battery = current_battery.model_copy(update={"current_soc": updated_soc})

        # 4. Finalize daily summary
        clean_supplied = total_solar + total_wind + total_battery
        avg_clean_pct = round((clean_supplied / total_supplied * 100.0), 2) if total_supplied > 0 else 0.0
        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        summary = DailyDispatchSummary(
            total_predicted_demand_kwh=round(total_demand, 2),
            total_supplied_energy_kwh=round(total_supplied, 2),
            total_solar_used_kwh=round(total_solar, 2),
            total_wind_used_kwh=round(total_wind, 2),
            total_battery_used_kwh=round(total_battery, 2),
            total_grid_used_kwh=round(total_grid, 2),
            total_diesel_used_kwh=round(total_diesel, 2),
            total_unmet_demand_kwh=round(total_unmet, 2),
            total_operational_cost_usd=round(total_cost, 2),
            total_carbon_emissions_kg=round(total_carbon, 2),
            starting_battery_soc=starting_soc,
            ending_battery_soc=soc_trajectory[-1],
            average_clean_energy_percentage=avg_clean_pct,
            optimization_mode=cfg.mode,
        )

        return Horizon24hDispatchResult(
            hourly_steps=hourly_steps,
            daily_summary=summary,
            battery_soc_trajectory=soc_trajectory,
            pipeline_execution_time_ms=elapsed_ms,
        )

    def _validate_history(self, historical_df: pd.DataFrame) -> None:
        """Assert historical DataFrame meets strict formatting and length bounds."""
        if historical_df is None:
            raise InsufficientHistoryError("Historical demand data cannot be None.")
        if len(historical_df) < self.MIN_HISTORY_RECORDS:
            raise InsufficientHistoryError(
                f"Historical demand buffer requires at least {self.MIN_HISTORY_RECORDS} records, "
                f"received {len(historical_df)}."
            )
        required_cols = {"timestamp", "energy_demand_kwh"}
        missing = required_cols - set(historical_df.columns)
        if missing:
            raise InsufficientHistoryError(f"Historical DataFrame missing required columns: {missing}")

    def _resolve_hourly_availability(
        self,
        cfg: Horizon24hDispatchInput,
        hour_number: int,
    ) -> tuple[float, float, float, float]:
        """Extract asset capacities for the given hour from input configuration."""
        idx = hour_number - 1

        if cfg.hourly_availability is not None and len(cfg.hourly_availability) == 24:
            item = cfg.hourly_availability[idx]
            return (
                float(item.solar_available_kwh),
                float(item.wind_available_kwh),
                float(item.grid_available_kwh),
                float(item.diesel_available_kwh),
            )

        solar = float(cfg.solar_profile_kwh[idx]) if (cfg.solar_profile_kwh and len(cfg.solar_profile_kwh) == 24) else 0.0
        wind = float(cfg.wind_profile_kwh[idx]) if (cfg.wind_profile_kwh and len(cfg.wind_profile_kwh) == 24) else 0.0
        grid = float(cfg.grid_available_kwh)
        diesel = float(cfg.diesel_available_kwh)

        return solar, wind, grid, diesel
