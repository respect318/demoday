import re
from datetime import datetime
from typing import Dict, List, Optional

from app.utils.logger import get_logger
from app.models.session import SessionInfo

logger = get_logger("session_manager")

SESSION_PATTERNS = [
    re.compile(
        r"(?:New session|Session established|shell from)\s+"
        r"(?P<session_id>[a-f0-9\-]{8,36}).*?"
        r"(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})",
        re.IGNORECASE,
    ),
    re.compile(
        r"\[Session\]\s*(?P<session_id>[a-f0-9\-]{8,36})\s+(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).*?session[:\s]+(?P<session_id>[a-f0-9\-]{8,36})",
        re.IGNORECASE,
    ),
]

SESSION_DIED_PATTERNS = [
    re.compile(r"(?:Session|Shell)\s+(?P<session_id>[a-f0-9\-]{8,36})\s+(?:died|lost|disconnected|closed)", re.IGNORECASE),
    re.compile(r"Lost\s+session\s+(?P<session_id>[a-f0-9\-]{8,36})", re.IGNORECASE),
]

OS_PATTERNS = {
    "windows": re.compile(r"windows|powershell|cmd\.exe|hoaxshell", re.IGNORECASE),
    "linux": re.compile(r"linux|unix|bash|/bin/sh|netcat", re.IGNORECASE),
}

SHELL_TYPE_PATTERNS = {
    "hoaxshell": re.compile(r"hoaxshell|hoax", re.IGNORECASE),
    "tcp": re.compile(r"tcp|reverse.?tcp", re.IGNORECASE),
    "netcat": re.compile(r"netcat|nc\b", re.IGNORECASE),
}


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionInfo] = {}

    @property
    def sessions(self) -> Dict[str, SessionInfo]:
        return self._sessions

    def get_all(self) -> List[SessionInfo]:
        return list(self._sessions.values())

    def get(self, session_id: str) -> Optional[SessionInfo]:
        return self._sessions.get(session_id)

    def add_session(self, session_id: str, ip_address: str, os_type: str = "linux",
                    shell_type: str = "tcp", sibling_id: Optional[str] = None) -> SessionInfo:
        session = SessionInfo(
            session_id=session_id,
            ip_address=ip_address,
            os_type=os_type,
            shell_type=shell_type,
            sibling_id=sibling_id,
            connected_at=datetime.utcnow(),
            alive=True,
        )
        self._sessions[session_id] = session
        logger.info(f"Session added: {session_id} from {ip_address} ({os_type}/{shell_type})")
        return session

    def remove_session(self, session_id: str) -> Optional[SessionInfo]:
        session = self._sessions.pop(session_id, None)
        if session:
            session.alive = False
            logger.info(f"Session removed: {session_id}")
        return session

    def set_alias(self, session_id: str, alias: str) -> bool:
        if session_id in self._sessions:
            self._sessions[session_id].alias = alias
            return True
        return False

    def parse_line(self, line: str) -> Optional[dict]:
        """Parse a Villain stdout line for session events. Returns event dict or None."""
        for pattern in SESSION_PATTERNS:
            match = pattern.search(line)
            if match:
                sid = match.group("session_id")
                ip = match.group("ip")
                os_type = "windows" if OS_PATTERNS["windows"].search(line) else "linux"
                shell_type = "tcp"
                for stype, sp in SHELL_TYPE_PATTERNS.items():
                    if sp.search(line):
                        shell_type = stype
                        break
                session = self.add_session(sid, ip, os_type, shell_type)
                return {"type": "new_session", "data": session.model_dump(mode="json")}

        for pattern in SESSION_DIED_PATTERNS:
            match = pattern.search(line)
            if match:
                sid = match.group("session_id")
                removed = self.remove_session(sid)
                if removed:
                    return {"type": "session_died", "data": {"session_id": sid}}
        return None


session_manager = SessionManager()
