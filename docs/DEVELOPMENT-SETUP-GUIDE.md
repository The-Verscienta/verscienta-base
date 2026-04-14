# Verscienta Health - Development Setup Guide

This guide will help you get the Drupal backend and Next.js frontend running locally.

## Current Error: "fetch failed"

The error you're seeing means the Next.js frontend (`http://localhost:3000`) cannot connect to the Drupal backend (`https://backend.ddev.site`).

## Prerequisites

- [DDEV](https://ddev.readthedocs.io/) installed
- Node.js 18+ installed
- Composer installed

## Quick Start

### 1. Start Drupal Backend (DDEV)

```bash
# Navigate to project root
cd /home/pf1/verscienta-drupal

# Start DDEV
ddev start

# Check DDEV status
ddev describe

# You should see URLs like:
# - https://backend.ddev.site
# - https://127.0.0.1:port
```

**Important:** DDEV should create the Drupal site at `https://backend.ddev.site`. If this URL doesn't work, check:

```bash
# Check if DDEV is running
ddev status

# Restart DDEV if needed
ddev restart
```

### 2. Install Drupal (if not already installed)

```bash
# SSH into DDEV container
ddev ssh

# Check if Drupal is installed
drush status

# If not installed, install Drupal
drush site:install standard \
  --site-name="Verscienta Health Backend" \
  --account-name=admin \
  --account-pass=admin \
  --db-url=mysql://db:db@db/db \
  -y

# Exit DDEV SSH
exit
```

### 3. Enable Required Drupal Modules

```bash
ddev ssh

# Enable JSON:API and other required modules
drush en jsonapi -y
drush en jsonapi_resources -y
drush en serialization -y
drush en rest -y
drush en cors -y

# Clear cache
drush cr

exit
```

### 4. Configure CORS (Critical for Frontend Connection)

**Option A: Via Drupal UI**

1. Go to `https://backend.ddev.site/admin/config/services/cors`
2. Add domain: `http://localhost:3000`
3. Check: `Enabled`, `Allow credentials`
4. Save configuration

**Option B: Via services.yml**

```bash
# Edit the services file
ddev ssh
cd /var/www/html

# Create or edit sites/default/services.yml
cat > web/sites/default/services.yml << 'EOF'
parameters:
  cors.config:
    enabled: true
    allowedHeaders: ['*']
    allowedMethods: ['*']
    allowedOrigins: ['http://localhost:3000', 'https://backend.ddev.site']
    exposedHeaders: false
    maxAge: 1000
    supportsCredentials: true
EOF

# Clear cache
drush cr
exit
```

### 5. Verify Backend is Accessible

Test these URLs in your browser:

```bash
# Main site
https://backend.ddev.site

# JSON:API endpoint
https://backend.ddev.site/jsonapi

# Check specific content type (should return JSON)
https://backend.ddev.site/jsonapi/node/modality
```

If you get SSL certificate warnings, that's normal for DDEV - click "Advanced" and proceed.

### 6. Start Next.js Frontend

```bash
# Navigate to frontend directory
cd /home/pf1/verscienta-drupal/frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The frontend should start at `http://localhost:3000`.

### 7. Test the Connection

```bash
# Test from command line
curl -k https://backend.ddev.site/jsonapi/node/modality

# Or test in browser
# Visit: http://localhost:3000/modalities
```

## Common Issues & Solutions

### Issue 1: "fetch failed" or "ECONNREFUSED"

**Cause:** Drupal backend is not running or CORS is not configured.

**Solution:**

```bash
# Check DDEV status
ddev status

# If not running
ddev start

# Test backend directly
curl -k https://backend.ddev.site/jsonapi

# Enable CORS module
ddev ssh
drush en cors -y
drush cr
exit
```

### Issue 2: SSL Certificate Errors

**Cause:** DDEV uses self-signed certificates.

**Solution:** The `drupal.ts` client is already configured to work with this. If issues persist:

```typescript
// In frontend/lib/drupal.ts, add:
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Only for development!
```

### Issue 3: "404 Not Found" on JSON:API

**Cause:** JSON:API module not enabled or content type doesn't exist.

**Solution:**

```bash
ddev ssh

# Enable JSON:API
drush en jsonapi jsonapi_resources -y

# Check if content types exist
drush eval "print_r(array_keys(\Drupal::service('entity_type.bundle.info')->getBundleInfo('node')));"

# Clear cache
drush cr
exit
```

### Issue 4: Empty Data Returned

**Cause:** No content exists in Drupal yet.

**Solution:** The frontend will show "No items found" messages. This is expected - you need to create content in Drupal:

1. Go to `https://backend.ddev.site/admin`
2. Login (admin/admin if you just installed)
3. Navigate to **Content > Add content**
4. Create sample herbs, modalities, etc.

### Issue 5: CORS Errors in Browser Console

**Error:** `Access to fetch at 'https://backend.ddev.site' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**

```bash
# Install CORS module
ddev ssh
drush en cors -y

# Configure CORS (see Step 4 above)
# Then clear cache
drush cr
exit
```

## Development Workflow

### Daily Workflow

```bash
# 1. Start Drupal
cd /home/pf1/verscienta-drupal
ddev start

# 2. Start Next.js (in a new terminal)
cd /home/pf1/verscienta-drupal/frontend
npm run dev

# 3. Access the sites:
# - Frontend: http://localhost:3000
# - Backend: https://backend.ddev.site
# - Backend Admin: https://backend.ddev.site/admin
```

### Stopping Services

```bash
# Stop Next.js: Press Ctrl+C in the terminal

# Stop DDEV
cd /home/pf1/verscienta-drupal
ddev stop

# Or stop and remove containers
ddev poweroff
```

### Creating Content in Drupal

The frontend needs content to display. Create sample content:

```bash
# 1. Go to Drupal admin
https://backend.ddev.site/admin/content

# 2. Add content for each content type:
# - Herbs: /node/add/herb
# - Modalities: /node/add/modality
# - Conditions: /node/add/condition
# - Practitioners: /node/add/practitioner
# - Formulas: /node/add/formula
```

**Note:** You'll need to create the content types first (see DRUPAL-COMPREHENSIVE-HERB-SETUP.md).

## Environment Variables

The frontend uses these environment variables from `frontend/.env.local`:

```env
# Critical for connection
NEXT_PUBLIC_DRUPAL_BASE_URL=https://backend.ddev.site

# Optional (for OAuth)
DRUPAL_CLIENT_ID=verscienta-nextjs-client
DRUPAL_CLIENT_SECRET=your-secret-here

# Optional (for Grok AI)
XAI_API_KEY=your-xai-api-key

# Optional (for Algolia search)
NEXT_PUBLIC_ALGOLIA_APP_ID=your-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your-search-key
```

## Debugging

### Check Backend Connection

```bash
# From frontend directory
cd /home/pf1/verscienta-drupal/frontend

# Test the connection
node -e "
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

https.get('https://backend.ddev.site/jsonapi/node/modality', { agent }, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (err) => {
  console.error('Error:', err.message);
});
"
```

### Check Frontend Logs

```bash
# In the terminal running Next.js dev server, you should see:
# - Successful: Compiled successfully
# - Failed: Error messages about fetch

# Check browser console (F12) for network errors
```

### Check DDEV Logs

```bash
cd /home/pf1/verscienta-drupal
ddev logs

# Or for web server logs
ddev logs -s web

# Or for database logs
ddev logs -s db
```

### Verify JSON:API Endpoints

Test each endpoint:

```bash
# Modalities
curl -k https://backend.ddev.site/jsonapi/node/modality

# Herbs
curl -k https://backend.ddev.site/jsonapi/node/herb

# Conditions
curl -k https://backend.ddev.site/jsonapi/node/condition

# Practitioners
curl -k https://backend.ddev.site/jsonapi/node/practitioner

# Formulas
curl -k https://backend.ddev.site/jsonapi/node/formula
```

## Next Steps

Once the connection is working:

1. **Create Content Types** in Drupal (see `DRUPAL-COMPREHENSIVE-HERB-SETUP.md`)
2. **Add Sample Content** to test the frontend
3. **Set up OAuth** for authentication (see `DRUPAL-OAUTH-SETUP.md`)
4. **Configure Algolia** for search (see `ALGOLIA-SETUP.md`)
5. **Add Turnstile CAPTCHA** (see `TURNSTILE-SETUP.md`)

## Troubleshooting Checklist

- [ ] DDEV is running (`ddev status`)
- [ ] Drupal is installed (`ddev ssh` then `drush status`)
- [ ] JSON:API module enabled (`ddev ssh` then `drush pml | grep jsonapi`)
- [ ] CORS configured (check services.yml or cors module)
- [ ] Backend URL is accessible in browser (`https://backend.ddev.site`)
- [ ] JSON:API endpoint returns data (`https://backend.ddev.site/jsonapi`)
- [ ] Next.js dev server is running (`npm run dev`)
- [ ] No CORS errors in browser console

## Getting Help

If you're still having issues:

1. Check DDEV logs: `ddev logs`
2. Check Drupal logs: `https://backend.ddev.site/admin/reports/dblog`
3. Check browser console (F12 > Console tab)
4. Check Network tab (F12 > Network tab) for failed requests

## Alternative: Use HTTP Instead of HTTPS

If SSL is causing issues, you can use HTTP for local development:

```bash
# Edit .ddev/config.yaml
cd /home/pf1/verscienta-drupal
ddev config --additional-fqdns=backend.ddev.local --router-http-port=80

# Then update frontend/.env.local
NEXT_PUBLIC_DRUPAL_BASE_URL=http://backend.ddev.site

# Restart
ddev restart
cd frontend
npm run dev
```

---

**Quick Summary for Your Current Error:**

1. Run `ddev start` in `/home/pf1/verscienta-drupal`
2. Enable CORS: `ddev ssh` → `drush en cors -y` → `drush cr` → `exit`
3. Test backend: Visit `https://backend.ddev.site/jsonapi` in browser
4. If it works, restart Next.js: `npm run dev`

The error should be resolved once Drupal is running and accessible!
