import { createContext } from 'react';

export interface Settings {
  riderWeight: number;
  bikeWeight: number;
  ftp?: number;    // Functional Threshold Power (watts)
  maxHr?: number;  // Maximum Heart Rate (bpm)
}

export interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  totalWeight: number;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);
