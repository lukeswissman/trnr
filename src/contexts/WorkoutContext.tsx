import { useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { WorkoutContext, type WorkoutContextValue } from './workoutContext';
import {
  getWorkoutsFromStorage,
  saveWorkoutToStorage,
  deleteWorkoutFromStorage,
} from '../utils/workoutStorage';
import {
  flattenWorkout,
  calculateCurrentStep,
  calculateTotalDuration,
} from '../utils/workoutUtils';
import type { Workout, ExecutionStatus, ExecutionMode, FlatStep } from '../types/workout';

interface WorkoutProviderProps {
  children: ReactNode;
}

export function WorkoutProvider({ children }: WorkoutProviderProps) {
  // Workout library state
  const [workouts, setWorkouts] = useState<Workout[]>(() => getWorkoutsFromStorage());

  // Current workout being edited
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Execution state
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('display');
  const [elapsed, setElapsed] = useState(0);
  const [plan, setPlan] = useState<FlatStep[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const onTargetPowerChangeRef = useRef<((power: number) => void) | null>(null);
  const lastSentPowerRef = useRef<number | null>(null);

  // Derive current step and target power from elapsed time (no setState needed)
  const { currentStepIndex, targetPower } = useMemo(() => {
    if (plan.length === 0 || executionStatus === 'idle') {
      return { currentStepIndex: 0, targetPower: 0 };
    }

    const result = calculateCurrentStep(plan, elapsed);
    if (result) {
      return {
        currentStepIndex: result.stepIndex,
        targetPower: result.targetPower,
      };
    }

    return { currentStepIndex: 0, targetPower: 0 };
  }, [plan, elapsed, executionStatus]);

  // Timer effect - handles time tracking and completion
  useEffect(() => {
    if (executionStatus === 'running') {
      lastTickRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = (now - lastTickRef.current!) / 1000;
        lastTickRef.current = now;

        setElapsed((prev) => {
          const newElapsed = prev + delta;
          // Check for completion inside the interval callback
          const result = calculateCurrentStep(plan, newElapsed);
          if (result?.completed) {
            // Clear interval and mark as completed
            clearInterval(timerRef.current!);
            timerRef.current = null;
            // Use setTimeout to avoid setState during setState
            setTimeout(() => setExecutionStatus('completed'), 0);
          }
          return newElapsed;
        });
      }, 100);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [executionStatus, plan]);

  // Send power to trainer when target changes
  useEffect(() => {
    if (
      executionMode === 'erg' &&
      executionStatus === 'running' &&
      targetPower !== lastSentPowerRef.current &&
      onTargetPowerChangeRef.current
    ) {
      lastSentPowerRef.current = targetPower;
      onTargetPowerChangeRef.current(targetPower);
    }
  }, [targetPower, executionMode, executionStatus]);

  // Workout library actions
  const saveWorkout = useCallback((workout: Workout) => {
    const saved = saveWorkoutToStorage(workout);
    setWorkouts(getWorkoutsFromStorage());
    return saved;
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    deleteWorkoutFromStorage(id);
    setWorkouts(getWorkoutsFromStorage());
  }, []);

  const refreshWorkouts = useCallback(() => {
    setWorkouts(getWorkoutsFromStorage());
  }, []);

  // Editing actions
  const startEditing = useCallback((workout: Workout) => {
    setEditingWorkout(workout);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingWorkout(null);
  }, []);

  // Execution actions
  const startWorkout = useCallback((workout: Workout, mode: ExecutionMode = 'display') => {
    const flatPlan = flattenWorkout(workout);
    if (flatPlan.length === 0) {
      return;
    }

    setActiveWorkout(workout);
    setPlan(flatPlan);
    setExecutionMode(mode);
    setElapsed(0);
    lastSentPowerRef.current = null;
    setExecutionStatus('running');
  }, []);

  const pauseWorkout = useCallback(() => {
    if (executionStatus === 'running') {
      setExecutionStatus('paused');
    }
  }, [executionStatus]);

  const resumeWorkout = useCallback(() => {
    if (executionStatus === 'paused') {
      setExecutionStatus('running');
    }
  }, [executionStatus]);

  const completeWorkout = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setExecutionStatus('completed');
  }, []);

  const stopWorkout = useCallback(() => {
    setExecutionStatus('idle');
    setActiveWorkout(null);
    setPlan([]);
    setElapsed(0);
    lastSentPowerRef.current = null;
  }, []);

  // Register callback for target power changes (used by trainer control)
  const setOnTargetPowerChange = useCallback((callback: ((power: number) => void) | null) => {
    onTargetPowerChangeRef.current = callback;
  }, []);

  // Calculate total duration of active workout
  const totalDuration = activeWorkout
    ? calculateTotalDuration(activeWorkout.segments)
    : 0;

  const value: WorkoutContextValue = {
    // Library state
    workouts,
    saveWorkout,
    deleteWorkout,
    refreshWorkouts,

    // Editing state
    editingWorkout,
    startEditing,
    stopEditing,

    // Execution state
    activeWorkout,
    executionStatus,
    executionMode,
    elapsed,
    totalDuration,
    currentStepIndex,
    targetPower,
    plan,

    // Execution actions
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    completeWorkout,
    stopWorkout,
    setOnTargetPowerChange,
    setExecutionMode,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}
