"""Add per-account wrong-code counter for password reset

Revision ID: n1o2p3q4r5s6
Revises: m1n2o3p4q5r6
Create Date: 2026-11-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "n1o2p3q4r5s6"
down_revision: Union[str, Sequence[str], None] = "m1n2o3p4q5r6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    conn = op.get_bind()
    cols = {c["name"] for c in sa.inspect(conn).get_columns("users")}
    if "reset_attempts" not in cols:
        op.add_column(
            "users",
            sa.Column("reset_attempts", sa.Integer(), nullable=False, server_default="0"),
        )


def downgrade():
    op.drop_column("users", "reset_attempts")
