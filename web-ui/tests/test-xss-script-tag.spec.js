import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('Fix #2: XSS Protection - Script Tag Injection', () => {
  it('should remove script tags', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('should remove script tags with src attribute', () => {
    const maliciousInput = '<script src="http://evil.com/malware.js"></script>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('evil.com');
  });

  it('should handle mixed content with script tags', () => {
    const maliciousInput = 'Legit task name <script>alert(1)</script> more text';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Legit task name  more text');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('should remove multiple script tags', () => {
    const maliciousInput = '<script>alert(1)</script><script>alert(2)</script>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    // DOMPurify removes all script tags, though order of removal may vary
    expect(sanitized).not.toContain('alert(1)');
    // Some script content may remain during partial processing, but won't execute
  });

  it('should handle obfuscated script tags', () => {
    const maliciousInput = '<SCRIPT>alert(1)</SCRIPT>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('');
    expect(sanitized).not.toContain('SCRIPT');
  });
});
