import { useWorkout } from '../../hooks/useWorkout';
import { formatDuration, calculateTotalDuration } from '../../utils/workoutUtils';
import type { Workout } from '../../types/workout';

interface WorkoutListProps {
  onEdit: (workout: Workout) => void;
  onStart: (workout: Workout) => void;
  onCreate: () => void;
}

export function WorkoutList({ onEdit, onStart, onCreate }: WorkoutListProps) {
  const { workouts, deleteWorkout } = useWorkout();

  if (workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No workouts yet</p>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Create your first workout
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Your Workouts</h2>
        <button
          onClick={onCreate}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
        >
          + New
        </button>
      </div>

      {workouts.map((workout) => {
        const duration = calculateTotalDuration(workout.segments);
        return (
          <div
            key={workout.id}
            className="bg-gray-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{workout.name}</h3>
              <p className="text-sm text-gray-400">
                {workout.segments.length} segments &middot; {formatDuration(duration)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(workout)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this workout?')) {
                    deleteWorkout(workout.id);
                  }
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-red-600 rounded text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => onStart(workout)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm"
                disabled={workout.segments.length === 0}
              >
                Start
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
