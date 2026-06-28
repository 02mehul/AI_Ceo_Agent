from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.user import User
from ...models.company import Company
from ...models.project import Project, Goal
from ...schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectOut,
    GoalCreate, GoalUpdate, GoalOut,
)

router = APIRouter(prefix="/projects", tags=["projects"])


async def _get_company(company_id: str, user_id: str, db: AsyncSession) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == user_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/{company_id}", response_model=ProjectOut, status_code=201)
async def create_project(
    company_id: str,
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    project = Project(**data.model_dump(), company_id=company_id)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{company_id}", response_model=list[ProjectOut])
async def list_projects(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(select(Project).where(Project.company_id == company_id))
    return result.scalars().all()


@router.patch("/{company_id}/{project_id}", response_model=ProjectOut)
async def update_project(
    company_id: str,
    project_id: str,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.company_id == company_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    return project


@router.post("/{company_id}/{project_id}/goals", response_model=GoalOut, status_code=201)
async def create_goal(
    company_id: str,
    project_id: str,
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    goal_data = data.model_dump()
    goal_data["project_id"] = project_id
    goal = Goal(**goal_data)
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.get("/{company_id}/{project_id}/goals", response_model=list[GoalOut])
async def list_goals(
    company_id: str,
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(select(Goal).where(Goal.project_id == project_id))
    return result.scalars().all()


@router.patch("/{company_id}/{project_id}/goals/{goal_id}", response_model=GoalOut)
async def update_goal(
    company_id: str,
    project_id: str,
    goal_id: str,
    data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_company(company_id, current_user.id, db)
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.project_id == project_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    return goal
