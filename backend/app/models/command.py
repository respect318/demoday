from pydantic import BaseModel
from typing import Optional


class CommandExec(BaseModel):
    command: str
    session_id: str


class CommandResult(BaseModel):
    command: str
    output: Optional[str] = None
    flagged: bool = False
    warning: Optional[str] = None
