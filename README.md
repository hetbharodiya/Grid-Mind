# GRIDMIND AI

> **"Predict. Plan. Power."**  
> AI-Powered Microgrid Energy Forecasting and Optimization Platform for Off-Grid Communities.

---

## 1. Project Overview
Off-grid rural settlements, island communities, and remote healthcare facilities rely heavily on hybrid microgrids combining solar photovoltaics, wind turbines, battery energy storage systems (BESS), and diesel backup generators.

Traditional microgrid controllers operate **reactively**—depleting batteries prematurely and firing up expensive, high-emission diesel generators during evening peak demand. **GridMind AI** transforms this into a **predictive, horizon-aware optimization system**:
$$\text{PREDICT } \longrightarrow \text{OPTIMIZE } \longrightarrow \text{SIMULATE } \longrightarrow \text{DECIDE}$$

---

## 2. Project Architecture Overview
The platform is designed around four decoupled analytical layers:
1. **Machine Learning Demand Forecasting**: Anticipates 24-hour community electrical load.
2. **Renewable Energy Availability Physics**: Models solar and wind output using solar zenith dynamics and aerodynamic turbine power curves.
3. **Mathematical Optimization Core (PuLP)**: Formulates a 24-hour horizon Mixed-Integer / Linear Program (MILP/LP) to minimize diesel fuel expenses, carbon emissions, and battery degradation while guaranteeing continuous load satisfaction.
4. **Interactive Scenario Studio & Dashboard**: Visualizes the optimal 24-hour energy mix, simulates weather/load/fuel shocks, and benchmarks GridMind AI against traditional greedy controllers.

> 📖 **Developer & AI Handoff Notice**: For permanent development memory, architectural decisions, and agent handoff guidelines, refer to [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md).

---

## 3. Current Development Phase
- **Current Phase**: **Phase 8 — REST API & AI Microservice Layer**
- **Status**: **COMPLETED**. Production-grade FastAPI REST API under `/api/v1` exposing diagnostic health, model metadata, forward load forecasting (single-hour and 24-hour), and microgrid LP dispatch optimization. Features dependency injection, shared 1-hour continuity history validation, centralized structured error handling, and OpenAPI 3.1.0 documentation. Complete test suite: **62/62 tests passing**.
- **Next Phase**: **Phase 9 — Interactive SCADA Dashboard & Scenario Studio (Frontend)**.

---

## 4. Current vs. Planned Features

| Component / Feature | Current Status | Description |
| :--- | :---: | :--- |
| **Project & Directory Foundation** | ✅ **Implemented** | Clean, modular layout separating ML, optimization, services, and schemas. |
| **Project Continuity Memory** | ✅ **Implemented** | `PROJECT_CONTEXT.md` established for seamless multi-account agent handoff. |
| **FastAPI Core & Monitoring** | ✅ **Implemented** | FastAPI application with CORS, root (`/`), and `/health` endpoints. |
| **Energy Data Architecture** | ✅ **Implemented** | Pydantic v2 schemas for Energy Demand, Solar/Wind Renewables, and Microgrid Assets. |
| **Adaptive Data Preprocessor** | ✅ **Implemented** | Dynamic inspection (`DatasetInspectionReport`), column auto-detect, cleaning, and hourly resampling. |
| **Real Dataset Preprocessing** | ✅ **Implemented** | Ingested 2,075,259 raw records, converted minute active power (kW) to 34,589 clean hourly kWh records. |
| **Machine Learning Model** | ✅ **Implemented** | `HistGradientBoostingRegressor` (Test MAE: 0.3149 kWh, 37.4% improvement over seasonal baseline). |
| **24-Hour Forecasting Service** | ✅ **Implemented** | Recursive multi-step `DemandPredictor` generating future 24-hour load arrays. |
| **PuLP Optimization Engine** | ✅ **Implemented** | Single-period LP dispatch engine minimizing cost, carbon, or balanced multi-objectives via CBC. |
| **Forecast & Dispatch Integration**| ✅ **Implemented** | Orchestrates live single-hour and sequential 24-hour LP dispatch driven directly by AI load forecasts. |
| **REST API & Microservice Layer** | ✅ **Implemented** | Complete `/api/v1` REST API (8 endpoints, DI, structured errors, OpenAPI documentation). |
| **React Dashboard (Frontend)** | ⏳ *Planned (Phase 9)* | Industrial SCADA dark mode UI with interactive Recharts diagrams and scenario sliders. |
| **Renewable Physics Simulation** | ⏳ *Planned (Phase 9)* | Solar irradiance zenith clear-sky curves and aerodynamic wind turbine power curves. |
| **Reactive Baseline Benchmark** | ⏳ *Planned (Phase 9)* | Traditional greedy controller benchmark for savings comparison. |
| **Deterministic Explainability** | ⏳ *Planned (Phase 9)* | Rule-based engine translating dispatch decisions into plain text. |
| **Database Integration** | ⏳ *Planned (Optional)* | MongoDB persistence for saving scenario run histories. |


