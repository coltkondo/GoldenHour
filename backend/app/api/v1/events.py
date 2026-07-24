from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.event import Event
from app.models.market import Market
from app.models.venue import Venue

router = APIRouter(prefix="/events", tags=["events"])


def _serialize(e: Event) -> dict:
    return {
        "id": str(e.id),
        "venue_id": str(e.venue_id),
        "venue_name": e.venue.name if e.venue else None,
        "venue_neighborhood": e.venue.neighborhood if e.venue else None,
        "series_id": str(e.series_id) if e.series_id else None,
        "name": e.name,
        "description": e.description,
        "event_type": e.event_type,
        "start_datetime": e.start_datetime.isoformat() if e.start_datetime else None,
        "end_datetime": e.end_datetime.isoformat() if e.end_datetime else None,
        "deal_ids": [str(d) for d in e.deal_ids] if e.deal_ids else [],
        "image_url": e.image_url,
        "is_sponsored": e.is_sponsored,
        "is_recurring": e.is_recurring,
        "active": e.active,
        "verified": e.verified,
        "source": e.source,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


@router.get("/")
def list_events(
    market_slug: Optional[str] = Query(None),
    venue_id: Optional[UUID] = Query(None),
    from_dt: Optional[datetime] = Query(None),
    to_dt: Optional[datetime] = Query(None),
    event_type: Optional[str] = Query(None),
    upcoming_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Return active, verified events. Defaults to upcoming events sorted by start time."""
    query = (
        db.query(Event)
        .join(Venue, Venue.id == Event.venue_id)
        .options(joinedload(Event.venue))
        .filter(Event.active == True, Event.verified == True)
    )

    if market_slug:
        query = (
            query.join(Market, Market.id == Venue.market_id)
            .filter(Market.slug == market_slug)
        )
    if venue_id:
        query = query.filter(Event.venue_id == venue_id)
    if upcoming_only:
        query = query.filter(Event.start_datetime >= datetime.now(timezone.utc))
    if from_dt:
        query = query.filter(Event.start_datetime >= from_dt)
    if to_dt:
        query = query.filter(Event.start_datetime <= to_dt)
    if event_type:
        query = query.filter(Event.event_type == event_type)

    events = (
        query.order_by(Event.start_datetime.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize(e) for e in events]


@router.get("/by-venue/{venue_id}")
def events_for_venue(
    venue_id: UUID,
    upcoming_only: bool = Query(True),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Return events for a specific venue, upcoming by default."""
    query = (
        db.query(Event)
        .options(joinedload(Event.venue))
        .filter(Event.venue_id == venue_id, Event.active == True, Event.verified == True)
    )
    if upcoming_only:
        query = query.filter(Event.start_datetime >= datetime.now(timezone.utc))
    events = query.order_by(Event.start_datetime.asc()).limit(limit).all()
    return [_serialize(e) for e in events]
