from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class DealBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str  # "drinks", "food", "both"
    deal_type: str  # "discount", "bogo", "special_price"
    original_price: Optional[float] = Field(None, ge=0)
    deal_price: Optional[float] = Field(None, ge=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    items: List[str] = []

class DealCreate(DealBase):
    venue_id: UUID

class DealUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    deal_type: Optional[str] = None
    original_price: Optional[float] = None
    deal_price: Optional[float] = None
    items: Optional[List[str]] = None
    active: Optional[bool] = None

class DealResponse(DealBase):
    id: UUID
    venue_id: UUID
    active: bool
    verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True