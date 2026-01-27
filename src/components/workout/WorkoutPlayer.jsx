import { useWorkout } from '../../hooks/useWorkout.js';
import { useBluetooth } from '../../hooks/useBluetooth.js';
import { TargetDisplay } from './TargetDisplay.jsx';
import { WorkoutProgress } from './WorkoutProgress.jsx';
import { PlayerControls } from './PlayerControls.jsx';
import { WorkoutChart } from './WorkoutChart.jsx';

export function WorkoutPlayer({ onClose }) {
  const {
    activeWorkout,
    executionStatus,
    executionMode,
    elapsed,
    totalDuration,
    targetPower,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
  } = useWorkout();

  const { liveData } = useBluetooth();

  const handleStop = () => {
    stopWorkout();
    onClose?.();
  };

  if (!activeWorkout) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{activeWorkout.name}</h1>
          <div className="text-sm text-gray-400">
            {executionMode === 'erg' ? 'ERG Mode' : 'Display Only'}
            {executionStatus === 'completed' && ' • Completed!'}
          </div>
        </div>
      </div>

      {/* Chart with progress */}
      <div className="mb-6">
        <WorkoutChart workout={activeWorkout} height={100} highlightTime={elapsed} />
      </div>

      {/* Main display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <TargetDisplay targetPower={targetPower} actualPower={liveData.power} />

        <div className="w-full max-w-md">
          <WorkoutProgress elapsed={elapsed} totalDuration={totalDuration} />
        </div>

        <PlayerControls
          status={executionStatus}
          onPause={pauseWorkout}
          onResume={resumeWorkout}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}
