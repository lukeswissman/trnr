import { useContext } from 'react';
import { BluetoothContext, type BluetoothContextValue } from '../contexts/BluetoothContext';

export function useBluetooth(): BluetoothContextValue {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
}
