from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.models.venue import Venue
from app.schemas.venue import VenueResponse, VenueCreate, VenueWithDeals
from geoalchemy2.functions import ST_DWithin, ST_MakePoint
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/venues", tags=["venues"])

@router.get("/", response_model=List[VenueResponse])
async def list_venues(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    neighborhood: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    List all venues with optional filtering.
    """
    query = db.query(Venue)
    
    if active_only:
        query = query.filter(Venue.active == True)
    
    if neighborhood:
        query = query.filter(Venue.neighborhood == neighborhood)
    
    venues = query.offset(skip).limit(limit).all()
    return venues

@router.get("/nearby", response_model=List[VenueResponse])
async def get_nearby_venues(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_meters: int = Query(1000, ge=100, le=10000),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Find venues within a radius of a given location.
    Radius is in meters (default 1km, max 10km).
    """
    # Create point from lat/lng
    point = WKTElement(f'POINT({longitude} {latitude})', srid=4326)
    
    # Query venues within radius
    venues = db.query(Venue).filter(
        and_(
            Venue.active == True,
            func.ST_DWithin(
                Venue.location,
                point,
                radius_meters
            )
        )
    ).limit(limit).all()
    
    return venues

@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a specific venue by ID.
    """
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    return venue

@router.post("/", response_model=VenueResponse, status_code=201)
async def create_venue(
    venue: VenueCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new venue.
    """
    # Create WKT point from lat/lng for PostGIS
    location = WKTElement(f'POINT({venue.longitude} {venue.latitude})', srid=4326)
    
    db_venue = Venue(
        **venue.model_dump(),
        location=location
    )
    
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    
    return db_venue

@router.get("/neighborhoods/list", response_model=List[str])
async def list_neighborhoods(db: Session = Depends(get_db)):
    """
    Get list of all neighborhoods with active venues.
    """
    neighborhoods = db.query(Venue.neighborhood).filter(
        and_(
            Venue.active == True,
            Venue.neighborhood.isnot(None)
        )
    ).distinct().all()
    
    return [n[0] for n in neighborhoods]