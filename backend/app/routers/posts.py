"""블로그 글 API. GET 은 공개, 쓰기는 본인만(require_admin)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import db
from ..auth import require_admin
from ..models import PostIn, PostOut

router = APIRouter(prefix="/posts", tags=["posts"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("")
def list_posts(lang: str = Query("ko")):
    """공개 목록: 발행된 글만 반환."""
    return db.list_posts(lang=lang, include_drafts=False)


@router.get("/admin")
def list_posts_admin(lang: str = Query("ko"), _admin=Depends(require_admin)):
    """관리자용: 임시저장 포함 전체 목록."""
    return db.list_posts(lang=lang, include_drafts=True)


@router.get("/{slug}")
def get_post(slug: str, lang: str = Query("ko")):
    post = db.get_post_by_slug(slug, lang=lang)
    if not post or post.get("status") != "published":
        raise HTTPException(404, "글을 찾을 수 없습니다.")
    return post


@router.post("", response_model=PostOut)
def create_post(body: PostIn, _admin=Depends(require_admin)):
    now = _now()
    post = body.model_dump()
    post["id"] = db.new_id()
    post["created_at"] = now
    post["updated_at"] = now
    post["published_at"] = now if body.status == "published" else None
    return db.put_post(post)


@router.put("/{post_id}", response_model=PostOut)
def update_post(post_id: str, body: PostIn, _admin=Depends(require_admin)):
    existing = db.get_post_by_id(post_id)
    if not existing:
        raise HTTPException(404, "글을 찾을 수 없습니다.")
    post = {**existing, **body.model_dump()}
    post["id"] = post_id
    post["updated_at"] = _now()
    # draft -> published 로 처음 전환될 때만 published_at 설정
    if body.status == "published" and not existing.get("published_at"):
        post["published_at"] = _now()
    if body.status == "draft":
        post["published_at"] = None
    return db.put_post(post)


@router.delete("/{post_id}")
def delete_post(post_id: str, _admin=Depends(require_admin)):
    db.delete_post(post_id)
    return {"ok": True}
