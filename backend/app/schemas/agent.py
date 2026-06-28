from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel
from ..models.agent import AgentRole, AgentStatus


class AgentCreate(BaseModel):
    name: str
    role: AgentRole
    goal: str
    budget_monthly: Decimal = Decimal("0")
    custom_instructions: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    budget_monthly: Optional[Decimal] = None
    status: Optional[AgentStatus] = None
    custom_instructions: Optional[str] = None


class AgentOut(BaseModel):
    id: str
    name: str
    role: AgentRole
    goal: str
    budget_monthly: Decimal
    budget_used: Decimal
    status: AgentStatus
    custom_instructions: Optional[str]
    company_id: str
    created_at: datetime

    model_config = {"from_attributes": True}
