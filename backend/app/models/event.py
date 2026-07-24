from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin


class Event(Base, TimestampMixin):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_start_datetime", "start_datetime"),
        Index("ix_events_series_id", "series_id"),
        Index("ix_events_event_type", "event_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.id"), nullable=False, index=True)

    # Series grouping — shared UUID links related occurrences (e.g. all Penn State home games)
    series_id = Column(UUID(as_uuid=True), nullable=True)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=True)  # ufc, nfl, cfb, nba, fifa, local, flex, other

    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=True)

    # Associated deals (references deal UUIDs, no FK enforced — same pattern as HappyHourSchedule.deal_ids)
    deal_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)

    image_url = Column(String(500), nullable=True)
    is_sponsored = Column(Boolean, nullable=False, default=False)
    is_recurring = Column(Boolean, nullable=False, default=False)

    active = Column(Boolean, nullable=False, default=True)
    verified = Column(Boolean, nullable=False, default=False)
    source = Column(String(50), nullable=True, default="manual")

    venue = relationship("Venue", back_populates="events")

    def __repr__(self):
        return f"<Event {self.name} @ {self.start_datetime}>"
