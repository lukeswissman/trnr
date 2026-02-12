import { useMemo } from 'react';
import { useWorkout } from '../../hooks/useWorkout';
import { useSettings } from '../../hooks/useSettings';
import { useBluetooth } from '../../hooks/useBluetooth';
import { useRecorder } from '../../hooks/useRecorder';
import { exportRecording, exportAndUploadToStrava } from '../../services/export';
import { getTopLevelSegmentBoundaries, sliceSegment, calculateTotalDuration } from '../../utils/workoutUtils';
import { MetricDisplay } from '../MetricDisplay';
import { TargetDisplay } from './TargetDisplay';
import { WorkoutProgress } from './WorkoutProgress';
import { PlayerControls } from './PlayerControls';
import { WorkoutChart } from './WorkoutChart';
import { WorkoutSummary } from './WorkoutSummary';
import type { Workout } from '../../types/workout';

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

  const segmentBoundaries = useMemo(() => {
    if (!activeWorkout) return [];
    return getTopLevelSegmentBoundaries(activeWorkout.segments);
  }, [activeWorkout]);

  const currentBoundaryIndex = useMemo(() => {
    if (segmentBoundaries.length === 0) return -1;
    const idx = segmentBoundaries.findIndex(
      (b) => elapsed >= b.startTime && elapsed < b.endTime
    );
    return idx >= 0 ? idx : segmentBoundaries.length - 1;
  }, [segmentBoundaries, elapsed]);

  const { segmentWorkout, prevContextDuration } = useMemo((): {
    segmentWorkout: Workout | null;
    prevContextDuration: number;
  } => {
    if (currentBoundaryIndex < 0) return { segmentWorkout: null, prevContextDuration: 0 };
    const boundary = segmentBoundaries[currentBoundaryIndex];
    const currentDuration = boundary.endTime - boundary.startTime;
    const contextDuration = currentDuration * 0.125;

    const segments: import('../../types/workout').Segment[] = [];
    let actualPrevContext = 0;

    // Previous segment tail
    if (currentBoundaryIndex > 0) {
      const prev = segmentBoundaries[currentBoundaryIndex - 1];
      const prevDuration = prev.endTime - prev.startTime;
      const tailLen = Math.min(contextDuration, prevDuration);
      const sliced = sliceSegment(prev.segment, prevDuration - tailLen, prevDuration);
      actualPrevContext = calculateTotalDuration(sliced);
      segments.push(...sliced);
    }

    // Current segment (unchanged)
    segments.push(boundary.segment);

    // Next segment head
    if (currentBoundaryIndex < segmentBoundaries.length - 1) {
      const next = segmentBoundaries[currentBoundaryIndex + 1];
      const nextDuration = next.endTime - next.startTime;
      const headLen = Math.min(contextDuration, nextDuration);
      segments.push(...sliceSegment(next.segment, 0, headLen));
    }

    return {
      segmentWorkout: {
        id: 'segment-detail',
        name: '',
        segments,
        createdAt: 0,
        updatedAt: 0,
      },
      prevContextDuration: actualPrevContext,
    };
  }, [segmentBoundaries, currentBoundaryIndex]);

  const segmentLocalElapsed =
    currentBoundaryIndex >= 0
      ? elapsed - segmentBoundaries[currentBoundaryIndex].startTime + prevContextDuration
      : 0;

  const segmentHeartRateData = useMemo(() => {
    if (currentBoundaryIndex < 0 || samples.length === 0) return [];
    const boundary = segmentBoundaries[currentBoundaryIndex];
    const currentDuration = boundary.endTime - boundary.startTime;
    const contextDuration = currentDuration * 0.125;

    const prev = currentBoundaryIndex > 0 ? segmentBoundaries[currentBoundaryIndex - 1] : null;
    const next = currentBoundaryIndex < segmentBoundaries.length - 1 ? segmentBoundaries[currentBoundaryIndex + 1] : null;

    const prevDuration = prev ? prev.endTime - prev.startTime : 0;
    const prevContext = prev ? Math.min(contextDuration, prevDuration) : 0;
    const nextDuration = next ? next.endTime - next.startTime : 0;
    const nextContext = next ? Math.min(contextDuration, nextDuration) : 0;

    const windowStart = boundary.startTime - prevContext;
    const windowEnd = boundary.endTime + nextContext;

    return samples
      .filter((s) => s.elapsed >= windowStart && s.elapsed < windowEnd)
      .map((s) => ({ elapsed: s.elapsed - windowStart, heartRate: s.heartRate }));
  }, [samples, segmentBoundaries, currentBoundaryIndex]);

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

        {(executionStatus === 'running' || executionStatus === 'paused') &&
          segmentWorkout && (
            <div className="w-full max-w-4xl px-4 mb-2">
              <div className="text-xs text-gray-400 mb-1">
                Segment {currentBoundaryIndex + 1} of{' '}
                {segmentBoundaries.length}
              </div>
              <WorkoutChart
                workout={segmentWorkout}
                height={200}
                highlightTime={segmentLocalElapsed}
                actualPower={liveData.power}
                ftp={settings.ftp}
                heartRateData={segmentHeartRateData}
                id="segment-detail"
              />
            </div>
          )}

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
