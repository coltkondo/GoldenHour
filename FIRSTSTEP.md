# Golden Hour - Development Roadmap & First Steps

## Table of Contents
1. [Project Overview](#project-overview)
2. [Development Philosophy](#development-philosophy)
3. [Week 1: Foundation](#week-1-foundation-backend--database)
4. [Week 2: Mobile MVP](#week-2-mobile-mvp)
5. [Team Workflow](#team-workflow)
6. [Success Criteria](#success-criteria)

---

## Project Overview

**Mission**: Build a scalable, community-driven happy hour discovery platform for the DC metro area that solves the stale data problem plaguing existing solutions.

**Core Value Proposition**: 
- Real-time, accurate happy hour information
- Community-verified deals and schedules
- Smart recommendations based on location, time, and preferences
- Social coordination features

**Tech Stack**:
- **Backend**: FastAPI (Python) + PostgreSQL + PostGIS + Redis
- **Mobile**: React Native (Expo)
- **Admin**: React (deployed separately)
- **Infrastructure**: Railway/Render + Supabase (optional)

---

## Development Philosophy

### Build Vertically, Not Horizontally
- Complete one feature end-to-end before starting another
- A working map view with 10 venues beats 50% of all planned features
- Ship early, ship often

### Real Data From Day One
- No lorem ipsum, no fake venues
- Seed database with actual DC establishments you've visited
- Test with real locations using real GPS coordinates

### Mobile-First Mindset
- Backend exists to serve the mobile app
- Every API endpoint should have a clear mobile use case
- Test on actual devices weekly, not just simulators

### Iterate Based on Usage
- Build the minimum to be personally useful
- Use the app yourself every weekend
- Let real frustrations guide feature priority

---

## Week 1: Foundation (Backend + Database)

### Prerequisites Setup

**Required Software**:
```bash
# Install these before starting
- Python 3.11+
- PostgreSQL 15+ with PostGIS extension
- Redis
- Docker & Docker Compose
- Git
- VS Code (or preferred IDE)
```

**Environment Setup**:
```bash
# Clone the repository
git clone <repo-url>
cd golden-hour

# Install pre-commit hooks (for code quality)
pip install pre-commit
pre-commit install
```

---

### Day 1-2: Database Architecture & Models

**Objective**: Establish the data foundation that drives the entire application.

#### Step 1: Local Database Setup

```bash
# Start PostgreSQL with PostGIS using Docker
cd golden-hour
docker-compose up -d db redis

# Verify connection
docker exec -it golden-hour-db psql -U postgres
# Inside psql:
CREATE DATABASE goldenhour;
\c goldenhour
CREATE EXTENSION postgis;
\q
```

#### Step 2: Backend Environment Configuration

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# If requirements.txt doesn't exist yet, install core packages:
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic pydantic python-jose[cryptography] passlib[bcrypt] python-multipart redis geoalchemy2
pip freeze > requirements.txt
```

#### Step 3: Create Environment File

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goldenhour
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**⚠️ IMPORTANT**: Add `.env` to `.gitignore` - never commit secrets!

#### Step 4: Initialize Alembic (Database Migrations)

```bash
cd backend
alembic init alembic

# Edit alembic.ini - find this line:
# sqlalchemy.url = driver://user:pass@localhost/dbname
# Replace with:
# sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/goldenhour

# Or better, use env variable in alembic/env.py:
```

**Edit `alembic/env.py`**:
```python
from app.core.config import settings
from app.models.base import Base

# Add at top
import os
from dotenv import load_dotenv
load_dotenv()

# Replace this line:
# target_metadata = None
# With:
target_metadata = Base.metadata

# Replace config.get_main_option("sqlalchemy.url")
# With:
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))
```

#### Step 5: Create Core Models

Create the following file structure:

```
backend/app/models/
├── __init__.py
├── base.py
├── venue.py
├── deal.py
├── happy_hour.py
└── user.py
```

**`backend/app/models/base.py`**:
```python
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime
from datetime import datetime

Base = declarative_base()

class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
```

**`backend/app/models/venue.py`**:
```python
from sqlalchemy import Column, String, Float, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
import uuid
from .base import Base, TimestampMixin

class Venue(Base, TimestampMixin):
    __tablename__ = "venues"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=False)
    
    # Geographic data
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography(geometry_type='POINT', srid=4326))
    
    # Contact & details
    phone = Column(String(20))
    website = Column(String(500))
    
    # Categorization
    neighborhood = Column(String(100), index=True)
    venue_type = Column(String(50))  # "bar", "restaurant", "rooftop", etc.
    
    # Metadata
    verified = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    description = Column(Text)
    
    def __repr__(self):
        return f"<Venue {self.name} ({self.neighborhood})>"
```

**`backend/app/models/deal.py`**:
```python
from sqlalchemy import Column, String, Float, Boolean, Text, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin

class Deal(Base, TimestampMixin):
    __tablename__ = "deals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey('venues.id'), nullable=False)
    
    # Deal details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Categorization
    category = Column(String(50))  # "drinks", "food", "both"
    deal_type = Column(String(50))  # "discount", "bogo", "special_price", "free"
    
    # Pricing
    original_price = Column(Float)
    deal_price = Column(Float)
    discount_percentage = Column(Float)
    
    # Items included
    items = Column(ARRAY(String))  # ["Well drinks", "House wine", "Draft beer"]
    
    # Status
    active = Column(Boolean, default=True)
    verified = Column(Boolean, default=False)
    
    # Relationships
    venue = relationship("Venue", backref="deals")
    
    def __repr__(self):
        return f"<Deal {self.title} at {self.venue_id}>"
```

**`backend/app/models/happy_hour.py`**:
```python
from sqlalchemy import Column, String, Integer, Time, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid
from .base import Base, TimestampMixin

class HappyHourSchedule(Base, TimestampMixin):
    __tablename__ = "happy_hour_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey('venues.id'), nullable=False)
    
    # Schedule
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Associated deals
    deal_ids = Column(ARRAY(UUID(as_uuid=True)))
    
    # Additional info
    notes = Column(Text)  # "Patio only", "Bar seating only", etc.
    restrictions = Column(Text)  # "Dine-in only", "Max 2 per person"
    
    # Status
    active = Column(Boolean, default=True)
    
    # Relationships
    venue = relationship("Venue", backref="schedules")
    
    def __repr__(self):
        return f"<HappyHour {self.venue_id} Day:{self.day_of_week} {self.start_time}-{self.end_time}>"
```

**`backend/app/models/__init__.py`**:
```python
from .base import Base
from .venue import Venue
from .deal import Deal
from .happy_hour import HappyHourSchedule

__all__ = ["Base", "Venue", "Deal", "HappyHourSchedule"]
```

#### Step 6: Create Initial Migration

```bash
# Generate migration from models
alembic revision --autogenerate -m "Initial tables: venues, deals, happy_hour_schedules"

# Review the generated migration in alembic/versions/
# Make sure it looks correct!

# Apply migration
alembic upgrade head

# Verify in database
docker exec -it golden-hour-db psql -U postgres goldenhour
\dt
# You should see your tables
```

#### Step 7: Create Database Indexes

Create a new migration for performance indexes:

```bash
alembic revision -m "Add performance indexes"
```

Edit the generated file:

```python
def upgrade():
    # Spatial index for location-based queries
    op.execute("""
        CREATE INDEX idx_venues_location 
        ON venues USING GIST (location);
    """)
    
    # Indexes for common queries
    op.execute("CREATE INDEX idx_venues_neighborhood ON venues(neighborhood);")
    op.execute("CREATE INDEX idx_venues_active ON venues(active);")
    op.execute("CREATE INDEX idx_deals_venue_id ON deals(venue_id);")
    op.execute("CREATE INDEX idx_deals_active ON deals(active);")
    op.execute("CREATE INDEX idx_happy_hour_venue_id ON happy_hour_schedules(venue_id);")
    op.execute("CREATE INDEX idx_happy_hour_day ON happy_hour_schedules(day_of_week);")

def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_venues_location;")
    op.execute("DROP INDEX IF EXISTS idx_venues_neighborhood;")
    op.execute("DROP INDEX IF EXISTS idx_venues_active;")
    op.execute("DROP INDEX IF EXISTS idx_deals_venue_id;")
    op.execute("DROP INDEX IF EXISTS idx_deals_active;")
    op.execute("DROP INDEX IF EXISTS idx_happy_hour_venue_id;")
    op.execute("DROP INDEX IF EXISTS idx_happy_hour_day;")
```

Apply migration:
```bash
alembic upgrade head
```

---

### Day 3-4: Core API Development

**Objective**: Build functional REST API endpoints for venue and deal discovery.

#### Step 1: Project Structure Setup

Create this structure:

```
backend/app/
├── __init__.py
├── main.py
├── core/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   └── security.py
├── api/
│   ├── __init__.py
│   └── v1/
│       ├── __init__.py
│       ├── venues.py
│       ├── deals.py
│       └── happy_hours.py
├── schemas/
│   ├── __init__.py
│   ├── venue.py
│   ├── deal.py
│   └── happy_hour.py
├── services/
│   ├── __init__.py
│   ├── geocoding.py
│   └── search.py
└── models/
    └── (already created)
```

#### Step 2: Configuration Management

**`backend/app/core/config.py`**:
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Golden Hour API"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

**`backend/app/core/database.py`**:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### Step 3: Pydantic Schemas (Request/Response Models)

**`backend/app/schemas/venue.py`**:
```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class VenueBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    phone: Optional[str] = None
    website: Optional[str] = None
    neighborhood: Optional[str] = None
    venue_type: Optional[str] = None
    description: Optional[str] = None

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    neighborhood: Optional[str] = None
    venue_type: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class VenueResponse(VenueBase):
    id: UUID
    verified: bool
    active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class VenueWithDeals(VenueResponse):
    deals_count: int
    active_deals_count: int
```

**`backend/app/schemas/deal.py`**:
```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class DealBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str  # "drinks", "food", "both"
    deal_type: str  # "discount", "bogo", "special_price"
    original_price: Optional[float] = Field(None, ge=0)
    deal_price: Optional[float] = Field(None, ge=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    items: List[str] = []

class DealCreate(DealBase):
    venue_id: UUID

class DealUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    deal_type: Optional[str] = None
    original_price: Optional[float] = None
    deal_price: Optional[float] = None
    items: Optional[List[str]] = None
    active: Optional[bool] = None

class DealResponse(DealBase):
    id: UUID
    venue_id: UUID
    active: bool
    verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

#### Step 4: API Endpoints

**`backend/app/api/v1/venues.py`**:
```python
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
```

**`backend/app/api/v1/deals.py`**:
```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, time

from app.core.database import get_db
from app.models.deal import Deal
from app.models.venue import Venue
from app.models.happy_hour import HappyHourSchedule
from app.schemas.deal import DealResponse, DealCreate
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/deals", tags=["deals"])

@router.get("/active", response_model=List[DealResponse])
async def get_active_deals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all currently active deals.
    """
    query = db.query(Deal).filter(Deal.active == True)
    
    if category:
        query = query.filter(Deal.category == category)
    
    deals = query.offset(skip).limit(limit).all()
    return deals

@router.get("/nearby", response_model=List[DealResponse])
async def get_nearby_deals(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_meters: int = Query(1000, ge=100, le=10000),
    active_now: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Find deals near a location.
    If active_now=true, only returns deals available at current time.
    """
    point = WKTElement(f'POINT({longitude} {latitude})', srid=4326)
    
    # Join deals with venues to filter by location
    query = db.query(Deal).join(Venue).filter(
        and_(
            Deal.active == True,
            Venue.active == True,
            func.ST_DWithin(Venue.location, point, radius_meters)
        )
    )
    
    if active_now:
        # Get current day and time
        now = datetime.now()
        current_day = now.weekday()  # 0=Monday
        current_time = now.time()
        
        # Join with happy hour schedules
        query = query.join(
            HappyHourSchedule,
            and_(
                HappyHourSchedule.venue_id == Venue.id,
                HappyHourSchedule.day_of_week == current_day,
                HappyHourSchedule.start_time <= current_time,
                HappyHourSchedule.end_time >= current_time,
                HappyHourSchedule.active == True
            )
        )
    
    deals = query.all()
    return deals

@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a specific deal by ID.
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return deal

@router.post("/", response_model=DealResponse, status_code=201)
async def create_deal(
    deal: DealCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new deal.
    """
    # Verify venue exists
    venue = db.query(Venue).filter(Venue.id == deal.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    db_deal = Deal(**deal.model_dump())
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    
    return db_deal
```

#### Step 5: Main Application Setup

**`backend/app/main.py`**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import venues, deals

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Golden Hour - DC Happy Hour Discovery API"
)

# CORS middleware for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(venues.router, prefix=settings.API_V1_PREFIX)
app.include_router(deals.router, prefix=settings.API_V1_PREFIX)

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
```

#### Step 6: Test the API

```bash
# Start the server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Visit in browser:
# http://localhost:8000/docs
# Interactive API documentation (Swagger UI)

# Test endpoints:
# http://localhost:8000/api/v1/venues
# http://localhost:8000/api/v1/deals/active
```

**Test with curl**:
```bash
# Create a venue
curl -X POST "http://localhost:8000/api/v1/venues" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "The Brixton",
    "address": "901 U St NW, Washington, DC",
    "latitude": 38.9169,
    "longitude": -77.0251,
    "neighborhood": "U Street",
    "venue_type": "bar"
  }'

# Get nearby venues
curl "http://localhost:8000/api/v1/venues/nearby?latitude=38.9169&longitude=-77.0251&radius_meters=2000"
```

---

### Day 5-7: Seed Data & Deployment

**Objective**: Populate database with real DC venues and deploy to production.

#### Step 1: Create Seed Script

**`backend/scripts/seed_dc_venues.py`**:
```python
"""
Seed database with initial DC venues and deals.
Run with: python -m scripts.seed_dc_venues
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.happy_hour import HappyHourSchedule
from geoalchemy2 import WKTElement
from datetime import time

def seed_venues_and_deals():
    db: Session = SessionLocal()
    
    try:
        print("🌱 Seeding DC venues and deals...")
        
        # Sample DC venues with real data
        venues_data = [
            {
                "name": "The Brixton",
                "address": "901 U St NW, Washington, DC 20001",
                "latitude": 38.9169,
                "longitude": -77.0251,
                "neighborhood": "U Street",
                "venue_type": "bar",
                "phone": "(202) 560-5045",
                "description": "British-inspired pub with rooftop",
                "deals": [
                    {
                        "title": "$5 Rail Drinks",
                        "description": "Well drinks and house wine",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 5.00,
                        "items": ["Well drinks", "House wine"],
                        "schedules": [
                            {"day": 0, "start": "16:00", "end": "19:00"},  # Monday
                            {"day": 1, "start": "16:00", "end": "19:00"},  # Tuesday
                            {"day": 2, "start": "16:00", "end": "19:00"},  # Wednesday
                            {"day": 3, "start": "16:00", "end": "19:00"},  # Thursday
                            {"day": 4, "start": "16:00", "end": "19:00"},  # Friday
                        ]
                    }
                ]
            },
            {
                "name": "Jack Rose Dining Saloon",
                "address": "2007 18th St NW, Washington, DC 20009",
                "latitude": 38.9178,
                "longitude": -77.0415,
                "neighborhood": "Adams Morgan",
                "venue_type": "bar",
                "phone": "(202) 588-7388",
                "description": "Upscale whiskey bar with extensive collection",
                "deals": [
                    {
                        "title": "$6 Select Cocktails",
                        "description": "Classic cocktails during happy hour",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 6.00,
                        "items": ["Old Fashioned", "Manhattan", "Daiquiri"],
                        "schedules": [
                            {"day": i, "start": "17:00", "end": "19:00"} for i in range(5)
                        ]
                    }
                ]
            },
            {
                "name": "Busboys and Poets - 14th & V",
                "address": "2021 14th St NW, Washington, DC 20009",
                "latitude": 38.9177,
                "longitude": -77.0319,
                "neighborhood": "U Street",
                "venue_type": "restaurant",
                "phone": "(202) 387-7638",
                "description": "Restaurant, bookstore, and cultural hub",
                "deals": [
                    {
                        "title": "Half-Price Appetizers",
                        "description": "50% off select appetizers",
                        "category": "food",
                        "deal_type": "discount",
                        "discount_percentage": 50.0,
                        "items": ["Wings", "Hummus", "Spring rolls"],
                        "schedules": [
                            {"day": i, "start": "16:00", "end": "18:30"} for i in range(5)
                        ]
                    }
                ]
            },
            {
                "name": "Nellie's Sports Bar",
                "address": "900 U St NW, Washington, DC 20001",
                "latitude": 38.9169,
                "longitude": -77.0249,
                "neighborhood": "U Street",
                "venue_type": "bar",
                "phone": "(202) 332-6355",
                "description": "LGBTQ+ sports bar with rooftop",
                "deals": [
                    {
                        "title": "$4 Bud Light Drafts",
                        "description": "Domestic beer specials",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 4.00,
                        "items": ["Bud Light", "Miller Lite"],
                        "schedules": [
                            {"day": i, "start": "16:00", "end": "20:00"} for i in range(7)
                        ]
                    }
                ]
            },
            {
                "name": "Columbia Room",
                "address": "124 Blagden Alley NW, Washington, DC 20001",
                "latitude": 38.9076,
                "longitude": -77.0219,
                "neighborhood": "Shaw",
                "venue_type": "bar",
                "phone": "(202) 316-9396",
                "description": "Acclaimed cocktail bar with tasting room",
                "deals": [
                    {
                        "title": "$8 Classic Cocktails",
                        "description": "Punch room classics",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 8.00,
                        "items": ["Negroni", "Martini", "Gimlet"],
                        "schedules": [
                            {"day": i, "start": "17:00", "end": "19:00"} for i in range(5)
                        ]
                    }
                ]
            }
        ]
        
        for venue_data in venues_data:
            # Extract deals before creating venue
            deals_data = venue_data.pop("deals", [])
            
            # Create venue
            location = WKTElement(
                f'POINT({venue_data["longitude"]} {venue_data["latitude"]})',
                srid=4326
            )
            
            venue = Venue(**venue_data, location=location, verified=True)
            db.add(venue)
            db.flush()  # Get venue ID without committing
            
            print(f"✅ Created venue: {venue.name}")
            
            # Create deals and schedules
            for deal_data in deals_data:
                schedules_data = deal_data.pop("schedules", [])
                
                deal = Deal(
                    **deal_data,
                    venue_id=venue.id,
                    verified=True
                )
                db.add(deal)
                db.flush()
                
                print(f"  💰 Created deal: {deal.title}")
                
                # Create schedules
                for schedule_data in schedules_data:
                    start_time = time.fromisoformat(schedule_data["start"])
                    end_time = time.fromisoformat(schedule_data["end"])
                    
                    schedule = HappyHourSchedule(
                        venue_id=venue.id,
                        day_of_week=schedule_data["day"],
                        start_time=start_time,
                        end_time=end_time,
                        deal_ids=[deal.id]
                    )
                    db.add(schedule)
                
                print(f"    📅 Created {len(schedules_data)} schedules")
        
        db.commit()
        print(f"\n🎉 Successfully seeded {len(venues_data)} venues!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_venues_and_deals()
```

**Run the seed script**:
```bash
cd backend
python -m scripts.seed_dc_venues
```

#### Step 2: Docker Configuration

**`docker-compose.yml`** (root directory):
```yaml
version: '3.8'

services:
  db:
    image: postgis/postgis:15-3.3
    container_name: golden-hour-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: goldenhour
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: golden-hour-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build: ./backend
    container_name: golden-hour-backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/goldenhour
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

**`backend/Dockerfile`**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations on startup
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Test Docker setup**:
```bash
# From root directory
docker-compose up --build

# Verify all services are running
docker-compose ps

# Run seed script in container
docker-compose exec backend python -m scripts.seed_dc_venues
```

#### Step 3: Deploy to Railway

1. **Sign up for Railway** (https://railway.app)
2. **Create new project**
3. **Add PostgreSQL plugin** (automatically provisions PostGIS)
4. **Add Redis plugin**

**Deploy backend**:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
cd backend
railway up

# Set environment variables in Railway dashboard:
# - SECRET_KEY (generate with: openssl rand -hex 32)
# - ENVIRONMENT=production
# - DEBUG=False
```

**Get deployment URL**:
```bash
railway domain
# Example: golden-hour-production.up.railway.app
```

**Test production API**:
```bash
curl https://your-app.up.railway.app/health
```

---

## Week 2: Mobile MVP

### Day 8-10: Mobile Foundation

**Objective**: Create React Native app that displays venues on a map.

#### Step 1: Initialize React Native Project

```bash
cd mobile

# Create Expo app
npx create-expo-app@latest . --template blank-typescript

# Install core dependencies
npx expo install react-native-maps expo-location axios
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Install additional UI libraries
npm install @rneui/themed @rneui/base
```

#### Step 2: Project Structure

Create this structure:
```
mobile/src/
├── api/
│   ├── client.ts
│   └── endpoints.ts
├── components/
│   ├── Map/
│   │   ├── VenueMarker.tsx
│   │   └── MapView.tsx
│   ├── Cards/
│   │   ├── VenueCard.tsx
│   │   └── DealCard.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── screens/
│   ├── MapScreen.tsx
│   ├── VenueDetailScreen.tsx
│   └── DealListScreen.tsx
├── navigation/
│   └── RootNavigator.tsx
├── types/
│   └── api.ts
├── hooks/
│   ├── useLocation.ts
│   └── useVenues.ts
└── config/
    └── constants.ts
```

#### Step 3: API Client Setup

**`mobile/src/config/constants.ts`**:
```typescript
export const API_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1'  // Local development
  : 'https://your-app.up.railway.app/api/v1';  // Production

export const DEFAULT_LOCATION = {
  latitude: 38.9072,  // DC coordinates
  longitude: -77.0369,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const SEARCH_RADIUS_METERS = 2000;
```

**`mobile/src/types/api.ts`**:
```typescript
export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  neighborhood: string | null;
  venue_type: string | null;
  phone: string | null;
  website: string | null;
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  category: string;
  deal_type: string;
  original_price: number | null;
  deal_price: number | null;
  discount_percentage: number | null;
  items: string[];
  active: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface HappyHourSchedule {
  id: string;
  venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string | null;
  active: boolean;
}
```

**`mobile/src/api/client.ts`**:
```typescript
import axios from 'axios';
import { API_URL } from '../config/constants';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

**`mobile/src/api/endpoints.ts`**:
```typescript
import apiClient from './client';
import { Venue, Deal } from '../types/api';

export const venuesAPI = {
  getAll: async (params?: { skip?: number; limit?: number; neighborhood?: string }) => {
    const response = await apiClient.get<Venue[]>('/venues', { params });
    return response.data;
  },

  getNearby: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 2000
  ) => {
    const response = await apiClient.get<Venue[]>('/venues/nearby', {
      params: { latitude, longitude, radius_meters: radiusMeters },
    });
    return response.data;
  },

  getById: async (venueId: string) => {
    const response = await apiClient.get<Venue>(`/venues/${venueId}`);
    return response.data;
  },

  getNeighborhoods: async () => {
    const response = await apiClient.get<string[]>('/venues/neighborhoods/list');
    return response.data;
  },
};

export const dealsAPI = {
  getActive: async (params?: { skip?: number; limit?: number; category?: string }) => {
    const response = await apiClient.get<Deal[]>('/deals/active', { params });
    return response.data;
  },

  getNearby: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 2000,
    activeNow: boolean = false
  ) => {
    const response = await apiClient.get<Deal[]>('/deals/nearby', {
      params: { latitude, longitude, radius_meters: radiusMeters, active_now: activeNow },
    });
    return response.data;
  },

  getById: async (dealId: string) => {
    const response = await apiClient.get<Deal>(`/deals/${dealId}`);
    return response.data;
  },
};
```

#### Step 4: Location Hook

**`mobile/src/hooks/useLocation.ts`**:
```typescript
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_LOCATION } from '../config/constants';

export const useLocation = () => {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({});
        
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Failed to get location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, loading, error };
};
```

#### Step 5: Map Screen

**`mobile/src/screens/MapScreen.tsx`**:
```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '../hooks/useLocation';
import { venuesAPI } from '../api/endpoints';
import { Venue } from '../types/api';

export const MapScreen = () => {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationLoading && !locationError) {
      loadNearbyVenues();
    }
  }, [locationLoading, locationError, location]);

  const loadNearbyVenues = async () => {
    try {
      setLoading(true);
      const nearbyVenues = await venuesAPI.getNearby(
        location.latitude,
        location.longitude,
        2000
      );
      setVenues(nearbyVenues);
    } catch (err) {
      console.error('Error loading venues:', err);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading happy hours...</Text>
      </View>
    );
  }

  if (locationError || error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{locationError || error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.latitude,
              longitude: venue.longitude,
            }}
            title={venue.name}
            description={venue.neighborhood || ''}
            pinColor="#FF6B35"
          />
        ))}
      </MapView>
      
      <View style={styles.venueCount}>
        <Text style={styles.venueCountText}>
          {venues.length} happy hours nearby
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  venueCount: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  venueCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
```

#### Step 6: Root Navigator

**`mobile/src/navigation/RootNavigator.tsx`**:
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapScreen } from '../screens/MapScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FF6B35',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ title: 'Golden Hour' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

#### Step 7: App Entry Point

**`mobile/App.tsx`**:
```typescript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="light" />
    </>
  );
}
```

#### Step 8: Configure app.json

**`mobile/app.json`**:
```json
{
  "expo": {
    "name": "Golden Hour",
    "slug": "golden-hour",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B35"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.goldenhour.app",
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FF6B35"
      },
      "package": "com.goldenhour.app",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Golden Hour to use your location to find nearby happy hours."
        }
      ]
    ]
  }
}
```

#### Step 9: Run the Mobile App

```bash
cd mobile

# Start Expo
npx expo start

# Options:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on physical device
```

---

### Day 11-14: First User Testing

**Objective**: Use the app in real scenarios and identify critical improvements.

#### Testing Checklist

**Pre-Test Setup**:
- [ ] Backend deployed and accessible
- [ ] Database seeded with 5+ real DC venues
- [ ] Mobile app running on 2+ test devices
- [ ] 3-5 testers recruited (friends/colleagues)

**Test Scenarios**:

1. **Cold Start Test**
   - Open app for first time
   - Grant location permissions
   - Verify map loads with correct location
   - Verify venues appear as markers

2. **Discovery Test**
   - Pan around map
   - Tap on venue markers
   - Read venue information
   - Note: What info is missing?

3. **Real-World Usage**
   - Go to actual happy hour location
   - Open app while there
   - Verify venue appears
   - Check deal accuracy
   - Note: What would make this more useful?

4. **Performance Test**
   - Monitor load times
   - Test with poor network connection
   - Switch between map and list views
   - Note: Any lag or crashes?

**Feedback Collection Template**:
```markdown
## User Test - [Date] - [Tester Name]

### What worked well?
- 

### What was confusing?
- 

### What's missing?
- 

### Would you use this app? Why or why not?
- 

### Top 3 features you wish it had:
1. 
2. 
3. 
```

**Post-Test Analysis**:
- Compile all feedback
- Identify top 3 most requested features
- Prioritize bug fixes
- Plan Week 3 roadmap based on learnings

---

## Team Workflow

### Git Branch Strategy

```
main                    # Production-ready code only
  ├── develop          # Integration branch
  ├── feature/map-view
  ├── feature/deal-cards
  └── hotfix/location-bug
```

**Branch Naming Convention**:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Emergency production fixes
- `chore/` - Maintenance tasks

### Commit Message Format

```
type(scope): brief description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```bash
git commit -m "feat(api): add nearby venues endpoint"
git commit -m "fix(mobile): resolve map marker clustering issue"
git commit -m "docs(readme): update setup instructions"
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub: feature/your-feature-name → develop
   ```

4. **PR Review Checklist**
   - [ ] Code follows project style guide
   - [ ] Tests pass (when we add them)
   - [ ] No console.log statements in production code
   - [ ] API changes documented
   - [ ] Mobile changes tested on device

5. **Merge**
   - Squash commits if needed
   - Delete branch after merge

### Daily Standup (Async in Slack/Discord)

Post daily update with:
```
🎯 Yesterday: What I completed
🚀 Today: What I'm working on
🚧 Blockers: What's blocking me (if anything)
```

### Weekly Review (End of Week)

Document:
- Features completed
- Bugs fixed
- Lessons learned
- Next week's priorities

---

## Success Criteria

### Week 1 Success = "API is Live"

✅ **Must Have**:
- PostgreSQL database with PostGIS running
- 3 core tables: venues, deals, happy_hour_schedules
- 5+ real DC venues seeded
- API deployed and accessible via HTTPS
- `/venues` and `/deals` endpoints working
- Swagger docs available at `/docs`

✅ **Nice to Have**:
- Redis caching configured
- Database backups automated
- CI/CD pipeline running

### Week 2 Success = "Personal Use Ready"

✅ **Must Have**:
- Mobile app shows map with user location
- Venues appear as map markers
- Can tap marker to see venue name
- At least 2 team members using app on their phones
- Successfully used app to find a happy hour

✅ **Nice to Have**:
- List view in addition to map
- Filter by neighborhood
- Deal detail view
- Search functionality

### Overall Project Success = "10 Active Users"

Within 4 weeks of launch:
- 10 people regularly using the app
- 20+ DC venues in database
- Users submitting new venues
- Positive feedback on data accuracy
- Clear feature roadmap based on user needs

---

## Common Pitfalls to Avoid

### ❌ Over-Engineering
- **Don't**: Spend weeks on perfect database schema
- **Do**: Start simple, iterate based on usage

### ❌ Premature Optimization
- **Don't**: Worry about scaling to millions of users
- **Do**: Focus on making it work for 10 users first

### ❌ Feature Creep
- **Don't**: Add every possible feature upfront
- **Do**: Ship MVP, learn what users actually want

### ❌ Ignoring Real Data
- **Don't**: Use fake data for testing
- **Do**: Seed with real venues you've visited

### ❌ Building in Isolation
- **Don't**: Code for 3 weeks before testing
- **Do**: Deploy early, test often, gather feedback

---

## Resources

### Documentation
- **FastAPI**: https://fastapi.tiangolo.com
- **React Native**: https://reactnative.dev
- **Expo**: https://docs.expo.dev
- **PostGIS**: https://postgis.net/documentation

### Tools
- **API Testing**: Postman or Thunder Client (VS Code extension)
- **Database Client**: DBeaver or pgAdmin
- **Mobile Testing**: Expo Go app

### Getting Help
- **Backend Issues**: Check FastAPI GitHub discussions
- **Mobile Issues**: React Native Discord, Expo forums
- **Database Issues**: PostGIS mailing list

---

## Next Steps After Week 2

Once you've completed the first 2 weeks:

1. **Analyze User Feedback**
   - What features are most requested?
   - What pain points do users have?
   - What's working well?

2. **Prioritize Next Features**
   Based on feedback, likely priorities:
   - Deal detail view
   - User submissions
   - Notifications
   - Social features
   - Admin panel

3. **Plan Week 3-4**
   - Create detailed tickets
   - Assign ownership
   - Set deadlines
   - Define success criteria

4. **Consider Growth**
   - How to get more venues?
   - Partnership opportunities?
   - Marketing strategy?
   - Revenue model?

---

## Questions or Issues?

If you encounter problems:

1. **Check the logs** - Most issues reveal themselves in logs
2. **Google the error** - Someone has likely solved it
3. **Ask the team** - Don't struggle alone
4. **Document the solution** - Help future you and teammates

---

**Remember**: The goal isn't perfection, it's progress. Ship early, learn fast, iterate constantly.

Good luck team! 🍻

---

*Last Updated: [Date]*
*Version: 1.0*