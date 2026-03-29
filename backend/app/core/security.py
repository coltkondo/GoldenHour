from datetime import datetime, timedelta
from typing import Optional
import bcrypt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.user import User


from app.core.config import settings
from app.core.database import get_db
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")



def hash_password(plain: str) -> str:
    """Hash a password using bcrypt directly."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode(), salt).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.bind(token_preview=token[:10] + "...").warning("invalid_token")
            raise credentials_exc
    except JWTError:
        logger.bind(token_preview=token[:10] + "...", error="JWT validation failed").warning("invalid_token")
        raise credentials_exc

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.bind(user_id=user_id).warning("user_not_found")
        raise credentials_exc

    logger.bind(user_id=str(user.id), role=user.role).info("user_authenticated")
    return user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
