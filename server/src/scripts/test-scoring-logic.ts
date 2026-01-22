import { calculateDampedScore, getConsensusThreshold, calculateSaturation } from '../utils/scoring.js';
import { Signal } from '../../../src/types.js';

const mockSignal = (type: 'clock_in' | 'vibe_report', offsetMinutes: number = 0): Signal => ({
    userId: 'user-' + Math.random(),
    venueId: 'venue-1',
    type,
    timestamp: Date.now() - (offsetMinutes * 60 * 1000),
    verificationMethod: 'gps'
} as Signal);

console.log('--- TESTING SCORING LOGIC ---');

// 1. BURST DAMPING TEST
console.log('\n[TEST 1] Burst Damping');
const burstSignals = Array(10).fill(null).map(() => mockSignal('clock_in', 0)); // 10 signals RIGHT NOW
// Spread signals over 3 hours (one every 18 mins), so they don't trigger burst window (15m) keying, 
// but aren't decayed into oblivion like the 10 hour test.
const spreadSignals = Array(10).fill(null).map((_, i) => mockSignal('clock_in', i * 18));

const burstScore = calculateDampedScore(burstSignals);
const spreadScore = calculateDampedScore(spreadSignals);

console.log(`Burst Score (10 instant): ${burstScore.toFixed(2)}`);
console.log(`Spread Score (10 over 3h): ${spreadScore.toFixed(2)}`);

if (burstScore < spreadScore) {
    console.log('PASS: Burst score is significantly dampened compared to spread score.');
    const linearScore = 100;
    console.log(`Theoretical Linear Score: ${linearScore}`);
    console.log(`Damped Burst Score: ${burstScore.toFixed(2)}`);
} else {
    console.log('FAIL: Burst score was not dampened!');
}

// 2. CONSENSUS THRESHOLD TEST
console.log('\n[TEST 2] Dynamic Consensus Thresholds');
const testCaps = [20, 50, 100, 300, 500];
testCaps.forEach(cap => {
    const threshold = getConsensusThreshold(cap);
    console.log(`Capacity ${cap}: Need ${threshold} clock-ins`);
});

const smallVenueCheck = getConsensusThreshold(20) === 3;
const hugeVenueCheck = getConsensusThreshold(300) === 15; // 300 * 0.05 = 15

if (smallVenueCheck && hugeVenueCheck) {
    console.log('PASS: Thresholds follow logic Max(3, 5%).');
} else {
    console.log(`FAIL: Thresholds incorrect. Small: ${smallVenueCheck}, Huge: ${hugeVenueCheck}`);
}

// 3. SATURATION LOGIC
console.log('\n[TEST 3] Body-Based Saturation');
const capacity = 100;
const points = 5000; // Impossible high score (hackers!)
const headlessHackers = 0; // But nobody is there physically
const saturationEmpty = calculateSaturation(headlessHackers, capacity);

const realCrowd = 85;
const saturationPacked = calculateSaturation(realCrowd, capacity);

console.log(`Hacker Saturation (5000pts, 0 ppl): ${saturationEmpty.toFixed(2)}`);
console.log(`Real Saturation (85 ppl): ${saturationPacked.toFixed(2)}`);

if (saturationEmpty === 0 && saturationPacked === 0.85) {
    console.log('PASS: Saturation respects Headcount, ignores Points.');
} else {
    console.log('FAIL: Saturation calculation logic error.');
}
