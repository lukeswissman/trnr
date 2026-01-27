import { createContext, useCallback, useState, useRef } from 'react';
import { requestDevice, subscribeToIndoorBikeData, disconnectDevice, setupTrainerControl, setTargetPower } from '../services/bluetooth/index.js';

// eslint-disable-next-line react-refresh/only-export-components
export const BluetoothContext = createContext(null);

export function BluetoothProvider({ children }) {
  const [devices, setDevices] = useState(new Map());
  const [liveData, setLiveData] = useState({
    power: null,
    speed: null,
    cadence: null,
    distance: null,
    heartRate: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const characteristicsRef = useRef(new Map());
  const trainerControlRef = useRef(null);
  const [hasTrainerControl, setHasTrainerControl] = useState(false);

  const connectDevice = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { device, server } = await requestDevice();

      // Subscribe to data
      const characteristic = await subscribeToIndoorBikeData(server, (data) => {
        setLiveData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== null)
          ),
        }));
      });

      // Store characteristic for cleanup
      characteristicsRef.current.set(device.id, characteristic);

      // Try to set up trainer control (optional - may not be supported)
      const control = await setupTrainerControl(server);
      if (control) {
        trainerControlRef.current = control;
        setHasTrainerControl(true);
      }

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setDevices((prev) => {
          const next = new Map(prev);
          next.delete(device.id);
          return next;
        });
        characteristicsRef.current.delete(device.id);
      });

      // Store device
      setDevices((prev) => {
        const next = new Map(prev);
        next.set(device.id, { device, server });
        return next;
      });

      return device;
    } catch (err) {
      // User cancelled or error
      if (err.name !== 'NotFoundError') {
        setError(err.message);
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback((deviceId) => {
    const entry = devices.get(deviceId);
    if (entry) {
      disconnectDevice(entry.device);
      setDevices((prev) => {
        const next = new Map(prev);
        next.delete(deviceId);
        return next;
      });
      characteristicsRef.current.delete(deviceId);
      trainerControlRef.current = null;
      setHasTrainerControl(false);
    }
  }, [devices]);

  const disconnectAll = useCallback(() => {
    devices.forEach(({ device }) => {
      disconnectDevice(device);
    });
    setDevices(new Map());
    characteristicsRef.current.clear();
    trainerControlRef.current = null;
    setHasTrainerControl(false);
    setLiveData({
      power: null,
      speed: null,
      cadence: null,
      distance: null,
      heartRate: null,
    });
  }, [devices]);

  // Set target power on trainer (ERG mode)
  const sendTargetPower = useCallback(async (watts) => {
    if (trainerControlRef.current) {
      return setTargetPower(trainerControlRef.current.writeAndWait, watts);
    }
    return false;
  }, []);

  const value = {
    devices,
    liveData,
    isConnecting,
    error,
    connectDevice,
    disconnect,
    disconnectAll,
    hasTrainerControl,
    sendTargetPower,
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}
