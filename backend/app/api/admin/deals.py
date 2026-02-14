"""
Admin Deal management — full CRUD with soft delete, search, and filtering.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.models.deal import Deal
from app.models.venue import Venue
from app.schemas.deal import DealResponse, DealCreate, DealUpdate, DealWithVenue

router = APIRouter(prefix="/deals", tags=["admin-deals"])


@router.get("/", response_model=List[DealWithVenue])
async def list_deals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    venue_id: Optional[UUID] = None,
    category: Optional[str] = None,
    deal_type: Optional[str] = None,
    active_only: Optional[bool] = None,
    sort_by: str = Query("title", pattern="^(title|category|deal_type|created_at|updated_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """List all deals with search, filtering, and sorting."""
    query = db.query(Deal, Venue.name.label("venue_name")).outerjoin(
        Venue, Deal.venue_id == Venue.id
    )

    # Filters
    if active_only is True:
        query = query.filter(Deal.active == True)
    elif active_only is False:
        query = query.filter(Deal.active == False)

    if venue_id:
        query = query.filter(Deal.venue_id == venue_id)

    if category:
        query = query.filter(Deal.category == category)

    if deal_type:
        query = query.filter(Deal.deal_type == deal_type)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Deal.title.ilike(search_term),
                Deal.description.ilike(search_term),
                Venue.name.ilike(search_term),
            )
        )

    # Sorting
    sort_col = getattr(Deal, sort_by)
    if sort_order == "desc":
        sort_col = sort_col.desc()
    query = query.order_by(sort_col)

    rows = query.offset(skip).limit(limit).all()

    result = []
    for deal, venue_name in rows:
        deal_data = DealWithVenue.model_validate(deal)
        deal_data.venue_name = venue_name
        result.append(deal_data)

    return result


@router.get("/count")
async def count_deals(
    active_only: Optional[bool] = None,
    venue_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """Get total deal count (for pagination)."""
    query = db.query(func.count(Deal.id))
    if active_only is True:
        query = query.filter(Deal.active == True)
    elif active_only is False:
        query = query.filter(Deal.active == False)
    if venue_id:
        query = query.filter(Deal.venue_id == venue_id)
    return {"count": query.scalar()}


@router.get("/categories", response_model=List[str])
async def list_categories(db: Session = Depends(get_db)):
    """Get all distinct deal categories."""
    categories = (
        db.query(Deal.category)
        .filter(Deal.category.isnot(None))
        .distinct()
        .order_by(Deal.category)
        .all()
    )
    return [c[0] for c in categories]


@router.get("/deal-types", response_model=List[str])
async def list_deal_types(db: Session = Depends(get_db)):
    """Get all distinct deal types."""
    types = (
        db.query(Deal.deal_type)
        .filter(Deal.deal_type.isnot(None))
        .distinct()
        .order_by(Deal.deal_type)
        .all()
    )
    return [t[0] for t in types]


@router.get("/{deal_id}", response_model=DealWithVenue)
async def get_deal(deal_id: UUID, db: Session = Depends(get_db)):
    """Get a single deal by ID with venue name."""
    row = (
        db.query(Deal, Venue.name.label("venue_name"))
        .outerjoin(Venue, Deal.venue_id == Venue.id)
        .filter(Deal.id == deal_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Deal not found")

    deal, venue_name = row
    deal_data = DealWithVenue.model_validate(deal)
    deal_data.venue_name = venue_name
    return deal_data


@router.post("/", response_model=DealResponse, status_code=201)
async def create_deal(deal: DealCreate, db: Session = Depends(get_db)):
    """Create a new deal."""
    venue = db.query(Venue).filter(Venue.id == deal.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    db_deal = Deal(**deal.model_dump())
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    return db_deal


@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: UUID, deal_update: DealUpdate, db: Session = Depends(get_db)
):
    """Update an existing deal."""
    db_deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not db_deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    update_data = deal_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_deal, field, value)

    db.commit()
    db.refresh(db_deal)
    return db_deal


@router.patch("/{deal_id}/toggle-active", response_model=DealResponse)
async def toggle_deal_active(deal_id: UUID, db: Session = Depends(get_db)):
    """Toggle a deal's active status (soft delete/restore)."""
    db_deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not db_deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    db_deal.active = not db_deal.active
    db.commit()
    db.refresh(db_deal)
    return db_deal
