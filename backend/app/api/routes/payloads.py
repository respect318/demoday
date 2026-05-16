from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User, PayloadHistory
from app.models.payload import PayloadGenerate, PayloadResponse, PayloadHistoryEntry
from app.core.payload_engine import get_templates, generate_payload, scan_villain_templates
from app.utils.crypto import get_current_user

router = APIRouter(prefix="/api/payloads", tags=["payloads"])


@router.get("/templates")
async def list_templates(
    os_type: str = None,
    shell_type: str = None,
    current_user: User = Depends(get_current_user),
):
    templates = get_templates(os_type, shell_type)
    extra = scan_villain_templates()
    return templates + extra


@router.post("/generate", response_model=PayloadResponse)
async def generate(
    body: PayloadGenerate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    payload = generate_payload(
        os_type=body.os_type,
        shell_type=body.shell_type,
        lhost=body.lhost,
        lport=body.lport,
        template=body.template,
        encode=body.encode,
    )

    record = PayloadHistory(
        template=body.template,
        os_type=body.os_type,
        shell_type=body.shell_type,
        lhost=body.lhost,
        lport=body.lport,
        payload=payload,
        created_at=datetime.utcnow(),
        created_by=current_user.id,
    )
    db.add(record)

    return PayloadResponse(
        payload=payload,
        template=body.template,
        os_type=body.os_type,
        shell_type=body.shell_type,
        lhost=body.lhost,
        lport=body.lport,
    )


@router.get("/history")
async def payload_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PayloadHistory).order_by(PayloadHistory.created_at.desc()).limit(50)
    )
    records = result.scalars().all()
    return [PayloadHistoryEntry.model_validate(r) for r in records]
