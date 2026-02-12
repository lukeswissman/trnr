import { useRef, useEffect, useState } from 'react';
import type { ExecutionStatus } from '../types/workout';
import type { LiveData } from '../types/bluetooth';
import type { WorkoutRecording, RecordSample } from '../types/recording';

interface UseRecorderParams {
  executionStatus: ExecutionStatus;
  elapsed: number;
  liveData: LiveData;
  activeWorkout: { name: string } | null;
}

interface UseRecorderResult {
  recording: WorkoutRecording | null;
  samples: RecordSample[];
}

/**
 * Records sensor data during workout execution.
 * Polls at 200ms, deduplicates to 1-second boundaries.
 * Stores samples in refs to avoid re-renders during recording.
 */
export function useRecorder({
  executionStatus,
  elapsed,
  liveData,
  activeWorkout,
}: UseRecorderParams): UseRecorderResult {
  const samplesRef = useRef<RecordSample[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const lastSecondRef = useRef(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recording, setRecording] = useState<WorkoutRecording | null>(null);
  const [samples, setSamples] = useState<RecordSample[]>([]);

  // Capture liveData in a ref so the interval always sees latest values
  const liveDataRef = useRef(liveData);
  useEffect(() => { liveDataRef.current = liveData; }, [liveData]);

  const elapsedRef = useRef(elapsed);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // Sync samples ref to state at ~1Hz for consumers (e.g. chart HR overlay)
  useEffect(() => {
    if (executionStatus === 'running') {
      setSamples([...samplesRef.current]);
    }
  }, [elapsed, executionStatus]);

  // Start/stop polling based on execution status
  useEffect(() => {
    if (executionStatus === 'running' || executionStatus === 'paused') {
      // Initialize on first run
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() / 1000;
        samplesRef.current = [];
        lastSecondRef.current = -1;
      }

      // Only poll while running (pause stops sampling)
      if (executionStatus === 'running') {
        intervalRef.current = setInterval(() => {
          const currentSecond = Math.floor(elapsedRef.current);
          if (currentSecond === lastSecondRef.current) return;
          lastSecondRef.current = currentSecond;

          const data = liveDataRef.current;
          samplesRef.current.push({
            timestamp: startTimeRef.current! + currentSecond,
            elapsed: currentSecond,
            power: data.power,
            heartRate: data.heartRate,
            cadence: data.cadence,
            speed: data.speed,
            distance: data.distance,
          });
        }, 200);

        return () => {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        };
      }
    }

    if (executionStatus === 'completed' && startTimeRef.current !== null) {
      // Finalize recording
      clearInterval(intervalRef.current!);
      intervalRef.current = null;

      const endTime = Date.now() / 1000;
      setRecording({
        workoutName: activeWorkout?.name || 'Workout',
        startTime: startTimeRef.current,
        endTime,
        totalElapsed: endTime - startTimeRef.current,
        totalTimerTime: elapsedRef.current,
        samples: samplesRef.current,
      });
    }

    if (executionStatus === 'idle') {
      // Reset
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      startTimeRef.current = null;
      samplesRef.current = [];
      lastSecondRef.current = -1;
      setRecording(null);
      setSamples([]);
    }
  }, [executionStatus, activeWorkout]);

  return { recording, samples };
}
