from sqlalchemy import Column, String, Integer, Boolean, Float, Enum as SAEnum, CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "points_balance >= 0", name="ck_users_points_balance_non_negative"
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    market_id = Column(UUID(as_uuid=True), ForeignKey("markets.id"), nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        SAEnum("admin", "user", name="user_role", create_type=False),
        nullable=False,
        default="user",
    )
    signup_latitude = Column(Float, nullable=False)
    signup_longitude = Column(Float, nullable=False)
    points_balance = Column(Integer, nullable=False, default=0)
    active = Column(Boolean, nullable=False, default=True)

    market = relationship("Market", back_populates="users")
    submissions = relationship(
        "Submission", foreign_keys="Submission.user_id", back_populates="submitter"
    )
    reviewed_submissions = relationship(
        "Submission", foreign_keys="Submission.reviewed_by", back_populates="reviewer"
    )
    point_transactions = relationship("PointTransaction", back_populates="user")

    @property
    def market_slug(self) -> str | None:
        return self.market.slug if self.market else None

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
