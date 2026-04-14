# Drupal Backend Setup Instructions

## Quick Start (2 Commands!)

Follow these steps to set up the complete Drupal backend for Verscienta Health.

---

## Step 1: Start DDEV

```bash
cd /home/pf1/verscienta-drupal
ddev start
```

Wait for DDEV to fully start. You should see:
```
Successfully started verscienta-drupal
Project can be reached at https://backend.ddev.site
```

---

## Step 2: Install Drupal (if not already installed)

```bash
ddev drush site:install standard \
  --site-name="Verscienta Health Backend" \
  --account-name=admin \
  --account-pass=admin \
  --db-url=mysql://db:db@db/db \
  -y
```

Check status:
```bash
ddev drush status
```

---

## Step 3: Run Setup Script (FROM HOST - Not inside DDEV!)

**Run this from your project root** (NOT inside `ddev ssh`):

```bash
cd /home/pf1/verscienta-drupal
chmod +x setup-drupal.sh
./setup-drupal.sh
```

This single script will set up everything using `ddev drush` commands

This will:
- ✅ Install all required modules (Paragraphs, Field Group, JSON:API, CORS, etc.)
- ✅ Configure CORS for frontend access
- ✅ Create Herb content type with 50+ fields
- ✅ Create Modality, Condition, Practitioner, Formula, Review content types
- ✅ Set up JSON:API endpoints
- ✅ Configure permissions
- ✅ Create entity reference fields
- ✅ Clear cache

**Estimated time:** 3-5 minutes

---

## Alternative: Run Scripts Individually

If you prefer to run scripts one at a time:

### A. Herb Content Type Only

```bash
cd /var/www/html
bash backend/scripts/setup-herb-content-type.sh
```

### B. Other Content Types

```bash
cd /var/www/html
bash backend/scripts/setup-all-content-types.sh
```

---

## Step 5: Verify Installation

### Test Drupal Admin

1. Open browser: `https://backend.ddev.site/admin`
2. Login: `admin` / `admin`
3. Navigate to **Structure > Content types**
4. You should see:
   - Herb
   - Modality
   - Condition
   - Practitioner
   - Formula
   - Review
   - Grok Insight

### Test JSON:API Endpoints

```bash
# From your host machine (outside DDEV)
curl -k https://backend.ddev.site/jsonapi/node/herb
curl -k https://backend.ddev.site/jsonapi/node/modality
curl -k https://backend.ddev.site/jsonapi/node/condition
```

You should get JSON responses (even if empty data).

---

## Step 6: Create Sample Content

### Via Drupal UI

1. Go to `https://backend.ddev.site/node/add/herb`
2. Fill in the form with sample herb data
3. Click **Save**
4. Repeat for other content types

### Sample Herb Data

**Title:** Ginseng
**Scientific Name:** Panax ginseng
**Family:** Araliaceae
**Parts Used:** Root
**TCM Taste:** Sweet, Slightly Bitter
**TCM Temperature:** Warm
**TCM Meridians:** Lung, Spleen
**Therapeutic Uses:** Adaptogen, increases energy, supports immune system
**Conservation Status:** Endangered

---

## Step 7: Test Frontend Connection

```bash
# Exit DDEV
exit

# Navigate to frontend
cd /home/pf1/verscienta-drupal/frontend

# Start Next.js
npm run dev
```

Visit `http://localhost:3000` - you should now see data from Drupal!

---

## Troubleshooting

### Issue: Permission Denied

```bash
chmod: cannot access 'backend/scripts/*.sh': No such file or directory
```

**Solution:** Scripts are in wrong location. They should be at:
```
/home/pf1/verscienta-drupal/backend/scripts/complete-setup.sh
```

Make the directory if needed:
```bash
ddev ssh
cd /var/www/html
mkdir -p backend/scripts
exit
```

Then copy the scripts from the project root to `backend/scripts/`.

---

### Issue: Drush Command Not Found

```bash
bash: drush: command not found
```

**Solution:** You're not inside DDEV. Run:
```bash
ddev ssh
```

---

### Issue: Field Already Exists

```
[error] The field field_scientific_name already exists
```

**Solution:** This is normal if you run the script twice. The script will continue and skip existing fields.

---

### Issue: CORS Errors in Browser

```
Access to fetch at 'https://backend.ddev.site' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

1. Check CORS configuration:
```bash
ddev ssh
cat web/sites/default/services.yml
```

2. Ensure it contains:
```yaml
parameters:
  cors.config:
    enabled: true
    allowedOrigins:
      - 'http://localhost:3000'
