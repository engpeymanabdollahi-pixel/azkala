/**
 * Logger utility for consistent logging across the application
 * In production, only errors are logged to console
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isProduction: boolean;
  private enabledLevels: Set<LogLevel>;

  constructor(isProduction: boolean = false) {
    this.isProduction = isProduction;
    
    // In production, only log errors by default
    this.enabledLevels = isProduction 
      ? new Set(['error']) 
      : new Set(['debug', 'info', 'warn', 'error']);
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabledLevels.has(level);
  }

  private formatMessage(level: LogLevel, message: string, ..._args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
      
      // Always log errors to an external service in production
      if (this.isProduction) {
        this.sendToErrorTracking(message, args);
      }
    }
  }

  /**
   * Send error to external tracking service (e.g., Sentry)
   */
  private sendToErrorTracking(message: string, _args: unknown[]): void {
    // Placeholder for Sentry or other error tracking integration
    // Example: Sentry.captureException(new Error(message));
    if (typeof window !== 'undefined') {
      const win = window as typeof window & { Sentry?: { captureException: (error: Error) => void } };
      if (win.Sentry) {
        win.Sentry.captureException(new Error(message));
      }
    }
  }

  /**
   * Log API request/response
   */
  apiRequest(method: string, url: string, status?: number, duration?: number): void {
    const message = `API ${method} ${url}${status ? ` - ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    if (status && status >= 400) {
      this.error(message);
    } else {
      this.info(message);
    }
  }

  /**
   * Log user action
   */
  userAction(action: string, details?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, details || {});
  }
}

// Create singleton instance
const isProduction = import.meta.env.PROD;
export const logger = new Logger(isProduction);

// Export for testing purposes
export { Logger };
