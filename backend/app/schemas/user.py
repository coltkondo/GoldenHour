from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Literal
from datetime import datetime
from uuid import UUID
import re

from app.core.username_rules import username_problem


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    # max_length=128: bcrypt silently truncates at 72 bytes; very long passwords
    # are a DoS vector because hashing them is intentionally slow.
    password: str = Field(..., min_length=8, max_length=128)
    # Either device coordinates (matched to a market by radius) or an explicit
    # market_slug from the city picker, for people who decline location or
    # live outside every market's radius (App Review 5.1.1: don't make
    # location mandatory to create an account).
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    market_slug: str | None = Field(None, min_length=1, max_length=100)

    @model_validator(mode="after")
    def location_or_market(self) -> "UserCreate":
        has_coords = self.latitude is not None and self.longitude is not None
        if not has_coords and not self.market_slug:
            raise ValueError("Choose a city or allow location to sign up")
        return self

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        problem = username_problem(v)
        if problem:
            raise ValueError(problem)
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*()\-_=+\[\]{}|;:',.<>?/\\`~]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower()


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    role: str
    points_balance: int
    market_slug: str | None = None
    approved_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower()


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower()

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*()\-_=+\[\]{}|;:',.<>?/\\`~]", v):
            raise ValueError("Password must contain at least one special character")
        return v
