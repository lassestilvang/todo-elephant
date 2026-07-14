import { AuditLogger } from '../security/auditLogger';

const logger = new AuditLogger();

export async function auditLoggerMiddleware(
  req: any,
  res: any,
  next: () => Promise<any>
): Promise<void> {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (...args: any[]): void {
    const payload = args[0];
    const status = typeof payload === 'number' ? payload : 200;
    const duration = Date.now() - start;

    logger.log({
      type: 'http',
      action: req.method?.toUpperCase() || 'UNKNOWN',
      path: req.path,
      userId: req.headers['x-user-id'] || null,
      status,
      duration,
      requestHeaders: req.headers,
      responseBody: payload,
    });

    return originalSend.apply(this, args);
  };

  return next();
}