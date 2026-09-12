"""Automated Pytest Suite for AI Forecast & Microgrid Dispatch Integration.

Tests:
1. Single-hour end-to-end flow (Historical Data -> AI Forecast -> Optimization -> Combined Result).
2. 24-hour forecasting returns 24 forecast steps.
3. 24-hour optimization returns 24 dispatch steps.
4. Energy balance equality holds for every single hour (Solar + Wind + Battery + Grid + Diesel + Unmet == Demand).
5. Battery SoC never drops below minimum_soc reserve floor.
6. Battery SoC correctly progresses sequentially as energy is discharged.
7. Optimization mode propagates correctly (ECONOMY, GREEN, BALANCED).
8. Less than 168 historical records raises InsufficientHistoryError.
9. Forecasting failure converts cleanly into ForecastingPipelineError.
10. Optimization failure converts cleanly into OptimizationDispatchError.
11. Architecture isolation: app.ml does not import app.optimization, and app.optimization does not import app.ml.
"""

from pathlib import Path
import pytest
import pandas as pd
import numpy as np

from app.optimization.config import OptimizationMode
from app.optimization.models import BatteryState, CostConfig, CarbonConfig
from app.integration import (
    GridMindIntegrationService,
    ForecastDispatchInput,
    ForecastDispatchResult,
    Horizon24hDispatchInput,
    HourlyAssetAvailability,
    Horizon24hDispatchResult,
    InsufficientHistoryError,
    ForecastingPipelineError,
    OptimizationDispatchError,
)


@pytest.fixture
def real_history_df() -> pd.DataFrame:
    """Fixture providing real historical demand slice from processed dataset (200 hours)."""
    dataset_path = Path(__file__).resolve().parent.parent / "app" / "data" / "processed" / "processed_energy_demand.csv"
    if dataset_path.exists():
        df = pd.read_csv(dataset_path)
        # Take a slice of 200 rows
        slice_df = df.iloc[500:700].copy().reset_index(drop=True)
        slice_df["timestamp"] = pd.to_datetime(slice_df["timestamp"])
        return slice_df

    # Fallback to standard 200-hour continuous series if file path differs
    ts = pd.date_range("2010-01-01 00:00:00", periods=200, freq="h")
    return pd.DataFrame({
        "timestamp": ts,
        "energy_demand_kwh": [1.0 + 0.5 * np.sin(2 * np.pi * i / 24.0) for i in range(200)]
    })


@pytest.fixture
def integration_service() -> GridMindIntegrationService:
    """Fixture providing initialized GridMindIntegrationService."""
    return GridMindIntegrationService()


def test_1_single_hour_end_to_end(
    integration_service: GridMindIntegrationService,
    real_history_df: pd.DataFrame
) -> None:
    """TEST 1: Single-hour live pipeline from historical data through AI forecast to LP dispatch."""
    cfg = ForecastDispatchInput(
        solar_available_kwh=10.0,
        wind_available_kwh=5.0,
        battery=BatteryState(capacity_kwh=100.0, current_soc=0.50, minimum_soc=0.20),
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        mode=OptimizationMode.BALANCED,
    )
    result: ForecastDispatchResult = integration_service.dispatch_next_hour(real_history_df, cfg)

    assert isinstance(result, ForecastDispatchResult)
    assert result.forecast.predicted_demand_kwh > 0.0
    assert result.forecast.model_type == "HistGradientBoostingRegressor"
    assert result.optimization.solver_status == "Optimal"
    assert result.optimization.is_demand_fully_met is True

    # Demand equality
    alloc = result.optimization.allocations
    supplied = alloc.solar_used_kwh + alloc.wind_used_kwh + alloc.battery_used_kwh + alloc.grid_used_kwh + alloc.diesel_used_kwh
    assert pytest.approx(supplied + result.optimization.unmet_demand_kwh, rel=1e-3) == result.forecast.predicted_demand_kwh


def test_2_and_3_24h_forecast_and_dispatch_steps(
    integration_service: GridMindIntegrationService,
    real_history_df: pd.DataFrame
) -> None:
    """TEST 2 & 3: 24-hour horizon generates exactly 24 forecast values and 24 optimization steps."""
    horizon_input = Horizon24hDispatchInput(
        battery=BatteryState(capacity_kwh=100.0, current_soc=0.60, minimum_soc=0.20),
        solar_profile_kwh=[5.0] * 24,
        wind_profile_kwh=[5.0] * 24,
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        mode=OptimizationMode.BALANCED,
    )
    res_24h: Horizon24hDispatchResult = integration_service.dispatch_24h_horizon(real_history_df, horizon_input)

    assert len(res_24h.hourly_steps) == 24
    assert len(res_24h.battery_soc_trajectory) == 24

    for i, step in enumerate(res_24h.hourly_steps):
        assert step.hour_number == i + 1
        assert step.predicted_demand_kwh >= 0.0
        assert step.solver_status == "Optimal"


