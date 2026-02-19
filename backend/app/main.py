from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.models.base import Base
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.happy_hour import HappyHourSchedule
from app.models.user import User
from app.models.submission import Submission
from app.models.point_transaction import PointTransaction
from app.api.v1 import venues, deals
from app.api.v1 import auth, submissions, points, leaderboard
from app.api.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from scripts.import_csv import seed_if_empty
        seed_if_empty(db)
    except Exception as e:
        print(f"Auto-seed note: {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Golden Hour - Happy Hour Discovery API",
    lifespan=lifespan,
)

# CORS middleware for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public v1 routers
app.include_router(venues.router, prefix=settings.API_V1_PREFIX)
app.include_router(deals.router, prefix=settings.API_V1_PREFIX)

# Auth + user-facing feature routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(submissions.router, prefix=settings.API_V1_PREFIX)
app.include_router(points.router, prefix=settings.API_V1_PREFIX)
app.include_router(leaderboard.router, prefix=settings.API_V1_PREFIX)

# Admin router (all endpoints require admin role)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return {
        "message": "Golden Hour API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
