import { describe, expect, test } from '@jest/globals';
import { validateUserInput } from '../../lib/security';


describe('Security validation tests', () => {
  test('rejects non-string input types', () => {
    const invalidTypes = [null, 42, ['invalid'], undefined];
    invalidTypes.forEach(type => {
      expect(validateUserInput(type)).toThrow('Invalid input type');
    });
  });

  test('detects SQL injection patterns', () => {
    const suspiciousInputs = [
      '\'.,
      'SELECT * FROM users WHERE id = ',',
      '1; DROP TABLE tasks;--',
      '; DROP TABLE tasks;#',
      '\"\"// --', // XSS pattern
    ];
    suspiciousInputs.forEach(input => {
      expect(validateUserInput(input)).toThrow('Invalid characters detected');
    });
  });
});