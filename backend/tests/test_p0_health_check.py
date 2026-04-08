"""
Tests for P0-5: Health endpoint returns real infrastructure status.

The bug: GET /health always returned {"status": "healthy"} regardless of
whether the database or Redis were reachable. Railway routed traffic to a
completely broken backend, with no way to detect the failure.

The fix: health.py now probes both the database (SELECT 1) and Redis
(PING) on every call.
  - Database failure → HTTP 503, status="unhealthy"
  - Redis failure / unavailable → HTTP 200, status="degraded"
    (Redis is non-critical: cache.py is an empty stub)
  - Both healthy → HTTP 200, status="healthy"

Test strategy:
  - Build a minimal FastAPI test app with the health router mounted.
  - Patch _check_database and _check_redis at the module level so tests
    are isolated from real infrastructure and run deterministically.
  - Cover every documented status transition and all response fields.
"""
import pytest
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.health import router as health_router


# ---------------------------------------------------------------------------
# Shared test app — mounts only the health router to keep the client lean
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    app = FastAPI()
    app.include_router(health_router)
    return TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Helper — patch both probe functions for the duration of a single test
# ---------------------------------------------------------------------------

def _patched(db_result: str, redis_result: str):
    """Context manager that stubs _check_database and _check_redis."""
    return (
        patch("app.api.health._check_database", return_value=db_result),
        patch("app.api.health._check_redis", return_value=redis_result),
    )


# ---------------------------------------------------------------------------
# Status code contract
# ---------------------------------------------------------------------------

class TestHealthStatusCodes:

    def test_both_healthy_returns_200(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="ok"):
            r = client.get("/health")
        assert r.status_code == 200

    def test_db_error_returns_503(self, client):
        with patch("app.api.health._check_database", return_value="error: OperationalError"), \
             patch("app.api.health._check_redis", return_value="ok"):
            r = client.get("/health")
        assert r.status_code == 503

    def test_db_error_with_redis_ok_returns_503(self, client):
        with patch("app.api.health._check_database", return_value="error: TimeoutError"), \
             patch("app.api.health._check_redis", return_value="ok"):
            r = client.get("/health")
        assert r.status_code == 503

    def test_redis_unavailable_returns_200(self, client):
        """Redis outage must not trigger 503 — cache is a non-critical stub."""
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="unavailable"):
            r = client.get("/health")
        assert r.status_code == 200

    def test_redis_error_returns_200(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="error: TimeoutError"):
            r = client.get("/health")
        assert r.status_code == 200

    def test_both_failing_returns_503(self, client):
        with patch("app.api.health._check_database", return_value="error: OperationalError"), \
             patch("app.api.health._check_redis", return_value="unavailable"):
            r = client.get("/health")
        assert r.status_code == 503


# ---------------------------------------------------------------------------
# Status field values
# ---------------------------------------------------------------------------

class TestHealthStatusField:

    def test_both_ok_status_is_healthy(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="ok"):
            body = client.get("/health").json()
        assert body["status"] == "healthy"

    def test_db_ok_redis_unavailable_status_is_degraded(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="unavailable"):
            body = client.get("/health").json()
        assert body["status"] == "degraded"

    def test_db_ok_redis_error_status_is_degraded(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="error: TimeoutError"):
            body = client.get("/health").json()
        assert body["status"] == "degraded"

    def test_db_error_status_is_unhealthy(self, client):
        with patch("app.api.health._check_database", return_value="error: OperationalError"), \
             patch("app.api.health._check_redis", return_value="ok"):
            body = client.get("/health").json()
        assert body["status"] == "unhealthy"

    def test_both_failing_status_is_unhealthy(self, client):
        with patch("app.api.health._check_database", return_value="error: OperationalError"), \
             patch("app.api.health._check_redis", return_value="unavailable"):
            body = client.get("/health").json()
        assert body["status"] == "unhealthy"


# ---------------------------------------------------------------------------
# Response shape — all three fields must always be present
# ---------------------------------------------------------------------------

class TestHealthResponseShape:

    def test_response_contains_status_field(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="ok"):
            body = client.get("/health").json()
        assert "status" in body

    def test_response_contains_database_field(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="ok"):
            body = client.get("/health").json()
        assert "database" in body

    def test_response_contains_redis_field(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="ok"):
            body = client.get("/health").json()
        assert "redis" in body

    def test_database_field_propagates_check_result(self, client):
        with patch("app.api.health._check_database", return_value="error: OperationalError"), \
             patch("app.api.health._check_redis", return_value="ok"):
            body = client.get("/health").json()
        assert body["database"] == "error: OperationalError"

    def test_redis_field_propagates_check_result(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="unavailable"):
            body = client.get("/health").json()
        assert body["redis"] == "unavailable"

    def test_healthy_response_has_ok_fields(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="ok"):
            body = client.get("/health").json()
        assert body["database"] == "ok"
        assert body["redis"] == "ok"


# ---------------------------------------------------------------------------
# Probe isolation — _check_database and _check_redis are called every time
# ---------------------------------------------------------------------------

class TestHealthProbesAreCalled:

    def test_database_probe_is_called(self, client):
        with patch("app.api.health._check_database", return_value="ok") as mock_db, \
             patch("app.api.health._check_redis", return_value="ok"):
            client.get("/health")
        mock_db.assert_called_once()

    def test_redis_probe_is_called(self, client):
        with patch("app.api.health._check_database", return_value="ok"), \
             patch("app.api.health._check_redis", return_value="ok") as mock_redis:
            client.get("/health")
        mock_redis.assert_called_once()

    def test_probes_called_on_every_request(self, client):
        with patch("app.api.health._check_database", return_value="ok") as mock_db, \
             patch("app.api.health._check_redis", return_value="ok"):
            client.get("/health")
            client.get("/health")
        assert mock_db.call_count == 2
