import { formatDuration } from '../../utils/workoutUtils.js';

export function WorkoutProgress({ elapsed, totalDuration }) {
  const progress = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0;
  const remaining = Math.max(0, totalDuration - elapsed);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between mt-2 text-sm text-gray-400 tabular-nums">
        <span>{formatDuration(elapsed)}</span>
        <span>-{formatDuration(remaining)}</span>
      </div>
    </div>
  );
}
