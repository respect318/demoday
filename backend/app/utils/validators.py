import re


def validate_ip(ip: str) -> bool:
    pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    if not re.match(pattern, ip):
        return False
    parts = ip.split(".")
    return all(0 <= int(p) <= 255 for p in parts)


def validate_port(port: int) -> bool:
    return 1 <= port <= 65535


def sanitize_command(command: str) -> str:
    return command.strip()


def validate_session_id(session_id: str) -> bool:
    pattern = r"^[a-zA-Z0-9\-_]{4,100}$"
    return bool(re.match(pattern, session_id))
