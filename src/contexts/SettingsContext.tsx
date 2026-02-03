import { useState, useEffect, type ReactNode } from 'react';
import { SettingsContext, type Settings, type SettingsContextValue } from './settingsContext';

const STORAGE_KEY = 'trnr-settings';

const defaultSettings: Settings = {
  riderWeight: 75, // kg
  bikeWeight: 9,   // kg
};

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const totalWeight = settings.riderWeight + settings.bikeWeight;

  const value: SettingsContextValue = { settings, updateSettings, totalWeight };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
