from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
import time

from app.core.database import get_db
from app.models.venue import Venue
from app.models.happy_hour import HappyHourSchedule
from app.schemas.venue import VenueResponse
from app.schemas.happy_hour import HappyHourScheduleResponse
from app.core.logging import logger
from app.models.market import Market


router = APIRouter(prefix="/venues", tags=["venues"])


@router.get("/", response_model=List[VenueResponse])
async def list_venues(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    neighborhood: Optional[str] = None,
    active_only: bool = True,
    market_slug: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Venue)

    if active_only:
        query = query.filter(Venue.active == True)

    if neighborhood:
        query = query.filter(Venue.neighborhood == neighborhood)

    if market_slug:
        market = db.query(Market).filter(Market.slug == market_slug).first()
        if market:
            query = query.filter(Venue.market_id == market.id)

    venues = query.offset(skip).limit(limit).all()
    return venues


@router.get("/nearby", response_model=List[VenueResponse])
async def get_nearby_venues(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_meters: int = Query(1000, ge=100, le=10000),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    logger.bind(
        latitude=latitude, longitude=longitude, radius=radius_meters, limit=limit
    ).info("geospatial_search_started")

    start_time = time.time()

    # Use PostGIS ST_DWithin for index-accelerated distance filtering
    user_point = func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326)
    venue_point = func.ST_SetSRID(
        func.ST_MakePoint(Venue.longitude, Venue.latitude), 4326
    )

    venues = (
        db.query(Venue)
        .filter(
            Venue.active == True,
            func.ST_DWithin(
                func.geography(venue_point),
                func.geography(user_point),
                radius_meters,
            ),
        )
        .order_by(
            func.ST_Distance(
                func.geography(venue_point),
                func.geography(user_point),
            )
        )
        .limit(limit)
        .all()
    )

    elapsed_ms = (time.time() - start_time) * 1000
    logger.bind(results_count=len(venues), elapsed_ms=round(elapsed_ms, 2)).info(
        "geospatial_search_completed"
    )

    return venues


@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(venue_id: UUID, db: Session = Depends(get_db)):
    """
    Get a specific venue by ID.
    """
    venue = db.query(Venue).filter(Venue.id == venue_id).first()

    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    return venue


@router.get("/{venue_id}/schedules", response_model=List[HappyHourScheduleResponse])
async def get_venue_schedules(venue_id: UUID, db: Session = Depends(get_db)):
    """
    Get all happy hour schedules for a venue.
    """
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    schedules = (
        db.query(HappyHourSchedule)
        .filter(
            HappyHourSchedule.venue_id == venue_id, HappyHourSchedule.active == True
        )
        .order_by(HappyHourSchedule.day_of_week, HappyHourSchedule.start_time)
        .all()
    )
    return schedules


@router.get("/neighborhoods/list", response_model=List[str])
async def list_neighborhoods(db: Session = Depends(get_db)):
    """
    Get list of all neighborhoods with active venues.
    """
    neighborhoods = (
        db.query(Venue.neighborhood)
        .filter(Venue.active == True, Venue.neighborhood.isnot(None))
        .distinct()
        .all()
    )

    return [n[0] for n in neighborhoods]
