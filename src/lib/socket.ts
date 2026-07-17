import { Server } from 'socket.io';
import { createServer } from 'http';
import { verifyToken } from './auth';
import { BoardModel } from '@/models/board.model';

// Singleton pattern for Socket.IO server
let io: Server | null = null;

export function initSocket(server: ReturnType<typeof createServer>) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    (socket as any).user = payload;
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User ${user.userId} connected`);

    // Join user's personal room
    socket.join(`user:${user.userId}`);

    // Handle joining board rooms
    socket.on('board:join', async (boardId: string) => {
      try {
        // Verify user has access to this board
        const board = await BoardModel.findById(boardId);
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        const member = board.members.find(m => m.userId === user.userId);
        if (!member) {
          socket.emit('error', { message: 'Not a board member' });
          return;
        }

        socket.join(`board:${boardId}`);
        socket.data.boardId = boardId;

        // Notify other board members
        socket.to(`board:${boardId}`).emit('user:joined', {
          userId: user.userId,
          email: user.email
        });

        // Send current board state
        socket.emit('board:state', {
          board,
          members: board.members
        });
      } catch (error) {
        console.error('Board join error:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Handle leaving board rooms
    socket.on('board:leave', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      socket.to(`board:${boardId}`).emit('user:left', {
        userId: user.userId
      });
    });

    // Task events within boards
    socket.on('task:create', async (data) => {
      const boardId = data.boardId || socket.data.boardId;
      if (!boardId) return;

      // Verify permissions
      const board = await BoardModel.findById(boardId);
      if (!board) return;

      const member = board.members.find(m => m.userId === user.userId);
      if (!member || member.permission === 'view') return;

      // Broadcast to all board members
      io.to(`board:${boardId}`).emit('task:created', {
        ...data,
        createdBy: user.userId
      });
    });

    socket.on('task:update', async (data) => {
      const boardId = data.boardId || socket.data.boardId;
      if (!boardId) return;

      const board = await BoardModel.findById(boardId);
      if (!board) return;

      const member = board.members.find(m => m.userId === user.userId);
      if (!member || member.permission === 'view') return;

      io.to(`board:${boardId}`).emit('task:updated', {
        ...data,
        updatedBy: user.userId
      });
    });

    socket.on('task:delete', async (data) => {
      const boardId = data.boardId || socket.data.boardId;
      if (!boardId) return;

      const board = await BoardModel.findById(boardId);
      if (!board) return;

      const member = board.members.find(m => m.userId === user.userId);
      if (!member || member.permission === 'view') return;

      io.to(`board:${boardId}`).emit('task:deleted', {
        ...data,
        deletedBy: user.userId
      });
    });

    // Cursor position for collaborative editing
    socket.on('cursor:move', (data) => {
      const boardId = data.boardId || socket.data.boardId;
      if (!boardId) return;

      socket.to(`board:${boardId}`).emit('cursor:moved', {
        userId: user.userId,
        email: user.email,
        position: data.position,
        taskId: data.taskId
      });
    });

    // Presence updates
    socket.on('presence:update', (data) => {
      const boardId = data.boardId || socket.data.boardId;
      if (!boardId) return;

      socket.to(`board:${boardId}`).emit('user:present', {
        userId: user.userId,
        email: user.email,
        status: data.status,
        lastSeen: new Date()
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User ${user.userId} disconnected`);
      if (socket.data.boardId) {
        socket.to(`board:${socket.data.boardId}`).emit('user:offline', {
          userId: user.userId
        });
      }
    });
  });

  return io;
}

export function getSocket() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
}

// Helper function to emit events to a specific board
export function emitToBoard(boardId: string, event: string, data: any) {
  if (!io) return;
  io.to(`board:${boardId}`).emit(event, data);
}

// Helper function to emit events to a specific user
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}