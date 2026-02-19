// Professional structured logging - TypeScript strict mode compatible
export class Logger {
  private static instance: Logger;
  private enableDebug = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.log(`[INFO] ${new Date().toISOString()}`, message, context || '');
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${new Date().toISOString()}`, message, error, context || '');
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${new Date().toISOString()}`, message, context || '');
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.enableDebug) {
      console.debug(`[DEBUG] ${new Date().toISOString()}`, message, context || '');
    }
  }
}

export const logger = Logger.getInstance();
