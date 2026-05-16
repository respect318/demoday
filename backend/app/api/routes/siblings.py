from fastapi import APIRouter, Depends, HTTPException
from app.db.models import User
from app.models.sibling import SiblingInfo, SiblingConnect
from app.core.villain_bridge import villain_bridge
from app.utils.crypto import get_current_user
from app.utils.logger import get_logger

logger = get_logger("siblings")

router = APIRouter(prefix="/api/siblings", tags=["siblings"])

_siblings: dict = {}


@router.get("")
async def list_siblings(current_user: User = Depends(get_current_user)):
    return list(_siblings.values())


@router.post("/connect")
async def connect_sibling(
    body: SiblingConnect,
    current_user: User = Depends(get_current_user),
):
    if not villain_bridge.running:
        raise HTTPException(status_code=400, detail="Villain daemon is not running")

    cmd = f"connect {body.host} {body.port}"
    sent = await villain_bridge.send_command(cmd)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send connect command")

    sibling_id = f"{body.host}:{body.port}"
    sibling = SiblingInfo(
        id=sibling_id,
        hostname=body.host,
        ip_address=body.host,
        port=body.port,
        session_count=0,
    )
    _siblings[sibling_id] = sibling
    return {"message": f"Connect command sent to {body.host}:{body.port}", "sibling": sibling}


@router.delete("/{sibling_id}")
async def disconnect_sibling(
    sibling_id: str,
    current_user: User = Depends(get_current_user),
):
    if sibling_id not in _siblings:
        raise HTTPException(status_code=404, detail="Sibling not found")

    sibling = _siblings[sibling_id]
    cmd = f"disconnect {sibling.hostname} {sibling.port}"
    await villain_bridge.send_command(cmd)
    del _siblings[sibling_id]
    return {"message": f"Sibling {sibling_id} disconnected"}
