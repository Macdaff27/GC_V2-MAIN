/**
 * Système de logs de développement configurable
 * Désactivé en production pour les performances
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
}

class Logger {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    enableConsole: true,
    enableStorage: false,
    maxStoredLogs: 100,
  };

  private logs: Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> = [];

  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const levelName = LogLevel[level];
    const timestamp = context?.timestamp || new Date().toISOString();
    const component = context?.component ? `[${context.component}]` : '';
    const action = context?.action ? `(${context.action})` : '';

    return `${timestamp} ${levelName} ${component}${action}: ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    const logEntry = {
      level,
      message: formattedMessage,
      context,
      timestamp: new Date().toISOString(),
    };

    // Console logging
    if (this.config.enableConsole) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' :
                           level === LogLevel.WARN ? 'warn' :
                           level === LogLevel.INFO ? 'info' : 'debug';
      console[consoleMethod](formattedMessage, context || '');
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.logs.push(logEntry);
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs.shift(); // Remove oldest
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }

  // Utility methods
  getLogs(level?: LogLevel): Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const logger = new Logger();

// Configure for development
if (__DEV__) {
  logger.configure({
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableStorage: true,
  });
} else {
  logger.configure({
    level: LogLevel.ERROR,
    enableConsole: false,
    enableStorage: false,
  });
}

// Convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, context?: LogContext) => logger.error(message, context);

// React hook for component logging
export const useLogger = (componentName: string) => {
  return {
    debug: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.debug(message, { ...context, component: componentName }),
    info: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.info(message, { ...context, component: componentName }),
    warn: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.warn(message, { ...context, component: componentName }),
    error: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.error(message, { ...context, component: componentName }),
  };
};
