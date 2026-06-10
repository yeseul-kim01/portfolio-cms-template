"""조회수 분석. track 은 공개(POST), 집계 조회(GET)는 본인만."""
from fastapi import APIRouter, Depends

from .. import db
from ..auth import require_admin
from ..models import TrackIn

router = APIRouter(prefix="/analytics", tags=["analytics"])

# 허용 이벤트 (임의 값 적재 방지)
ALLOWED_EVENTS = {
    "resume_view",
    "portfolio_view",
    "project_open",
    "competency_open",
    "post_view",
}


@router.post("/track")
def track(body: TrackIn):
    if body.event not in ALLOWED_EVENTS:
        return {"ok": False}
    target = (body.target or "_").strip()[:80] or "_"
    db.track_event(body.event, target)
    return {"ok": True}


@router.get("")
def get_analytics(_admin=Depends(require_admin)):
    return db.get_analytics()
