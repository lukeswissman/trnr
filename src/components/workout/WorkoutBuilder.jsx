import { useState } from 'react';
import { useWorkout } from '../../hooks/useWorkout.js';
import { SegmentList } from './SegmentList.jsx';
import { WorkoutChart } from './WorkoutChart.jsx';
import { createWorkout, formatDuration, calculateTotalDuration } from '../../utils/workoutUtils.js';

// Note: parent component should use key={workout?.id || 'new'} to reset state when workout changes
export function WorkoutBuilder({ workout: initialWorkout, onSave, onCancel }) {
  const { saveWorkout } = useWorkout();
  const [workout, setWorkout] = useState(() => initialWorkout || createWorkout());

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
          className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none px-1 py-0.5"
          placeholder="Workout Name"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded"
            disabled={!workout.name.trim()}
          >
            Save
          </button>
        </div>
      </div>

      <textarea
        value={workout.description || ''}
        onChange={(e) => setWorkout({ ...workout, description: e.target.value })}
        className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none"
        rows={2}
        placeholder="Description (optional)"
      />

      <div className="text-sm text-gray-400">
        Total duration: {formatDuration(totalDuration)}
      </div>

      <WorkoutChart workout={workout} height={120} />

      <SegmentList
        segments={workout.segments}
        onChange={(segments) => setWorkout({ ...workout, segments })}
      />
    </div>
  );
}
