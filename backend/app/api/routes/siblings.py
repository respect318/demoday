from datetime import datetime
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
    sibling_id = f"{body.host}:{body.port}"

    if sibling_id in _siblings:
        raise HTTPException(status_code=400, detail=f"Already connected to {sibling_id}")

    # If Villain daemon is running, send the actual connect command
    if villain_bridge.running:
        cmd = f"connect {body.host} {body.port}"
        sent = await villain_bridge.send_command(cmd)
        if not sent:
            raise HTTPException(status_code=500, detail="Failed to send connect command")
        status = "active"
    else:
        status = "pending"
        logger.info(f"Daemon not running — sibling {sibling_id} saved as pending")

    sibling = SiblingInfo(
        id=sibling_id,
        hostname=body.host,
        ip_address=body.host,
        port=body.port,
        status=status,
        connected_at=datetime.utcnow().isoformat(),
        session_count=0,
    )
    _siblings[sibling_id] = sibling.model_dump()
    return {"message": f"Sibling {sibling_id} added ({status})", "sibling": sibling}


@router.delete("/{sibling_id}")
async def disconnect_sibling(
    sibling_id: str,
    current_user: User = Depends(get_current_user),
):
    if sibling_id not in _siblings:
        raise HTTPException(status_code=404, detail="Sibling not found")

    sibling = _siblings[sibling_id]
    if villain_bridge.running:
        cmd = f"disconnect {sibling['hostname']} {sibling['port']}"
        await villain_bridge.send_command(cmd)

    del _siblings[sibling_id]
    return {"message": f"Sibling {sibling_id} disconnected"}
