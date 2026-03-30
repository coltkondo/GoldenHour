from pydantic import BaseModel, Field, model_validator
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

    @model_validator(mode="after")
    def validate_deal_price(self) -> "DealBase":
        if self.original_price is not None and self.deal_price is not None:
            if self.deal_price > self.original_price:
                raise ValueError(
                    "deal_price must be less than or equal to original_price"
                )
        return self


class DealCreate(DealBase):
    venue_id: UUID
    source: Optional[str] = "manual"


class DealUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    deal_type: Optional[str] = None
    original_price: Optional[float] = Field(None, ge=0)
    deal_price: Optional[float] = Field(None, ge=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    items: Optional[List[str]] = None
    active: Optional[bool] = None
    verified: Optional[bool] = None

    @model_validator(mode="after")
    def validate_deal_price(self) -> "DealUpdate":
        if self.original_price is not None and self.deal_price is not None:
            if self.deal_price > self.original_price:
                raise ValueError(
                    "deal_price must be less than or equal to original_price"
                )
        return self


class DealResponse(DealBase):
    id: UUID
    venue_id: UUID
    active: bool
    verified: bool
    source: Optional[str] = "manual"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DealWithVenue(DealResponse):
    venue_name: Optional[str] = None
