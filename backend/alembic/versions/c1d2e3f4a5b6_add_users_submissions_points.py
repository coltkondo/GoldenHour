"""Add users, submissions, and point_transactions tables

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7
Create Date: 2026-02-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Enums ---
    user_role = postgresql.ENUM("admin", "user", name="user_role", create_type=False)
    user_role.create(op.get_bind(), checkfirst=True)

    submission_type_enum = postgresql.ENUM(
        "new_deal", "deal_update", "deal_expired",
        "new_bar", "bar_closed", "bar_update",
        name="submission_type_enum", create_type=False,
    )
    submission_type_enum.create(op.get_bind(), checkfirst=True)

    submission_status_enum = postgresql.ENUM(
        "pending", "approved", "rejected",
        name="submission_status_enum", create_type=False,
    )
    submission_status_enum.create(op.get_bind(), checkfirst=True)

    transaction_type_enum = postgresql.ENUM(
        "submission_approved", "bonus", "redemption", "adjustment",
        name="transaction_type_enum", create_type=False,
    )
    transaction_type_enum.create(op.get_bind(), checkfirst=True)

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "user", name="user_role"), nullable=False, server_default="user"),
        sa.Column("points_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- submissions ---
    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("submission_type", sa.Enum(
            "new_deal", "deal_update", "deal_expired",
            "new_bar", "bar_closed", "bar_update",
            name="submission_type_enum",
        ), nullable=False),
        sa.Column("submitted_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("related_bar_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("venues.id"), nullable=True),
        sa.Column("related_deal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("deals.id"), nullable=True),
        sa.Column("status", sa.Enum("pending", "approved", "rejected", name="submission_status_enum"),
                  nullable=False, server_default="pending"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("points_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_submissions_user_id", "submissions", ["user_id"])
    op.create_index("ix_submissions_status", "submissions", ["status"])

    # --- point_transactions ---
    op.create_table(
        "point_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("submissions.id"), nullable=True),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("transaction_type", sa.Enum(
            "submission_approved", "bonus", "redemption", "adjustment",
            name="transaction_type_enum",
        ), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_point_transactions_user_id", "point_transactions", ["user_id"])


def downgrade() -> None:
    op.drop_table("point_transactions")
    op.drop_table("submissions")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS transaction_type_enum")
    op.execute("DROP TYPE IF EXISTS submission_status_enum")
    op.execute("DROP TYPE IF EXISTS submission_type_enum")
    op.execute("DROP TYPE IF EXISTS user_role")
