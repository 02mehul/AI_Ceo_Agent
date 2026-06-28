from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.user import User
from ...models.company import Company
from ...models.agent import Agent, AgentStatus
from ...schemas.agent import AgentCreate, AgentUpdate, AgentOut

router = APIRouter(prefix="/agents", tags=["agents"])


async def _get_company(company_id: str, user_id: str, db: AsyncSession) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == user_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/{company_id}", response_model=AgentOut, status_code=201)
async def create_agent(
    company_id: str,
    data: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    agent = Agent(**data.model_dump(), company_id=company_id)
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/{company_id}", response_model=list[AgentOut])
async def list_agents(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(select(Agent).where(Agent.company_id == company_id))
    return result.scalars().all()


@router.get("/{company_id}/{agent_id}", response_model=AgentOut)
async def get_agent(
    company_id: str,
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.company_id == company_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{company_id}/{agent_id}", response_model=AgentOut)
async def update_agent(
    company_id: str,
    agent_id: str,
    data: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.company_id == company_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return agent


@router.post("/{company_id}/{agent_id}/pause", response_model=AgentOut)
async def pause_agent(
    company_id: str,
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.company_id == company_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = AgentStatus.PAUSED
    await db.commit()
    await db.refresh(agent)
    return agent


@router.post("/{company_id}/{agent_id}/resume", response_model=AgentOut)
async def resume_agent(
    company_id: str,
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.company_id == company_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.status == AgentStatus.TERMINATED:
        raise HTTPException(status_code=400, detail="Cannot resume a terminated agent")

    agent.status = AgentStatus.ACTIVE
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{company_id}/{agent_id}", status_code=204)
async def terminate_agent(
    company_id: str,
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.company_id == company_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = AgentStatus.TERMINATED
    await db.commit()
