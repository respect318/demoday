import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.db.database import get_db
from app.db.models import User, UploadedFile
from app.core.villain_bridge import villain_bridge
from app.utils.crypto import get_current_user
from app.utils.logger import get_logger

logger = get_logger("files")

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    record = UploadedFile(
        filename=file.filename,
        size=len(content),
        uploaded_at=datetime.utcnow(),
        uploaded_by=current_user.id,
    )
    db.add(record)

    logger.info(f"File uploaded: {file.filename} ({len(content)} bytes)")
    return {"filename": file.filename, "size": len(content), "message": "File uploaded successfully"}


@router.get("")
async def list_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UploadedFile).order_by(UploadedFile.uploaded_at.desc())
    )
    files = result.scalars().all()
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "size": f.size,
            "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
        }
        for f in files
    ]


@router.delete("/{filename}")
async def delete_file(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)

    result = await db.execute(select(UploadedFile).where(UploadedFile.filename == filename))
    record = result.scalar_one_or_none()
    if record:
        await db.delete(record)

    return {"message": f"File '{filename}' deleted"}


@router.post("/fileless-exec")
async def fileless_exec(
    session_id: str,
    script_path: str,
    current_user: User = Depends(get_current_user),
):
    if not villain_bridge.running:
        raise HTTPException(status_code=400, detail="Villain daemon is not running")

    full_path = os.path.join(settings.UPLOAD_DIR, script_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Script file not found")

    cmd = f"exec {session_id} {full_path}"
    sent = await villain_bridge.send_command(cmd)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send fileless exec command")

    return {"message": f"Fileless execution triggered for session {session_id}"}
