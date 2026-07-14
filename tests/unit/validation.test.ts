import { describe, it, expect } from 'vitest';
import { taskSchema, listSchema, labelSchema, commentSchema, validateRequest } from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('Task Schema', () => {
    it('accepts valid task', () => {
      const valid = { title: 'Test Task', description: 'A test task', status: 'todo' };
      const result = validateRequest(taskSchema, valid);
      expect(result).toEqual(valid);
    });

    it('rejects missing title', () => {
      const invalid = { description: 'A test task' };
      expect(() => validateRequest(taskSchema, invalid)).toThrow();
    });

    it('rejects too long title', () => {
      const invalid = { title: 'a'.repeat(201) };
      expect(() => validateRequest(taskSchema, invalid)).toThrow();
    });

    it('accepts valid status values', () => {
      ['todo', 'in_progress', 'review', 'completed'].forEach(status => {
        const valid = { title: 'Test', status };
        expect(() => validateRequest(taskSchema, valid)).not.toThrow();
      });
    });

    it('rejects invalid status', () => {
      const invalid = { title: 'Test', status: 'invalid' };
      expect(() => validateRequest(taskSchema, invalid)).toThrow();
    });
  });

  describe('List Schema', () => {
    it('accepts valid list', () => {
      const valid = { name: 'Test List', color: '#FF5733' };
      const result = validateRequest(listSchema, valid);
      expect(result).toEqual(valid);
    });

    it('rejects invalid color format', () => {
      const invalid = { name: 'Test List', color: 'not-hex' };
      expect(() => validateRequest(listSchema, invalid)).toThrow();
    });
  });

  describe('Label Schema', () => {
    it('accepts valid label', () => {
      const valid = { name: 'Important', color: '#FF0000' };
      const result = validateRequest(labelSchema, valid);
      expect(result).toEqual(valid);
    });

    it('rejects invalid color format', () => {
      const invalid = { name: 'Test', color: 'red' };
      expect(() => validateRequest(labelSchema, invalid)).toThrow();
    });
  });

  describe('Comment Schema', () => {
    it('accepts valid comment', () => {
      const valid = { content: 'Test comment', author: 'Test User', taskId: 'task-123' };
      const result = validateRequest(commentSchema, valid);
      expect(result).toEqual(valid);
    });

    it('rejects empty content', () => {
      const invalid = { content: '', author: 'Test User', taskId: 'task-123' };
      expect(() => validateRequest(commentSchema, invalid)).toThrow();
    });

    it('rejects missing taskId', () => {
      const invalid = { content: 'Test comment', author: 'Test User' };
      expect(() => validateRequest(commentSchema, invalid)).toThrow();
    });
  });
});