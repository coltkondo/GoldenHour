"""test

Revision ID: ca84c914a682
Revises: 1b3be7ba9c34
Create Date: 2026-01-22 15:38:43.989780

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca84c914a682'
down_revision: Union[str, Sequence[str], None] = '1b3be7ba9c34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
