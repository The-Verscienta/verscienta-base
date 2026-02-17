<?php

/**
 * @file
 * Verscienta Health - Sample Content Creation Script
 *
 * Creates sample herbs, modalities, conditions, practitioners, and formulas
 * for testing and development. Uses Drupal's Node API.
 *
 * Run via: ddev drush php:script scripts/create-sample-content.php
 * (from backend/ directory, or: ddev exec "cd /var/www/html/backend && drush php:script scripts/create-sample-content.php")
 */

use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;

// Ensure we're bootstrapped (drush php:script does this automatically).
$created = ['herbs' => 0, 'modalities' => 0, 'conditions' => 0, 'practitioners' => 0, 'formulas' => 0];

/**
 * Check if a node with the given title and type already exists.
 */
function node_exists(string $title, string $type): bool {
  $nodes = \Drupal::entityTypeManager()
    ->getStorage('node')
    ->loadByProperties(['title' => $title, 'type' => $type]);
  return !empty($nodes);
}

/**
 * Create an herb node.
 */
function create_herb(array $data): ?int {
  if (node_exists($data['title'], 'herb')) {
    return null;
  }
  $body = $data['body'] ?? '';
  $values = [
    'type' => 'herb',
    'title' => $data['title'],
    'field_scientific_name' => $data['scientific_name'] ?? '',
    'field_family' => $data['family'] ?? '',
    'field_genus' => $data['genus'] ?? '',
    'field_species' => $data['species'] ?? '',
    'field_plant_type' => $data['plant_type'] ?? 'herb',
    'field_parts_used' => $data['parts_used'] ?? [],
    'field_native_region' => $data['native_region'] ?? [],
    'field_habitat' => $data['habitat'] ?? '',
    'field_botanical_description' => $data['botanical_description'] ?? '',
    'field_conservation_status' => $data['conservation_status'] ?? 'least_concern',
    'field_tcm_taste' => $data['tcm_taste'] ?? [],
    'field_tcm_temperature' => $data['tcm_temperature'] ?? '',
    'field_tcm_meridians' => $data['tcm_meridians'] ?? [],
    'field_tcm_functions' => $data['tcm_functions'] ?? '',
    'field_therapeutic_uses' => $data['therapeutic_uses'] ?? '',
    'field_western_properties' => $data['western_properties'] ?? [],
    'field_contraindications' => $data['contraindications'] ?? '',
    'field_side_effects' => $data['side_effects'] ?? '',
    'field_traditional_chinese_uses' => $data['traditional_chinese_uses'] ?? '',
    'field_traditional_american_uses' => $data['traditional_american_uses'] ?? '',
    'field_cultural_significance' => $data['cultural_significance'] ?? '',
    'field_folklore' => $data['folklore'] ?? '',
    'field_dosage_forms' => $data['dosage_forms'] ?? [],
    'field_herb_id' => $data['herb_id'] ?? '',
    'field_peer_review_status' => $data['peer_review_status'] ?? 'published',
  ];
  if ($body && empty($values['field_botanical_description'])) {
    $values['field_botanical_description'] = $body;
  }
  try {
    $node = Node::create($values);
    $node->save();
    return (int) $node->id();
  } catch (\Exception $e) {
    echo "  Error creating {$data['title']}: " . $e->getMessage() . "\n";
    return null;
  }
}

/**
 * Create a modality node.
 */
function create_modality(string $title, string $description): ?int {
  if (node_exists($title, 'modality')) {
    return null;
  }
  $values = [
    'type' => 'modality',
    'title' => $title,
    'field_description' => $description,
    'field_benefits' => $description,
  ];
  try {
    $node = Node::create($values);
    $node->save();
    return (int) $node->id();
  } catch (\Exception $e) {
    echo "  Error creating $title: " . $e->getMessage() . "\n";
    return null;
  }
}

/**
 * Create a condition node.
 */
