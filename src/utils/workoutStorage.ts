import type { Workout } from '../types/workout';

const STORAGE_KEY = 'trnr_workouts';

/**
 * Get all workouts from localStorage
 */
export function getWorkoutsFromStorage(): Workout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const workouts: Workout[] = JSON.parse(data);
    workouts.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    return workouts;
  } catch {
    console.error('Failed to parse workouts from localStorage');
    return [];
  }
}

/**
 * Save a workout to localStorage (creates or updates)
 */
export function saveWorkoutToStorage(workout: Workout): Workout {
  const workouts = getWorkoutsFromStorage();
  const index = workouts.findIndex((w) => w.id === workout.id);

  const updatedWorkout: Workout = {
    ...workout,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    workouts[index] = updatedWorkout;
  } else {
    workouts.push(updatedWorkout);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  return updatedWorkout;
}

/**
 * Delete a workout from localStorage
 */
export function deleteWorkoutFromStorage(id: string): boolean {
  const workouts = getWorkoutsFromStorage();
  const index = workouts.findIndex((w) => w.id === id);

  if (index < 0) {
    return false;
  }

  workouts.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  return true;
}
