import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * [OBSERVABILITY] RequestContext
 * Uses Node.js AsyncLocalStorage to propagate request-specific metadata 
 * (correlationId, userId) without argument drilling.
 */
export interface RequestContextData {
  correlationId: string;
  userId?: string;
  venueId?: string;
  method?: string;
  path?: string;
  clientIp?: string;
}

const storage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  /**
   * Run a function within a fresh context.
   */
  run(data: RequestContextData, fn: () => void) {
    return storage.run(data, fn);
  },

  /**
   * Get the current context data.
   */
  get(): RequestContextData | undefined {
    return storage.getStore();
  },

  /**
   * Access the correlation ID safely.
   */
  getCorrelationId(): string {
    return this.get()?.correlationId || 'no-context';
  },

  /**
   * Update the current context (e.g., after Auth middleware identifies the user).
   */
  update(payload: Partial<RequestContextData>) {
    const current = this.get();
    if (current) {
      Object.assign(current, payload);
    }
  }
};