function create_condition(string $title, string $description): ?int {
  if (node_exists($title, 'condition')) {
    return null;
  }
  $values = [
    'type' => 'condition',
    'title' => $title,
    'field_condition_description' => $description,
    'field_symptoms' => [],
    'field_severity' => 'moderate',
  ];
  try {
    $node = Node::create($values);
    $node->save();
    return (int) $node->id();
  } catch (\Exception $e) {
    echo "  Error creating $title: " . $e->getMessage() . "\n";
    return null;
  }
}

/**
 * Create a practitioner node.
 */
function create_practitioner(string $title, string $bio, array $extra = []): ?int {
  if (node_exists($title, 'practitioner')) {
    return null;
  }
  $values = array_merge([
    'type' => 'practitioner',
    'title' => $title,
    'field_bio' => $bio,
  ], $extra);
  try {
    $node = Node::create($values);
    $node->save();
    return (int) $node->id();
  } catch (\Exception $e) {
    echo "  Error creating $title: " . $e->getMessage() . "\n";
    return null;
  }
}

/**
 * Create a formula node.
 */
function create_formula(string $title, string $description, string $preparation = ''): ?int {
  if (node_exists($title, 'formula')) {
    return null;
  }
  $values = [
    'type' => 'formula',
    'title' => $title,
    'field_formula_description' => $description,
    'field_preparation_instructions' => $preparation,
  ];
  try {
    $node = Node::create($values);
    $node->save();
    return (int) $node->id();
  } catch (\Exception $e) {
    echo "  Error creating $title: " . $e->getMessage() . "\n";
    return null;
  }
}

