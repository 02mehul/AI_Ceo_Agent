from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.user import User
from ...models.company import Company
from ...models.agent import Agent
from ...models.task import Task
from ...schemas.task import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])


async def _verify_company(company_id: str, user_id: str, db: AsyncSession) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == user_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/{company_id}", response_model=TaskOut, status_code=201)
async def create_task(
    company_id: str,
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)

    if data.agent_id:
        result = await db.execute(
            select(Agent).where(Agent.id == data.agent_id, Agent.company_id == company_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Agent does not belong to this company")

    task = Task(**data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{company_id}", response_model=list[TaskOut])
async def list_tasks(
    company_id: str,
    agent_id: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)

    agents_result = await db.execute(select(Agent.id).where(Agent.company_id == company_id))
    agent_ids = [row[0] for row in agents_result.all()]

    query = select(Task).where(Task.agent_id.in_(agent_ids))
    if agent_id:
        query = query.where(Task.agent_id == agent_id)
    if status:
        query = query.where(Task.status == status)

    result = await db.execute(query.order_by(Task.created_at.desc()))
    return result.scalars().all()


@router.get("/{company_id}/{task_id}", response_model=TaskOut)
async def get_task(
    company_id: str,
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{company_id}/{task_id}", response_model=TaskOut)
async def update_task(
    company_id: str,
    task_id: str,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{company_id}/{task_id}", status_code=204)
async def delete_task(
    company_id: str,
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
