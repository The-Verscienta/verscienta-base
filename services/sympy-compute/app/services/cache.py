import hashlib
import json
import logging

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None


async def get_client() -> redis.Redis:
    """Get or create the async Redis (DragonflyDB) client."""
    global _client
    if _client is None:
        _client = redis.from_url(settings.cache_url, decode_responses=True)
    return _client


async def close_client() -> None:
    """Close the Redis client connection."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def make_cache_key(prefix: str, data: dict) -> str:
    """Generate a deterministic cache key from request data."""
    serialized = json.dumps(data, sort_keys=True)
    digest = hashlib.sha256(serialized.encode()).hexdigest()[:16]
    return f"sympy:{prefix}:{digest}"


async def get_cached(key: str) -> dict | None:
    """Retrieve a cached result."""
    try:
        client = await get_client()
        raw = await client.get(key)
        if raw:
            return json.loads(raw)
    except Exception:
        logger.warning("Cache read failed for key %s", key, exc_info=True)
    return None


async def set_cached(key: str, value: dict, ttl: int | None = None) -> None:
    """Store a result in cache with TTL."""
    try:
        client = await get_client()
        await client.set(key, json.dumps(value), ex=ttl or settings.cache_ttl_seconds)
    except Exception:
        logger.warning("Cache write failed for key %s", key, exc_info=True)


async def ping() -> bool:
    """Check if the cache is reachable."""
    try:
        client = await get_client()
        return await client.ping()
    except Exception:
        return False
