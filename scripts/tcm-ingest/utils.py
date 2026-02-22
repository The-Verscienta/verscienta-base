"""
Utility functions for TCM data ingestion.
"""

import csv
import json
import logging
import os
import time
from datetime import datetime, timezone

logger = logging.getLogger("tcm-ingest")


def setup_logging(name: str = "tcm-ingest", log_dir: str | None = None) -> logging.Logger:
    """Configure logging with console + file output."""
    log = logging.getLogger(name)
    log.setLevel(logging.DEBUG)

    # Console handler
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter("%(asctime)s %(levelname)-8s %(message)s", "%H:%M:%S"))
    log.addHandler(console)

    # File handler
    if log_dir is None:
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    file_handler = logging.FileHandler(os.path.join(log_dir, f"{name}_{timestamp}.log"))
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)-8s %(name)s %(message)s")
    )
    log.addHandler(file_handler)

    return log


def read_csv(filepath: str, encoding: str = "utf-8") -> list[dict]:
    """Read a CSV file and return list of dicts."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"CSV not found: {filepath}")

    rows = []
    with open(filepath, "r", encoding=encoding, errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def safe_int(value: str | None) -> int | None:
    """Parse string to int, returning None on failure."""
    if not value or not value.strip():
        return None
    try:
        return int(float(value.strip()))
    except (ValueError, TypeError):
        return None


def safe_float(value: str | None) -> float | None:
    """Parse string to float, returning None on failure."""
    if not value or not value.strip():
        return None
    try:
        return float(value.strip())
    except (ValueError, TypeError):
        return None


def safe_str(value: str | None, max_length: int = 255) -> str | None:
    """Clean and truncate a string value."""
    if not value or not value.strip():
        return None
    cleaned = value.strip()
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned


class RateLimiter:
    """Simple rate limiter using token bucket."""

    def __init__(self, requests_per_second: float):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0.0

    def wait(self):
        """Block until enough time has passed since last request."""
        now = time.monotonic()
        elapsed = now - self.last_request
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request = time.monotonic()


class IngestStats:
    """Track ingestion statistics."""

    def __init__(self):
        self.processed = 0
        self.created = 0
        self.updated = 0
        self.skipped = 0
        self.errors: list[str] = []
        self.start_time = time.monotonic()

    @property
    def duration_seconds(self) -> float:
        return time.monotonic() - self.start_time

    def to_dict(self) -> dict:
        return {
            "records_processed": self.processed,
            "records_created": self.created,
            "records_updated": self.updated,
            "records_skipped": self.skipped,
            "errors": self.errors[-100:],  # Keep last 100 errors
            "duration_seconds": round(self.duration_seconds, 2),
        }

    def log_summary(self, log: logging.Logger):
        log.info(
            "Ingestion complete: %d processed, %d created, %d updated, %d skipped, %d errors in %.1fs",
            self.processed,
            self.created,
            self.updated,
            self.skipped,
            len(self.errors),
            self.duration_seconds,
        )
