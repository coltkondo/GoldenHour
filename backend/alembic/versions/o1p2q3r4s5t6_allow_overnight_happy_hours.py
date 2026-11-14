"""Allow happy hours that cross midnight

Replaces CHECK (end_time > start_time) with CHECK (end_time <> start_time).
An end time at or before the start now means the window runs into the next
day (e.g. Fri 22:00 -> 01:00 Sat). Equal times stay invalid: ambiguous.

Revision ID: o1p2q3r4s5t6
Revises: n1o2p3q4r5s6
Create Date: 2026-11-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "o1p2q3r4s5t6"
down_revision: Union[str, Sequence[str], None] = "n1o2p3q4r5s6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute(sa.text(
        "ALTER TABLE happy_hour_schedules DROP CONSTRAINT IF EXISTS ck_schedules_time_order"
    ))
    op.execute(sa.text(
        "ALTER TABLE happy_hour_schedules DROP CONSTRAINT IF EXISTS ck_schedules_time_distinct"
    ))
    op.execute(sa.text(
        "ALTER TABLE happy_hour_schedules ADD CONSTRAINT ck_schedules_time_distinct "
        "CHECK (end_time <> start_time)"
    ))


def downgrade():
    op.execute(sa.text(
        "ALTER TABLE happy_hour_schedules DROP CONSTRAINT IF EXISTS ck_schedules_time_distinct"
    ))
    # NOT VALID: overnight rows created after the upgrade would fail validation.
    # Remove or split them before re-validating.
    op.execute(sa.text(
        "ALTER TABLE happy_hour_schedules ADD CONSTRAINT ck_schedules_time_order "
        "CHECK (end_time > start_time) NOT VALID"
    ))
