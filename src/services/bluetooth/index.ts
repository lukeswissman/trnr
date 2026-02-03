import { FTMS_SERVICE_UUID, INDOOR_BIKE_DATA_UUID, parseIndoorBikeData, type IndoorBikeData } from './ftms';
import { HR_SERVICE_UUID, HR_MEASUREMENT_UUID, parseHeartRate, type HeartRateData } from './heartRate';
export { setupTrainerControl, setTargetPower, startTrainerWorkout, stopTrainerWorkout, resetTrainer } from './trainerControl';
export type { TrainerControl, WriteAndWaitFn } from './trainerControl';

export interface DeviceConnection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
}

/**
 * Request and connect to an FTMS-compatible Bluetooth device
 */
export async function requestDevice(): Promise<DeviceConnection> {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser');
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [FTMS_SERVICE_UUID] }],
    optionalServices: [],
  });

  const server = await device.gatt!.connect();

  return { device, server };
}

/**
 * Subscribe to Indoor Bike Data notifications
 */
export async function subscribeToIndoorBikeData(
  server: BluetoothRemoteGATTServer,
  onData: (data: IndoorBikeData) => void
): Promise<BluetoothRemoteGATTCharacteristic> {
  const service = await server.getPrimaryService(FTMS_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(INDOOR_BIKE_DATA_UUID);

  characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const dataView = target.value!;
    const parsed = parseIndoorBikeData(dataView);
    onData(parsed);
  });

  await characteristic.startNotifications();

  return characteristic;
}

/**
 * Request and connect to a Heart Rate Bluetooth device
 */
export async function requestHRDevice(): Promise<DeviceConnection> {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser');
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [HR_SERVICE_UUID] }],
    optionalServices: [],
  });

  const server = await device.gatt!.connect();

  return { device, server };
}

/**
 * Subscribe to Heart Rate Measurement notifications
 */
export async function subscribeToHeartRate(
  server: BluetoothRemoteGATTServer,
  onData: (data: HeartRateData) => void
): Promise<BluetoothRemoteGATTCharacteristic> {
  const service = await server.getPrimaryService(HR_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(HR_MEASUREMENT_UUID);

  characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const dataView = target.value!;
    const parsed = parseHeartRate(dataView);
    onData(parsed);
  });

  await characteristic.startNotifications();

  return characteristic;
}

/**
 * Disconnect from a Bluetooth device
 */
export function disconnectDevice(device: BluetoothDevice): void {
  if (device?.gatt?.connected) {
    device.gatt.disconnect();
  }
}
