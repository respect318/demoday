from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.config import settings
from app.db.models import User
from app.core.villain_bridge import villain_bridge
from app.utils.crypto import get_current_user
from app.utils.logger import get_logger

logger = get_logger("settings")

router = APIRouter(prefix="/api", tags=["settings"])


class DaemonSettings(BaseModel):
    tcp_port: int = 6501
    hoaxshell_port: int = 8080
    netcat_port: int = 4443
    file_smuggler_port: int = 8888
    ssl_certfile: Optional[str] = ""
    ssl_keyfile: Optional[str] = ""


@router.get("/settings")
async def get_settings(current_user: User = Depends(get_current_user)):
    return DaemonSettings(
        tcp_port=settings.TCP_PORT,
        hoaxshell_port=settings.HOAXSHELL_PORT,
        netcat_port=settings.NETCAT_PORT,
        file_smuggler_port=settings.FILE_SMUGGLER_PORT,
        ssl_certfile=settings.SSL_CERTFILE,
        ssl_keyfile=settings.SSL_KEYFILE,
    )


@router.put("/settings")
async def update_settings(
    body: DaemonSettings,
    current_user: User = Depends(get_current_user),
):
    settings.TCP_PORT = body.tcp_port
    settings.HOAXSHELL_PORT = body.hoaxshell_port
    settings.NETCAT_PORT = body.netcat_port
    settings.FILE_SMUGGLER_PORT = body.file_smuggler_port
    settings.SSL_CERTFILE = body.ssl_certfile or ""
    settings.SSL_KEYFILE = body.ssl_keyfile or ""

    try:
        env_lines = [
            f"SECRET_KEY={settings.SECRET_KEY}",
            f"DATABASE_URL={settings.DATABASE_URL}",
            f"VILLAIN_PATH={settings.VILLAIN_PATH}",
            f"UPLOAD_DIR={settings.UPLOAD_DIR}",
            f"TCP_PORT={body.tcp_port}",
            f"HOAXSHELL_PORT={body.hoaxshell_port}",
            f"NETCAT_PORT={body.netcat_port}",
            f"FILE_SMUGGLER_PORT={body.file_smuggler_port}",
            f"SSL_CERTFILE={body.ssl_certfile or ''}",
            f"SSL_KEYFILE={body.ssl_keyfile or ''}",
            f"DEFAULT_ADMIN_USER={settings.DEFAULT_ADMIN_USER}",
            f"DEFAULT_ADMIN_PASS={settings.DEFAULT_ADMIN_PASS}",
        ]
        with open(".env", "w") as f:
            f.write("\n".join(env_lines) + "\n")
    except Exception as e:
        logger.warning(f"Could not write .env file: {e}")

    return {"message": "Settings updated. Restart daemon for changes to take effect."}


@router.post("/daemon/start")
async def start_daemon(current_user: User = Depends(get_current_user)):
    success = await villain_bridge.start()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start Villain daemon")
    return {"message": "Villain daemon started", "pid": villain_bridge.pid}


@router.post("/daemon/stop")
async def stop_daemon(current_user: User = Depends(get_current_user)):
    success = await villain_bridge.stop()
    if not success:
        raise HTTPException(status_code=400, detail="Villain daemon is not running")
    return {"message": "Villain daemon stopped"}


@router.get("/daemon/status")
async def daemon_status(current_user: User = Depends(get_current_user)):
    return {
        "running": villain_bridge.running,
        "pid": villain_bridge.pid,
        "status": "running" if villain_bridge.running else "stopped",
    }


@router.get("/daemon/logs")
async def daemon_logs(current_user: User = Depends(get_current_user)):
    logs = villain_bridge.log_buffer
    return {"logs": logs[-200:], "total": len(logs)}
