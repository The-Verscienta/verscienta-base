# Verscienta Health - Setup Guide

## Current Status

### ✅ Completed
- Project structure created
- Docker Compose configured (PostgreSQL 17.5 + Redis 7)
- Frontend dependencies installed (Next.js 15 + next-drupal 2.0)
- Backend dependencies partially installed (Drupal 11.2.4)
- Docker services running

### ⚠️ Known Issues
- Drupal core extraction timing out in Docker on Windows (Docker Desktop file I/O performance)

## Quick Start Options

### Option 1: Use DDEV (Recommended for Windows)

DDEV handles Docker performance issues better on Windows:

```bash
# Install DDEV if not already installed
# https://ddev.readthedocs.io/en/stable/

cd backend
ddev config --project-type=drupal --docroot=web --php-version=8.2
ddev start
ddev composer install
ddev drush site:install standard --account-name=admin --account-pass=admin123 -y
```

### Option 2: Use WSL2 (Windows Subsystem for Linux)

Move the project to WSL2 for better Docker performance:

```bash
# In WSL2 terminal
cd /mnt/c/Users/pf1/OneDrive/Documents/GitHub/verscienta-drupal
docker-compose down
docker-compose up -d postgres redis
docker-compose exec drupal composer install
docker-compose exec drupal drush site:install --db-url=pgsql://drupal_user:drupal_password@postgres:5432/verscienta_health -y
```

### Option 3: Complete Installation Manually

If Docker continues to have issues:

```bash
# Install PHP 8.2, Composer, and PostgreSQL locally
cd backend
composer install
php -S localhost:8080 -t web
```

## Next Steps After Drupal Installation

1. **Enable Core Modules:**
   ```bash
   drush en jsonapi rest serialization content_translation locale -y
   ```

2. **Enable Contrib Modules:**
   ```bash
   drush en search_api webform pathauto metatag json_field jsonapi_extras redis conditional_fields field_group token admin_toolbar -y
   ```

3. **Create Custom Module:**
   ```bash
   cd web/modules/custom
   mkdir -p holistic_hub/src
   ```

4. **Create Content Types** (see TIMELINE.md for details):
   - Herbs
   - Modalities
   - Conditions
   - Practitioners
   - Symptoms
   - Reviews
   - Grok Insights

5. **Integrate Plasmic Page Builder:**
   ```bash
   cd ../../frontend
   npm install @plasmicapp/loader-nextjs @plasmicapp/cli
   ```

## Development Workflow

### Start Services
```bash
# Backend
docker-compose up -d

# Frontend
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend (Drupal)**: http://localhost:8080
- **Drupal Admin**: http://localhost:8080/user/login (admin / admin123)

## Environment Variables

Create `.env` file in the root:

```env
# Database
POSTGRES_DB=verscienta_health
POSTGRES_USER=drupal_user
POSTGRES_PASSWORD=drupal_password

# Drupal
DRUPAL_DATABASE_HOST=postgres
DRUPAL_DATABASE_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# xAI API (Get from https://x.ai/api)
XAI_API_KEY=your_key_here

# Plasmic
PLASMIC_PROJECT_ID=your-plasmic-project-id
PLASMIC_PROJECT_API_TOKEN=your-plasmic-api-token
```


## Troubleshooting

### Composer Timeouts
Increase timeout: `export COMPOSER_PROCESS_TIMEOUT=900`

### Docker Performance
- Use DDEV or move to WSL2
- Or disable Docker Desktop's file sharing for better performance

### Port Conflicts
```bash
# Check if ports are in use
netstat -ano | findstr :5432
netstat -ano | findstr :6379
netstat -ano | findstr :8080
```

## Additional Resources

- [Drupal 11 Documentation](https://www.drupal.org/docs/11)
- [Next.js Documentation](https://nextjs.org/docs)
- [next-drupal Documentation](https://next-drupal.org/)
- [Plasmic Documentation](https://docs.plasmic.app/)
- [Project Timeline](./TIMELINE.md)
