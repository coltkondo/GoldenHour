"""Add is_flagged_duplicate to submissions

Revision ID: i1j2k3l4m5n6
Revises: h1i2j3k4l5m6
Create Date: 2026-07-21

Adds is_flagged_duplicate boolean to submissions. Set at submission time
when the submitted bar_name + deal title closely matches an existing active
deal or another pending submission. Flagged submissions earn the corroboration
rate (2pts) on approval instead of the full new_deal rate (50pts).
"""

from alembic import op
import sqlalchemy as sa

revision = 'i1j2k3l4m5n6'
down_revision = 'h1i2j3k4l5m6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'submissions',
        sa.Column('is_flagged_duplicate', sa.Boolean(), nullable=False, server_default='false'),
    )


def downgrade() -> None:
    op.drop_column('submissions', 'is_flagged_duplicate')
