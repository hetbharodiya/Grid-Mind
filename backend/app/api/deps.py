"""API Dependency Injection Providers for GridMind AI.

Provides cached singleton instances of core services (ML predictor,
optimization solver, and integration orchestrator) and a thread-safe
cached loader for default historical demand context.
"""

from functools import lru_cache
from pathlib import Path
import pandas as pd

from app.config import settings
from app.ml.predictor import DemandPredictor
from app.optimization.service import OptimizationService
from app.integration.service import GridMindIntegrationService


# ==============================================================================
# 1. Singleton Service Dependency Providers
# ==============================================================================

@lru_cache()
def get_predictor() -> DemandPredictor:
    """Provide a cached singleton instance of DemandPredictor.
    
    Avoids unpickling the model artifact on every HTTP request.
    """
    return DemandPredictor()


@lru_cache()
def get_optimization_service() -> OptimizationService:
    """Provide a cached singleton instance of OptimizationService."""
    return OptimizationService()


@lru_cache()
def get_integration_service() -> GridMindIntegrationService:
    """Provide a cached singleton instance of GridMindIntegrationService.
    
    Receives injected singleton instances of DemandPredictor and OptimizationService.
    """
    return GridMindIntegrationService(
        predictor=get_predictor(),
        optimizer=get_optimization_service(),
    )


# ==============================================================================
# 2. Historical Demand Context Loader (Safe Immutable Copy)
# ==============================================================================

@lru_cache()
def _load_default_history_df() -> pd.DataFrame:
    """Internal cached loader for real historical household consumption data.
    
    Loads and validates the processed dataset once, returning the last 200 continuous
    hourly records.
    """
    # 1. Resolve dataset path dynamically relative to backend/app/
    data_path = Path(__file__).resolve().parent.parent / "data" / "processed" / "processed_energy_demand.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Processed demand dataset not found at: {data_path}")

    # 2. Load dataset
    df = pd.read_csv(data_path)

    # 3. Validate required columns
    required_cols = {"timestamp", "energy_demand_kwh"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Processed dataset is missing required columns: {missing}")

    # 4. Parse timestamps and sort chronologically
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by="timestamp").reset_index(drop=True)

    # 5. Validate minimum history bounds
    min_required = settings.ml.MIN_HISTORICAL_HOURS
    if len(df) < min_required:
        raise ValueError(
            f"Processed dataset contains {len(df)} records, required at least {min_required}."
        )

    # 6. Return the last 200 continuous records for inference context
    return df.iloc[-200:].reset_index(drop=True)


def get_default_history_df() -> pd.DataFrame:
    """Public dependency providing an isolated, safe copy of the default historical demand DataFrame.
    
    Returning a copy guarantees that route handlers or callers cannot mutate
    the in-memory cached base DataFrame.
    """
    return _load_default_history_df().copy()
