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
      <div className="text-center py-12 bg-synth-purple/5 backdrop-blur-sm rounded-3xl border border-synth-purple/20 border-dashed">
        <p className="text-synth-purple/60 mb-6 font-mono italic">NO WORKOUTS DETECTED</p>
        <button
          onClick={onCreate}
          className="px-8 py-3 bg-synth-red hover:bg-synth-red/90 rounded-xl font-black italic tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(197,2,2,0.3)]"
        >
          CREATE FIRST WORKOUT
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-synth-red to-synth-purple">
          YOUR WORKOUTS
        </h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-synth-red/10 border border-synth-red/50 hover:bg-synth-red hover:text-white rounded-lg text-sm font-black italic tracking-wider transition-all"
        >
          + NEW
        </button>
      </div>

      {workouts.map((workout) => {
        const duration = calculateTotalDuration(workout.segments);
        return (
          <div
            key={workout.id}
            className="bg-synth-purple/10 backdrop-blur-md border border-synth-purple/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-synth-red/30 transition-all shadow-[0_0_15px_rgba(58,5,111,0.1)]"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black italic tracking-tight text-white group-hover:text-synth-red transition-colors">{workout.name}</h3>
              <p className="text-xs text-synth-purple/60 font-mono uppercase mt-1 tracking-widest font-bold">
                {workout.segments.length} segments &middot; {formatDuration(duration)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(workout)}
                className="px-4 py-2 bg-synth-purple/20 hover:bg-synth-purple/40 border border-synth-purple/30 rounded-lg text-xs font-black italic tracking-widest text-white transition-all"
              >
                EDIT
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this workout?')) {
                    deleteWorkout(workout.id);
                  }
                }}
                className="px-4 py-2 bg-transparent hover:bg-synth-red/10 border border-synth-red/20 hover:border-synth-red rounded-lg text-xs font-black italic tracking-widest text-synth-red transition-all"
              >
                DELETE
              </button>
              <button
                onClick={() => onStart(workout)}
                className="px-6 py-2 bg-synth-red hover:bg-synth-red/90 rounded-lg text-xs font-black italic tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(197,2,2,0.2)] text-white"
                disabled={workout.segments.length === 0}
              >
                START
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
