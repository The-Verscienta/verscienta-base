FROM directus/directus:11

# Copy schema snapshots for reproducible deployments
COPY ./snapshots /directus/snapshots

# Copy custom extensions (hooks: meilisearch-sync, geocoding, plant-sync, cloudflare-offload)
COPY ./extensions /directus/extensions

# Install extension dependencies
RUN find /directus/extensions -name "package.json" -not -path "*/node_modules/*" -exec sh -c 'cd "$(dirname "$1")" && if grep -q "dependencies" package.json; then npm install --omit=dev; fi' _ {} \;

# The base image handles everything else:
# - Node.js runtime
# - Directus application
# - Database migrations on startup
# - Admin UI

EXPOSE 8055
