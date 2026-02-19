from pydantic import BaseModel, Field
from typing import Optional, Any, Literal
from datetime import datetime
from uuid import UUID


class SubmissionCreate(BaseModel):
    submission_type: Literal[
        "new_deal", "deal_update", "deal_expired",
        "new_bar", "bar_closed", "bar_update",
    ]
    submitted_data: dict[str, Any] = Field(default_factory=dict)
    related_bar_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None


class SubmissionResponse(BaseModel):
    id: UUID
    user_id: UUID
    submitter_username: str = ""
    submission_type: str
    submitted_data: dict[str, Any]
    related_bar_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    status: str
    admin_notes: Optional[str] = None
    points_awarded: int
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_username(cls, sub):
        data = cls.model_validate(sub)
        data.submitter_username = sub.submitter.username if sub.submitter else "unknown"
        return data


class ReviewAction(BaseModel):
    status: Literal["approved", "rejected"]
    admin_notes: Optional[str] = None
