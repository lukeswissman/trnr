import { useState, type MouseEvent } from 'react';
import { useSettings } from '../hooks/useSettings';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [riderWeight, setRiderWeight] = useState(String(settings.riderWeight));
  const [bikeWeight, setBikeWeight] = useState(String(settings.bikeWeight));
  const [ftp, setFtp] = useState(settings.ftp != null ? String(settings.ftp) : '');
  const [maxHr, setMaxHr] = useState(settings.maxHr != null ? String(settings.maxHr) : '');

  const handleSave = () => {
    updateSettings({
      riderWeight: parseFloat(riderWeight) || 75,
      bikeWeight: parseFloat(bikeWeight) || 9,
      ftp: ftp.trim() ? parseFloat(ftp) : undefined,
      maxHr: maxHr.trim() ? parseFloat(maxHr) : undefined,
    });
    onClose();
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-synth-red to-synth-purple bg-clip-text text-transparent">Rider Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Rider Weight (kg)
            </label>
            <input
              type="number"
              value={riderWeight}
              onChange={(e) => setRiderWeight(e.target.value)}
              min="30"
              max="200"
              step="0.1"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-synth-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Bike Weight (kg)
            </label>
            <input
              type="number"
              value={bikeWeight}
              onChange={(e) => setBikeWeight(e.target.value)}
              min="5"
              max="25"
              step="0.1"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-synth-accent"
            />
          </div>

          <div className="pt-2 text-sm text-gray-400">
            Total weight: {(parseFloat(riderWeight) || 0) + (parseFloat(bikeWeight) || 0)} kg
          </div>

          <div className="border-t border-slate-700 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Training Zones</h3>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                FTP (watts)
              </label>
              <input
                type="number"
                value={ftp}
                onChange={(e) => setFtp(e.target.value)}
                min="50"
                max="500"
                step="1"
                placeholder="Not set"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-synth-accent placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Used to calculate training zones</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">
                Max Heart Rate (bpm)
              </label>
              <input
                type="number"
                value={maxHr}
                onChange={(e) => setMaxHr(e.target.value)}
                min="100"
                max="220"
                step="1"
                placeholder="Not set"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-synth-accent placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-synth-red to-synth-purple hover:opacity-90 rounded-lg font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
