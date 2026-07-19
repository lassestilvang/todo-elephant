Observability

Comprehensive observability stack for monitoring, logging, and alerting in the Todo Elephant application. Provides real-time performance tracking, structured logging, and alert management.

Features:
- Request tracking with unique IDs
- Performance metrics collection
- Structured logging for debugging
- Alert system for anomalies
- Health and readiness checks
- Database and external API tracking
- Export functionality for analysis
- Memory and latency monitoring

Usage:
1. Initialize middleware in your Next.js server
2. Wrap your API handlers with `withObservability`
3. Use `withDatabaseTracking` for Prisma queries
4. Use `withExternalApiTracking` for external service calls
5. Access health endpoints at `/api/health` and `/api/ready`
6. Export logs and metrics for analysis

Best Practices:
- Use correlation IDs for distributed tracing
- Monitor critical performance metrics
- Set up alerts for latency and memory issues
- Regular log rotation and cleanup
- Integrate with monitoring tools (Prometheus, Grafana)

## Installation

Add to your server or middleware:

```javascript
import { ObservabilityMiddleware } from './observability';

// Initialize at app startup
ObservabilityMiddleware.initialize();

// Wrap your handlers
export const GET = ObservabilityMiddleware.withObservability(
  async (requestContext, metrics) => {
    // Your handler logic
  }
);
```

## Database Integration

For Prisma/ORM queries:

```javascript
import { ObservabilityMiddleware } from './observability';

// Wrap a specific query
const trackedQuery = ObservabilityMiddleware.withDatabaseTracking(
  'findUserByEmail',
  async (email) => {
    return await prisma.user.findUnique({ where: { email } });
  }
);

// Usage
const user = await trackedQuery('user@example.com');
```

## External API Integration

For external service calls:

```javascript
import { ObservabilityMiddleware } from './observability';

// Wrap an external API call
const trackedApiCall = ObservabilityMiddleware.withExternalApiTracking(
  'OpenAI',
  'generateText',
  async (prompt) => {
    return await openai.createCompletion({ prompt });
  }
);

// Usage
const result = await trackedApiCall('Write a todo task');
```

## Health Checks

Access monitoring endpoints:

- `GET /api/health` - Current application health
- `GET /api/ready` - Readiness for traffic

## Logging

Logs are written to the `logs/` directory:
- `app.log` - Combined application logs
- `archive-*.json` - Exported log archives

## Metrics

Metrics are written to the `metrics/` directory:
- `metrics.jsonl` - Real-time metrics stream
- `metrics-*.json` - Exported metrics archives

## Configuration

Environment variables for customization:

```bash
# Log level
LOG_LEVEL=info

# Alert thresholds
LATENCY_ALERT_THRESHOLD=5000
MEMORY_ALERT_THRESHOLD=1024

# Export retention (days)
LOG_RETENTION_DAYS=30
METRICS_RETENTION_DAYS=90
```

## Monitoring Tools Integration

Integrate with:
- **Prometheus**: Export metrics to Prometheus for alerting
- **Grafana**: Create dashboards for visualization
- **ELK Stack**: Send logs to Elasticsearch for analysis
- **Sentry**: Error tracking integration
- **Datadog**: Comprehensive monitoring platform

## Performance Monitoring

The observability middleware automatically tracks:

1. **Request Performance**
   - Response time (latency)
   - Memory usage
   - CPU utilization
   - Database query count

2. **Error Tracking**
   - Failed requests with full context
   - Database query failures
   - External API errors
   - Stack traces for debugging

3. **Business Metrics**
   - User activity patterns
   - Feature usage statistics
   - Task completion rates

4. **Infrastructure Health**
   - Memory and CPU alerts
   - Database connection status
   - External service availability

## Alert Levels

1. **INFO**: Informational messages (unauthenticated requests, etc.)
2. **WARNING**: Potential issues (high latency, memory usage)
3. **ERROR**: Critical failures (database connection, external service down)

## Example Alert Configuration

```javascript
const alerts = [
  {
    name: 'High Latency',
    condition: (metrics) => metrics.requestDuration > 5000,
    severity: 'warning',
    action: 'notify_dev_team',
  },
  {
    name: 'Memory Exhaustion',
    condition: (metrics) => metrics.memoryUsage.heapUsed > 1024 * 1024 * 1024,
    severity: 'critical',
    action: 'scale_up',
  },
];
```

## Debugging with Observability

When troubleshooting issues:

1. Check the logs directory for recent entries
2. Use correlation IDs to trace requests through the system
3. Analyze metrics for performance bottlenecks
4. Export logs for offline analysis
5. Set up alerts for common failure patterns

## Migration from Previous Versions

1. Add `ObservabilityMiddleware.initialize()` to your server startup
2. Wrap API handlers with `withObservability`
3. Configure alert thresholds in environment variables
4. Review logs for any anomalies during deployment

## Security Considerations

1. Log sensitive data minimally
2. Use correlation IDs instead of user IDs in logs
3. Encrypt sensitive log entries
4. Implement log rotation to prevent disk space issues
5. Access logs through secure channels only