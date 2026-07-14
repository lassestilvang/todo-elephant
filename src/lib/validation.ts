import { z } from 'zod';

/**
 * Comprehensive validation schemas for all API routes
 * All schemas include proper error messages and constraints
 */

// Task validation schema
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  listId: z.string().optional(),
  labelId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
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
