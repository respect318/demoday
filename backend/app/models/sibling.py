from pydantic import BaseModel
from typing import Optional


class SiblingInfo(BaseModel):
    id: str
    hostname: str
    ip_address: str
    port: int
    status: str = "pending"
    connected_at: str = ""
    session_count: int = 0


class SiblingConnect(BaseModel):
    host: str
    port: int
