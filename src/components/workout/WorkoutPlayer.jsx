import { useWorkout } from '../../hooks/useWorkout.js';
import { useBluetooth } from '../../hooks/useBluetooth.js';
import { useRecorder } from '../../hooks/useRecorder.js';
import { exportRecording } from '../../services/export/index.js';
import { MetricDisplay } from '../MetricDisplay.jsx';
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
    completeWorkout,
    stopWorkout,
  } = useWorkout();

  const { liveData } = useBluetooth();

  const { recording } = useRecorder({
    executionStatus,
    elapsed,
    liveData,
    activeWorkout,
  });

  const handleStop = () => {
    if (executionStatus === 'running' || executionStatus === 'paused') {
      completeWorkout();
    } else {
      stopWorkout();
      onClose?.();
    }
  };

  const handleSave = () => {
    if (recording) {
      exportRecording(recording);
    }
  };

  const handleDone = () => {
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

        {liveData.heartRate != null && (
          <MetricDisplay
            label="Heart Rate"
            value={liveData.heartRate}
            unit="bpm"
            formatter={(v) => Math.round(v)}
          />
        )}

        <div className="w-full max-w-md">
          <WorkoutProgress elapsed={elapsed} totalDuration={totalDuration} />
        </div>

        <PlayerControls
          status={executionStatus}
          onPause={pauseWorkout}
          onResume={resumeWorkout}
          onStop={executionStatus === 'completed' ? handleDone : handleStop}
          onSave={handleSave}
          hasSaveData={recording != null}
        />
      </div>
    </div>
  );
}
