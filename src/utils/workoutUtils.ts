import type {
  BlockSegment,
  RampSegment,
  RepeatSegment,
  Segment,
  Workout,
  FlatStep,
} from '../types/workout';

/**
 * Generate a unique ID for segments/workouts
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Create a new block segment
 */
export function createBlockSegment(power: number = 100, duration: number = 60): BlockSegment {
  return {
    type: 'block',
    id: generateId(),
    power,
    duration,
  };
}

/**
 * Create a new ramp segment
 */
export function createRampSegment(
  startPower: number = 100,
  endPower: number = 200,
  duration: number = 60
): RampSegment {
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
 */
export function createRepeatSegment(
  count: number = 3,
  segments: Segment[] = []
): RepeatSegment {
  return {
    type: 'repeat',
    id: generateId(),
    count,
    segments,
  };
}

/**
 * Calculate total duration of segments (handles nested repeats)
 */
export function calculateTotalDuration(segments: Segment[]): number {
  return segments.reduce((total, segment) => {
    if (segment.type === 'repeat') {
      return total + segment.count * calculateTotalDuration(segment.segments);
    }
    return total + segment.duration;
  }, 0);
}

/**
 * Flatten a workout into a linear execution plan
 */
export function flattenWorkout(workout: Workout): FlatStep[] {
  const steps: FlatStep[] = [];
  let currentTime = 0;

  function processSegments(segments: Segment[]): void {
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
          power: segment.startPower,
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

export interface CurrentStepResult {
  stepIndex: number;
  targetPower: number;
  completed: boolean;
}

/**
 * Calculate current step and target power at a given elapsed time
 */
export function calculateCurrentStep(
  plan: FlatStep[],
  elapsed: number
): CurrentStepResult | null {
  if (plan.length === 0) {
    return null;
  }

  const totalDuration = plan[plan.length - 1].endTime;

  if (elapsed >= totalDuration) {
    const lastStep = plan[plan.length - 1];
    return {
      stepIndex: plan.length - 1,
      targetPower: lastStep.type === 'ramp' ? lastStep.endPower! : lastStep.power,
      completed: true,
    };
  }

  for (let i = 0; i < plan.length; i++) {
    const step = plan[i];
    if (elapsed >= step.startTime && elapsed < step.endTime) {
      let targetPower: number;

      if (step.type === 'block') {
        targetPower = step.power;
      } else {
        // Ramp: linear interpolation
        const progress = (elapsed - step.startTime) / step.duration;
        targetPower = Math.round(
          step.startPower! + (step.endPower! - step.startPower!) * progress
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

export interface SegmentBoundary {
  index: number;
  segment: Segment;
  startTime: number;
  endTime: number;
}

export function getTopLevelSegmentBoundaries(segments: Segment[]): SegmentBoundary[] {
  const boundaries: SegmentBoundary[] = [];
  let currentTime = 0;
  for (let i = 0; i < segments.length; i++) {
    const duration = calculateTotalDuration([segments[i]]);
    boundaries.push({
      index: i,
      segment: segments[i],
      startTime: currentTime,
      endTime: currentTime + duration,
    });
    currentTime += duration;
  }
  return boundaries;
}

/**
 * Slice a segment to a time window [fromTime, toTime) relative to the segment's start at 0.
 * Flattens the segment into FlatSteps, clips to the window, and returns new Segments.
 */
export function sliceSegment(segment: Segment, fromTime: number, toTime: number): Segment[] {
  const tempWorkout: Workout = {
    id: 'temp',
    name: '',
    segments: [segment],
    createdAt: 0,
    updatedAt: 0,
  };
  const steps = flattenWorkout(tempWorkout);
  const result: Segment[] = [];

  for (const step of steps) {
    // Skip steps fully outside the window
    if (step.endTime <= fromTime || step.startTime >= toTime) continue;

    // Clip to window
    const clipStart = Math.max(step.startTime, fromTime);
    const clipEnd = Math.min(step.endTime, toTime);
    const clippedDuration = clipEnd - clipStart;

    if (clippedDuration <= 0) continue;

    if (step.type === 'block') {
      result.push({
        type: 'block',
        id: generateId(),
        power: step.power,
        duration: clippedDuration,
      });
    } else {
      // Ramp: interpolate power at clip boundaries
      const startFrac = (clipStart - step.startTime) / step.duration;
      const endFrac = (clipEnd - step.startTime) / step.duration;
      const startPower = step.startPower! + (step.endPower! - step.startPower!) * startFrac;
      const endPower = step.startPower! + (step.endPower! - step.startPower!) * endFrac;
      result.push({
        type: 'ramp',
        id: generateId(),
        startPower: Math.round(startPower),
        endPower: Math.round(endPower),
        duration: clippedDuration,
      });
    }
  }

  return result;
}

/**
 * Format duration in seconds to mm:ss string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create an empty workout
 */
export function createWorkout(name: string = 'New Workout'): Workout {
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
