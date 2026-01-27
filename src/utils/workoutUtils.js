/**
 * Generate a unique ID for segments/workouts
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Create a new block segment
 * @param {number} [power=100] - Target power in watts
 * @param {number} [duration=60] - Duration in seconds
 * @returns {import('../types/workout.js').BlockSegment}
 */
export function createBlockSegment(power = 100, duration = 60) {
  return {
    type: 'block',
    id: generateId(),
    power,
    duration,
  };
}

/**
 * Create a new ramp segment
 * @param {number} [startPower=100] - Starting power in watts
 * @param {number} [endPower=200] - Ending power in watts
 * @param {number} [duration=60] - Duration in seconds
 * @returns {import('../types/workout.js').RampSegment}
 */
export function createRampSegment(startPower = 100, endPower = 200, duration = 60) {
  return {
    type: 'ramp',
    id: generateId(),
    startPower,
    endPower,
    duration,
  };
}

/**
 * Create a new repeat segment
 * @param {number} [count=3] - Number of repetitions
 * @param {Array<import('../types/workout.js').Segment>} [segments=[]] - Nested segments
 * @returns {import('../types/workout.js').RepeatSegment}
 */
export function createRepeatSegment(count = 3, segments = []) {
  return {
    type: 'repeat',
    id: generateId(),
    count,
    segments,
  };
}

/**
 * Calculate total duration of segments (handles nested repeats)
 * @param {Array<import('../types/workout.js').Segment>} segments
 * @returns {number} Total duration in seconds
 */
export function calculateTotalDuration(segments) {
  return segments.reduce((total, segment) => {
    if (segment.type === 'repeat') {
      return total + segment.count * calculateTotalDuration(segment.segments);
    }
    return total + segment.duration;
  }, 0);
}

/**
 * Flatten a workout into a linear execution plan
 * @param {import('../types/workout.js').Workout} workout
 * @returns {Array<import('../types/workout.js').FlatStep>}
 */
export function flattenWorkout(workout) {
  const steps = [];
  let currentTime = 0;

  function processSegments(segments) {
    for (const segment of segments) {
      if (segment.type === 'repeat') {
        for (let i = 0; i < segment.count; i++) {
          processSegments(segment.segments);
        }
      } else if (segment.type === 'block') {
        steps.push({
          type: 'block',
          startTime: currentTime,
          endTime: currentTime + segment.duration,
          duration: segment.duration,
          power: segment.power,
        });
        currentTime += segment.duration;
      } else if (segment.type === 'ramp') {
        steps.push({
          type: 'ramp',
          startTime: currentTime,
          endTime: currentTime + segment.duration,
          duration: segment.duration,
          startPower: segment.startPower,
          endPower: segment.endPower,
        });
        currentTime += segment.duration;
      }
    }
  }

  processSegments(workout.segments);
  return steps;
}

/**
 * Calculate current step and target power at a given elapsed time
 * @param {Array<import('../types/workout.js').FlatStep>} plan - Flattened workout plan
 * @param {number} elapsed - Elapsed time in seconds
 * @returns {{ stepIndex: number, targetPower: number, completed: boolean } | null}
 */
export function calculateCurrentStep(plan, elapsed) {
  if (plan.length === 0) {
    return null;
  }

  const totalDuration = plan[plan.length - 1].endTime;

  if (elapsed >= totalDuration) {
    return {
      stepIndex: plan.length - 1,
      targetPower: plan[plan.length - 1].type === 'ramp'
        ? plan[plan.length - 1].endPower
        : plan[plan.length - 1].power,
      completed: true,
    };
  }

  for (let i = 0; i < plan.length; i++) {
    const step = plan[i];
    if (elapsed >= step.startTime && elapsed < step.endTime) {
      let targetPower;

      if (step.type === 'block') {
        targetPower = step.power;
      } else {
        // Ramp: linear interpolation
        const progress = (elapsed - step.startTime) / step.duration;
        targetPower = Math.round(
          step.startPower + (step.endPower - step.startPower) * progress
        );
      }

      return {
        stepIndex: i,
        targetPower,
        completed: false,
      };
    }
  }

  return null;
}

/**
 * Format duration in seconds to mm:ss string
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create an empty workout
 * @param {string} [name='New Workout']
 * @returns {import('../types/workout.js').Workout}
 */
export function createWorkout(name = 'New Workout') {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    description: '',
    segments: [],
    createdAt: now,
    updatedAt: now,
  };
}
