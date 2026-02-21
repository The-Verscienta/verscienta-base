import time

import sympy
from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.services import cache

router = APIRouter()

_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    cache_connected = await cache.ping()
    return HealthResponse(
        status="ok",
        sympy_version=sympy.__version__,
        cache_connected=cache_connected,
        uptime_seconds=round(time.time() - _start_time, 2),
    )
