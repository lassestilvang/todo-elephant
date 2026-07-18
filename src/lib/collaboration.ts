import { EventEmitter } from 'events';
import { Task } from '../models/task.model';
import { UserModel } from '../models/user.model';
import { BoardModel } from '../models/board.model';
import { sendNotification } from './notification.service';

export class CollaborationManager extends EventEmitter {
  private static instance: CollaborationManager;
  private activeBoard: string | null = null;
  private queuedUpdates: Map<string, UpdateQueue> = new Map();

  private constructor() {
    super();
    this.setupEventListeners();
  }

  public static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager();
    }
    return CollaborationManager.instance;
  }

  private setupEventListeners() {
    this.on('task:update', this.handleTaskUpdate.bind(this));
    this.on('task:delete', this.handleTaskDeletion.bind(this));
    this.on('board:join', this(handleBoardJoin.bind(this));
    this.on('board:leave', this(handleBoardLeave.bind(this)));
  }

  async handleNewTask(task: Task, senderId: string) {
    try {
      this.emit('task:created', task);
      await TaskModel.create(task);

      const board = await BoardModel.findById(task.boardId);
      for (const member of board.members) {
        await sendNotification(member.userId, 'NEW_TASK', {
          taskId: task._id,
          title: task.title,
          from: senderId
        });
      }

      this.emit('analytics:task_created', { userId: senderId, boardId: task.boardId });
      return true;
    } catch (error) {
      this.emit('error', {
        type: 'task_creation_failed',
        message: 'Failed to create task',
        error: error.message
      });
      return false;
    }
  }

  async handleTaskUpdate(taskId: string, updates: Partial<Task>, updaterId: string) {
    try {
      const task = await TaskModel.findById(taskId);
      if (!task) return;

      const oldState = { ...task.toObject() };
      Object.assign(task, updates);
      await task.save();

      this.emit('task:updated', {
        ...task.toObject(),
        oldState,
        updatedBy: updaterId
      });

      const board = await BoardModel.findById(task.boardId);
      for (const member of board.members) {
        await sendNotification(member.userId, 'TASK_UPDATE', {
          taskId,
          title: task.title,
          updatedBy: updaterId
        });
      }

      return true;
    } catch (error) {
      this.emit('error', {
        type: 'task_update_failed',
        message: 'Failed to update task',
        error: error.message
      });
      return false;
    }
  }

  private handleBoardJoin(boardId: string, user: any) {
    try {
      const board = await BoardModel.findById(boardId);
      if (!board) return;

      this.emit('user:joined', {
        userId: user.id,
        email: user.email,
        timestamp: new Date()
      });

      await UserModel.findByIdAndUpdate(user.id, {
        $set: { currentBoard: boardId }
      });

      this.emit('board:share', {
        boardId,
        members: board.members,
        lists: board.lists
      });
    } catch (error) {
      this.emit('error', {
        type: 'board_join_failed',
        message: 'Failed to join board',
        error: error.message
      });
    }
  }
}

class UpdateQueue {
  constructor(public id: string) {}
  pendingUpdates: Map<string, any> = new Map();
  lastUpdated: Date = new Date();

  addUpdate(action: any): void {
    this.pendingUpdates.set(action.id, action);
    this.lastUpdated = new Date();
  }

  getPendingUpdates(): any[] {
    return Array.from(this.pendingUpdates.values());
  }
}