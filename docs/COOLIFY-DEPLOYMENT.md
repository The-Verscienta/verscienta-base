# Coolify Deployment Guide

Complete step-by-step instructions for deploying Verscienta Health (Next.js frontend + Drupal backend) to Coolify.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Create Dockerfiles](#create-dockerfiles)
4. [Coolify Setup](#coolify-setup)
5. [Deploy MySQL/MariaDB Database](#deploy-mysqlmariadb-database)
6. [Deploy Redis](#deploy-redis)
7. [Deploy Drupal Backend](#deploy-drupal-backend)
8. [Deploy Next.js Frontend](#deploy-nextjs-frontend)
9. [Configure Environment Variables](#configure-environment-variables)
10. [Post-Deployment Configuration](#post-deployment-configuration)
11. [SSL/HTTPS Configuration](#sslhttps-configuration)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Coolify instance running (self-hosted or cloud)
- [ ] Domain names configured (e.g., `api.verscienta.com`, `verscienta.com`)
- [ ] GitHub repository access configured in Coolify
- [ ] Basic understanding of Docker and environment variables

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         COOLIFY                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│   │   Frontend   │    │   Backend    │    │   Database   │ │
│   │   (Next.js)  │───▶│   (Drupal)   │───▶│  (MariaDB)   │ │
│   │   Port 3000  │    │   Port 80    │    │  Port 3306   │ │
│   └──────────────┘    └──────────────┘    └──────────────┘ │
│          │                   │                              │
│          │                   ▼                              │
│          │            ┌──────────────┐                     │
│          │            │    Redis     │                     │
│          │            │  Port 6379   │                     │
│          │            └──────────────┘                     │
│          │                                                  │
│          ▼                                                  │
│   ┌──────────────┐                                         │
│   │   Grok AI    │ (External API)                          │
│   └──────────────┘                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Services to deploy:**
1. MariaDB 11 (Database)
2. Redis 7 (Cache/Session)
3. Drupal 11 (Backend API)
4. Next.js 15 (Frontend)

---

## Create Dockerfiles

### Step 1: Create Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
# backend/Dockerfile
FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    default-mysql-client \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_mysql mysqli mbstring exif pcntl bcmath gd zip opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Enable Apache modules
RUN a2enmod rewrite headers

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy application code
COPY . .

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/web/sites/default

# Create files directory with proper permissions
RUN mkdir -p /var/www/html/web/sites/default/files \
    && chown -R www-data:www-data /var/www/html/web/sites/default/files \
    && chmod -R 775 /var/www/html/web/sites/default/files

# Apache configuration
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html/web\n\
    <Directory /var/www/html/web>\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# PHP configuration for production
RUN echo 'memory_limit = 512M\n\
upload_max_filesize = 64M\n\
post_max_size = 64M\n\
max_execution_time = 300\n\
opcache.enable=1\n\
opcache.memory_consumption=256\n\
opcache.max_accelerated_files=20000\n\
opcache.validate_timestamps=0' > /usr/local/etc/php/conf.d/drupal.ini

EXPOSE 80

CMD ["apache2-foreground"]
```

### Step 2: Create Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# frontend/Dockerfile

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production=false

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_DRUPAL_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY

ENV NEXT_PUBLIC_DRUPAL_BASE_URL=$NEXT_PUBLIC_DRUPAL_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Step 3: Update Next.js Config for Standalone Output

Update `frontend/next.config.ts` to enable standalone output:

```typescript
// Add this to your nextConfig object:
output: 'standalone',
```

---

## Coolify Setup

### Step 4: Access Coolify Dashboard

1. Log into your Coolify dashboard
2. Navigate to **Projects**
3. Click **+ New Project**
4. Name it: `Verscienta Health`

### Step 5: Create Environment

1. Inside the project, click **+ New Environment**
2. Name it: `Production` (or `Staging`)

---

## Deploy MySQL/MariaDB Database

### Step 6: Add MariaDB Service

1. In your environment, click **+ New Resource**
2. Select **Database** → **MariaDB** (or MySQL)
3. Configure:
   - **Name:** `verscienta-mariadb`
   - **Version:** `11` (or `lts` for MySQL)
   - **Database Name:** `verscienta_health`
   - **Username:** `drupal_user`
   - **Password:** Generate a secure password (save it!)

4. Click **Deploy**

5. Note the **Internal URL** (e.g., `verscienta-mariadb:3306`)

---

## Deploy Redis

### Step 7: Add Redis Service

1. Click **+ New Resource**
2. Select **Database** → **Redis**
3. Configure:
   - **Name:** `verscienta-redis`
   - **Version:** `7-alpine`

4. Click **Deploy**

5. Note the **Internal URL** (e.g., `verscienta-redis:6379`)

---

## Deploy Drupal Backend

### Step 8: Add Drupal Application

1. Click **+ New Resource**
2. Select **Application** → **Dockerfile**
3. Configure:
   - **Name:** `verscienta-backend`
   - **Repository:** Your GitHub repo URL
   - **Branch:** `main`
   - **Build Pack:** Dockerfile
   - **Dockerfile Location:** `backend/Dockerfile`
   - **Base Directory:** `backend`

4. Set **Domain:** `api.verscienta.com` (or your backend domain)

5. Configure **Environment Variables** (see [Configure Environment Variables](#configure-environment-variables))

6. Click **Deploy**

### Step 9: Initialize Drupal Database

After first deployment, you need to initialize Drupal:

1. Go to the backend service in Coolify
2. Click **Terminal** or **Execute Command**
3. Run:

```bash
# Install Drupal
cd /var/www/html
./vendor/bin/drush site:install standard \
  --site-name="Verscienta Health" \
  --account-name=admin \
  --account-pass=CHANGE_THIS_PASSWORD \
  --db-url=mysql://drupal_user:YOUR_DB_PASSWORD@verscienta-mariadb:3306/verscienta_health \
  -y

# Enable required modules
./vendor/bin/drush en jsonapi jsonapi_extras simple_oauth paragraphs field_group -y

# Clear cache
./vendor/bin/drush cr

# Generate one-time login link
./vendor/bin/drush uli
```

---

## Deploy Next.js Frontend

### Step 10: Add Frontend Application

1. Click **+ New Resource**
2. Select **Application** → **Dockerfile**
3. Configure:
   - **Name:** `verscienta-frontend`
   - **Repository:** Your GitHub repo URL
   - **Branch:** `main`
   - **Build Pack:** Dockerfile
   - **Dockerfile Location:** `frontend/Dockerfile`
   - **Base Directory:** `frontend`

4. Set **Domain:** `verscienta.com` (or your frontend domain)

5. Configure **Build Arguments:**
   ```
   NEXT_PUBLIC_DRUPAL_BASE_URL=https://api.verscienta.com
   NEXT_PUBLIC_SITE_URL=https://verscienta.com
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
   ```

6. Configure **Environment Variables** (see below)

7. Click **Deploy**

---

## Configure Environment Variables

### Backend Environment Variables

Set these in Coolify for the Drupal backend:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `DRUPAL_DATABASE_HOST` | `verscienta-mariadb` | MariaDB service name |
| `DRUPAL_DATABASE_PORT` | `3306` | Database port |
| `DRUPAL_DATABASE_NAME` | `verscienta_health` | Database name |
| `DRUPAL_DATABASE_USER` | `drupal_user` | Database username |
| `DRUPAL_DATABASE_PASSWORD` | `your-secure-password` | Database password |
| `DRUPAL_HASH_SALT` | `generate-64-char-random` | Drupal hash salt |
| `REDIS_HOST` | `verscienta-redis` | Redis service name |
| `REDIS_PORT` | `6379` | Redis port |
| `TRUSTED_HOST_PATTERNS` | `^api\.verscienta\.com$` | Allowed hosts |

**Generate Hash Salt:**
```bash
openssl rand -hex 32
```

### Frontend Environment Variables

Set these in Coolify for the Next.js frontend:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `DRUPAL_BASE_URL` | `https://api.verscienta.com` | Backend API URL |
| `DRUPAL_CLIENT_ID` | `your-oauth-client-id` | OAuth client ID |
| `DRUPAL_CLIENT_SECRET` | `your-oauth-client-secret` | OAuth client secret |
| `NEXTAUTH_URL` | `https://verscienta.com` | Frontend URL |
| `NEXTAUTH_SECRET` | `generate-random-secret` | NextAuth secret |
| `XAI_API_KEY` | `your-xai-api-key` | Grok AI API key |
| `TURNSTILE_SECRET_KEY` | `your-turnstile-secret` | Cloudflare Turnstile |
| `REDIS_URL` | `redis://verscienta-redis:6379` | Redis connection |

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
```

---

## Post-Deployment Configuration

### Step 11: Configure Drupal Settings

1. Access your Drupal admin: `https://api.verscienta.com/admin`
2. Log in with the credentials from Step 9

#### Configure CORS

Create/edit `web/sites/default/services.yml`:

```yaml
parameters:
  cors.config:
    enabled: true
    allowedHeaders: ['*']
    allowedMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
    allowedOrigins: ['https://verscienta.com']
    exposedHeaders: false
    maxAge: 3600
    supportsCredentials: true
```

#### Configure OAuth

1. Go to **Configuration** → **Simple OAuth**
2. Create a new OAuth client:
   - **Label:** `Verscienta Frontend`
   - **Client ID:** Copy this for frontend env
   - **New Secret:** Generate and copy for frontend env
   - **Scopes:** Select appropriate scopes
3. Save

#### Configure Trusted Hosts

Edit `web/sites/default/settings.php`:

```php
$settings['trusted_host_patterns'] = [
  '^api\.verscienta\.com$',
  '^localhost$',
];
```

### Step 12: Run Drupal Setup Script

If you have the setup script, run it to create content types:

```bash
# In Coolify terminal for backend
cd /var/www/html
./setup-drupal.sh
```

Or manually enable modules and create content types through the Drupal admin UI.

---

## SSL/HTTPS Configuration

### Step 13: Configure SSL in Coolify

Coolify handles SSL automatically with Let's Encrypt:

1. Go to each service's **Settings**
2. Ensure **Domain** is set correctly
3. Enable **Generate SSL Certificate**
4. Coolify will automatically provision Let's Encrypt certificates

### Force HTTPS Redirects

This is handled automatically by Coolify's proxy.

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms:** Drupal can't connect to MariaDB

**Solution:**
```bash
# Check if MariaDB is running
# In Coolify, check the mariadb service status

# Verify connection string
./vendor/bin/drush sql:cli

# Check environment variables
env | grep DRUPAL_DATABASE
```

#### 2. CORS Errors

**Symptoms:** Frontend gets CORS errors when calling backend

**Solution:**
1. Verify `services.yml` has correct CORS config
2. Ensure `allowedOrigins` includes your frontend domain
3. Clear Drupal cache: `drush cr`

#### 3. File Upload Issues

**Symptoms:** Can't upload files in Drupal

**Solution:**
```bash
# Fix permissions
chown -R www-data:www-data /var/www/html/web/sites/default/files
chmod -R 775 /var/www/html/web/sites/default/files
```

#### 4. Frontend Build Fails

**Symptoms:** Next.js build fails in Coolify

**Solution:**
1. Check build logs in Coolify
2. Verify all required environment variables are set
3. Ensure `next.config.ts` has `output: 'standalone'`

#### 5. OAuth Not Working

**Symptoms:** Login/registration fails

**Solution:**
1. Verify OAuth client credentials match between Drupal and frontend
2. Check Simple OAuth module is enabled
3. Verify CORS allows credentials

### Useful Commands

```bash
# Backend (Drupal)
drush cr                    # Clear cache
drush status               # Check status
drush uli                  # Generate login link
drush watchdog:show        # View logs

# Check logs in Coolify
# Go to service → Logs

# Restart service
# In Coolify, use the Restart button
```

### Health Checks

Add health check endpoints:

**Backend:** `https://api.verscienta.com/jsonapi`
**Frontend:** `https://verscienta.com/api/health` (create this endpoint)

---

## Deployment Checklist

### Pre-Deployment

- [ ] Dockerfiles created and tested locally
- [ ] Environment variables documented
- [ ] Domain DNS configured
- [ ] SSL certificates ready (Coolify handles this)

### Deployment

- [ ] MariaDB deployed and accessible
- [ ] Redis deployed and accessible
- [ ] Backend deployed and Drupal installed
- [ ] Frontend deployed and building successfully
- [ ] Environment variables set for all services

### Post-Deployment

- [ ] CORS configured correctly
- [ ] OAuth client created and configured
- [ ] Trusted hosts configured
- [ ] Content types created
- [ ] Test API endpoints
- [ ] Test frontend pages
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Monitor logs for errors

---

## Backup Strategy

### Database Backups

Coolify can schedule automatic backups:

1. Go to MariaDB service → **Backups**
2. Enable **Scheduled Backups**
3. Set frequency (daily recommended)
4. Configure S3 or local storage

### Manual Backup

```bash
# Export database
mysqldump -h verscienta-mariadb -u drupal_user -p verscienta_health > backup.sql

# Export Drupal files
tar -czf files-backup.tar.gz /var/www/html/web/sites/default/files
```

---

## Scaling

### Horizontal Scaling

Coolify supports scaling:

1. Go to service → **Settings**
2. Increase **Replicas** for stateless services (frontend)
3. Use load balancer (handled by Coolify)

**Note:** Drupal backend requires shared file storage for multiple replicas.

### Resource Limits

Set in Coolify for each service:

- **Frontend:** 512MB RAM, 0.5 CPU
- **Backend:** 1GB RAM, 1 CPU
- **MariaDB:** 1GB RAM, 1 CPU
- **Redis:** 256MB RAM, 0.25 CPU

---

## Updates & Maintenance

### Updating Applications

1. Push changes to GitHub
2. In Coolify, click **Redeploy** for the service
3. Or enable **Auto Deploy** for automatic deployments on push

### Drupal Updates

```bash
# SSH into backend container
composer update drupal/core --with-dependencies
drush updatedb
drush cr
```

---

**Last Updated:** February 2026
**Coolify Version:** 4.x
**Tested With:** Drupal 11.x, Next.js 15.x
