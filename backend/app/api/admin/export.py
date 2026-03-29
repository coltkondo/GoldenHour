"""
Admin data export — CSV downloads for backup.
"""

import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.user import User

router = APIRouter(
    prefix="/export", tags=["admin-export"], dependencies=[Depends(require_admin)]
)


@router.get("/venues.csv")
async def export_venues_csv(db: Session = Depends(get_db)):
    """Export all venues as CSV."""
    venues = db.query(Venue).order_by(Venue.name).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
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
    for v in venues:
        writer.writerow(
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

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=venues.csv"},
    )


@router.get("/deals.csv")
async def export_deals_csv(db: Session = Depends(get_db)):
    """Export all deals as CSV."""
    deals = db.query(Deal).order_by(Deal.title).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
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
    for d in deals:
        writer.writerow(
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

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=deals.csv"},
    )
