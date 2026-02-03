import { useState, type MouseEvent } from 'react';
import { useSettings } from '../hooks/useSettings';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [riderWeight, setRiderWeight] = useState(String(settings.riderWeight));
  const [bikeWeight, setBikeWeight] = useState(String(settings.bikeWeight));

  const handleSave = () => {
    updateSettings({
      riderWeight: parseFloat(riderWeight) || 75,
      bikeWeight: parseFloat(bikeWeight) || 9,
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
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-6">Rider Profile</h2>

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
              className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 text-sm text-gray-400">
            Total weight: {(parseFloat(riderWeight) || 0) + (parseFloat(bikeWeight) || 0)} kg
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
