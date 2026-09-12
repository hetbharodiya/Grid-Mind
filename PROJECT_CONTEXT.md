# GridMind AI — Project Context & Development Handoff

> **CRITICAL INSTRUCTION FOR ANY AI AGENT CONTINUING THIS PROJECT:**  
> Read this document completely before taking any action or writing code. Do NOT restart the project. Do NOT recreate completed components. Do NOT start the Optimization Engine without checking the active phase. Respect the current development phase and adhere strictly to the established architecture.

---

## 1. Project Overview

* **Project Name**: GridMind AI
* **Tagline**: *"Predict. Plan. Power."*
* **Core Classification**: AI-Powered Microgrid Energy Forecasting and Optimization Platform for Off-Grid Communities.

### The Problem Being Solved
Off-grid settlements, rural villages, and remote healthcare facilities rely on hybrid microgrids combining Solar PV, Wind turbines, Battery Energy Storage Systems (BESS), and backup Diesel Generators. 
Managing these resources reactively (e.g. running batteries down immediately and turning on diesel generators when batteries empty) results in:
* Excessive diesel fuel consumption and operational expenditure ($0.30–$0.60/kWh).
* Avoidable carbon dioxide emissions.
* Renewable curtailment (wasted mid-day solar/wind).
* Accelerated battery degradation.
* Risk of brownouts during evening demand spikes.

### The Solution: Predict → Optimize → Simulate → Decide
GridMind AI introduces a predictive decision-support system:
1. **PREDICT**: Machine learning forecasts 24-hour electricity demand; deterministic physics models forecast 24-hour renewable availability.
2. **OPTIMIZE**: A mathematical optimization engine (Mixed-Integer Linear Programming via PuLP) calculates the cost-minimal, emission-minimal 24-hour dispatch plan across all energy assets.
3. **SIMULATE**: Operators can perturb weather, load surge, battery health, and fuel price variables to simulate alternate futures.
4. **DECIDE**: Clear visual comparisons (GridMind vs. Traditional Reactive Controller) demonstrate measurable fuel savings, carbon reduction, and renewable utilization with transparent AI explanations.

---

## 2. Hackathon Constraints

* **Development Timeline**: 24–36 Hours.
* **Core Philosophy**: A bulletproof, elegant working prototype beats an over-engineered, broken system.
* **Explicit Exclusions (DO NOT IMPLEMENT)**:
  * No physical IoT hardware, microcontrollers, or edge sensor wiring.
  * No blockchain, Web3, or crypto token mechanisms.
  * No real-time industrial SCADA/PLC hardware control commands.
  * No complex multi-tenant cloud orchestration or Kubernetes.
  * No complex multi-role authentication/JWT systems.
  * No external commercial LLM APIs (OpenAI/Gemini) required for core functionality.
  * No bloated or speculative features.

---

## 3. Core System Architecture

GridMind AI is structured into 7 distinct functional modules:
1. **Data Processing Pipeline**: Ingestion, validation, missing value imputation, hourly resampling, and calendar feature derivation.
2. **Machine Learning Demand Forecasting**: Supervised ML models predicting the next 24 hours of electrical load ($D_{1..24}$).
3. **Renewable Energy Forecasting & Simulation**: Physics-based clear-sky solar irradiance and aerodynamic wind turbine power curves with weather scenario multipliers.
4. **Optimization Engine**: Mathematical formulation in PuLP solving for optimal hourly dispatch ($P_{solar}, P_{wind}, P_{battery\_chg}, P_{battery\_dis}, P_{diesel}, SoC$).
5. **Scenario Simulation Engine**: Reactive baseline benchmark simulator for side-by-side KPI comparison and parameter perturbation.
6. **Backend REST API**: Thin FastAPI layer orchestrating services, validation, and data serialization.
7. **Frontend Operational Dashboard**: Interactive React + Vite + Tailwind + Recharts control center for microgrid operators.

> [!IMPORTANT]
> **Fundamental Conceptual Boundary:**
> * **Machine Learning (ML)** is exclusively responsible for **predicting future electricity demand** based on historical patterns.
> * **Mathematical Optimization (PuLP)** is exclusively responsible for **determining the best energy allocation mix** given that predicted demand, renewable capacity, battery physics, and generator cost constraints.  
> Never confuse or conflate the ML model with the Optimization engine.

---

## 4. Technology Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React *(Planned for Phase 9)*.
* **Backend Framework**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2, `pydantic-settings`.
* **Machine Learning**: `pandas`, `numpy`, `scikit-learn` (`HistGradientBoostingRegressor`), `joblib`.
* **Optimization**: `PuLP` (utilizing the bundled COIN-OR CBC open-source solver) *(Phase 6)*.
* **Testing**: `pytest`, `httpx` (`TestClient`).
* **Database**: MongoDB with an asynchronous client (`motor`) is planned for later **only if explicitly required** for persistence. An in-memory fallback is prioritized for hackathon reliability.

---

## 5. Important Architecture Decisions

1. **Strict Frontend / Backend Decoupling**: API routes are stateless; UI and Backend communicate exclusively through typed JSON REST endpoints.
2. **Modular Service Isolation**:
   * ML code lives strictly in `backend/app/ml/`.
   * Trained model artifacts and metadata live strictly in `backend/app/models/`.
   * Optimization models live strictly in `backend/app/optimization/`.
   * Simulation logic lives strictly in `backend/app/simulation/`.
   * API routes in `backend/app/api/` remain thin controllers; no core business logic is written directly inside route functions.
