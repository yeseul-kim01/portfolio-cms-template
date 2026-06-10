"""FastAPI 앱 진입점. 로컬은 uvicorn, 배포는 Lambda(Mangum)로 동일 코드 실행."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import analytics, auth_routes, content, import_tistory, posts, projects, uploads
from .settings import settings

app = FastAPI(title="Portfolio CMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(analytics.router)
app.include_router(content.router)
app.include_router(import_tistory.router)
app.include_router(posts.router)
app.include_router(projects.router)
app.include_router(uploads.router)


@app.get("/health")
def health():
    return {"ok": True}


# Lambda 핸들러 (SAM template.yaml 의 Handler: app.main.handler).
# mangum 은 Lambda 에서만 필요하므로, 로컬 uvicorn 실행 시 없어도 동작하도록 선택적 import.
try:
    from mangum import Mangum

    handler = Mangum(app)
except ModuleNotFoundError:  # 로컬 개발 (uvicorn 직접 실행)
    handler = None
