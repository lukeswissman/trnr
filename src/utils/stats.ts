import type { WorkoutRecording } from '../types/recording';

export function calculateAverage(values: (number | null)[]): number {
    const filtered = values.filter((v): v is number => v !== null && v > 0);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / filtered.length);
}

export function calculateWorkoutStats(recording: WorkoutRecording) {
    const powers = recording.samples.map(s => s.power);
    const heartRates = recording.samples.map(s => s.heartRate);
    const cadences = recording.samples.map(s => s.cadence);

    return {
        avgPower: calculateAverage(powers),
        avgHeartRate: calculateAverage(heartRates),
        avgCadence: calculateAverage(cadences),
        totalDuration: recording.totalTimerTime,
        maxPower: Math.max(...powers.filter((v): v is number => v !== null), 0),
        maxHeartRate: Math.max(...heartRates.filter((v): v is number => v !== null), 0),
    };
}
