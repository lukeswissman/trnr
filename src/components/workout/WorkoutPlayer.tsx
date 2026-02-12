import { useWorkout } from '../../hooks/useWorkout';
import { useSettings } from '../../hooks/useSettings';
import { useBluetooth } from '../../hooks/useBluetooth';
import { useRecorder } from '../../hooks/useRecorder';
import { exportRecording, exportAndUploadToStrava } from '../../services/export';
import { MetricDisplay } from '../MetricDisplay';
import { TargetDisplay } from './TargetDisplay';
import { WorkoutProgress } from './WorkoutProgress';
import { PlayerControls } from './PlayerControls';
import { WorkoutChart } from './WorkoutChart';
import { WorkoutSummary } from './WorkoutSummary';

interface WorkoutPlayerProps {
  onClose?: () => void;
}

export function WorkoutPlayer({ onClose }: WorkoutPlayerProps) {
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

  const { settings } = useSettings();
  const { liveData } = useBluetooth();

  const { recording, samples } = useRecorder({
    executionStatus,
    elapsed,
    liveData,
    activeWorkout,
  });

  const showSummary = executionStatus === 'completed' && recording != null;

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

  const handleUploadToStrava = () => {
    if (recording) {
      exportAndUploadToStrava(recording);
    }
  };

  const handleDone = () => {
    stopWorkout();
    onClose?.();
  };

  if (!activeWorkout) {
    return null;
  }

  if (showSummary && recording) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <WorkoutSummary
          recording={recording}
          plannedDuration={totalDuration}
          onDone={handleDone}
          onSave={handleSave}
          onUploadToStrava={handleUploadToStrava}
        />
      </div>
    );
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

      {/* Main display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <TargetDisplay targetPower={targetPower} actualPower={liveData.power} />

        <div className="w-full max-w-4xl px-4">
          <WorkoutChart
            workout={activeWorkout}
            height={200}
            highlightTime={elapsed}
            actualPower={liveData.power}
            ftp={settings.ftp}
            heartRateData={samples}
          />
        </div>

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
