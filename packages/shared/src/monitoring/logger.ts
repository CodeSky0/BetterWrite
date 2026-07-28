/**
 * Structured Logging System
 * Provides centralized logging with levels, context, and output destinations
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  service: string;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  enableConsole: boolean;
  enableFile?: boolean;
  filePath?: string;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      service: this.config.service,
    };

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // File logging would be implemented here
    if (this.config.enableFile && this.config.filePath) {
      this.logToFile(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    const logMessage = `[${timestamp}] [${levelName}] [${entry.service}] ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        break;
    }
  }

  private logToFile(_entry: LogEntry): void {
    // File logging implementation would go here
    // For now, this is a placeholder
  }

  withContext(_context: Record<string, any>): Logger {
    // Return a new logger with additional context
    // This would be implemented with a child logger pattern
    return this;
  }
}

export const defaultLoggerConfig: LoggerConfig = {
  level: LogLevel.INFO,
  service: 'betterwrite',
  enableConsole: true,
};
