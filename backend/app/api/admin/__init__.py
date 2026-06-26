from fastapi import APIRouter
from . import venues, deals, export, submissions, users

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(venues.router)
router.include_router(deals.router)
router.include_router(export.router)
router.include_router(submissions.router)
router.include_router(users.router)