3. **Deterministic AI Explainability**: AI reasoning is driven by rule-based constraint and shadow price inspection, eliminating external LLM API dependencies, token latency, and rate-limit risks.
4. **Data Discipline & Storage Boundary**:
   * `backend/app/data/raw/` contains **only original immutable source data** (`household_power_consumption.txt`).
   * `backend/app/data/processed/` contains **standardized, cleaned, and resampled data** (`processed_energy_demand.csv`).
   * Derived ML features (lags, rolling averages) are computed dynamically during pipeline execution and are never permanently hardcoded into raw files.
5. **Strict Anti-Data-Leakage Policy**:
   * All lag features are strictly indexed at $t-1$ or earlier.
   * Rolling statistical windows are shifted by 1 hour before computing statistics so the target value is never included in the window.
   * Chronological forward splits only (70% train, 15% validation, 15% test). Zero random shuffling.

---

## 6. Current Project Structure

The following files and directories currently exist in the repository (factually verified):

```
gridmind-ai/
├── .gitignore
├── README.md
├── PROJECT_CONTEXT.md                  # Permanent AI development memory and handoff document
├── frontend/
│   └── README.md                       # Frontend tech stack guide and roadmap placeholder
└── backend/
    ├── requirements.txt                # Confirmed minimal MVP dependencies
    ├── .env.example                    # Environment and microgrid asset parameter template
    ├── app/
    │   ├── __init__.py                 # Application package init
    │   ├── main.py                     # FastAPI app with CORS, root (/), and health check (/health)
    │   ├── config.py                   # Centralized AppSettings, MicrogridSettings, MLSettings
    │   ├── api/
    │   │   └── __init__.py             # API package placeholder
    │   ├── schemas/
    │   │   ├── __init__.py             # Schema re-exports
    │   │   ├── demand.py               # Energy demand, batches, and ML load feature schemas
    │   │   ├── renewables.py           # Solar, wind generation records, and forecast schemas
    │   │   └── microgrid.py            # BatteryConfig, DieselGeneratorConfig, EnergyCostsConfig
    │   ├── services/
    │   │   ├── __init__.py             # Service exports
    │   │   ├── data_preprocessor.py    # Ingestion, ColumnMapping, DatasetInspectionReport, preprocessing
    │   │   ├── run_preprocessing.py    # Standalone executable runner for dataset preprocessing
    │   │   ├── run_optimization_demo.py # Standalone runner for microgrid optimization scenarios
    │   │   └── run_integration_demo.py # Standalone runner for AI forecast & dispatch integration demo
    │   ├── ml/
    │   │   ├── __init__.py             # ML package exports (FeaturePipeline, DemandPredictor, train_pipeline)
    │   │   ├── features.py             # Feature engineering pipeline with anti-leakage guards
    │   │   ├── train.py                # Training, baseline comparison, validation, and evaluation pipeline
    │   │   └── predictor.py            # Reusable DemandPredictor supporting 24-hour recursive forecasting
    │   ├── models/
    │   │   ├── demand_model.joblib     # Serialized trained model artifact (0.15 MB)
    │   │   └── model_metadata.json     # Model metrics, feature importances, and metadata
    │   ├── optimization/
    │   │   ├── __init__.py             # PuLP optimization package exports (OptimizationService, models)
    │   │   ├── config.py               # Operational assumptions, default costs ($/kWh), carbon factors
    │   │   ├── models.py               # Pydantic models: BatteryState, OptimizationInput, EnergyAllocation, OptimizationResult
    │   │   ├── optimizer.py            # MicrogridOptimizer formulating single-period LP via PuLP/CBC
    │   │   └── service.py              # OptimizationService orchestrating linear programming dispatch
    │   ├── integration/
    │   │   ├── __init__.py             # Integration package exports (GridMindIntegrationService, models, exceptions)
    │   │   ├── exceptions.py           # IntegrationError, InsufficientHistoryError, ForecastingPipelineError, OptimizationDispatchError
    │   │   ├── models.py               # Pydantic schemas: ForecastDispatchInput/Result, Horizon24hDispatchInput/Result, HourlyDispatchStep, DailyDispatchSummary
    │   │   └── service.py              # GridMindIntegrationService coordinating ML forecaster and PuLP optimizer
    │   ├── simulation/
    │   │   └── __init__.py             # Renewable physics and baseline placeholder (Phase 8)
    │   ├── utils/
    │   │   └── __init__.py             # Shared utility package placeholder
    │   └── data/
    │       ├── raw/
    │       │   ├── .gitkeep
    │       │   ├── README.md           # Instructions for placing user dataset
    │       │   └── household_power_consumption.txt # [REAL USER DATASET] 2,075,259 records (126.8 MB)
    │       └── processed/
    │           ├── .gitkeep
    │           ├── README.md           # Instructions for standardized outputs
    │           └── processed_energy_demand.csv     # [CLEAN HOURLY DATASET] 34,589 records (1.38 MB)
    └── tests/
        ├── __init__.py                 # Test package init
        ├── test_health.py              # Root and health endpoint integration tests
        ├── test_data_preprocessor.py   # Unit tests for inspection, mapping, power conversion, and integrity
        ├── test_ml_forecaster.py       # Unit tests for feature pipeline, anti-leakage, and 24h forecasting
        ├── test_optimization_engine.py # Unit tests for PuLP single-period LP optimization engine
        └── test_forecast_dispatch_integration.py # Unit tests for AI forecast & dispatch integration layer
```

