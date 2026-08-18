# Enterprise Observability — Monitoring & Alerting

**Project:** Poderosa Agenda  
**Phase:** 15 — Observability  
**Status:** Implementation Guide

---

## Overview

Este documento define a estratégia enterprise de observability para o Poderosa Agenda, incluindo structured logging, error tracking, monitoring, e alerting.

---

## 1. Structured Logging

### Implementation

✅ **Logger Enterprise** — `src/lib/observability/logger.ts`

**Features:**
- Structured JSON logs (server-side)
- Multiple log levels: debug, info, warn, error, fatal
- Context enrichment (user, salon, request)
- Performance tracking
- Error tracking integration points
- Environment-based configuration

### Usage Examples

```typescript
import { log, logger, logRequest, logSecurityEvent } from '@/lib/observability/logger'

// Basic logging
log.info('User logged in', { user_id: userId, salon_id: salonId })
log.error('Failed to create client', error, { salon_id: salonId })

// Performance tracking
const result = await log.performance(
  'fetch_appointments',
  async () => {
    return await getAppointments(salonId)
  },
  { salon_id: salonId }
)

// HTTP requests
logRequest('POST', '/api/clients', 201, 145, { salon_id: salonId })

// Security events
logSecurityEvent('Failed login attempt', 'medium', { 
  email: email,
  ip: ipAddress 
})

// Child logger with context
const salonLogger = logger.child({ salon_id: salonId })
salonLogger.info('Operation completed')
```

### Environment Variables

```bash
# .env.local
LOG_LEVEL=info  # debug | info | warn | error | fatal
MONITORING_ENDPOINT=https://your-monitoring-service.com/logs  # Optional
```

---

## 2. Error Tracking

### Recommended Services

#### Option A: Sentry (Recommended)

**Installation:**
```bash
npm install @sentry/nextjs
```

**Configuration:** `sentry.client.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }
    return event
  },
})
```

**Integration with Logger:**
```typescript
// In logger.ts sendToErrorTracking()
import * as Sentry from '@sentry/nextjs'

private sendToErrorTracking(entry: LogEntry): void {
  if (entry.error) {
    Sentry.captureException(new Error(entry.error.message), {
      level: entry.level as Sentry.SeverityLevel,
      tags: {
        salon_id: entry.context?.salon_id,
        operation: entry.context?.operation,
      },
      contexts: {
        trace: {
          data: entry.context,
        },
      },
    })
  }
}
```

#### Option B: Rollbar

```bash
npm install rollbar
```

#### Option C: Bugsnag

```bash
npm install @bugsnag/js @bugsnag/plugin-react
```

---

## 3. Application Performance Monitoring (APM)

### Recommended Services

#### Option A: Vercel Analytics (Built-in)

**Free tier includes:**
- Real User Monitoring (RUM)
- Web Vitals tracking
- Audience insights

**Setup:** Enable in Vercel dashboard

#### Option B: New Relic

```bash
npm install newrelic
```

**Features:**
- Distributed tracing
- Database query analysis
- Custom instrumentation
- Alerts

#### Option C: Datadog

```bash
npm install dd-trace
```

---

## 4. Infrastructure Monitoring

### Supabase Monitoring

**Built-in Dashboard:**
- Database performance
- API usage
- Storage metrics
- Real-time subscriptions

**Access:** Supabase Dashboard → Project → Reports

### Vercel Monitoring

**Built-in Metrics:**
- Function execution time
- Cold starts
- Memory usage
- Bandwidth

**Access:** Vercel Dashboard → Project → Analytics

---

## 5. Custom Metrics

### Database Performance Metrics

Create view in Supabase:

```sql
-- Query performance view
CREATE OR REPLACE VIEW query_performance_summary AS
SELECT 
    queryid,
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 50;

-- Slow queries (> 1 second)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    queryid,
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- 1 second
ORDER BY mean_exec_time DESC;
```

### Business Metrics

```sql
-- Daily metrics view
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM appointments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 6. Alerting Strategy

### Critical Alerts (P0) — Immediate Response

**Triggers:**
- Database connection failures
- Authentication service down
- P0 error rate > 1% of requests
- API response time > 5s (p95)
- Disk usage > 90%

**Notification:** SMS + PagerDuty + Email

### High Priority Alerts (P1) — Response within 1 hour

**Triggers:**
- Error rate > 5% of requests
- API response time > 3s (p95)
- Rate limit hits > 100/hour
- Failed scheduled jobs
- Audit log gaps

**Notification:** Slack + Email

### Medium Priority Alerts (P2) — Response within 4 hours

**Triggers:**
- Warning rate > 10% of requests
- Slow database queries (>1s)
- Memory usage > 80%
- Unusual user activity patterns
- High rate limit hits (> 50/hour per user)

**Notification:** Slack

### Low Priority Alerts (P3) — Review during business hours

**Triggers:**
- Info logs about deprecated features
- Performance degradation trends
- Storage approaching limits

**Notification:** Email digest

---

## 7. Alert Rules Examples

### Sentry Alert Rules

```yaml
# .sentry/rules.yml
- name: "High Error Rate"
  conditions:
    - event_count: 50
      interval: 1h
  actions:
    - slack: "#alerts-prod"
    - email: "team@example.com"

- name: "Fatal Errors"
  conditions:
    - level: fatal
  actions:
    - pagerduty: "P0_ONCALL"
    - slack: "#alerts-critical"
