import uuid
import enum
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base
from .mixins import TimestampMixin


class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    ARCHIVED = "archived"


class GoalStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[ProjectStatus] = mapped_column(SAEnum(ProjectStatus), default=ProjectStatus.ACTIVE)

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    company: Mapped["Company"] = relationship("Company", back_populates="projects")
    goals: Mapped[list["Goal"]] = relationship(
        "Goal", back_populates="project", cascade="all, delete-orphan"
    )


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[GoalStatus] = mapped_column(SAEnum(GoalStatus), default=GoalStatus.TODO)

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    project: Mapped["Project"] = relationship("Project", back_populates="goals")

    agent_id: Mapped[Optional[str]] = mapped_column(ForeignKey("agents.id"))
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="goal")
