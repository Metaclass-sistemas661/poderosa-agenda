/**
 * Enterprise Structured Logging System
 * 
 * Features:
 * - Structured JSON logs
 * - Multiple log levels
 * - Context enrichment
 * - Performance tracking
 * - Error tracking integration
 * - Production-ready
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type LogContext = Record<string, unknown>

export interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: LogContext
    error?: {
        name: string
        message: string
        stack?: string
        code?: string
    }
    performance?: {
        duration_ms: number
        operation: string
    }
    user?: {
        id: string
        email?: string
        salon_id?: string
    }
    request?: {
        method: string
        url: string
        ip?: string
        user_agent?: string
    }
}

class Logger {
    private static instance: Logger
    private minLevel: LogLevel = 'info'
    private context: LogContext = {}

    private constructor() {
        // Set log level based on environment
        if (typeof window === 'undefined') {
            // Server-side
            this.minLevel = process.env.LOG_LEVEL as LogLevel || 'info'
        } else {
            // Client-side: less verbose
            this.minLevel = 'warn'
        }
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger()
        }
        return Logger.instance
    }

    /**
     * Set global context that will be included in all logs
     */
    setContext(context: LogContext): void {
        this.context = { ...this.context, ...context }
    }

    /**
     * Clear global context
     */
    clearContext(): void {
        this.context = {}
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']
        return levels.indexOf(level) >= levels.indexOf(this.minLevel)
    }

    private createLogEntry(
        level: LogLevel,
        message: string,
        context?: LogContext,
        error?: Error
    ): LogEntry {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: { ...this.context, ...context },
        }

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: (error as any).code,
            }
        }

        return entry
    }

    private output(entry: LogEntry): void {
        const isServer = typeof window === 'undefined'

        if (isServer) {
            // Server-side: structured JSON to stdout
            console.log(JSON.stringify(entry))
        } else {
            // Client-side: formatted console output
            const style = this.getConsoleStyle(entry.level)
            console.log(
                `%c[${entry.level.toUpperCase()}]%c ${entry.message}`,
                style,
                'color: inherit',
                entry.context || {}
            )
            if (entry.error) {
                console.error(entry.error)
            }
        }

        // Send to external monitoring service in production
        if (process.env.NODE_ENV === 'production' && isServer) {
            this.sendToMonitoring(entry)
        }
    }

    private getConsoleStyle(level: LogLevel): string {
        const styles: Record<LogLevel, string> = {
            debug: 'color: gray',
            info: 'color: blue',
            warn: 'color: orange; font-weight: bold',
            error: 'color: red; font-weight: bold',
            fatal: 'color: white; background: red; font-weight: bold; padding: 2px 4px',
        }
        return styles[level]
    }

    private sendToMonitoring(entry: LogEntry): void {
        // Integration point for external monitoring services
        // Examples: Datadog, New Relic, Sentry, etc.
        // Implementation depends on your chosen service

        // Example: Send to custom endpoint
        if (process.env.MONITORING_ENDPOINT) {
            fetch(process.env.MONITORING_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            }).catch(() => {
                // Silently fail - don't break app for logging issues
            })
        }
    }

    debug(message: string, context?: LogContext): void {
        if (!this.shouldLog('debug')) return
        const entry = this.createLogEntry('debug', message, context)
        this.output(entry)
    }

    info(message: string, context?: LogContext): void {
        if (!this.shouldLog('info')) return
        const entry = this.createLogEntry('info', message, context)
        this.output(entry)
    }

    warn(message: string, context?: LogContext): void {
        if (!this.shouldLog('warn')) return
        const entry = this.createLogEntry('warn', message, context)
        this.output(entry)
    }

    error(message: string, error?: Error, context?: LogContext): void {
        if (!this.shouldLog('error')) return
        const entry = this.createLogEntry('error', message, context, error)
        this.output(entry)

        // Send errors to error tracking service (e.g., Sentry)
        if (process.env.NODE_ENV === 'production') {
            this.sendToErrorTracking(entry)
        }
    }

    fatal(message: string, error?: Error, context?: LogContext): void {
        if (!this.shouldLog('fatal')) return
        const entry = this.createLogEntry('fatal', message, context, error)
        this.output(entry)

        // Fatal errors always go to error tracking
        this.sendToErrorTracking(entry)
    }

    private sendToErrorTracking(entry: LogEntry): void {
        // Integration point for error tracking services
        // Example: Sentry, Rollbar, Bugsnag, etc.

        // Sentry example (requires @sentry/nextjs):
        // Sentry.captureException(entry.error, {
        //   level: entry.level as SeverityLevel,
        //   tags: entry.context,
        // })
    }

    /**
     * Track performance of an operation
     */
    async trackPerformance<T>(
        operation: string,
        fn: () => Promise<T>,
        context?: LogContext
    ): Promise<T> {
        const start = Date.now()
        try {
            const result = await fn()
            const duration = Date.now() - start

            this.info(`Performance: ${operation}`, {
                ...context,
                duration_ms: duration,
                operation,
            })

            return result
        } catch (error) {
            const duration = Date.now() - start
            this.error(
                `Performance: ${operation} (failed)`,
                error as Error,
                {
                    ...context,
                    duration_ms: duration,
                    operation,
                }
            )
            throw error
        }
    }

    /**
     * Create a child logger with additional context
     */
    child(context: LogContext): Logger {
        const child = new Logger()
        child.setContext({ ...this.context, ...context })
        return child
    }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Convenience exports
export const log = {
    debug: (message: string, context?: LogContext) => logger.debug(message, context),
    info: (message: string, context?: LogContext) => logger.info(message, context),
    warn: (message: string, context?: LogContext) => logger.warn(message, context),
    error: (message: string, error?: Error, context?: LogContext) =>
        logger.error(message, error, context),
    fatal: (message: string, error?: Error, context?: LogContext) =>
        logger.fatal(message, error, context),
    performance: <T>(operation: string, fn: () => Promise<T>, context?: LogContext) =>
        logger.trackPerformance(operation, fn, context),
    securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) =>
        logSecurityEvent(event, severity, context),
}

// HTTP request logger middleware
export function logRequest(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext
): void {
    const logContext = {
        ...context,
        request: { method, url },
        response: { status_code: statusCode },
        duration_ms: duration,
    }

    if (statusCode && statusCode >= 400) {
        logger.error(`${method} ${url}`, undefined, logContext)
    } else {
        logger.info(`${method} ${url}`, logContext)
    }
}

// Security event logger
export function logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
): void {
    const logContext = {
        ...context,
        security_event: event,
        severity,
    }

    const levelMap = {
        low: 'info',
        medium: 'warn',
        high: 'error',
        critical: 'fatal',
    } as const

    const level = levelMap[severity]

    if (level === 'error' || level === 'fatal') {
        logger[level](`SECURITY: ${event}`, undefined, logContext)
    } else {
        logger[level](`SECURITY: ${event}`, logContext)
    }
}
