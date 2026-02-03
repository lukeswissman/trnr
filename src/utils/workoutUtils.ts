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
