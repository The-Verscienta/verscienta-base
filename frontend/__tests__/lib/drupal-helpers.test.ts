import { getTextValue, getProcessedValue, hasTextContent } from '@/lib/drupal-helpers';

describe('drupal-helpers', () => {
  describe('getTextValue', () => {
    it('returns empty string for null/undefined', () => {
      expect(getTextValue(null as any)).toBe('');
      expect(getTextValue(undefined as any)).toBe('');
    });

    it('returns string as-is', () => {
      expect(getTextValue('Hello world')).toBe('Hello world');
    });

    it('extracts .value from object', () => {
      expect(getTextValue({ value: 'Some text', format: 'full_html', processed: '<p>Some text</p>' })).toBe('Some text');
    });

    it('returns empty string when object has no value', () => {
      expect(getTextValue({ format: 'full_html' } as any)).toBe('');
    });
  });

  describe('getProcessedValue', () => {
    it('returns empty string for null/undefined', () => {
      expect(getProcessedValue(null as any)).toBe('');
      expect(getProcessedValue(undefined as any)).toBe('');
    });

    it('returns string as-is', () => {
      expect(getProcessedValue('<p>Hello</p>')).toBe('<p>Hello</p>');
    });

    it('prefers .processed over .value', () => {
      expect(getProcessedValue({
        value: 'raw',
        processed: '<p>processed</p>',
        format: 'full_html',
      })).toBe('<p>processed</p>');
    });

    it('falls back to .value when .processed is missing', () => {
      expect(getProcessedValue({ value: 'fallback' } as any)).toBe('fallback');
    });
  });

  describe('hasTextContent', () => {
    it('returns false for null/undefined', () => {
      expect(hasTextContent(null as any)).toBe(false);
      expect(hasTextContent(undefined as any)).toBe(false);
    });

    it('returns true for non-empty string', () => {
      expect(hasTextContent('content')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(hasTextContent('')).toBe(false);
    });

    it('returns true when object has .value', () => {
      expect(hasTextContent({ value: 'text', format: 'plain_text', processed: '' })).toBe(true);
    });

    it('returns false when object has empty .value', () => {
      expect(hasTextContent({ value: '', format: 'plain_text', processed: '' })).toBe(false);
    });
  });
});
