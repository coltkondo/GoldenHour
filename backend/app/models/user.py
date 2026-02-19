from sqlalchemy import Column, String, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum("admin", "user", name="user_role"), nullable=False, default="user")
    points_balance = Column(Integer, nullable=False, default=0)

    submissions = relationship("Submission", foreign_keys="Submission.user_id", back_populates="submitter")
    reviewed_submissions = relationship("Submission", foreign_keys="Submission.reviewed_by", back_populates="reviewer")
    point_transactions = relationship("PointTransaction", back_populates="user")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
