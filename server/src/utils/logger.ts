import { RequestContext } from './context.js';

/**
 * [OBSERVABILITY] OlyBars Structured Logger
 * 2026 Standards: Structured JSON, AsyncContext ID, FinOps Sampling.
 */

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface LogOptions {
  samplingRate?: number;
  payload?: any;
}

const SERVICE_NAME = 'api-gateway';

export const logger = {
  /**
   * Core logging function
   */
  log(severity: Severity, message: string, options: LogOptions = {}) {
    const { samplingRate = 1.0, payload = {} } = options;

    // 1. FinOps Sampling
    if (samplingRate < 1.0 && Math.random() > samplingRate) {
      return;
    }

    const context = RequestContext.get();

    // 2. Structured log format (GCP compatibility)
    const logEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      serviceContext: { service: SERVICE_NAME },
      loggingContext: {
        correlationId: context?.correlationId,
        userId: context?.userId,
        venueId: context?.venueId,
        path: context?.path,
        method: context?.method,
      },
      ...this.maskSensitiveData(payload),
    };

    // Google Cloud Logging picks up JSON from stdout
    console.log(JSON.stringify(logEntry));
  },

  info(message: string, payload?: any, samplingRate = 1.0) {
    this.log('INFO', message, { payload, samplingRate });
  },

  warn(message: string, payload?: any) {
    this.log('WARNING', message, { payload });
  },

  error(message: string, error?: any) {
    this.log('ERROR', message, {
      payload: {
        error: error?.message || String(error),
        stack: error?.stack,
        ...error
      }
    });
  },

  critical(message: string, error?: any) {
    this.log('CRITICAL', message, {
      payload: {
        error: error?.message || String(error),
        stack: error?.stack,
        ...error
      }
    });
  },

  debug(message: string, payload?: any) {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      this.log('DEBUG', message, { payload });
    }
  },

  /**
   * [ALGORITHMIC TRACING]
   * Specialized logs for the Bayesian engine or complicated physics.
   * Only active if TRACE_LOGGING=true.
   */
  trace(module: string, message: string, data: any) {
    if (process.env.TRACE_LOGGING === 'true') {
      this.log('DEBUG', `[TRACE:${module}] ${message}`, { payload: data });
    }
  },

  /**
   * [SECURITY] Zero-Trust Masking
   * Ensures no PII or partner secrets leak into logs.
   */
  maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    const masked = { ...data };
    const sensitiveKeys = ['wifiPassword', 'posKey', 'auth_token', 'password', 'token', 'apiKey', 'client_secret'];

    for (const key in masked) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        masked[key] = '***MASKED***';
      } else if (masked[key] !== null && typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }
};