```

### Vercel Alert Rules

Configure in Vercel Dashboard:
- Function errors > 10 in 5 min → Slack
- Build failures → Email + Slack
- Deployment reverted → PagerDuty

### Custom Monitoring Script

```typescript
// scripts/health-check.ts
import { createClient } from '@supabase/supabase-js'

async function healthCheck() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check database connectivity
  const { data, error } = await supabase
    .from('salons')
    .select('count')
    .limit(1)

  if (error) {
    console.error('Database health check failed:', error)
    process.exit(1)
  }

  // Check slow queries
  const { data: slowQueries } = await supabase
    .rpc('get_slow_queries')

  if (slowQueries && slowQueries.length > 10) {
    console.warn('High number of slow queries detected')
  }

  console.log('Health check passed')
}

healthCheck()
```

Run via cron:
```bash
# Every 5 minutes
*/5 * * * * node /path/to/health-check.js
```

---

## 8. Dashboards

### Supabase Dashboard

**Built-in metrics:**
- Database size
- Active connections
- Query performance
- API requests/sec
- Storage usage

### Custom Grafana Dashboard (Optional)

**Panels:**
1. Request rate (req/s)
2. Error rate (%)
3. Response time (p50, p95, p99)
4. Database connections
5. Cache hit rate
6. Active users

**Data sources:**
- PostgreSQL (via pg_stat_statements)
- Application logs (via Loki)
- Custom metrics (via Prometheus)

---

## 9. Log Aggregation

### Option A: Vercel Log Drains

```bash
# Send logs to external service
vercel env add LOG_DRAIN_URL
```

Supported targets:
- Datadog
- Logtail
- Logflare
- Custom HTTP endpoint

### Option B: CloudWatch Logs (AWS)

For self-hosted Next.js:
```typescript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/logs',
        destination: 'https://logs.aws.amazon.com/cloudwatch'
      }
    ]
  }
}
```

---

## 10. Security Event Monitoring

### Events to Track

**Authentication:**
- Failed login attempts (>5 in 10 min)
- Password reset requests
- New device logins
- Session hijack attempts

**Authorization:**
- Role escalation attempts
- Cross-tenant access attempts
- Unauthorized API calls

**Data Access:**
- Bulk data exports
- Sensitive data access (CPF, phone)
- Admin operations

### Implementation

```typescript
import { logSecurityEvent } from '@/lib/observability/logger'

// In authentication flow
if (failedAttempts > 5) {
  logSecurityEvent('Multiple failed login attempts', 'high', {
    email: email,
    ip: ipAddress,
    attempts: failedAttempts,
  })
}

// In authorization checks
if (attemptedRole > currentRole) {
  logSecurityEvent('Role escalation attempt', 'critical', {
    user_id: userId,
    current_role: currentRole,
    attempted_role: attemptedRole,
  })
}
```

---

## 11. Compliance & Retention

### Log Retention Policy

| Log Type | Retention | Location |
|----------|-----------|----------|
| Application logs | 30 days | Vercel/CloudWatch |
| Error logs | 90 days | Sentry |
| Audit logs | 365 days | Supabase (audit_logs table) |
| Security events | 365 days | Supabase + SIEM |
| Access logs | 90 days | Vercel/CloudWatch |

### LGPD Compliance

- ✅ Log personal data minimally
- ✅ Redact sensitive fields (CPF, passwords, tokens)
- ✅ Provide data export for users
- ✅ Implement right to be forgotten

---

## 12. Implementation Checklist

### Phase 15.1: Logging ✅
- [x] Structured logger implementation
- [x] Log levels configuration
- [x] Context enrichment
- [x] Performance tracking

### Phase 15.2: Error Tracking
- [ ] Choose error tracking service (Sentry recommended)
- [ ] Install and configure service
- [ ] Integrate with logger
- [ ] Test error capture
- [ ] Configure alert rules

### Phase 15.3: APM
- [ ] Enable Vercel Analytics
- [ ] Set up custom metrics
- [ ] Create performance dashboards
- [ ] Configure slow query alerts

### Phase 15.4: Infrastructure Monitoring
- [ ] Review Supabase built-in monitoring
- [ ] Set up Vercel alerts
- [ ] Create health check scripts
- [ ] Configure uptime monitoring

### Phase 15.5: Alerting
- [ ] Define alert rules
- [ ] Configure notification channels
- [ ] Test alert delivery
- [ ] Document on-call procedures

---

## 13. Cost Estimates

### Free Tier Options
- Vercel Analytics: Included
- Supabase Monitoring: Included
- Sentry: 5K events/month free
- LogRocket: 1K sessions/month free

### Paid Options (Production)
- Sentry Team: $26/month (50K events)
- Datadog: $15/host/month
- New Relic: $99/month (100GB data)
- PagerDuty: $21/user/month

**Recommendation:** Start with free tiers, scale to paid as needed.

---

## 14. Next Steps

1. **Immediate (Phase 15.2):**
   - Install Sentry
   - Configure basic alerts
   - Test error tracking

2. **Short-term (Phase 15.3-15.4):**
   - Enable Vercel Analytics
   - Create performance dashboards
   - Set up health checks

3. **Before Production:**
   - Complete all monitoring setup
   - Test all alert channels
   - Document runbooks
   - Train team on dashboards

---

**Last Updated:** 2026-08-17  
**Document Version:** 1.0  
**Status:** Phase 15 Implementation Guide