---

## 7. Development Phases

| Phase | Description | Status | Details & Notes |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Architecture & Requirements Planning | **COMPLETED** | Complete 17-part architecture blueprint, mathematical formulations, and stack finalized. |
| **Phase 2** | Project Foundation & Data Architecture | **COMPLETED** | FastAPI server running, typed Pydantic schemas created, flexible data preprocessor with column auto-detection and adaptive `DatasetInspectionReport` implemented and tested. |
| **Phase 3A** | Project Continuity & Handoff System | **COMPLETED** | `PROJECT_CONTEXT.md` established as permanent development memory across Antigravity accounts. |
| **Phase 3B** | Real Dataset Acquisition | **COMPLETED** | Real dataset (`household_power_consumption.txt`, 2,075,259 records, 126.8 MB) manually provided by user in `backend/app/data/raw/`. |
| **Phase 4** | Real Dataset Inspection & Preprocessing | **COMPLETED** | Full dataset profiled; split Date/Time parsed; active power in kW converted to hourly energy in kWh; 1.25% nulls cleanly interpolated; 34,589 continuous hourly records exported to `data/processed/processed_energy_demand.csv`. |
| **Phase 5** | Machine Learning Demand Forecasting | **COMPLETED** | Feature pipeline (25 features), chronological train/val/test splits, baseline comparison, model selection (`HistGradientBoostingRegressor`), evaluation (Test MAE: 0.3149 kWh, 37.4% improvement over baseline), permutation feature importance, model serialization (`demand_model.joblib`), and 24-step forecasting implemented. 17/17 tests pass. |
| **Phase 6** | Microgrid Energy Optimization Engine | **COMPLETED** | PuLP LP formulation (COIN-OR CBC solver), non-negative continuous variables, energy balance equality, battery deliverability bounds, 3 optimization modes (Economy, Green, Balanced with dynamic dimensionless normalization), and mode-consistent unmet penalties. 10/10 tests pass (27 total). |
| **Phase 7** | AI Forecast & Microgrid Dispatch Integration | **COMPLETED** | Created independent orchestration layer (`backend/app/integration/`) strictly decoupled from `app.ml` and `app.optimization`. Implemented single-hour and 24-hour sequential horizon dispatch with exact thermodynamic battery SoC accounting. 11/11 tests pass (36 total). |
| **Phase 8** | Renewable Energy Simulation & Benchmarking | **NOT STARTED** | Solar clear-sky zenith physics, wind aerodynamic curves, and traditional greedy reactive controller baseline. |
| **Phase 9** | Backend Integration & Simulation API | **NOT STARTED** | Implement `POST /api/v1/simulate/run` connecting ML forecaster, physics engine, PuLP solver, reactive baseline, and explainability engine. |
| **Phase 10** | Frontend Operational Dashboard | **NOT STARTED** | React 18 + Vite + Tailwind CSS dashboard with Recharts 24-hour area chart, battery dynamics, and KPI comparative metrics. |
| **Phase 11** | Scenario Simulator & Pitch Polish | **NOT STARTED** | Interactive scenario controls (weather presets, demand surges, diesel price shocks), stress testing, and demo polish. |

---

## 8. Implemented Features

### Actually Implemented (Verified):
* [x] **FastAPI Core Application** (`backend/app/main.py`): Root endpoint (`/`) and health check (`/health`) with CORS middleware.
* [x] **Centralized Configuration System** (`backend/app/config.py`): Typed application, microgrid asset, and ML settings via `pydantic-settings`.
* [x] **Energy Data Contracts** (`backend/app/schemas/`): `demand.py`, `renewables.py`, `microgrid.py`.
* [x] **Real Dataset Ingestion & Preprocessing Pipeline** (`backend/app/services/data_preprocessor.py` & `run_preprocessing.py`):
  * Ingested 2,075,259 raw records, parsed dates/times, interpolated 1.25% missing records, converted active power to hourly energy, exported 34,589 clean hourly records (`processed_energy_demand.csv`).
* [x] **Machine Learning Demand Forecasting Module** (`backend/app/ml/` & `backend/app/models/`):
  * **Feature Engineering** (`features.py`): 25 features including calendar (`hour`, `day_of_week`, `day_of_month`, `month`, `is_weekend`), cyclical diurnal/weekly/monthly sine/cosine encodings, autoregressive lags ($1, 2, 3, 24, 48, 168$), and rolling window statistics ($6\text{h}, 24\text{h}$ mean, std, max, min).
  * **Anti-Data-Leakage**: All lags and rolling statistics strictly shifted $t \ge 1$; chronological forward splitting (no random shuffling).
  * **Baseline Evaluation**: Compared against Naive lag-1 and Seasonal lag-24 baselines.
  * **Model Training & Selection** (`train.py`): Trained and evaluated `RandomForestRegressor` and `HistGradientBoostingRegressor`. Selected `HistGradientBoostingRegressor` based on superior Validation RMSE (0.5348 vs 0.5400) and rapid training time (1.95s).
  * **Evaluation Metrics on Final Held-Out Test Set**:
    * Test MAE: **0.3149 kWh** (vs. Seasonal Lag-24 Baseline 0.5028 kWh -> **37.37% improvement**).
    * Test RMSE: **0.4579 kWh** (vs. Seasonal Lag-24 Baseline 0.7489 kWh -> **38.86% improvement**).
    * Test MAPE: **42.48%** (vs. Seasonal Lag-24 Baseline 65.89%).
  * **Feature Importance Analysis**: Identified top drivers (`lag_1`: 0.8893, `sin_hour`: 0.0354, `cos_hour`: 0.0319, `hour`: 0.0289, `lag_2`: 0.0108, `lag_168`: 0.0092).
  * **Model Serialization**: Saved artifact `demand_model.joblib` (0.15 MB) and `model_metadata.json`.
  * **Recursive 24-Hour Inference** (`predictor.py`): `DemandPredictor.forecast_24h` generates multi-step 24-hour demand predictions recursively from historical data buffers.