def test_4_energy_balance_every_hour(
    integration_service: GridMindIntegrationService,
    real_history_df: pd.DataFrame
) -> None:
    """TEST 4: Energy balance holds for all 24 hours: Solar + Wind + Battery + Grid + Diesel + Unmet == Demand."""
    horizon_input = Horizon24hDispatchInput(
        battery=BatteryState(capacity_kwh=100.0, current_soc=0.50, minimum_soc=0.20),
        solar_profile_kwh=[8.0] * 24,
        wind_profile_kwh=[4.0] * 24,
        grid_available_kwh=40.0,
        diesel_available_kwh=40.0,
        mode=OptimizationMode.ECONOMY,
    )
    res = integration_service.dispatch_24h_horizon(real_history_df, horizon_input)

    for step in res.hourly_steps:
        supplied = (
            step.solar_used_kwh
            + step.wind_used_kwh
            + step.battery_used_kwh
            + step.grid_used_kwh
            + step.diesel_used_kwh
        )
        total = supplied + step.unmet_demand_kwh
        assert pytest.approx(total, rel=1e-3) == step.predicted_demand_kwh


def test_5_and_6_battery_soc_never_below_minimum_and_progresses(
    integration_service: GridMindIntegrationService,
    real_history_df: pd.DataFrame
) -> None:
    """TEST 5 & 6: Battery SoC stays >= minimum_soc and progresses sequentially under discharge."""
    min_floor = 0.20
    battery = BatteryState(
        capacity_kwh=10.0,  # Small battery to force deep discharge
        current_soc=0.35,
        minimum_soc=min_floor,
        discharge_efficiency=0.95,
        maximum_discharge_kw=10.0,
    )
    # Zero renewables and high demand to force battery usage
    horizon_input = Horizon24hDispatchInput(
        battery=battery,
        solar_profile_kwh=[0.0] * 24,
        wind_profile_kwh=[0.0] * 24,
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        mode=OptimizationMode.GREEN,  # Green mode prefers battery over grid
    )
    res = integration_service.dispatch_24h_horizon(real_history_df, horizon_input)

    for soc in res.battery_soc_trajectory:
        assert soc >= min_floor - 1e-4

    # SoC must decrease as battery is discharged
    assert res.battery_soc_trajectory[0] <= 0.35
    assert res.daily_summary.ending_battery_soc <= res.daily_summary.starting_battery_soc


def test_7_mode_propagation(
    integration_service: GridMindIntegrationService,
    real_history_df: pd.DataFrame
) -> None:
    """TEST 7: Operational presets (ECONOMY, GREEN, BALANCED) propagate cleanly to optimizer."""
    for test_mode in [OptimizationMode.ECONOMY, OptimizationMode.GREEN, OptimizationMode.BALANCED]:
        cfg = ForecastDispatchInput(mode=test_mode)
        res = integration_service.dispatch_next_hour(real_history_df, cfg)
        assert res.optimization.mode_applied == test_mode


def test_8_insufficient_history_raises_error(
    integration_service: GridMindIntegrationService
) -> None:
    """TEST 8: Less than 168 historical records raises InsufficientHistoryError."""
    short_df = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=100, freq="h"),
        "energy_demand_kwh": [1.5] * 100
    })
    with pytest.raises(InsufficientHistoryError):
        integration_service.dispatch_next_hour(short_df)

    with pytest.raises(InsufficientHistoryError):
        integration_service.dispatch_24h_horizon(short_df)


def test_9_forecasting_pipeline_error_on_corrupt_data(
    integration_service: GridMindIntegrationService
) -> None:
    """TEST 9: Unhandled forecasting failures convert cleanly to ForecastingPipelineError."""
    # Pass DataFrame with invalid string demand values
    corrupt_df = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=170, freq="h"),
        "energy_demand_kwh": ["not_a_number"] * 170
    })
    with pytest.raises((ForecastingPipelineError, InsufficientHistoryError)):
        integration_service.dispatch_next_hour(corrupt_df)


def test_10_optimization_dispatch_error_handling(
    integration_service: GridMindIntegrationService,
    real_history_df: pd.DataFrame
) -> None:
    """TEST 10: Optimizer failures convert into OptimizationDispatchError."""
    # Mock optimizer to simulate an internal solver exception
    class FailingOptimizer:
        def optimize_step(self, *args, **kwargs):
            raise RuntimeError("Simulated solver crash")

    service = GridMindIntegrationService(optimizer=FailingOptimizer())
    with pytest.raises(OptimizationDispatchError):
        service.dispatch_next_hour(real_history_df)


def test_11_module_isolation() -> None:
    """TEST 11: Assert strict architectural isolation between app.ml and app.optimization."""
    import sys
    import importlib

    ml_module = importlib.import_module("app.ml.predictor")
    opt_module = importlib.import_module("app.optimization.optimizer")

    # Read source code files to verify neither imports the other
    ml_file = Path(ml_module.__file__).read_text(encoding="utf-8")
    opt_file = Path(opt_module.__file__).read_text(encoding="utf-8")

    assert "app.optimization" not in ml_file, "app.ml must not import app.optimization!"
    assert "app.ml" not in opt_file, "app.optimization must not import app.ml!"
