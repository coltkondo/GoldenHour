import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger
from app.core.database import SessionLocal
from app.api.v1 import venues, deals
from app.api.v1 import auth, submissions, points, leaderboard
from app.api.admin import router as admin_router
from app.api.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed data if empty
    logger.info(
        "Starting Golden Hour API", version="1.0.0", environment=settings.ENVIRONMENT
    )

    db = SessionLocal()
    try:
        from scripts.import_csv import seed_if_empty

        seed_if_empty(db)
        logger.info("Database seeding completed")
    except Exception as e:
        logger.exception("Auto-seed failed", error=str(e))
    finally:
        db.close()

    logger.info("API startup complete", docs="/docs", health="/health")
    yield

    # Shutdown
    logger.info("Shutting down Golden Hour API")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Golden Hour - Happy Hour Discovery API",
    lifespan=lifespan,
)


# Exception handler for structured error logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and log with context."""
    # Let FastAPI handle validation errors and HTTPExceptions normally
    if isinstance(exc, (RequestValidationError, HTTPException)):
        raise exc
    logger.bind(
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        request_url=str(request.url),
        request_method=request.method,
        client_host=request.client.host if request.client else None,
        traceback=True,
    ).error("unhandled_exception")

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred",
            "trace_id": str(id(exc)),
        },
    )


# CORS middleware — origins loaded from ALLOWED_ORIGINS env var (comma-separated).
# Methods and headers are explicitly enumerated — wildcards allow TRACE (XST risk)
# and "*" on allow_headers bypasses CSRF protection afforded by restricting Origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
)


# Security headers — added to every response regardless of route or status code.
# X-XSS-Protection is intentionally "0": modern browsers use CSP instead, and
# the legacy XSS auditor has known bypass bugs when set to "1; mode=block".
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing and contextual info."""
    start_time = time.time()
    request_id = str(id(request))

    logger.bind(
        request_id=request_id,
        method=request.method,
        url=str(request.url),
        user_agent=request.headers.get("user-agent"),
        client_ip=request.client.host if request.client else None,
    ).info("request_started")

    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        logger.bind(
            request_id=request_id,
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        ).info("request_completed")
        return response
    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000
        logger.bind(
            request_id=request_id,
            method=request.method,
            url=str(request.url),
            duration_ms=round(duration_ms, 2),
            exception_type=type(exc).__name__,
            exception_message=str(exc),
            traceback=True,
        ).error("request_failed")
        raise


# Public v1 routers
app.include_router(venues.router, prefix=settings.API_V1_PREFIX)
app.include_router(deals.router, prefix=settings.API_V1_PREFIX)

# Auth + user-facing feature routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(submissions.router, prefix=settings.API_V1_PREFIX)
app.include_router(points.router, prefix=settings.API_V1_PREFIX)
app.include_router(leaderboard.router, prefix=settings.API_V1_PREFIX)

# Admin router (all endpoints require admin role)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)

# Health check (no prefix — must be reachable at /health by orchestrators)
app.include_router(health_router)


@app.get("/")
async def root():
    return {"message": "Golden Hour API", "version": "1.0.0", "docs": "/docs"}
