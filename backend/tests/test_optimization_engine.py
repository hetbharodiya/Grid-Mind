"""Automated Pytest Suite for Microgrid Energy Optimization Engine.

Tests:
1. Renewable allocation under surplus.
2. Supplementary source cascade under renewable deficit.
3. Battery SoC reserve floor and inverter discharge rate adherence.
4. Unmet demand slack variable activation when capacity < demand.
5. Economy mode cost prioritization.
6. Green mode carbon prioritization.
7. Balanced mode normalized dimensionless scoring.
8. Edge case handling (zero demand, zero costs, zero emissions).
9. Mode-consistent unmet demand penalty verification.
10. Input validation guards (negative demand, negative availability, invalid SoC).
"""

import pytest
from pydantic import ValidationError

from app.optimization import (
    OptimizationService,
    MicrogridOptimizer,
    OptimizationInput,
    OptimizationMode,
    BatteryState,
    CostConfig,
    CarbonConfig,
    OptimizationWeights,
)


@pytest.fixture
def service() -> OptimizationService:
    """Fixture providing initialized OptimizationService."""
    return OptimizationService()


def test_1_renewable_allocation_surplus(service: OptimizationService) -> None:
    """TEST 1: When renewables exceed demand, 100% clean power is allocated."""
    input_data = OptimizationInput(
        demand_kwh=30.0,
        solar_available_kwh=40.0,
        wind_available_kwh=20.0,
        battery=BatteryState(current_soc=0.50),
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        mode=OptimizationMode.BALANCED,
    )
    res = service.optimize_step(input_data)

    assert res.solver_status == "Optimal"
    assert res.is_demand_fully_met is True
    assert res.unmet_demand_kwh == 0.0
    assert pytest.approx(res.total_supplied_kwh, rel=1e-3) == 30.0

    # Clean energy must supply 100% of demand
    renewable_used = res.allocations.solar_used_kwh + res.allocations.wind_used_kwh
    assert pytest.approx(renewable_used, rel=1e-3) == 30.0
    assert res.allocations.grid_used_kwh == 0.0
    assert res.allocations.diesel_used_kwh == 0.0

    # Unused clean energy tracked
    assert pytest.approx(res.unused_solar_kwh + res.unused_wind_kwh, rel=1e-3) == 30.0
    assert res.total_cost_usd == 0.0
    assert res.total_carbon_kg == 0.0


def test_2_supplementary_sources_cascade(service: OptimizationService) -> None:
    """TEST 2: Additional sources are dispatched when renewables are insufficient."""
    input_data = OptimizationInput(
        demand_kwh=50.0,
        solar_available_kwh=10.0,
        wind_available_kwh=5.0,
        battery=BatteryState(capacity_kwh=100.0, current_soc=0.50, minimum_soc=0.20, maximum_discharge_kw=20.0),
        grid_available_kwh=40.0,
        diesel_available_kwh=40.0,
        mode=OptimizationMode.ECONOMY,
    )
    res = service.optimize_step(input_data)

    assert res.solver_status == "Optimal"
    assert res.is_demand_fully_met is True
    assert pytest.approx(res.total_supplied_kwh, rel=1e-3) == 50.0

    # Solar (10) and Wind (5) must be exhausted
    assert pytest.approx(res.allocations.solar_used_kwh, rel=1e-3) == 10.0
    assert pytest.approx(res.allocations.wind_used_kwh, rel=1e-3) == 5.0

    # Remaining 35 kWh supplied from supplementary sources
    supp_used = res.allocations.battery_used_kwh + res.allocations.grid_used_kwh + res.allocations.diesel_used_kwh
    assert pytest.approx(supp_used, rel=1e-3) == 35.0


