import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.user import User
from ...models.company import Company
from ...models.agent import Agent
from ...models.task import Task
from ...agents.executor import run_agent

router = APIRouter(prefix="/execute", tags=["execute"])


async def _verify_company(company_id: str, user_id: str, db: AsyncSession) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == user_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/{company_id}/{agent_id}/{task_id}")
async def execute_agent(
    company_id: str,
    agent_id: str,
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)

    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.company_id == company_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Agent not found")

    async def event_stream():
        async for event in run_agent(agent_id, task_id, db):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0)
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
