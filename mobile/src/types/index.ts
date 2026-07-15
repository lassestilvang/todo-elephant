export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  listId?: number;
  labels?: number[];
  dueDate?: string;
  assignedTo?: string;
  dependsOnTaskId?: number | null;
  isImportant?: boolean;
  isUrgent?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  completedPomodoros?: number;
  parentRecurrenceId?: number | null;
  order?: number;
  archivedAt?: string | null;
  isTemplate?: boolean;
  subtasks?: Subtask[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface List {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface Label {
  id: number;
  name: string;
  color?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'user' | 'premium';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}