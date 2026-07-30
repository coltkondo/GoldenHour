from sqlalchemy import Column, String, Time, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base, TimestampMixin


class EventSchedule(Base, TimestampMixin):
    __tablename__ = "event_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.id"), nullable=False, index=True)
    series_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    name = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=True)
    description = Column(String, nullable=True)

    # Recurrence rule — weekly|biweekly|monthly
    recurrence_type = Column(String(20), nullable=False)
    day_of_week = Column(Integer, nullable=True)   # 0=Monday … 6=Sunday
    day_of_month = Column(Integer, nullable=True)  # 1-28, for monthly

    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)

    def __repr__(self):
        return f"<EventSchedule {self.name} {self.recurrence_type}>"
