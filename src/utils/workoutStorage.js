const STORAGE_KEY = 'trnr_workouts';

/**
 * Get all workouts from localStorage
 * @returns {Array<import('../types/workout.js').Workout>}
 */
export function getWorkoutsFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const workouts = JSON.parse(data);
    workouts.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    return workouts;
  } catch {
    console.error('Failed to parse workouts from localStorage');
    return [];
  }
}

/**
 * Save a workout to localStorage (creates or updates)
 * @param {import('../types/workout.js').Workout} workout
 * @returns {import('../types/workout.js').Workout}
 */
export function saveWorkoutToStorage(workout) {
  const workouts = getWorkoutsFromStorage();
  const index = workouts.findIndex((w) => w.id === workout.id);

  const updatedWorkout = {
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
 * @param {string} id - Workout ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteWorkoutFromStorage(id) {
  const workouts = getWorkoutsFromStorage();
  const index = workouts.findIndex((w) => w.id === id);

  if (index < 0) {
    return false;
  }

  workouts.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  return true;
}
