"""test

Revision ID: 3aa5bdd66e85
Revises: ca84c914a682
Create Date: 2026-01-22 15:47:45.369714

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3aa5bdd66e85'
down_revision: Union[str, Sequence[str], None] = 'ca84c914a682'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