```

3. Clear cache:
```bash
drush cr
```

---

### Issue: JSON:API Returns Empty Data

This is normal! You need to create content first.

Go to `https://backend.ddev.site/node/add/herb` and create a herb, then check the API again.

---

## What Each Script Does

### `complete-setup.sh` (RECOMMENDED)
- Master script that runs everything
- Installs modules, creates content types, configures CORS, sets permissions
- **Run this if you want everything set up automatically**

### `setup-herb-content-type.sh`
- Creates only the Herb content type
- Adds 50+ fields (botanical, TCM, medicinal, cultural, etc.)
- Configures list options (plant types, conservation status, etc.)
- **Run this if you only want the herb database**

### `setup-all-content-types.sh`
- Creates Modality, Condition, Practitioner, Formula, Review, Grok Insight
- Does NOT create Herb (use setup-herb-content-type.sh for that)
- **Run this after herb setup to add other content types**

---

## Script Execution Summary

**Option A: All-in-One (Recommended)**
```bash
ddev ssh
cd /var/www/html
chmod +x backend/scripts/complete-setup.sh
bash backend/scripts/complete-setup.sh
```

**Option B: Step-by-Step**
```bash
ddev ssh
cd /var/www/html
chmod +x backend/scripts/*.sh

# 1. Create herb content type
bash backend/scripts/setup-herb-content-type.sh

# 2. Create other content types
bash backend/scripts/setup-all-content-types.sh

# 3. Configure CORS manually (or it's in complete-setup.sh)
```

---

## Content Type Field Summary

### Herb (50+ fields)
- Botanical: Scientific name, family, genus, species, synonyms, plant type, habitat, parts used
- TCM: Taste, temperature, meridians, functions, category
- Medicinal: Therapeutic uses, active constituents, pharmacological effects, dosage
- Safety: Contraindications, drug interactions, side effects, toxicity
- Cultural: Traditional uses (Chinese, American, Native American), folklore
- Metadata: Peer review status, ratings, images

### Modality
- Description, history, techniques, benefits, what to expect, excels at, image

### Condition
- Description, symptoms, severity, causes, treatments (Western & holistic), lifestyle recommendations

### Practitioner
- Name, bio, practice type, address, lat/long, phone, email, website, certifications, years experience, photo, accepting patients

### Formula
- Description, ingredients (via Paragraphs), preparation, dosage, total weight, use cases, traditional/pinyin/Chinese names, category

### Review
- Rating, comment, verified experience, helpful count

### Grok Insight
- User symptoms, AI analysis, confidence score, follow-up questions

---

## Next Steps After Setup

1. **Create Taxonomies** (optional):
   - Herb categories
   - Symptom categories
   - Modality types

2. **Set Up Paragraphs** (for complex repeating fields):
   - Active Constituents (compound name, class, percentage, effects)
   - Drug Interactions (drug name, type, description)
   - Dosage Information (form, amount, frequency, population)
   - Common Names (text, language, region)

3. **Configure Views** (optional):
   - Herb listing by category
   - Practitioners by location
   - Formulas by condition

4. **Set Up Image Styles**:
   - Herb thumbnail (200x200)
   - Modality featured (800x400)
   - Practitioner photo (300x300)

5. **Configure Menus**:
   - Add content types to admin menu
   - Create public navigation

6. **Import Sample Content** (optional):
   - Use Migrate module
   - Import CSV of herbs
   - Bulk create practitioners

---

## Backup & Restore

### Backup Configuration

```bash
ddev ssh
drush config:export -y
exit

# Files will be in: config/sync/
```

### Backup Database

```bash
ddev export-db --file=/var/www/html/backup.sql.gz
```

### Restore Database

```bash
ddev import-db --file=/var/www/html/backup.sql.gz
```

---

## Getting Help

If you encounter issues:

1. **Check DDEV logs:**
   ```bash
   ddev logs
   ```

2. **Check Drupal logs:**
   ```bash
   ddev ssh
   drush watchdog:show
   ```

3. **Clear cache (fixes 90% of issues):**
   ```bash
   ddev ssh
   drush cr
   ```

4. **Restart DDEV:**
   ```bash
   ddev restart
   ```

5. **Check script output for errors** - the scripts have detailed error messages

---

## Summary

✅ **Quick Setup:** Just run `complete-setup.sh` inside DDEV
✅ **All content types created automatically**
✅ **JSON:API endpoints configured**
✅ **CORS enabled for frontend**
✅ **Ready to create content and test**

**Total setup time:** ~5 minutes

---

Last updated: 2025-10-03