// ---------------------------------------------------------------------------
// HERBS
// ---------------------------------------------------------------------------
$herbs = [
  [
    'title' => 'Astragalus',
    'herb_id' => 'H-0001',
    'scientific_name' => 'Astragalus membranaceus',
    'family' => 'Fabaceae',
    'genus' => 'Astragalus',
    'species' => 'membranaceus',
    'plant_type' => 'herb',
    'parts_used' => ['root'],
    'native_region' => ['East Asia', 'Mongolia', 'Northern China'],
    'conservation_status' => 'least_concern',
    'tcm_taste' => ['sweet'],
    'tcm_temperature' => 'warm',
    'tcm_meridians' => ['lung', 'spleen'],
    'tcm_functions' => 'Tonifies Qi, raises Yang, strengthens the exterior, promotes urination, expels pus.',
    'western_properties' => ['adaptogen', 'tonic', 'immunomodulator'],
    'therapeutic_uses' => 'Immune support, fatigue, frequent colds, heart health, kidney support.',
    'contraindications' => 'Avoid in acute infections. Use caution with autoimmune conditions. May interact with immunosuppressants.',
    'dosage_forms' => ['decoction', 'tincture', 'capsule', 'powder'],
    'body' => "Astragalus membranaceus, commonly known as Huang Qi in Traditional Chinese Medicine, is one of the most important tonic herbs in the Chinese pharmacopoeia. It has been used for over 2000 years to strengthen the body's vital energy (Qi) and support immune function.\n\nThe root is harvested from plants that are at least four years old and is traditionally sliced and dried for use in decoctions, powders, and extracts.",
    'traditional_chinese_uses' => "Huang Qi (黄芪) is used to tonify Spleen Qi, raise Spleen Yang, and secure the exterior. It is a key herb for spontaneous sweating due to Qi deficiency.",
    'cultural_significance' => "One of the 50 fundamental herbs in TCM. The name Huang Qi means 'yellow leader,' referring to the yellow core of the root and its premier status.",
  ],
  [
    'title' => 'Ginkgo Biloba',
    'herb_id' => 'H-0002',
    'scientific_name' => 'Ginkgo biloba',
    'family' => 'Ginkgoaceae',
    'genus' => 'Ginkgo',
    'species' => 'biloba',
    'plant_type' => 'tree',
    'parts_used' => ['leaf', 'seed'],
    'native_region' => ['China'],
    'conservation_status' => 'endangered',
    'tcm_taste' => ['sweet', 'bitter'],
    'tcm_temperature' => 'neutral',
    'tcm_meridians' => ['lung', 'heart'],
    'western_properties' => ['antioxidant', 'circulatory', 'nootropic'],
    'therapeutic_uses' => 'Cognitive support, circulation, tinnitus, vertigo.',
    'contraindications' => 'Avoid with blood thinners. May increase bleeding risk. Raw seeds are toxic.',
    'dosage_forms' => ['extract', 'capsule', 'tablet'],
    'body' => "Ginkgo biloba is one of the oldest living tree species, often called a 'living fossil.' The fan-shaped leaves have been used in Traditional Chinese Medicine for thousands of years and are now one of the most researched herbs worldwide.\n\nModern research has focused on its effects on circulation, cognitive function, and its potent antioxidant properties.",
  ],
  [
    'title' => 'Ashwagandha',
    'herb_id' => 'H-0003',
    'scientific_name' => 'Withania somnifera',
    'family' => 'Solanaceae',
    'genus' => 'Withania',
    'species' => 'somnifera',
    'plant_type' => 'herb',
    'parts_used' => ['root'],
    'native_region' => ['India', 'Middle East'],
    'conservation_status' => 'least_concern',
    'western_properties' => ['adaptogen', 'tonic', 'sedative'],
    'therapeutic_uses' => 'Stress, anxiety, fatigue, sleep, thyroid support.',
    'contraindications' => 'Avoid in pregnancy. Use caution with thyroid medications and sedatives.',
    'dosage_forms' => ['capsule', 'powder', 'tincture'],
    'body' => "Ashwagandha (Withania somnifera), also known as Indian Ginseng, is one of the most important herbs in Ayurveda. It is classified as a Rasayana (rejuvenating tonic) and is known for its adaptogenic properties.\n\nThe name 'ashwagandha' means 'smell of the horse,' referring to its reputation for imparting strength and vitality.",
  ],
  [
    'title' => 'Turmeric',
    'herb_id' => 'H-0004',
    'scientific_name' => 'Curcuma longa',
    'family' => 'Zingiberaceae',
    'genus' => 'Curcuma',
    'species' => 'longa',
    'plant_type' => 'herb',
    'parts_used' => ['rhizome'],
    'native_region' => ['South Asia'],
    'conservation_status' => 'least_concern',
    'tcm_taste' => ['pungent', 'bitter'],
    'tcm_temperature' => 'warm',
    'tcm_meridians' => ['liver', 'spleen'],
    'western_properties' => ['anti-inflammatory', 'antioxidant'],
    'therapeutic_uses' => 'Inflammation, joint health, digestive support.',
    'contraindications' => 'May increase bile secretion. Use caution with gallbladder issues.',
    'dosage_forms' => ['capsule', 'powder', 'extract'],
    'body' => "Turmeric (Curcuma longa) is a flowering plant of the ginger family. The rhizomes are used both as a culinary spice and in traditional medicine. The primary active compound, curcumin, has been extensively studied for its anti-inflammatory and antioxidant properties.",
  ],
  [
    'title' => 'Elderberry',
    'herb_id' => 'H-0005',
    'scientific_name' => 'Sambucus nigra',
    'family' => 'Adoxaceae',
    'genus' => 'Sambucus',
    'species' => 'nigra',
    'plant_type' => 'shrub',
    'parts_used' => ['berry', 'flower'],
    'native_region' => ['Europe', 'North America'],
    'conservation_status' => 'least_concern',
    'western_properties' => ['immunomodulator', 'antiviral', 'diaphoretic'],
    'therapeutic_uses' => 'Immune support, cold and flu, respiratory health.',
    'contraindications' => 'Raw berries are toxic. Only use properly processed berries.',
    'dosage_forms' => ['syrup', 'tincture', 'capsule'],
    'body' => "Elderberry (Sambucus nigra) has been used for centuries in European folk medicine. The dark purple berries are rich in anthocyanins and have been traditionally used to support immune function, particularly during cold and flu season.",
  ],
  [
    'title' => 'Reishi Mushroom',
    'herb_id' => 'H-0006',
    'scientific_name' => 'Ganoderma lucidum',
    'family' => 'Ganodermataceae',
    'genus' => 'Ganoderma',
    'species' => 'lucidum',
    'plant_type' => 'fungus',
    'parts_used' => ['fruiting_body'],
    'native_region' => ['East Asia'],
    'conservation_status' => 'least_concern',
    'tcm_taste' => ['sweet', 'bitter'],
    'tcm_temperature' => 'neutral',
    'tcm_meridians' => ['heart', 'liver', 'lung'],
    'western_properties' => ['adaptogen', 'immunomodulator'],
    'therapeutic_uses' => 'Immune support, stress, sleep, longevity.',
    'contraindications' => 'Generally well tolerated. May interact with blood thinners.',
    'dosage_forms' => ['extract', 'powder', 'tea'],
    'body' => "Reishi (Ganoderma lucidum), known as Ling Zhi in Chinese, is revered as the 'Mushroom of Immortality' in TCM. It has been used for over 2000 years to promote longevity, support immune function, and calm the spirit.",
  ],
  [
    'title' => 'Echinacea',
    'herb_id' => 'H-0007',
    'scientific_name' => 'Echinacea purpurea',
    'family' => 'Asteraceae',
    'genus' => 'Echinacea',
    'species' => 'purpurea',
    'plant_type' => 'herb',
    'parts_used' => ['root', 'leaf', 'flower'],
    'native_region' => ['North America'],
    'conservation_status' => 'vulnerable',
    'western_properties' => ['immunomodulator', 'antimicrobial'],
    'therapeutic_uses' => 'Immune support, wound healing, respiratory infections.',
    'contraindications' => 'Avoid in autoimmune conditions. Not for long-term use.',
    'dosage_forms' => ['tincture', 'capsule', 'tea'],
    'body' => "Echinacea (Echinacea purpurea) was extensively used by Native American tribes. Today it is one of the most popular herbs in Western herbalism, primarily used to support immune function.",
  ],
  [
    'title' => 'Valerian',
    'herb_id' => 'H-0008',
    'scientific_name' => 'Valeriana officinalis',
    'family' => 'Caprifoliaceae',
    'genus' => 'Valeriana',
    'species' => 'officinalis',
    'plant_type' => 'herb',
    'parts_used' => ['root'],
    'native_region' => ['Europe', 'Asia'],
    'conservation_status' => 'least_concern',
    'western_properties' => ['sedative', 'nervine', 'antispasmodic'],
    'therapeutic_uses' => 'Sleep, anxiety, restlessness.',
    'contraindications' => 'Avoid with sedatives. May cause drowsiness.',
    'dosage_forms' => ['tincture', 'capsule', 'tea'],
    'body' => "Valerian (Valeriana officinalis) has been used since ancient Greek and Roman times for sleep support. The root has a distinctive odor due to its volatile oil content. One of the most researched herbs for sleep support.",
  ],
  [
    'title' => 'Milk Thistle',
    'herb_id' => 'H-0009',
    'scientific_name' => 'Silybum marianum',
    'family' => 'Asteraceae',
    'genus' => 'Silybum',
    'species' => 'marianum',
    'plant_type' => 'herb',
    'parts_used' => ['seed'],
    'native_region' => ['Mediterranean'],
    'conservation_status' => 'least_concern',
    'western_properties' => ['hepatic', 'antioxidant', 'anti-inflammatory'],
    'therapeutic_uses' => 'Liver support, liver protection, detoxification.',
    'contraindications' => 'Generally well tolerated. May cause mild laxative effect.',
    'dosage_forms' => ['capsule', 'tincture', 'extract'],
    'body' => "Milk Thistle (Silybum marianum) has been used for over 2000 years for liver support. The active compound complex, silymarin, is concentrated in the seeds and demonstrates hepatoprotective properties.",
  ],
  [
    'title' => 'Chamomile',
    'herb_id' => 'H-0010',
    'scientific_name' => 'Matricaria chamomilla',
    'family' => 'Asteraceae',
    'genus' => 'Matricaria',
    'species' => 'chamomilla',
    'plant_type' => 'herb',
    'parts_used' => ['flower'],
    'native_region' => ['Europe', 'Western Asia'],
    'conservation_status' => 'least_concern',
    'western_properties' => ['carminative', 'sedative', 'anti-inflammatory'],
    'therapeutic_uses' => 'Digestive upset, relaxation, skin care.',
    'contraindications' => 'Rare allergy in those allergic to Asteraceae family.',
    'dosage_forms' => ['tea', 'tincture', 'capsule'],
    'body' => "Chamomile (Matricaria chamomilla) is one of the oldest and most widely used medicinal plants. The delicate flowers have been used for thousands of years for relaxation, digestive support, and skin care.",
  ],
];

