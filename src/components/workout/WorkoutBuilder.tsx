import { useState } from 'react';
import { useWorkout } from '../../hooks/useWorkout';
import { SegmentList } from './SegmentList';
import { WorkoutChart } from './WorkoutChart';
import { createWorkout, formatDuration, calculateTotalDuration } from '../../utils/workoutUtils';
import type { Workout } from '../../types/workout';

interface WorkoutBuilderProps {
  workout?: Workout | null;
  onSave?: (workout: Workout) => void;
  onCancel?: () => void;
}

// Note: parent component should use key={workout?.id || 'new'} to reset state when workout changes
export function WorkoutBuilder({ workout: initialWorkout, onSave, onCancel }: WorkoutBuilderProps) {
  const { saveWorkout } = useWorkout();
  const [workout, setWorkout] = useState<Workout>(() => initialWorkout || createWorkout());

  const handleSave = () => {
    const saved = saveWorkout(workout);
    onSave?.(saved);
  };

  const totalDuration = calculateTotalDuration(workout.segments);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          type="text"
          value={workout.name}
          onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
          className="text-lg font-semibold bg-transparent border-b border-synth-purple/30 focus:border-synth-accent outline-none px-1 py-0.5"
          placeholder="Workout Name"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-synth-purple/20 hover:bg-synth-purple/40 border border-synth-purple/30 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-synth-red hover:bg-synth-red/90 rounded-lg shadow-[0_0_10px_rgba(197,2,2,0.2)]"
            disabled={!workout.name.trim()}
          >
            Save
          </button>
        </div>
      </div>

      <textarea
        value={workout.description || ''}
        onChange={(e) => setWorkout({ ...workout, description: e.target.value })}
        className="w-full bg-synth-purple/10 border border-synth-purple/20 rounded-lg p-3 text-sm resize-none"
        rows={2}
        placeholder="Description (optional)"
      />

      <div className="text-sm text-gray-400">
        Total duration: {formatDuration(totalDuration)}
      </div>

      <WorkoutChart workout={workout} height={160} />

      <SegmentList
        segments={workout.segments}
        onChange={(segments) => setWorkout({ ...workout, segments })}
      />
    </div>
  );
}
