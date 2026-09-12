"""GridMind AI — Microgrid Energy Optimization Engine Demonstration.

Executes real mathematical optimization dispatch scenarios across multiple
operational presets (Economy, Green, Balanced) using PuLP and the COIN-OR CBC solver.

IMPORTANT NOTICE:
All renewable availability values and demand levels used in this script
are SIMULATION INPUTS intended to demonstrate engine behavior under varying
operational constraints. They are not measured empirical sensor data.
"""

import sys
from app.optimization import (
    OptimizationService,
    OptimizationInput,
    OptimizationMode,
    BatteryState,
    CostConfig,
    CarbonConfig,
    OptimizationWeights,
)


def print_banner(title: str) -> None:
    """Print clean terminal section banner."""
    print("\n" + "=" * 78)
    print(f"  {title}")
    print("=" * 78)


def print_result_summary(scenario_name: str, result) -> None:
    """Print detailed tabular dispatch results."""
    print(f"\n--- {scenario_name} ---")
    print(f"Operational Mode Applied : {result.mode_applied.upper()}")
    print(f"Solver Status            : {result.solver_status} (CBC Solve Time: {result.solve_time_ms:.2f} ms)")
    print(f"Demand Target            : {result.demand_kwh:.2f} kWh")
    print(f"Total Supplied Energy    : {result.total_supplied_kwh:.2f} kWh")
    print(f"Unmet Demand             : {result.unmet_demand_kwh:.2f} kWh {'[OK - 100% Met]' if result.is_demand_fully_met else '[ALERT - DEFICIT]'}")
    print("\nEnergy Source Allocations:")
    print(f"  * Solar PV Utilized    : {result.allocations.solar_used_kwh:>7.2f} kWh")
    print(f"  * Wind Turbine Utilized: {result.allocations.wind_used_kwh:>7.2f} kWh")
    print(f"  * Battery Storage Used : {result.allocations.battery_used_kwh:>7.2f} kWh")
    print(f"  * Utility Grid Imported: {result.allocations.grid_used_kwh:>7.2f} kWh")
    print(f"  * Diesel Generator Used: {result.allocations.diesel_used_kwh:>7.2f} kWh")
    print("\nRenewable Utilization & Derived Metrics:")
    print(f"  * Unused Solar Energy  : {result.unused_solar_kwh:>7.2f} kWh")
    print(f"  * Unused Wind Energy   : {result.unused_wind_kwh:>7.2f} kWh")
    print(f"  * Total Unused Clean   : {result.total_unused_renewable_kwh:>7.2f} kWh")
    print("\nEconomic & Environmental Impact:")
    print(f"  * Total Operational Cost: ${result.total_cost_usd:>7.2f}")
    print(f"  * Total Carbon Emissions: {result.total_carbon_kg:>7.2f} kg CO2")
    if result.mode_applied == OptimizationMode.BALANCED:
        print(f"  * Normalized Cost Score : {result.normalized_cost_score:>7.4f} (0.0=min, 1.0=max diesel ref)")
        print(f"  * Normalized Carbon Score: {result.normalized_carbon_score:>7.4f} (0.0=min, 1.0=max diesel ref)")
    print("-" * 78)


