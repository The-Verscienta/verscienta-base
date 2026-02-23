import {
  getFieldConfig,
  getFieldLabel,
  popularityMap,
  selfTreatableMap,
  holisticResponseTimeMap,
  costTierMap,
  formulaCategoryMap,
} from '@/lib/decision-field-maps';

describe('decision-field-maps', () => {
  describe('getFieldConfig', () => {
    it('returns config for known value', () => {
      const config = getFieldConfig(popularityMap, 'staple');
      expect(config).toBeDefined();
      expect(config!.label).toBe('Staple Herb');
      expect(config!.bg).toBe('bg-amber-100');
      expect(config!.text).toBe('text-amber-800');
    });

    it('returns undefined for unknown value', () => {
      expect(getFieldConfig(popularityMap, 'nonexistent')).toBeUndefined();
    });

    it('returns undefined for null', () => {
      expect(getFieldConfig(popularityMap, null)).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      expect(getFieldConfig(popularityMap, undefined)).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(getFieldConfig(popularityMap, '')).toBeUndefined();
    });
  });

  describe('getFieldLabel', () => {
    it('returns label for known value', () => {
      expect(getFieldLabel(selfTreatableMap, 'yes')).toBe('Self-Treatable');
    });

    it('returns humanized value for unknown key', () => {
      expect(getFieldLabel(selfTreatableMap, 'some_unknown_value')).toBe('Some Unknown Value');
    });

    it('returns empty string for null', () => {
      expect(getFieldLabel(selfTreatableMap, null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(getFieldLabel(selfTreatableMap, undefined)).toBe('');
    });

    it('capitalizes each word in fallback', () => {
      expect(getFieldLabel(costTierMap, 'very_expensive_item')).toBe('Very Expensive Item');
    });
  });

  describe('map completeness', () => {
    it('selfTreatableMap has all expected keys', () => {
      expect(Object.keys(selfTreatableMap)).toEqual(
        expect.arrayContaining(['yes', 'with_guidance', 'professional_recommended', 'professional_required'])
      );
    });

    it('holisticResponseTimeMap has all expected keys', () => {
      expect(Object.keys(holisticResponseTimeMap)).toEqual(
        expect.arrayContaining(['days', 'weeks', 'months', 'varies_widely'])
      );
    });

    it('formulaCategoryMap has expected TCM categories', () => {
      expect(Object.keys(formulaCategoryMap)).toEqual(
        expect.arrayContaining(['tonifying', 'clearing_heat', 'regulating_qi', 'blood_invigorating'])
      );
    });

    it('every config has required fields', () => {
      for (const [key, config] of Object.entries(popularityMap)) {
        expect(config.label).toBeTruthy();
        expect(config.bg).toMatch(/^bg-/);
        expect(config.text).toMatch(/^text-/);
      }
    });
  });
});
