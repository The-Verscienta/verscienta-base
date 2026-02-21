from fastapi import APIRouter

from app.models.schemas import DosageRequest, DosageResponse
from app.services import cache
from app.services.symbolic import compute_dosage

router = APIRouter()


@router.post("/dosage", response_model=DosageResponse)
async def dosage(request: DosageRequest):
    # Check cache
    cache_key = cache.make_cache_key("dosage", request.model_dump(mode="json"))
    cached = await cache.get_cached(cache_key)
    if cached:
        return DosageResponse(**cached, cached=True)

    result = compute_dosage(
        body_weight_kg=request.body_weight_kg,
        dose_per_kg_mg=request.dose_per_kg_mg,
        interaction_factor=request.constraints.interaction_factor if request.constraints else None,
        max_daily_mg=request.constraints.max_daily_mg if request.constraints else None,
    )

    # Cache the result
    await cache.set_cached(cache_key, result)

    return DosageResponse(**result, cached=False)
