# After DDEV Installation Steps

## 1. Complete Drupal Setup

After running DDEV installation, execute:

```bash
cd backend
ddev exec bash setup-content-types.sh
```

This will:
- Enable core modules (JSON:API, REST, Serialization)
- Enable contrib modules (search_api, webform, pathauto, etc.)
- Enable the custom holistic_hub module
- Set up multilingual support (EN, ES, ZH)

## 2. Create Content Types

Access Drupal admin: `ddev launch`

Navigate to **Structure > Content types > Add content type**

### Herb Content Type
Fields:
- `field_scientific_name` (Text, plain)
- `field_common_names` (Text, plain, multiple values)
- `field_therapeutic_uses` (Text, long formatted)
- `field_contraindications` (Text, long formatted)
- `field_herb_family` (Entity reference to Taxonomy)

### Modality Content Type
Fields:
- `field_name` (Text, plain) - already exists as title
- `field_excels_at` (Text, plain, multiple values)
- `field_benefits` (Text, long formatted)
- `field_related_conditions` (Entity reference to Condition nodes)

### Condition Content Type
Fields:
- `field_symptoms` (Text, plain, multiple values)
- `field_severity` (List: Mild, Moderate, Severe)
- `field_related_modalities` (Entity reference to Modality nodes)

### Practitioner Content Type
Fields:
- `field_practice_type` (List: Solo, Group, Clinic, Hospital)
- `field_address` (Address field)
- `field_latitude` (Number, decimal)
- `field_longitude` (Number, decimal)
- `field_modalities` (Entity reference to Modality nodes)
- `field_bio` (Text, long formatted)

### Symptom Content Type
Fields:
- `field_category` (Entity reference to Taxonomy)
- `field_related_conditions` (Entity reference to Condition nodes)

### Review Content Type
Fields:
- `field_rating` (Number, integer, 1-5)
- `field_comment` (Text, long)
- `field_reviewed_entity` (Entity reference to any node)
- `field_moderation_status` (List: Pending, Approved, Rejected)

### Grok Insight Content Type
Fields:
- `field_analysis` (Text, long formatted)
- `field_confidence_score` (Number, decimal)
- `field_related_content` (Entity reference to any node)
- `field_created_timestamp` (Date/time)

## 3. Configure JSON:API

1. Go to `/admin/config/services/jsonapi`
2. Enable JSON:API for all content types
3. Configure allowed operations (GET, POST, PATCH, DELETE)
4. Set up includes and filters

## 4. Set Up Frontend (Plasmic + Drupal)

See `/tmp/PLASMIC-MIGRATION-COMPLETE.md` for complete Plasmic setup instructions.

Quick steps:
```bash
cd ../frontend
sudo chown -R pf1:pf1 .
cp /tmp/env.local.example .env.local
npm install @plasmicapp/loader-nextjs @plasmicapp/cli
npx plasmic init
```

## 5. Connect Drupal Data to Frontend

Create `lib/drupal.ts`:

```typescript
import { DrupalClient } from 'next-drupal';

export const drupal = new DrupalClient(
  process.env.NEXT_PUBLIC_DRUPAL_BASE_URL!,
  {
    // Configure OAuth when ready
  }
);

// Fetch herbs
export async function getHerbs() {
  return await drupal.getResourceCollection('node--herb', {
    params: {
      'include': 'field_herb_family',
      'sort': 'title',
    },
  });
}

// Fetch modalities
export async function getModalities() {
  return await drupal.getResourceCollection('node--modality', {
    params: {
      'include': 'field_related_conditions',
      'sort': 'title',
    },
  });
}
```

## 6. Test the Integration

```bash
# Start backend
cd backend
ddev start

# Start frontend
cd ../frontend
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Drupal Admin: `ddev launch` (from backend directory)
- Plasmic Studio: https://studio.plasmic.app

## 7. Next Features to Implement

1. **Symptom Checker Page** (`app/symptom-checker/page.tsx`)
2. **Grok AI Integration** (`app/api/grok/symptom-analysis/route.ts`)
3. **Search Functionality** with Fuse.js
4. **User Authentication** with NextAuth.js
5. **Practitioner Directory** with map integration

## Quick Commands Reference

```bash
# DDEV commands (from backend/)
ddev start              # Start DDEV
ddev stop               # Stop DDEV
ddev launch             # Open Drupal in browser
ddev exec drush cr      # Clear Drupal cache
ddev exec drush uli     # Get one-time login link
ddev logs               # View logs

# Frontend commands (from frontend/)
npm run dev             # Start dev server
npm run build           # Build for production
npm run lint            # Run linter
npm run test            # Run tests
```

## Troubleshooting

### Drupal not connecting to DB
```bash
ddev describe  # Check database credentials
```

### Frontend can't reach Drupal
Check `NEXT_PUBLIC_DRUPAL_BASE_URL` in `.env.local`

### Plasmic preview not working
Verify Plasmic credentials in `.env.local`

## Resources

- [DDEV Documentation](https://ddev.readthedocs.io/)
- [Drupal JSON:API](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module)
- [next-drupal](https://next-drupal.org/)
- [Plasmic Documentation](https://docs.plasmic.app/)