def test_3_battery_limits_and_soc_reserve(service: OptimizationService) -> None:
    """TEST 3: Battery usage respects SoC reserve floor and inverter discharge rate limit."""
    # Battery: 100 kWh, current SoC 30%, min SoC 20% -> usable stored = (0.30 - 0.20) * 100 = 10 kWh
    # At 95% efficiency -> 9.5 kWh deliverable.
    # Inverter max discharge kw = 5.0 kW -> max 5.0 kWh in 1 hour.
    battery = BatteryState(
        capacity_kwh=100.0,
        current_soc=0.30,
        minimum_soc=0.20,
        discharge_efficiency=0.95,
        maximum_discharge_kw=5.0,
    )
    assert pytest.approx(battery.get_deliverable_energy_kwh(1.0), rel=1e-3) == 5.0

    input_data = OptimizationInput(
        demand_kwh=40.0,
        solar_available_kwh=0.0,
        wind_available_kwh=0.0,
        battery=battery,
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        mode=OptimizationMode.ECONOMY,
    )
    res = service.optimize_step(input_data)

    assert res.solver_status == "Optimal"
    assert res.allocations.battery_used_kwh <= 5.0001
    assert pytest.approx(res.allocations.battery_used_kwh, rel=1e-3) == 5.0


def test_4_unmet_demand_deficit(service: OptimizationService) -> None:
    """TEST 4: Unmet demand activates properly when total capacity is less than demand."""
    input_data = OptimizationInput(
        demand_kwh=100.0,
        solar_available_kwh=10.0,
        wind_available_kwh=10.0,
        battery=BatteryState(capacity_kwh=50.0, current_soc=0.20),  # 0 usable storage
        grid_available_kwh=20.0,
        diesel_available_kwh=20.0,
        mode=OptimizationMode.BALANCED,
    )
    # Total available: 10 + 10 + 0 + 20 + 20 = 60 kWh. Demand is 100 kWh. Shortfall = 40 kWh.
    res = service.optimize_step(input_data)

    assert res.solver_status == "Optimal"
    assert res.is_demand_fully_met is False
    assert pytest.approx(res.total_supplied_kwh, rel=1e-3) == 60.0
    assert pytest.approx(res.unmet_demand_kwh, rel=1e-3) == 40.0


def test_5_economy_mode_cost_prioritization(service: OptimizationService) -> None:
    """TEST 5: Economy mode dispatches cheaper source before expensive source."""
    # No renewables, demand 20 kWh. Grid costs $0.15/kWh, Diesel costs $0.45/kWh.
    input_data = OptimizationInput(
        demand_kwh=20.0,
        solar_available_kwh=0.0,
        wind_available_kwh=0.0,
        battery=BatteryState(current_soc=0.20),  # 0 usable battery
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        costs=CostConfig(grid=0.15, diesel=0.45),
        mode=OptimizationMode.ECONOMY,
    )
    res = service.optimize_step(input_data)

    assert res.solver_status == "Optimal"
    assert pytest.approx(res.allocations.grid_used_kwh, rel=1e-3) == 20.0
    assert res.allocations.diesel_used_kwh == 0.0
    assert pytest.approx(res.total_cost_usd, rel=1e-3) == 20.0 * 0.15


def test_6_green_mode_carbon_prioritization(service: OptimizationService) -> None:
    """TEST 6: Green mode dispatches cleaner source before polluting source."""
    # Demand 20 kWh. Battery has 0 direct emissions (0.00 kg/kWh), Grid has 0.45 kg/kWh.
    battery = BatteryState(
        capacity_kwh=100.0,
        current_soc=0.50,
        minimum_soc=0.20,
        maximum_discharge_kw=25.0
    )
    input_data = OptimizationInput(
        demand_kwh=20.0,
        solar_available_kwh=0.0,
        wind_available_kwh=0.0,
        battery=battery,
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        carbon=CarbonConfig(battery=0.00, grid=0.45, diesel=0.72),
        mode=OptimizationMode.GREEN,
    )
    res = service.optimize_step(input_data)

    assert res.solver_status == "Optimal"
    assert pytest.approx(res.allocations.battery_used_kwh, rel=1e-3) == 20.0
    assert res.allocations.grid_used_kwh == 0.0
    assert res.allocations.diesel_used_kwh == 0.0
    assert res.total_carbon_kg == 0.0


