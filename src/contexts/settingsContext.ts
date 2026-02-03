import { createContext } from 'react';

export interface Settings {
  riderWeight: number;
  bikeWeight: number;
}

export interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  totalWeight: number;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);
