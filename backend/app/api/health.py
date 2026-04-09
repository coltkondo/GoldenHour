"""
Health check endpoint.

Performs real liveness probes against the database and Redis on every
request so Railway / any orchestrator gets an honest signal about whether
the app can serve traffic. Returns HTTP 200 when healthy, 503 otherwise.

Design decisions:
- Database is **critical**: any failure → 503.
- Redis is **non-critical** today (cache.py is an empty stub).
  A Redis outage sets status to "degraded" but keeps HTTP 200 so a
  missing or misconfigured Redis URL in staging doesn't down production.
- Both probe functions never raise; all exceptions are caught and
  converted to a descriptive string, so the endpoint is always safe to
  call regardless of infrastructure state.
- socket_timeout / socket_connect_timeout are capped at 2 s so a hung
  dependency doesn't stall the probe past the orchestrator's own window.
"""
import redis as redis_lib
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import SessionLocal

router = APIRouter(tags=["health"])


def _check_database() -> str:
    """
    Execute SELECT 1 against the configured database.

    Returns "ok" on success, or "error: <ExceptionClass>" on any failure.
    Opens and closes its own session so the health check never consumes
    a connection from the application's pool indefinitely.
    """
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        return "ok"
    except Exception as exc:
        return f"error: {type(exc).__name__}"
    finally:
        if db is not None:
            db.close()


def _check_redis() -> str:
    """
    Ping the configured Redis instance.

    Returns:
      "ok"          – PING received PONG
      "unavailable" – ConnectionError (Redis not running / wrong URL)
      "error: <X>"  – any other unexpected exception
    """
    client = None
    try:
        client = redis_lib.from_url(
            settings.REDIS_URL,
            socket_timeout=2,
            socket_connect_timeout=2,
        )
        client.ping()
        return "ok"
    except redis_lib.exceptions.ConnectionError:
        return "unavailable"
    except Exception as exc:
        return f"error: {type(exc).__name__}"
    finally:
        if client is not None:
            client.close()


@router.get("/health")
def health_check() -> JSONResponse:
    """
    Liveness probe for Railway / Render / Docker HEALTHCHECK.

    Response shape:
      {
        "status":   "healthy" | "degraded" | "unhealthy",
        "database": "ok" | "error: ...",
        "redis":    "ok" | "unavailable" | "error: ..."
      }

    HTTP 200 is returned when the database is reachable (even if Redis is
    degraded). HTTP 503 is returned when the database is unreachable.
    """
    db_status = _check_database()
    redis_status = _check_redis()

    db_ok = db_status == "ok"

    if db_ok and redis_status == "ok":
        overall = "healthy"
    elif db_ok:
        # Redis unavailable/errored — app can still serve reads/writes
        overall = "degraded"
    else:
        overall = "unhealthy"

    http_status = 200 if db_ok else 503

    return JSONResponse(
        status_code=http_status,
        content={
            "status": overall,
            "database": db_status,
            "redis": redis_status,
        },
    )
