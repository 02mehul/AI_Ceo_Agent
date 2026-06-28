from typing import Optional
from pydantic import BaseModel


class CompanyCreate(BaseModel):
    name: str
    mission: str
    industry: Optional[str] = None
    stage: Optional[str] = None
    goals: list[str] = []
    tools: list[str] = []


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    mission: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    goals: Optional[list[str]] = None
    tools: Optional[list[str]] = None


class CompanyOut(BaseModel):
    id: str
    name: str
    mission: str
    industry: Optional[str]
    stage: Optional[str]
    goals: list[str]
    tools: list[str]

    model_config = {"from_attributes": True}
