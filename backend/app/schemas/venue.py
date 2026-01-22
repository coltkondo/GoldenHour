# pydantic schema for venues
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class VenueBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    phone: Optional[str] = None
    website: Optional[str] = None
    neighborhood: Optional[str] = None
    venue_type: Optional[str] = None
    description: Optional[str] = None

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    neighborhood: Optional[str] = None
    venue_type: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class VenueResponse(VenueBase):
    id: UUID
    verified: bool
    active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class VenueWithDeals(VenueResponse):
    deals_count: int
    active_deals_count: int