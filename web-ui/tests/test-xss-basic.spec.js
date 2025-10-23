import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('Fix #2: XSS Protection - Basic HTML Sanitization', () => {
  it('should sanitize basic HTML tags', () => {
    const maliciousInput = '<b>Bold</b> text';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Bold text');
    expect(sanitized).not.toContain('<b>');
    expect(sanitized).not.toContain('</b>');
  });

  it('should sanitize img tags', () => {
    const maliciousInput = '<img src=x onerror=alert(1)>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('');
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror');
  });

  it('should sanitize iframe tags', () => {
    const maliciousInput = '<iframe src="javascript:alert(1)"></iframe>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('');
    expect(sanitized).not.toContain('<iframe');
  });

  it('should preserve plain text', () => {
    const plainText = 'This is normal text without HTML';
    const sanitized = DOMPurify.sanitize(plainText, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe(plainText);
  });

  it('should preserve already-encoded HTML entities', () => {
    const maliciousInput = '&lt;script&gt;alert(1)&lt;/script&gt;';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    // DOMPurify preserves already-encoded entities (doesn't decode them)
    // This is safe behavior - encoded content can't execute
    expect(sanitized).toBe(maliciousInput);
  });
});
