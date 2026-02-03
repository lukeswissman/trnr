import { describe, it, expect } from 'vitest';
import { calculateAverage, calculateWorkoutStats } from './stats';
import type { WorkoutRecording } from '../types/recording';

describe('calculateAverage', () => {
  it('calculates average of positive numbers', () => {
    expect(calculateAverage([100, 200, 300])).toBe(200);
  });

  it('rounds the result to nearest integer', () => {
    expect(calculateAverage([100, 101])).toBe(101); // 100.5 rounds to 101
  });

  it('filters out null values', () => {
    expect(calculateAverage([100, null, 200, null])).toBe(150);
  });

  it('filters out zero values', () => {
    expect(calculateAverage([0, 100, 0, 200])).toBe(150);
  });

  it('returns 0 for empty array', () => {
    expect(calculateAverage([])).toBe(0);
  });

  it('returns 0 when all values are null', () => {
    expect(calculateAverage([null, null, null])).toBe(0);
  });

  it('returns 0 when all values are zero', () => {
    expect(calculateAverage([0, 0, 0])).toBe(0);
  });
});

describe('calculateWorkoutStats', () => {
  const createRecording = (
    samples: Array<{
      power?: number | null;
      heartRate?: number | null;
      cadence?: number | null;
    }>,
    totalTimerTime: number = 600
  ): WorkoutRecording => ({
    workoutName: 'Test Workout',
    startTime: 1000,
    endTime: 1000 + totalTimerTime,
    totalElapsed: totalTimerTime,
    totalTimerTime,
    samples: samples.map((s, i) => ({
      timestamp: 1000 + i,
      elapsed: i,
      power: s.power ?? null,
      heartRate: s.heartRate ?? null,
      cadence: s.cadence ?? null,
      speed: null,
      distance: null,
    })),
  });

  it('calculates average power from samples', () => {
    const recording = createRecording([
      { power: 150 },
      { power: 200 },
      { power: 250 },
    ]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.avgPower).toBe(200);
  });

  it('calculates max power from samples', () => {
    const recording = createRecording([
      { power: 150 },
      { power: 300 },
      { power: 200 },
    ]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.maxPower).toBe(300);
  });

  it('calculates average heart rate from samples', () => {
    const recording = createRecording([
      { heartRate: 120 },
      { heartRate: 140 },
      { heartRate: 160 },
    ]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.avgHeartRate).toBe(140);
  });

  it('calculates max heart rate from samples', () => {
    const recording = createRecording([
      { heartRate: 120 },
      { heartRate: 180 },
      { heartRate: 150 },
    ]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.maxHeartRate).toBe(180);
  });

  it('calculates average cadence from samples', () => {
    const recording = createRecording([
      { cadence: 80 },
      { cadence: 90 },
      { cadence: 100 },
    ]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.avgCadence).toBe(90);
  });

  it('returns total duration from recording', () => {
    const recording = createRecording([], 1800);
    const stats = calculateWorkoutStats(recording);
    expect(stats.totalDuration).toBe(1800);
  });

  it('handles mixed null and valid values', () => {
    const recording = createRecording([
      { power: 200, heartRate: null, cadence: 90 },
      { power: null, heartRate: 150, cadence: null },
      { power: 200, heartRate: 150, cadence: 90 },
    ]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.avgPower).toBe(200);
    expect(stats.avgHeartRate).toBe(150);
    expect(stats.avgCadence).toBe(90);
  });

  it('returns 0 for metrics with no valid samples', () => {
    const recording = createRecording([
      { power: null, heartRate: null, cadence: null },
      { power: null, heartRate: null, cadence: null },
    ]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.avgPower).toBe(0);
    expect(stats.avgHeartRate).toBe(0);
    expect(stats.avgCadence).toBe(0);
    expect(stats.maxPower).toBe(0);
    expect(stats.maxHeartRate).toBe(0);
  });

  it('handles empty samples array', () => {
    const recording = createRecording([]);
    const stats = calculateWorkoutStats(recording);
    expect(stats.avgPower).toBe(0);
    expect(stats.maxPower).toBe(0);
  });
});
