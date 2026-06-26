from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, time
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.core.database import get_db
from app.models.deal import Deal
from app.models.venue import Venue
from app.models.happy_hour import HappyHourSchedule
from app.schemas.deal import DealResponse
from app.services.search import bounding_box, haversine_distance


router = APIRouter(prefix="/deals", tags=["deals"])


def _now_eastern() -> datetime:
    """Return the current datetime in the app's configured timezone.

    HappyHourSchedule.start_time / end_time are stored as naive Time values
    representing local business hours (Eastern). All day-of-week and time
    comparisons must use the same timezone — never the server's local clock.
    """
    return datetime.now(ZoneInfo(settings.APP_TIMEZONE))


@router.get("/active", response_model=List[DealResponse])
async def get_active_deals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
    venue_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """
    Get all currently active deals. Optionally filter by venue or category.
    """
    query = db.query(Deal).options(joinedload(Deal.venue)).filter(Deal.active == True)

    if category:
        query = query.filter(Deal.category == category)

    if venue_id:
        query = query.filter(Deal.venue_id == venue_id)

    deals = query.offset(skip).limit(limit).all()
    return deals


@router.get("/today", response_model=List[DealResponse])
async def get_todays_deals(db: Session = Depends(get_db)):
    """
    Get all deals that are active today (based on schedule).
    """
    today = _now_eastern().weekday()  # 0=Monday

    deals = (
        db.query(Deal)
        .options(joinedload(Deal.venue))
        .filter(
            Deal.active == True,
            Deal.id.in_(
                db.query(func.unnest(HappyHourSchedule.deal_ids)).filter(
                    HappyHourSchedule.day_of_week == today,
                    HappyHourSchedule.active == True,
                )
            ),
        )
        .all()
    )
    return deals


@router.get("/nearby", response_model=List[DealResponse])
async def get_nearby_deals(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_meters: int = Query(1000, ge=100, le=10000),
    active_now: bool = Query(False),
    db: Session = Depends(get_db),
):
    """
    Find deals near a location.
    If active_now=true, only returns deals available at current time.
    """
    min_lat, max_lat, min_lng, max_lng = bounding_box(
        latitude, longitude, radius_meters
    )

    # Join deals with venues to filter by location (bounding box first)
    query = (
        db.query(Deal)
        .options(joinedload(Deal.venue))
        .join(Venue)
        .filter(
            Deal.active == True,
            Venue.active == True,
            Venue.latitude >= min_lat,
            Venue.latitude <= max_lat,
            Venue.longitude >= min_lng,
            Venue.longitude <= max_lng,
        )
    )

    if active_now:
        # Get current day and time in the app's local timezone
        now = _now_eastern()
        current_day = now.weekday()  # 0=Monday
        current_time = now.time()

        # Join with happy hour schedules
        query = query.join(
            HappyHourSchedule,
            and_(
                HappyHourSchedule.venue_id == Venue.id,
                HappyHourSchedule.day_of_week == current_day,
                HappyHourSchedule.start_time <= current_time,
                HappyHourSchedule.end_time >= current_time,
                HappyHourSchedule.active == True,
            ),
        )

    candidates = query.all()

    # compute distance per deal (using joined venue) and filter
    nearby = []
    for d in candidates:
        v = d.venue
        if not v or v.latitude is None or v.longitude is None:
            continue
        dist = haversine_distance(latitude, longitude, v.latitude, v.longitude)
        if dist <= radius_meters:
            nearby.append((d, dist))

    nearby.sort(key=lambda t: t[1])
    return [t[0] for t in nearby]


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(deal_id: UUID, db: Session = Depends(get_db)):
    """
    Get a specific deal by ID.
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    return deal
