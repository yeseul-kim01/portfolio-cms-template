"""포트폴리오 프로젝트 API. GET 공개, 쓰기는 본인만."""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import require_admin
from ..models import ProjectIn

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
def list_projects():
    return db.list_projects()


@router.get("/{project_id}")
def get_project(project_id: str):
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(404, "프로젝트를 찾을 수 없습니다.")
    return project


@router.put("/{project_id}")
def upsert_project(project_id: str, body: ProjectIn, _admin=Depends(require_admin)):
    data = body.model_dump(exclude_none=False)
    data["id"] = project_id
    if not data.get("slug"):
        data["slug"] = project_id
    return db.put_project(data)


@router.delete("/{project_id}")
def delete_project(project_id: str, _admin=Depends(require_admin)):
    db.delete_project(project_id)
    return {"ok": True}
