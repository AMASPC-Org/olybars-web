import { Signal } from '../../../src/types.js';
import { PULSE_CONFIG } from '../../../src/config/pulse.js';
import { logger } from './logger.js';

/**
 * [SCORING ENGINE]
 * Pure functions for calculating Buzz Scores, Saturation, and Consensus.
 * Decouples 'Game Economy' (Points) from 'Physics' (Density).
 */

// 15 Minutes: Coordinated burst window
const BURST_WINDOW_MS = 15 * 60 * 1000;
const MILLIS_PER_HOUR = 60 * 60 * 1000;

/**
 * Calculates the Buzz Score with Square Root Damping for bursts.
 * 
 * Formula:
 * 1. Base Score = Sum(Signal * RecencyDecay)
 * 2. Damping = 1 / Sqrt(BurstCount) applied to signals in short windows.
 */
export const calculateDampedScore = (signals: Signal[], now: number = Date.now()): number => {
    let score = 0;

    // 1. Sort signals by time (descending)
    const sortedSignals = [...signals].sort((a, b) => b.timestamp - a.timestamp);

    // 2. Group into Burst Windows
    // Simple greedy clustering: Iterate and check if signal is within window of the current cluster start
    // However, for simplicity and performance in this MVP, we will count 'concurrent user bursts'.
    // Actually, a simpler approach for the Damping Factor as strictly defined in the plan:
    // "Count signals in the immediate 'burst' window (last 15m)"
    // This penalizes a sudden spike NOW, which is the primary attack vector.

    // We will apply damping to ANY signal that falls within a high-density temporal cluster.
    // For MVP, we'll look at the *global* concurrency in the last `BURST_WINDOW_MS`.

    const recentSignals = sortedSignals.filter(s => (now - s.timestamp) < BURST_WINDOW_MS);
    const burstCount = recentSignals.length;

    // Damping Factor: Starts at 1.0, drops as burstCount increases
    // 1 signal = 1.0x
    // 4 signals = 0.5x
    // 9 signals = 0.33x
    // We only damp the *recent* signals. Old signals (organic history) retain full value (subject to decay).
    const dampingFactor = burstCount > 1 ? 1 / Math.sqrt(burstCount) : 1.0;

    logger.trace('SCORING', 'Calculating Damped Score', {
        burstCount,
        dampingFactor,
        totalSignals: sortedSignals.length
    });

    for (const signal of sortedSignals) {
        // ... existing logic ...
        let val = 0;
        if (signal.type === 'clock_in') val = PULSE_CONFIG.POINTS.CLOCK_IN; // 10
        if (signal.type === 'vibe_report') val = PULSE_CONFIG.POINTS.VIBE_REPORT; // 5

        const ageMs = now - signal.timestamp;
        const decayHalflifeMs = PULSE_CONFIG.WINDOWS.DECAY_HALFLIFE || MILLIS_PER_HOUR;

        if (ageMs < 0) continue;

        const ageInHalfLives = ageMs / decayHalflifeMs;
        const decayedValue = val * Math.pow(0.5, ageInHalfLives);

        if (ageMs < BURST_WINDOW_MS) {
            score += decayedValue * dampingFactor;
        } else {
            score += decayedValue;
        }
    }

    logger.trace('SCORING', 'Calculation Complete', { finalScore: score });
    return score;
};

/**
 * Calculates Pure Virtual Decay (for read-only operations).
 * This mimics the decay logic of calculateDampedScore but for a pre-computed aggregate.
 * Note: It cannot apply retroactive damping without raw signals, so it's an approximation.
 */
export const calculateDecayedScore = (currentScore: number, lastUpdated: number, now: number = Date.now()): number => {
    if (!currentScore || !lastUpdated) return 0;

    const ageMs = now - lastUpdated;
    if (ageMs < 0) return currentScore;

    const decayHalflifeMs = PULSE_CONFIG.WINDOWS.DECAY_HALFLIFE || MILLIS_PER_HOUR;
    const ageInHalfLives = ageMs / decayHalflifeMs;

    return currentScore * Math.pow(0.5, ageInHalfLives);
};

/**
 * Determine the dynamic consensus threshold based on venue size.
 * Rule: Max(3, 5% of Capacity)
 */
export const getConsensusThreshold = (capacity: number): number => {
    // Safety fallback
    const cap = capacity > 0 ? capacity : PULSE_CONFIG.PHYSICS.DEFAULT_CAPACITY;

    // 5% rule
    const fractionalThreshold = cap * 0.05;

    // Round up (you can't have 2.5 people) and ensure floor of 3
    return Math.max(3, Math.ceil(fractionalThreshold));
};

/**
 * Calculate Saturation Ratio (Headcount / Capacity).
 * 
 * CRITICAL: This uses HEADCOUNT (Unique People), not SCORE (Points).
 * This prevents a few high-point users (e.g. photos/bounties) from artificially 
 * filling the bar's status.
 */
export const calculateSaturation = (headcount: number, capacity: number): number => {
    const cap = capacity > 0 ? capacity : PULSE_CONFIG.PHYSICS.DEFAULT_CAPACITY;
    return headcount / cap;
};
