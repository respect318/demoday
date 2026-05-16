import json
from typing import Dict, List, Set
from fastapi import WebSocket
from app.utils.logger import get_logger

logger = get_logger("ws_manager")


class ConnectionManager:
    """Manages all WebSocket connections for both shell I/O and event broadcasting."""

    def __init__(self):
        self._event_clients: List[WebSocket] = []
        self._shell_clients: Dict[str, List[WebSocket]] = {}

    async def connect_event(self, websocket: WebSocket):
        await websocket.accept()
        self._event_clients.append(websocket)
        logger.info(f"Event client connected. Total: {len(self._event_clients)}")

    def disconnect_event(self, websocket: WebSocket):
        if websocket in self._event_clients:
            self._event_clients.remove(websocket)
        logger.info(f"Event client disconnected. Total: {len(self._event_clients)}")

    async def connect_shell(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self._shell_clients:
            self._shell_clients[session_id] = []
        self._shell_clients[session_id].append(websocket)
        logger.info(f"Shell client connected to session {session_id}")

    def disconnect_shell(self, session_id: str, websocket: WebSocket):
        if session_id in self._shell_clients:
            if websocket in self._shell_clients[session_id]:
                self._shell_clients[session_id].remove(websocket)
            if not self._shell_clients[session_id]:
                del self._shell_clients[session_id]
        logger.info(f"Shell client disconnected from session {session_id}")

    async def broadcast_event(self, event: dict):
        """Broadcast an event to all connected event clients."""
        message = json.dumps(event)
        disconnected = []
        for ws in self._event_clients:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect_event(ws)

    async def send_shell_output(self, session_id: str, data: str, timestamp: str = ""):
        """Send shell output to all clients watching a specific session."""
        if session_id not in self._shell_clients:
            return
        message = json.dumps({
            "type": "output",
            "data": data,
            "timestamp": timestamp,
        })
        disconnected = []
        for ws in self._shell_clients[session_id]:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect_shell(session_id, ws)

    async def send_shell_warning(self, session_id: str, warning: str):
        """Send session defender warning to shell clients."""
        if session_id not in self._shell_clients:
            return
        message = json.dumps({
            "type": "session_defender_warn",
            "data": warning,
        })
        for ws in self._shell_clients.get(session_id, []):
            try:
                await ws.send_text(message)
            except Exception:
                pass

    async def broadcast_daemon_log(self, log_line: str):
        """Broadcast daemon log line to all event clients."""
        await self.broadcast_event({
            "type": "daemon_log",
            "data": log_line,
        })

    @property
    def event_client_count(self) -> int:
        return len(self._event_clients)

    @property
    def shell_sessions(self) -> List[str]:
        return list(self._shell_clients.keys())


ws_manager = ConnectionManager()
