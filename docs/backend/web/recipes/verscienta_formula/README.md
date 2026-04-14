# Verscienta Formula Recipe

This Drupal recipe creates the Formula content type for managing herbal formulas with ingredients, dosage, and preparation instructions.

## Prerequisites

Before applying this recipe, ensure you have:

1. **Herb content type** (`node--herb`) - Herbs are referenced by formula ingredients
2. **Condition content type** (`node--condition`) - Optional, for linking formulas to conditions

## Installation

### Using DDEV

```bash
# Start DDEV if not running
ddev start

# Apply the recipe
ddev drush recipe recipes/verscienta_formula

# Clear caches
ddev drush cr
```

### Manual Installation

```bash
# From the Drupal root directory
drush recipe recipes/verscienta_formula
drush cr
```

## Content Type: Formula

### Fields

| Field | Type | Description |
|-------|------|-------------|
| Title | Text | Formula name (e.g., "Si Jun Zi Tang") |
| Description | Long text | Detailed description of the formula |
| Preparation Instructions | Long text | How to prepare the formula |
| Dosage | Long text | Recommended dosage information |
| Total Weight | Decimal | Combined weight of all ingredients |
| Weight Unit | Select | g, oz, ml, or parts |
| Use Cases | Text (multiple) | Common indications |
| Herb Ingredients | Paragraphs | List of herbs with quantities |
| Related Conditions | Entity reference | Health conditions this addresses |

### Herb Ingredient Paragraph

Each herb ingredient contains:

| Field | Type | Description |
|-------|------|-------------|
| Herb | Entity reference | Reference to herb content |
| Quantity | Decimal | Amount of this herb |
| Unit | Select | g, oz, ml, parts, pieces |
| Percentage | Decimal | % of total formula |
| Role | Select | Chief, Deputy, Assistant, Envoy |
| Function | Long text | What this herb does in the formula |
| Notes | Long text | Additional notes |

## JSON:API Access

After installation, formulas are available via JSON:API:

```
GET /jsonapi/node/formula
GET /jsonapi/node/formula/{uuid}
GET /jsonapi/node/formula/{uuid}?include=field_herb_ingredients
```

## Permissions

The recipe grants these permissions to the Content Editor role:
- Create, edit own, edit any, delete own formula content

## Frontend Integration

The frontend expects formulas in this format:

```typescript
interface FormulaEntity {
  id: string;
  type: 'node--formula';
  title: string;
  field_description?: string;
  field_preparation_instructions?: string;
  field_dosage?: string;
  field_total_weight?: number;
  field_total_weight_unit?: string;
  field_use_cases?: string[];
  field_herb_ingredients?: HerbIngredient[];
  field_conditions?: { id: string; type: string; title?: string }[];
}
```

## Troubleshooting

### "Paragraphs module not found"

Install the paragraphs module:
```bash
ddev composer require drupal/paragraphs
ddev drush en paragraphs entity_reference_revisions
```

### "Herb content type not found"

The formula references herbs. Create the herb content type first or remove the `target_bundles` restriction from `field.field.paragraph.herb_ingredient.field_herb_reference.yml`.
