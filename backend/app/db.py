"""DynamoDB 단일 테이블 접근 계층.

테이블 구조:
  pk (HASH)   : 엔티티 식별자  예) "POST#<uuid>", "PROJECT#speaknote"
  sk (RANGE)  : "META"
  GSI1PK      : 목록 조회용 파티션  예) "POST#ko", "PROJECT"
  GSI1SK      : 정렬 키           예) 게시글=published_at, 프로젝트="<category>#<order>"

GSI1 하나로 "언어별 글 목록(최신순)", "프로젝트 목록(카테고리/순서)" 을 모두 처리합니다.
"""
from decimal import Decimal
import uuid

import boto3
from boto3.dynamodb.conditions import Key

from .settings import settings

import os

# 로컬 개발 시 DYNAMODB_ENDPOINT(예: http://localhost:8000)를 주면 DynamoDB Local 에 연결.
# 비워두면 실제 AWS DynamoDB 에 연결.
_endpoint = os.environ.get("DYNAMODB_ENDPOINT") or None
_dynamodb = boto3.resource(
    "dynamodb", region_name=settings.AWS_REGION, endpoint_url=_endpoint
)
_table = _dynamodb.Table(settings.TABLE_NAME)


def _clean(obj):
    """DynamoDB <-> JSON 변환 시 Decimal/빈값 정리."""
    if isinstance(obj, list):
        return [_clean(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


def new_id() -> str:
    return uuid.uuid4().hex[:12]


# ----------------------------- Posts -----------------------------

def _post_pk(post_id: str) -> str:
    return f"POST#{post_id}"


def put_post(post: dict) -> dict:
    """post dict 를 저장(생성/갱신). 호출부에서 id/타임스탬프를 채워 전달."""
    item = {
        "pk": _post_pk(post["id"]),
        "sk": "META",
        "type": "post",
        "GSI1PK": f"POST#{post.get('lang', 'ko')}",
        # 발행 안 된 글도 목록에서 보이도록 published_at 없으면 created_at 사용
        "GSI1SK": post.get("published_at") or post["created_at"],
        **post,
    }
    _table.put_item(Item=item)
    return _clean(post)


def get_post_by_id(post_id: str) -> dict | None:
    res = _table.get_item(Key={"pk": _post_pk(post_id), "sk": "META"})
    item = res.get("Item")
    return _strip_keys(_clean(item)) if item else None


def get_post_by_slug(slug: str, lang: str = "ko") -> dict | None:
    """GSI1 에서 언어별 글을 조회 후 slug 매칭. 개인 블로그 규모에선 충분히 가벼움."""
    res = _table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"POST#{lang}"),
    )
    for item in res.get("Items", []):
        if item.get("slug") == slug:
            return _strip_keys(_clean(item))
    return None


def list_posts(lang: str = "ko", include_drafts: bool = False) -> list[dict]:
    res = _table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"POST#{lang}"),
        ScanIndexForward=False,  # 최신순
    )
    items = [_strip_keys(_clean(i)) for i in res.get("Items", [])]
    if not include_drafts:
        items = [i for i in items if i.get("status") == "published"]
    return items


def delete_post(post_id: str) -> None:
    _table.delete_item(Key={"pk": _post_pk(post_id), "sk": "META"})


# ---------------------------- Projects ---------------------------

def _project_pk(project_id: str) -> str:
    return f"PROJECT#{project_id}"


def put_project(project: dict) -> dict:
    order = str(project.get("order", "500")).zfill(4)
    item = {
        "pk": _project_pk(project["id"]),
        "sk": "META",
        "type": "project",
        "GSI1PK": "PROJECT",
        "GSI1SK": f"{project.get('category', 'project')}#{order}",
        **project,
    }
    _table.put_item(Item=item)
    return _clean(project)


def get_project(project_id: str) -> dict | None:
    res = _table.get_item(Key={"pk": _project_pk(project_id), "sk": "META"})
    item = res.get("Item")
    return _strip_keys(_clean(item)) if item else None


def list_projects() -> list[dict]:
    res = _table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq("PROJECT"),
    )
    return [_strip_keys(_clean(i)) for i in res.get("Items", [])]


def delete_project(project_id: str) -> None:
    _table.delete_item(Key={"pk": _project_pk(project_id), "sk": "META"})


# ------------------------- Site content (언어별 문서) -------------------------

def _content_pk(lang: str) -> str:
    return f"CONTENT#{lang}"


def get_content(lang: str) -> dict | None:
    """nav/home/about/contact/modal 등 사이트 텍스트 전체 문서."""
    res = _table.get_item(Key={"pk": _content_pk(lang), "sk": "META"})
    item = res.get("Item")
    if not item:
        return None
    return _clean(item.get("data"))


def put_content(lang: str, data: dict) -> dict:
    _table.put_item(
        Item={
            "pk": _content_pk(lang),
            "sk": "META",
            "type": "content",
            "lang": lang,
            "data": data,
        }
    )
    return _clean(data)


def _strip_keys(item: dict) -> dict:
    """응답에서 내부 테이블 키를 제거."""
    for k in ("pk", "sk", "GSI1PK", "GSI1SK", "type"):
        item.pop(k, None)
    return item


# ----------------------------- Analytics -----------------------------
# 조회 카운터. pk="ANALYTICS#<event>", sk="<target>", count 를 원자적으로 +1.
# GSI1PK="ANALYTICS" 로 모아 한 번에 집계 조회.

def track_event(event: str, target: str) -> None:
    _table.update_item(
        Key={"pk": f"ANALYTICS#{event}", "sk": target},
        UpdateExpression=(
            "SET #t = :type, GSI1PK = :gp, GSI1SK = :gs, evt = :ev, tgt = :tg "
            "ADD #c :one"
        ),
        ExpressionAttributeNames={"#t": "type", "#c": "count"},
        ExpressionAttributeValues={
            ":type": "analytics",
            ":gp": "ANALYTICS",
            ":gs": f"{event}#{target}",
            ":ev": event,
            ":tg": target,
            ":one": 1,
        },
    )


def get_analytics() -> list[dict]:
    """모든 분석 카운터를 [{event, target, count}] 로 반환."""
    out: list[dict] = []
    kwargs = {
        "IndexName": "GSI1",
        "KeyConditionExpression": Key("GSI1PK").eq("ANALYTICS"),
    }
    while True:
        res = _table.query(**kwargs)
        for it in res.get("Items", []):
            out.append(
                {
                    "event": it.get("evt"),
                    "target": it.get("tgt"),
                    "count": it.get("count", 0),
                }
            )
        if "LastEvaluatedKey" not in res:
            break
        kwargs["ExclusiveStartKey"] = res["LastEvaluatedKey"]
    return _clean(out)