---

## 5. Technology Stack

### Backend
- **Language**: Python 3.11+
- **API Framework**: FastAPI, Uvicorn
- **Data Validation & Settings**: Pydantic v2, Pydantic-Settings
- **Data Processing**: Pandas, NumPy
- **Machine Learning**: Scikit-learn, Joblib *(Phase 3)*
- **Mathematical Optimization**: PuLP (COIN-OR CBC Solver) *(Phase 4)*
- **Testing**: Pytest, HTTPX

### Frontend *(Planned for Phase 5)*
- React 18, Vite, Tailwind CSS, Recharts, Lucide React

---

## 6. Project Structure

```
gridmind-ai/
├── README.md
├── .gitignore
├── frontend/
│   └── README.md
└── backend/
    ├── requirements.txt
    ├── .env.example
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                     # FastAPI application entry point
    │   ├── config.py                   # Centralized App, Microgrid, and ML settings
    │   ├── api/                        # REST routing modules
    │   ├── schemas/                    # Pydantic data models
    │   │   ├── demand.py               # Energy demand & ML feature contracts
    │   │   ├── renewables.py           # Solar & wind generation schemas
    │   │   └── microgrid.py            # Battery, diesel, and cost specifications
    │   ├── services/                   # Business services
    │   │   └── data_preprocessor.py    # Ingestion, validation, and resampling
    │   ├── ml/                         # Machine learning forecaster (Phase 3)
    │   ├── optimization/               # PuLP dispatch solver (Phase 4)
    │   ├── simulation/                 # Physics & baseline models (Phase 4)
    │   ├── utils/                      # Shared helper utilities
    │   └── data/
    │       ├── raw/                    # Original immutable source data (household_power_consumption.txt)
    │       └── processed/              # Cleaned standardized datasets (processed_energy_demand.csv)
    └── tests/
        ├── test_health.py              # Root & health endpoint unit tests
        └── test_data_preprocessor.py   # Data pipeline unit tests
```

---

## 7. Dataset Handling & Preprocessing Pipeline

### Raw vs. Processed Data Boundary
* **Raw Data Location**: `backend/app/data/raw/`  
  Contains original, unmodified source files (e.g. `household_power_consumption.txt`, 2.07M records, 126.8 MB). Raw files remain strictly read-only and immutable.
* **Processed Data Location**: `backend/app/data/processed/`  
  Contains standardized, hourly-aggregated energy demand outputs (`processed_energy_demand.csv`, 34,589 records, 1.38 MB).

### Data Processing Flow
1. **Delimiter & Format Inspection**: Auto-detects delimiters (semicolon `;`) and missing value markers (`?`).
2. **Timestamp Combination & Normalization**: Merges separate `Date` (DD/MM/YYYY) and `Time` (HH:MM:SS) columns into unified ISO 8601 timestamps.
3. **Power-to-Energy Mathematical Conversion**: The dataset contains minute-averaged active power in **kilowatts (kW)**. Energy over each 1-minute interval is $E_m = P_m \times \frac{1}{60} \text{ kWh}$. Resampling over a 1-hour interval yields:
   $$E_{\text{hour}} = \frac{1}{60} \sum_{m=1}^{60} P_m = \overline{P}_{\text{hour}} (\text{kW}) \times 1\text{ hr} = \text{kWh}$$
4. **Missing Value Imputation**: Minute-level nulls (1.25% of records) are imputed via bounded linear interpolation before hourly resampling.
5. **Hourly Aggregation**: Aggregates continuous minute records into uniform 1-hour records (`2006-12-16 17:00:00` to `2010-11-26 21:00:00`).
6. **Standardized Schema**: Produces canonical columns `['timestamp', 'hour', 'day_of_week', 'energy_demand_kwh']` with zero remaining nulls.

