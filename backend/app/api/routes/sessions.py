from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User, CommandLog, SessionRecord
from app.models.session import SessionInfo, SessionExec, SessionAlias, CommandLogEntry
from app.core.session_manager import session_manager
from app.core.command_handler import execute_command, kill_session, set_session_alias, trigger_conpty
from app.core.session_defender import check_command
from app.utils.crypto import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
async def list_sessions(current_user: User = Depends(get_current_user)):
    return session_manager.get_all()


@router.get("/{session_id}")
async def get_session(session_id: str, current_user: User = Depends(get_current_user)):
    session = session_manager.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await kill_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or could not be killed")

    result = await db.execute(select(SessionRecord).where(SessionRecord.id == session_id))
    record = result.scalar_one_or_none()
    if record:
        record.disconnected_at = datetime.utcnow()
        db.add(record)

    return {"message": f"Session {session_id} killed"}


@router.post("/{session_id}/exec")
async def exec_command(
    session_id: str,
    body: SessionExec,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    warning = check_command(body.command)

    result = await execute_command(session_id, body.command, force=False)

    log_entry = CommandLog(
        session_id=session_id,
        user_id=current_user.id,
        command=body.command,
        flagged=result.get("flagged", False),
        executed_at=datetime.utcnow(),
    )
    db.add(log_entry)

    if not result["success"] and result.get("flagged"):
        return {
            "success": False,
            "flagged": True,
            "warning": result["warning"],
            "message": "Command flagged by Session Defender. Send with force=true to execute anyway.",
        }

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to execute command"))

    return {"success": True, "flagged": result.get("flagged", False), "warning": result.get("warning")}


@router.post("/{session_id}/exec/force")
async def exec_command_force(
    session_id: str,
    body: SessionExec,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await execute_command(session_id, body.command, force=True)

    log_entry = CommandLog(
        session_id=session_id,
        user_id=current_user.id,
        command=body.command,
        flagged=True,
        executed_at=datetime.utcnow(),
    )
    db.add(log_entry)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed"))

    return {"success": True, "warning": result.get("warning")}


@router.get("/{session_id}/history")
async def get_command_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CommandLog)
        .where(CommandLog.session_id == session_id)
        .order_by(CommandLog.executed_at.desc())
        .limit(100)
    )
    logs = result.scalars().all()
    return [CommandLogEntry.model_validate(log) for log in logs]


@router.post("/{session_id}/alias")
async def update_alias(
    session_id: str,
    body: SessionAlias,
    current_user: User = Depends(get_current_user),
):
    success = await set_session_alias(session_id, body.alias)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": f"Alias set to '{body.alias}'"}


@router.post("/{session_id}/conpty")
async def conpty_shell(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    success = await trigger_conpty(session_id)
    if not success:
        raise HTTPException(status_code=400, detail="ConPtyShell only available for Windows sessions")
    return {"message": "ConPtyShell triggered"}


@router.post("/demo/seed")
async def seed_demo_sessions(current_user: User = Depends(get_current_user)):
    """Seed fake sessions for demo/presentation purposes."""
    import uuid
    demos = [
        {"ip": "192.168.1.105", "os": "windows", "shell": "hoaxshell", "alias": "DC-01"},
        {"ip": "10.0.0.42", "os": "linux", "shell": "tcp", "alias": "web-srv"},
        {"ip": "172.16.0.88", "os": "windows", "shell": "tcp", "alias": "HR-PC"},
    ]
    created = []
    for d in demos:
        sid = str(uuid.uuid4())[:8]
        s = session_manager.add_session(sid, d["ip"], d["os"], d["shell"])
        session_manager.set_alias(sid, d["alias"])
        created.append(s)
    return {"message": f"{len(created)} demo sessions created", "sessions": created}
