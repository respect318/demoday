from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionInfo(BaseModel):
    session_id: str
    alias: Optional[str] = None
    ip_address: str
    os_type: str
    shell_type: str
    sibling_id: Optional[str] = None
    connected_at: datetime
    alive: bool = True

    class Config:
        from_attributes = True


class SessionExec(BaseModel):
    command: str


class SessionAlias(BaseModel):
    alias: str


class CommandLogEntry(BaseModel):
    id: int
    session_id: str
    command: str
    output: Optional[str] = None
    flagged: bool = False
    executed_at: datetime

    class Config:
        from_attributes = True