* [x] **Microgrid Energy Optimization Engine (PuLP LP)** (`backend/app/optimization/`):
  * Single-period Linear Programming (LP) dispatch engine solved via bundled COIN-OR CBC solver.
  * Real continuous decision variables: Solar, Wind, Battery, Grid, Diesel, and Unmet Demand slack.
  * Energy balance constraint ensuring demand satisfaction with slack penalty.
  * Two-stage electrochemical and inverter rate battery deliverability modeling.
  * Three operational modes: Economy ($), Green (kg CO2), and Balanced (dimensionless normalized composite).
  * Mode-consistent unmet demand penalty guaranteeing physical capacity is 100% preferred before unserved load.
  * Derived unused clean energy tracking (`unused_solar_kwh`, `unused_wind_kwh`).
  * Dedicated CLI demonstration script (`run_optimization_demo.py`) covering 6 operational scenarios.
* [x] **AI Forecast & Microgrid Dispatch Integration Layer** (`backend/app/integration/`):
  * **Strict Decoupling**: Orchestration layer coordinates `app.ml` and `app.optimization` without either package importing the other.
  * **Live Single-Hour Dispatch** (`dispatch_next_hour`): Predicts demand for $t+1$ using `DemandPredictor.forecast_24h(..., horizon_hours=1)` and solves LP via `OptimizationService.optimize_step(...)`.
  * **24-Hour Horizon Dispatch** (`dispatch_24h_horizon`): Queries `DemandPredictor.forecast_24h(..., horizon_hours=24)` **once upfront**, then sequentially simulates hours 1–24 optimizing energy allocation and tracking battery depletion.
  * **Thermodynamic Battery SoC Accounting**: Updates state of charge using $\text{SoC}_{t+1} = \text{SoC}_t - \frac{x_{\text{battery}}}{C_{\text{bat}} \cdot \eta_{\text{dis}}}$, clamped to $[\text{SoC}_{\min}, 1.0]$.
  * **Domain-Specific Exceptions** (`exceptions.py`): `IntegrationError`, `InsufficientHistoryError`, `ForecastingPipelineError`, `OptimizationDispatchError`.
  * **Automated Integration Tests** (`backend/tests/test_forecast_dispatch_integration.py`): 11 tests covering single-step, 24h horizon, energy conservation, SoC bounds, mode propagation, history validation, error translation, and architectural isolation.
  * **CLI Demonstration** (`backend/app/services/run_integration_demo.py`): Demonstrates single-hour and 24-hour horizon simulation using real historical demand context.

### Planned (NOT Implemented Yet):
* [ ] Renewable physics models (solar zenith, wind power curve) (Phase 8).
* [ ] Heuristic reactive baseline engine (Phase 8).
* [ ] Deterministic rule-based explainability engine (Phase 9).
* [ ] REST simulation endpoints (Phase 9).
* [ ] React frontend, UI components, and charts (Phase 10).
* [ ] MongoDB connection or database persistence (Optional).

---

## 9. Phase 5 Machine Learning Technical Details

1. **Processed Dataset Used**: `backend/app/data/processed/processed_energy_demand.csv` (34,589 hourly records, 4 years).
2. **Problem Definition**: Supervised time-series regression predicting continuous hourly load ($y_t \in \mathbb{R}^+$).
3. **Target Variable**: `energy_demand_kwh`.
4. **Features Created (25 total)**:
   * Calendar (5): `hour`, `day_of_week`, `day_of_month`, `month`, `is_weekend`.
   * Cyclical (6): `sin_hour`, `cos_hour`, `sin_dow`, `cos_dow`, `sin_month`, `cos_month`.
   * Autoregressive Lags (6): `lag_1`, `lag_2`, `lag_3`, `lag_24`, `lag_48`, `lag_168`.
   * Rolling Windows (8): `rolling_mean_6h`, `rolling_std_6h`, `rolling_max_6h`, `rolling_min_6h`, `rolling_mean_24h`, `rolling_std_24h`, `rolling_max_24h`, `rolling_min_24h`.
5. **Anti-Data-Leakage Strategy**:
   * All lags are derived using `.shift(lag)` where $lag \ge 1$.
   * Rolling windows are derived using `.shift(1).rolling(w)`.
   * Chronological splitting: strictly temporal forward ordering without random shuffling.
6. **Data Splits**:
   * Train (70%): 24,094 records (`2006-12-23 17:00:00` to `2009-09-22 14:00:00`).
   * Validation (15%): 5,163 records (`2009-09-22 15:00:00` to `2010-04-25 17:00:00`).
   * Test (15%): 5,164 records (`2010-04-25 18:00:00` to `2010-11-26 21:00:00`).
