import { describe, expect, test } from '@jest/globals';
import { calculateRecurrence } from '../../lib/recurrence';
import TestContext from '../test-utils/TestContext';

describe('Recurrence edge cases', () => {
  const testContext = new TestContext();

  test('handles timezone transition (spring forward)', () => {
    testContext.setTZ('America/New_York');
    const base = new Date('2024-03-09T02:00:00');
    const result = calculateRecurrence('monthly', { interval: 1, start: base });
    expect(result).not.toBeUndefined();
  });

  test('handles leap year recurrence', () => {
    const base = new Date('2024-02-29T12:00:00');
    const result = calculateRecurrence('yearly', { interval: 1, start: base });
    expect(result).toBe('2025-02-28T12:00:00');
  });

  test('handles irregular recurrence pattern', () => {
    const base = new Date('2024-01-01T00:00:00');
    const result = calculateRecurrence('every 2 weeks on Thursday', { interval: 2, dayOfWeek: 4, start: base });
    expect(result).not.toBeUndefined();
  });
});