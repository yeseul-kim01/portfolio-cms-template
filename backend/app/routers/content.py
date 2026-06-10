"""사이트 텍스트(nav/home/about/contact/modal 등) API. GET 공개, PUT 본인만."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import require_admin

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/{lang}")
def get_content(lang: str):
    data = db.get_content(lang)
    if data is None:
        # DB 에 아직 없으면 프론트가 정적 데이터로 fallback 하도록 404
        raise HTTPException(404, "콘텐츠가 아직 등록되지 않았습니다.")
    return data


@router.put("/{lang}")
def put_content(lang: str, data: dict[str, Any], _admin=Depends(require_admin)):
    # ko/en: 사이트 텍스트, resume: 이력서 데이터, theme: 색 설정
    if lang not in ("ko", "en", "resume", "theme"):
        raise HTTPException(400, "허용되지 않은 키입니다. (ko / en / resume / theme)")
    return db.put_content(lang, data)
