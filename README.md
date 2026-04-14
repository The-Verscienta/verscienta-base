# Verscienta Drupal

Monorepo for Verscienta Health: Drupal 11 backend and Next.js frontend.

## Documentation

Project documentation (setup, deployment, design system, roadmap, audits) lives in **[`docs/`](./docs/)**. Start with **[`docs/README.md`](./docs/README.md)**.

### Quick links

- [Setup guide](docs/SETUP.md)
- [Development setup](docs/DEVELOPMENT-SETUP-GUIDE.md)
- [TODO / roadmap](docs/TODO.md)
- [FIXME audit](docs/FIXME.md)
- [Project overview (PDF)](docs/Project%20Overview.pdf)

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | Drupal CMS (`web/`, Composer, DDEV) |
| `frontend/` | Next.js app |
| `scripts/` | Automation (e.g. TCM ingest — see `docs/scripts/tcm-ingest/README.md`) |
| `docs/` | Markdown and PDF documentation |
| `services/` | Supporting services (e.g. SymPy compute) |
