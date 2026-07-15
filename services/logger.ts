type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'performance';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: unknown;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  private debugEnabled =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_DEBUG === 'true';

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = { level, message, timestamp: Date.now(), data };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    if (this.isDev || this.debugEnabled) {
      const prefix = `[AirWriter ${level.toUpperCase()}]`;
      switch (level) {
        case 'error':
          console.error(prefix, message, data ?? '');
          break;
        case 'warn':
          console.warn(prefix, message, data ?? '');
          break;
        case 'debug':
          if (this.debugEnabled) console.debug(prefix, message, data ?? '');
          break;
        default:
          console.log(prefix, message, data ?? '');
      }
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  performance(message: string, data?: unknown): void {
    this.log('performance', message, data);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) return this.logs.filter((l) => l.level === level);
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }
}

export const logger = new LoggerService();
