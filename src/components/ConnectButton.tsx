import { useBluetooth } from '../hooks/useBluetooth';

export function ConnectButton() {
  const { connectDevice, connectHRDevice, isConnecting, devices } = useBluetooth();
  const isConnected = devices.size > 0;

  const spinner = (
    <span className="flex items-center gap-2">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Connecting...
    </span>
  );

  return (
    <div className="flex gap-2">
      <button
        onClick={connectDevice}
        disabled={isConnecting}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {isConnecting ? spinner : isConnected ? 'Connect Another Device' : 'Connect Trainer'}
      </button>
      <button
        onClick={connectHRDevice}
        disabled={isConnecting}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {isConnecting ? spinner : 'Connect HR'}
      </button>
    </div>
  );
}
