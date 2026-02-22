"""
Drupal JSON:API client for TCM data ingestion.

Handles authentication, CRUD operations, and entity search.
"""

import logging
from typing import Any

import httpx

from config import (
    DRUPAL_AUTH_PASS,
    DRUPAL_AUTH_TOKEN,
    DRUPAL_AUTH_USER,
    DRUPAL_BASE_URL,
    DRY_RUN,
    REQUESTS_PER_SECOND,
)
from utils import RateLimiter

logger = logging.getLogger("tcm-ingest")

JSONAPI_CONTENT_TYPE = "application/vnd.api+json"


class DrupalClient:
    """JSON:API client for Drupal."""

    def __init__(self, base_url: str | None = None, dry_run: bool | None = None):
        self.base_url = (base_url or DRUPAL_BASE_URL).rstrip("/")
        self.dry_run = dry_run if dry_run is not None else DRY_RUN
        self.rate_limiter = RateLimiter(REQUESTS_PER_SECOND)

        # Build auth headers
        self.headers: dict[str, str] = {
            "Accept": JSONAPI_CONTENT_TYPE,
            "Content-Type": JSONAPI_CONTENT_TYPE,
        }
        if DRUPAL_AUTH_TOKEN:
            self.headers["Authorization"] = f"Bearer {DRUPAL_AUTH_TOKEN}"

        # Build httpx client
        auth = None
        if not DRUPAL_AUTH_TOKEN and DRUPAL_AUTH_USER:
            auth = httpx.BasicAuth(DRUPAL_AUTH_USER, DRUPAL_AUTH_PASS)

        self.client = httpx.Client(
            base_url=self.base_url,
            headers=self.headers,
            auth=auth,
            timeout=30.0,
            verify=False,  # DDEV uses self-signed certs
        )

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def _jsonapi_url(self, bundle: str) -> str:
        """Build JSON:API endpoint URL for a node bundle."""
        return f"/jsonapi/node/{bundle}"

    def search(
        self,
        bundle: str,
        filters: dict[str, Any],
        page_limit: int = 1,
    ) -> list[dict]:
        """
        Search for nodes by field values.

        Args:
            bundle: Content type machine name (e.g. 'herb')
            filters: Dict of field_name -> value to filter by
            page_limit: Max results to return

        Returns:
            List of JSON:API resource objects
        """
        self.rate_limiter.wait()

        url = self._jsonapi_url(bundle)
        params: dict[str, str] = {f"filter[{k}]": str(v) for k, v in filters.items()}
        params["page[limit]"] = str(page_limit)

        resp = self.client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])

    def find_by_field(self, bundle: str, field_name: str, value: Any) -> dict | None:
        """Find a single node by a unique field value. Returns None if not found."""
        results = self.search(bundle, {field_name: value}, page_limit=1)
        return results[0] if results else None

    def create(self, bundle: str, attributes: dict[str, Any], relationships: dict[str, Any] | None = None) -> dict | None:
        """
        Create a new node.

        Args:
            bundle: Content type machine name
            attributes: Field values (title, field_xxx, etc.)
            relationships: Entity reference relationships

        Returns:
            Created resource object, or None in dry-run mode
        """
        if self.dry_run:
            logger.debug("[DRY RUN] Would create %s: %s", bundle, attributes.get("title", ""))
            return None

        self.rate_limiter.wait()

        payload: dict[str, Any] = {
            "data": {
                "type": f"node--{bundle}",
                "attributes": attributes,
            }
        }
        if relationships:
            payload["data"]["relationships"] = relationships

        url = self._jsonapi_url(bundle)
        resp = self.client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json().get("data")

    def update(self, bundle: str, node_id: str, attributes: dict[str, Any], relationships: dict[str, Any] | None = None) -> dict | None:
        """
        Update (PATCH) an existing node.

        Args:
            bundle: Content type machine name
            node_id: UUID of the node
            attributes: Fields to update
            relationships: Entity references to update

        Returns:
            Updated resource object, or None in dry-run mode
        """
        if self.dry_run:
            logger.debug("[DRY RUN] Would update %s/%s", bundle, node_id)
            return None

        self.rate_limiter.wait()

        payload: dict[str, Any] = {
            "data": {
                "type": f"node--{bundle}",
                "id": node_id,
                "attributes": attributes,
            }
        }
        if relationships:
            payload["data"]["relationships"] = relationships

        url = f"{self._jsonapi_url(bundle)}/{node_id}"
        resp = self.client.patch(url, json=payload)
        resp.raise_for_status()
        return resp.json().get("data")

    def upsert(
        self,
        bundle: str,
        dedup_field: str,
        dedup_value: Any,
        attributes: dict[str, Any],
        relationships: dict[str, Any] | None = None,
    ) -> tuple[dict | None, str]:
        """
        Create or update a node based on a dedup field.

        Returns:
            (node_data, action) where action is 'created', 'updated', or 'skipped'
        """
        existing = self.find_by_field(bundle, dedup_field, dedup_value)

        if existing:
            node_id = existing["id"]
            result = self.update(bundle, node_id, attributes, relationships)
            return result or existing, "updated"
        else:
            result = self.create(bundle, attributes, relationships)
            return result, "created"

    def create_import_log(
        self,
        source_db: str,
        records_processed: int,
        records_created: int,
        records_updated: int,
        records_skipped: int,
        errors: str,
        duration_seconds: float,
    ) -> dict | None:
        """Create an import_log node to record an ingestion run."""
        from datetime import datetime, timezone

        title = f"{source_db} - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"
        return self.create(
            "import_log",
            {
                "title": title,
                "field_source_db": source_db,
                "field_records_processed": records_processed,
                "field_records_created": records_created,
                "field_records_updated": records_updated,
                "field_records_skipped": records_skipped,
                "field_errors": {"value": errors[:10000], "format": "plain_text"},
                "field_duration_seconds": round(duration_seconds, 2),
            },
        )

    def build_relationship(self, field_name: str, bundle: str, node_id: str) -> dict:
        """Build a single entity reference relationship."""
        return {
            field_name: {
                "data": {
                    "type": f"node--{bundle}",
                    "id": node_id,
                }
            }
        }

    def build_multi_relationship(self, field_name: str, bundle: str, node_ids: list[str]) -> dict:
        """Build a multi-value entity reference relationship."""
        return {
            field_name: {
                "data": [
                    {"type": f"node--{bundle}", "id": nid}
                    for nid in node_ids
                ]
            }
        }
