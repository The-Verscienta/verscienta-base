import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

HEADERS = {"X-API-Key": "changeme", "Content-Type": "application/json"}


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_solve_quadratic():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "solve", "expression": "x**2 - 4"},
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert "-2" in data["result"] or "2" in data["result"]


@pytest.mark.anyio
async def test_simplify():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "simplify", "expression": "(x**2 + 2*x + 1)/(x + 1)"},
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert "x + 1" in data["result"]


@pytest.mark.anyio
async def test_differentiate():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "diff", "expression": "x**3 + 2*x"},
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert "3*x**2 + 2" in data["result"]


@pytest.mark.anyio
async def test_integrate():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "integrate", "expression": "2*x"},
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert "x**2" in data["result"]


@pytest.mark.anyio
async def test_convert_units():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "convert_units", "expression": "1000 mg to g"},
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert data["numeric"] == pytest.approx(1.0)
    assert data["unit"] == "g"


@pytest.mark.anyio
async def test_missing_api_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "solve", "expression": "x - 1"},
        )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_invalid_expression():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "solve", "expression": "???!!!"},
            headers=HEADERS,
        )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_solve_with_positive_assumption():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={
                "operation": "solve",
                "expression": "x**2 - 9",
                "assumptions": {"positive": True},
            },
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert "3" in data["result"]


# --- Injection prevention tests ---


@pytest.mark.anyio
async def test_rejects_dunder_attribute_access():
    """Blocks __class__.__bases__ introspection attacks."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "simplify", "expression": "sin.__class__.__bases__"},
            headers=HEADERS,
        )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_rejects_import_keyword():
    """Blocks import-based injection."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "simplify", "expression": "__import__('os')"},
            headers=HEADERS,
        )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_rejects_dot_attribute_access():
    """Blocks attribute access via dot notation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "simplify", "expression": "sin.func"},
            headers=HEADERS,
        )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_rejects_bracket_subscript():
    """Blocks subscript/bracket notation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/compute",
            json={"operation": "simplify", "expression": "x[0]"},
            headers=HEADERS,
        )
    assert response.status_code == 400
