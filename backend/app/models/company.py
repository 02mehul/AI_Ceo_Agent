import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base
from .mixins import TimestampMixin


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mission: Mapped[str] = mapped_column(Text, nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(255))
    stage: Mapped[Optional[str]] = mapped_column(String(100))
    goals: Mapped[list] = mapped_column(JSON, default=list)
    tools: Mapped[list] = mapped_column(JSON, default=list)

    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    owner: Mapped["User"] = relationship("User", back_populates="companies")
    agents: Mapped[list["Agent"]] = relationship(
        "Agent", back_populates="company", cascade="all, delete-orphan"
    )
    projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="company", cascade="all, delete-orphan"
    )
