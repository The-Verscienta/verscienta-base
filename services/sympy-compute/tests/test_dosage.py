import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

HEADERS = {"X-API-Key": "changeme", "Content-Type": "application/json"}


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_basic_dosage():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/dosage",
            json={
                "herb_name": "ginger",
                "body_weight_kg": 65,
                "dose_per_kg_mg": 7.5,
            },
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert data["daily_dose_mg"] == pytest.approx(487.5)
    assert data["doses_per_day"] == 3
    assert data["within_safety_limits"] is True


@pytest.mark.anyio
async def test_dosage_with_interaction_factor():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/dosage",
            json={
                "herb_name": "ginger",
                "body_weight_kg": 65,
                "dose_per_kg_mg": 7.5,
                "constraints": {"interaction_factor": 0.75},
            },
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert data["daily_dose_mg"] == pytest.approx(365.625)


@pytest.mark.anyio
async def test_dosage_exceeds_max():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/dosage",
            json={
                "herb_name": "test_herb",
                "body_weight_kg": 100,
                "dose_per_kg_mg": 50,
                "constraints": {"max_daily_mg": 1000},
            },
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert data["within_safety_limits"] is False
    assert any(c["status"] == "exceeded" for c in data["constraint_details"])


@pytest.mark.anyio
async def test_dosage_within_max():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/dosage",
            json={
                "herb_name": "ginger",
                "body_weight_kg": 65,
                "dose_per_kg_mg": 7.5,
                "constraints": {"max_daily_mg": 4000},
            },
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert data["within_safety_limits"] is True


@pytest.mark.anyio
async def test_dosage_latex_output():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/dosage",
            json={
                "herb_name": "turmeric",
                "body_weight_kg": 70,
                "dose_per_kg_mg": 10,
            },
            headers=HEADERS,
        )
    assert response.status_code == 200
    data = response.json()
    assert "\\text{mg}" in data["latex"]


@pytest.mark.anyio
async def test_dosage_missing_api_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/dosage",
            json={
                "herb_name": "ginger",
                "body_weight_kg": 65,
                "dose_per_kg_mg": 7.5,
            },
        )
    assert response.status_code == 401
