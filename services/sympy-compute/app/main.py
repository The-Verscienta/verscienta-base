import logging

from fastapi import FastAPI, Request, Response, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader

from app.config import settings
from app.routers import compute, dosage, health
from app.services import cache

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

app = FastAPI(title="Verscienta SymPy Compute", version="1.0.0")

# CORS — only internal Docker network in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# API key security scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


@app.middleware("http")
async def enforce_api_key(request: Request, call_next):
    # Health check is public
    if request.url.path == "/health":
        return await call_next(request)

    # Enforce request size limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_request_size:
        return Response(content='{"detail":"Request body too large"}', status_code=413, media_type="application/json")

    # Validate API key
    key = request.headers.get("x-api-key")
    if key != settings.api_key:
        return Response(content='{"detail":"Invalid or missing API key"}', status_code=401, media_type="application/json")

    return await call_next(request)


# Register routers
app.include_router(health.router)
app.include_router(compute.router)
app.include_router(dosage.router)


@app.on_event("shutdown")
async def shutdown_event():
    await cache.close_client()
