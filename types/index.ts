// types/index.ts

export type Subtask = {
  id: number;
  title: string;
  completed: boolean;
};

export type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'todo' | 'in_progress' | 'done' | 'archived';
  subtasks?: Subtask[];
  listId?: number;
  labels?: number[];
  dependsOnTaskId?: number | null;
  isImportant?: boolean;
  isUrgent?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export type List = {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
};

export type Label = {
  id: number;
  name: string;
  color?: string;
};

export type ActivityLog = {
  id: number;
  action: string;
  entityType: 'task' | 'list' | 'label' | 'system' | 'user';
  entityId: number;
  details?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};