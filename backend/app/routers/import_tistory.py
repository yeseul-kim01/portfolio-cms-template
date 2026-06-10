"""티스토리 글 가져오기.

- POST /import/preview  {url}                  → 단일 글 파싱(미리보기, 저장 안 함)
- POST /import/post     {url, project_id, ...} → 단일 글 파싱 후 저장
- POST /import/tag      {tag, project_id, ...} → 태그 목록의 모든 글을 일괄 저장

본문 이미지는 티스토리 URL 그대로 둡니다(재호스팅 안 함).
"""
import re
from datetime import datetime, timezone
from urllib.parse import quote, urlparse

import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException
from markdownify import markdownify
from pydantic import BaseModel

from .. import db
from ..auth import require_admin
from ..settings import settings

router = APIRouter(prefix="/import", tags=["import"])

_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
_CONTENT_SELECTORS = [".contents_style", ".tt_article_useless_p_margin", ".article_view", ".entry-content"]


# ----------------------------- 요청 모델 -----------------------------
class PreviewReq(BaseModel):
    url: str


class ImportPostReq(BaseModel):
    url: str
    project_id: str
    status: str = "published"


class ImportTagReq(BaseModel):
    tag: str           # "프로젝트기록-speaknote" 또는 전체 태그 URL
    project_id: str
    status: str = "published"


# ----------------------------- 스크래핑 -----------------------------
def _fetch(url: str) -> str:
    try:
        res = requests.get(url, headers={"User-Agent": _UA}, timeout=10)
        res.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(502, f"페이지를 가져오지 못했습니다: {e}")
    return res.text


def _meta(soup: BeautifulSoup, prop: str) -> str | None:
    tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
    return tag.get("content") if tag else None


def _slug_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    m = re.search(r"(\d+)$", path)
    if m:
        return m.group(1)
    return re.sub(r"[^a-z0-9가-힣-]+", "-", path.lower()).strip("-") or "post"


