from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin


class Submission(Base, TimestampMixin):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    submission_type = Column(
        SAEnum(
            "new_deal",
            "deal_update",
            "deal_expired",
            "new_bar",
            "bar_closed",
            "bar_update",
            name="submission_type_enum",
            create_type=False,
        ),
        nullable=False,
    )
    submitted_data = Column(JSONB, nullable=False, default=dict)

    related_bar_id = Column(UUID(as_uuid=True), ForeignKey("venues.id"), nullable=True)
    related_deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id"), nullable=True)

    status = Column(
        SAEnum(
            "pending",
            "approved",
            "rejected",
            name="submission_status_enum",
            create_type=False,
        ),
        nullable=False,
        default="pending",
    )
    admin_notes = Column(Text, nullable=True)
    points_awarded = Column(Integer, nullable=False, default=0)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    submitter = relationship(
        "User", foreign_keys=[user_id], back_populates="submissions"
    )
    reviewer = relationship(
        "User", foreign_keys=[reviewed_by], back_populates="reviewed_submissions"
    )
    venue = relationship("Venue", foreign_keys=[related_bar_id])
    deal = relationship("Deal", foreign_keys=[related_deal_id])
    point_transactions = relationship("PointTransaction", back_populates="submission")

    def __repr__(self):
        return f"<Submission {self.submission_type} [{self.status}]>"
