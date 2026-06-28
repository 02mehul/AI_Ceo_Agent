import uuid
from typing import Optional
from decimal import Decimal
from sqlalchemy import String, Text, ForeignKey, Integer, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base
from .mixins import TimestampMixin


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[Decimal] = mapped_column(Numeric(10, 6), default=Decimal("0"))
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON)

    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"), nullable=False)
    agent: Mapped["Agent"] = relationship("Agent", back_populates="audit_logs")


class ApprovalRequest(Base, TimestampMixin):
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    decision_note: Mapped[Optional[str]] = mapped_column(Text)
    decided_at: Mapped[Optional[str]] = mapped_column(String)

    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"), nullable=False)
    agent: Mapped["Agent"] = relationship("Agent", back_populates="approval_requests")
