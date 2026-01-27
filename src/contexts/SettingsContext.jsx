import { useState, useEffect } from 'react';
import { SettingsContext } from './settingsContext.js';

const STORAGE_KEY = 'trnr-settings';

const defaultSettings = {
  riderWeight: 75, // kg
  bikeWeight: 9,   // kg
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
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

  const updateSettings = (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const totalWeight = settings.riderWeight + settings.bikeWeight;

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, totalWeight }}>
      {children}
    </SettingsContext.Provider>
  );
}