7. **Baseline Performance (Test Set)**:
   * Naive (Lag-1): MAE = 0.3725 kWh, RMSE = 0.5745 kWh, MAPE = 44.78%.
   * Seasonal (Lag-24): MAE = 0.5028 kWh, RMSE = 0.7489 kWh, MAPE = 65.89%.
8. **Candidate ML Models Evaluated (Validation Set)**:
   * `RandomForestRegressor`: MAE = 0.3704 kWh, RMSE = 0.5400 kWh (trained in 7.01s).
   * `HistGradientBoostingRegressor`: MAE = 0.3694 kWh, RMSE = 0.5348 kWh (trained in 1.95s).
9. **Selected Model**: `HistGradientBoostingRegressor` (superior validation accuracy and faster execution).
10. **Final Test Performance**:
    * Test MAE: **0.3149 kWh** (37.37% improvement over Seasonal Baseline).
    * Test RMSE: **0.4579 kWh** (38.86% improvement over Seasonal Baseline).
    * Test MAPE: **42.48%**.
11. **Permutation Feature Importance (Top 5)**:
    * `lag_1`: 0.8893 (immediate previous hour observation).
    * `sin_hour`: 0.0354 (diurnal load cycle).
    * `cos_hour`: 0.0319.
    * `hour`: 0.0289.
    * `lag_2`: 0.0108.
12. **Model Storage**: `backend/app/models/demand_model.joblib` and `backend/app/models/model_metadata.json`.
13. **Inference Architecture**: `DemandPredictor` in `backend/app/ml/predictor.py` generates iterative 24-step multi-horizon forecasts by updating the rolling history buffer with each consecutive step's prediction.
14. **Tests Run**: 17 tests passed in 3.37 seconds.

---

## 10. Phase 6 Microgrid Energy Optimization Engine Technical Details

1. **Optimization Library & Solver**: `PuLP` (v3.3.2) utilizing the bundled `COIN-OR CBC` open-source solver.
2. **Problem Classification**: Single-period Linear Programming (LP) continuous minimization problem.
3. **Decision Variables**: All non-negative continuous real variables ($x \ge 0$) representing kWh dispatched over a 1-hour interval ($\Delta t = 1.0\text{ h}$):
   * $x_{\text{solar}}$: Solar PV power utilized (kWh)
   * $x_{\text{wind}}$: Wind turbine power utilized (kWh)
   * $x_{\text{battery}}$: Battery discharge power delivered to load (kWh)
   * $x_{\text{grid}}$: Utility grid imported power (kWh)
   * $x_{\text{diesel}}$: Diesel generator power utilized (kWh)
   * $x_{\text{unmet}}$: Unserved demand slack variable (kWh)
4. **Energy Balance Equality Constraint**:
   $$x_{\text{solar}} + x_{\text{wind}} + x_{\text{battery}} + x_{\text{grid}} + x_{\text{diesel}} + x_{\text{unmet}} = D$$
   Guarantees that total dispatched energy plus unserved load exactly equals target demand $D$.
5. **Capacity Bounds**:
   $$0 \le x_s \le \text{Availability}_s, \quad \forall s \in \{\text{solar}, \text{wind}, \text{grid}, \text{diesel}\}$$
6. **Battery Deliverability Accounting**:
   * Usable storage based on SoC floor: $E_{\text{stored, usable}} = \max(0, \text{SoC} - \text{SoC}_{\min}) \cdot C_{\text{bat}}$.
   * Deliverable energy after discharge efficiency: $E_{\text{deliverable}} = E_{\text{stored, usable}} \cdot \eta_{\text{dis}}$.
   * Inverter maximum throughput: $E_{\text{inverter}} = P_{\text{dis, max}} (\text{kW}) \times 1.0\text{ h}$.
   * Upper bound: $B_{\text{deliverable}} = \min(E_{\text{deliverable}}, E_{\text{inverter}})$.
   * Constraint: $0 \le x_{\text{battery}} \le B_{\text{deliverable}}$.
7. **Cost & Carbon Models (Configurable Assumptions)**:
   * Defaults: Solar ($0, 0 kg), Wind ($0, 0 kg), Battery ($0.025/kWh degradation, 0 kg), Grid ($0.15/kWh, 0.45 kg/kWh), Diesel ($0.45/kWh, 0.72 kg/kWh).
   * Explicitly labeled as **CONFIGURABLE ASSUMPTIONS**; fully overridable per dispatch instance.
8. **Multi-Objective Formulation & Presets**:
   * **Economy Mode**: $\min \sum c_s x_s + P_{\text{unmet}} x_{\text{unmet}}$
   * **Green Mode**: $\min \sum e_s x_s + P_{\text{unmet}} x_{\text{unmet}}$
   * **Balanced Mode**: Dimensionless dynamic normalization using worst-case single-source (100% diesel) baselines:
     $$\min \sum_s \left( \frac{w_{\text{cost}} \cdot c_s}{\text{denom}_C} + \frac{w_{\text{carbon}} \cdot e_s}{\text{denom}_E} \right) x_s + P_{\text{unmet}} x_{\text{unmet}}$$
     where $\text{denom}_C = \max(c_{\text{diesel}} \cdot D, 10^{-6})$ and $\text{denom}_E = \max(e_{\text{diesel}} \cdot D, 10^{-6})$.
