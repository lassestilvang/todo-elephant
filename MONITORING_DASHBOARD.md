# Todo Elephant AI Enhancement - Monitoring Dashboard Specification

## Grafana Dashboard Panels for AI Services

### 1. API Latency Panel (P50, P95, P99)
```
Query: histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{job="todo-elephant", path=~"/api/ai-.*"}[5m])) by (le))
Title: "AI API Latency (P50)"
Unit: seconds
Threshold: Warning > 1s, Critical > 2s
```

### 2. Error Rate Panel
```
Query: sum(rate(http_requests_total{job="todo-elephant", path=~"/api/ai-.*", status=~"5.."}[5m])) / sum(rate(http_requests_total{job="todo-elephant", path=~"/api/ai-.*"}[5m]))
Title: "AI API Error Rate"
Unit: percent
Threshold: Warning > 0.5%, Critical > 1%
```

### 3. Request Volume Panel
```
Query: sum(rate(http_requests_total{job="todo-elephant", path=~"/api/ai-.*"}[5m]))
Title: "AI API Requests/sec"
```

### 4. AI Model Response Time
```
Query: sum(rate(ai_model_duration_seconds_sum{job="todo-elephant"}[5m])) / sum(rate(ai_model_duration_seconds_count{job="todo-elephant"}[5m]))
Title: "AI Model Inference Time"
Unit: seconds
```

### 5. Active Users
```
Query: count(count by (user_id) (http_requests_total{job="todo-elephant", path=~"/api/ai-.*"}))
Title: "Active AI Feature Users (5m)"
```

### 6. Feature Usage Breakdown
```
Query: sum by (path) (rate(http_requests_total{job="todo-elephant", path=~"/api/(ai-suggest|ai-prioritize|ai-forecast|templates|adaptive-learning|skills)"}[5m]))
Title: "Feature Usage by Endpoint"
Visualization: Pie chart
```

### 7. Adaptive Learning Progress
```
Query: sum by (user_id) (adaptive_learning_level{job="todo-elephant"})
Title: "User AI Adaptation Levels"
```

### 8. Wellbeing Metrics
```
Query: sum by (user_id) (cognitive_load_score{job="todo-elephant"})
Title: "User Cognitive Load Scores"
```

---

## Prometheus Rules for Alerting

```yaml
groups:
- name: todo-elephant-ai
  rules:
  # High error rate on AI endpoints
  - alert: AIAPIHighErrorRate
    expr: sum(rate(http_requests_total{job="todo-elephant", path=~"/api/ai-.*", status=~"5.."}[5m])) / sum(rate(http_requests_total{job="todo-elephant", path=~"/api/ai-.*"}[5m])) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High AI API error rate"
      description: "Error rate on AI endpoints is {{ $value | humanizePercentage }}"

  # High latency on AI endpoints
  - alert: AIAPIHighLatency
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="todo-elephant", path=~"/api/ai-.*"}[5m])) by (le)) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High AI API latency"
      description: "P95 latency on AI endpoints is {{ $value }}s"

  # OpenAI API failures
  - alert: OpenAIAPIFailures
    expr: rate(openai_api_failures_total{job="todo-elephant"}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "OpenAI API failures detected"

  # High cognitive load users
  - alert: UserHighCognitiveLoad
    expr: cognitive_load_score{job="todo-elephant"} > 80
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "User experiencing high cognitive load"
      description: "User {{ $labels.user_id }} has cognitive load score {{ $value }}"
```

---

## Dashboard JSON (Grafana)

```json
{
  "dashboard": {
    "title": "Todo Elephant AI Enhancement Monitoring",
    "tags": ["todo-elephant", "ai", "production"],
    "timezone": "utc",
    "panels": [
      {
        "title": "AI API Latency (P50/P95/P99)",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [
          {"expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{job=\"todo-elephant\", path=~\"/api/ai-.*\"}[5m])) by (le))", "legendFormat": "P50"},
          {"expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job=\"todo-elephant\", path=~\"/api/ai-.*\"}[5m])) by (le))", "legendFormat": "P95"},
          {"expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job=\"todo-elephant\", path=~\"/api/ai-.*\"}[5m])) by (le))", "legendFormat": "P99"}
        ]
      },
      {
        "title": "AI API Error Rate",
        "type": "graph",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
        "targets": [
          {"expr": "sum(rate(http_requests_total{job=\"todo-elephant\", path=~\"/api/ai-.*\", status=~\"5..\"}[5m])) / sum(rate(http_requests_total{job=\"todo-elephant\", path=~\"/api/ai-.*\"}[5m]))", "legendFormat": "Error Rate"}
        ]
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "30s"
  }
}
```

---

## Key Metrics to Instrument in Your Code

Add these metrics to your AI service endpoints:

```typescript
// In each AI API route, add:
import { metrics } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    // ... your AI logic
    metrics.increment('ai.api.requests.total', { path: '/api/ai-suggest', status: 'success' });
    metrics.timing('ai.api.duration', Date.now() - start, { path: '/api/ai-suggest' });
    return NextResponse.json(result);
  } catch (error) {
    metrics.increment('ai.api.requests.total', { path: '/api/ai-suggest', status: 'error' });
    metrics.increment('ai.api.failures', { path: '/api/ai-suggest', error: error.code });
    throw error;
  }
}
```

Metrics to track:
- `ai.api.requests.total` - Counter by path/status
- `ai.api.duration` - Histogram of request latency
- `ai.model.inference.duration` - Histogram of model inference time
- `ai.model.tokens.used` - Counter of tokens consumed
- `ai.suggestions.generated` - Counter of suggestions generated
- `ai.suggestions.accepted` - Counter of accepted suggestions
- `user.cognitive_load` - Gauge of user cognitive load score
- `user.adaptation_level` - Gauge of AI adaptation level (0-100)
- `openai.api.failures` - Counter of OpenAI API errors
```

---

## SLO Targets

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| AI API P95 Latency | < 2s | 5m rolling |
| AI API Error Rate | < 1% | 5m rolling |
| AI API Availability | > 99.9% | 30d |
| OpenAI API Failure Rate | < 0.1% | 5m rolling |
| Suggestion Acceptance Rate | > 30% | 24h |
| User Cognitive Load Alert | < 80 | Continuous |