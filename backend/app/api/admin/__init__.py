from fastapi import APIRouter
from . import venues, deals, export

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(venues.router)
router.include_router(deals.router)
router.include_router(export.router)
