"""이미지 업로드: 브라우저가 S3 로 직접 PUT 할 수 있는 presigned URL 발급(본인만)."""
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, Depends, HTTPException

from ..auth import require_admin
from ..models import PresignRequest
from ..settings import settings

router = APIRouter(prefix="/uploads", tags=["uploads"])

_s3 = boto3.client("s3", region_name=settings.AWS_REGION)


@router.post("/presign")
def presign(body: PresignRequest, _admin=Depends(require_admin)):
    if not settings.UPLOAD_BUCKET:
        raise HTTPException(500, "UPLOAD_BUCKET 이 설정되지 않았습니다.")

    safe_name = body.filename.replace("/", "_").replace(" ", "-")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    key = f"{body.prefix.strip('/')}/{stamp}-{safe_name}"

    upload_url = _s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.UPLOAD_BUCKET,
            "Key": key,
            "ContentType": body.content_type,
        },
        ExpiresIn=300,
    )

    # 업로드 후 실제 접근할 공개 URL (CloudFront 도메인 우선, 없으면 S3 경로)
    if settings.ASSET_BASE_URL:
        public_url = f"{settings.ASSET_BASE_URL.rstrip('/')}/{key}"
    else:
        public_url = f"https://{settings.UPLOAD_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"

    return {"upload_url": upload_url, "public_url": public_url, "key": key}
