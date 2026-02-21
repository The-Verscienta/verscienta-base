import pint

# Shared unit registry
ureg = pint.UnitRegistry()
Q_ = ureg.Quantity


def convert_units(value: float, from_unit: str, to_unit: str) -> dict:
    """Convert a value between units using pint."""
    source = Q_(value, from_unit)
    converted = source.to(to_unit)
    return {
        "result": f"{converted.magnitude} {to_unit}",
        "numeric": float(converted.magnitude),
        "unit": to_unit,
        "latex": f"{value}\\,\\text{{{from_unit}}} = {converted.magnitude:.6g}\\,\\text{{{to_unit}}}",
    }


def validate_unit(unit_str: str) -> bool:
    """Check if a unit string is recognized by pint."""
    try:
        ureg.parse_units(unit_str)
        return True
    except pint.errors.UndefinedUnitError:
        return False
