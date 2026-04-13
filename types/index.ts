// types/index.ts
export type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
};

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};