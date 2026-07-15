import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { TaskModel, ITask } from '@/models/task.model';

describe('Task Model', () => {
  beforeEach(async () => {
    // Clean up before each test
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
    }
  });

  describe('Task Creation', () => {
    it('creates a valid task', async () => {
      const task = new TaskModel({
        title: 'Test Task',
        description: 'Test description',
        status: 'todo',
        priority: 'high'
      });

      const savedTask = await task.save();
      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe('Test Task');
      expect(savedTask.status).toBe('todo');
      expect(savedTask.priority).toBe('high');
    });

    it('sets default values', async () => {
      const task = new TaskModel({
        title: 'Test Task'
      });

      const savedTask = await task.save();
      expect(savedTask.status).toBe('todo');
      expect(savedTask.priority).toBe('medium');
      expect(savedTask.isImportant).toBe(false);
      expect(savedTask.isUrgent).toBe(false);
    });

    it('validates required fields', async () => {
      const task = new TaskModel({
        description: 'Missing title'
      });

      await expect(task.save()).rejects.toThrow();
    });
  });

  describe('Task Status', () => {
    it('accepts valid statuses', async () => {
      const validStatuses = ['todo', 'in_progress', 'review', 'completed', 'archived'];

      for (const status of validStatuses) {
        const task = new TaskModel({ title: `Task ${status}`, status });
        const savedTask = await task.save();
        expect(savedTask.status).toBe(status);
      }
    });

    it('rejects invalid status', async () => {
      const task = new TaskModel({
        title: 'Test Task',
        status: 'invalid' as any
      });

      await expect(task.save()).rejects.toThrow();
    });
  });

  describe('Task Priority', () => {
    it('accepts valid priorities', async () => {
      const validPriorities = ['low', 'medium', 'high'];

      for (const priority of validPriorities) {
        const task = new TaskModel({ title: `Task ${priority}`, priority });
        const savedTask = await task.save();
        expect(savedTask.priority).toBe(priority);
      }
    });

    it('rejects invalid priority', async () => {
      const task = new TaskModel({
        title: 'Test Task',
        priority: 'urgent' as any
      });

      await expect(task.save()).rejects.toThrow();
    });
  });

  describe('Subtasks', () => {
    it('creates task with subtasks', async () => {
      const task = new TaskModel({
        title: 'Parent Task',
        subtasks: [
          { id: '1', title: 'Subtask 1', completed: false },
          { id: '2', title: 'Subtask 2', completed: true }
        ]
      });

      const savedTask = await task.save();
      expect(savedTask.subtasks).toHaveLength(2);
      expect(savedTask.subtasks![0].completed).toBe(false);
      expect(savedTask.subtasks![1].completed).toBe(true);
    });
  });

  describe('Due Date', () => {
    it('sets and updates due date', async () => {
      const dueDate = new Date('2026-12-31');
      const task = new TaskModel({
        title: 'Task with due date',
        dueDate
      });

      const savedTask = await task.save();
      expect(savedTask.dueDate).toEqual(dueDate);
    });
  });

  describe('Timestamps', () => {
    it('sets createdAt and updatedAt on creation', async () => {
      const beforeSave = new Date();
      const task = new TaskModel({ title: 'Test Task' });
      const savedTask = await task.save();
      const afterSave = new Date();

      expect(savedTask.createdAt).toBeInstanceOf(Date);
      expect(savedTask.updatedAt).toBeInstanceOf(Date);
      expect(savedTask.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedTask.updatedAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    it('updates updatedAt on modification', async () => {
      const task = new TaskModel({ title: 'Test Task' });
      const savedTask = await task.save();

      const originalUpdatedAt = savedTask.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 100));

      savedTask.title = 'Updated Task';
      await savedTask.save();

      expect(savedTask.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});