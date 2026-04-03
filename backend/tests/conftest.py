"""
Shared pytest fixtures for the Golden Hour backend test suite.

A fresh SQLite file-based database is created per test function using pytest's
built-in `tmp_path` fixture. Using a file (not :memory:) means multiple
connections/sessions — including threads — all connect to the same database
and see each other's committed data. The file is cleaned up by `tmp_path`
automatically after each test.

PostgreSQL-specific DDL types (UUID, JSONB, ARRAY) are compiled to TEXT via
@compiles so SQLAlchemy can CREATE the tables in SQLite. The Python-level type
processors (bind/result) still work correctly — UUID↔str and JSON↔dict
round-trips function normally on TEXT columns.

Tests that require PostgreSQL-native behaviour (PostGIS, UNNEST) are excluded
from this suite; they would need a real Postgres test database.
"""
import pytest
from sqlalchemy import create_engine, ARRAY
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker


# ---------------------------------------------------------------------------
# Override Postgres-specific DDL types so SQLite can CREATE the tables.
# @compiles only affects DDL generation; Python bind/result processors are
# unaffected, so UUID↔str and JSON↔dict round-trips still work correctly.
# ---------------------------------------------------------------------------

@compiles(PG_UUID, "sqlite")
def _uuid_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(JSONB, "sqlite")
def _jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(ARRAY, "sqlite")
def _array_sqlite(type_, compiler, **kw):
    return "TEXT"


# Import models AFTER registering @compiles so create_all() picks up overrides.
from app.models.base import Base  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.submission import Submission  # noqa: E402
from app.models.point_transaction import PointTransaction  # noqa: E402
from app.models.venue import Venue  # noqa: E402
from app.models.deal import Deal  # noqa: E402
# HappyHourSchedule intentionally excluded — uses a PostgreSQL-specific
# UNNEST subquery. Tests touching schedule data require a real Postgres DB.


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def db_engine(tmp_path):
    """
    Create a fresh file-based SQLite engine per test.

    Using a file (not :memory:) ensures that multiple SQLAlchemy sessions and
    OS threads can all connect to the same database and see committed data.
    The database file lives in pytest's tmp_path and is deleted after the test.
    """
    db_file = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db(db_engine):
    """Provide a single SQLAlchemy session for the test, then close it."""
    session = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def db_session_factory(db_engine):
    """
    Return a session factory bound to the test database.

    Used by tests that need to create additional sessions (e.g. concurrent
    thread tests where each thread needs its own independent session).
    """
    return sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
