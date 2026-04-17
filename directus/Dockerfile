FROM directus/directus:11

# Copy schema snapshots for reproducible deployments
COPY ./snapshots /directus/snapshots

# Copy custom extensions (MeiliSearch sync hook, etc.)
COPY ./extensions /directus/extensions

# The base image handles everything else:
# - Node.js runtime
# - Directus application
# - Database migrations on startup
# - Admin UI

EXPOSE 8055
