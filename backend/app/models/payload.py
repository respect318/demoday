from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PayloadGenerate(BaseModel):
    os_type: str
    shell_type: str
    lhost: str
    lport: int
    template: Optional[str] = None
    encode: bool = False


class PayloadResponse(BaseModel):
    payload: str
    template: Optional[str] = None
    os_type: str
    shell_type: str
    lhost: str
    lport: int


class PayloadHistoryEntry(BaseModel):
    id: int
    template: Optional[str] = None
    os_type: str
    shell_type: str
    lhost: str
    lport: int
    payload: str
    created_at: datetime

    class Config:
        from_attributes = True
