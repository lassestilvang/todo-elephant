import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server'; // Adjust path as needed
import { validateUserInput } from '../../lib/security';

describe('Tasks API Security', () => {
  test('rejects malformed JSON payloads', async () => {
    const response = await request(app).post('/tasks').send({ invalid: 'json' });
    expect(response.status).toBe(400);
  });

  test('detects SQL injection patterns', async () => {
    const sqlInjection = 'admin\' OR \'1\'=\'1\';--';
    const response = await request(app).post('/tasks').send({ description: sqlInjection });
    expect(response.status).toBe(400);
  });

  test('validates numeric duration type', async () => {
    const response = await request(app).post('/tasks').send({ duration: 'not_a_number' });
    expect(response.status).toBe(400);
  });
});