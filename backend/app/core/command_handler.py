from typing import Optional
from app.core.villain_bridge import villain_bridge
from app.core.session_defender import check_command
from app.core.session_manager import session_manager
from app.utils.logger import get_logger

logger = get_logger("command_handler")


async def execute_command(session_id: str, command: str, force: bool = False) -> dict:
    """
    Execute a command on a specific session via Villain.
    Returns dict with keys: success, warning, flagged
    """
    session = session_manager.get(session_id)
    if not session:
        return {"success": False, "error": "Session not found", "flagged": False, "warning": None}

    if not session.alive:
        return {"success": False, "error": "Session is not alive", "flagged": False, "warning": None}

    warning = check_command(command)
    if warning and not force:
        return {"success": False, "flagged": True, "warning": warning, "error": None}

    villain_cmd = f"shell {session_id} {command}"
    sent = await villain_bridge.send_command(villain_cmd)

    if sent:
        logger.info(f"Command sent to session {session_id}: {command}")
        return {"success": True, "flagged": bool(warning), "warning": warning, "error": None}
    else:
        return {"success": False, "error": "Failed to send command to Villain", "flagged": False, "warning": None}


async def kill_session(session_id: str) -> bool:
    session = session_manager.get(session_id)
    if not session:
        return False
    sent = await villain_bridge.send_command(f"kill {session_id}")
    if sent:
        session_manager.remove_session(session_id)
    return sent


async def set_session_alias(session_id: str, alias: str) -> bool:
    session = session_manager.get(session_id)
    if not session:
        return False
    session_manager.set_alias(session_id, alias)
    await villain_bridge.send_command(f"alias {session_id} {alias}")
    return True


async def trigger_conpty(session_id: str) -> bool:
    session = session_manager.get(session_id)
    if not session or session.os_type != "windows":
        return False
    return await villain_bridge.send_command(f"conptyshell {session_id}")
