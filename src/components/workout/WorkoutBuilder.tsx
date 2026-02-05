import { useState, useMemo } from 'react';
import { useWorkout } from '../../hooks/useWorkout';
import { useSettings } from '../../hooks/useSettings';
import { SegmentList } from './SegmentList';
import { WorkoutChart } from './WorkoutChart';
import { createWorkout, formatDuration, calculateTotalDuration, flattenWorkout } from '../../utils/workoutUtils';
import { calculateZoneDistribution } from '../../utils/zones';
import type { Workout } from '../../types/workout';
import type { ZoneDistribution } from '../../utils/zones';

interface WorkoutBuilderProps {
  workout?: Workout | null;
  onSave?: (workout: Workout) => void;
  onCancel?: () => void;
}

// Note: parent component should use key={workout?.id || 'new'} to reset state when workout changes
export function WorkoutBuilder({ workout: initialWorkout, onSave, onCancel }: WorkoutBuilderProps) {
  const { saveWorkout } = useWorkout();
  const { settings } = useSettings();
  const [workout, setWorkout] = useState<Workout>(() => initialWorkout || createWorkout());

  const handleSave = () => {
    const saved = saveWorkout(workout);
    onSave?.(saved);
  };

  const totalDuration = calculateTotalDuration(workout.segments);

  const zoneDistribution = useMemo((): ZoneDistribution[] => {
    if (!settings.ftp || workout.segments.length === 0) return [];
    const steps = flattenWorkout(workout);
    return calculateZoneDistribution(steps, settings.ftp);
  }, [workout, settings.ftp]);

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

      <WorkoutChart workout={workout} height={160} ftp={settings.ftp} />

      {zoneDistribution.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex h-3 rounded-full overflow-hidden">
            {zoneDistribution.map((d) => (
              <div
                key={d.zone.number}
                className="h-full transition-all duration-300"
                style={{
                  width: `${d.percentage}%`,
                  backgroundColor: d.zone.color,
                  opacity: 0.8,
                }}
                title={`Z${d.zone.number} ${d.zone.name} — ${formatDuration(d.seconds)} (${Math.round(d.percentage)}%)`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
            {zoneDistribution.map((d) => (
              <span key={d.zone.number} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: d.zone.color }}
                />
                Z{d.zone.number} {Math.round(d.percentage)}%
              </span>
            ))}
          </div>
        </div>
      )}

      <SegmentList
        segments={workout.segments}
        onChange={(segments) => setWorkout({ ...workout, segments })}
        ftp={settings.ftp}
      />
    </div>
  );
}
