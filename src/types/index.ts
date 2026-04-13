/**
 * User entity representing application users
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Label entity for categorizing tasks
 */
export interface Label {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task entity representing individual tasks
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  completedAt?: Date | null;
  labels: string[]; // Array of label IDs
  userId: string;
  listId?: string; // Optional list association
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task status enumeration
 */
export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'done'
  | 'archived';

/**
 * Task priority enumeration
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * List entity for organizing tasks
 */
export interface TaskList {
  id: string;
  name: string;
  description?: string;
  userId: string;
  position: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Combined data structure for task with full entity relationships
 */
export interface TaskWithRelations extends Task {
  user: User;
  labels: Label[];
  list?: TaskList;
}

/**
 * Combined data structure for list with related tasks
 */
export interface ListWithTasks extends TaskList {
  tasks: Task[];
}

/**
 * Combined data structure for user with related data
 */
export interface UserWithRelations extends User {
  lists: TaskList[];
  tasks: Task[];
  labels: Label[];
}

/**
 * Database schema types for type-safe database operations
 */
export type DbUser = Omit<User, 'id'>;
export type DbLabel = Omit<Label, 'id' | 'userId'>;
export type DbTask = Omit<Task, 'id' | 'userId' | 'labels' | 'listId'>;
export type DbTaskList = Omit<TaskList, 'id' | 'userId'>;

/**
 * API response types
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}