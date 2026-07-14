/**
 * Security Audit Logger - Tracks all security-relevant events
 */
import fs from 'fs';
import path from 'path';

interface AuditEvent {
  timestamp: string;
  type: 'auth' | 'access' | 'data' | 'error';
  action: string;
  userId?: string;
  resource?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export class AuditLogger {
  private logPath = path.join(process.cwd(), 'logs', 'security.log');

  constructor() {
    // Ensure log directory exists
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(event: AuditEvent): void {
    const logEntry = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    }) + '\n';

    fs.appendFileSync(this.logPath, logEntry);
  }

  getRecentEvents(limit: number = 100): AuditEvent[] {
    if (!fs.existsSync(this.logPath)) return [];

    const logs = fs.readFileSync(this.logPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    return logs.slice(-limit);
  }

  queryEvents(filters: Partial<AuditEvent>): AuditEvent[] {
    return this.getRecentEvents().filter(event => {
      return Object.entries(filters).every(
        ([key, value]) => event[key as keyof AuditEvent] === value
      );
    });
  }
}