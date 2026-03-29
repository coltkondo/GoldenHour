from sqlalchemy import Column, Integer, Text, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base


class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    submission_id = Column(
        UUID(as_uuid=True), ForeignKey("submissions.id"), nullable=True
    )
    points = Column(Integer, nullable=False)
    transaction_type = Column(
        SAEnum(
            "submission_approved",
            "bonus",
            "redemption",
            "adjustment",
            name="transaction_type_enum",
            create_type=False,
        ),
        nullable=False,
    )
    description = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="point_transactions")
    submission = relationship("Submission", back_populates="point_transactions")

    def __repr__(self):
        return f"<PointTransaction {self.points}pts [{self.transaction_type}]>"
