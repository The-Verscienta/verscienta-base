# Drupal Formula Content Type Setup Guide

This guide explains how to set up the Formula content type in Drupal to support herbal formulas with precise herb quantities.

## 1. Create the Formula Content Type

### Via Drupal Admin UI:

1. Navigate to **Structure > Content types > Add content type**
2. Set the following:
   - **Name:** Formula
   - **Machine name:** `formula`
   - **Description:** "Traditional herbal formulas combining multiple herbs in specific proportions"

### Fields to Add:

#### Basic Information

**Title** (default field)
- The name of the formula (e.g., "Four Gentlemen Decoction", "Relaxation Blend")

**Body** (default field, optional)
- Detailed description of the formula
- Historical context, traditional uses, etc.

#### Custom Fields

**1. Description (field_description)**
- **Field type:** Text (plain, long)
- **Label:** Short Description
- **Help text:** Brief summary of the formula (1-2 sentences)
- **Required:** No

**2. Herb Ingredients (field_herb_ingredients)**
- **Field type:** Entity reference (to Herb content type)
- **Label:** Herb Ingredients
- **Reference type:** Content
- **Content type:** Herb
- **Number of values:** Unlimited
- **Required:** Yes
- **Widget:** Paragraphs or Inline entity form (recommended)

**Important:** This field needs additional sub-fields for quantities. See "Herb Ingredient Setup" section below.

**3. Total Weight (field_total_weight)**
- **Field type:** Number (decimal)
- **Label:** Total Formula Weight
- **Decimal places:** 2
- **Minimum:** 0
- **Suffix:** (will be set by unit field)
- **Required:** No

**4. Total Weight Unit (field_total_weight_unit)**
- **Field type:** List (text)
- **Label:** Weight Unit
- **Allowed values:**
  - `g` | Grams
  - `mg` | Milligrams
  - `oz` | Ounces
  - `ml` | Milliliters
  - `tsp` | Teaspoons
  - `tbsp` | Tablespoons
- **Default:** g
- **Required:** No

**5. Preparation Instructions (field_preparation_instructions)**
- **Field type:** Text (plain, long) or Text (formatted, long)
- **Label:** Preparation Instructions
- **Help text:** How to prepare this formula (decoction, infusion, tincture, etc.)
- **Required:** No

**6. Dosage (field_dosage)**
- **Field type:** Text (plain, long)
- **Label:** Dosage Instructions
- **Help text:** Recommended dosage and frequency
- **Required:** No

**7. Use Cases (field_use_cases)**
- **Field type:** Text (plain)
- **Label:** Use Cases
- **Number of values:** Unlimited
- **Help text:** Conditions or situations this formula addresses
- **Required:** No

**8. Related Conditions (field_conditions)**
- **Field type:** Entity reference
- **Label:** Related Conditions
- **Reference type:** Content
- **Content type:** Condition
- **Number of values:** Unlimited
- **Required:** No

## 2. Herb Ingredient Setup (Recommended Approach: Paragraphs)

The best way to handle herb ingredients with quantities is to use the **Paragraphs** module.

### Install Paragraphs Module:

```bash
composer require drupal/paragraphs
drush en paragraphs -y
```

### Create Herb Ingredient Paragraph Type:

1. Navigate to **Structure > Paragraph types > Add paragraph type**
2. **Name:** Herb Ingredient
3. **Machine name:** `herb_ingredient`

### Add Fields to Herb Ingredient Paragraph:

**1. Herb (field_herb)**
- **Field type:** Entity reference
- **Reference type:** Content
- **Content type:** Herb
- **Number of values:** 1
- **Required:** Yes

**2. Quantity (field_quantity)**
- **Field type:** Number (decimal)
- **Decimal places:** 2
- **Minimum:** 0
- **Required:** Yes

**3. Unit (field_unit)**
- **Field type:** List (text)
- **Allowed values:**
  - `g` | Grams
  - `mg` | Milligrams
  - `oz` | Ounces
  - `ml` | Milliliters
  - `tsp` | Teaspoons
  - `tbsp` | Tablespoons
  - `drops` | Drops
  - `parts` | Parts
- **Required:** Yes

**4. Percentage (field_percentage)**
- **Field type:** Number (decimal)
- **Decimal places:** 2
- **Minimum:** 0
- **Maximum:** 100
- **Suffix:** %
- **Required:** No
- **Help text:** Percentage of total formula (calculated automatically if possible)

**5. Role (field_role)** (Optional but recommended)
- **Field type:** List (text)
- **Allowed values:**
  - `chief` | Chief Herb
  - `deputy` | Deputy Herb
  - `assistant` | Assistant Herb
  - `envoy` | Envoy Herb
- **Help text:** Traditional role of this herb in the formula

### Update Formula Content Type:

Change the **field_herb_ingredients** field:
- **Field type:** Entity reference revisions (Paragraphs)
- **Reference type:** Paragraph
- **Paragraph type:** Herb Ingredient
- **Number of values:** Unlimited

## 3. Alternative Approach: Field Collection

If you prefer not to use Paragraphs, you can use the **Field Collection** module:

```bash
composer require drupal/field_collection
drush en field_collection -y
```

Then create a field collection with the same structure as the Paragraph approach.

## 4. JSON:API Configuration

### Enable JSON:API for Formula:

The Formula content type should automatically be available via JSON:API once created.

### Update Drupal JSON:API Include Settings:

To properly include herb ingredients in API responses, you may need to configure JSON:API Extras:

```bash
composer require drupal/jsonapi_extras
drush en jsonapi_extras -y
```

Navigate to **Configuration > Web Services > JSON:API Extras** and enable enhanced includes.

### Example API Response Structure:

