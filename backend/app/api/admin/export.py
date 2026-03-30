"""
Admin data export — CSV downloads for backup.
Streams rows via generator to avoid loading entire tables into memory.
"""

import csv
import io
from typing import Generator
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.venue import Venue
from app.models.deal import Deal

router = APIRouter(
    prefix="/export", tags=["admin-export"], dependencies=[Depends(require_admin)]
)

BATCH_SIZE = 500


def _csv_row(fields: list) -> bytes:
    buf = io.StringIO()
    csv.writer(buf).writerow(fields)
    return buf.getvalue().encode("utf-8")


def _venue_rows(db: Session) -> Generator[bytes, None, None]:
    yield _csv_row(
        [
            "id",
            "name",
            "address",
            "latitude",
            "longitude",
            "phone",
            "website",
            "neighborhood",
            "venue_type",
            "google_place_id",
            "price_level",
            "rating",
            "verified",
            "active",
            "description",
            "created_at",
            "updated_at",
        ]
    )
    for v in db.query(Venue).order_by(Venue.name).yield_per(BATCH_SIZE):
        yield _csv_row(
            [
                str(v.id),
                v.name,
                v.address,
                v.latitude,
                v.longitude,
                v.phone,
                v.website,
                v.neighborhood,
                v.venue_type,
                v.google_place_id,
                v.price_level,
                v.rating,
                v.verified,
                v.active,
                v.description,
                v.created_at.isoformat() if v.created_at else "",
                v.updated_at.isoformat() if v.updated_at else "",
            ]
        )


def _deal_rows(db: Session) -> Generator[bytes, None, None]:
    yield _csv_row(
        [
            "id",
            "venue_id",
            "title",
            "description",
            "category",
            "deal_type",
            "original_price",
            "deal_price",
            "discount_percentage",
            "items",
            "source",
            "verified",
            "active",
            "created_at",
            "updated_at",
        ]
    )
    for d in db.query(Deal).order_by(Deal.title).yield_per(BATCH_SIZE):
        yield _csv_row(
            [
                str(d.id),
                str(d.venue_id),
                d.title,
                d.description,
                d.category,
                d.deal_type,
                d.original_price,
                d.deal_price,
                d.discount_percentage,
                "|".join(d.items) if d.items else "",
                d.source,
                d.verified,
                d.active,
                d.created_at.isoformat() if d.created_at else "",
                d.updated_at.isoformat() if d.updated_at else "",
            ]
        )


@router.get("/venues.csv")
async def export_venues_csv(db: Session = Depends(get_db)):
    """Export all venues as CSV."""
    return StreamingResponse(
        _venue_rows(db),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=venues.csv"},
    )


@router.get("/deals.csv")
async def export_deals_csv(db: Session = Depends(get_db)):
    """Export all deals as CSV."""
    return StreamingResponse(
        _deal_rows(db),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=deals.csv"},
    )
