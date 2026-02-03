import { createContext, useCallback, useState, useRef, type ReactNode } from 'react';
import {
  requestDevice,
  requestHRDevice,
  subscribeToIndoorBikeData,
  subscribeToHeartRate,
  disconnectDevice,
  setupTrainerControl,
  setTargetPower,
  type TrainerControl,
} from '../services/bluetooth';
import type { LiveData } from '../types/bluetooth';

interface DeviceEntry {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
}

export interface BluetoothContextValue {
  devices: Map<string, DeviceEntry>;
  liveData: LiveData;
  isConnecting: boolean;
  error: string | null;
  connectDevice: () => Promise<BluetoothDevice | null>;
  connectHRDevice: () => Promise<BluetoothDevice | null>;
  disconnect: (deviceId: string) => void;
  disconnectAll: () => void;
  hasTrainerControl: boolean;
  sendTargetPower: (watts: number) => Promise<boolean>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const BluetoothContext = createContext<BluetoothContextValue | null>(null);

interface BluetoothProviderProps {
  children: ReactNode;
}

export function BluetoothProvider({ children }: BluetoothProviderProps) {
  const [devices, setDevices] = useState<Map<string, DeviceEntry>>(new Map());
  const [liveData, setLiveData] = useState<LiveData>({
    power: null,
    speed: null,
    cadence: null,
    distance: null,
    heartRate: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characteristicsRef = useRef<Map<string, BluetoothRemoteGATTCharacteristic>>(new Map());
  const trainerControlRef = useRef<TrainerControl | null>(null);
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
      if ((err as Error).name !== 'NotFoundError') {
        setError((err as Error).message);
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const connectHRDevice = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { device, server } = await requestHRDevice();

      // Subscribe to heart rate data
      const characteristic = await subscribeToHeartRate(server, (data) => {
        setLiveData((prev) => ({
          ...prev,
          heartRate: data.heartRate,
        }));
      });

      // Store characteristic for cleanup
      characteristicsRef.current.set(device.id, characteristic);

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setDevices((prev) => {
          const next = new Map(prev);
          next.delete(device.id);
          return next;
        });
        characteristicsRef.current.delete(device.id);
        setLiveData((prev) => ({ ...prev, heartRate: null }));
      });

      // Store device
      setDevices((prev) => {
        const next = new Map(prev);
        next.set(device.id, { device, server });
        return next;
      });

      return device;
    } catch (err) {
      if ((err as Error).name !== 'NotFoundError') {
        setError((err as Error).message);
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback((deviceId: string) => {
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
  const sendTargetPower = useCallback(async (watts: number) => {
    if (trainerControlRef.current) {
      return setTargetPower(trainerControlRef.current.writeAndWait, watts);
    }
    return false;
  }, []);

  const value: BluetoothContextValue = {
    devices,
    liveData,
    isConnecting,
    error,
    connectDevice,
    connectHRDevice,
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
