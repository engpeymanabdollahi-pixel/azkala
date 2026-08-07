/**
 * Utility Logger for Production-Safe Logging
 * 
 * - در Production: فقط console.error نمایش داده می‌شود
 * - در Development: تمام لاگ‌ها نمایش داده می‌شوند
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  info(message: string, data?: any): void {
    if (this.isDev) {
      console.log(this.formatMessage('info', message), data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.isDev) {
      console.warn(this.formatMessage('warn', message), data || '');
    }
  }

  error(message: string, error?: any): void {
    // در Production هم خطاها را لاگ می‌کنیم
    console.error(this.formatMessage('error', message), error || '');
  }

  debug(message: string, data?: any): void {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message), data || '');
    }
  }

  // برای سازگاری با console.log موجود
  log(message: string, data?: any): void {
    if (this.isDev) {
      console.log(this.formatMessage('info', message), data || '');
    }
  }
}

export const logger = new Logger();
