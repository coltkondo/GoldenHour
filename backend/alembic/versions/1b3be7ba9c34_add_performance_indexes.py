"""Add performance indexes

Revision ID: 1b3be7ba9c34
Revises: 4da5183dc371
Create Date: 2026-01-22 14:13:42.994745

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b3be7ba9c34'
down_revision: Union[str, Sequence[str], None] = '4da5183dc371'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Venues indexes
    v_indexes = {idx['name'] for idx in inspector.get_indexes('venues')} if 'venues' in inspector.get_table_names() else set()
    # replace PostGIS GIST location index with btree indexes on latitude/longitude
    if 'idx_venues_latitude' not in v_indexes:
        op.execute("CREATE INDEX idx_venues_latitude ON venues(latitude);")
    if 'idx_venues_longitude' not in v_indexes:
        op.execute("CREATE INDEX idx_venues_longitude ON venues(longitude);")
    if 'idx_venues_neighborhood' not in v_indexes:
        op.execute("CREATE INDEX idx_venues_neighborhood ON venues(neighborhood);")
    if 'idx_venues_active' not in v_indexes:
        op.execute("CREATE INDEX idx_venues_active ON venues(active);")

    # Deals indexes
    d_indexes = {idx['name'] for idx in inspector.get_indexes('deals')} if 'deals' in inspector.get_table_names() else set()
    if 'idx_deals_venue_id' not in d_indexes:
        op.execute("CREATE INDEX idx_deals_venue_id ON deals(venue_id);")
    if 'idx_deals_active' not in d_indexes:
        op.execute("CREATE INDEX idx_deals_active ON deals(active);")

    # Happy hour indexes
    h_indexes = {idx['name'] for idx in inspector.get_indexes('happy_hour_schedules')} if 'happy_hour_schedules' in inspector.get_table_names() else set()
    if 'idx_happy_hour_venue_id' not in h_indexes:
        op.execute("CREATE INDEX idx_happy_hour_venue_id ON happy_hour_schedules(venue_id);")
    if 'idx_happy_hour_day' not in h_indexes:
        op.execute("CREATE INDEX idx_happy_hour_day ON happy_hour_schedules(day_of_week);")

def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_venues_latitude;")
    op.execute("DROP INDEX IF EXISTS idx_venues_longitude;")
    op.execute("DROP INDEX IF EXISTS idx_venues_neighborhood;")
    op.execute("DROP INDEX IF EXISTS idx_venues_active;")
    op.execute("DROP INDEX IF EXISTS idx_deals_venue_id;")
    op.execute("DROP INDEX IF EXISTS idx_deals_active;")
    op.execute("DROP INDEX IF EXISTS idx_happy_hour_venue_id;")
    op.execute("DROP INDEX IF EXISTS idx_happy_hour_day;")