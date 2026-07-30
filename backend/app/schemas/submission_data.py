"""
Pydantic validators for the submitted_data JSONB field in Submission.

These schemas serve two purposes simultaneously:
  1. Field allowlisting — extra="ignore" silently drops keys not defined here,
     replacing the old manual ALLOWED_VENUE_FIELDS / ALLOWED_DEAL_FIELDS sets.
  2. Value validation — range/length constraints are enforced before any DB write,
     producing a clean 422 instead of a constraint-violation DB error.
"""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VenueData(BaseModel):
    """Validated subset of Venue fields that a user may propose via submission."""

    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = Field(None, max_length=255)
    nickname: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=500)
    neighborhood: Optional[str] = Field(None, max_length=100)
    venue_type: Optional[str] = Field(None, max_length=50)
    tags: Optional[list[str]] = None
    cash_only: Optional[bool] = None
    description: Optional[str] = None
    google_place_id: Optional[str] = Field(None, max_length=255)
    price_level: Optional[int] = Field(None, ge=1, le=4)
    rating: Optional[float] = Field(None, ge=0, le=5)


class DealData(BaseModel):
    """Validated subset of Deal fields that a user may propose via submission."""

    model_config = ConfigDict(extra="ignore")

    venue_id: Optional[UUID] = None
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)
    deal_type: Optional[str] = Field(None, max_length=50)
    original_price: Optional[float] = Field(None, ge=0)
    deal_price: Optional[float] = Field(None, ge=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    items: Optional[list[str]] = None


class EventData(BaseModel):
    """Validated fields from a new_event submission."""

    model_config = ConfigDict(extra="ignore")

    bar_id: Optional[UUID] = None
    bar_name: Optional[str] = Field(None, max_length=255)
    event_name: Optional[str] = Field(None, max_length=255)
    event_type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

    # Recurrence — once|weekly|biweekly|monthly|custom (omitted = once for compat)
    recurrence_type: Optional[str] = Field(None, max_length=20)

    # Date for once/custom occurrences (MM/DD/YYYY accepted; YYYY-MM-DD also accepted)
    event_date: Optional[str] = Field(None, max_length=20)

    start_time: Optional[str] = Field(None, max_length=10)   # HH:MM 24hr
    end_time: Optional[str] = Field(None, max_length=10)     # HH:MM 24hr

    # For weekly/biweekly — list of full day names, e.g. ["Monday", "Thursday"]
    days: Optional[list[str]] = None

    # For monthly — day of month 1-28
    day_of_month: Optional[int] = Field(None, ge=1, le=28)

    # For custom — free-text pattern description
    notes: Optional[str] = None
