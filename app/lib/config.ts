// Database configuration
export const db = null;

// Table definitions
export const tasks = {
  id: { name: 'id', type: 'integer' },
  title: { name: 'title', type: 'text' },
  description: { name: 'description', type: 'text' },
  dueDate: { name: 'due_date', type: 'timestamp' },
  priority: { name: 'priority', type: 'text' },
  status: { name: 'status', type: 'text' },
  createdAt: { name: 'created_at', type: 'timestamp' },
  updatedAt: { name: 'updated_at', type: 'timestamp' },
};

export type Task = typeof tasks;
export type NewTask = typeof tasks;

// API configuration
export const apiConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'application/pdf', 'text/plain'],
};