// Workout type definitions using JSDoc

/**
 * @typedef {'block' | 'ramp' | 'repeat'} SegmentType
 */

/**
 * @typedef {Object} BlockSegment
 * @property {'block'} type
 * @property {string} id
 * @property {number} power - Target power in watts
 * @property {number} duration - Duration in seconds
 */

/**
 * @typedef {Object} RampSegment
 * @property {'ramp'} type
 * @property {string} id
 * @property {number} startPower - Starting power in watts
 * @property {number} endPower - Ending power in watts
 * @property {number} duration - Duration in seconds
 */

/**
 * @typedef {Object} RepeatSegment
 * @property {'repeat'} type
 * @property {string} id
 * @property {number} count - Number of repetitions
 * @property {Array<BlockSegment | RampSegment | RepeatSegment>} segments
 */

/**
 * @typedef {BlockSegment | RampSegment | RepeatSegment} Segment
 */

/**
 * @typedef {Object} Workout
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {Array<Segment>} segments
 * @property {number} createdAt - Unix timestamp
 * @property {number} updatedAt - Unix timestamp
 */

/**
 * @typedef {Object} FlatStep
 * @property {'block' | 'ramp'} type
 * @property {number} startTime - Start time in seconds from workout beginning
 * @property {number} endTime - End time in seconds from workout beginning
 * @property {number} duration - Duration in seconds
 * @property {number} power - Target power (for block)
 * @property {number} [startPower] - Starting power (for ramp)
 * @property {number} [endPower] - Ending power (for ramp)
 */

/**
 * @typedef {'idle' | 'running' | 'paused' | 'completed'} ExecutionStatus
 */

/**
 * @typedef {'display' | 'erg'} ExecutionMode
 */

export {};