---

## 8. Machine Learning Demand Forecasting

* **Purpose**: Forecast hourly electricity demand for the next 24-hour planning horizon to feed into the PuLP optimization engine.
* **Target Variable**: `energy_demand_kwh` (hourly energy consumption in kilowatt-hours).
* **Feature Engineering (25 Features)**:
  * *Calendar*: `hour`, `day_of_week`, `day_of_month`, `month`, `is_weekend`.
  * *Cyclical Diurnal/Weekly/Annual*: `sin_hour`, `cos_hour`, `sin_dow`, `cos_dow`, `sin_month`, `cos_month`.
  * *Autoregressive Lags*: $y_{t-1}, y_{t-2}, y_{t-3}, y_{t-24}, y_{t-48}, y_{t-168}$ (strictly shifted $t \ge 1$ to prevent data leakage).
  * *Rolling Window Statistics*: `rolling_mean_6h`, `rolling_std_6h`, `rolling_max_6h`, `rolling_min_6h`, `rolling_mean_24h`, `rolling_std_24h`, `rolling_max_24h`, `rolling_min_24h`.
* **Model Architecture**: `HistGradientBoostingRegressor` (scikit-learn).
* **Validation Strategy**: Strict chronological forward splitting (70% Train: 24,094 records; 15% Validation: 5,163 records; 15% Test: 5,164 records; 0% random shuffling).
* **Evaluation Metrics (Held-out Final Test Set)**:
  * **Test MAE**: **0.3149 kWh** vs. Seasonal Lag-24 Baseline 0.5028 kWh (**37.37% improvement**).
  * **Test RMSE**: **0.4579 kWh** vs. Seasonal Lag-24 Baseline 0.7489 kWh (**38.86% improvement**).
  * **Test MAPE**: **42.48%** vs. Seasonal Lag-24 Baseline 65.89%.
* **Model Artifacts**:
  * Serialized Model: `backend/app/models/demand_model.joblib` (0.15 MB).
  * Model Metadata: `backend/app/models/model_metadata.json`.

---

## 9. Microgrid Energy Optimization Engine (PuLP)

### Machine Learning vs. Optimization Distinction
* **Machine Learning (Predict)** answers: *"How much electricity demand will the community require?"*
* **Optimization Engine (Plan)** answers: *"What is the mathematically optimal, lowest-cost, and cleanest allocation of available assets (Solar, Wind, Battery, Grid, Diesel) to satisfy that demand?"*

### Mathematical Formulation
Formulated as a single-period Linear Programming (LP) model solved via the bundled COIN-OR CBC solver:

$$\min Z = \text{Objective}_{\text{mode}} + P_{\text{unmet, mode}} \cdot x_{\text{unmet}}$$

Subject to:
1. **Energy Balance Equality**:
   $$x_{\text{solar}} + x_{\text{wind}} + x_{\text{battery}} + x_{\text{grid}} + x_{\text{diesel}} + x_{\text{unmet}} = D$$
2. **Capacity Bounds**:
   $$0 \le x_s \le \text{Availability}_s, \quad \forall s \in \{\text{solar}, \text{wind}, \text{battery}, \text{grid}, \text{diesel}\}$$
3. **Battery Electrochemical & Inverter Constraints**:
   $$E_{\text{usable}} = \max\left(0, (\text{SoC} - \text{SoC}_{\min}) \cdot C_{\text{bat}}\right) \cdot \eta_{\text{dis}}$$
   $$B_{\text{deliverable}} = \min\left(E_{\text{usable}}, \, P_{\text{dis, max}} \cdot 1.0\text{ h}\right)$$
   $$0 \le x_{\text{battery}} \le B_{\text{deliverable}}$$
4. **Non-negative Unmet Demand Slack**: $x_{\text{unmet}} \ge 0$.

### Operational Preset Modes
* **Economy Mode**: Minimizes operational expenditure ($): $\min \sum c_s x_s$.
* **Green Mode**: Minimizes carbon emissions (kg $\text{CO}_2$): $\min \sum e_s x_s$.
* **Balanced Mode**: Minimizes a dimensionless normalized composite score:
  $$\min w_{\text{cost}} \left(\frac{C_{\text{total}}}{C_{\text{ref}}}\right) + w_{\text{carbon}} \left(\frac{E_{\text{total}}}{E_{\text{ref}}}\right)$$
  where $C_{\text{ref}} = \max(c_s) \cdot D$ and $E_{\text{ref}} = \max(e_s) \cdot D$ establish worst-case reference baselines (100% diesel supply).

