/**
 * WCAG AA Color Contrast Audit
 *
 * Tests that all color combinations used in the DesignSystem and Tailwind config
 * meet WCAG 2.1 AA contrast requirements:
 * - Normal text (< 18pt): 4.5:1 ratio
 * - Large text (>= 18pt / 14pt bold): 3:1 ratio
 * - UI components & graphical objects: 3:1 ratio
 */

// --- Contrast ratio math (WCAG 2.0 algorithm) ---

/** Parse a hex color (#RRGGBB) into [R, G, B] 0-255 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Relative luminance per WCAG 2.0 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two hex colors */
function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// --- Custom color palette (from tailwind.config.ts) ---

const earth = {
  50: '#f5f8f5',
  100: '#e6ede6',
  200: '#cdd9cd',
  300: '#adbfad',
  400: '#7a9a7a',
  500: '#5f7d5f',
  600: '#577256',
  700: '#4d6a4d',
  800: '#3d5a3d',
  900: '#2d4a2d',
  950: '#1a2e1a',
};

const sage = {
  50: '#f3f9f4',
  100: '#e7f3e9',
  200: '#c8dbcd',
  300: '#a9c2b1',
  400: '#8aaa95',
  500: '#6b9279',
  600: '#527a5f',
  700: '#426650',
  800: '#365340',
  900: '#2a4030',
  950: '#1e2d20',
};

const gold = {
  50: '#faf4ed',
  100: '#f5e9d8',
  200: '#ead3b0',
  300: '#dfbd88',
  400: '#e0b589',
  500: '#d4a574',
  600: '#c8955f',
  700: '#855f30',
  800: '#85602e',
  900: '#644817',
};

const warm = {
  50: '#fef7f6',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#c25b56',
  600: '#dc2626',
  700: '#991b1b',
};

const cream = {
  50: '#fffef9',
  100: '#fefcf3',
  200: '#faf6e8',
  300: '#f5edd8',
  400: '#efe4c8',
};

// Tailwind built-in colors used in our design system
const amber = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  600: '#d97706',
  800: '#92400e',
  900: '#78350f',
};

const red = {
  50: '#fef2f2',
  100: '#fee2e2',
  800: '#991b1b',
};

const green = {
  100: '#dcfce7',
  700: '#15803d',
};

const gray = {
  100: '#f3f4f6',
  600: '#4b5563',
  800: '#1f2937',
};

const white = '#ffffff';

// --- Minimum ratios ---
const AA_NORMAL = 4.5; // normal text
const AA_LARGE = 3.0;  // large text (18pt+) & UI components

// --- Test helpers ---

interface ColorCombo {
  name: string;
  fg: string;
  bg: string;
  isLargeText?: boolean;
}

function getMinRatio(combo: ColorCombo): number {
  return combo.isLargeText ? AA_LARGE : AA_NORMAL;
}

// --- Color combinations used in the codebase ---

const tagCombinations: ColorCombo[] = [
  // Tag component variants (DesignSystem.tsx:128-141)
  { name: 'Tag sage: sage-800 on sage-100', fg: sage[800], bg: sage[100] },
  { name: 'Tag earth: earth-800 on earth-100', fg: earth[800], bg: earth[100] },
  { name: 'Tag amber: amber-800 on amber-100', fg: amber[800], bg: amber[100] },
  { name: 'Tag gray: gray-800 on gray-100', fg: gray[800], bg: gray[100] },
  { name: 'Tag gold: gold-700 on gold-100', fg: gold[700], bg: gold[100] },
  { name: 'Tag warm: warm-700 on warm-100', fg: warm[700], bg: warm[100] },
  { name: 'Tag muted: gray-600 on gray-100', fg: gray[600], bg: gray[100] },
];

const sectionTitleCombinations: ColorCombo[] = [
  // Section title colors (DesignSystem.tsx:79-87) — these are large text (text-2xl+)
  { name: 'Section default: earth-800 on white', fg: earth[800], bg: white, isLargeText: true },
  { name: 'Section warning: red-800 on red-50', fg: red[800], bg: red[50], isLargeText: true },
  { name: 'Section tcm: amber-900 on amber-50', fg: amber[900], bg: amber[50], isLargeText: true },
  { name: 'Section cultural: earth-800 on sage-50', fg: earth[800], bg: sage[50], isLargeText: true },
  { name: 'Section feature: earth-900 on earth-50', fg: earth[900], bg: earth[50], isLargeText: true },
  { name: 'Section card: earth-800 on white', fg: earth[800], bg: white, isLargeText: true },
  { name: 'Section botanical: earth-800 on cream-50', fg: earth[800], bg: cream[50], isLargeText: true },
];

