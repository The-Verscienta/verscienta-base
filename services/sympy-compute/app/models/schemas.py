from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ComputeOperation(str, Enum):
    solve = "solve"
    simplify = "simplify"
    diff = "diff"
    integrate = "integrate"
    convert_units = "convert_units"


class ComputeRequest(BaseModel):
    operation: ComputeOperation
    expression: str = Field(..., min_length=1, max_length=500)
    variables: Optional[dict[str, str]] = None
    assumptions: Optional[dict[str, bool]] = None


class ComputeResponse(BaseModel):
    result: str
    latex: str
    numeric: Optional[float] = None
    unit: Optional[str] = None
    cached: bool = False


class DosageConstraints(BaseModel):
    max_daily_mg: Optional[float] = Field(None, gt=0)
    interaction_factor: Optional[float] = Field(None, ge=0, le=1)


class DosageForm(str, Enum):
    powder = "powder"
    tincture = "tincture"
    capsule = "capsule"
    tea = "tea"
    decoction = "decoction"
    extract = "extract"


class DosageRequest(BaseModel):
    herb_name: str = Field(..., min_length=1, max_length=100)
    body_weight_kg: float = Field(..., gt=0, le=500)
    dose_per_kg_mg: float = Field(..., gt=0, le=10000)
    constraints: Optional[DosageConstraints] = None
    age_years: Optional[float] = Field(None, ge=0, le=120)
    form: Optional[DosageForm] = None


class ConstraintDetail(BaseModel):
    constraint: str
    limit: float
    actual: float
    status: str  # "ok" or "exceeded"


class DosageResponse(BaseModel):
    daily_dose_mg: float
    per_dose_mg: float
    doses_per_day: int
    within_safety_limits: bool
    constraint_details: list[ConstraintDetail]
    latex: str
    cached: bool = False


class HealthResponse(BaseModel):
    status: str
    sympy_version: str
    cache_connected: bool
    uptime_seconds: float
