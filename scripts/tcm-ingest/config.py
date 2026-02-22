"""
Configuration for TCM data ingestion.

Reads settings from environment variables or .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Drupal connection
DRUPAL_BASE_URL = os.getenv("DRUPAL_BASE_URL", "https://backend.ddev.site")
DRUPAL_AUTH_USER = os.getenv("DRUPAL_AUTH_USER", "admin")
DRUPAL_AUTH_PASS = os.getenv("DRUPAL_AUTH_PASS", "admin")
DRUPAL_AUTH_TOKEN = os.getenv("DRUPAL_AUTH_TOKEN", "")

# Ingestion settings
BATCH_SIZE = int(os.getenv("INGEST_BATCH_SIZE", "50"))
REQUESTS_PER_SECOND = float(os.getenv("INGEST_RATE_LIMIT", "5"))
DRY_RUN = os.getenv("INGEST_DRY_RUN", "false").lower() == "true"

# PubChem
PUBCHEM_RATE_LIMIT = float(os.getenv("PUBCHEM_RATE_LIMIT", "5"))

# Data directory (relative to this script)
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
