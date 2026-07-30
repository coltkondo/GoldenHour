"""add event_schedules table

Revision ID: m1n2o3p4q5r6
Revises: l1m2n3o4p5q6
Create Date: 2026-07-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.reflection import Inspector

revision = "m1n2o3p4q5r6"
down_revision = "l1m2n3o4p5q6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing = inspector.get_table_names()

    if "event_schedules" not in existing:
        op.create_table(
            "event_schedules",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("venue_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("venues.id"), nullable=False),
            sa.Column("series_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("event_type", sa.String(50), nullable=True),
            sa.Column("description", sa.Text, nullable=True),
            sa.Column("recurrence_type", sa.String(20), nullable=False),
            sa.Column("day_of_week", sa.Integer, nullable=True),
            sa.Column("day_of_month", sa.Integer, nullable=True),
            sa.Column("start_time", sa.Time, nullable=True),
            sa.Column("end_time", sa.Time, nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_event_schedules_venue_id", "event_schedules", ["venue_id"])
        op.create_index("ix_event_schedules_series_id", "event_schedules", ["series_id"])


def downgrade() -> None:
    op.drop_index("ix_event_schedules_series_id", table_name="event_schedules")
    op.drop_index("ix_event_schedules_venue_id", table_name="event_schedules")
    op.drop_table("event_schedules")
