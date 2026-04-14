# WSL DDEV Setup Commands

Your project is now in WSL at: `\\wsl.localhost\DDEV\home\pf1\backend`

## Step 1: Copy Files to WSL

Run in **PowerShell** (as Administrator):

```powershell
cd C:\Users\pf1\OneDrive\Documents\GitHub\verscienta-drupal
.\copy-to-wsl.ps1
```

Or manually copy using Windows Explorer:
- Source: `C:\Users\pf1\OneDrive\Documents\GitHub\verscienta-drupal`
- Destination: `\\wsl.localhost\DDEV\home\pf1`

## Step 2: Access WSL and Verify DDEV

Open **WSL Terminal** (or Windows Terminal with DDEV profile):

```bash
# Access WSL DDEV distribution
wsl -d DDEV

# Navigate to project
cd /home/pf1/backend

# Check DDEV status
ddev describe

# Should show something like:
# Project: backend
# Type: drupal
# PHP: 8.2
# Database: PostgreSQL 17
# URL: https://backend.ddev.site
```

## Step 3: Complete Drupal Installation

If DDEV is configured but Drupal isn't installed yet:

```bash
cd /home/pf1/backend

# Install Drupal dependencies
ddev composer install

# Install Drupal
ddev drush site:install standard \
  --db-url=pgsql://db:db@db:5432/db \
  --site-name="Verscienta Health" \
  --account-name=admin \
  --account-pass=admin123 \
  -y

# Get admin login link
ddev drush uli
```

## Step 4: Run Setup Script

```bash
# Make script executable
chmod +x setup-content-types.sh

# Run the setup
ddev exec bash setup-content-types.sh
```

This will:
- ✅ Enable core modules (JSON:API, REST, Serialization, etc.)
- ✅ Enable contrib modules (search_api, webform, pathauto, etc.)
- ✅ Enable custom holistic_hub module
- ✅ Set up multilingual support (EN, ES, ZH)

## Step 5: Access Drupal Admin

```bash
# Launch Drupal in browser
ddev launch

# Or get one-time login link
ddev drush uli
```

Default credentials:
- **Username**: admin
- **Password**: admin123

## Step 6: Set Up Frontend

```bash
# Navigate to frontend directory
cd /home/pf1/frontend

# Copy environment file
cp .env.local.example .env.local

# Edit with your values
nano .env.local
# or use: code .env.local (if VS Code is set up)

# Update NEXT_PUBLIC_DRUPAL_BASE_URL to your DDEV URL
# Example: https://backend.ddev.site
```

## Step 7: Install Frontend Dependencies

```bash
cd /home/pf1/frontend

# Install Node modules
npm install

```

## Step 8: Start Development Server

```bash
# Terminal 1: Backend is already running via DDEV
cd /home/pf1/backend
ddev describe  # Get your backend URL

# Terminal 2: Start frontend
cd /home/pf1/frontend
npm run dev
```

Access:
- **Frontend**: http://localhost:3000
- **Backend**: https://backend.ddev.site (or URL from `ddev describe`)
- **Drupal Admin**: https://backend.ddev.site/user/login

## Step 9: Create Content Types

Follow the guide in `docs/AFTER-DDEV-INSTALL.md` (from the repository root).

Or manually via Drupal admin:
1. Go to **Structure > Content types > Add content type**
2. Create each type (Herbs, Modalities, Conditions, etc.)
3. Add fields as specified in `docs/AFTER-DDEV-INSTALL.md`

## Useful DDEV Commands

```bash
# Project management
ddev start              # Start project
ddev stop               # Stop project
ddev restart            # Restart project
ddev poweroff           # Stop all DDEV projects

# Drupal commands
ddev drush cr           # Clear cache
ddev drush uli          # Get admin login link
ddev drush status       # Drupal status
ddev drush config:export  # Export configuration
ddev drush config:import  # Import configuration

# Database
ddev export-db          # Export database
ddev import-db          # Import database
ddev snapshot           # Create DB snapshot

# Logs
ddev logs               # View logs
ddev logs -f            # Follow logs

# SSH into container
ddev ssh                # SSH into web container

# Composer
ddev composer install
ddev composer require drupal/module_name
ddev composer update

# Launch services
ddev launch             # Open site in browser
ddev launch /admin      # Open admin in browser
```

## Accessing Files from Windows

You can access your WSL files from Windows Explorer:

```
\\wsl.localhost\DDEV\home\pf1\backend
\\wsl.localhost\DDEV\home\pf1\frontend
```

Or use VS Code:
```bash
# From WSL terminal
cd /home/pf1/backend
code .
```

## Troubleshooting

### DDEV not found
```bash
# Install DDEV in WSL
curl -fsSL https://ddev.com/install.sh | bash
```

### Port conflicts
```bash
# Check what's using ports
ddev poweroff
sudo lsof -i :80
sudo lsof -i :443
```

### Frontend can't reach backend
- Make sure DDEV is running: `ddev describe`
- Update `.env.local` with correct DDEV URL
- Check CORS settings in Drupal

### Permission issues
```bash
# Fix permissions
ddev exec chmod -R 755 /var/www/html/web/sites/default/files
```

## Next Steps

After setup is complete, refer to:
- **`docs/AFTER-DDEV-INSTALL.md`** — Detailed content type creation and Plasmic integration
- **`docs/TIMELINE.md`** — Full 8-week development roadmap
- **`docs/README.md`** — Project overview and features (repository root `README.md` is the short index)

## Quick Test

Verify everything is working:

```bash
# 1. Check backend
curl https://backend.ddev.site

# 2. Check JSON:API
curl https://backend.ddev.site/jsonapi

# 3. Start frontend and visit http://localhost:3000
cd /home/pf1/frontend
npm run dev
```

You should see:
- ✅ Drupal responding at backend.ddev.site
- ✅ JSON:API endpoint accessible
- ✅ Next.js frontend running on localhost:3000

---

**Need help?** Check the main documentation files or run `ddev help`