def main() -> None:
    """Execute all demonstration scenarios."""
    print_banner("GRIDMIND AI — MICROGRID ENERGY OPTIMIZATION DEMO (PuLP CBC)")
    print("NOTE: All asset availability levels below are SIMULATION INPUTS.")
    
    service = OptimizationService()

    # ==========================================================================
    # SCENARIO 1: High Renewable Surplus [SIMULATION INPUT]
    # ==========================================================================
    # Clean solar and wind easily exceed demand; zero diesel, zero grid.
    scen1_input = OptimizationInput(
        demand_kwh=35.0,
        solar_available_kwh=50.0,   # [SIMULATION INPUT] Surplus solar
        wind_available_kwh=20.0,    # [SIMULATION INPUT]
        battery=BatteryState(current_soc=0.50),
        grid_available_kwh=50.0,
        diesel_available_kwh=75.0,
        mode=OptimizationMode.BALANCED,
    )
    res1 = service.optimize_step(scen1_input)
    print_result_summary("SCENARIO 1: High Renewable Surplus [SIMULATION INPUT]", res1)

    # ==========================================================================
    # SCENARIO 2: Low Renewable Shortfall [SIMULATION INPUT]
    # ==========================================================================
    # Solar and wind low; battery discharges cleanly to supply remainder.
    scen2_input = OptimizationInput(
        demand_kwh=40.0,
        solar_available_kwh=5.0,    # [SIMULATION INPUT]
        wind_available_kwh=5.0,     # [SIMULATION INPUT]
        battery=BatteryState(capacity_kwh=200.0, current_soc=0.60, minimum_soc=0.20),
        grid_available_kwh=50.0,
        diesel_available_kwh=75.0,
        mode=OptimizationMode.BALANCED,
    )
    res2 = service.optimize_step(scen2_input)
    print_result_summary("SCENARIO 2: Low Renewable Shortfall [SIMULATION INPUT]", res2)

    # ==========================================================================
    # SCENARIO 3: Peak Demand Surge [SIMULATION INPUT]
    # ==========================================================================
    # High evening demand requiring multiple assets including backup diesel.
    scen3_input = OptimizationInput(
        demand_kwh=120.0,
        solar_available_kwh=0.0,    # [SIMULATION INPUT] Nighttime
        wind_available_kwh=10.0,    # [SIMULATION INPUT]
        battery=BatteryState(capacity_kwh=200.0, current_soc=0.40, minimum_soc=0.20, maximum_discharge_kw=30.0),
        grid_available_kwh=40.0,
        diesel_available_kwh=75.0,
        mode=OptimizationMode.ECONOMY,
    )
    res3 = service.optimize_step(scen3_input)
    print_result_summary("SCENARIO 3: Peak Demand Surge [SIMULATION INPUT]", res3)

    # ==========================================================================
    # SCENARIO 4: Limited Battery Reserve [SIMULATION INPUT]
    # ==========================================================================
    # Battery is at 22% SoC (floor is 20%), so only 2% usable storage exists.
    scen4_input = OptimizationInput(
        demand_kwh=50.0,
        solar_available_kwh=0.0,
        wind_available_kwh=0.0,
        battery=BatteryState(capacity_kwh=200.0, current_soc=0.22, minimum_soc=0.20),
        grid_available_kwh=60.0,
        diesel_available_kwh=75.0,
        mode=OptimizationMode.BALANCED,
    )
    res4 = service.optimize_step(scen4_input)
    print_result_summary("SCENARIO 4: Limited Battery Reserve Protection [SIMULATION INPUT]", res4)

    # ==========================================================================
    # SCENARIO 5: Severe Energy Deficit [SIMULATION INPUT]
    # ==========================================================================
    # Total available generation + storage is 120 kWh, but demand is 200 kWh.
    # Optimizer must maintain feasibility by allocating 80 kWh to unmet_demand.
    scen5_input = OptimizationInput(
        demand_kwh=200.0,
        solar_available_kwh=10.0,
        wind_available_kwh=10.0,
        battery=BatteryState(capacity_kwh=200.0, current_soc=0.35, minimum_soc=0.20, maximum_discharge_kw=25.0),
        grid_available_kwh=40.0,
        diesel_available_kwh=35.0,
        mode=OptimizationMode.BALANCED,
    )
    res5 = service.optimize_step(scen5_input)
    print_result_summary("SCENARIO 5: Severe Deficit & Blackout Warning [SIMULATION INPUT]", res5)

    # ==========================================================================
    # SCENARIO 6: Mode Comparison Benchmark [SIMULATION INPUT]
    # ==========================================================================
    # Same identical conditions evaluated across Economy, Green, and Balanced.
    print_banner("SCENARIO 6: MULTI-MODE DISPATCH BENCHMARK [SIMULATION INPUT]")
    print("Evaluating identical load (60 kWh) across Economy, Green, and Balanced presets...\n")

    base_args = dict(
        demand_kwh=60.0,
        solar_available_kwh=10.0,
        wind_available_kwh=10.0,
        battery=BatteryState(capacity_kwh=200.0, current_soc=0.30, minimum_soc=0.20, maximum_discharge_kw=15.0),
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
    )

    res_econ = service.optimize_step(OptimizationInput(**base_args, mode=OptimizationMode.ECONOMY))
    res_green = service.optimize_step(OptimizationInput(**base_args, mode=OptimizationMode.GREEN))
    res_bal = service.optimize_step(OptimizationInput(**base_args, mode=OptimizationMode.BALANCED))

    print(f"{'Metric':<25} | {'ECONOMY MODE':<15} | {'GREEN MODE':<15} | {'BALANCED MODE':<15}")
    print("-" * 78)
    print(f"{'Solar Used (kWh)':<25} | {res_econ.allocations.solar_used_kwh:<15.2f} | {res_green.allocations.solar_used_kwh:<15.2f} | {res_bal.allocations.solar_used_kwh:<15.2f}")
    print(f"{'Wind Used (kWh)':<25} | {res_econ.allocations.wind_used_kwh:<15.2f} | {res_green.allocations.wind_used_kwh:<15.2f} | {res_bal.allocations.wind_used_kwh:<15.2f}")
    print(f"{'Battery Used (kWh)':<25} | {res_econ.allocations.battery_used_kwh:<15.2f} | {res_green.allocations.battery_used_kwh:<15.2f} | {res_bal.allocations.battery_used_kwh:<15.2f}")
    print(f"{'Grid Import (kWh)':<25} | {res_econ.allocations.grid_used_kwh:<15.2f} | {res_green.allocations.grid_used_kwh:<15.2f} | {res_bal.allocations.grid_used_kwh:<15.2f}")
    print(f"{'Diesel Used (kWh)':<25} | {res_econ.allocations.diesel_used_kwh:<15.2f} | {res_green.allocations.diesel_used_kwh:<15.2f} | {res_bal.allocations.diesel_used_kwh:<15.2f}")
    print(f"{'Unmet Demand (kWh)':<25} | {res_econ.unmet_demand_kwh:<15.2f} | {res_green.unmet_demand_kwh:<15.2f} | {res_bal.unmet_demand_kwh:<15.2f}")
    print("-" * 78)
    print(f"{'Total Cost ($)':<25} | ${res_econ.total_cost_usd:<14.2f} | ${res_green.total_cost_usd:<14.2f} | ${res_bal.total_cost_usd:<14.2f}")
    print(f"{'Total Emissions (kg CO2)':<25} | {res_econ.total_carbon_kg:<15.2f} | {res_green.total_carbon_kg:<15.2f} | {res_bal.total_carbon_kg:<15.2f}")
    print("=" * 78)
    print("\nDemonstration completed successfully. Optimization engine is fully operational.\n")


if __name__ == "__main__":
    main()
