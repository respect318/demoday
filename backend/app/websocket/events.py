import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import ws_manager
from app.utils.logger import get_logger

logger = get_logger("events_ws")

router = APIRouter()


@router.websocket("/ws/events")
async def events_websocket(websocket: WebSocket):
    """Server-only broadcast channel for real-time events."""
    await ws_manager.connect_event(websocket)

    try:
        while True:
            # Keep connection alive by waiting for pings or client messages
            data = await websocket.receive_text()
            # Client may send ping/pong or subscribe messages
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect_event(websocket)
        logger.info("Event WebSocket client disconnected")
    except Exception as e:
        logger.error(f"Event WebSocket error: {e}")
        ws_manager.disconnect_event(websocket)
