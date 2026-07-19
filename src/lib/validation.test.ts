// Validation tests
import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePriority,
  validateStatus,
  validateDate,
  validateTaskForm,
  isValid,
  taskSchema,
  userSchema,
  validateRequest
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('validateRequired', () => {
    it('returns error for empty string', () => {
      expect(validateRequired('', 'Field')).toBe('Field is required');
    });

    it('returns error for null', () => {
      expect(validateRequired(null, 'Field')).toBe('Field is required');
    });

    it('returns error for undefined', () => {
      expect(validateRequired(undefined, 'Field')).toBe('Field is required');
    });

    it('returns null for valid value', () => {
      expect(validateRequired('value', 'Field')).toBeNull();
    });
  });

  describe('validateMinLength', () => {
    it('returns error when too short', () => {
      expect(validateMinLength('ab', 3, 'Field')).toBe('Field must be at least 3 characters');
    });

    it('returns null when exact length', () => {
      expect(validateMinLength('abc', 3, 'Field')).toBeNull();
    });

    it('returns null when longer', () => {
      expect(validateMinLength('abcd', 3, 'Field')).toBeNull();
    });
  });

  describe('validateMaxLength', () => {
    it('returns error when too long', () => {
      expect(validateMaxLength('abcd', 3, 'Field')).toBe('Field must be no more than 3 characters');
    });

    it('returns null when exact length', () => {
      expect(validateMaxLength('abc', 3, 'Field')).toBeNull();
    });

    it('returns null when shorter', () => {
      expect(validateMaxLength('ab', 3, 'Field')).toBeNull();
    });
  });

  describe('validatePriority', () => {
    it('returns error for invalid priority', () => {
      expect(validatePriority('invalid')).toBe('Priority must be one of: low, medium, high, urgent');
    });

    it('returns null for valid priorities', () => {
      expect(validatePriority('low')).toBeNull();
      expect(validatePriority('medium')).toBeNull();
      expect(validatePriority('high')).toBeNull();
      expect(validatePriority('urgent')).toBeNull();
    });

    it('returns error for empty string', () => {
      expect(validatePriority('')).toBe('Priority must be one of: low, medium, high, urgent');
    });
  });

  describe('validateStatus', () => {
    it('returns error for invalid status', () => {
      expect(validateStatus('invalid')).toBe('Status must be one of: todo, in-progress, review, done');
    });

    it('returns null for valid statuses', () => {
      expect(validateStatus('todo')).toBeNull();
      expect(validateStatus('in-progress')).toBeNull();
      expect(validateStatus('review')).toBeNull();
      expect(validateStatus('done')).toBeNull();
    });
  });

  describe('validateDate', () => {
    it('returns error for invalid date', () => {
      expect(validateDate('invalid-date', 'Due date')).toBe('Due date must be a valid date');
    });

    it('returns error for empty string', () => {
      expect(validateDate('', 'Due date')).toBe('Due date must be a valid date');
    });

    it('returns null for valid date', () => {
      expect(validateDate('2023-12-25', 'Due date')).toBeNull();
    });

    it('returns null for null', () => {
      expect(validateDate(null, 'Due date')).toBeNull();
    });
  });

  describe('validateTaskForm', () => {
    it('returns errors for empty form', () => {
      const errors = validateTaskForm({});
      expect(errors.title).toBe('Title is required');
      expect(isValid(errors)).toBe(false);
    });

    it('returns error for title too short', () => {
      const errors = validateTaskForm({ title: 'ab' });
      expect(errors.title).toBe('Title must be at least 3 characters');
      expect(isValid(errors)).toBe(false);
    });

    it('returns error for invalid priority', () => {
      const errors = validateTaskForm({
        title: 'Valid Title',
        priority: 'invalid'
      });
      expect(errors.priority).toBe('Priority must be one of: low, medium, high, urgent');
      expect(isValid(errors)).toBe(false);
    });

    it('returns error for invalid status', () => {
      const errors = validateTaskForm({
        title: 'Valid Title',
        status: 'invalid'
      });
      expect(errors.status).toBe('Status must be one of: todo, in-progress, review, done');
      expect(isValid(errors)).toBe(false);
    });

    it('returns valid for correct form', () => {
      const errors = validateTaskForm({
        title: 'Valid Task Title',
        desc: 'This is a valid description with sufficient length',
        priority: 'high',
        status: 'pending',
        dueDate: '2023-12-25'
      });
      expect(isValid(errors)).toBe(true);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('handles optional fields correctly', () => {
      const errors = validateTaskForm({
        title: 'Valid Title',
        priority: 'medium',
        status: 'todo'
        // No description or dueDate provided
      });
      expect(isValid(errors)).toBe(true);
    });
  });
});