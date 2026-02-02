import { FTMS_SERVICE_UUID, INDOOR_BIKE_DATA_UUID, parseIndoorBikeData } from './ftms.js';
import { HR_SERVICE_UUID, HR_MEASUREMENT_UUID, parseHeartRate } from './heartRate.js';
export { setupTrainerControl, setTargetPower, startTrainerWorkout, stopTrainerWorkout, resetTrainer } from './trainerControl.js';

/**
 * Request and connect to an FTMS-compatible Bluetooth device
 * @returns {Promise<{device: BluetoothDevice, server: BluetoothRemoteGATTServer}>}
 */
export async function requestDevice() {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser');
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [FTMS_SERVICE_UUID] }],
    optionalServices: [],
  });

  const server = await device.gatt.connect();

  return { device, server };
}

/**
 * Subscribe to Indoor Bike Data notifications
 * @param {BluetoothRemoteGATTServer} server - Connected GATT server
 * @param {Function} onData - Callback function receiving parsed data
 * @returns {Promise<BluetoothRemoteGATTCharacteristic>} The characteristic for cleanup
 */
export async function subscribeToIndoorBikeData(server, onData) {
  const service = await server.getPrimaryService(FTMS_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(INDOOR_BIKE_DATA_UUID);

  characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const dataView = event.target.value;
    const parsed = parseIndoorBikeData(dataView);
    onData(parsed);
  });

  await characteristic.startNotifications();

  return characteristic;
}

/**
 * Request and connect to a Heart Rate Bluetooth device
 * @returns {Promise<{device: BluetoothDevice, server: BluetoothRemoteGATTServer}>}
 */
export async function requestHRDevice() {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser');
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [HR_SERVICE_UUID] }],
    optionalServices: [],
  });

  const server = await device.gatt.connect();

  return { device, server };
}

/**
 * Subscribe to Heart Rate Measurement notifications
 * @param {BluetoothRemoteGATTServer} server - Connected GATT server
 * @param {Function} onData - Callback function receiving parsed data
 * @returns {Promise<BluetoothRemoteGATTCharacteristic>} The characteristic for cleanup
 */
export async function subscribeToHeartRate(server, onData) {
  const service = await server.getPrimaryService(HR_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(HR_MEASUREMENT_UUID);

  characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const dataView = event.target.value;
    const parsed = parseHeartRate(dataView);
    onData(parsed);
  });

  await characteristic.startNotifications();

  return characteristic;
}

/**
 * Disconnect from a Bluetooth device
 * @param {BluetoothDevice} device - The device to disconnect
 */
export function disconnectDevice(device) {
  if (device?.gatt?.connected) {
    device.gatt.disconnect();
  }
}
