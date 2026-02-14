from sqlalchemy import Column, String, Float, Boolean, Text, Integer, ARRAY
from sqlalchemy.dialects.postgresql import UUID

import uuid
from .base import Base, TimestampMixin

class Venue(Base, TimestampMixin):
    __tablename__ = "venues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    nickname = Column(String(100), nullable=True)
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
    tags = Column(ARRAY(String), nullable=True)  # ["Sports Bar", "College Bar", "Live Music"]

    # Venue attributes
    cash_only = Column(Boolean, default=False)

    # External references
    google_place_id = Column(String(255), unique=True, nullable=True)

    # Ratings & pricing
    price_level = Column(Integer, nullable=True)  # 1-4 dollar signs
    rating = Column(Float, nullable=True)

    # Metadata
    verified = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    description = Column(Text)

    def __repr__(self):
        return f"<Venue {self.name} ({self.neighborhood})>"