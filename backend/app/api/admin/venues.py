"""
Admin Venue management — full CRUD with soft delete, search, and filtering.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, select
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import require_admin
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.user import User
from app.schemas.venue import VenueResponse, VenueCreate, VenueUpdate, VenueWithDeals

router = APIRouter(
    prefix="/venues", tags=["admin-venues"], dependencies=[Depends(require_admin)]
)


@router.get("/", response_model=List[VenueWithDeals])
async def list_venues(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    neighborhood: Optional[str] = None,
    venue_type: Optional[str] = None,
    active_only: Optional[bool] = None,
    sort_by: str = Query("name", pattern="^(name|neighborhood|created_at|updated_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """List all venues with search, filtering, and sorting."""
    query = db.query(Venue)

    # Filters
    if active_only is True:
        query = query.filter(Venue.active == True)
    elif active_only is False:
        query = query.filter(Venue.active == False)

    if neighborhood:
        query = query.filter(Venue.neighborhood == neighborhood)

    if venue_type:
        query = query.filter(Venue.venue_type == venue_type)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Venue.name.ilike(search_term),
                Venue.address.ilike(search_term),
                Venue.neighborhood.ilike(search_term),
            )
        )

    # Sorting
    sort_col = getattr(Venue, sort_by)
    if sort_order == "desc":
        sort_col = sort_col.desc()
    query = query.order_by(sort_col)

    venues = query.offset(skip).limit(limit).all()

    if not venues:
        return []

    # Batch-load deal counts via two correlated subqueries (1 query total).
    venue_ids = [v.id for v in venues]
    counts = (
        db.query(
            Deal.venue_id,
            func.count(Deal.id).label("deals_count"),
            func.count(Deal.id).filter(Deal.active == True).label("active_deals_count"),
        )
        .filter(Deal.venue_id.in_(venue_ids))
        .group_by(Deal.venue_id)
        .all()
    )
    count_map = {c.venue_id: (c.deals_count, c.active_deals_count) for c in counts}

    result = []
    for venue in venues:
        dc, adc = count_map.get(venue.id, (0, 0))
        venue_data = VenueWithDeals.model_validate(venue)
        venue_data.deals_count = dc
        venue_data.active_deals_count = adc
        result.append(venue_data)

    return result


@router.get("/count")
async def count_venues(
    active_only: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """Get total venue count (for pagination)."""
    query = db.query(func.count(Venue.id))
    if active_only is True:
        query = query.filter(Venue.active == True)
    elif active_only is False:
        query = query.filter(Venue.active == False)
    return {"count": query.scalar()}


@router.get("/neighborhoods", response_model=List[str])
async def list_neighborhoods(db: Session = Depends(get_db)):
    """Get all distinct neighborhoods."""
    neighborhoods = (
        db.query(Venue.neighborhood)
        .filter(Venue.neighborhood.isnot(None))
        .distinct()
        .order_by(Venue.neighborhood)
        .all()
    )
    return [n[0] for n in neighborhoods]


@router.get("/venue-types", response_model=List[str])
async def list_venue_types(db: Session = Depends(get_db)):
    """Get all distinct venue types."""
    types = (
        db.query(Venue.venue_type)
        .filter(Venue.venue_type.isnot(None))
        .distinct()
        .order_by(Venue.venue_type)
        .all()
    )
    return [t[0] for t in types]


@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(venue_id: UUID, db: Session = Depends(get_db)):
    """Get a single venue by ID."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue


@router.post("/", response_model=VenueResponse, status_code=201)
async def create_venue(venue: VenueCreate, db: Session = Depends(get_db)):
    """Create a new venue."""
    # Check for duplicate by google_place_id
    if venue.google_place_id:
        existing = (
            db.query(Venue)
            .filter(Venue.google_place_id == venue.google_place_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Venue with google_place_id '{venue.google_place_id}' already exists (id: {existing.id})",
            )

    db_venue = Venue(**venue.model_dump())
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue


@router.put("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: UUID, venue_update: VenueUpdate, db: Session = Depends(get_db)
):
    """Update an existing venue."""
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    update_data = venue_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_venue, field, value)

    db.commit()
    db.refresh(db_venue)
    return db_venue


@router.patch("/{venue_id}/toggle-active", response_model=VenueResponse)
async def toggle_venue_active(venue_id: UUID, db: Session = Depends(get_db)):
    """Toggle a venue's active status (soft delete/restore)."""
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    db_venue.active = not db_venue.active
    db.commit()
    db.refresh(db_venue)
    return db_venue