echo "Creating herbs...\n";
foreach ($herbs as $h) {
  $nid = create_herb($h);
  if ($nid) {
    $created['herbs']++;
    echo "  Created: {$h['title']} (nid $nid)\n";
  }
}

// ---------------------------------------------------------------------------
// MODALITIES
// ---------------------------------------------------------------------------
$modalities = [
  ['Traditional Chinese Medicine', "TCM is a comprehensive medical system evolving over 3,000 years. It includes acupuncture, herbal medicine, tai chi, qigong, and dietary therapy. Based on Qi flowing through meridians and the balance of Yin and Yang."],
  ['Ayurveda', "Ayurveda, meaning 'science of life,' originated in India over 5,000 years ago. It emphasizes the interconnection of body, mind, and spirit. Treatment includes herbal medicine, diet, yoga, meditation, and panchakarma."],
  ['Acupuncture', "A key component of TCM involving insertion of thin needles into specific points on the body. Used for pain management, stress reduction, and various health conditions."],
  ['Naturopathy', "A system emphasizing prevention and treatment through therapeutic methods that encourage the body's inherent self-healing. Combines conventional medical sciences with natural therapies."],
  ['Western Herbalism', "The practice of using plants and plant extracts for therapeutic purposes. Draws from European, Native American, and scientific approaches to botanical medicine."],
  ['Homeopathy', "A medical system based on 'like cures like.' Remedies are prepared through serial dilution and succussion. Practitioners match the patient's symptom picture to the appropriate remedy."],
];

