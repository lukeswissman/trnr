import { createContext } from 'react';
import type { Workout, ExecutionStatus, ExecutionMode, FlatStep } from '../types/workout';

export interface WorkoutContextValue {
  // Library state
  workouts: Workout[];
  saveWorkout: (workout: Workout) => Workout;
  deleteWorkout: (id: string) => void;
  refreshWorkouts: () => void;

  // Editing state
  editingWorkout: Workout | null;
  startEditing: (workout: Workout) => void;
  stopEditing: () => void;

  // Execution state
  activeWorkout: Workout | null;
  executionStatus: ExecutionStatus;
  executionMode: ExecutionMode;
  elapsed: number;
  totalDuration: number;
  currentStepIndex: number;
  targetPower: number;
  plan: FlatStep[];

  // Execution actions
  startWorkout: (workout: Workout, mode?: ExecutionMode) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: () => void;
  stopWorkout: () => void;
  setOnTargetPowerChange: (callback: ((power: number) => void) | null) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
}

export const WorkoutContext = createContext<WorkoutContextValue | null>(null);