const bodyCombinations: ColorCombo[] = [
  // Common body text patterns
  { name: 'Body text: earth-700 on white', fg: earth[700], bg: white },
  { name: 'Body text: earth-600 on white', fg: earth[600], bg: white },
  { name: 'Body text: earth-600 on earth-50', fg: earth[600], bg: earth[50] },
  { name: 'Body text: earth-700 on sage-50', fg: earth[700], bg: sage[50] },
  { name: 'Body text: sage-600 on white', fg: sage[600], bg: white },
  { name: 'Prose default: gray-700 (#374151) on white', fg: '#374151', bg: white },
];

const disclaimerCombinations: ColorCombo[] = [
  // DisclaimerBox (DesignSystem.tsx:322-333)
  { name: 'Disclaimer title: amber-900 on amber-50', fg: amber[900], bg: amber[50] },
  { name: 'Disclaimer body: amber-800 on amber-50', fg: amber[800], bg: amber[50] },
];

const heroCombinations: ColorCombo[] = [
  // Hero headings (large text)
  { name: 'Hero heading: earth-900 on earth-50', fg: earth[900], bg: earth[50], isLargeText: true },
  { name: 'Hero heading: earth-900 on white', fg: earth[900], bg: white, isLargeText: true },
  { name: 'Hero subtitle: earth-600 on earth-50', fg: earth[600], bg: earth[50], isLargeText: true },
];

const badgeCombinations: ColorCombo[] = [
  // Editor's Pick badge (conditions/herbs)
  { name: "Editor's Pick: amber-800 on amber-100", fg: amber[800], bg: amber[100] },
  // Self-treatable badges
  { name: 'Self-treatable: green-700 on green-100', fg: green[700], bg: green[100] },
];

const linkCombinations: ColorCombo[] = [
  // Links
  { name: 'Link: sage-600 on white', fg: sage[600], bg: white },
  { name: 'Link: earth-600 on white', fg: earth[600], bg: white },
  { name: 'Back link: earth-600 on white', fg: earth[600], bg: white },
];

const tableCombinations: ColorCombo[] = [
  // TableOfContents
  { name: 'TOC label: earth-500 on white', fg: earth[500], bg: white },
  { name: 'TOC items: earth-600 on white', fg: earth[600], bg: white },
  // Scroll indicator
  { name: 'Scroll text: earth-400 on white', fg: earth[400], bg: white, isLargeText: true },
];

// --- Tests ---

describe('WCAG AA Color Contrast Audit', () => {
  describe('Tag component variants', () => {
    tagCombinations.forEach((combo) => {
      it(`${combo.name} meets ${combo.isLargeText ? '3:1' : '4.5:1'} ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        const minRequired = getMinRatio(combo);
        expect(ratio).toBeGreaterThanOrEqual(minRequired);
      });
    });
  });

  describe('Section title colors', () => {
    sectionTitleCombinations.forEach((combo) => {
      it(`${combo.name} meets ${combo.isLargeText ? '3:1' : '4.5:1'} ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        const minRequired = getMinRatio(combo);
        expect(ratio).toBeGreaterThanOrEqual(minRequired);
      });
    });
  });

  describe('Body text combinations', () => {
    bodyCombinations.forEach((combo) => {
      it(`${combo.name} meets 4.5:1 ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    });
  });

  describe('Disclaimer box', () => {
    disclaimerCombinations.forEach((combo) => {
      it(`${combo.name} meets 4.5:1 ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    });
  });

  describe('Hero section', () => {
    heroCombinations.forEach((combo) => {
      it(`${combo.name} meets ${combo.isLargeText ? '3:1' : '4.5:1'} ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        const minRequired = getMinRatio(combo);
        expect(ratio).toBeGreaterThanOrEqual(minRequired);
      });
    });
  });

  describe('Badge and pill combinations', () => {
    badgeCombinations.forEach((combo) => {
      it(`${combo.name} meets 4.5:1 ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    });
  });

  describe('Links', () => {
    linkCombinations.forEach((combo) => {
      it(`${combo.name} meets 4.5:1 ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    });
  });

  describe('Navigation & UI elements', () => {
    tableCombinations.forEach((combo) => {
      it(`${combo.name} meets ${combo.isLargeText ? '3:1' : '4.5:1'} ratio`, () => {
        const ratio = contrastRatio(combo.fg, combo.bg);
        const minRequired = getMinRatio(combo);
        expect(ratio).toBeGreaterThanOrEqual(minRequired);
      });
    });
  });

  describe('Contrast ratio calculation sanity checks', () => {
    it('black on white = 21:1', () => {
      expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    });

    it('white on white = 1:1', () => {
      expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 0);
    });

    it('is symmetric (order of fg/bg does not matter)', () => {
      const ratio1 = contrastRatio(earth[800], white);
      const ratio2 = contrastRatio(white, earth[800]);
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });
  });
});
