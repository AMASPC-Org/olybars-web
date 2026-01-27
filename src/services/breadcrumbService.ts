/**
 * [OBSERVABILITY] BreadcrumbService
 * Implements a fixed-size ring buffer for tracking user breadcrumbs.
 * Ensures long-running sessions don't leak memory.
 */

type BreadcrumbType = 'NAVIGATE' | 'CLICK' | 'MUTATION' | 'SYSTEM' | 'ERROR';

interface Breadcrumb {
  type: BreadcrumbType;
  message: string;
  timestamp: string;
  metadata?: any;
}

const MAX_BREADCRUMBS = 20;
let breadcrumbs: Breadcrumb[] = [];

export const BreadcrumbService = {
  /**
   * Add a new breadcrumb to the ring buffer.
   */
  add(type: BreadcrumbType, message: string, metadata?: any) {
    const entry: Breadcrumb = {
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    breadcrumbs.push(entry);

    // Maintain fixed size
    if (breadcrumbs.length > MAX_BREADCRUMBS) {
      breadcrumbs.shift();
    }
  },

  /**
   * Get all breadcrumbs for error reporting.
   */
  get(): Breadcrumb[] {
    return [...breadcrumbs];
  },

  /**
   * Helper for navigation events
   */
  trackNavigation(to: string) {
    this.add('NAVIGATE', `Navigated to ${to}`);
  },

  /**
   * Helper for click events
   */
  trackClick(elementId: string, label?: string) {
    this.add('CLICK', `Clicked ${label || elementId}`, { elementId });
  },

  /**
   * Clear the buffer (e.g., after successful error report)
   */
  clear() {
    breadcrumbs = [];
  },
};
