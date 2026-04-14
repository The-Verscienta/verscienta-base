# Drupal OAuth Setup Guide

This guide will help you configure Drupal Simple OAuth for headless authentication.

## 1. Install Drupal Modules

```bash
cd backend
composer install
```

This will install:
- `simple_oauth` - OAuth 2.0 server
- `consumers` - OAuth client management

## 2. Generate OAuth Keys

Simple OAuth requires RSA key pairs for signing tokens.

```bash
cd backend
mkdir -p oauth/keys
chmod 700 oauth/keys

# Generate private key
openssl genrsa -out oauth/keys/private.key 2048

# Generate public key
openssl rsa -in oauth/keys/private.key -pubout -out oauth/keys/public.key

# Set permissions
chmod 600 oauth/keys/private.key
chmod 600 oauth/keys/public.key
```

## 3. Enable Modules in Drupal

```bash
cd backend
./vendor/bin/drush en simple_oauth consumers -y
```

## 4. Configure Simple OAuth in Drupal

### Via Drush:
```bash
./vendor/bin/drush config:set simple_oauth.settings public_key ../oauth/keys/public.key -y
./vendor/bin/drush config:set simple_oauth.settings private_key ../oauth/keys/private.key -y
./vendor/bin/drush cr
```

### Via Web UI:
1. Go to `/admin/config/people/simple_oauth`
2. Set **Public Key Path**: `../oauth/keys/public.key`
3. Set **Private Key Path**: `../oauth/keys/private.key`
4. Save configuration

## 5. Create OAuth Consumer (Client)

### Via Web UI:
1. Go to `https://backend.ddev.site/admin/config/services/consumer`
2. Click "Add Consumer"
3. Fill in:
   - **Label**: Next.js Frontend
   - **Client ID**: `verscienta-nextjs-client`
   - **Secret**: Generate a secure random string (save this!)
   - **Is Confidential**: Yes
   - **Redirect URI**: `http://localhost:3000/api/auth/callback`
4. Save

### Via Drush (Recommended):
```bash
# Generate secure client secret
CLIENT_SECRET=$(openssl rand -base64 32)

# If using DDEV:
ddev exec drush simple-oauth:create-client \
  --label="Next.js Frontend" \
  --client-id="verscienta-nextjs-client" \
  --secret="$CLIENT_SECRET" \
  --confidential \
  --redirect-uri="http://localhost:3000/api/auth/callback"

# Or if running Drush directly in backend:
./vendor/bin/drush simple-oauth:create-client \
  --label="Next.js Frontend" \
  --client-id="verscienta-nextjs-client" \
  --secret="$CLIENT_SECRET" \
  --confidential \
  --redirect-uri="http://localhost:3000/api/auth/callback"

echo "Client Secret: $CLIENT_SECRET"
# IMPORTANT: Save this secret for your .env file!
```

## 6. Configure CORS for Drupal

Edit `backend/web/sites/default/services.yml` (or create from `default.services.yml`):

```yaml
cors.config:
  enabled: true
  allowedHeaders: ['*']
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  allowedOrigins: ['http://localhost:3000', 'https://backend.ddev.site']
  exposedHeaders: false
  maxAge: false
  supportsCredentials: true
```

Then clear cache:
```bash
# Using DDEV:
ddev exec drush cr

# Or directly:
./vendor/bin/drush cr
```

## 7. Update Frontend Environment Variables

Copy the Client Secret from step 5 and update `frontend/.env.local`:

```bash
NEXT_PUBLIC_DRUPAL_BASE_URL=http://localhost:8080
DRUPAL_CLIENT_ID=verscienta-nextjs-client
DRUPAL_CLIENT_SECRET=<your-generated-secret-from-step-5>
DRUPAL_PREVIEW_SECRET=<generate-random-string>
```

## 8. Test Authentication

Your Drupal backend is running at: **https://backend.ddev.site**

Create a test user:
```bash
# Using DDEV:
ddev exec drush user:create testuser --mail="test@example.com" --password="testpass123"

# Or directly:
cd backend
./vendor/bin/drush user:create testuser --mail="test@example.com" --password="testpass123"
```

## 9. Verify Setup

Check that Simple OAuth is working:
```bash
curl -X POST https://backend.ddev.site/oauth/token \
  -d "grant_type=password" \
  -d "client_id=verscienta-nextjs-client" \
  -d "client_secret=YOUR_SECRET" \
  -d "username=testuser" \
  -d "password=testpass123"
```

You should receive a JSON response with `access_token`.

## Security Notes

⚠️ **Important for Production:**
- Use HTTPS only
- Rotate secrets regularly
- Store keys outside web root
- Use environment variables for secrets
- Enable rate limiting
- Set appropriate token expiration times
- Update CORS to your production domain only

## Troubleshooting

**Keys not found:**
```bash
# Check paths are correct
ls -la backend/oauth/keys/
```

**Permission denied:**
```bash
chmod 600 backend/oauth/keys/*.key
```

**CORS errors:**
- Clear Drupal cache: `drush cr`
- Check `services.yml` configuration
- Verify allowed origins include your frontend URL
