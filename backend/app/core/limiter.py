"""
Rate limiter singleton backed by Redis.

Uses slowapi (a Starlette/FastAPI wrapper around the limits library).
Redis storage persists across process restarts and shares state across
Gunicorn workers. Falls back to in-memory if Redis is unavailable.

Usage in route files:
    from app.core.limiter import limiter
    from fastapi import Request

    @router.post("/login")
    @limiter.limit("10/minute")
    def login(request: Request, ...):
        ...

The `request: Request` parameter is required by slowapi for key extraction
(defaults to client IP). It does not need to be used in the handler body.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.logging import logger

try:
    limiter = Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)
    logger.info("rate_limiter_using_redis")
except Exception:
    limiter = Limiter(key_func=get_remote_address)
    logger.warning("rate_limiter_fallback_to_memory")
