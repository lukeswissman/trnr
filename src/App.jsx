import { useState, useMemo, useEffect } from 'react';
import { BluetoothProvider } from './contexts/BluetoothContext.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import { WorkoutProvider } from './contexts/WorkoutContext.jsx';
import { useBluetooth } from './hooks/useBluetooth.js';
import { useSettings } from './hooks/useSettings.js';
import { useWorkout } from './hooks/useWorkout.js';
import { MetricDisplay } from './components/MetricDisplay.jsx';
import { ConnectButton } from './components/ConnectButton.jsx';
import { DeviceList } from './components/DeviceList.jsx';
import { SettingsButton } from './components/SettingsButton.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { WorkoutList } from './components/workout/WorkoutList.jsx';
import { WorkoutBuilder } from './components/workout/WorkoutBuilder.jsx';
import { WorkoutPlayer } from './components/workout/WorkoutPlayer.jsx';
import { calculateSpeed } from './utils/speedCalculator.js';

function HardwareTest({ onBack }) {
  const { liveData, error } = useBluetooth();
  const { totalWeight } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const adjustedSpeed = useMemo(() => {
    if (liveData.power == null || liveData.power <= 0) {
      return null;
    }
    return calculateSpeed(liveData.power, totalWeight);
  }, [liveData.power, totalWeight]);

  const formatSpeed = (v) => v.toFixed(1);
  const formatCadence = (v) => Math.round(v);
  const formatPower = (v) => Math.round(v);
  const formatDistance = (v) => (v / 1000).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Hardware Setup n Test</h1>
          <DeviceList />
        </div>
        <div className="flex items-center gap-2">
          <SettingsButton onClick={() => setShowSettings(true)} />
          <ConnectButton />
        </div>
      </header>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-600/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Metrics grid */}
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 content-center">
        <MetricDisplay
          label="Power"
          value={liveData.power}
          unit="watts"
          formatter={formatPower}
        />
        <MetricDisplay
          label="Speed"
          value={liveData.speed}
          unit="km/h"
          formatter={formatSpeed}
        />
        <MetricDisplay
          label="Adjusted Speed"
          value={adjustedSpeed}
          unit="km/h"
          formatter={formatSpeed}
        />
        <MetricDisplay
          label="Cadence"
          value={liveData.cadence}
          unit="rpm"
          formatter={formatCadence}
        />
        <MetricDisplay
          label="Distance"
          value={liveData.distance}
          unit="km"
          formatter={formatDistance}
        />
        <MetricDisplay
          label="Heart Rate"
          value={liveData.heartRate}
          unit="bpm"
          formatter={(v) => Math.round(v)}
        />
      </main>
    </div>
  );
}

function WorkoutsView({ onBack, onStartWorkout }) {
  const [view, setView] = useState('list'); // 'list' | 'builder'
  const [editingWorkout, setEditingWorkout] = useState(null);

  const handleEdit = (workout) => {
    setEditingWorkout(workout);
    setView('builder');
  };

  const handleCreate = () => {
    setEditingWorkout(null);
    setView('builder');
  };

  const handleSave = () => {
    setView('list');
    setEditingWorkout(null);
  };

  const handleCancel = () => {
    setView('list');
    setEditingWorkout(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={view === 'builder' ? handleCancel : onBack}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">
            {view === 'builder' ? (editingWorkout ? 'Edit Workout' : 'New Workout') : 'Workouts'}
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {view === 'list' && (
          <WorkoutList
            onEdit={handleEdit}
            onStart={onStartWorkout}
            onCreate={handleCreate}
          />
        )}
        {view === 'builder' && (
          <WorkoutBuilder
            key={editingWorkout?.id || 'new'}
            workout={editingWorkout}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
}

function StartWorkoutModal({ workout, onStart, onCancel }) {
  const { hasTrainerControl } = useBluetooth();
  const [mode, setMode] = useState('display');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Start Workout</h2>
        <p className="text-gray-400 mb-4">{workout.name}</p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="display"
              checked={mode === 'display'}
              onChange={() => setMode('display')}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium">Display Only</div>
              <div className="text-sm text-gray-400">Show target power, no trainer control</div>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-3 bg-gray-700 rounded-lg ${
              hasTrainerControl ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="radio"
              name="mode"
              value="erg"
              checked={mode === 'erg'}
              onChange={() => setMode('erg')}
              disabled={!hasTrainerControl}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium">ERG Mode</div>
              <div className="text-sm text-gray-400">
                {hasTrainerControl
                  ? 'Control trainer resistance automatically'
                  : 'Connect a trainer to enable'}
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onStart(mode)}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

function StartScreen({ onGoToWorkouts, onGoToHardware }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <SettingsButton onClick={() => setShowSettings(true)} />
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      <h1 className="text-3xl font-bold mb-8">Trnr - train, eat, sleep, n repeat!</h1>

      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="space-y-3">
          <button
            onClick={onGoToWorkouts}
            className="w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold"
          >
            Workouts
          </button>
          <button
            onClick={onGoToHardware}
            className="w-full px-4 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg font-semibold"
          >
            Hardware Setup n Test
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [view, setView] = useState('start'); // 'start' | 'hardware' | 'workouts' | 'player'
  const [workoutToStart, setWorkoutToStart] = useState(null);
  const { startWorkout, setOnTargetPowerChange } = useWorkout();
  const { sendTargetPower, hasTrainerControl } = useBluetooth();

  // Connect workout context to trainer control
  useEffect(() => {
    if (hasTrainerControl) {
      setOnTargetPowerChange(sendTargetPower);
    }
    return () => setOnTargetPowerChange(null);
  }, [hasTrainerControl, sendTargetPower, setOnTargetPowerChange]);

  const handleStartWorkout = (workout) => {
    setWorkoutToStart(workout);
  };

  const handleConfirmStart = (mode) => {
    startWorkout(workoutToStart, mode);
    setWorkoutToStart(null);
    setView('player');
  };

  const handlePlayerClose = () => {
    setView('workouts');
  };

  // Handle workout completion - navigate back in handlePlayerClose
  // which is called when user clicks Done/Stop

  return (
    <>
      {view === 'start' && (
        <StartScreen
          onGoToWorkouts={() => setView('workouts')}
          onGoToHardware={() => setView('hardware')}
        />
      )}
      {view === 'hardware' && (
        <HardwareTest onBack={() => setView('start')} />
      )}
      {view === 'workouts' && (
        <WorkoutsView
          onBack={() => setView('start')}
          onStartWorkout={handleStartWorkout}
        />
      )}
      {view === 'player' && (
        <WorkoutPlayer onClose={handlePlayerClose} />
      )}
      {workoutToStart && (
        <StartWorkoutModal
          workout={workoutToStart}
          onStart={handleConfirmStart}
          onCancel={() => setWorkoutToStart(null)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <BluetoothProvider>
        <WorkoutProvider>
          <AppContent />
        </WorkoutProvider>
      </BluetoothProvider>
    </SettingsProvider>
  );
}

export default App;
