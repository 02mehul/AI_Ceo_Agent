from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from ..models.project import ProjectStatus, GoalStatus


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: ProjectStatus
    company_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: str
    agent_id: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[GoalStatus] = None
    agent_id: Optional[str] = None


class GoalOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: GoalStatus
    project_id: str
    agent_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
