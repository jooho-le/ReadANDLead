from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel

EntryType = Literal['note', 'system']  # v0에서는 두 가지만 사용

class DiaryEntryCreate(BaseModel):
    entry_type: EntryType = 'note'
    text: Optional[str] = None
    stop_id: Optional[str] = None
    happened_at: Optional[datetime] = None
    content: Optional[dict] = None  # system 이벤트나 추가 메타

class DiaryEntryOut(BaseModel):
    id: str
    trip_id: str
    stop_id: Optional[str]
    author_id: str
    entry_type: EntryType
    text: Optional[str]
    content: dict
    happened_at: Optional[datetime]
    created_at: datetime
