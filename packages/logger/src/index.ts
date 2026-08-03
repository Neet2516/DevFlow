/**
 * @devflow/logger — structured JSON logger with correlation ID propagation.
 * Every log entry includes service, executionId, jobId, and level.
 * Implements doc 21-observability.md: every log line is machine-queryable by executionId.
 */
export interface LogContext {
  service: string;
  executionId?: string;
  jobId?: string;
  workerId?: string;
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, context: LogContext, extra?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...(extra ?? {}),
  };
  // Use stderr for error, stdout for rest
  const out = level === 'error' ? process.stderr : process.stdout;
  out.write(JSON.stringify(entry) + '\n');
}

export function createLogger(context: LogContext) {
  return {
    debug: (msg: string, extra?: Record<string, unknown>) => log('debug', msg, context, extra),
    info:  (msg: string, extra?: Record<string, unknown>) => log('info',  msg, context, extra),
    warn:  (msg: string, extra?: Record<string, unknown>) => log('warn',  msg, context, extra),
    error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, context, extra),
    child: (childContext: Partial<LogContext>) => createLogger({ ...context, ...childContext }),
  };
}

export const rootLogger = createLogger({ service: 'devflow' });
