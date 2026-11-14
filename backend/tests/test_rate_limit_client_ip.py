"""
Rate limits must key on the real client, not Railway's proxy. Otherwise every
user shares one bucket (e.g. 10 logins/minute for the whole app).
"""

from starlette.requests import Request

from app.core.limiter import client_ip


def _req(xff: str | None, peer: str = "100.64.0.7") -> Request:
    headers = [(b"x-forwarded-for", xff.encode())] if xff is not None else []
    return Request({"type": "http", "headers": headers, "client": (peer, 12345)})


def test_uses_forwarded_client_behind_proxy():
    assert client_ip(_req("8.8.8.8")) == "8.8.8.8"


def test_spoofed_left_entries_are_ignored():
    # Client sent its own "X-Forwarded-For: 1.1.1.1"; the proxy appended the real address.
    assert client_ip(_req("1.1.1.1, 8.8.4.4")) == "8.8.4.4"


def test_internal_proxy_hops_are_skipped():
    assert client_ip(_req("8.8.8.8, 10.0.0.3, 100.64.1.2")) == "8.8.8.8"


def test_ipv6_client():
    assert client_ip(_req("2600:1f18::1")) == "2600:1f18::1"


def test_garbage_header_falls_back_to_socket_peer():
    assert client_ip(_req("not-an-ip, unknown")) == "100.64.0.7"


def test_no_header_uses_socket_peer_local_dev():
    assert client_ip(_req(None, peer="127.0.0.1")) == "127.0.0.1"


def test_two_users_behind_same_proxy_get_different_keys():
    assert client_ip(_req("8.8.8.8")) != client_ip(_req("9.9.9.9"))
