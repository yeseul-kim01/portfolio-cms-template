"""로그인 엔드포인트: 비밀번호 → JWT 발급."""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ..auth import create_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
def login(body: LoginRequest):
    if not verify_password(body.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "비밀번호가 올바르지 않습니다.")
    token, expires_at = create_token()
    return {"token": token, "expires_at": expires_at}
