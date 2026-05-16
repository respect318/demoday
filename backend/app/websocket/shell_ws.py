import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import ws_manager
from app.core.villain_bridge import villain_bridge
from app.core.session_defender import check_command
from app.core.session_manager import session_manager
from app.utils.logger import get_logger

logger = get_logger("shell_ws")

router = APIRouter()


@router.websocket("/ws/shell/{session_id}")
async def shell_websocket(websocket: WebSocket, session_id: str):
    """Bidirectional shell I/O for a specific session."""
    await ws_manager.connect_shell(session_id, websocket)

    session = session_manager.get(session_id)
    if session:
        await websocket.send_text(json.dumps({
            "type": "session_info",
            "data": session.model_dump(mode="json"),
        }))
    else:
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": f"Session {session_id} not found in active sessions",
        }))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                msg = {"type": "input", "data": raw}

            if msg.get("type") == "input":
                command = msg.get("data", "").rstrip("\n")
                if not command:
                    continue

                warning = check_command(command)
                if warning:
                    await ws_manager.send_shell_warning(session_id, warning)
                    if not msg.get("force", False):
                        continue

                villain_cmd = f"shell {session_id} {command}"
                await villain_bridge.send_command(villain_cmd)

                await ws_manager.send_shell_output(
                    session_id,
                    f"\r\n$ {command}\r\n",
                    datetime.utcnow().isoformat(),
                )

    except WebSocketDisconnect:
        ws_manager.disconnect_shell(session_id, websocket)
        logger.info(f"Shell WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Shell WebSocket error: {e}")
        ws_manager.disconnect_shell(session_id, websocket)
