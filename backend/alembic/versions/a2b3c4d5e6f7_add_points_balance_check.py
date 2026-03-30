"""Add CHECK constraint on users.points_balance

Revision ID: a2b3c4d5e6f7
Revises: c1d2e3f4a5b6
Create Date: 2026-03-29 20:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute(
        sa.text(
            "ALTER TABLE users ADD CONSTRAINT ck_users_points_balance_non_negative "
            "CHECK (points_balance >= 0) NOT VALID"
        )
    )
    # Validate existing data without holding a long lock
    op.execute(
        sa.text(
            "ALTER TABLE users VALIDATE CONSTRAINT ck_users_points_balance_non_negative"
        )
    )


def downgrade():
    op.execute(
        sa.text(
            "ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_points_balance_non_negative"
        )
    )
