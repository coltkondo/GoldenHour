"""
Tests for Fix 6: DEBUG must default to False in production.

The bug: `DEBUG: bool = True` in Settings meant that if the DEBUG env var was
not explicitly set in Railway, SQLAlchemy would echo every SQL statement
(including password hash queries) to stdout — a production data leak.

The fix: `DEBUG: bool = False`. Operators must explicitly opt-in to verbose
logging by setting DEBUG=true in their environment.

Test strategy:
  - Introspect the Pydantic model field default — no instantiation required,
    so no DATABASE_URL / SECRET_KEY env vars are needed.
  - Verify that DEBUG=true via env still works (opt-in still supported).
  - Verify that database engine echo=True only fires when DEBUG is True.
"""
import os
import pytest
from app.core.config import Settings


# ---------------------------------------------------------------------------
# Field default
# ---------------------------------------------------------------------------

def test_debug_field_default_is_false():
    """The Settings model declares DEBUG with a default of False."""
    field = Settings.model_fields["DEBUG"]
    assert field.default is False, (
        f"Settings.DEBUG default should be False but is {field.default!r}. "
        "A true default causes SQLAlchemy to dump every SQL statement to "
        "stdout in production when DEBUG env var is not set."
    )


def test_debug_field_is_boolean():
    """DEBUG must be typed as bool, not str, so pydantic coerces 'false'→False."""
    field = Settings.model_fields["DEBUG"]
    annotation = field.annotation
    assert annotation is bool, f"Expected bool, got {annotation}"


# ---------------------------------------------------------------------------
# Env-var opt-in still works
# ---------------------------------------------------------------------------

def test_debug_true_when_env_set(monkeypatch):
    """Operators can still enable debug logging by setting DEBUG=true."""
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@localhost/db")
    monkeypatch.setenv("SECRET_KEY", "a" * 32)
    s = Settings()
    assert s.DEBUG is True


def test_debug_false_when_env_not_set(monkeypatch):
    """When DEBUG is absent from the environment (and no .env file), it defaults to False."""
    monkeypatch.delenv("DEBUG", raising=False)
    # _env_file=None disables .env file loading so only real env vars are considered
    s = Settings(
        _env_file=None,
        DATABASE_URL="postgresql://u:p@localhost/db",
        SECRET_KEY="a" * 32,
    )
    assert s.DEBUG is False


def test_debug_false_when_env_explicitly_false(monkeypatch):
    """DEBUG=false in env should resolve to Python False."""
    monkeypatch.setenv("DEBUG", "false")
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@localhost/db")
    monkeypatch.setenv("SECRET_KEY", "a" * 32)
    s = Settings()
    assert s.DEBUG is False


# ---------------------------------------------------------------------------
# Downstream: SQLAlchemy echo is driven by DEBUG
# ---------------------------------------------------------------------------

def test_sqlalchemy_echo_disabled_when_debug_false(monkeypatch):
    """When DEBUG=False, echo=settings.DEBUG evaluates to False (no SQL spam)."""
    monkeypatch.delenv("DEBUG", raising=False)
    s = Settings(
        _env_file=None,
        DATABASE_URL="postgresql://u:p@localhost/db",
        SECRET_KEY="a" * 32,
    )
    # database.py passes echo=settings.DEBUG — verify it would be falsy
    assert not s.DEBUG, "echo=settings.DEBUG must be falsy to suppress SQL logging"


def test_sqlalchemy_echo_enabled_when_debug_true(monkeypatch):
    """When DEBUG=True, echo=settings.DEBUG evaluates to True (SQL logging on)."""
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@localhost/db")
    monkeypatch.setenv("SECRET_KEY", "a" * 32)
    s = Settings()
    assert s.DEBUG is True
