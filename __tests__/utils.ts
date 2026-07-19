import { Prisma } from '@prisma/client';

export const createTestUser = async (prisma: Prisma.$PrismaClient) => {
  return prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'P@ssw0rd!',
      role: 'USER',
    },
  });
};



export const createTestProject = async (prisma: Prisma.$PrismaClient, userId: string) => {
  return prisma.project.create({
    data: {
      name: 'Test Project',
      ownerId: userId,
    },
  });
};



export const createTestTask = async (prisma: Prisma.$PrismaClient, projectId: string, userId: string) => {
  return prisma.task.create({
    data: {
      title: 'Test Task',
      projectId,
      ownerId: userId,
      assigneeId: userId,
      priority: 'MEDIUM',
      dueDate: new Date().toISOString(),
    },
  });
};



export const mockRequest = (method: string, url: string, body?: any) => {
  return { method, url, body, headers: { 'Content-Type': 'application/json' } } as NextRequest;
};