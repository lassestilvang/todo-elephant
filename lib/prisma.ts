import { TaskModel } from '@/models/task.model';
import { UserModel } from '@/models/user.model';
import { BoardModel } from '@/models/board.model';

// Initialize Prisma client for database operations
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Health check endpoint
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

// Database initialization
export async function initializeDatabase() {
  try {
    // Test connection
    await prisma.$connect();

    // Initialize any default data if needed
    const userCount = await prisma.user.count();
    console.log(`Database initialized. Found ${userCount} users.`);

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function shutdown() {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
}

// Export for use in Next.js API routes
export default {
  GET,
  initializeDatabase,
  shutdown
};