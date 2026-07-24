import math

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.models.market import Market
from app.models.user import User
from app.models.submission import Submission
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    dφ = math.radians(lat2 - lat1)
    dλ = math.radians(lng2 - lng1)
    a = math.sin(dφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(dλ / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account and return a JWT."""
    # func.lower() guards against any pre-existing mixed-case rows in the DB
    if db.query(User).filter(func.lower(User.email) == data.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    markets = db.query(Market).filter(Market.active == True).all()
    matched = None
    best_dist = float("inf")
    for m in markets:
        dist = _haversine_m(data.latitude, data.longitude, m.region_center_lat, m.region_center_lng)
        if dist <= m.region_radius_meters and dist < best_dist:
            matched = m
            best_dist = dist
    if matched is None:
        raise HTTPException(
            status_code=422,
            detail="Golden Hour isn't available in your area yet — stay tuned!",
        )

    user = User(
        market_id=matched.id,
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        signup_latitude=data.latitude,
        signup_longitude=data.longitude,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return a JWT."""
    # func.lower() allows login even if an older row was stored with mixed-case email
    user = db.query(User).filter(func.lower(User.email) == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    """Issue a fresh token for a still-valid session."""
    token = create_access_token({"sub": str(current_user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(current_user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the currently authenticated user."""
    approved_count = db.query(func.count(Submission.id)).filter(
        Submission.user_id == current_user.id,
        Submission.status == "approved",
    ).scalar() or 0
    data = UserResponse.model_validate(current_user).model_dump()
    data["approved_count"] = approved_count
    return data


@router.delete("/me", status_code=204)
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently anonymize the account.

    Personal data (email, username, password, location) is scrubbed.
    Submissions and point history are retained anonymised — they form part
    of the community-maintained map and cannot be individually removed
    without degrading data quality for other users.
    """
    uid = str(current_user.id)
    current_user.email = f"deleted_{uid}@deleted.invalid"
    current_user.username = f"[deleted_{uid[:8]}]"
    current_user.password_hash = "deleted"
    current_user.signup_latitude = 0.0
    current_user.signup_longitude = 0.0
    current_user.points_balance = 0
    current_user.active = False
    db.commit()
