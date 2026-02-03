// FTMS (Fitness Machine Service) Protocol Constants and Parsers
// Spec: https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0/

export const FTMS_SERVICE_UUID = 0x1826;
export const INDOOR_BIKE_DATA_UUID = 0x2AD2;
export const FITNESS_MACHINE_FEATURE_UUID = 0x2ACC;
export const CONTROL_POINT_UUID = 0x2AD9;

// Indoor Bike Data Flags (16-bit)
const FLAGS = {
  MORE_DATA: 1 << 0,
  AVERAGE_SPEED: 1 << 1,
  INSTANTANEOUS_CADENCE: 1 << 2,
  AVERAGE_CADENCE: 1 << 3,
  TOTAL_DISTANCE: 1 << 4,
  RESISTANCE_LEVEL: 1 << 5,
  INSTANTANEOUS_POWER: 1 << 6,
  AVERAGE_POWER: 1 << 7,
  EXPENDED_ENERGY: 1 << 8,
  HEART_RATE: 1 << 9,
  METABOLIC_EQUIVALENT: 1 << 10,
  ELAPSED_TIME: 1 << 11,
  REMAINING_TIME: 1 << 12,
};

export interface IndoorBikeData {
  speed: number | null;
  cadence: number | null;
  power: number | null;
  distance: number | null;
  heartRate: number | null;
}

/**
 * Parse Indoor Bike Data characteristic value
 */
export function parseIndoorBikeData(dataView: DataView): IndoorBikeData {
  let offset = 0;

  // Read 16-bit flags (little-endian)
  const flags = dataView.getUint16(offset, true);
  offset += 2;

  const result: IndoorBikeData = {
    speed: null,
    cadence: null,
    power: null,
    distance: null,
    heartRate: null,
  };

  // Instantaneous Speed is present if MORE_DATA flag is NOT set
  if (!(flags & FLAGS.MORE_DATA)) {
    // Speed is uint16, resolution 0.01 km/h
    result.speed = dataView.getUint16(offset, true) * 0.01;
    offset += 2;
  }

  // Average Speed (skip if present)
  if (flags & FLAGS.AVERAGE_SPEED) {
    offset += 2;
  }

  // Instantaneous Cadence
  if (flags & FLAGS.INSTANTANEOUS_CADENCE) {
    // Cadence is uint16, resolution 0.5 rpm
    result.cadence = dataView.getUint16(offset, true) * 0.5;
    offset += 2;
  }

  // Average Cadence (skip if present)
  if (flags & FLAGS.AVERAGE_CADENCE) {
    offset += 2;
  }

  // Total Distance (24-bit uint, meters)
  if (flags & FLAGS.TOTAL_DISTANCE) {
    // Read 3 bytes as little-endian uint24
    const b0 = dataView.getUint8(offset);
    const b1 = dataView.getUint8(offset + 1);
    const b2 = dataView.getUint8(offset + 2);
    result.distance = b0 | (b1 << 8) | (b2 << 16);
    offset += 3;
  }

  // Resistance Level (skip if present)
  if (flags & FLAGS.RESISTANCE_LEVEL) {
    offset += 2;
  }

  // Instantaneous Power (int16, watts)
  if (flags & FLAGS.INSTANTANEOUS_POWER) {
    result.power = dataView.getInt16(offset, true);
    offset += 2;
  }

  // Average Power (skip if present)
  if (flags & FLAGS.AVERAGE_POWER) {
    offset += 2;
  }

  // Expended Energy (skip if present - 3 fields)
  if (flags & FLAGS.EXPENDED_ENERGY) {
    offset += 5; // Total (2) + per hour (2) + per minute (1)
  }

  // Heart Rate
  if (flags & FLAGS.HEART_RATE) {
    result.heartRate = dataView.getUint8(offset);
    offset += 1;
  }

  return result;
}
