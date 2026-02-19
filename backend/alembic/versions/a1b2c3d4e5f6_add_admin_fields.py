"""Add admin fields: google_place_id, price_level, rating on venues; source on deals

Revision ID: a1b2c3d4e5f6
Revises: 1b3be7ba9c34
Create Date: 2026-02-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3aa5bdd66e85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Venues: add google_place_id, price_level, rating
    op.add_column('venues', sa.Column('google_place_id', sa.String(255), nullable=True))
    op.add_column('venues', sa.Column('price_level', sa.Integer(), nullable=True))
    op.add_column('venues', sa.Column('rating', sa.Float(), nullable=True))
    op.create_unique_constraint('uq_venues_google_place_id', 'venues', ['google_place_id'])

    # Deals: add source
    op.add_column('deals', sa.Column('source', sa.String(50), nullable=True, server_default='manual'))


def downgrade():
    op.drop_column('deals', 'source')
    op.drop_constraint('uq_venues_google_place_id', 'venues', type_='unique')
    op.drop_column('venues', 'rating')
    op.drop_column('venues', 'price_level')
    op.drop_column('venues', 'google_place_id')
