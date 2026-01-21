/**
 * Système de logging structuré
 * Remplace les console.log/error/warn par un système plus robuste
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;
  private enabled: boolean;

  constructor() {
    this.enabled = __DEV__ || process.env.NODE_ENV === 'development';
    this.level = this.enabled ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  /**
   * Définit le niveau de logging
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Active ou désactive le logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log de debug (développement uniquement)
   */
  debug(message: string, context?: LogContext): void {
    if (this.enabled && this.level <= LogLevel.DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log d'information
   */
  info(message: string, context?: LogContext): void {
    if (this.enabled && this.level <= LogLevel.INFO) {
      console.log(`ℹ️ [INFO] ${message}`, context || '');
    }
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: LogContext): void {
    if (this.enabled && this.level <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, context || '');
    }
  }

  /**
   * Log d'erreur
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.enabled && this.level <= LogLevel.ERROR) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      };
      console.error(`❌ [ERROR] ${message}`, errorContext);
    }
  }

  /**
   * Log d'une requête API
   */
  apiRequest(method: string, url: string, options?: RequestInit): void {
    if (this.enabled && this.level <= LogLevel.DEBUG) {
      console.log(`🌐 [API] ${method} ${url}`, {
        headers: options?.headers,
        body: options?.body,
      });
    }
  }

  /**
   * Log d'une réponse API
   */
  apiResponse(method: string, url: string, status: number, duration: number, data?: unknown): void {
    if (this.enabled && this.level <= LogLevel.DEBUG) {
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${emoji} [API] ${method} ${url} - ${status} (${duration}ms)`, data);
    }
  }

  /**
   * Log d'une erreur API
   */
  apiError(method: string, url: string, status: number, error: unknown): void {
    if (this.enabled && this.level <= LogLevel.ERROR) {
      console.error(`❌ [API ERROR] ${method} ${url} - ${status}`, error);
    }
  }
}

// Instance singleton
export const logger = new Logger();

// Export des méthodes pour faciliter l'utilisation
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => logger.error(message, error, context),
  api: {
    request: (method: string, url: string, options?: RequestInit) => logger.apiRequest(method, url, options),
    response: (method: string, url: string, status: number, duration: number, data?: unknown) =>
      logger.apiResponse(method, url, status, duration, data),
    error: (method: string, url: string, status: number, error: unknown) => logger.apiError(method, url, status, error),
  },
};

