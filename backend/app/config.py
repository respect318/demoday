import os
from pathlib import Path
from pydantic_settings import BaseSettings


_BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    SECRET_KEY: str = "villainui-demo-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/villainui.db"
    VILLAIN_PATH: str = ""
    UPLOAD_DIR: str = ""
    TCP_PORT: int = 6501
    HOAXSHELL_PORT: int = 8080
    NETCAT_PORT: int = 4443
    FILE_SMUGGLER_PORT: int = 8888
    SSL_CERTFILE: str = ""
    SSL_KEYFILE: str = ""
    DEFAULT_ADMIN_USER: str = "admin"
    DEFAULT_ADMIN_PASS: str = "villain2024"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# Auto-detect paths if not set or if Docker path used on local machine
if not settings.VILLAIN_PATH or not Path(settings.VILLAIN_PATH).exists():
    settings.VILLAIN_PATH = str(_BACKEND_ROOT / "villain")

if not settings.UPLOAD_DIR or not Path(settings.UPLOAD_DIR).exists():
    settings.UPLOAD_DIR = str(_BACKEND_ROOT / "uploads")

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
data_dir = Path(settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")).parent
data_dir.mkdir(parents=True, exist_ok=True)
