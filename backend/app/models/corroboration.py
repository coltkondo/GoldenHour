from sqlalchemy import Column, Date, DateTime, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from .base import Base


class Corroboration(Base):
    __tablename__ = "corroborations"
    __table_args__ = (
        UniqueConstraint("user_id", "deal_id", "corroborated_date", name="uq_corroboration_per_day"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id"), nullable=False, index=True)
    points_awarded = Column(Integer, nullable=False, default=0)
    corroborated_date = Column(Date, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")
    deal = relationship("Deal")

    def __repr__(self):
        return f"<Corroboration user={self.user_id} deal={self.deal_id} date={self.corroborated_date}>"
