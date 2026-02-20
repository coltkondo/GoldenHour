# pydantic schema for venues
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class VenueBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    nickname: Optional[str] = None
    address: str
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    phone: Optional[str] = None
    website: Optional[str] = None
    neighborhood: Optional[str] = None
    venue_type: Optional[str] = None
    tags: Optional[List[str]] = None
    cash_only: Optional[bool] = False
    description: Optional[str] = None
    google_place_id: Optional[str] = None
    price_level: Optional[int] = Field(None, ge=1, le=4)
    rating: Optional[float] = Field(None, ge=0, le=5)

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    neighborhood: Optional[str] = None
    venue_type: Optional[str] = None
    tags: Optional[List[str]] = None
    cash_only: Optional[bool] = None
    description: Optional[str] = None
    google_place_id: Optional[str] = None
    price_level: Optional[int] = Field(None, ge=1, le=4)
    rating: Optional[float] = Field(None, ge=0, le=5)
    active: Optional[bool] = None
    verified: Optional[bool] = None

class VenueResponse(VenueBase):
    id: UUID
    verified: bool
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class VenueWithDeals(VenueResponse):
    deals_count: int = 0
    active_deals_count: int = 0