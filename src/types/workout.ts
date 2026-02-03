export type SegmentType = 'block' | 'ramp' | 'repeat';

export interface BlockSegment {
  type: 'block';
  id: string;
  power: number;
  duration: number;
}

export interface RampSegment {
  type: 'ramp';
  id: string;
  startPower: number;
  endPower: number;
  duration: number;
}

export interface RepeatSegment {
  type: 'repeat';
  id: string;
  count: number;
  segments: Segment[];
}

export type Segment = BlockSegment | RampSegment | RepeatSegment;

export interface Workout {
  id: string;
  name: string;
  description?: string;
  segments: Segment[];
  createdAt: number;
  updatedAt: number;
}

export interface FlatStep {
  type: 'block' | 'ramp';
  startTime: number;
  endTime: number;
  duration: number;
  power: number;
  startPower?: number;
  endPower?: number;
}

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed';

export type ExecutionMode = 'display' | 'erg';
