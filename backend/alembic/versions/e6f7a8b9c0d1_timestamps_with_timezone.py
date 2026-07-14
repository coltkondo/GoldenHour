"""Convert timestamp columns to TIMESTAMP WITH TIME ZONE

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-06-25 00:00:00.000000

The users, submissions, and point_transactions tables were created with
TIMESTAMP WITHOUT TIME ZONE, but the ORM models declare DateTime(timezone=True).
This mismatch silently drops timezone info on write and returns naive datetimes
on read, which corrupts first-submit ordering after DST transitions.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, Sequence[str], None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES_AND_COLUMNS = [
    ("users", ["created_at", "updated_at"]),
    ("submissions", ["reviewed_at", "created_at", "updated_at"]),
    ("point_transactions", ["created_at"]),
]


def upgrade() -> None:
    for table, columns in TABLES_AND_COLUMNS:
        for col in columns:
            op.alter_column(
                table,
                col,
                type_=sa.DateTime(timezone=True),
                existing_type=sa.DateTime(timezone=False),
                existing_nullable=(col == "reviewed_at"),
                postgresql_using=f"{col} AT TIME ZONE 'UTC'",
            )


def downgrade() -> None:
    for table, columns in TABLES_AND_COLUMNS:
        for col in columns:
            op.alter_column(
                table,
                col,
                type_=sa.DateTime(timezone=False),
                existing_type=sa.DateTime(timezone=True),
                existing_nullable=(col == "reviewed_at"),
            )
