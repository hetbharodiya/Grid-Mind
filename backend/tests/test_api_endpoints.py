"""Integration and Unit Tests for GridMind AI REST API Endpoints.

Tests baseline endpoints, health diagnostics, model metadata, and forward
demand forecasting endpoints (single-hour and 24-hour horizon).
"""

from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.api.deps import get_integration_service, get_predictor
from app.integration.exceptions import InsufficientHistoryError, OptimizationDispatchError
from app.ml.predictor import ModelLoadError

client = TestClient(app)


def _generate_valid_history(hours: int = 168, base_kwh: float = 1.5):
    """Helper to synthesize valid continuous historical demand records."""
    start = datetime(2023, 1, 1, 0, 0, 0)
    return [
        {
            "timestamp": (start + timedelta(hours=i)).isoformat(),
            "energy_demand_kwh": round(base_kwh + (i % 5) * 0.1, 4),
        }
        for i in range(hours)
    ]


# ==============================================================================
# Step 2 Baseline Tests
# ==============================================================================

def test_1_root_endpoint_backward_compatibility():
    """TEST 1: Verify that GET / returns HTTP 200 and unchanged greeting."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "GridMind AI Backend is running"}


def test_2_legacy_health_endpoint_backward_compatibility():
    """TEST 2: Verify that legacy GET /health returns HTTP 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_3_api_v1_health_endpoint():
    """TEST 3: Verify that GET /api/v1/health returns HTTP 200 with dynamic readiness."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "healthy"
    assert data["app_name"] == settings.app.APP_NAME
    assert data["version"] == settings.app.APP_VERSION
    assert data["model_loaded"] is True
    assert data["dataset_available"] is True


def test_4_api_v1_model_info_endpoint():
    """TEST 4: Verify that GET /api/v1/model/info returns HTTP 200 with verified metadata."""
    response = client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()

    assert data["model_type"] == "HistGradientBoostingRegressor"
    assert data["algorithm"] == "HistGradientBoostingRegressor"
    assert data["target_column"] == "energy_demand_kwh"
    assert data["feature_count"] == 25
    assert len(data["feature_columns"]) == 25
    assert data["feature_count"] == len(data["feature_columns"])
    assert data["total_records_trained_on"] == 24094

    # Metrics dictionary must be populated
    assert isinstance(data["metrics"], dict)
    assert "final_test_metrics" in data["metrics"]
    assert data["metrics"]["final_test_metrics"]["mae"] == 0.3149

    # Top feature importances must exist and contain exactly 5 features
    assert isinstance(data["top_feature_importances"], dict)
    assert len(data["top_feature_importances"]) == 5


def test_5_top_feature_importances_descending_order():
    """TEST 5: Verify that the 5 returned feature importances are sorted in descending order."""
    response = client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()

    importances = data["top_feature_importances"]
    values = list(importances.values())

    assert len(values) == 5
    assert values == sorted(values, reverse=True)
    # The top feature is lag_1 with score ~0.8893
    assert list(importances.keys())[0] == "lag_1"


# ==============================================================================
# Step 3 Forecast API Tests
# ==============================================================================

def test_6_forecast_next_hour_default_history():
    """TEST 6: Verify POST /api/v1/forecast/next-hour using default historical context."""
    response = client.post("/api/v1/forecast/next-hour", json={})
    assert response.status_code == 200
    data = response.json()

    assert data["predicted_demand_kwh"] >= 0.0
    assert isinstance(data["forecast_timestamp"], str)
    assert 0 <= data["hour"] <= 23
    assert 0 <= data["day_of_week"] <= 6
    assert data["model_type"] == "HistGradientBoostingRegressor"
    assert data["history_source"] == "default"
    assert data["history_records_used"] >= 168
    assert data["latency_ms"] >= 0.0


def test_7_forecast_next_hour_provided_history():
    """TEST 7: Verify POST /api/v1/forecast/next-hour using caller-provided historical data."""
    payload = {"historical_data": _generate_valid_history(hours=175)}
    response = client.post("/api/v1/forecast/next-hour", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["predicted_demand_kwh"] >= 0.0
    assert data["history_source"] == "provided"
    assert data["history_records_used"] == 175
    assert data["latency_ms"] >= 0.0


def test_8_forecast_24h_default_history():
    """TEST 8: Verify POST /api/v1/forecast/24h using default historical context."""
    response = client.post("/api/v1/forecast/24h", json={})
    assert response.status_code == 200
    data = response.json()

    assert data["horizon_hours"] == 24
    assert len(data["forecasts"]) == 24
    assert data["total_predicted_demand_kwh"] >= 0.0
    assert data["history_source"] == "default"
    assert data["history_records_used"] >= 168
    assert data["latency_ms"] >= 0.0

    # Verify first and last forecast items
    first_step = data["forecasts"][0]
    assert first_step["step"] == 1
    assert first_step["predicted_demand_kwh"] >= 0.0

    last_step = data["forecasts"][23]
    assert last_step["step"] == 24
    assert last_step["predicted_demand_kwh"] >= 0.0


def test_9_forecast_24h_provided_history():
    """TEST 9: Verify POST /api/v1/forecast/24h using caller-provided historical data."""
    payload = {"historical_data": _generate_valid_history(hours=168)}
    response = client.post("/api/v1/forecast/24h", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["horizon_hours"] == 24
    assert len(data["forecasts"]) == 24
    assert data["history_source"] == "provided"
    assert data["history_records_used"] == 168
    assert data["total_predicted_demand_kwh"] >= 0.0


def test_10_forecast_insufficient_history_error():
    """TEST 10: Verify that providing fewer than 168 records returns HTTP 400."""
    payload = {"historical_data": _generate_valid_history(hours=50)}
    response = client.post("/api/v1/forecast/next-hour", json=payload)
    assert response.status_code == 400
    detail = response.json().get("detail", "")
    assert "Insufficient historical data" in detail


def test_11_forecast_duplicate_timestamps_error():
    """TEST 11: Verify that providing duplicate timestamps returns HTTP 422."""
    history = _generate_valid_history(hours=168)
    # Inject duplicate timestamp
    history[1]["timestamp"] = history[0]["timestamp"]
    payload = {"historical_data": history}

    response = client.post("/api/v1/forecast/next-hour", json=payload)
    assert response.status_code == 422
    detail = response.json().get("detail", "")
    assert "duplicate" in detail.lower()


def test_12_forecast_negative_energy_demand_error():
    """TEST 12: Verify that negative energy_demand_kwh is rejected by Pydantic with HTTP 422."""
    history = _generate_valid_history(hours=168)
    history[0]["energy_demand_kwh"] = -2.5
    payload = {"historical_data": history}

    response = client.post("/api/v1/forecast/next-hour", json=payload)
    assert response.status_code == 422


def _generate_gapped_history(hours: int = 168, base_kwh: float = 1.5):
    """Helper to synthesize historical demand records with an intentional timestamp gap."""
    start = datetime(2023, 1, 1, 0, 0, 0)
    records = []
    current = start
    for i in range(hours):
        if i == 50:
            current += timedelta(hours=3)  # 3-hour gap
        else:
            current += timedelta(hours=1)
        records.append({
            "timestamp": current.isoformat(),
            "energy_demand_kwh": round(base_kwh + (i % 5) * 0.1, 4),
        })
    return records


def _generate_strategy_a_availability():
    """Helper to generate 24 hourly availability objects for Strategy A."""
    return [
        {
            "hour_number": h,
            "solar_available_kwh": 10.0 if 8 <= h <= 17 else 0.0,
            "wind_available_kwh": 5.0,
            "grid_available_kwh": 100.0,
            "diesel_available_kwh": 75.0,
        }
        for h in range(1, 25)
    ]


def test_13_forecast_non_continuous_timestamps_error():
    """TEST 13: Verify that historical data with gaps returns HTTP 422 on forecast."""
    payload = {"historical_data": _generate_gapped_history(hours=168)}
    response = client.post("/api/v1/forecast/next-hour", json=payload)
    assert response.status_code == 422
    detail = response.json().get("detail", "")
    assert "continuous hourly records" in detail.lower()


def test_14_dispatch_next_hour_default_history():
    """TEST 14: Verify POST /api/v1/dispatch/next-hour with default historical data and default assets."""
    response = client.post("/api/v1/dispatch/next-hour", json={})
    assert response.status_code == 200
    data = response.json()

    assert data["history_source"] == "default"
    assert data["history_records_used"] == 200
    assert data["forecast"]["predicted_demand_kwh"] > 0.0
    assert data["forecast"]["model_type"] == "HistGradientBoostingRegressor"
    assert data["optimization"]["solver_status"] == "Optimal"
    assert data["latency_ms"] >= 0.0
    assert 0.0 <= data["clean_energy_percentage"] <= 100.0

    # Verify energy balance equality
    alloc = data["optimization"]["allocations"]
    supplied = (
        alloc["solar_used_kwh"]
        + alloc["wind_used_kwh"]
        + alloc["battery_used_kwh"]
        + alloc["grid_used_kwh"]
        + alloc["diesel_used_kwh"]
    )
    predicted_demand = data["forecast"]["predicted_demand_kwh"]
    unmet = data["optimization"]["unmet_demand_kwh"]
    assert round(supplied + unmet, 2) == round(predicted_demand, 2)


def test_15_dispatch_next_hour_provided_history():
    """TEST 15: Verify POST /api/v1/dispatch/next-hour with caller-provided history and GREEN mode."""
    payload = {
        "historical_data": _generate_valid_history(hours=168),
        "solar_available_kwh": 12.0,
        "wind_available_kwh": 8.0,
        "mode": "green",
    }
    response = client.post("/api/v1/dispatch/next-hour", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["history_source"] == "provided"
    assert data["history_records_used"] == 168
    assert data["optimization"]["solver_status"] == "Optimal"
    assert data["clean_energy_percentage"] > 0.0


def test_16_dispatch_next_hour_insufficient_history_error():
    """TEST 16: Verify that providing < 168 records to dispatch returns HTTP 400."""
    payload = {"historical_data": _generate_valid_history(hours=80)}
    response = client.post("/api/v1/dispatch/next-hour", json=payload)
    assert response.status_code == 400
    detail = response.json().get("detail", "")
    assert "Insufficient historical data" in detail


def test_17_dispatch_next_hour_non_continuous_timestamps_error():
    """TEST 17: Verify that non-continuous historical timestamps to dispatch return HTTP 422."""
    payload = {"historical_data": _generate_gapped_history(hours=168)}
    response = client.post("/api/v1/dispatch/next-hour", json=payload)
    assert response.status_code == 422
    detail = response.json().get("detail", "")
    assert "continuous hourly records" in detail.lower()


def test_18_dispatch_24h_default_history_and_strategy_c():
    """TEST 18: Verify POST /api/v1/dispatch/24h with default history and demonstration availability (Strategy C)."""
    response = client.post("/api/v1/dispatch/24h", json={})
    assert response.status_code == 200
    data = response.json()

    assert len(data["hourly_steps"]) == 24
    assert len(data["battery_soc_trajectory"]) == 24
    assert data["history_source"] == "default"
    assert data["history_records_used"] == 200
    assert data["latency_ms"] >= 0.0

    summary = data["daily_summary"]
    assert summary["total_predicted_demand_kwh"] > 0.0
    assert summary["total_supplied_energy_kwh"] > 0.0
    assert summary["starting_battery_soc"] == 0.50
    assert 0.0 <= summary["ending_battery_soc"] <= 1.0


def test_19_dispatch_24h_strategy_a_hourly_availability():
    """TEST 19: Verify POST /api/v1/dispatch/24h with explicit Strategy A hourly availability array."""
    payload = {
        "hourly_availability": _generate_strategy_a_availability(),
        "mode": "balanced",
    }
    response = client.post("/api/v1/dispatch/24h", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["hourly_steps"]) == 24
    assert data["hourly_steps"][0]["hour_number"] == 1
    assert data["hourly_steps"][23]["hour_number"] == 24
    assert data["daily_summary"]["total_solar_used_kwh"] >= 0.0


def test_20_dispatch_24h_strategy_b_renewable_profiles():
    """TEST 20: Verify POST /api/v1/dispatch/24h with Strategy B (solar and wind 24h profiles)."""
    payload = {
        "solar_profile_kwh": [0.0] * 6 + [10.0] * 12 + [0.0] * 6,
        "wind_profile_kwh": [0.5] * 24,
        "grid_available_kwh": 50.0,
        "diesel_available_kwh": 25.0,
        "mode": "economy",
    }
    response = client.post("/api/v1/dispatch/24h", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["hourly_steps"]) == 24
    assert data["daily_summary"]["total_solar_used_kwh"] > 0.0
    assert data["daily_summary"]["total_wind_used_kwh"] > 0.0


def test_21_dispatch_24h_provided_history():
    """TEST 21: Verify POST /api/v1/dispatch/24h with caller-provided 168h historical context."""
    payload = {
        "historical_data": _generate_valid_history(hours=168),
        "solar_profile_kwh": [4.0] * 24,
        "wind_profile_kwh": [4.0] * 24,
    }
    response = client.post("/api/v1/dispatch/24h", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["history_source"] == "provided"
    assert data["history_records_used"] == 168
    assert len(data["hourly_steps"]) == 24


def test_22_dispatch_24h_strategy_a_and_b_mutually_exclusive_error():
    """TEST 22: Verify that providing both Strategy A and Strategy B returns HTTP 422."""
    payload = {
        "hourly_availability": _generate_strategy_a_availability(),
        "solar_profile_kwh": [5.0] * 24,
        "wind_profile_kwh": [5.0] * 24,
    }
    response = client.post("/api/v1/dispatch/24h", json=payload)
    assert response.status_code == 422


def test_23_dispatch_24h_strategy_b_incomplete_profiles_error():
    """TEST 23: Verify that providing only solar profile without wind profile returns HTTP 422."""
    payload = {
        "solar_profile_kwh": [5.0] * 24,
    }
    response = client.post("/api/v1/dispatch/24h", json=payload)
    assert response.status_code == 422


def test_24_dispatch_24h_strategy_a_invalid_length_error():
    """TEST 24: Verify that providing hourly_availability with length != 24 returns HTTP 422."""
    payload = {
        "hourly_availability": _generate_strategy_a_availability()[:10],
    }
    response = client.post("/api/v1/dispatch/24h", json=payload)
    assert response.status_code == 422


# ==============================================================================
# Step 5 Global Error Handling & OpenAPI Verification Tests
# ==============================================================================

def test_25_centralized_structured_error_handling():
    """TEST 25: Verify centralized structured error handling with ErrorResponse schema."""
    # Subtest A: InsufficientHistoryError -> HTTP 400 with structured detail
    class MockFailingHistoryIntegrationService:
        def dispatch_next_hour(self, *args, **kwargs):
            raise InsufficientHistoryError("Simulated insufficient history domain error.")

    app.dependency_overrides[get_integration_service] = lambda: MockFailingHistoryIntegrationService()
    try:
        response = client.post("/api/v1/dispatch/next-hour", json={})
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], dict)
        assert data["detail"]["error_code"] == "INSUFFICIENT_HISTORY"
        assert "Simulated insufficient history domain error." in data["detail"]["message"]
    finally:
        app.dependency_overrides.pop(get_integration_service, None)

    # Subtest B: OptimizationDispatchError -> HTTP 500 with structured detail
    class MockFailingOptimizerIntegrationService:
        def dispatch_next_hour(self, *args, **kwargs):
            raise OptimizationDispatchError("PuLP solver unbounded or infeasible.")

    app.dependency_overrides[get_integration_service] = lambda: MockFailingOptimizerIntegrationService()
    try:
        response = client.post("/api/v1/dispatch/next-hour", json={})
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], dict)
        assert data["detail"]["error_code"] == "OPTIMIZATION_DISPATCH_ERROR"
        assert "PuLP solver unbounded or infeasible." in data["detail"]["message"]
    finally:
        app.dependency_overrides.pop(get_integration_service, None)

    # Subtest C: ModelLoadError -> HTTP 503 with structured detail
    class MockFailingPredictor:
        def forecast_24h(self, *args, **kwargs):
            raise ModelLoadError("Model artifact pickle corrupted or missing.")

    app.dependency_overrides[get_predictor] = lambda: MockFailingPredictor()
    try:
        response = client.post("/api/v1/forecast/next-hour", json={})
        assert response.status_code == 503
        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], dict)
        assert data["detail"]["error_code"] == "MODEL_UNAVAILABLE"
        assert "Model artifact pickle corrupted or missing." in data["detail"]["message"]
    finally:
        app.dependency_overrides.pop(get_predictor, None)


def test_26_openapi_documentation_specification():
    """TEST 26: Verify OpenAPI specification completeness, endpoints, and tags."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    spec = response.json()

    # 1. Verify all 8 routes exist
    paths = spec.get("paths", {})
    expected_paths = [
        "/",
        "/health",
        "/api/v1/health",
        "/api/v1/model/info",
        "/api/v1/forecast/next-hour",
        "/api/v1/forecast/24h",
        "/api/v1/dispatch/next-hour",
        "/api/v1/dispatch/24h",
    ]
    for path in expected_paths:
        assert path in paths, f"Expected route '{path}' missing from OpenAPI specification."

    # 2. Verify HTTP methods
    assert "get" in paths["/"]
    assert "get" in paths["/health"]
    assert "get" in paths["/api/v1/health"]
    assert "get" in paths["/api/v1/model/info"]
    assert "post" in paths["/api/v1/forecast/next-hour"]
    assert "post" in paths["/api/v1/forecast/24h"]
    assert "post" in paths["/api/v1/dispatch/next-hour"]
    assert "post" in paths["/api/v1/dispatch/24h"]

    # 3. Collect all tags across endpoints
    all_tags = set()
    for path, methods in paths.items():
        for method, operation in methods.items():
            if isinstance(operation, dict) and "tags" in operation:
                all_tags.update(operation["tags"])

    # 4. Verify required tags exist
    expected_tags = {"General", "Monitoring", "AI Model", "Forecasting", "Microgrid Dispatch"}
    for tag in expected_tags:
        assert tag in all_tags, f"Expected OpenAPI tag '{tag}' not found in registered tags."