def parse_post(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    title = _meta(soup, "og:title") or (soup.title.string if soup.title else "") or "제목 없음"
    title = title.strip()

    node = next((soup.select_one(sel) for sel in _CONTENT_SELECTORS if soup.select_one(sel)), None)
    if node is None:
        raise HTTPException(422, "본문 영역을 찾지 못했습니다. (티스토리 스킨 구조 확인 필요)")

    content_md = markdownify(str(node), heading_style="ATX", bullets="-").strip()
    content_md = re.sub(r"\n{3,}", "\n\n", content_md)  # 빈 줄 정리

    all_tags = [a.get_text(strip=True) for a in soup.select("a[rel=tag]")]
    # 프로젝트 분류 태그(프로젝트기록-<id>)에서 project_id 추출
    project_id = next(
        (t[len("프로젝트기록-"):] for t in all_tags if t.startswith("프로젝트기록-")),
        None,
    )
    # 본문에 노출할 태그는 분류용 태그 제외
    tags = list(dict.fromkeys(t for t in all_tags if t and not t.startswith("프로젝트기록-")))

    published = _meta(soup, "article:published_time")
    text = node.get_text(" ", strip=True)
    excerpt = (text[:100] + "…") if len(text) > 100 else text

    return {
        "title": title,
        "content": content_md,
        "excerpt": excerpt,
        "tags": tags,
        "project_id": project_id,
        "cover_image": _meta(soup, "og:image"),
        "published_at": published,
        "source_url": url,
        "slug": _slug_from_url(url),
    }


def _sitemap_post_urls() -> list[str]:
    """sitemap.xml 에서 글 permalink(/숫자) 들을 수집."""
    base = settings.TISTORY_BASE.rstrip("/")
    xml = _fetch(f"{base}/sitemap.xml")
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    urls, seen = [], set()
    for loc in locs:
        if "/m/" in loc:  # 모바일 중복 URL 제외 (본문 마크업이 달라 파싱 실패)
            continue
        m = re.search(r"/(\d+)/?$", loc)
        if m and m.group(1) not in seen:
            seen.add(m.group(1))
            urls.append(loc)
    return urls


def _tag_url(tag: str, page: int) -> tuple[str, str]:
    """tag 입력(접미사 또는 전체 URL) → (base, page_url)."""
    if tag.startswith("http"):
        p = urlparse(tag)
        base = f"{p.scheme}://{p.netloc}"
        tag_path = p.path
    else:
        base = settings.TISTORY_BASE.rstrip("/")
        tag_path = f"/tag/{quote(tag)}"
    return base, f"{base}{tag_path}?page={page}"


def enumerate_tag_posts(tag: str, max_pages: int = 30) -> list[str]:
    """태그 목록 페이지들을 돌며 글 permalink(/숫자) 들을 수집."""
    seen: list[str] = []
    seen_set: set[str] = set()
    for page in range(1, max_pages + 1):
        base, page_url = _tag_url(tag, page)
        try:
            html = _fetch(page_url)
        except HTTPException:
            # 범위를 넘은 페이지(예: ?page=2)는 티스토리가 404를 주므로 "더 없음"으로 처리
            break
        soup = BeautifulSoup(html, "html.parser")
        # 본문 목록(.posts) 안의 글 링크만 — 사이드바(link_sub_item 등) 제외
        containers = soup.select(".posts") or [soup]
        page_links: list[str] = []
        for c in containers:
            for a in c.select("a[href]"):
                href = a.get("href", "")
                m = re.match(r"^(?:https?://[^/]+)?/(\d+)/?$", href)
                if not m:
                    continue
                full = href if href.startswith("http") else f"{base}{href}"
                if full not in seen_set:
                    page_links.append(full)
        new = [u for u in page_links if u not in seen_set]
        if not new:
            break
        for u in new:
            seen_set.add(u)
            seen.append(u)
    return seen


# ----------------------------- 저장 -----------------------------
def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create_from_parsed(parsed: dict, project_id: str, status: str, lang: str = "ko") -> dict:
    now = _now()
    post = {
        "id": db.new_id(),
        "slug": parsed["slug"],
        "lang": lang,
        "title": parsed["title"],
        "excerpt": parsed["excerpt"],
        "content": parsed["content"],
        "cover_image": parsed.get("cover_image"),
        "tags": parsed.get("tags", []),
        "status": status,
        "project_id": project_id,
        "source_url": parsed.get("source_url"),
        "created_at": now,
        "updated_at": now,
        "published_at": parsed.get("published_at") or (now if status == "published" else None),
    }
    return db.put_post(post)


# ----------------------------- 엔드포인트 -----------------------------
@router.post("/preview")
def preview(body: PreviewReq, _admin=Depends(require_admin)):
    """단일 글을 파싱만 해서 반환(에디터 미리채우기용)."""
    return parse_post(_fetch(body.url), body.url)


@router.post("/post")
def import_post(body: ImportPostReq, _admin=Depends(require_admin)):
    parsed = parse_post(_fetch(body.url), body.url)
    if db.get_post_by_slug(parsed["slug"], "ko"):
        raise HTTPException(409, f"이미 가져온 글입니다 (slug={parsed['slug']}).")
    return _create_from_parsed(parsed, body.project_id, body.status)


class ImportSitemapReq(BaseModel):
    # 특정 프로젝트만 가져오려면 지정(없으면 프로젝트기록-* 가 붙은 모든 글)
    only_project_id: str | None = None
    status: str = "published"


@router.post("/sitemap")
def import_from_sitemap(body: ImportSitemapReq, _admin=Depends(require_admin)):
    """sitemap 전체를 훑어 각 글의 '프로젝트기록-<id>' 태그로 프로젝트를 자동 분류해 저장.

    이 블로그 테마는 태그 페이지를 JS로 렌더해 서버 HTML에는 태그 결과가 없으므로,
    sitemap 으로 전체 글을 받아 글마다 태그를 직접 확인하는 방식이 정확하다.
    """
    import time
    from concurrent.futures import ThreadPoolExecutor

    urls = _sitemap_post_urls()

    def _safe_parse(url: str):
        # 티스토리 throttle 대비: 422/502는 잠깐 쉬고 재시도
        last = None
        for attempt in range(4):
            try:
                return parse_post(_fetch(url), url)
            except Exception as e:  # noqa: BLE001
                last = str(e)
                time.sleep(0.6 * (attempt + 1))
        return {"_error": last, "source_url": url}

    # 동시성 낮춰 차단 회피
    with ThreadPoolExecutor(max_workers=4) as ex:
        parsed_all = list(ex.map(_safe_parse, urls))

    by_project: dict[str, dict] = {}
    failed = []
    for p in parsed_all:
        if p.get("_error"):
            failed.append({"url": p.get("source_url"), "error": p["_error"]})
            continue
        pid = p.get("project_id")
        if not pid:
            continue  # 프로젝트기록 태그 없는 글은 건너뜀
        if body.only_project_id and pid != body.only_project_id:
            continue
        bucket = by_project.setdefault(pid, {"created": [], "skipped": []})
        if db.get_post_by_slug(p["slug"], "ko"):
            bucket["skipped"].append(p["slug"])
            continue
        _create_from_parsed(p, pid, body.status)
        bucket["created"].append({"slug": p["slug"], "title": p["title"]})

    return {
        "scanned": len(urls),
        "failed": failed,
        "by_project": {
            k: {"created": len(v["created"]), "skipped": len(v["skipped"]), "items": v["created"]}
            for k, v in by_project.items()
        },
    }


@router.post("/tag")
def import_tag(body: ImportTagReq, _admin=Depends(require_admin)):
    urls = enumerate_tag_posts(body.tag)
    if not urls:
        raise HTTPException(404, "태그 목록에서 글을 찾지 못했습니다. 태그명을 확인하세요.")

    created, skipped, failed = [], [], []
    for url in urls:
        try:
            parsed = parse_post(_fetch(url), url)
            if db.get_post_by_slug(parsed["slug"], "ko"):
                skipped.append(parsed["slug"])
                continue
            _create_from_parsed(parsed, body.project_id, body.status)
            created.append({"slug": parsed["slug"], "title": parsed["title"]})
        except Exception as e:  # noqa: BLE001 — 한 글 실패가 전체를 막지 않도록
            failed.append({"url": url, "error": str(e)})

    return {
        "total": len(urls),
        "created": created,
        "skipped": skipped,
        "failed": failed,
    }
