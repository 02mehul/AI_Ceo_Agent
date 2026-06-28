from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: str
    action: str
    details: Optional[str]
    tokens_used: int
    cost_usd: Decimal
    agent_id: str
    metadata_json: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApprovalRequestOut(BaseModel):
    id: str
    title: str
    description: str
    status: str
    decision_note: Optional[str]
    agent_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ApprovalDecision(BaseModel):
    approved: bool
    note: Optional[str] = None