9. **Mode-Consistent Unmet Demand Penalty Strategy**:
   * Let $k_{\max, \text{mode}} = \max_s(k_{s, \text{mode}})$ be the maximum active physical objective coefficient.
   * If $k_{\max} > 10^{-6}$: $P_{\text{unmet, mode}} = 1000.0 \times k_{\max}$.
   * If $k_{\max} \le 10^{-6}$ (zero-coefficient fallback): $P_{\text{unmet, mode}} = 1000.0$.
   * Guarantees all available physical assets are strictly preferred ($1,000\times$ cheaper/cleaner) before unserved load occurs.
10. **Zero Demand Handling**:
    * If $D \le 10^{-6}\text{ kWh}$, optimizer immediately returns exact zero allocations, zero costs/emissions, and status "Optimal" without solver invocation, eliminating division by zero.
11. **Derived Renewable Utilization**:
    * Computes post-solve unused clean energy: $\text{unused\_solar} = S_{\text{avail}} - x_{\text{solar}}^*$, $\text{unused\_wind} = W_{\text{avail}} - x_{\text{wind}}^*$.
12. **Decoupled Architecture**:
    * Optimizer receives demand as dynamic floating-point input in `OptimizationInput`.
    * No imports of `app.ml` exist inside `app.optimization`.
13. **Demonstration Scenarios**: Verified across 6 operational scenarios via `python -m app.services.run_optimization_demo`.
14. **Tests**: 10 automated unit and behavioral tests in `tests/test_optimization_engine.py`. Full test suite: 27 passed in 4.05s.
15. **Known Limitations**:
    * Single-period 1-hour horizon (multi-period dynamic battery charging and state-of-charge transitions are deferred to Phase 7/8).
    * Fixed linear degradation cost assumption for battery throughput.

---

## 11. Phase 7 AI Forecast & Microgrid Dispatch Integration Technical Details

1. **Architecture & Strict Decoupling**:
   * `app.ml` and `app.optimization` are strictly decoupled and never import one another.
   * All coordination is performed exclusively by `GridMindIntegrationService` in `backend/app/integration/service.py`.
   * Unit test `test_11_architectural_isolation_no_cross_imports` directly inspects the source code of both packages to strictly enforce this boundary.
2. **Data Flow**:
   * Historical Demand Buffer ($\ge 168\text{ continuous hours}$) $\longrightarrow$ `DemandPredictor.forecast_24h` $\longrightarrow$ AI Predicted Demand $\longrightarrow$ Hourly LP Optimization (`OptimizationService.optimize_step`) $\longrightarrow$ Energy Dispatch & Battery State Update.
3. **ML Forecasting Integration**:
   * **Single-Hour Dispatch** (`dispatch_next_hour`): Passes `horizon_hours=1` to `DemandPredictor.forecast_24h` to obtain the immediate next hour load forecast $\hat{D}_{t+1}$.
   * **24-Hour Horizon Dispatch** (`dispatch_24h_horizon`): Calls `DemandPredictor.forecast_24h(historical_df, horizon_hours=24)` **exactly once upfront**. The ML model is never called redundantly 24 times. The returned 24 hourly predictions feed into a sequential 24-step optimization loop.
   * Demand forecasts are generated dynamically by the trained `HistGradientBoostingRegressor` model from real historical consumption context (`processed_energy_demand.csv`). Zero synthetic demand values are fabricated.
4. **Microgrid Asset Availability Modeling**:
   * Microgrid asset availability (solar, wind, grid, diesel) is strictly provided as validated application inputs (`HourlyAssetAvailability` per hour or lists of 24 values).
   * **Zero synthetic/fake CSV files or simulated asset availability datasets were created or stored.**
   * Configurable demo assumptions are clearly designated as **CONFIGURABLE DEMO ASSUMPTIONS** in all scripts and reports.
5. **Battery Sequential Thermodynamic Accounting**:
   * In Phase 6, $x_{\text{battery}}$ represents deliverable electrical energy supplied to the microgrid load.
   * Given discharge efficiency $\eta_{\text{dis}} < 1.0$, the electrochemical energy drawn from the battery storage is $\frac{x_{\text{battery}}}{\eta_{\text{dis}}}$.
   * Sequential state-of-charge progression across each hour $t$ to $t+1$:
     $$\text{SoC}_{t+1} = \text{SoC}_t - \frac{x_{\text{battery}, t}}{C_{\text{bat}} \cdot \eta_{\text{dis}}}$$
   * Clamped to safe operational bounds:
     $$\text{SoC}_{t+1} = \min\left(1.0, \, \max\left(\text{SoC}_{\min}, \, \text{SoC}_{t+1}\right)\right)$$
   * Guarantees thermodynamic rigor, avoids double-counting efficiency, and ensures battery SoC never falls below $\text{SoC}_{\min}$.
6. **Result Structure & Serialization**:
   * `ForecastDispatchResult`: Clearly separates `forecast` (`ForecastInfo`) from `optimization` (`OptimizationResult`).
   * `Horizon24hDispatchResult`: Contains an array of 24 `HourlyDispatchStep` items plus daily summary aggregates (`DailyDispatchSummary`): total load, total generation, solar/wind/battery/grid/diesel totals, daily operational cost, total emissions, starting/ending SoC, and clean energy share.
