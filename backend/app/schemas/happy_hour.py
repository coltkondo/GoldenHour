from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import time as time_type, datetime
from uuid import UUID


class HappyHourScheduleResponse(BaseModel):
    id: UUID
    venue_id: UUID
    day_of_week: int
    start_time: str
    end_time: str
    deal_ids: Optional[List[UUID]] = None
    notes: Optional[str] = None
    restrictions: Optional[str] = None
    active: bool
    created_at: datetime
    updated_at: datetime

    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def format_time(cls, v):
        if isinstance(v, time_type):
            return v.strftime('%H:%M')
        return str(v) if v is not None else '00:00'

    class Config:
        from_attributes = True
