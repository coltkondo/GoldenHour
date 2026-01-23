"""test

Revision ID: 3aa5bdd66e85
Revises: 1b3be7ba9c34
Create Date: 2026-01-22 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '3aa5bdd66e85'
down_revision = '1b3be7ba9c34'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)

    if 'venues' not in inspector.get_table_names():
        return

    cols = {c['name'] for c in inspector.get_columns('venues')}

    # Add latitude/longitude if missing (nullable to be safe)
    if 'latitude' not in cols:
        op.add_column('venues', sa.Column('latitude', sa.Float(), nullable=True))
    if 'longitude' not in cols:
        op.add_column('venues', sa.Column('longitude', sa.Float(), nullable=True))

    # If legacy `location` exists try best-effort population then drop it.
    if 'location' in cols:
        # First try PostGIS-style extraction (ST_X/ST_Y) if available.
        try:
            conn.execute(sa.text(
                """
                UPDATE venues
                SET latitude = ST_Y(ST_Centroid(location::geometry))::double precision,
                    longitude = ST_X(ST_Centroid(location::geometry))::double precision
                WHERE (latitude IS NULL OR longitude IS NULL)
                """
            ))
        except Exception:
            # Fallback: try parsing WKT text if PostGIS functions exist (ST_AsText),
            # or the DB provides regexp_matches on the WKT output. Wrap in try/except
            # to avoid breaking migrations on DBs without PostGIS.
            try:
                conn.execute(sa.text(
                    """
                    UPDATE venues
                    SET latitude = (regexp_matches(ST_AsText(location::geometry), 'POINT\s*\\(\\s*([0-9\.-]+)\\s+([0-9\.-]+)\\s*\\)'))[2]::double precision,
                        longitude = (regexp_matches(ST_AsText(location::geometry), 'POINT\s*\\(\\s*([0-9\.-]+)\\s+([0-9\.-]+)\\s*\\)'))[1]::double precision
                    WHERE (latitude IS NULL OR longitude IS NULL)
                    """
                ))
            except Exception:
                # Give up silently if extraction is not possible; leave lat/lon NULL
                pass

        # Drop the legacy column; use batch_alter_table as a safe fallback.
        try:
            op.drop_column('venues', 'location')
        except Exception:
            with op.batch_alter_table('venues') as batch_op:
                batch_op.drop_column('location')


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)

    if 'venues' not in inspector.get_table_names():
        return

    cols = {c['name'] for c in inspector.get_columns('venues')}

    # Recreate a `location` text column (safe fallback) and populate from lat/lon if possible
    if 'location' not in cols:
        op.add_column('venues', sa.Column('location', sa.Text(), nullable=True))

    # Populate `location` from latitude/longitude if present
    if 'latitude' in cols and 'longitude' in cols:
        try:
            conn.execute(sa.text(
                """
                UPDATE venues
                SET location = 'POINT(' || longitude::text || ' ' || latitude::text || ')'
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                """
            ))
        except Exception:
            # Ignore failures; keep location NULL if population fails
            pass

    # Optionally drop lat/long columns to restore prior schema state
    if 'latitude' in cols:
        try:
            op.drop_column('venues', 'latitude')
        except Exception:
            with op.batch_alter_table('venues') as batch_op:
                batch_op.drop_column('latitude')
    if 'longitude' in cols:
        try:
            op.drop_column('venues', 'longitude')
        except Exception:
            with op.batch_alter_table('venues') as batch_op:
                batch_op.drop_column('longitude')
