"""
Tests for Audit Issue #10: CORS middleware too permissive.

The bug: allow_methods=["*"] allowed the TRACE method (cross-site tracing /
XST attack vector), and allow_headers=["*"] bypassed the CSRF protection
that Origin-checking affords by letting any request header through.

The fix: CORSMiddleware in main.py now specifies explicit method and header
allowlists:
  allow_methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
  allow_headers: Authorization, Content-Type, Accept, Origin
"""
import pytest
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Minimal test app replicating the updated CORS configuration
# ---------------------------------------------------------------------------

ALLOWED_ORIGIN = "http://localhost:5173"
DISALLOWED_ORIGIN = "http://evil.example.com"


def _build_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[ALLOWED_ORIGIN],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
    )

    @app.get("/data")
    def _data():
        return {"ok": True}

    return app


@pytest.fixture(scope="module")
def client():
    return TestClient(_build_app(), raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# Method allowlist tests
# ---------------------------------------------------------------------------

class TestAllowedMethods:

    def test_get_allowed(self, client):
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )
        assert "GET" in r.headers.get("access-control-allow-methods", "")

    def test_post_allowed(self, client):
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "POST",
            },
        )
        assert "POST" in r.headers.get("access-control-allow-methods", "")

    def test_delete_allowed(self, client):
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "DELETE",
            },
        )
        assert "DELETE" in r.headers.get("access-control-allow-methods", "")

    def test_trace_not_in_allowed_methods(self, client):
        """TRACE must not appear in the CORS allowlist (XST prevention)."""
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "TRACE",
            },
        )
        allowed = r.headers.get("access-control-allow-methods", "")
        assert "TRACE" not in allowed

    def test_allowed_methods_not_wildcard(self, client):
        """The method list must be explicit, not a bare '*'."""
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )
        allowed = r.headers.get("access-control-allow-methods", "")
        assert allowed.strip() != "*"


# ---------------------------------------------------------------------------
# Header allowlist tests
# ---------------------------------------------------------------------------

class TestAllowedHeaders:

    def test_authorization_header_allowed(self, client):
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
        )
        allowed = r.headers.get("access-control-allow-headers", "")
        assert "authorization" in allowed.lower()

    def test_content_type_header_allowed(self, client):
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        allowed = r.headers.get("access-control-allow-headers", "")
        assert "content-type" in allowed.lower()

    def test_allowed_headers_not_wildcard(self, client):
        """The header list must be explicit, not a bare '*'."""
        r = client.options(
            "/data",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
        )
        allowed = r.headers.get("access-control-allow-headers", "")
        assert allowed.strip() != "*"


# ---------------------------------------------------------------------------
# Origin allowlist tests
# ---------------------------------------------------------------------------

class TestOriginAllowlist:

    def test_allowed_origin_gets_acao_header(self, client):
        r = client.get("/data", headers={"Origin": ALLOWED_ORIGIN})
        assert r.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN

    def test_disallowed_origin_gets_no_acao_header(self, client):
        r = client.get("/data", headers={"Origin": DISALLOWED_ORIGIN})
        assert "access-control-allow-origin" not in r.headers
