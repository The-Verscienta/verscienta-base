# TCM Data Sources

Reference documentation for the external databases used to enrich the Verscienta platform with Traditional Chinese Medicine (TCM) data.

---

## 1. HERB 2.0 (Priority 1)

**URL:** http://herb.ac.cn/Download
**Format:** Bulk CSV files (ZIP archive)
**License:** Academic/research use — free for non-commercial purposes. Cite: Fang et al., *Nucleic Acids Research*, 2021.
**Updated:** 2025

### Contents

| File | Row Count (approx) | Description |
|------|---------------------|-------------|
| `herbs.csv` | 6,892 | Herb entries with Chinese name, pinyin, Latin name, properties |
| `ingredients.csv` | 44,000+ | Chemical ingredients/compounds found in herbs |
| `targets.csv` | 2,300+ | Known protein targets of ingredients |
| `herb_ingredient.csv` | — | Mapping: herb → ingredient relationships |
| `ingredient_target.csv` | — | Mapping: ingredient → target relationships |
| `formulae.csv` | 6,743 | Classical TCM formulae with composition |
| `experiments.csv` | — | Experimental evidence records |
| `clinical_trials.csv` | — | Clinical trial references |

### Key Fields

**herbs.csv:**
- `herb_id` — unique ID (dedup key)
- `herb_cn_name` — Chinese name
- `herb_pinyin_name` — Pinyin name
- `herb_en_name` — English name
- `herb_latin_name` — Latin/pharmaceutical name
- `Properties` — TCM properties (taste, temperature, meridians)

**ingredients.csv:**
- `ingredient_id` — unique ID
- `ingredient_name` — compound name
- `pubchem_cid` — PubChem Compound ID
- `cas_number` — CAS registry number
- `smiles` — SMILES molecular notation
- `molecular_weight` — molecular weight

**targets.csv:**
- `target_id` — unique ID
- `target_name` — protein target name
- `uniprot_id` — UniProt accession
- `gene_name` — gene symbol

---

## 2. BATMAN-TCM 2.0 (Priority 2)

**URL:** http://bionet.ncpsb.org.cn/batman-tcm (primary); HuggingFace mirror available
**Format:** Tab-separated or CSV files
**License:** Academic use. Cite: Liu et al., *Nucleic Acids Research*, 2021.
**Updated:** 2021 (v2.0)

### Contents

Predicted herb-target interaction scores based on similarity ensemble approach and network pharmacology.

### Key Fields

- `herb_name` — herb identifier
- `ingredient_name` — active compound
- `target_name` — predicted protein target
- `score` — interaction confidence score (0–1)
- `uniprot_id` — UniProt accession for target
- `gene_symbol` — HGNC gene symbol

### Notes

- Supplements HERB 2.0 with computationally predicted interactions
- Scores below 20 are generally low-confidence
- Use to populate `tcm_target_interaction` nodes with `evidence_type: predicted`

---

## 3. FooDB (Priority 3)

**URL:** https://foodb.ca/downloads
**Format:** CSV and JSON files
**License:** Open data (Creative Commons)
**Updated:** Periodically

### Contents

Comprehensive food constituent database. Relevant subset: compounds found in edible/medicinal plants.

### Key Fields

- `compound_name` — chemical compound name
- `food_name` — food/plant source
- `content_amount` — amount per serving
- `content_unit` — measurement unit
- `pubchem_cid` — PubChem CID
- `nutrient_type` — macro/micronutrient classification

### Notes

- Cross-reference with HERB 2.0 ingredients by PubChem CID or compound name
- Adds nutritional context to medicinal herbs (e.g., "Goji berries contain X mg vitamin C per 100g")
- Lower priority — implement after HERB 2.0 and BATMAN-TCM ingestion is stable

---

## 4. PubChem (Enrichment)

**URL:** https://pubchem.ncbi.nlm.nih.gov/
**Access:** Programmatic via PubChemPy Python library (`pubchempy>=1.0.4`)
**License:** Public domain (US government data)
**Rate Limit:** 5 requests/second

### Usage

Query by PubChem CID (from HERB 2.0 data) to retrieve:

- `canonical_smiles` — canonical SMILES string
- `molecular_weight` — molecular weight
- `molecular_formula` — chemical formula
- `iupac_name` — IUPAC systematic name
- `synonyms` — alternative names
- `xlogp` — partition coefficient

### Notes

- No bulk download needed — query on-demand per ingredient
- Used in `enrich_pubchem.py` to fill missing molecular data on `tcm_ingredient` and `herb` nodes
- Respect rate limit: 5 req/sec with exponential backoff on 429 responses

---

## Data Flow Overview

```
HERB 2.0 CSVs ──► ingest_herb2.py ──► Drupal JSON:API
                                          ├── herb (enriched fields)
                                          ├── tcm_ingredient
                                          ├── tcm_target_interaction
                                          └── tcm_clinical_evidence

BATMAN-TCM CSVs ──► ingest_batman.py ──► tcm_target_interaction (predicted)

PubChem API ──► enrich_pubchem.py ──► PATCH herb + tcm_ingredient

FooDB CSVs ──► (future) ──► nutritional enrichment
```

---

## References

1. Fang S, et al. "HERB: a high-throughput experiment- and reference-guided database of traditional Chinese medicine." *Nucleic Acids Research*. 2021;49(D1):D1197-D1206.
2. Liu Z, et al. "BATMAN-TCM 2.0: an enhanced integrative database for known and predicted interactions between traditional Chinese medicine ingredients and target proteins." *Nucleic Acids Research*. 2021.
3. Wishart DS, et al. "FooDB: The Food Database." 2024.
4. Kim S, et al. "PubChem 2023 update." *Nucleic Acids Research*. 2023;51(D1):D1373-D1380.
