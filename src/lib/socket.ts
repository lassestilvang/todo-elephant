import { Server } from 'socket.io';
import { createServer } from 'http';
import { verifyToken } from './auth';

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
    console.log(`User ${socket.id} connected`);

    // Join user's personal room
    const user = (socket as any).user;
    socket.join(`user:${user.userId}`);

    // Join workspace room if provided
    const workspaceId = socket.handshake.query.workspaceId;
    if (workspaceId) {
      socket.join(`workspace:${workspaceId}`);
    }

    // Handle task updates
    socket.on('task:update', async (data) => {
      // Broadcast to all clients in the workspace/user room
      socket.to(`user:${user.userId}`).emit('task:updated', data);
    });

    socket.on('task:create', async (data) => {
      socket.to(`user:${user.userId}`).emit('task:created', data);
    });

    socket.on('task:delete', async (data) => {
      socket.to(`user:${user.userId}`).emit('task:deleted', data);
    });

    // Handle presence
    socket.on('presence:update', (data) => {
      socket.to(`workspace:${workspaceId}`).emit('user:online', {
        userId: user.userId,
        ...data
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`);
      socket.to(`workspace:${workspaceId}`).emit('user:offline', { userId: user.userId });
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