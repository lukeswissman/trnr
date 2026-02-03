export interface RecordSample {
  timestamp: number;
  elapsed: number;
  power: number | null;
  heartRate: number | null;
  cadence: number | null;
  speed: number | null;
  distance: number | null;
}

export interface WorkoutRecording {
  workoutName: string;
  startTime: number;
  endTime: number;
  totalElapsed: number;
  totalTimerTime: number;
  samples: RecordSample[];
}
