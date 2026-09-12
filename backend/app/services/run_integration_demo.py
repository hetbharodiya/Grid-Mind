"""GridMind AI — AI Forecast & Microgrid Dispatch Integration Demonstration.

Demonstrates the complete end-to-end integration:
Historical Energy Data -> ML Model Forecast -> Microgrid Optimization Engine -> Energy Dispatch.

IMPORTANT NOTICE:
- Historical demand data is drawn directly from the verified processed dataset (processed_energy_demand.csv).
- Microgrid asset availability values (solar, wind, grid, diesel) are explicit CONFIGURABLE DEMO ASSUMPTIONS
  provided as application inputs to evaluate system behavior across a day. They are not measured sensor data.
"""

from pathlib import Path
import pandas as pd

from app.optimization.config import OptimizationMode
from app.optimization.models import BatteryState
from app.integration import (
    GridMindIntegrationService,
    ForecastDispatchInput,
    Horizon24hDispatchInput,
)


def print_banner(title: str) -> None:
    """Print clean terminal section banner."""
    print("\n" + "=" * 82)
    print(f"  {title}")
    print("=" * 82)


def main() -> None:
    """Execute the end-to-end AI forecast and dispatch integration demonstration."""
    print_banner("GRIDMIND AI — AI FORECAST & DISPATCH INTEGRATION DEMO")
    print("Core Workflow: Historical Data -> AI Predictor -> PuLP Optimizer -> Optimal Dispatch\n")

    # 1. Load real historical context buffer from processed dataset
    data_path = Path(__file__).resolve().parent.parent / "data" / "processed" / "processed_energy_demand.csv"
    if not data_path.exists():
        print(f"Error: Processed dataset not found at {data_path}")
        return

    print(f"Loading historical context from: {data_path.name}")
    full_df = pd.read_csv(data_path)
    full_df["timestamp"] = pd.to_datetime(full_df["timestamp"])

    # Slice the last 200 hours as the historical context buffer (>= 168 hours required)
    history_slice = full_df.iloc[-200:].copy().reset_index(drop=True)
    last_hist_time = history_slice["timestamp"].iloc[-1]
    print(f"Loaded {len(history_slice)} consecutive historical hours.")
    print(f"Historical buffer anchor timestamp: {last_hist_time}")

    # Initialize integration service
    service = GridMindIntegrationService()

    # ==========================================================================
    # PART 1: SINGLE-HOUR LIVE DISPATCH (NEXT IMMEDIATE HOUR)
    # ==========================================================================
    print_banner("PART 1: SINGLE-HOUR LIVE AI FORECAST & OPTIMAL DISPATCH")
    print("NOTE: Solar, Wind, Grid, and Diesel availability below are CONFIGURABLE DEMO ASSUMPTIONS.")

    single_cfg = ForecastDispatchInput(
        solar_available_kwh=1.50,   # [CONFIGURABLE DEMO ASSUMPTION]
        wind_available_kwh=1.00,    # [CONFIGURABLE DEMO ASSUMPTION]
        battery=BatteryState(capacity_kwh=20.0, current_soc=0.60, minimum_soc=0.20, maximum_discharge_kw=5.0),
        grid_available_kwh=50.0,    # [CONFIGURABLE DEMO ASSUMPTION]
        diesel_available_kwh=50.0,  # [CONFIGURABLE DEMO ASSUMPTION]
        mode=OptimizationMode.BALANCED,
    )

    single_res = service.dispatch_next_hour(history_slice, single_cfg)

    fc = single_res.forecast
    opt = single_res.optimization
    alloc = opt.allocations

    print(f"\n1. AI Demand Forecast Step (Model: {fc.model_type}):")
    print(f"   * Target Timestamp   : {fc.forecast_timestamp}")
    print(f"   * Day of Week / Hour : Day {fc.day_of_week}, Hour {fc.hour:02d}:00")
    print(f"   * AI Predicted Demand: {fc.predicted_demand_kwh:.4f} kWh")

    print(f"\n2. Microgrid Dispatch Decision (Mode: {opt.mode_applied.upper()}, Solver: {opt.solver_status}):")
    print(f"   * Solar PV Utilized  : {alloc.solar_used_kwh:>7.2f} kWh  (Available: {single_cfg.solar_available_kwh:.2f} kWh)")
    print(f"   * Wind Utilized      : {alloc.wind_used_kwh:>7.2f} kWh  (Available: {single_cfg.wind_available_kwh:.2f} kWh)")
    print(f"   * Battery Discharged : {alloc.battery_used_kwh:>7.2f} kWh  (Starting SoC: {single_cfg.battery.current_soc * 100:.0f}%)")
    print(f"   * Grid Import        : {alloc.grid_used_kwh:>7.2f} kWh")
    print(f"   * Diesel Backup Used : {alloc.diesel_used_kwh:>7.2f} kWh")
    print(f"   * Unmet Demand Slack : {opt.unmet_demand_kwh:>7.2f} kWh  [100% Demand Met: {opt.is_demand_fully_met}]")

    print(f"\n3. Impact & Key Metrics:")
    print(f"   * Clean Energy Share : {single_res.clean_energy_percentage:>6.1f}%")
    print(f"   * Total Hourly Cost  : ${opt.total_cost_usd:>6.2f}")
    print(f"   * Total CO2 Emissions: {opt.total_carbon_kg:>6.2f} kg CO2")
    print(f"   * Pipeline Latency   : {single_res.pipeline_execution_time_ms:.2f} ms")

    # ==========================================================================
    # PART 2: 24-HOUR HORIZON FORECAST & SEQUENTIAL DISPATCH SIMULATION
    # ==========================================================================
    print_banner("PART 2: 24-HOUR SEQUENTIAL HORIZON FORECAST & DISPATCH SIMULATION")
    print("NOTE: 24-hour solar and wind profiles below are CONFIGURABLE DEMO ASSUMPTIONS.\n")

    # Construct explicit 24-hour diurnal solar curve and steady wind availability [CONFIGURABLE DEMO ASSUMPTIONS]
    # Solar peaks during midday (hours 10 to 16) and is 0 at night.
    solar_24h = [
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,   # Hours 1-6 (Overnight)
        0.2, 0.8, 2.0, 3.5, 4.5, 5.0,   # Hours 7-12 (Morning to Solar Noon)
        4.8, 4.0, 2.8, 1.5, 0.4, 0.0,   # Hours 13-18 (Afternoon to Dusk)
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0    # Hours 19-24 (Evening/Night)
    ]
    wind_24h = [1.2] * 24  # Steady breeze assumption

    horizon_cfg = Horizon24hDispatchInput(
        battery=BatteryState(capacity_kwh=30.0, current_soc=0.70, minimum_soc=0.20, maximum_discharge_kw=8.0),
        solar_profile_kwh=solar_24h,
        wind_profile_kwh=wind_24h,
        grid_available_kwh=50.0,
        diesel_available_kwh=50.0,
        mode=OptimizationMode.BALANCED,
    )

    horizon_res = service.dispatch_24h_horizon(history_slice, horizon_cfg)

    # Display hourly dispatch schedule
    header = f"{'Hr':<3} | {'Timestamp':<19} | {'Pred (kWh)':<10} | {'Solar':<6} | {'Wind':<6} | {'Bat':<6} | {'Grid':<6} | {'Dies':<6} | {'Unmet':<6} | {'SoC':<6} | {'Cost ($)':<8} | {'CO2 (kg)':<8}"
    print(header)
    print("-" * len(header))

    for step in horizon_res.hourly_steps:
        print(
            f"{step.hour_number:<3} | "
            f"{step.timestamp:<19} | "
            f"{step.predicted_demand_kwh:<10.2f} | "
            f"{step.solar_used_kwh:<6.2f} | "
            f"{step.wind_used_kwh:<6.2f} | "
            f"{step.battery_used_kwh:<6.2f} | "
            f"{step.grid_used_kwh:<6.2f} | "
            f"{step.diesel_used_kwh:<6.2f} | "
            f"{step.unmet_demand_kwh:<6.2f} | "
            f"{step.battery_soc_after_dispatch * 100:<5.1f}% | "
            f"${step.hourly_cost_usd:<7.2f} | "
            f"{step.hourly_carbon_kg:<8.2f}"
        )

    # Display 24-hour daily summary
    ds = horizon_res.daily_summary
    print("-" * len(header))
    print(f"\n24-Hour Horizon Daily Summary:")
    print(f"  * Total AI Predicted Demand : {ds.total_predicted_demand_kwh:>7.2f} kWh")
    print(f"  * Total Supplied Energy     : {ds.total_supplied_energy_kwh:>7.2f} kWh")
    print(f"  * Total Solar PV Utilized   : {ds.total_solar_used_kwh:>7.2f} kWh")
    print(f"  * Total Wind Energy Utilized: {ds.total_wind_used_kwh:>7.2f} kWh")
    print(f"  * Total Battery Discharged  : {ds.total_battery_used_kwh:>7.2f} kWh")
    print(f"  * Total Grid Power Imported : {ds.total_grid_used_kwh:>7.2f} kWh")
    print(f"  * Total Diesel Backup Used  : {ds.total_diesel_used_kwh:>7.2f} kWh")
    print(f"  * Total Unmet Demand        : {ds.total_unmet_demand_kwh:>7.2f} kWh")
    print(f"  * Cumulative 24h Fuel Cost  : ${ds.total_operational_cost_usd:>7.2f}")
    print(f"  * Cumulative 24h Emissions  : {ds.total_carbon_emissions_kg:>7.2f} kg CO2")
    print(f"  * Starting Battery SoC      : {ds.starting_battery_soc * 100:>7.1f}%")
    print(f"  * Ending Battery SoC        : {ds.ending_battery_soc * 100:>7.1f}%")
    print(f"  * Average Clean Energy Share: {ds.average_clean_energy_percentage:>7.1f}%")
    print(f"  * 24-Hour Simulation Latency: {horizon_res.pipeline_execution_time_ms:.2f} ms")
    print("=" * 82)
    print("\nPhase 7 integration demonstration completed successfully.\n")


if __name__ == "__main__":
    main()