7. **Domain-Specific Exception Hierarchy** (`app/integration/exceptions.py`):
   * `IntegrationError` (base exception)
   * `InsufficientHistoryError` (raised when historical records $< 168$)
   * `ForecastingPipelineError` (wraps ML prediction failures)
   * `OptimizationDispatchError` (wraps LP formulation/solver failures)
8. **Demonstration Script** (`backend/app/services/run_integration_demo.py`):
   * Executable via `python -m app.services.run_integration_demo`.
   * Ingests 200 real historical records from `processed_energy_demand.csv`.
   * Runs live single-hour dispatch (latency ~131ms).
   * Runs 24-hour sequential horizon simulation (latency ~1.05s, battery depletes cleanly from 70.0% to 26.4%, 0 unmet load, 100% clean energy share).
9. **Verification & Test Suite**:
   * 11 dedicated integration tests in `backend/tests/test_forecast_dispatch_integration.py`.
   * Total backend test suite: **36 passed in ~8.0 seconds** (`pytest`).
10. **Important Technical Limitations & Scope Boundaries**:
    * ML demand forecasts come exclusively from the trained `HistGradientBoostingRegressor`.
    * Microgrid asset availability is a configurable input and is **NOT** automatically predicted.
    * Battery charging optimization (multi-period dynamic LP state variables) is **NOT** implemented in this phase; the 24-hour battery behavior is a sequential discharge simulation.
    * No external APIs, cloud services, or simulated CSV datasets are used.

---

## 12. Commands to Run the Project

All commands must be executed from the `gridmind-ai/backend` directory.

### 1. Install Dependencies
```bash
cd "gridmind-ai/backend"
pip install -r requirements.txt
```

### 2. Run Dataset Preprocessing
```bash
python -m app.services.run_preprocessing
```

### 3. Train Machine Learning Demand Forecasting Model
```bash
python -m app.ml.train
```

### 4. Run Microgrid Optimization Demonstration
```bash
python -m app.services.run_optimization_demo
```

### 5. Run AI Forecast & Dispatch Integration Demonstration
```bash
python -m app.services.run_integration_demo
```

### 6. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`
* Health Endpoint: `http://localhost:8000/health`

### 7. Run Automated Tests
```bash
python -m pytest
```
*Current test status: 36 passed in ~8.0 seconds.*

---

---

## 12. Phase 8 Architecture — Backend REST API & AI Microservice Layer

### Core Architecture & Responsibilities
Phase 8 exposes the trained ML demand forecasting model and PuLP optimization engine as a production-grade, asynchronous FastAPI REST API microservice under `/api/v1`:

```
Client HTTP Request
       │
       ▼
FastAPI Router (/api/v1)
       │
       ├─► Dependency Injection (`app.api.deps`)
       │     ├─ get_predictor() -> DemandPredictor (singleton)
       │     ├─ get_optimization_service() -> OptimizationService (singleton)
       │     ├─ get_integration_service() -> GridMindIntegrationService (singleton)
       │     └─ get_default_history_df() -> 200-hour historical slice (.copy())
       │
       ├─► Shared Historical Telemetry Processing (`app.api.history`)
       │     ├─ Minimum 168 records check (HTTP 400)
       │     ├─ Unique timestamp validation (HTTP 422)
       │     ├─ Chronological sorting
       │     └─ Strict 1-hour continuity check (HTTP 422)
       │
       ├─► Thin API Controllers (`app.api.v1.endpoints`)
       │     ├─ health.py   (GET /api/v1/health)
       │     ├─ model.py    (GET /api/v1/model/info)
       │     ├─ forecast.py (POST /api/v1/forecast/next-hour, POST /api/v1/forecast/24h)
       │     └─ dispatch.py (POST /api/v1/dispatch/next-hour, POST /api/v1/dispatch/24h)
       │
       └─► Centralized Exception Handlers (`app.api.handlers`)
             ├─ InsufficientHistoryError -> HTTP 400 (INSUFFICIENT_HISTORY)
             ├─ ModelLoadError           -> HTTP 503 (MODEL_UNAVAILABLE)
             ├─ ForecastingPipelineError -> HTTP 500 (FORECASTING_PIPELINE_ERROR)
             ├─ OptimizationDispatchError-> HTTP 500 (OPTIMIZATION_DISPATCH_ERROR)
             ├─ PredictionError          -> HTTP 500 (PREDICTION_ERROR)
             ├─ FeatureEngineeringError  -> HTTP 500 (FEATURE_ENGINEERING_ERROR)
             ├─ IntegrationError         -> HTTP 500 (INTEGRATION_ERROR)
             ├─ DataValidationError      -> HTTP 422 (DATA_VALIDATION_ERROR)
             ├─ DataProcessingError      -> HTTP 500 (DATA_PROCESSING_ERROR)
             └─ Exception (fallback)     -> HTTP 500 (INTERNAL_SERVER_ERROR)
```

