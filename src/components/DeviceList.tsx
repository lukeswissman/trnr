import { useBluetooth } from '../hooks/useBluetooth';

export function DeviceList() {
  const { devices, disconnect, disconnectAll, simulatorConnected } = useBluetooth();

  const showSimulator = import.meta.env.DEV && simulatorConnected;
  const totalDevices = devices.size + (showSimulator ? 1 : 0);

  if (totalDevices === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showSimulator && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded-full text-sm">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span>Simulator</span>
          <button
            onClick={() => disconnect('simulator')}
            className="ml-1 hover:text-red-400 transition-colors"
            title="Disconnect"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {Array.from(devices.values()).map(({ device }) => (
        <div
          key={device.id}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-full text-sm"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>{device.name || 'Unknown Device'}</span>
          <button
            onClick={() => disconnect(device.id)}
            className="ml-1 hover:text-red-400 transition-colors"
            title="Disconnect"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      {totalDevices > 1 && (
        <button
          onClick={disconnectAll}
          className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Disconnect All
        </button>
      )}
    </div>
  );
}
