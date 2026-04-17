# Verscienta Health — Directus Backend

Directus 11 headless CMS backend, deployed to Coolify.

## Quick Start

```bash
cp .env.example .env   # Edit with your secrets
docker compose up -d   # Start Directus + MariaDB + Redis + MeiliSearch
npm install            # Install SDK for scripts
npm run setup          # Create schema + seed taxonomies + setup search
```

## Architecture

- **CMS:** Directus 11 with MySQL (MariaDB 11)
- **Cache:** Redis 7 (sessions, cache, rate limiting)
- **Search:** MeiliSearch v1.12 (replaces Algolia)
- **Extensions:** MeiliSearch auto-sync hook, geocoding hook

## Schema

9 primary collections, 12 O2M child collections (paragraph replacements), 2 taxonomy collections, 13 M2M junctions. See `docs/DIRECTUS-SCHEMA-DESIGN.md` for full specification.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run schema:create` | Create all collections and fields |
| `npm run seed:taxonomies` | Populate herb_tags + tcm_categories |
| `npm run search:setup` | Create MeiliSearch indices |
| `npm run search:sync` | Bulk sync all content to MeiliSearch |
| `npm run setup` | Run all of the above |

## Extensions

- `extensions/hooks/meilisearch-sync/` — Auto-sync to MeiliSearch on CRUD
- `extensions/hooks/geocoding/` — Auto-geocode practitioners via Nominatim