```json
{
  "data": {
    "type": "node--formula",
    "id": "uuid-here",
    "attributes": {
      "title": "Four Gentlemen Decoction",
      "field_description": "Classic Qi-tonifying formula",
      "field_total_weight": 100,
      "field_total_weight_unit": "g",
      "field_preparation_instructions": "Decoct in water for 30 minutes",
      "field_dosage": "Take 150ml twice daily",
      "field_use_cases": ["Digestive weakness", "Fatigue"]
    },
    "relationships": {
      "field_herb_ingredients": {
        "data": [
          { "type": "paragraph--herb_ingredient", "id": "uuid-1" },
          { "type": "paragraph--herb_ingredient", "id": "uuid-2" }
        ]
      },
      "field_conditions": {
        "data": [
          { "type": "node--condition", "id": "condition-uuid" }
        ]
      }
    }
  },
  "included": [
    {
      "type": "paragraph--herb_ingredient",
      "id": "uuid-1",
      "attributes": {
        "field_quantity": 30,
        "field_unit": "g",
        "field_percentage": 30,
        "field_role": "chief"
      },
      "relationships": {
        "field_herb": {
          "data": { "type": "node--herb", "id": "herb-uuid-1" }
        }
      }
    }
  ]
}
```

## 5. Permissions

Set permissions for the Formula content type:

- **Anonymous users:** View published formulas
- **Authenticated users:** View published formulas
- **Herbalist role:** Create, edit, delete formulas
- **Administrator:** Full access

## 6. Views Configuration (Optional)

### Create a Formula List View:

1. **Structure > Views > Add view**
2. **View name:** Formulas
3. **Show:** Content of type Formula
4. **Create a page:** Yes
5. **Path:** /admin/content/formulas
6. **Display format:** Table

### Fields to display:
- Title
- Number of herbs (count of field_herb_ingredients)
- Total weight
- Created date
- Status
- Edit link

## 7. Testing

### Create a Sample Formula:

1. Navigate to **Content > Add content > Formula**
2. Fill in:
   - **Title:** "Test Relaxation Formula"
   - **Description:** "A simple formula for stress relief"
   - **Herb Ingredients:**
     - Herb: Chamomile, Quantity: 40, Unit: g, Percentage: 40%
     - Herb: Lavender, Quantity: 30, Unit: g, Percentage: 30%
     - Herb: Lemon Balm, Quantity: 30, Unit: g, Percentage: 30%
   - **Total Weight:** 100
   - **Weight Unit:** g
   - **Preparation:** "Steep in hot water for 10 minutes"
   - **Dosage:** "Drink 1 cup up to 3 times daily"
3. Save and verify the formula displays correctly

### Test API Access:

```bash
# Fetch all formulas
curl -X GET "https://backend.ddev.site/jsonapi/node/formula" \
  -H "Accept: application/vnd.api+json"

# Fetch single formula with includes
curl -X GET "https://backend.ddev.site/jsonapi/node/formula/{uuid}?include=field_herb_ingredients.field_herb,field_conditions" \
  -H "Accept: application/vnd.api+json"
```

## 8. Frontend Integration Notes

The Next.js frontend is already configured to:
- Display formulas list at `/formulas`
- Show individual formula details at `/formulas/[id]`
- Display formulas containing a specific herb on herb detail pages
- Calculate percentages automatically if not provided
- Show ingredient breakdown with progress bars
- Display preparation instructions and dosage

Make sure to:
1. Create at least 2-3 sample formulas with complete data
2. Link formulas to existing herbs in your database
3. Test the API responses match the TypeScript interfaces
4. Verify the frontend displays all information correctly

## 9. Advanced Features (Optional)

### Auto-Calculate Percentages:

Create a custom module with a hook to auto-calculate percentages:

```php
<?php
// In your custom module's .module file

use Drupal\Core\Entity\EntityInterface;

/**
 * Implements hook_ENTITY_TYPE_presave() for node entities.
 */
function mymodule_node_presave(EntityInterface $entity) {
  if ($entity->bundle() === 'formula') {
    $total_weight = $entity->get('field_total_weight')->value;

    if ($total_weight > 0) {
      $ingredients = $entity->get('field_herb_ingredients')->referencedEntities();

      foreach ($ingredients as $ingredient) {
        $quantity = $ingredient->get('field_quantity')->value;
        $percentage = ($quantity / $total_weight) * 100;
        $ingredient->set('field_percentage', round($percentage, 2));
        $ingredient->save();
      }
    }
  }
}
```

### Validate Total Matches Sum:

Add validation to ensure individual quantities sum to total weight:

```php
/**
 * Implements hook_entity_presave().
 */
function mymodule_node_presave(EntityInterface $entity) {
  if ($entity->bundle() === 'formula') {
    $total_weight = $entity->get('field_total_weight')->value;
    $ingredients = $entity->get('field_herb_ingredients')->referencedEntities();

    $sum = 0;
    foreach ($ingredients as $ingredient) {
      $sum += $ingredient->get('field_quantity')->value;
    }

    if ($total_weight > 0 && abs($sum - $total_weight) > 0.01) {
      \Drupal::messenger()->addWarning(
        t('Warning: Ingredient quantities (@sum) do not match total formula weight (@total)', [
          '@sum' => $sum,
          '@total' => $total_weight,
        ])
      );
    }
  }
}
```

## 10. Algolia Search Integration

Add formula index to Algolia setup:

```javascript
// Add to ALGOLIA_INDICES in lib/algolia.ts
FORMULAS: 'verscienta_formulas',
```

Update Drupal sync hook to index formulas with searchable attributes:
- Formula name
- Description
- Herb names (as array)
- Use cases
- Condition names

This allows users to search for formulas by name, ingredient, or condition.
