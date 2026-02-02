// Recording type definitions using JSDoc

/**
 * @typedef {Object} RecordSample
 * @property {number} timestamp - Unix timestamp (seconds since epoch)
 * @property {number} elapsed - Seconds since workout start
 * @property {number|null} power - Instantaneous power in watts
 * @property {number|null} heartRate - Heart rate in bpm
 * @property {number|null} cadence - Cadence in rpm
 * @property {number|null} speed - Speed in km/h
 * @property {number|null} distance - Cumulative distance in meters
 */

/**
 * @typedef {Object} WorkoutRecording
 * @property {string} workoutName - Name of the workout
 * @property {number} startTime - Unix timestamp (seconds) when recording started
 * @property {number} endTime - Unix timestamp (seconds) when recording ended
 * @property {number} totalElapsed - Total elapsed time in seconds
 * @property {number} totalTimerTime - Total active (non-paused) time in seconds
 * @property {RecordSample[]} samples - Per-second data samples
 */

export {};
