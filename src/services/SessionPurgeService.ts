import { queryClient } from '../lib/queryClient';

/**
 * Keys that should SURVIVE a Nuclear Purge (Logout).
 * These are "Quality of Life" settings that don't contain user-specific PII or sensitive ops data.
 */
const PRESERVED_KEYS = [
  'olybars_view_mode', // Keeps "Owner Mode" toggle preference
  'oly_age_gate',      // Keeps Age Gate acceptance (so they don't get carded again)
  'oly_terms'          // Keeps Terms of Service acceptance
];

export const SessionPurgeService = {
  /**
   * Performs a session cleanup.
   * @param mode 'nuclear' for full logout, 'switch' for persona change
   */
  purgeSession: (mode: 'nuclear' | 'switch') => {
    console.log(`[SessionPurge] Initiating ${mode} purge...`);

    if (mode === 'nuclear') {
      // 1. LocalStorage Surgical Removal
      // We iterate backwards to safely remove keys while looping
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !PRESERVED_KEYS.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.debug(`[SessionPurge] Removed: ${key}`);
      });

      // 2. Clear TanStack Query Cache (API responses)
      queryClient.clear();

      console.log('[SessionPurge] Nuclear purge complete. redirecting...');

      // 3. Hard Redirect to clear memory state (React State, Contexts)
      window.location.href = '/';
    }
    else if (mode === 'switch') {
      // Soft Purge for switching from Owner -> Guest
      // We only want to clear Owner-specific queries and data

      // Clear Ops/Admin queries
      queryClient.removeQueries({ queryKey: ['owner'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
      queryClient.removeQueries({ queryKey: ['venues-brief'] }); // Force fresh venue fetch

      console.log('[SessionPurge] Switch purge complete.');
    }
  }
};
