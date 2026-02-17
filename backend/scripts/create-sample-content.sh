#!/bin/bash

# ============================================================================
# Verscienta Health - Sample Content Creation
# ============================================================================
# This script creates sample content for testing and development.
# Run this AFTER running the Drupal setup (setup-drupal.sh or complete-setup.sh).
#
# Usage (from project root):
#   ddev exec "cd /var/www/html/backend && drush php:script scripts/create-sample-content.php"
#
# Or if Drupal root is project root:
#   ddev drush php:script backend/scripts/create-sample-content.php
#
# Alternative - run this script which handles the path:
#   ./backend/scripts/create-sample-content.sh
# ============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}==============================================${NC}"
echo "Creating Sample Content for Verscienta Health"
echo -e "${BLUE}==============================================${NC}"
echo ""

# Determine script directory - we are in backend/scripts/
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$BACKEND_DIR")"

# Prefer DDEV if available (typical local development)
if command -v ddev &> /dev/null; then
  echo -e "${BLUE}Running via DDEV...${NC}"
  # Find DDEV project root (directory containing .ddev)
  DDEV_ROOT="$PROJECT_ROOT"
  for dir in "$PROJECT_ROOT" "$BACKEND_DIR" "$(pwd)"; do
    if [ -d "$dir/.ddev" ]; then
      DDEV_ROOT="$dir"
      break
    fi
  done
  cd "$DDEV_ROOT" 2>/dev/null || true
  if ddev describe &>/dev/null; then
    # /var/www/html = DDEV project root (usually backend/ which contains web/)
    ddev exec "cd /var/www/html && drush php:script scripts/create-sample-content.php"
  else
    echo -e "${YELLOW}DDEV not started. Run 'ddev start' from project root first.${NC}"
    echo "Or run manually: ddev exec \"cd /var/www/html && drush php:script scripts/create-sample-content.php\""
    exit 1
  fi
elif [ -f "$BACKEND_DIR/web/index.php" ]; then
  cd "$BACKEND_DIR"
  echo -e "${BLUE}Running drush directly...${NC}"
  drush php:script scripts/create-sample-content.php
else
  echo -e "${RED}Error: Cannot find Drupal. Run from project root:${NC}"
  echo "  ddev exec \"cd /var/www/html && drush php:script scripts/create-sample-content.php\""
  exit 1
fi

echo ""
echo -e "${GREEN}==============================================${NC}"
echo "Sample content creation finished."
echo -e "${GREEN}==============================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review content: https://backend.ddev.site/admin/content"
echo "  2. Test JSON:API: curl -k https://backend.ddev.site/jsonapi/node/herb"
echo "  3. View in frontend: http://localhost:3000/herbs"
echo ""
