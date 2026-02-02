import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { WorkoutContext } from './workoutContext.js';
import {
  getWorkoutsFromStorage,
  saveWorkoutToStorage,
  deleteWorkoutFromStorage,
} from '../utils/workoutStorage.js';
import {
  flattenWorkout,
  calculateCurrentStep,
  calculateTotalDuration,
} from '../utils/workoutUtils.js';

export function WorkoutProvider({ children }) {
  // Workout library state
  const [workouts, setWorkouts] = useState(() => getWorkoutsFromStorage());

  // Current workout being edited
  const [editingWorkout, setEditingWorkout] = useState(null);

  // Execution state
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'completed'
  const [executionMode, setExecutionMode] = useState('display'); // 'display' | 'erg'
  const [elapsed, setElapsed] = useState(0);
  const [plan, setPlan] = useState([]);

  const timerRef = useRef(null);
  const lastTickRef = useRef(null);
  const onTargetPowerChangeRef = useRef(null);
  const lastSentPowerRef = useRef(null);

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
        const delta = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;

        setElapsed((prev) => {
          const newElapsed = prev + delta;
          // Check for completion inside the interval callback
          const result = calculateCurrentStep(plan, newElapsed);
          if (result?.completed) {
            // Clear interval and mark as completed
            clearInterval(timerRef.current);
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
  const saveWorkout = useCallback((workout) => {
    const saved = saveWorkoutToStorage(workout);
    setWorkouts(getWorkoutsFromStorage());
    return saved;
  }, []);

  const deleteWorkout = useCallback((id) => {
    deleteWorkoutFromStorage(id);
    setWorkouts(getWorkoutsFromStorage());
  }, []);

  const refreshWorkouts = useCallback(() => {
    setWorkouts(getWorkoutsFromStorage());
  }, []);

  // Editing actions
  const startEditing = useCallback((workout) => {
    setEditingWorkout(workout);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingWorkout(null);
  }, []);

  // Execution actions
  const startWorkout = useCallback((workout, mode = 'display') => {
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
  const setOnTargetPowerChange = useCallback((callback) => {
    onTargetPowerChangeRef.current = callback;
  }, []);

  // Calculate total duration of active workout
  const totalDuration = activeWorkout
    ? calculateTotalDuration(activeWorkout.segments)
    : 0;

  const value = {
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
