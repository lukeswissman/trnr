export function PlayerControls({
  status,
  onPause,
  onResume,
  onStop,
}) {
  return (
    <div className="flex justify-center gap-4">
      {status === 'running' && (
        <button
          onClick={onPause}
          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-lg font-medium"
        >
          Pause
        </button>
      )}

      {status === 'paused' && (
        <button
          onClick={onResume}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium"
        >
          Resume
        </button>
      )}

      {(status === 'running' || status === 'paused') && (
        <button
          onClick={onStop}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium"
        >
          Stop
        </button>
      )}

      {status === 'completed' && (
        <button
          onClick={onStop}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-medium"
        >
          Done
        </button>
      )}
    </div>
  );
}
