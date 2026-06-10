"""요청/응답 스키마. 프로젝트의 중첩 구조(sections 등)는 프론트 types/project.ts 와 호환."""
from typing import Any, Literal

from pydantic import BaseModel, Field


class PostIn(BaseModel):
    slug: str = Field(min_length=1)
    lang: Literal["ko", "en"] = "ko"
    title: str = Field(min_length=1)
    excerpt: str = ""
    content: str = ""  # 마크다운 본문
    cover_image: str | None = None
    tags: list[str] = []
    status: Literal["draft", "published"] = "draft"
    project_id: str | None = None   # 어느 프로젝트의 개발기록인지
    source_url: str | None = None   # 원본(티스토리) 링크


class PostOut(PostIn):
    id: str
    created_at: str
    updated_at: str
    published_at: str | None = None


class TrackIn(BaseModel):
    event: str = Field(min_length=1, max_length=40)
    target: str = Field(default="_", max_length=80)


class ProjectIn(BaseModel):
    # 기존 정적 데이터와 동일한 자유로운 구조를 허용 (sections/links 등은 임의 JSON)
    id: str | None = None
    slug: str | None = None
    name: str | None = None
    title: str | None = None
    category: str | None = "project"
    order: int | None = 500
    tagline: str | None = None
    subtitle: str | None = None
    url: str | None = None
    description: str | None = None
    design: str | None = None
    period: str | None = None
    role: str | None = None
    summary: str | None = None
    tags: list[str] = []
    links: dict[str, Any] = {}
    sections: list[dict[str, Any]] = []

    model_config = {"extra": "allow"}  # 미래 필드 추가에 유연하게 대응


class PresignRequest(BaseModel):
    filename: str
    content_type: str = "image/png"
    # 저장 경로 prefix (예: "posts", "projects/speaknote")
    prefix: str = "uploads"
