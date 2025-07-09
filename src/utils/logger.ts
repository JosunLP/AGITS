import { pino, Logger as PinoLogger } from 'pino';
import { appConfig } from '../config/app.js';

/**
 * Structured logger implementation using Pino
 */
export class Logger {
  private logger: PinoLogger;

  constructor(name: string) {
    this.logger = pino({
      name,
      level: appConfig.logLevel,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...(appConfig.environment === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'hostname,pid',
          },
        },
      }),
    });
  }

  /**
   * Log trace level message
   */
  trace(message: string, ...args: any[]): void;
  trace(obj: object, message?: string, ...args: any[]): void;
  trace(obj: any, message?: any, ...args: any[]): void {
    if (typeof obj === 'string') {
      this.logger.trace(obj, ...args);
    } else {
      this.logger.trace(obj, message, ...args);
    }
  }

  /**
   * Log debug level message
   */
  debug(message: string, ...args: any[]): void;
  debug(obj: object, message?: string, ...args: any[]): void;
  debug(obj: any, message?: any, ...args: any[]): void {
    if (typeof obj === 'string') {
      this.logger.debug(obj, ...args);
    } else {
      this.logger.debug(obj, message, ...args);
    }
  }

  /**
   * Log info level message
   */
  info(message: string, ...args: any[]): void;
  info(obj: object, message?: string, ...args: any[]): void;
  info(obj: any, message?: any, ...args: any[]): void {
    if (typeof obj === 'string') {
      this.logger.info(obj, ...args);
    } else {
      this.logger.info(obj, message, ...args);
    }
  }

  /**
   * Log warn level message
   */
  warn(message: string, ...args: any[]): void;
  warn(obj: object, message?: string, ...args: any[]): void;
  warn(obj: any, message?: any, ...args: any[]): void {
    if (typeof obj === 'string') {
      this.logger.warn(obj, ...args);
    } else {
      this.logger.warn(obj, message, ...args);
    }
  }

  /**
   * Log error level message
   */
  error(message: string, ...args: any[]): void;
  error(obj: object, message?: string, ...args: any[]): void;
  error(obj: any, message?: any, ...args: any[]): void {
    if (typeof obj === 'string') {
      this.logger.error(obj, ...args);
    } else {
      this.logger.error(obj, message, ...args);
    }
  }

  /**
   * Log fatal level message
   */
  fatal(message: string, ...args: any[]): void;
  fatal(obj: object, message?: string, ...args: any[]): void;
  fatal(obj: any, message?: any, ...args: any[]): void {
    if (typeof obj === 'string') {
      this.logger.fatal(obj, ...args);
    } else {
      this.logger.fatal(obj, message, ...args);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: object): Logger {
    const childLogger = new Logger('child');
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }

  /**
   * Get the underlying Pino logger instance
   */
  getPinoLogger(): PinoLogger {
    return this.logger;
  }
}
