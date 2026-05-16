from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.db.database import init_db, async_session
from app.db.models import User
from app.utils.crypto import hash_password
from app.utils.logger import get_logger

from app.api.routes import auth, sessions, payloads, siblings, files, settings as settings_routes
from app.websocket.shell_ws import router as shell_ws_router
from app.websocket.events import router as events_ws_router
from app.websocket.manager import ws_manager
from app.core.villain_bridge import villain_bridge

logger = get_logger("main")


async def setup_bridge_callbacks():
    """Wire villain_bridge output/event callbacks to WebSocket manager."""

    async def on_output(data: str):
        await ws_manager.broadcast_daemon_log(data)

    async def on_event(event: dict):
        await ws_manager.broadcast_event(event)

    villain_bridge.on_output(on_output)
    villain_bridge.on_event(on_event)


async def seed_admin():
    """Create default admin user if not exists."""
    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == settings.DEFAULT_ADMIN_USER))
        existing = result.scalar_one_or_none()
        if not existing:
            admin = User(
                username=settings.DEFAULT_ADMIN_USER,
                password=hash_password(settings.DEFAULT_ADMIN_PASS),
                role="admin",
                must_change_password=True,
            )
            db.add(admin)
            await db.commit()
            logger.info(f"Default admin user '{settings.DEFAULT_ADMIN_USER}' created")
        else:
            logger.info("Admin user already exists")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("VillainUI Backend starting up...")
    await init_db()
    await seed_admin()
    await setup_bridge_callbacks()
    logger.info("VillainUI Backend ready")
    yield
    logger.info("VillainUI Backend shutting down...")
    if villain_bridge.running:
        await villain_bridge.stop()


app = FastAPI(
    title="VillainUI API",
    description="Web GUI Backend for Villain C2 Framework",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(payloads.router)
app.include_router(siblings.router)
app.include_router(files.router)
app.include_router(settings_routes.router)

app.include_router(shell_ws_router)
app.include_router(events_ws_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
