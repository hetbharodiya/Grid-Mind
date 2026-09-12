"""Unit tests for FastAPI root and health check endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify that the root endpoint returns 200 OK and expected greeting."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "GridMind AI Backend is running"}


def test_health_endpoint():
    """Verify that the health check endpoint returns 200 OK and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
