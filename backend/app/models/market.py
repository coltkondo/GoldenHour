from sqlalchemy import Column, String, Float, Integer, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin


class Market(Base, TimestampMixin):
    __tablename__ = "markets"
    __table_args__ = (
        CheckConstraint(
            "region_radius_meters > 0", name="ck_markets_radius_positive"
        ),
        CheckConstraint(
            "daily_points_cap > 0", name="ck_markets_daily_points_cap_positive"
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    region_center_lat = Column(Float, nullable=False)
    region_center_lng = Column(Float, nullable=False)
    region_radius_meters = Column(Integer, nullable=False)
    daily_points_cap = Column(Integer, nullable=False, default=200)
    monthly_burn_cap_cents = Column(Integer, nullable=True)
    launch_status = Column(String(50), nullable=False, default="rehearsal")
    active = Column(Boolean, nullable=False, default=True)

    venues = relationship("Venue", back_populates="market")
    users = relationship("User", back_populates="market")

    def __repr__(self):
        return f"<Market {self.slug} ({self.launch_status})>"
