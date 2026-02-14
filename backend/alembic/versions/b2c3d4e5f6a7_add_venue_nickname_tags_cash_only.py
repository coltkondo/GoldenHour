"""Add venue nickname, tags, cash_only

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-13 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('venues', sa.Column('nickname', sa.String(100), nullable=True))
    op.add_column('venues', sa.Column('tags', ARRAY(sa.String), nullable=True))
    op.add_column('venues', sa.Column('cash_only', sa.Boolean(), nullable=True, server_default='false'))


def downgrade():
    op.drop_column('venues', 'cash_only')
    op.drop_column('venues', 'tags')
    op.drop_column('venues', 'nickname')
