"""Add markets table; market_id on venues and users; signup coords on users

Revision ID: g1h2i3j4k5l6
Revises: f7a8b9c0d1e2
Create Date: 2026-07-16

Adds multi-market support:
- markets table (id, slug, region center, radius, daily_points_cap, etc.)
- market_id FK (NOT NULL) on venues — seeded to State College for all
  existing rows as part of this migration
- market_id FK (NOT NULL) on users — seeded to State College for all
  existing rows as part of this migration
- signup_latitude / signup_longitude (NOT NULL) on users — backfilled
  to State College centroid for pre-existing accounts

The two seed markets are inserted inline so the NOT NULL backfills can
reference them immediately, with no manual follow-up step required.

Seed market centroids:
  State College — derived from AVG(lat/lng) of existing venue rows
                  lat: 40.794732  lng: -77.860230  radius: 3000m
  Arlington     — Arlington, VA county centroid
                  lat: 38.881600  lng: -77.091000  radius: 8000m
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


revision = 'g1h2i3j4k5l6'
down_revision = 'f7a8b9c0d1e2'
branch_labels = None
depends_on = None

STATE_COLLEGE_ID = str(uuid.UUID('00000000-0000-0000-0000-000000000001'))
ARLINGTON_ID = str(uuid.UUID('00000000-0000-0000-0000-000000000002'))

# State College centroid from AVG of seeded venue coordinates
SC_LAT = 40.794732
SC_LNG = -77.860230

# Arlington, VA county centroid
ARL_LAT = 38.881600
ARL_LNG = -77.091000


def upgrade() -> None:
    # ── 1. Create markets table ───────────────────────────────────────────────
    op.create_table(
        'markets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('region_center_lat', sa.Float(), nullable=False),
        sa.Column('region_center_lng', sa.Float(), nullable=False),
        sa.Column('region_radius_meters', sa.Integer(), nullable=False),
        sa.Column('daily_points_cap', sa.Integer(), nullable=False, server_default='200'),
        sa.Column('monthly_burn_cap_cents', sa.Integer(), nullable=True),
        sa.Column('launch_status', sa.String(50), nullable=False, server_default='rehearsal'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('region_radius_meters > 0', name='ck_markets_radius_positive'),
        sa.CheckConstraint('daily_points_cap > 0', name='ck_markets_daily_points_cap_positive'),
        sa.UniqueConstraint('slug', name='uq_markets_slug'),
    )
    op.create_index('ix_markets_slug', 'markets', ['slug'])

    # ── 2. Seed the two launch markets ───────────────────────────────────────
    conn = op.get_bind()
    now = sa.text("NOW()")
    conn.execute(
        sa.text("""
            INSERT INTO markets
                (id, name, slug, region_center_lat, region_center_lng,
                 region_radius_meters, daily_points_cap, launch_status,
                 active, created_at, updated_at)
            VALUES
                (:sc_id, 'State College', 'state-college',
                 :sc_lat, :sc_lng, 3000, 200, 'public', true, NOW(), NOW()),
                (:arl_id, 'Arlington', 'arlington',
                 :arl_lat, :arl_lng, 8000, 200, 'rehearsal', true, NOW(), NOW())
        """),
        {
            'sc_id': STATE_COLLEGE_ID,
            'sc_lat': SC_LAT, 'sc_lng': SC_LNG,
            'arl_id': ARLINGTON_ID,
            'arl_lat': ARL_LAT, 'arl_lng': ARL_LNG,
        }
    )

    # ── 3. Add market_id to venues (nullable first for backfill) ─────────────
    op.add_column('venues',
        sa.Column('market_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    conn.execute(
        sa.text("UPDATE venues SET market_id = :sc_id"),
        {'sc_id': STATE_COLLEGE_ID}
    )
    op.alter_column('venues', 'market_id', nullable=False)
    op.create_foreign_key(
        'fk_venues_market_id', 'venues', 'markets', ['market_id'], ['id']
    )
    op.create_index('ix_venues_market_id', 'venues', ['market_id'])

    # ── 4. Add market_id + signup coords to users (nullable first) ───────────
    op.add_column('users',
        sa.Column('market_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column('users',
        sa.Column('signup_latitude', sa.Float(), nullable=True)
    )
    op.add_column('users',
        sa.Column('signup_longitude', sa.Float(), nullable=True)
    )
    conn.execute(
        sa.text("""
            UPDATE users
            SET market_id = :sc_id,
                signup_latitude = :sc_lat,
                signup_longitude = :sc_lng
        """),
        {'sc_id': STATE_COLLEGE_ID, 'sc_lat': SC_LAT, 'sc_lng': SC_LNG}
    )
    op.alter_column('users', 'market_id', nullable=False)
    op.alter_column('users', 'signup_latitude', nullable=False)
    op.alter_column('users', 'signup_longitude', nullable=False)
    op.create_foreign_key(
        'fk_users_market_id', 'users', 'markets', ['market_id'], ['id']
    )
    op.create_index('ix_users_market_id', 'users', ['market_id'])


def downgrade() -> None:
    op.drop_index('ix_users_market_id', 'users')
    op.drop_constraint('fk_users_market_id', 'users', type_='foreignkey')
    op.drop_column('users', 'signup_longitude')
    op.drop_column('users', 'signup_latitude')
    op.drop_column('users', 'market_id')

    op.drop_index('ix_venues_market_id', 'venues')
    op.drop_constraint('fk_venues_market_id', 'venues', type_='foreignkey')
    op.drop_column('venues', 'market_id')

    op.drop_index('ix_markets_slug', 'markets')
    op.drop_table('markets')
