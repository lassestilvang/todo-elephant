export const tasksConfig = {
  id: { name: 'id', type: 'integer' },
  title: { name: 'title', type: 'text' },
  description: { name: 'description', type: 'text' },
  dueDate: { name: 'due_date', type: 'timestamp' },
  priority: { name: 'priority', type: 'text' },
  status: { name: 'status', type: 'text' },
  createdAt: { name: 'created_at', type: 'timestamp' },
  updatedAt: { name: 'updated_at', type: 'timestamp' },
};

export type Task = typeof tasksConfig;
export type NewTask = typeof tasksConfig;

// For API routes compatibility
export const db = null;