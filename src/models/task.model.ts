import mongoose, { Document, Schema } from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'archived';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  listId?: string;
  labelIds?: string[];
  dueDate?: Date;
  assignedTo?: string;
  dependsOnTaskId?: string;
  isImportant?: boolean;
  isUrgent?: boolean;
  recurrence?: string;
  completedPomodoros?: number;
  parentRecurrenceId?: string;
  order?: number;
  archivedAt?: Date;
  isTemplate?: boolean;
  subtasks?: ISubtask[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ISubtask {
  id: string;
  title: string;
  completed: boolean;
}

const SubtaskSchema = new Schema<ISubtask>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'completed', 'archived'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  listId: { type: String },
  labelIds: [{ type: String }],
  dueDate: { type: Date },
  assignedTo: { type: String },
  dependsOnTaskId: { type: String },
  isImportant: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  recurrence: { type: String, default: 'none' },
  completedPomodoros: { type: Number, default: 0 },
  parentRecurrenceId: { type: String },
  order: { type: Number },
  archivedAt: { type: Date },
  isTemplate: { type: Boolean, default: false },
  subtasks: [SubtaskSchema],
  completedAt: { type: Date }
}, { timestamps: true });

// Indexes for performance
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ listId: 1 });
TaskSchema.index({ labelIds: 1 });
TaskSchema.index({ isTemplate: 1 });

// Compound indexes for common query patterns
TaskSchema.index({ userId: 1, status: 1, dueDate: 1 }); // User's tasks by status and due date
TaskSchema.index({ userId: 1, listId: 1, status: 1 }); // User's tasks by list and status
TaskSchema.index({ userId: 1, priority: 1, dueDate: 1 }); // Priority-based scheduling
TaskSchema.index({ userId: 1, isTemplate: 1, createdAt: -1 }); // Template queries
TaskSchema.index({ completedAt: 1, userId: 1 }); // Completed tasks history
TaskSchema.index({ dependsOnTaskId: 1 }); // Dependency lookups
TaskSchema.index({ assignedTo: 1, status: 1 }); // Team assignments

// Text index for search functionality
TaskSchema.index({ title: 'text', description: 'text' });

// Sparse index for overdue tasks (only when dueDate exists)
TaskSchema.index({ dueDate: 1, status: 1 }, { sparse: true });

// Update timestamp and completedAt on save
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.isModified('status')) {
    if (this.status === 'completed' || this.status === 'done') {
      this.completedAt = new Date();
    } else if (this.status === 'todo') {
      this.completedAt = undefined;
    }
  }

  next();
});

export const TaskModel = mongoose.model<ITask>('Task', TaskSchema);