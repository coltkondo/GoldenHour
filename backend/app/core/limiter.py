"""
Rate limiter singleton.

Uses slowapi (a Starlette/FastAPI wrapper around the limits library).
In-memory storage is used by default, which is sufficient for the soft
launch scale (10-15 users). Limits reset on process restart.

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

limiter = Limiter(key_func=get_remote_address)
