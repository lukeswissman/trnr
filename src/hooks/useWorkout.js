import { useContext } from 'react';
import { WorkoutContext } from '../contexts/workoutContext.js';

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
