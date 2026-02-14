from sqlalchemy import Column, String, Float, Boolean, Text, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin

class Deal(Base, TimestampMixin):
    __tablename__ = "deals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey('venues.id'), nullable=False)
    
    # Deal details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Categorization
    category = Column(String(50))  # "drinks", "food", "both"
    deal_type = Column(String(50))  # "discount", "bogo", "special_price", "free"
    
    # Pricing
    original_price = Column(Float)
    deal_price = Column(Float)
    discount_percentage = Column(Float)
    
    # Items included
    items = Column(ARRAY(String))  # ["Well drinks", "House wine", "Draft beer"]
    
    # Status
    active = Column(Boolean, default=True)
    verified = Column(Boolean, default=False)

    # Tracking
    source = Column(String(50), default="manual")  # "manual", "import", "user"
    
    # Relationships
    venue = relationship("Venue", backref="deals")
    
    def __repr__(self):
        return f"<Deal {self.title} at {self.venue_id}>"