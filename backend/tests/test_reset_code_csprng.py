"""
Password-reset OTPs must come from the OS CSPRNG (`secrets`), not `random`,
whose Mersenne Twister output is predictable from earlier outputs.
"""

import re

import app.api.v1.auth as auth


def test_reset_code_is_six_digits():
    for _ in range(200):
        assert re.fullmatch(r"\d{6}", auth._generate_reset_code())


def test_reset_code_keeps_leading_zeros(monkeypatch):
    monkeypatch.setattr(auth.secrets, "randbelow", lambda n: 42)
    assert auth._generate_reset_code() == "000042"


def test_reset_code_draws_from_secrets(monkeypatch):
    calls = []

    def fake_randbelow(n):
        calls.append(n)
        return 123456

    monkeypatch.setattr(auth.secrets, "randbelow", fake_randbelow)
    assert auth._generate_reset_code() == "123456"
    assert calls == [10**6]


def test_auth_module_does_not_use_random():
    assert not hasattr(auth, "random")