echo "\nCreating modalities...\n";
foreach ($modalities as $m) {
  $nid = create_modality($m[0], $m[1]);  // title, description
  if ($nid) {
    $created['modalities']++;
    echo "  Created: $m[0]\n";
  }
}

// ---------------------------------------------------------------------------
// CONDITIONS
// ---------------------------------------------------------------------------
$conditions = [
  ['Insomnia', "A common sleep disorder characterized by difficulty falling or staying asleep. TCM may view it as a disturbance of Shen or deficiency of Blood or Yin. Ayurveda associates it with Vata imbalance."],
  ['Anxiety', "Characterized by persistent worry and unease. Holistic approaches address the mind-body connection using meditation, breathwork, and adaptogenic herbs."],
  ['Digestive Disorders', "Conditions affecting the GI tract including IBS, acid reflux, and bloating. TCM and Ayurveda both emphasize digestive health as the foundation of wellness."],
  ['Chronic Stress', "Occurs when stress systems are constantly activated. Adaptogenic herbs, mind-body practices, and lifestyle modifications form the foundation of holistic stress management."],
  ['Immune System Weakness', "Can result from chronic stress, poor nutrition, or lack of sleep. Immune-modulating herbs and lifestyle practices support the body's defenses."],
  ['Joint Pain and Arthritis', "Includes osteoarthritis and rheumatoid arthritis. Holistic approaches combine anti-inflammatory herbs, dietary modifications, and acupuncture."],
];

