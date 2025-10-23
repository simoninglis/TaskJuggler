import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('Fix #2: XSS Protection - Event Handler Injection', () => {
  it('should remove onerror event handlers', () => {
    const maliciousInput = '<img src=x onerror=alert(1)>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('');
    expect(sanitized).not.toContain('onerror');
  });

  it('should remove onclick event handlers', () => {
    const maliciousInput = '<div onclick="alert(1)">Click me</div>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Click me');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('alert');
  });

  it('should remove onload event handlers', () => {
    const maliciousInput = '<body onload=alert(1)>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('');
    expect(sanitized).not.toContain('onload');
  });

  it('should remove onmouseover event handlers', () => {
    const maliciousInput = '<a onmouseover="alert(1)" href="#">Hover</a>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Hover');
    expect(sanitized).not.toContain('onmouseover');
  });

  it('should handle task text with event handlers', () => {
    const taskText = 'Task <span onclick=alert(1)>name</span> here';
    const sanitized = DOMPurify.sanitize(taskText, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Task name here');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('<span');
  });

  it('should remove javascript: protocol', () => {
    const maliciousInput = '<a href="javascript:alert(1)">Click</a>';
    const sanitized = DOMPurify.sanitize(maliciousInput, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Click');
    expect(sanitized).not.toContain('javascript:');
  });
});
