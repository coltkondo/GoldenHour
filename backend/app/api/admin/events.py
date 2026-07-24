from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import require_admin
from app.models.event import Event
from app.models.venue import Venue

router = APIRouter(
    prefix="/events",
    tags=["admin-events"],
    dependencies=[Depends(require_admin)],
)

EVENT_TYPES = ["ufc", "nfl", "cfb", "nba", "nhl", "mlb", "fifa", "local", "trivia", "karaoke", "live_music", "flex", "other"]


class EventCreate(BaseModel):
    venue_id: UUID
    series_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    deal_ids: Optional[List[UUID]] = None
    image_url: Optional[str] = None
    is_sponsored: bool = False
    is_recurring: bool = False
    active: bool = True
    verified: bool = True
    source: str = "manual"


class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    deal_ids: Optional[List[UUID]] = None
    image_url: Optional[str] = None
    is_sponsored: Optional[bool] = None
    is_recurring: Optional[bool] = None
    active: Optional[bool] = None
    verified: Optional[bool] = None


class SeriesCreate(BaseModel):
    """Batch-create a series of events that share the same details but have different start datetimes."""
    venue_id: UUID
    name: str
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_datetimes: List[datetime]
    end_time_offset_minutes: Optional[int] = None  # if set, end = start + N minutes
    deal_ids: Optional[List[UUID]] = None
    image_url: Optional[str] = None
    is_sponsored: bool = False
    source: str = "manual"


def _serialize(e: Event) -> dict:
    return {
        "id": str(e.id),
        "venue_id": str(e.venue_id),
        "venue_name": e.venue.name if e.venue else None,
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
        "updated_at": e.updated_at.isoformat() if e.updated_at else None,
    }


@router.get("/")
def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    venue_id: Optional[UUID] = Query(None),
    series_id: Optional[UUID] = Query(None),
    event_type: Optional[str] = Query(None),
    active_only: Optional[bool] = Query(None),
    upcoming_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(Event).options(joinedload(Event.venue))
    if venue_id:
        query = query.filter(Event.venue_id == venue_id)
    if series_id:
        query = query.filter(Event.series_id == series_id)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if active_only is not None:
        query = query.filter(Event.active == active_only)
    if upcoming_only:
        query = query.filter(Event.start_datetime >= datetime.utcnow())
    events = query.order_by(Event.start_datetime.asc()).offset(skip).limit(limit).all()
    return [_serialize(e) for e in events]


@router.get("/event-types")
def event_types():
    return EVENT_TYPES


@router.get("/{event_id}")
def get_event(event_id: UUID, db: Session = Depends(get_db)):
    e = db.query(Event).options(joinedload(Event.venue)).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return _serialize(e)


@router.post("/", status_code=201)
def create_event(data: EventCreate, db: Session = Depends(get_db)):
    venue = db.query(Venue).filter(Venue.id == data.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    e = Event(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    db.refresh(e, ["venue"])
    return _serialize(e)


@router.post("/series", status_code=201)
def create_series(data: SeriesCreate, db: Session = Depends(get_db)):
    """Batch-create multiple occurrences of the same event (e.g. all Penn State home games)."""
    venue = db.query(Venue).filter(Venue.id == data.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if not data.start_datetimes:
        raise HTTPException(status_code=422, detail="At least one start datetime required")

    series_id = uuid4()
    events = []
    for start_dt in data.start_datetimes:
        end_dt = None
        if data.end_time_offset_minutes:
            from datetime import timedelta
            end_dt = start_dt + timedelta(minutes=data.end_time_offset_minutes)
        e = Event(
            venue_id=data.venue_id,
            series_id=series_id,
            name=data.name,
            description=data.description,
            event_type=data.event_type,
            start_datetime=start_dt,
            end_datetime=end_dt,
            deal_ids=data.deal_ids,
            image_url=data.image_url,
            is_sponsored=data.is_sponsored,
            is_recurring=True,
            active=True,
            verified=True,
            source=data.source,
        )
        events.append(e)

    db.add_all(events)
    db.commit()
    return {"series_id": str(series_id), "created": len(events)}


@router.put("/{event_id}")
def update_event(event_id: UUID, data: EventUpdate, db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(e, field, value)
    db.commit()
    db.refresh(e)
    return _serialize(e)


@router.put("/series/{series_id}")
def update_series(series_id: UUID, data: EventUpdate, db: Session = Depends(get_db)):
    """Update all events in a series (name, description, type, etc. — not datetimes)."""
    events = db.query(Event).filter(Event.series_id == series_id).all()
    if not events:
        raise HTTPException(status_code=404, detail="Series not found")
    updates = data.model_dump(exclude_unset=True)
    # Don't bulk-update start/end datetimes — each occurrence has its own
    updates.pop("start_datetime", None)
    updates.pop("end_datetime", None)
    for e in events:
        for field, value in updates.items():
            setattr(e, field, value)
    db.commit()
    return {"updated": len(events)}


@router.patch("/{event_id}/toggle-active")
def toggle_active(event_id: UUID, db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    e.active = not e.active
    db.commit()
    return {"id": str(e.id), "active": e.active}


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: UUID, db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(e)
    db.commit()
