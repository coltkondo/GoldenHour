from sqlalchemy import Column, String, Integer, Time, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin

class HappyHourSchedule(Base, TimestampMixin):
    __tablename__ = "happy_hour_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey('venues.id'), nullable=False)
    
    # Schedule
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Associated deals
    deal_ids = Column(ARRAY(UUID(as_uuid=True)))
    
    # Additional info
    notes = Column(Text)  # "Patio only", "Bar seating only", etc.
    restrictions = Column(Text)  # "Dine-in only", "Max 2 per person"
    
    # Status
    active = Column(Boolean, default=True)
    
    # Relationships
    venue = relationship("Venue", backref="schedules")
    
    def __repr__(self):
        return f"<HappyHour {self.venue_id} Day:{self.day_of_week} {self.start_time}-{self.end_time}>"