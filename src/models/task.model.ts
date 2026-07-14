import mongoose from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  listId?: string;
  labelId?: string;
  assignedTo?: string;
  dueDate?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comments?: Comment[];
}

export interface Comment {
  author: string;
  content: string;
  createdAt: Date;
}

export const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  listId: { type: String },
  labelId: { type: String },
  assignedTo: { type: String },
  dueDate: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  comments: [{
    author: { type: String },
    content: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
});

// Update timestamp on save
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const TaskModel = mongoose.model('Task', TaskSchema);