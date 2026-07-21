import { describe, expect, test } from '@jest/globals';
import { estimateTime } from '../../lib/timeEstimate';
import TestContext from '../test-utils/TestContext';

describe('Time estimation edge cases', () => {
  const testContext = new TestContext();

  test('24-hour rounding on boundary minutes', () => {
    testContext.setPrecision(0); // Round to nearest hour
    const result1 = estimateTime(1440000); // 40 minutes
    expect(result1).toBe(1); // Should round to 1 hour

    const result2 = estimateTime(86400000); // 24 hours
    expect(result2).toBe(24); // Exact 24 hours
  });

  test('timezone-aware session completion (spring forward)', () => {
    testContext.setTZ('America/Los_Angeles');
    const start = new Date('2024-03-09T01:59:00');
    const end = new Date('2024-03-09T03:00:00'); // Includes DST jump
    const duration = estimateTime(end.getTime() - start.getTime());
    expect(duration).toBe(2); // Should account for time jump
  });
});