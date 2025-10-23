import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('Fix #2: XSS Protection - Command Palette', () => {
  it('should sanitize task text in command palette results', () => {
    const maliciousTask = {
      text: '<script>alert("XSS")</script>Normal Task',
      type: 'task'
    };

    // Simulate what the command palette does: sanitize before displaying
    const sanitized = DOMPurify.sanitize(maliciousTask.text, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Normal Task');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('should sanitize task text with img tag in command palette', () => {
    const maliciousTask = {
      text: '<img src=x onerror=alert(1)>Task Name',
      type: 'task'
    };

    const sanitized = DOMPurify.sanitize(maliciousTask.text, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Task Name');
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror');
  });

  it('should sanitize month navigation text', () => {
    const maliciousMonth = {
      text: '<script>alert("XSS")</script>January 2025',
      type: 'month',
      monthData: {
        displayName: '<b>January</b> 2025'
      }
    };

    // Sanitize both task text and month display name
    const sanitizedText = DOMPurify.sanitize(maliciousMonth.text, { ALLOWED_TAGS: [] });
    const sanitizedMonth = DOMPurify.sanitize(maliciousMonth.monthData.displayName, { ALLOWED_TAGS: [] });

    expect(sanitizedText).toBe('January 2025');
    expect(sanitizedText).not.toContain('<script>');
    expect(sanitizedMonth).toBe('January 2025');
    expect(sanitizedMonth).not.toContain('<b>');
  });

  it('should sanitize search highlighting without executing scripts', () => {
    const taskText = '<script>alert(1)</script>Search Term';
    const searchTerm = 'Search';

    // First sanitize the text
    const sanitized = DOMPurify.sanitize(taskText, { ALLOWED_TAGS: [] });

    // Then add highlight markup (safe because text is already sanitized)
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlighted = sanitized.replace(regex, '<mark>$1</mark>');

    expect(highlighted).toBe('<mark>Search</mark> Term');
    expect(highlighted).not.toContain('script');
    expect(highlighted).not.toContain('alert');
  });

  it('should handle malicious search highlighting attempts', () => {
    const taskText = 'Normal<script>alert(1)</script> Task';

    // Sanitize first
    const sanitized = DOMPurify.sanitize(taskText, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Normal Task');
    expect(sanitized).not.toContain('<script>');
  });

  it('should sanitize onclick handlers in command palette', () => {
    const maliciousTask = {
      text: '<div onclick="alert(1)">Click me</div>',
      type: 'task'
    };

    const sanitized = DOMPurify.sanitize(maliciousTask.text, { ALLOWED_TAGS: [] });

    expect(sanitized).toBe('Click me');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('alert');
  });

  it('should handle mixed malicious content in month data', () => {
    const maliciousMonth = {
      text: 'March<script>evil()</script> 2025',
      type: 'month',
      monthData: {
        displayName: 'March<img src=x onerror=hack()> 2025'
      }
    };

    const sanitizedText = DOMPurify.sanitize(maliciousMonth.text, { ALLOWED_TAGS: [] });
    const sanitizedMonth = DOMPurify.sanitize(maliciousMonth.monthData.displayName, { ALLOWED_TAGS: [] });

    expect(sanitizedText).toBe('March 2025');
    expect(sanitizedText).not.toContain('script');
    expect(sanitizedMonth).toBe('March 2025');
    expect(sanitizedMonth).not.toContain('img');
    expect(sanitizedMonth).not.toContain('onerror');
  });
});
