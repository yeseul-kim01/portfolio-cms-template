"""단일 비밀번호 로그인 + JWT 발급/검증.

흐름:
  1) POST /auth/login {password} → 비번 확인 → HS256 JWT 발급
  2) 쓰기 요청은 Authorization: Bearer <token> → require_admin 으로 검증

공개 GET 엔드포인트는 인증이 필요 없습니다.
"""
import hmac
from datetime import datetime, timedelta, timezone

from fastapi import Header, HTTPException, status
from jose import jwt, JWTError

from .settings import settings


def verify_password(password: str) -> bool:
    """타이밍 공격 방지를 위해 상수 시간 비교."""
    if not settings.ADMIN_PASSWORD:
        return False
    return hmac.compare_digest(password, settings.ADMIN_PASSWORD)


def create_token() -> tuple[str, str]:
    """로그인 성공 시 토큰 발급. (token, expires_at_iso) 반환."""
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.TOKEN_TTL_HOURS)
    payload = {"sub": "admin", "exp": expires}
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return token, expires.isoformat()


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    """Bearer 토큰 검증. 쓰기 라우트에서 사용."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다.")

    token = authorization.split(" ", 1)[1].strip()
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "토큰이 유효하지 않거나 만료되었습니다.")

    if claims.get("sub") != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "권한이 없습니다.")
    return claims
