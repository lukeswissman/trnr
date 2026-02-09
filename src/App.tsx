import { useState, useMemo, useEffect } from 'react';
import { BluetoothProvider } from './contexts/BluetoothContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { useBluetooth } from './hooks/useBluetooth';
import { useSettings } from './hooks/useSettings';
import { useWorkout } from './hooks/useWorkout';
import { MetricDisplay } from './components/MetricDisplay';
import { ConnectButton } from './components/ConnectButton';
import { DeviceList } from './components/DeviceList';
import { SettingsButton } from './components/SettingsButton';
import { SettingsModal } from './components/SettingsModal';
import { WorkoutList } from './components/workout/WorkoutList';
import { WorkoutBuilder } from './components/workout/WorkoutBuilder';
import { WorkoutPlayer } from './components/workout/WorkoutPlayer';
import Logo from './components/common/Logo';
import { calculateSpeed } from './utils/speedCalculator';
import type { Workout, ExecutionMode } from './types/workout';

type AppView = 'start' | 'hardware' | 'workouts' | 'player';
type WorkoutsViewMode = 'list' | 'builder';

interface HardwareTestProps {
  onBack: () => void;
}

function HardwareTest({ onBack }: HardwareTestProps) {
  const { liveData, error } = useBluetooth();
  const { totalWeight } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const adjustedSpeed = useMemo(() => {
    if (liveData.power == null || liveData.power <= 0) {
      return null;
    }
    return calculateSpeed(liveData.power, totalWeight);
  }, [liveData.power, totalWeight]);

  const formatSpeed = (v: number) => v.toFixed(1);
  const formatCadence = (v: number) => Math.round(v);
  const formatPower = (v: number) => Math.round(v);
  const formatDistance = (v: number) => (v / 1000).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-synth-purple/30 bg-synth-purple/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-synth-red transition-colors"
          >
            ← Back
          </button>
          <Logo size={32} className="scale-75 origin-left" />
          <h1 className="text-xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-synth-red to-synth-purple">
            Hardware Setup n Test
          </h1>
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

interface WorkoutsViewProps {
  onBack: () => void;
  onStartWorkout: (workout: Workout) => void;
}

function WorkoutsView({ onBack, onStartWorkout }: WorkoutsViewProps) {
  const [view, setView] = useState<WorkoutsViewMode>('list');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const handleEdit = (workout: Workout) => {
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="p-4 flex items-center justify-between border-b border-synth-purple/30 bg-synth-purple/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={view === 'builder' ? handleCancel : onBack}
            className="text-gray-400 hover:text-synth-red transition-colors"
          >
            ← Back
          </button>
          <Logo size={32} className="scale-75 origin-left" />
          <h1 className="text-xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-synth-red to-synth-purple">
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

interface StartWorkoutModalProps {
  workout: Workout;
  onStart: (mode: ExecutionMode) => void;
  onCancel: () => void;
}

function StartWorkoutModal({ workout, onStart, onCancel }: StartWorkoutModalProps) {
  const { hasTrainerControl } = useBluetooth();
  const [mode, setMode] = useState<ExecutionMode>('display');

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Start Workout</h2>
        <p className="text-gray-500 mb-4">{workout.name}</p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="display"
              checked={mode === 'display'}
              onChange={() => setMode('display')}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium text-gray-900">Display Only</div>
              <div className="text-sm text-gray-500">Show target power, no trainer control</div>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-3 bg-gray-100 rounded-lg ${hasTrainerControl ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
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
              <div className="font-medium text-gray-900">ERG Mode</div>
              <div className="text-sm text-gray-500">
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
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onStart(mode)}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

interface StartScreenProps {
  onGoToWorkouts: () => void;
  onGoToHardware: () => void;
}

function StartScreen({ onGoToWorkouts, onGoToHardware }: StartScreenProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gray-100">
      {/* Landing Background SVG */}
      <div
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage: 'url("/landing-bg.svg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="absolute top-4 right-4 z-10">
        <SettingsButton onClick={() => setShowSettings(true)} />
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <h1 className="text-6xl sm:text-8xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-synth-red via-synth-purple to-synth-red italic tracking-tighter filter drop-shadow-[0_0_15px_rgba(197,2,2,0.6)]">
          TRNR
        </h1>
        <p className="text-xl sm:text-2xl font-black mb-12 text-synth-red font-mono tracking-[0.3em] opacity-90 uppercase italic">
          trAIn smarter
        </p>

        <div className="bg-synth-purple/20 backdrop-blur-xl border border-synth-red/30 rounded-3xl p-10 max-w-sm w-full shadow-[0_0_50px_rgba(58,5,111,0.3)]">
          <div className="space-y-5">
            <button
              onClick={onGoToWorkouts}
              className="w-full px-4 py-5 bg-gradient-to-br from-synth-red to-synth-purple hover:from-synth-red/90 hover:to-synth-purple/90 rounded-2xl text-xl font-black italic tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(197,2,2,0.3)] text-white"
            >
              WORKOUTS
            </button>
            <button
              onClick={onGoToHardware}
              className="w-full px-4 py-5 bg-transparent hover:bg-white/5 border-2 border-synth-red/50 hover:border-synth-red rounded-2xl text-xl font-black italic tracking-widest transition-all transform hover:scale-105 active:scale-95 text-synth-red"
            >
              HARDWARE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [view, setView] = useState<AppView>('start');
  const [workoutToStart, setWorkoutToStart] = useState<Workout | null>(null);
  const { startWorkout, setOnTargetPowerChange } = useWorkout();
  const { sendTargetPower, hasTrainerControl } = useBluetooth();

  // Connect workout context to trainer control
  useEffect(() => {
    if (hasTrainerControl) {
      setOnTargetPowerChange(sendTargetPower);
    }
    return () => setOnTargetPowerChange(null);
  }, [hasTrainerControl, sendTargetPower, setOnTargetPowerChange]);

  const handleStartWorkout = (workout: Workout) => {
    setWorkoutToStart(workout);
  };

  const handleConfirmStart = (mode: ExecutionMode) => {
    if (workoutToStart) {
      startWorkout(workoutToStart, mode);
      setWorkoutToStart(null);
      setView('player');
    }
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