def test_7_balanced_mode_normalization(service: OptimizationService) -> None:
    """TEST 7: Balanced mode works with normalized dimensionless objectives."""
    input_data = OptimizationInput(
        demand_kwh=50.0,
        solar_available_kwh=10.0,
        wind_available_kwh=10.0,
        battery=BatteryState(capacity_kwh=100.0, current_soc=0.40, minimum_soc=0.20, maximum_discharge_kw=15.0),
        grid_available_kwh=40.0,
        diesel_available_kwh=40.0,
        mode=OptimizationMode.BALANCED,
        weights=OptimizationWeights(cost_weight=0.5, carbon_weight=0.5),
    )
    res = service.optimize_step(input_data)

    assert res.solver_status == "Optimal"
    assert res.is_demand_fully_met is True
    assert res.normalized_cost_score is not None
    assert 0.0 <= res.normalized_cost_score <= 1.0
    assert res.normalized_carbon_score is not None
    assert 0.0 <= res.normalized_carbon_score <= 1.0


def test_8_edge_cases(service: OptimizationService) -> None:
    """TEST 8: Robust edge case handling (D=0, all costs=0, all emissions=0)."""
    # Case A: Demand = 0
    res_zero_d = service.optimize_step(OptimizationInput(demand_kwh=0.0, solar_available_kwh=20.0))
    assert res_zero_d.solver_status == "Optimal"
    assert res_zero_d.total_supplied_kwh == 0.0
    assert res_zero_d.total_cost_usd == 0.0
    assert res_zero_d.total_carbon_kg == 0.0
    assert res_zero_d.unused_solar_kwh == 20.0

    # Case B: All costs zero
    res_zero_c = service.optimize_step(OptimizationInput(
        demand_kwh=20.0,
        grid_available_kwh=30.0,
        costs=CostConfig(solar=0, wind=0, battery=0, grid=0, diesel=0),
        mode=OptimizationMode.BALANCED,
    ))
    assert res_zero_c.solver_status == "Optimal"
    assert res_zero_c.is_demand_fully_met is True

    # Case C: All emissions zero
    res_zero_e = service.optimize_step(OptimizationInput(
        demand_kwh=20.0,
        grid_available_kwh=30.0,
        carbon=CarbonConfig(solar=0, wind=0, battery=0, grid=0, diesel=0),
        mode=OptimizationMode.BALANCED,
    ))
    assert res_zero_e.solver_status == "Optimal"
    assert res_zero_e.is_demand_fully_met is True

    # Case D: Both all costs AND all emissions zero
    res_zero_both = service.optimize_step(OptimizationInput(
        demand_kwh=20.0,
        grid_available_kwh=30.0,
        costs=CostConfig(solar=0, wind=0, battery=0, grid=0, diesel=0),
        carbon=CarbonConfig(solar=0, wind=0, battery=0, grid=0, diesel=0),
        mode=OptimizationMode.BALANCED,
    ))
    assert res_zero_both.solver_status == "Optimal"
    assert res_zero_both.is_demand_fully_met is True


def test_9_penalty_consistency_physical_preference(service: OptimizationService) -> None:
    """TEST 9: Physical energy is always preferred before unmet demand."""
    for mode in [OptimizationMode.ECONOMY, OptimizationMode.GREEN, OptimizationMode.BALANCED]:
        # Capacity is 40 kWh, Demand is 50 kWh.
        input_data = OptimizationInput(
            demand_kwh=50.0,
            solar_available_kwh=10.0,
            wind_available_kwh=10.0,
            battery=BatteryState(current_soc=0.20),
            grid_available_kwh=10.0,
            diesel_available_kwh=10.0,
            mode=mode,
        )
        res = service.optimize_step(input_data)
        assert res.solver_status == "Optimal"
        # All 40 kWh of available physical capacity must be completely exhausted
        assert pytest.approx(res.total_supplied_kwh, rel=1e-3) == 40.0
        # Exactly the 10 kWh shortage goes to unmet demand
        assert pytest.approx(res.unmet_demand_kwh, rel=1e-3) == 10.0


def test_10_input_validation_guards() -> None:
    """TEST 10: Negative inputs and invalid SoC bounds raise validation errors."""
    with pytest.raises(ValidationError):
        OptimizationInput(demand_kwh=-5.0)

    with pytest.raises(ValidationError):
        OptimizationInput(demand_kwh=10.0, solar_available_kwh=-2.0)

    with pytest.raises(ValidationError):
        BatteryState(current_soc=1.5)

    with pytest.raises(ValidationError):
        BatteryState(capacity_kwh=-10.0)
