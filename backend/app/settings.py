"""환경변수 기반 설정. SAM template.yaml 의 Environment 와 키가 일치해야 합니다."""
import hashlib
import os


class Settings:
    # DynamoDB
    TABLE_NAME: str = os.environ.get("TABLE_NAME", "portfolio-cms")

    # 이미지 업로드용 S3 버킷 (CloudFront 로 서빙)
    UPLOAD_BUCKET: str = os.environ.get("UPLOAD_BUCKET", "")
    ASSET_BASE_URL: str = os.environ.get("ASSET_BASE_URL", "")

    AWS_REGION: str = os.environ.get("AWS_REGION", "ap-northeast-2")

    # 단일 관리자 비밀번호 (이 비번으로만 로그인 → 글쓰기 가능)
    ADMIN_PASSWORD: str = os.environ.get("ADMIN_PASSWORD", "")

    # 로그인 후 발급되는 JWT 유효시간(시간)
    TOKEN_TTL_HOURS: int = int(os.environ.get("TOKEN_TTL_HOURS", "168"))  # 7일

    # (선택) 블로그 가져오기: 태그 접미사만 입력했을 때 붙일 기본 블로그 주소
    TISTORY_BASE: str = os.environ.get("TISTORY_BASE", "")

    # CORS 허용 오리진 (콤마 구분). 운영 도메인은 CORS_ORIGINS 환경변수로 지정.
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]

    @property
    def jwt_secret(self) -> str:
        """JWT 서명 키 — 관리자 비밀번호에서 파생(별도 비밀 관리 불필요).
        비번을 바꾸면 기존 토큰은 자동 무효화됩니다."""
        return hashlib.sha256((self.ADMIN_PASSWORD + "::portfolio-cms-jwt").encode()).hexdigest()


settings = Settings()
