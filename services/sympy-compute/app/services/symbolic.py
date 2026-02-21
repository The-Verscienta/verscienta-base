import re

import sympy
from sympy import (
    Abs,
    Float,
    Integer,
    Rational,
    Symbol,
    cos,
    diff,
    exp,
    integrate,
    latex,
    log,
    pi,
    simplify,
    sin,
    solve,
    sqrt,
    tan,
)
from sympy.core.numbers import ImaginaryUnit
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

# Whitelist of safe names available during parsing.
SAFE_LOCALS: dict[str, object] = {
    "sin": sin,
    "cos": cos,
    "tan": tan,
    "exp": exp,
    "log": log,
    "sqrt": sqrt,
    "pi": pi,
    "abs": Abs,
    "Abs": Abs,
    "Rational": Rational,
    "Integer": Integer,
    "Float": Float,
    "I": ImaginaryUnit,
}

# Allowed characters: alphanumeric, whitespace, math operators, parens, commas, decimal points
_ALLOWED_CHARS = re.compile(r"^[a-zA-Z0-9\s\+\-\*/\^,\.\(\)]+$")

# Patterns that indicate introspection / code injection attempts
_DANGEROUS_PATTERNS = re.compile(
    r"__|getattr|setattr|delattr|compile|import|open|system"
    r"|globals|locals|vars|dir|type|classmethod|staticmethod"
    r"|breakpoint|input|print|exit|quit|help"
    r"|\bos\b|\bsys\b|\bsubprocess\b|\bshutil\b|\bbuiltins\b",
    re.IGNORECASE,
)

# Transformations for parse_expr — standard math parsing only
_TRANSFORMATIONS = standard_transformations + (
    convert_xor,
    implicit_multiplication_application,
)


def _validate_expression(expression: str) -> None:
    """Reject expressions containing dangerous patterns before any parsing."""
    if not _ALLOWED_CHARS.match(expression):
        raise ValueError(
            "Expression contains disallowed characters. "
            "Only alphanumeric characters, math operators (+\u2212*/^), "
            "parentheses, commas, and decimal points are permitted."
        )
    if _DANGEROUS_PATTERNS.search(expression):
        raise ValueError("Expression contains disallowed keywords.")


def parse_expression(expression: str, assumptions: dict[str, bool] | None = None):
    """Safely parse a mathematical expression string into a SymPy expression.

    Uses parse_expr() with an explicit whitelist instead of sympify(),
    which is unsafe on untrusted input due to internal use of Python code
    evaluation.
    """
    _validate_expression(expression)

    local_dict = dict(SAFE_LOCALS)

    if assumptions:
        for var_name in _extract_variable_names(expression):
            local_dict[var_name] = Symbol(var_name, **assumptions)

    return parse_expr(
        expression,
        local_dict=local_dict,
        transformations=_TRANSFORMATIONS,
    )


def _extract_variable_names(expression: str) -> list[str]:
    """Extract variable names from an expression string.

    The expression has already been validated by the caller.
    """
    try:
        expr = parse_expr(
            expression,
            local_dict=SAFE_LOCALS,
            transformations=_TRANSFORMATIONS,
            evaluate=False,
        )
        return [str(s) for s in expr.free_symbols]
    except Exception:
        return []


def compute_solve(expression: str, assumptions: dict[str, bool] | None = None) -> dict:
    """Solve an equation (or expression = 0)."""
    expr = parse_expression(expression, assumptions)
    free = list(expr.free_symbols)
    variable = free[0] if free else Symbol("x")
    solutions = solve(expr, variable)

    result_strs = [str(s) for s in solutions]
    result_latex = [latex(s) for s in solutions]

    # Try numeric evaluation
    numeric_values = []
    for s in solutions:
        try:
            val = float(s.evalf())
            numeric_values.append(val)
        except (TypeError, ValueError):
            numeric_values.append(None)

    result_str = ", ".join(result_strs) if len(result_strs) > 1 else (result_strs[0] if result_strs else "no solution")
    latex_str = ", ".join(result_latex) if len(result_latex) > 1 else (result_latex[0] if result_latex else "")
    numeric = numeric_values[0] if len(numeric_values) == 1 and numeric_values[0] is not None else None

    return {"result": result_str, "latex": latex_str, "numeric": numeric}


def compute_simplify(expression: str, assumptions: dict[str, bool] | None = None) -> dict:
    """Simplify a mathematical expression."""
    expr = parse_expression(expression, assumptions)
    simplified = simplify(expr)

    numeric = None
    try:
        val = float(simplified.evalf())
        if simplified.is_number:
            numeric = val
    except (TypeError, ValueError):
        pass

    return {"result": str(simplified), "latex": latex(simplified), "numeric": numeric}


def compute_diff(expression: str, assumptions: dict[str, bool] | None = None) -> dict:
    """Differentiate an expression with respect to its first free variable."""
    expr = parse_expression(expression, assumptions)
    free = list(expr.free_symbols)
    variable = free[0] if free else Symbol("x")
    result = diff(expr, variable)

    return {"result": str(result), "latex": latex(result), "numeric": None}


def compute_integrate(expression: str, assumptions: dict[str, bool] | None = None) -> dict:
    """Integrate an expression with respect to its first free variable."""
    expr = parse_expression(expression, assumptions)
    free = list(expr.free_symbols)
    variable = free[0] if free else Symbol("x")
    result = integrate(expr, variable)

    return {"result": str(result), "latex": latex(result), "numeric": None}


def compute_dosage(
    body_weight_kg: float,
    dose_per_kg_mg: float,
    interaction_factor: float | None = None,
    max_daily_mg: float | None = None,
    doses_per_day: int = 3,
) -> dict:
    """Compute dosage using symbolic math for precision."""
    weight = sympy.Rational(str(body_weight_kg))
    dose_rate = sympy.Rational(str(dose_per_kg_mg))
    factor = sympy.Rational(str(interaction_factor)) if interaction_factor is not None else sympy.Integer(1)

    daily_dose = weight * dose_rate * factor
    per_dose = daily_dose / doses_per_day

    daily_dose_float = float(daily_dose)
    per_dose_float = float(per_dose)

    constraint_details = []
    within_limits = True

    if max_daily_mg is not None:
        effective_max = float(sympy.Rational(str(max_daily_mg)) * factor) if interaction_factor is not None else max_daily_mg
        status = "ok" if daily_dose_float <= effective_max else "exceeded"
        if status == "exceeded":
            within_limits = False
        constraint_details.append({
            "constraint": "max_daily_mg",
            "limit": effective_max,
            "actual": daily_dose_float,
            "status": status,
        })

    # Build LaTeX representation
    parts = [f"{body_weight_kg} \\times {dose_per_kg_mg}"]
    if interaction_factor is not None:
        parts.append(f"\\times {interaction_factor}")
    latex_str = " ".join(parts) + f" = {daily_dose_float}\\,\\text{{mg}}"

    return {
        "daily_dose_mg": daily_dose_float,
        "per_dose_mg": per_dose_float,
        "doses_per_day": doses_per_day,
        "within_safety_limits": within_limits,
        "constraint_details": constraint_details,
        "latex": latex_str,
    }
