import { escapeHtml, sanitizeHtml, sanitizeText, sanitizeForJson, sanitizeUrl } from '@/lib/sanitize';

describe('Sanitization Utilities', () => {
  describe('escapeHtml', () => {
    it('escapes angle brackets', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('escapes ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('returns empty for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('removes script tags', () => {
      expect(sanitizeHtml('<p>Hello</p><script>alert("xss")</script>')).toBe('<p>Hello</p>');
    });

    it('removes style tags', () => {
      expect(sanitizeHtml('<p>Hello</p><style>body{display:none}</style>')).toBe('<p>Hello</p>');
    });

    it('removes event handlers', () => {
      const result = sanitizeHtml('<div onclick="alert(1)">Click</div>');
      expect(result).not.toContain('onclick');
    });

    it('removes javascript: URLs', () => {
      const result = sanitizeHtml('<a href="javascript:alert(1)">Click</a>');
      expect(result).not.toContain('javascript:');
    });

    it('preserves allowed tags', () => {
      expect(sanitizeHtml('<p>Hello <strong>world</strong></p>')).toBe(
        '<p>Hello <strong>world</strong></p>'
      );
    });

    it('returns empty for null/undefined input', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('escapes HTML in plain text', () => {
      expect(sanitizeText('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
    });

    it('trims whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('returns empty for null input', () => {
      expect(sanitizeText(null as any)).toBe('');
    });
  });

  describe('sanitizeForJson', () => {
    it('removes null bytes from strings', () => {
      expect(sanitizeForJson('hello\x00world')).toBe('helloworld');
    });

    it('sanitizes nested objects', () => {
      const result = sanitizeForJson({ key: 'val\x00ue' }) as any;
      expect(result.key).toBe('value');
    });

    it('sanitizes arrays', () => {
      const result = sanitizeForJson(['a\x00b', 'c']) as string[];
      expect(result[0]).toBe('ab');
      expect(result[1]).toBe('c');
    });

    it('passes through numbers and booleans', () => {
      expect(sanitizeForJson(42)).toBe(42);
      expect(sanitizeForJson(true)).toBe(true);
    });
  });

  describe('sanitizeUrl', () => {
    it('allows relative URLs', () => {
      expect(sanitizeUrl('/herbs/123')).toBe('/herbs/123');
    });

    it('allows hash URLs', () => {
      expect(sanitizeUrl('#section')).toBe('#section');
    });

    it('allows https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('blocks javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('blocks data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<h1>test</h1>')).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(sanitizeUrl('')).toBeNull();
    });
  });
});