echo "\nCreating conditions...\n";
foreach ($conditions as $c) {
  $nid = create_condition($c[0], $c[1]);  // title, description
  if ($nid) {
    $created['conditions']++;
    echo "  Created: $c[0]\n";
  }
}

// ---------------------------------------------------------------------------
// PRACTITIONERS
// ---------------------------------------------------------------------------
$practitioners = [
  ['Dr. Sarah Chen, LAc, DAOM', "Dr. Sarah Chen is a Doctor of Acupuncture and Oriental Medicine with over 15 years of experience. She specializes in women's health, fertility support, and stress-related conditions. She integrates acupuncture, Chinese herbal medicine, and dietary therapy."],
  ['Dr. Michael Torres, ND', "Dr. Michael Torres is a licensed Naturopathic Doctor focusing on digestive health and integrative oncology. He believes in addressing root causes. He works with botanical medicine, nutrition, and lifestyle counseling."],
  ['Dr. Priya Sharma, BAMS, AD', "Dr. Priya Sharma is an Ayurvedic practitioner trained in India. She offers pulse diagnosis, constitutional assessment, dietary recommendations, and panchakarma. Specializes in digestive disorders and stress management."],
  ['Lisa Martinez, RH, AHG', "Lisa Martinez is a Registered Herbalist with over 20 years of experience. She specializes in women's health, stress management, and supporting the body through life transitions. Creates custom herbal formulations."],
];

echo "\nCreating practitioners...\n";
foreach ($practitioners as $p) {
  $nid = create_practitioner($p[0], $p[1]);  // title, bio
  if ($nid) {
    $created['practitioners']++;
    echo "  Created: $p[0]\n";
  }
}

// ---------------------------------------------------------------------------
// FORMULAS
// ---------------------------------------------------------------------------
$formulas = [
  ['Si Jun Zi Tang (Four Gentlemen Decoction)', "Si Jun Zi Tang is one of the most fundamental TCM formulas for tonifying Qi. It consists of Ren Shen, Bai Zhu, Fu Ling, and Zhi Gan Cao. Primary indications: Spleen Qi deficiency with fatigue, poor appetite, loose stools.", "Four-herb Qi tonic formula", "Decoct in water, take warm."],
  ['Liu Wei Di Huang Wan', "Liu Wei Di Huang Wan nourishes Kidney Yin. The formula balances three tonifying herbs (Shu Di Huang, Shan Zhu Yu, Shan Yao) with three draining herbs. Indications: Kidney/Liver Yin deficiency with back pain, dizziness, night sweats.", "Six-ingredient Kidney Yin formula", "Take as pills with warm water."],
  ['Xiao Yao San (Free and Easy Wanderer)', "Xiao Yao San treats Liver Qi stagnation with Blood and Spleen deficiency. Used for stress-related conditions and emotional imbalances. Indications: irritability, mood swings, chest distention, irregular menstruation.", "Liver Qi spreading formula", "Decoct or take as pills."],
  ['Triphala', "Triphala combines three fruits: Amalaki, Bibhitaki, and Haritaki. A revered Ayurvedic formula considered tridoshic. Traditionally used for healthy digestion, regular elimination, and rejuvenation.", "Three-fruit digestive tonic", "Take as powder mixed with warm water, or as tablets."],
];

echo "\nCreating formulas...\n";
foreach ($formulas as $f) {
  $nid = create_formula($f[0], $f[1], $f[3] ?? '');  // title, description, preparation
  if ($nid) {
    $created['formulas']++;
    echo "  Created: $f[0]\n";
  }
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
echo "\n==============================================\n";
echo "Sample Content Creation Complete!\n";
echo "==============================================\n";
echo "Created: {$created['herbs']} herbs, {$created['modalities']} modalities, {$created['conditions']} conditions, {$created['practitioners']} practitioners, {$created['formulas']} formulas\n";
