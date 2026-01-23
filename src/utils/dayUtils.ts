/**
 * Day name normalization utilities.
 * Handles mapping between full names (Monday) and short names (Mon).
 */

export const FULL_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const SHORT_DAYS = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
];

/**
 * Returns the short day name (e.g. "Mon") for a given date or full day name.
 */
export const getShortDay = (input: Date | string): string => {
  if (input instanceof Date) {
    return SHORT_DAYS[input.getDay()];
  }

  const lowerInput = input.toLowerCase();

  // Check short names
  const shortIdx = SHORT_DAYS.findIndex(d => d.toLowerCase() === lowerInput);
  if (shortIdx !== -1) return SHORT_DAYS[shortIdx];

  // Check full names
  const fullIdx = FULL_DAYS.findIndex(d => d.toLowerCase() === lowerInput);
  if (fullIdx !== -1) return SHORT_DAYS[fullIdx];

  return input; // Fallback
};

/**
 * Normalizes a day name to its short version (e.g. "Mon", "Tue").
 */
export const normalizeDay = (day: string): string => {
  return getShortDay(day);
};
