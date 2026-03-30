"""Add CHECK constraints on happy_hour_schedules

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-03-29 20:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "b3c4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute(
        sa.text(
            "ALTER TABLE happy_hour_schedules ADD CONSTRAINT ck_schedules_time_order "
            "CHECK (end_time > start_time) NOT VALID"
        )
    )
    op.execute(
        sa.text(
            "ALTER TABLE happy_hour_schedules VALIDATE CONSTRAINT ck_schedules_time_order"
        )
    )

    op.execute(
        sa.text(
            "ALTER TABLE happy_hour_schedules ADD CONSTRAINT ck_schedules_day_of_week "
            "CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT VALID"
        )
    )
    op.execute(
        sa.text(
            "ALTER TABLE happy_hour_schedules VALIDATE CONSTRAINT ck_schedules_day_of_week"
        )
    )


def downgrade():
    op.execute(
        sa.text(
            "ALTER TABLE happy_hour_schedules DROP CONSTRAINT IF EXISTS ck_schedules_time_order"
        )
    )
    op.execute(
        sa.text(
            "ALTER TABLE happy_hour_schedules DROP CONSTRAINT IF EXISTS ck_schedules_day_of_week"
        )
    )
