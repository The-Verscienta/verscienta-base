"""
Field mapping from HERB 2.0 CSV columns to Drupal JSON:API attributes.

Centralizes the column-name → field-name translation and data cleaning.
"""

from utils import safe_float, safe_int, safe_str


def map_herb(row: dict) -> dict:
    """
    Map a row from herbs.csv to Drupal herb node attributes.

    Expected CSV columns (HERB 2.0):
        herb_id, herb_cn_name, herb_pinyin_name, herb_en_name,
        herb_latin_name, Properties
    """
    attrs: dict = {}

    herb2_id = safe_int(row.get("herb_id"))
    if herb2_id is not None:
        attrs["field_herb2_id"] = herb2_id

    # Title: prefer English name, fall back to pinyin
    en_name = safe_str(row.get("herb_en_name"))
    pinyin = safe_str(row.get("herb_pinyin_name"))
    cn_name = safe_str(row.get("herb_cn_name"))
    latin = safe_str(row.get("herb_latin_name"))

    attrs["title"] = en_name or pinyin or cn_name or f"Herb #{herb2_id}"

    if pinyin:
        attrs["field_herb_pinyin_name"] = pinyin
    if latin:
        attrs["field_herb_latin_name"] = latin
        attrs["field_scientific_name"] = latin

    attrs["field_herb_source_dbs"] = ["HERB 2.0"]

    return attrs


def map_ingredient(row: dict) -> dict:
    """
    Map a row from ingredients.csv to Drupal tcm_ingredient attributes.

    Expected CSV columns:
        ingredient_id, ingredient_name, pubchem_cid, cas_number,
        smiles, molecular_weight
    """
    attrs: dict = {}

    ingredient_id = safe_int(row.get("ingredient_id"))
    if ingredient_id is not None:
        attrs["field_ingredient_id"] = ingredient_id

    name = safe_str(row.get("ingredient_name"))
    attrs["title"] = name or f"Ingredient #{ingredient_id}"

    cid = safe_int(row.get("pubchem_cid"))
    if cid is not None:
        attrs["field_pubchem_cid"] = cid

    cas = safe_str(row.get("cas_number"), max_length=50)
    if cas:
        attrs["field_cas_number"] = cas

    smiles = safe_str(row.get("smiles"), max_length=5000)
    if smiles:
        attrs["field_smiles"] = smiles

    mw = safe_float(row.get("molecular_weight"))
    if mw is not None:
        attrs["field_molecular_weight"] = mw

    attrs["field_source_db"] = "HERB 2.0"

    return attrs


def map_target_interaction(row: dict) -> dict:
    """
    Map a row from targets/ingredient_target CSV to Drupal tcm_target_interaction.

    Expected CSV columns:
        target_name, uniprot_id, gene_name, score
    """
    attrs: dict = {}

    target = safe_str(row.get("target_name"))
    gene = safe_str(row.get("gene_name"))

    attrs["title"] = target or gene or "Unknown Target"

    if target:
        attrs["field_target_name"] = target
    if gene:
        attrs["field_gene_name"] = gene

    uniprot = safe_str(row.get("uniprot_id"), max_length=20)
    if uniprot:
        attrs["field_uniprot_id"] = uniprot

    score = safe_float(row.get("score"))
    if score is not None:
        attrs["field_score"] = score

    attrs["field_evidence_type"] = ["experimental"]
    attrs["field_source_db"] = "HERB 2.0"

    return attrs


def map_formula(row: dict) -> dict:
    """
    Map a row from formulae.csv to Drupal formula node attributes.

    Expected CSV columns:
        formula_id, formula_cn_name, formula_pinyin_name, formula_en_name,
        formula_composition
    """
    attrs: dict = {}

    en_name = safe_str(row.get("formula_en_name"))
    pinyin = safe_str(row.get("formula_pinyin_name"))
    cn_name = safe_str(row.get("formula_cn_name"))

    attrs["title"] = en_name or pinyin or cn_name or "Unknown Formula"

    return attrs


def map_clinical_evidence(row: dict) -> dict:
    """
    Map a clinical trials CSV row to Drupal tcm_clinical_evidence attributes.

    Expected CSV columns vary; common ones:
        trial_id, title, study_type, summary, outcome, source_url
    """
    attrs: dict = {}

    evidence_id = safe_str(row.get("trial_id") or row.get("experiment_id"))
    if evidence_id:
        attrs["field_evidence_id"] = evidence_id

    title = safe_str(row.get("title"))
    attrs["title"] = title or f"Evidence {evidence_id}"

    study_type = safe_str(row.get("study_type"))
    if study_type:
        attrs["field_study_type"] = [study_type]

    summary = safe_str(row.get("summary"), max_length=10000)
    if summary:
        attrs["field_summary"] = {"value": summary, "format": "plain_text"}

    outcome = safe_str(row.get("outcome"), max_length=5000)
    if outcome:
        attrs["field_outcome"] = {"value": outcome, "format": "plain_text"}

    url = safe_str(row.get("source_url") or row.get("url"), max_length=2048)
    if url:
        attrs["field_source_url"] = {"uri": url}

    attrs["field_source_db"] = "HERB 2.0"

    return attrs


def map_batman_interaction(row: dict) -> dict:
    """
    Map a BATMAN-TCM row to Drupal tcm_target_interaction attributes.

    Expected columns:
        herb_name, ingredient_name, target_name, score, uniprot_id, gene_symbol
    """
    attrs: dict = {}

    target = safe_str(row.get("target_name"))
    ingredient = safe_str(row.get("ingredient_name"))
    gene = safe_str(row.get("gene_symbol") or row.get("gene_name"))

    attrs["title"] = f"{ingredient or 'Unknown'} → {target or 'Unknown'}"

    if target:
        attrs["field_target_name"] = target
    if gene:
        attrs["field_gene_name"] = gene

    uniprot = safe_str(row.get("uniprot_id"), max_length=20)
    if uniprot:
        attrs["field_uniprot_id"] = uniprot

    score = safe_float(row.get("score"))
    if score is not None:
        attrs["field_score"] = score

    attrs["field_evidence_type"] = ["predicted"]
    attrs["field_source_db"] = "BATMAN-TCM"

    return attrs
