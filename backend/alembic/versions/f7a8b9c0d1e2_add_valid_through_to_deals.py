"""Add valid_through date to deals

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-07-07

Adds an optional expiry date to deals. NULL means the deal is permanent.
When set, the deal is excluded from active/today queries after that date.
Used for Arts Fest one-off specials and any time-limited promotions.
"""
from alembic import op
import sqlalchemy as sa

revision = 'f7a8b9c0d1e2'
down_revision = 'e6f7a8b9c0d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('deals', sa.Column('valid_through', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('deals', 'valid_through')