### Key Architectural Standards & Invariants
1. **API Versioning**: All production routes are namespaced under `/api/v1`. Root `/` and `/health` endpoints are maintained for backward compatibility and container health probes.
2. **Thin Controllers**: Route handlers contain zero ML feature engineering, PuLP linear programming formulations, or battery thermodynamic math. Controllers strictly validate HTTP schemas, resolve historical context, delegate to injected services, measure dynamic latency via `time.perf_counter()`, and return typed responses.
3. **Dependency Injection**: Singleton providers use `@lru_cache()` to prevent unpickling ML models or re-instantiating solvers per request. `get_default_history_df()` returns an isolated `.copy()` of the 200-hour historical baseline to guarantee immutable in-memory state.
4. **All 8 Implemented Application Endpoints**:
   * `GET /`: Service root status banner.
   * `GET /health`: High-availability container uptime probe.
   * `GET /api/v1/health`: Detailed diagnostic health check (`model_loaded`, `dataset_available`).
   * `GET /api/v1/model/info`: Forecasting model architecture, feature columns, training sample count, and top 5 feature importances.
   * `POST /api/v1/forecast/next-hour`: Immediate next-hour electricity demand forecast (kWh).
   * `POST /api/v1/forecast/24h`: 24-hour recursive forward load trajectory (exactly 24 steps).
   * `POST /api/v1/dispatch/next-hour`: Live single-hour AI demand forecast combined with LP microgrid dispatch.
   * `POST /api/v1/dispatch/24h`: 24-hour sequential forecast and LP dispatch horizon simulation.
5. **Asset Availability Strategies**:
   * **Strategy A**: Structured 24-element list of `HourlyAssetAvailability` objects with sequential `hour_number` (1 to 24).
   * **Strategy B**: Dual 24-element numeric arrays (`solar_profile_kwh` and `wind_profile_kwh`).
   * **Strategy C**: Default demonstration availability when both A and B are omitted.
   * Pydantic validators strictly enforce mutual exclusivity of Strategy A and Strategy B.
6. **Shared History Validation & Continuity**:
   * Minimum buffer length: 168 records (1 full week for lag-168 seasonal feature).
   * All timestamps must be unique.
   * Must be sorted chronologically.
   * Must have strictly continuous 1-hour intervals (consecutive timestamp diff == 1 hour; gaps return HTTP 422).
7. **Structured Error Handling (`ErrorResponse` & `ErrorDetail`)**:
   * Domain errors return JSON envelopes conforming to `{"detail": {"error_code": "...", "message": "..."}}`.
   * Standard FastAPI validation error behavior (`HTTPException`, `RequestValidationError`) is preserved.
8. **OpenAPI & Swagger Documentation**:
   * Interactive documentation available at `/docs` (Swagger UI) and `/redoc`.
   * Complete OpenAPI 3.1.0 specification at `/openapi.json` indexing all 8 routes, schemas, and error responses.

---

## 13. Commands to Run the Project

All commands must be executed from the `gridmind-ai/backend` directory.

### 1. Install Dependencies
```bash
cd "gridmind-ai/backend"
pip install -r requirements.txt
```

### 2. Run Dataset Preprocessing
```bash
python -m app.services.run_preprocessing
```

### 3. Train Machine Learning Demand Forecasting Model
```bash
python -m app.ml.train
```

### 4. Run Microgrid Optimization Demonstration
```bash
python -m app.services.run_optimization_demo
```

### 5. Run AI Forecast & Dispatch Integration Demonstration
```bash
python -m app.services.run_integration_demo
```

### 6. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`
* OpenAPI JSON Specification: `http://localhost:8000/openapi.json`
* Health Endpoint: `http://localhost:8000/health`
* Diagnostic Health: `http://localhost:8000/api/v1/health`

### 7. Run Automated Tests
```bash
python -m pytest
```
*Current test status: 62 passed in ~10.0 seconds (1,311 third-party dependency warnings).*

---

## 14. Current Status

* **Current Phase**: **PHASE 8 — REST API & AI MICROSERVICE LAYER**
* **Phase Status**: **COMPLETED**
* **System Health**: Production FastAPI REST API layer fully implemented and verified; exposes baseline health, model metadata, forward load forecasting, and microgrid LP dispatch optimization; centralized domain exception handling and OpenAPI documentation verified; 100% automated test pass rate (**62/62 tests passing**).

---

## 15. Next Required Action

> **PROCEED TO PHASE 9 — INTERACTIVE SCADA DASHBOARD & SCENARIO STUDIO (FRONTEND).**  
> In Phase 9:
> 1. Build the modern industrial dark-mode React dashboard connecting to the `/api/v1` REST API.
> 2. Implement interactive 24-hour multi-asset dispatch charts (Solar, Wind, Battery, Grid, Diesel, Unmet load).
> 3. Implement interactive scenario perturbators (weather shocks, demand surge, battery degradation, diesel fuel price spikes).
> 4. Display live comparative KPIs (GridMind AI optimal dispatch vs. traditional reactive heuristic controller).

---

## 16. Instructions for a New AI Agent

When continuing this project under a new session or different Antigravity account, follow this checklist:
1. **Read `PROJECT_CONTEXT.md` completely** before running commands or generating code.
2. **Review `README.md`** to maintain user-facing documentation alignment.
3. **Inspect the actual project structure** using directory listing tools; do not assume files exist without verifying.
4. **Determine the exact active phase**: Current phase completed is **Phase 8 (REST API & AI Microservice Layer)**. Next phase is **Phase 9 (Interactive SCADA Dashboard & Scenario Studio - Frontend)**.
5. **Never recreate completed work**: Data preprocessing, ML forecasting, PuLP optimization engine, integration orchestrator, and FastAPI REST API layer are completed, verified, and saved.
6. **Never alter the architecture** without a documented technical justification.
7. **Update `PROJECT_CONTEXT.md`** upon the completion of each development phase.


