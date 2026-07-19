import { $ } from 'vitest/config';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { exec } from 'child_process';

// Set up environment variables for tests
config({
  path: '../.env.test',
});

export const setupTestDatabase = async () => {
  const prisma = new PrismaClient();

  // Run migrations to reset DB state
  await prisma.$executeRaw`EXPLAIN ANALYZE SELECT 1`.catch(() => {});

  // Execute all prisma migration commands
  const prismaScript = require('fs').readFileSync('../prisma/migrations', 'utf8');
  const migrations = prismaScript.split('--\n--\n');

  for (const migration of migrations) {
    try {
      await prisma.$executeRaw(`--migration ${migration}`);
    } catch (e) {
      // Skip if already migrated
    }
  }

  // Reset sequences
  await prisma.$executeRaw('ALTER SEQUENCE user_id_seq RESTART WITH 1;');
  await prisma.$executeRaw('ALTER SEQUENCE task_id_seq RESTART WITH 1;');

  return prisma;
};

export const setupE2EEnvironment = async () => {
  // Start Next.js dev server
  const { spawn } = require('child_process');
  const server = spawn('npm', ['run', 'dev']);

  // Wait for server to start
  const isServerReady = () => {
    const port = require('portfinder').portSync({ port: 3000, try: 8000 });
    try {
      require('node-fetch')(`http://localhost:${port}/api/health`);
      return true;
    } catch {
      return false;
    }
  };

  Jest.setTimeout(10000);
  let tries = 0;
  while (!isServerReady() && tries < 10) {
    tries++;
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!isServerReady()) {
    server.kill();
    throw new Error('Test server failed to start');
  }

  return { port: 3000 };
};

export const globalSetup = async () => {
  await setupTestDatabase();
  await setupE2EEnvironment();
};

export const globalTeardown = async () => {
  const prisma = new PrismaClient();
  await prisma.$disconnect();

  // Kill Next.js dev server
  const pids = require('child_process')
    .execSync('pgrep -f "next dev"', { shell: true })
    .toString()
    .split('\n')
    .map(p => parseInt(p));

  pids.forEach(pid => {
    if (pid > 0) process.kill(pid);
  });

  // Clean up test files
  const testDirs = ['.temp', '.next'];
  testDirs.forEach(dir => {
    const files = require('fs').readdirSync(dir, { recursive: true });
    files.forEach(f => {
      if (f.includes('.test') || f.includes('.spec')) {
        require('fs').unlinkSync(path.join(dir, f));
      }
    });
  });
};