export interface LogContext {
  scanId?: string;
  requestId?: string;
  stage?: string;
  durationMs?: number;
  status?: string;
  errorCode?: string;
  [key: string]: unknown;
}

export class Logger {
  static info(message: string, context?: LogContext): void {
    console.log(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  }

  static warn(message: string, context?: LogContext): void {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  }

  static error(message: string, error?: unknown, context?: LogContext): void {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        ...context,
      })
    );
  }
}
