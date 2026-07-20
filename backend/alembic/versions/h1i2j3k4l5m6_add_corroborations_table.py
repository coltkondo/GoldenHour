"""Add corroborations table

Revision ID: h1i2j3k4l5m6
Revises: g1h2i3j4k5l6
Create Date: 2026-07-20

Corroborations are user confirmations that an existing deal is still
accurate. They award 2 points instantly (no admin review) and are
rate-limited to one per user per deal per calendar day via the
unique constraint on (user_id, deal_id, corroborated_date).
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'h1i2j3k4l5m6'
down_revision = 'g1h2i3j4k5l6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'corroborations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deals.id'), nullable=False),
        sa.Column('points_awarded', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('corroborated_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('user_id', 'deal_id', 'corroborated_date', name='uq_corroboration_per_day'),
    )
    op.create_index('ix_corroborations_user_id', 'corroborations', ['user_id'])
    op.create_index('ix_corroborations_deal_id', 'corroborations', ['deal_id'])


def downgrade() -> None:
    op.drop_index('ix_corroborations_deal_id', table_name='corroborations')
    op.drop_index('ix_corroborations_user_id', table_name='corroborations')
    op.drop_table('corroborations')
