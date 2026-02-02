// Heart Rate Service Protocol Constants and Parser
// Spec: https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/

export const HR_SERVICE_UUID = 0x180D;
export const HR_MEASUREMENT_UUID = 0x2A37;

/**
 * Parse Heart Rate Measurement characteristic value
 * @param {DataView} dataView - The characteristic value as DataView
 * @returns {{ heartRate: number }} Parsed heart rate in BPM
 */
export function parseHeartRate(dataView) {
  const flags = dataView.getUint8(0);

  // Bit 0: Heart Rate Value Format
  // 0 = uint8, 1 = uint16
  const is16Bit = flags & 0x01;

  const heartRate = is16Bit
    ? dataView.getUint16(1, true)
    : dataView.getUint8(1);

  return { heartRate };
}
