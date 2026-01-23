from sqlalchemy import Column, String, Float, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID

import uuid
from .base import Base, TimestampMixin

class Venue(Base, TimestampMixin):
    __tablename__ = "venues"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=False)
    
    # Geographic data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Contact & details
    phone = Column(String(20))
    website = Column(String(500))
    
    # Categorization
    neighborhood = Column(String(100), index=True)
    venue_type = Column(String(50))  # "bar", "restaurant", "rooftop", etc.
    
    # Metadata
    verified = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    description = Column(Text)
    
    def __repr__(self):
        return f"<Venue {self.name} ({self.neighborhood})>"