import os
from pathlib import Path
from dotenv import load_dotenv
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ---- Load environment variables ----
# Only load .env if running locally
project_root = Path(__file__).resolve().parents[1]
dotenv_path = project_root / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)

# ---- Alembic config ----
config = context.config

# Setup logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---- Import your models ----
from app.models.base import Base  # declarative base
target_metadata = Base.metadata

# Import all models so Alembic autogenerate sees them
try:
    import app.models.venue as _venue  # noqa: F401
    import app.models.deal as _deal    # noqa: F401
    import app.models.happy_hour as _happy  # noqa: F401
    import app.models.user as _user  # noqa: F401
    import app.models.submission as _submission  # noqa: F401
    import app.models.point_transaction as _pt  # noqa: F401
except Exception:
    # If models fail, autogenerate will show the issue
    pass

# ---- Helper to get database URL ----
def get_db_url():
    """
    Return the DATABASE_URL.
    Prioritize environment variables (Railway, production),
    fallback to .env/local development.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError(
            "DATABASE_URL not set. On local, define it in .env. "
            "On Railway, it should be set automatically."
        )
    return db_url

# ---- Offline migrations ----
def run_migrations_offline() -> None:
    url = get_db_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# ---- Online migrations ----
def run_migrations_online() -> None:
    connectable = engine_from_config(
        {"sqlalchemy.url": get_db_url()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

# ---- Execute migration ----
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
