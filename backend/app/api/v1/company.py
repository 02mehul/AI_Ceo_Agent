from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.user import User
from ...models.company import Company
from ...schemas.company import CompanyCreate, CompanyUpdate, CompanyOut

router = APIRouter(prefix="/company", tags=["company"])


@router.post("", response_model=CompanyOut, status_code=201)
async def create_company(
    data: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = Company(**data.model_dump(), owner_id=current_user.id)
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("", response_model=list[CompanyOut])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Company).where(Company.owner_id == current_user.id))
    return result.scalars().all()


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: str,
    data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    return company
