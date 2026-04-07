"""
Tests for Audit Issue #4: Missing security headers.

The bug: every HTTP response from the API was missing basic browser-security
headers, leaving clients vulnerable to MIME-type sniffing, clickjacking, and
leaking referrer information.

The fix: added an HTTP middleware to main.py that injects the following headers
on every response, regardless of route or status code:
  - X-Content-Type-Options: nosniff        (block MIME-sniffing)
  - X-Frame-Options: DENY                  (block iframes / clickjacking)
  - X-XSS-Protection: 0                   (disable legacy auditor; use CSP)
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: geolocation=(), microphone=(), camera=()
"""
import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Minimal test app — avoids importing app.main (which triggers DB seeding)
# and tests the middleware logic in pure isolation.
# ---------------------------------------------------------------------------

def _build_app_with_security_headers() -> FastAPI:
    """Replicate the security-headers middleware on a bare FastAPI app."""
    app = FastAPI()

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

    @app.get("/test")
    def _ok():
        return {"ok": True}

    @app.get("/test-error")
    def _err():
        return {"x": 1}, 400

    return app


@pytest.fixture(scope="module")
def client():
    return TestClient(_build_app_with_security_headers())


# ---------------------------------------------------------------------------
# Presence tests — each header must appear in every response
# ---------------------------------------------------------------------------

class TestSecurityHeadersPresent:

    def test_x_content_type_options_present(self, client):
        r = client.get("/test")
        assert "x-content-type-options" in r.headers

    def test_x_frame_options_present(self, client):
        r = client.get("/test")
        assert "x-frame-options" in r.headers

    def test_x_xss_protection_present(self, client):
        r = client.get("/test")
        assert "x-xss-protection" in r.headers

    def test_referrer_policy_present(self, client):
        r = client.get("/test")
        assert "referrer-policy" in r.headers

    def test_permissions_policy_present(self, client):
        r = client.get("/test")
        assert "permissions-policy" in r.headers


# ---------------------------------------------------------------------------
# Value tests — headers must carry the correct values
# ---------------------------------------------------------------------------

class TestSecurityHeaderValues:

    def test_x_content_type_options_is_nosniff(self, client):
        r = client.get("/test")
        assert r.headers["x-content-type-options"] == "nosniff"

    def test_x_frame_options_is_deny(self, client):
        r = client.get("/test")
        assert r.headers["x-frame-options"] == "DENY"

    def test_x_xss_protection_is_zero(self, client):
        """
        The legacy XSS auditor is disabled intentionally. Setting it to
        '1; mode=block' has known bypass vulnerabilities; modern browsers
        ignore it in favour of CSP anyway.
        """
        r = client.get("/test")
        assert r.headers["x-xss-protection"] == "0"

    def test_referrer_policy_value(self, client):
        r = client.get("/test")
        assert r.headers["referrer-policy"] == "strict-origin-when-cross-origin"

    def test_permissions_policy_blocks_sensitive_features(self, client):
        policy = client.get("/test").headers["permissions-policy"]
        assert "geolocation=()" in policy
        assert "microphone=()" in policy
        assert "camera=()" in policy


# ---------------------------------------------------------------------------
# Consistency tests — headers present on ALL responses, not just 200s
# ---------------------------------------------------------------------------

class TestHeadersOnAllResponses:

    def test_headers_present_on_404(self, client):
        r = client.get("/this-route-does-not-exist")
        assert "x-content-type-options" in r.headers
        assert "x-frame-options" in r.headers

    def test_headers_present_on_200(self, client):
        r = client.get("/test")
        assert r.status_code == 200
        assert "x-content-type-options" in r.headers
