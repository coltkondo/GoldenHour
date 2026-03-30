"""Add referential integrity trigger for happy_hour_schedules.deal_ids

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-03-29 20:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Validate function: rejects insert/update if any deal_id doesn't exist
    op.execute(
        sa.text("""
        CREATE OR REPLACE FUNCTION fn_validate_schedule_deal_ids()
        RETURNS TRIGGER AS $$
        DECLARE
            bad_id UUID;
        BEGIN
            IF NEW.deal_ids IS NULL OR array_length(NEW.deal_ids, 1) IS NULL THEN
                RETURN NEW;
            END IF;

            SELECT d.id INTO bad_id
            FROM unnest(NEW.deal_ids) AS d(id)
            LEFT JOIN deals ON deals.id = d.id
            WHERE deals.id IS NULL
            LIMIT 1;

            IF bad_id IS NOT NULL THEN
                RAISE EXCEPTION 'deal_id % does not exist in deals table', bad_id;
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    )

    op.execute(
        sa.text("""
        CREATE TRIGGER trg_validate_schedule_deal_ids
        BEFORE INSERT OR UPDATE ON happy_hour_schedules
        FOR EACH ROW
        EXECUTE FUNCTION fn_validate_schedule_deal_ids();
    """)
    )

    # Cleanup function: removes deleted deal's UUID from all schedules
    op.execute(
        sa.text("""
        CREATE OR REPLACE FUNCTION fn_cleanup_schedule_deal_ids()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE happy_hour_schedules
            SET deal_ids = array_remove(deal_ids, OLD.id)
            WHERE deal_ids @> ARRAY[OLD.id];
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
    """)
    )

    op.execute(
        sa.text("""
        CREATE TRIGGER trg_cleanup_schedule_deal_ids
        AFTER DELETE ON deals
        FOR EACH ROW
        EXECUTE FUNCTION fn_cleanup_schedule_deal_ids();
    """)
    )

    # Clean up any existing orphaned references
    op.execute(
        sa.text("""
        UPDATE happy_hour_schedules
        SET deal_ids = (
            SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
            FROM unnest(COALESCE(deal_ids, ARRAY[]::uuid[])) AS id
            WHERE EXISTS (SELECT 1 FROM deals WHERE deals.id = id)
        )
        WHERE deal_ids IS NOT NULL AND array_length(deal_ids, 1) IS NOT NULL;
    """)
    )


def downgrade():
    op.execute(sa.text("DROP TRIGGER IF EXISTS trg_cleanup_schedule_deal_ids ON deals"))
    op.execute(sa.text("DROP FUNCTION IF EXISTS fn_cleanup_schedule_deal_ids"))
    op.execute(
        sa.text(
            "DROP TRIGGER IF EXISTS trg_validate_schedule_deal_ids ON happy_hour_schedules"
        )
    )
    op.execute(sa.text("DROP FUNCTION IF EXISTS fn_validate_schedule_deal_ids"))
