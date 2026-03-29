"""Add users, submissions, and point_transactions tables

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7
Create Date: 2026-02-17 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # --- Enums (idempotent via raw SQL) ---
    for type_name, values in [
        ("user_role", ["admin", "user"]),
        (
            "submission_type_enum",
            [
                "new_deal",
                "deal_update",
                "deal_expired",
                "new_bar",
                "bar_closed",
                "bar_update",
            ],
        ),
        ("submission_status_enum", ["pending", "approved", "rejected"]),
        (
            "transaction_type_enum",
            [
                "submission_approved",
                "bonus",
                "redemption",
                "adjustment",
            ],
        ),
    ]:
        quoted = ", ".join(f"'{v}'" for v in values)
        conn.execute(
            sa.text(
                f"DO $$ BEGIN "
                f"IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{type_name}') THEN "
                f"CREATE TYPE {type_name} AS ENUM ({quoted}); "
                f"END IF; END $$;"
            )
        )

    # --- users (raw SQL to avoid SQLAlchemy Enum auto-creation) ---
    conn.execute(
        sa.text("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role user_role NOT NULL DEFAULT 'user',
            points_balance INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
        )
    """)
    )
    conn.execute(
        sa.text(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)"
        )
    )
    conn.execute(
        sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users(email)")
    )

    # --- submissions (raw SQL) ---
    conn.execute(
        sa.text("""
        CREATE TABLE IF NOT EXISTS submissions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id),
            submission_type submission_type_enum NOT NULL,
            submitted_data JSONB NOT NULL DEFAULT '{}',
            related_bar_id UUID REFERENCES venues(id),
            related_deal_id UUID REFERENCES deals(id),
            status submission_status_enum NOT NULL DEFAULT 'pending',
            admin_notes TEXT,
            points_awarded INTEGER NOT NULL DEFAULT 0,
            reviewed_by UUID REFERENCES users(id),
            reviewed_at TIMESTAMP WITHOUT TIME ZONE,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
        )
    """)
    )
    conn.execute(
        sa.text(
            "CREATE INDEX IF NOT EXISTS ix_submissions_user_id ON submissions(user_id)"
        )
    )
    conn.execute(
        sa.text(
            "CREATE INDEX IF NOT EXISTS ix_submissions_status ON submissions(status)"
        )
    )

    # --- point_transactions (raw SQL) ---
    conn.execute(
        sa.text("""
        CREATE TABLE IF NOT EXISTS point_transactions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id),
            submission_id UUID REFERENCES submissions(id),
            points INTEGER NOT NULL,
            transaction_type transaction_type_enum NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
        )
    """)
    )
    conn.execute(
        sa.text(
            "CREATE INDEX IF NOT EXISTS ix_point_transactions_user_id ON point_transactions(user_id)"
        )
    )


def downgrade() -> None:
    op.drop_table("point_transactions")
    op.drop_table("submissions")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS transaction_type_enum")
    op.execute("DROP TYPE IF EXISTS submission_status_enum")
    op.execute("DROP TYPE IF EXISTS submission_type_enum")
    op.execute("DROP TYPE IF EXISTS user_role")
