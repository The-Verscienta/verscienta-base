from fastapi import APIRouter, HTTPException

from app.models.schemas import ComputeOperation, ComputeRequest, ComputeResponse
from app.services import cache
from app.services.symbolic import (
    compute_diff,
    compute_integrate,
    compute_simplify,
    compute_solve,
)
from app.services.units import convert_units

router = APIRouter()

OPERATION_MAP = {
    ComputeOperation.solve: compute_solve,
    ComputeOperation.simplify: compute_simplify,
    ComputeOperation.diff: compute_diff,
    ComputeOperation.integrate: compute_integrate,
}


@router.post("/compute", response_model=ComputeResponse)
async def compute(request: ComputeRequest):
    # Check cache
    cache_key = cache.make_cache_key("compute", request.model_dump(mode="json"))
    cached = await cache.get_cached(cache_key)
    if cached:
        return ComputeResponse(**cached, cached=True)

    try:
        if request.operation == ComputeOperation.convert_units:
            # Unit conversion expects "value from_unit to to_unit" format
            # e.g. "100 mg to g"
            parts = request.expression.split()
            if len(parts) < 4 or parts[2].lower() != "to":
                raise HTTPException(
                    status_code=400,
                    detail="Unit conversion format: '<value> <from_unit> to <to_unit>'",
                )
            value = float(parts[0])
            from_unit = parts[1]
            to_unit = parts[3]
            result = convert_units(value, from_unit, to_unit)
        else:
            handler = OPERATION_MAP[request.operation]
            result = handler(request.expression, request.assumptions)

    except HTTPException:
        raise
    except (SyntaxError, TypeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid expression: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Computation error: {e}")

    # Cache the result
    await cache.set_cached(cache_key, result)

    return ComputeResponse(**result, cached=False)
