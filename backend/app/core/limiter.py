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
(keyed by `client_ip`, the real client behind Railway's proxy). It does not need to be used in the handler body.
"""
import ipaddress

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings
from app.core.logging import logger


def _is_public(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip.strip())
    except ValueError:
        return False
    # Private, loopback, link-local and CGNAT (100.64/10) ranges are proxy hops.
    return addr.is_global


def client_ip(request: Request) -> str:
    """The real client IP behind Railway's proxy.

    Without this, every request's `client.host` is the proxy's address (uvicorn
    only trusts X-Forwarded-For from 127.0.0.1 by default), so all users would
    share ONE rate-limit bucket: 10 logins/minute for the whole app.

    Uses the right-most *public* address in X-Forwarded-For: proxies append
    the address they received the connection from, so anything a client puts
    in the header itself ends up further left and is ignored, which makes it
    spoof-resistant. Falls back to the socket address (e.g. local dev).
    """
    xff = request.headers.get("x-forwarded-for", "")
    for hop in reversed([h for h in xff.split(",") if h.strip()]):
        if _is_public(hop):
            return hop.strip()
    return get_remote_address(request)


def _redis_reachable(url: str) -> bool:
    try:
        import redis as redis_lib
        r = redis_lib.from_url(url, socket_connect_timeout=2)
        r.ping()
        return True
    except Exception:
        return False


if _redis_reachable(settings.REDIS_URL):
    limiter = Limiter(key_func=client_ip, storage_uri=settings.REDIS_URL)
    logger.info("rate_limiter_using_redis")
else:
    limiter = Limiter(key_func=client_ip)
    logger.warning("rate_limiter_fallback_to_memory")