### Mode-Consistent Unmet Demand Penalty
To guarantee that physical generation and storage are always preferred before leaving load unserved:
$$P_{\text{unmet, mode}} = 1000.0 \times \max_{s}(k_{s, \text{mode}})$$
Every unserved kWh is penalized exactly $1,000\times$ higher than the most expensive, most polluting physical source.

### Configurable Assumptions (Defaults)
* Solar & Wind: $0.00/kWh, 0.00 kg CO2/kWh *(Configurable Assumption)*
* Battery: $0.025/kWh degradation wear, 0.00 kg CO2/kWh *(Configurable Assumption)*
* Grid: $0.15/kWh, 0.45 kg CO2/kWh *(Configurable Assumption)*
* Diesel: $0.45/kWh, 0.72 kg CO2/kWh *(Configurable Assumption)*

---

## 10. AI Forecast & Microgrid Dispatch Integration

### Architectural Decoupling & Coordination
GridMind AI enforces strict separation of concerns:
* `app.ml` is exclusively responsible for autoregressive demand forecasting.
* `app.optimization` is exclusively responsible for single-period LP dispatch.
* `app.integration` (`GridMindIntegrationService`) bridges the two:
  ```
  Historical Data (processed_energy_demand.csv)
                      │
                      ▼
             DemandPredictor (app.ml)
                      │ Predicted Demand (kWh)
                      ▼
      GridMindIntegrationService (app.integration) ◄── Asset Availability & Battery State
                      │
                      ▼
         OptimizationService (app.optimization)
                      │
                      ▼
            Optimal Energy Allocation Plan
  ```

### Live Single-Hour Dispatch (`dispatch_next_hour`)
Ingests historical demand records ($\ge 168\text{ h}$) $\rightarrow$ predicts next-hour load $\hat{D}_{t+1}$ $\rightarrow$ constructs `OptimizationInput` with asset capacities $\rightarrow$ solves LP $\rightarrow$ returns a structured `ForecastDispatchResult` isolating forecast metadata from optimal physical allocations.

### 24-Hour Horizon Sequential Simulation (`dispatch_24h_horizon`)
Ingests historical demand records $\rightarrow$ queries `DemandPredictor.forecast_24h` **once** for the entire 24-hour horizon $\rightarrow$ sequentially simulates hours 1 to 24 $\rightarrow$ tracks dynamic battery depletion:
$$\text{SoC}_{t+1} = \max\left(\text{SoC}_{\min}, \, \text{SoC}_t - \frac{x_{\text{battery}, t}}{C_{\text{bat}} \cdot \eta_{\text{dis}}}\right)$$
Returns a comprehensive `Horizon24hDispatchResult` containing hourly dispatch steps, daily cost, carbon emissions, and battery SoC trajectories.

---

## 11. Setup & Execution Instructions

### Prerequisites
- Python 3.11+ installed.

### 1. Navigate to the Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Data Preprocessing Pipeline
```bash
python -m app.services.run_preprocessing
```
*Processes the 2.07M row raw dataset in ~16 seconds, producing `backend/app/data/processed/processed_energy_demand.csv`.*

### 4. Train and Evaluate the ML Demand Forecasting Model
```bash
python -m app.ml.train
```
*Trains candidate models, selects the best architecture, evaluates against held-out test data, prints feature importances, and exports `demand_model.joblib`.*

### 5. Run the Microgrid Energy Optimization Demonstration
```bash
python -m app.services.run_optimization_demo
```
*Executes 6 operational microgrid dispatch scenarios (surplus, deficit, surge, low SoC, blackout warning, and multi-mode benchmark) using PuLP and CBC.*

### 6. Run the End-to-End AI Forecast & Dispatch Integration Demonstration
```bash
python -m app.services.run_integration_demo
```
*Executes live single-hour dispatch and a 24-hour sequential simulation tracking battery SoC and clean energy share from real historical data.*

### 7. Run the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
The API documentation is interactively available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 8. Run Backend Verification Tests
```bash
python -m pytest
```
*Current test suite: **62 passed in ~10.0 seconds** (100% test pass rate across preprocessor, health, ML forecaster, optimization engine, integration orchestrator, and REST API).*


