import { z } from 'zod';

/**
 * Comprehensive validation schemas and utilities for Todo Elephant
 * All schemas include proper error messages and constraints
 */

// Validation utility functions
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (!value || value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return null;
}

export function validateMaxLength(value: string, max: number, fieldName: string): string | null {
  if (value && value.length > max) {
    return `${fieldName} must be no more than ${max} characters`;
  }
  return null;
}

export function validatePriority(value: string): string | null {
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!value || !validPriorities.includes(value)) {
    return 'Priority must be one of: low, medium, high, urgent';
  }
  return null;
}

export function validateStatus(value: string): string | null {
  const validStatuses = ['todo', 'in_progress', 'review', 'done', 'in-progress', 'completed', 'archived'];
  if (!value || !validStatuses.includes(value)) {
    return 'Status must be one of: todo, in-progress, review, done';
  }
  return null;
}

export function validateDate(value: string | null, fieldName: string): string | null {
  if (!value) return `${fieldName} must be a valid date`;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  return null;
}

export interface TaskFormErrors {
  title?: string;
  desc?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  [key: string]: string | undefined;
}

export function validateTaskForm(data: any): TaskFormErrors {
  const errors: TaskFormErrors = {};

  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (data.desc && data.desc.length < 10) {
    errors.desc = 'Description must be at least 10 characters';
  }

  if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
    errors.priority = 'Priority must be one of: low, medium, high, urgent';
  }

  if (data.status && !['todo', 'in_progress', 'review', 'done', 'in-progress'].includes(data.status)) {
    errors.status = 'Status must be one of: todo, in-progress, review, done';
  }

  if (data.dueDate) {
    const date = new Date(data.dueDate);
    if (isNaN(date.getTime())) {
      errors.dueDate = 'Due date must be a valid date';
    }
  }

  return errors;
}

export function isValid(errors: TaskFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

// Task validation schema
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed', 'archived']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  listId: z.string().optional(),
  labelId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  boardId: z.string().optional(),
  dependsOnTaskId: z.string().optional(),
  estimatedMinutes: z.number().min(1).max(1440).optional(),
  isImportant: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string().min(1),
    completed: z.boolean().default(false)
  })).default([]),
  labels: z.array(z.string()).default([]),
});

// List validation schema
export const listSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Invalid color format').optional(),
});

// Label validation schema
export const labelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Invalid color format').optional(),
});

// Comment validation schema
export const commentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Comment too long'),
  taskId: z.string().min(1, 'Task ID required'),
});

// User validation schema
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain a number')
    .regex(/[@$!%*?&]/, 'Password must contain a special character'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['admin', 'user', 'premium']).default('user'),
});

// Board validation schema
export const boardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
  members: z.array(z.object({
    userId: z.string(),
    permission: z.enum(['view', 'edit', 'admin'])
  })).optional(),
});

// MFA token validation schema
export const mfaTokenSchema = z.object({
  token: z.string().length(6, 'MFA token must be 6 digits').regex(/^\d+$/, 'Token must be numeric'),
  email: z.string().email('Invalid email address'),
});

// AI suggestion schema
export const aiSuggestionSchema = z.object({
  context: z.string().max(1000, 'Context too long').optional(),
  timeframe: z.enum(['day', 'week', 'month']).default('week'),
  includeTrends: z.boolean().default(true),
});

/**
 * Validate incoming request against schema
 * Returns validated data or throws validation error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify({
      errors: result.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    }));
  }
  return result.data;
}

/**
 * Validate input with structured response
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.errors[0].message };
  } catch (error) {
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Rate limiting implementation
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig): (identifier: string) => boolean {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = config;

  return (identifier: string): boolean => {
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  };
}

/**
 * Input sanitization functions
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .trim()
    .normalize('NFKC');
}

export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Pre-configured rate limiters
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'login'
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'api'
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  keyPrefix: 'ai'
});