from fastapi import APIRouter
from .auth import router as auth_router
from .company import router as company_router
from .agents import router as agents_router
from .projects import router as projects_router
from .tasks import router as tasks_router
from .audit import router as audit_router
from .execute import router as execute_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(company_router)
api_router.include_router(agents_router)
api_router.include_router(projects_router)
api_router.include_router(tasks_router)
api_router.include_router(audit_router)
api_router.include_router(execute_router)
