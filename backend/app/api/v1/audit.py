from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.user import User
from ...models.company import Company
from ...models.agent import Agent
from ...models.audit import AuditLog, ApprovalRequest
from ...schemas.audit import AuditLogOut, ApprovalRequestOut, ApprovalDecision

router = APIRouter(prefix="/audit", tags=["audit"])


async def _verify_company(company_id: str, user_id: str, db: AsyncSession) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == user_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/{company_id}/logs", response_model=list[AuditLogOut])
async def get_audit_logs(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)

    agents_result = await db.execute(select(Agent.id).where(Agent.company_id == company_id))
    agent_ids = [row[0] for row in agents_result.all()]

    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.agent_id.in_(agent_ids))
        .order_by(AuditLog.created_at.desc())
        .limit(200)
    )
    return result.scalars().all()


@router.get("/{company_id}/approvals", response_model=list[ApprovalRequestOut])
async def get_approvals(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)

    agents_result = await db.execute(select(Agent.id).where(Agent.company_id == company_id))
    agent_ids = [row[0] for row in agents_result.all()]

    result = await db.execute(
        select(ApprovalRequest)
        .where(ApprovalRequest.agent_id.in_(agent_ids))
        .order_by(ApprovalRequest.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{company_id}/approvals/{approval_id}/decide", response_model=ApprovalRequestOut)
async def decide_approval(
    company_id: str,
    approval_id: str,
    decision: ApprovalDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_company(company_id, current_user.id, db)

    result = await db.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval.status = "approved" if decision.approved else "rejected"
    approval.decision_note = decision.note
    approval.decided_at = datetime.now(timezone.utc).isoformat()
    await db.commit()
    await db.refresh(approval)
    return approval
