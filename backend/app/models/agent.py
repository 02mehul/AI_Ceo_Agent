import uuid
import enum
from typing import Optional
from decimal import Decimal
from sqlalchemy import String, Text, ForeignKey, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base
from .mixins import TimestampMixin


class AgentRole(str, enum.Enum):
    CEO = "ceo"
    MARKETING = "marketing"
    CONTENT = "content"
    SALES = "sales"
    OPS = "ops"
    CUSTOM = "custom"


class AgentStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    RUNNING = "running"
    TERMINATED = "terminated"


class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[AgentRole] = mapped_column(SAEnum(AgentRole), nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    budget_monthly: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal("0"))
    budget_used: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal("0"))
    status: Mapped[AgentStatus] = mapped_column(SAEnum(AgentStatus), default=AgentStatus.ACTIVE)
    custom_instructions: Mapped[Optional[str]] = mapped_column(Text)

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    company: Mapped["Company"] = relationship("Company", back_populates="agents")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="agent")
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="agent", cascade="all, delete-orphan"
    )
    approval_requests: Mapped[list["ApprovalRequest"]] = relationship(
        "ApprovalRequest", back_populates="agent", cascade="all, delete-orphan"
    )
