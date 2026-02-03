// FIT Binary Encoder
// Implements the Garmin FIT protocol for activity files.
// Spec: https://developer.garmin.com/fit/protocol/
//
// Uses DataView/Uint8Array for binary writing, matching the style in
// src/services/bluetooth/ftms.ts.

import type { WorkoutRecording } from '../../types/recording';

// FIT Base Types
const BASE_TYPE_ENUM = 0x00;
const BASE_TYPE_UINT8 = 0x0D;
const BASE_TYPE_UINT16 = 0x84;
const BASE_TYPE_UINT32 = 0x86;
// const BASE_TYPE_STRING = 0x07; // Unused, kept for documentation

// FIT invalid sentinels (used when data is null/missing)
const INVALID_UINT8 = 0xFF;
const INVALID_UINT16 = 0xFFFF;
const INVALID_UINT32 = 0xFFFFFFFF;

// FIT epoch: Dec 31, 1989 00:00:00 UTC
const FIT_EPOCH_OFFSET = 631065600;

// CRC-16 lookup table for FIT protocol
const CRC_TABLE = new Uint16Array(16);
(function initCrcTable() {
  for (let i = 0; i < 16; i++) {
    let crc = 0;
    for (let j = 0; j < 4; j++) {
      if (((crc ^ (i >> j)) & 1) !== 0) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
    CRC_TABLE[i] = crc;
  }
})();

function fitCrc(data: Uint8Array, start: number, end: number): number {
  let crc = 0;
  for (let i = start; i < end; i++) {
    const byte = data[i];
    crc = (crc >> 4) ^ CRC_TABLE[(crc ^ byte) & 0xF];
    crc = (crc >> 4) ^ CRC_TABLE[(crc ^ (byte >> 4)) & 0xF];
  }
  return crc;
}

function toFitTimestamp(unixSeconds: number): number {
  return Math.round(unixSeconds) - FIT_EPOCH_OFFSET;
}

type FieldDef = [number, number, number];

/**
 * Growable binary buffer for building FIT files.
 */
class FitBuffer {
  _buffer: ArrayBuffer;
  _view: DataView;
  _bytes: Uint8Array;
  _offset: number;

  constructor(initialSize: number = 4096) {
    this._buffer = new ArrayBuffer(initialSize);
    this._view = new DataView(this._buffer);
    this._bytes = new Uint8Array(this._buffer);
    this._offset = 0;
  }

  _grow(needed: number): void {
    if (this._offset + needed <= this._buffer.byteLength) return;
    let newSize = this._buffer.byteLength;
    while (newSize < this._offset + needed) newSize *= 2;
    const newBuf = new ArrayBuffer(newSize);
    new Uint8Array(newBuf).set(this._bytes);
    this._buffer = newBuf;
    this._view = new DataView(this._buffer);
    this._bytes = new Uint8Array(this._buffer);
  }

  writeUint8(val: number): void {
    this._grow(1);
    this._view.setUint8(this._offset, val);
    this._offset += 1;
  }

  writeUint16(val: number): void {
    this._grow(2);
    this._view.setUint16(this._offset, val, true);
    this._offset += 2;
  }

  writeUint32(val: number): void {
    this._grow(4);
    this._view.setUint32(this._offset, val, true);
    this._offset += 4;
  }

  writeSint16(val: number): void {
    this._grow(2);
    this._view.setInt16(this._offset, val, true);
    this._offset += 2;
  }

  writeString(str: string, len: number): void {
    this._grow(len);
    for (let i = 0; i < len; i++) {
      this._bytes[this._offset + i] = i < str.length ? str.charCodeAt(i) : 0;
    }
    this._offset += len;
  }

  get offset(): number {
    return this._offset;
  }

  get bytes(): Uint8Array {
    return new Uint8Array(this._buffer, 0, this._offset);
  }
}

// Field definition helper: [field_def_num, size_bytes, base_type]
const FIELD = (num: number, size: number, type: number): FieldDef => [num, size, type];

/**
 * Write a FIT definition message.
 */
function writeDefinition(
  buf: FitBuffer,
  localMesg: number,
  globalMesg: number,
  fields: FieldDef[]
): void {
  // Record header: definition message, local message type
  buf.writeUint8(0x40 | (localMesg & 0x0F));
  buf.writeUint8(0); // Reserved
  buf.writeUint8(0); // Architecture: little-endian
  buf.writeUint16(globalMesg);
  buf.writeUint8(fields.length);
  for (const [num, size, type] of fields) {
    buf.writeUint8(num);
    buf.writeUint8(size);
    buf.writeUint8(type);
  }
}

/**
 * Write a FIT data message header.
 */
function writeDataHeader(buf: FitBuffer, localMesg: number): void {
  buf.writeUint8(localMesg & 0x0F);
}

/**
 * Encode a WorkoutRecording as a FIT binary file.
 */
export function encodeFit(recording: WorkoutRecording): Uint8Array {
  const buf = new FitBuffer();

  // === FIT File Header (14 bytes) ===
  const headerSize = 14;
  buf.writeUint8(headerSize);      // Header size
  buf.writeUint8(0x20);            // Protocol version 2.0
  buf.writeUint16(0x08E6);         // Profile version 2278
  buf.writeUint32(0);              // Data size placeholder (offset 4)
  buf.writeString('.FIT', 4);      // Data type signature
  buf.writeUint16(0);              // Header CRC placeholder (offset 12)

  // Compute header CRC
  const headerCrc = fitCrc(buf.bytes, 0, 12);
  buf._view.setUint16(12, headerCrc, true);

  const dataStart = buf.offset;

  // === file_id message (mesg 0) ===
  const FILE_ID_FIELDS: FieldDef[] = [
    FIELD(0, 1, BASE_TYPE_ENUM),     // type
    FIELD(1, 2, BASE_TYPE_UINT16),   // manufacturer
    FIELD(2, 2, BASE_TYPE_UINT16),   // product
    FIELD(3, 4, BASE_TYPE_UINT32),   // serial_number
    FIELD(4, 4, BASE_TYPE_UINT32),   // time_created
  ];
  writeDefinition(buf, 0, 0, FILE_ID_FIELDS);
  writeDataHeader(buf, 0);
  buf.writeUint8(4);                                        // type = activity
  buf.writeUint16(255);                                     // manufacturer = development
  buf.writeUint16(1);                                       // product
  buf.writeUint32(12345);                                   // serial_number
  buf.writeUint32(toFitTimestamp(recording.startTime));      // time_created

  // === event message - timer start (mesg 21) ===
  const EVENT_FIELDS: FieldDef[] = [
    FIELD(253, 4, BASE_TYPE_UINT32),  // timestamp
    FIELD(0, 1, BASE_TYPE_ENUM),      // event
    FIELD(1, 1, BASE_TYPE_ENUM),      // event_type
  ];
  writeDefinition(buf, 1, 21, EVENT_FIELDS);
  writeDataHeader(buf, 1);
  buf.writeUint32(toFitTimestamp(recording.startTime));  // timestamp
  buf.writeUint8(0);    // event = timer
  buf.writeUint8(0);    // event_type = start

  // === record messages (mesg 20) - per-second data ===
  const RECORD_FIELDS: FieldDef[] = [
    FIELD(253, 4, BASE_TYPE_UINT32),  // timestamp
    FIELD(7, 2, BASE_TYPE_UINT16),    // power
    FIELD(3, 1, BASE_TYPE_UINT8),     // heart_rate
    FIELD(4, 1, BASE_TYPE_UINT8),     // cadence
    FIELD(6, 2, BASE_TYPE_UINT16),    // speed (m/s * 1000)
    FIELD(5, 4, BASE_TYPE_UINT32),    // distance (m * 100)
  ];
  writeDefinition(buf, 2, 20, RECORD_FIELDS);

  // Track stats for lap/session summary
  let sumPower = 0, countPower = 0, maxPower = 0;
  let sumHr = 0, countHr = 0, maxHr = 0;
  let sumCadence = 0, countCadence = 0, maxCadence = 0;
  let sumSpeed = 0, countSpeed = 0, maxSpeed = 0;

  for (const sample of recording.samples) {
    writeDataHeader(buf, 2);
    buf.writeUint32(toFitTimestamp(sample.timestamp));

    // Power (uint16, watts)
    if (sample.power != null) {
      buf.writeUint16(sample.power);
      sumPower += sample.power;
      countPower++;
      if (sample.power > maxPower) maxPower = sample.power;
    } else {
      buf.writeUint16(INVALID_UINT16);
    }

    // Heart rate (uint8, bpm)
    if (sample.heartRate != null) {
      buf.writeUint8(sample.heartRate);
      sumHr += sample.heartRate;
      countHr++;
      if (sample.heartRate > maxHr) maxHr = sample.heartRate;
    } else {
      buf.writeUint8(INVALID_UINT8);
    }

    // Cadence (uint8, rpm)
    if (sample.cadence != null) {
      buf.writeUint8(Math.round(sample.cadence));
      sumCadence += sample.cadence;
      countCadence++;
      if (sample.cadence > maxCadence) maxCadence = sample.cadence;
    } else {
      buf.writeUint8(INVALID_UINT8);
    }

    // Speed (uint16, m/s * 1000) - input is km/h, convert to m/s then scale
    if (sample.speed != null) {
      const speedMs = sample.speed / 3.6;
      buf.writeUint16(Math.round(speedMs * 1000));
      sumSpeed += speedMs;
      countSpeed++;
      if (speedMs > maxSpeed) maxSpeed = speedMs;
    } else {
      buf.writeUint16(INVALID_UINT16);
    }

    // Distance (uint32, m * 100)
    if (sample.distance != null) {
      buf.writeUint32(Math.round(sample.distance * 100));
    } else {
      buf.writeUint32(INVALID_UINT32);
    }
  }

  // === event message - timer stop (mesg 21) ===
  writeDefinition(buf, 1, 21, EVENT_FIELDS);
  writeDataHeader(buf, 1);
  buf.writeUint32(toFitTimestamp(recording.endTime));  // timestamp
  buf.writeUint8(0);    // event = timer
  buf.writeUint8(4);    // event_type = stop_all

  // === lap message (mesg 19) ===
  const LAP_FIELDS: FieldDef[] = [
    FIELD(253, 4, BASE_TYPE_UINT32),  // timestamp
    FIELD(2, 4, BASE_TYPE_UINT32),    // start_time
    FIELD(7, 4, BASE_TYPE_UINT32),    // total_elapsed_time (ms * 1000)
    FIELD(8, 4, BASE_TYPE_UINT32),    // total_timer_time (ms * 1000)
    FIELD(19, 2, BASE_TYPE_UINT16),   // avg_power
    FIELD(20, 2, BASE_TYPE_UINT16),   // max_power
    FIELD(15, 1, BASE_TYPE_UINT8),    // avg_heart_rate
    FIELD(16, 1, BASE_TYPE_UINT8),    // max_heart_rate
    FIELD(17, 1, BASE_TYPE_UINT8),    // avg_cadence
    FIELD(18, 1, BASE_TYPE_UINT8),    // max_cadence
    FIELD(24, 1, BASE_TYPE_ENUM),     // lap_trigger
    FIELD(25, 1, BASE_TYPE_ENUM),     // sport
  ];
  writeDefinition(buf, 3, 19, LAP_FIELDS);
  writeDataHeader(buf, 3);
  buf.writeUint32(toFitTimestamp(recording.endTime));                     // timestamp
  buf.writeUint32(toFitTimestamp(recording.startTime));                   // start_time
  buf.writeUint32(Math.round(recording.totalElapsed * 1000));            // total_elapsed_time
  buf.writeUint32(Math.round(recording.totalTimerTime * 1000));          // total_timer_time
  buf.writeUint16(countPower ? Math.round(sumPower / countPower) : INVALID_UINT16);  // avg_power
  buf.writeUint16(countPower ? maxPower : INVALID_UINT16);                           // max_power
  buf.writeUint8(countHr ? Math.round(sumHr / countHr) : INVALID_UINT8);            // avg_heart_rate
  buf.writeUint8(countHr ? maxHr : INVALID_UINT8);                                  // max_heart_rate
  buf.writeUint8(countCadence ? Math.round(sumCadence / countCadence) : INVALID_UINT8); // avg_cadence
  buf.writeUint8(countCadence ? Math.round(maxCadence) : INVALID_UINT8);             // max_cadence
  buf.writeUint8(0);    // lap_trigger = manual
  buf.writeUint8(2);    // sport = cycling

  // === session message (mesg 18) ===
  const SESSION_FIELDS: FieldDef[] = [
    FIELD(253, 4, BASE_TYPE_UINT32),  // timestamp
    FIELD(2, 4, BASE_TYPE_UINT32),    // start_time
    FIELD(7, 4, BASE_TYPE_UINT32),    // total_elapsed_time
    FIELD(8, 4, BASE_TYPE_UINT32),    // total_timer_time
    FIELD(5, 1, BASE_TYPE_ENUM),      // sport
    FIELD(6, 1, BASE_TYPE_ENUM),      // sub_sport
    FIELD(9, 4, BASE_TYPE_UINT32),    // total_distance (m * 100)
    FIELD(20, 2, BASE_TYPE_UINT16),   // avg_power
    FIELD(21, 2, BASE_TYPE_UINT16),   // max_power
    FIELD(16, 1, BASE_TYPE_UINT8),    // avg_heart_rate
    FIELD(17, 1, BASE_TYPE_UINT8),    // max_heart_rate
    FIELD(18, 1, BASE_TYPE_UINT8),    // avg_cadence
    FIELD(19, 1, BASE_TYPE_UINT8),    // max_cadence
    FIELD(14, 2, BASE_TYPE_UINT16),   // avg_speed (m/s * 1000)
    FIELD(15, 2, BASE_TYPE_UINT16),   // max_speed (m/s * 1000)
    FIELD(28, 1, BASE_TYPE_ENUM),     // trigger
    FIELD(22, 2, BASE_TYPE_UINT16),   // num_laps
  ];
  writeDefinition(buf, 4, 18, SESSION_FIELDS);
  writeDataHeader(buf, 4);
  buf.writeUint32(toFitTimestamp(recording.endTime));                     // timestamp
  buf.writeUint32(toFitTimestamp(recording.startTime));                   // start_time
  buf.writeUint32(Math.round(recording.totalElapsed * 1000));            // total_elapsed_time
  buf.writeUint32(Math.round(recording.totalTimerTime * 1000));          // total_timer_time
  buf.writeUint8(2);    // sport = cycling
  buf.writeUint8(58);   // sub_sport = virtual_activity

  // total_distance - use last sample's distance if available
  const lastSample = recording.samples[recording.samples.length - 1];
  const totalDistance = lastSample?.distance;
  buf.writeUint32(totalDistance != null ? Math.round(totalDistance * 100) : INVALID_UINT32);

  buf.writeUint16(countPower ? Math.round(sumPower / countPower) : INVALID_UINT16);  // avg_power
  buf.writeUint16(countPower ? maxPower : INVALID_UINT16);                           // max_power
  buf.writeUint8(countHr ? Math.round(sumHr / countHr) : INVALID_UINT8);            // avg_heart_rate
  buf.writeUint8(countHr ? maxHr : INVALID_UINT8);                                  // max_heart_rate
  buf.writeUint8(countCadence ? Math.round(sumCadence / countCadence) : INVALID_UINT8); // avg_cadence
  buf.writeUint8(countCadence ? Math.round(maxCadence) : INVALID_UINT8);             // max_cadence
  buf.writeUint16(countSpeed ? Math.round((sumSpeed / countSpeed) * 1000) : INVALID_UINT16); // avg_speed
  buf.writeUint16(countSpeed ? Math.round(maxSpeed * 1000) : INVALID_UINT16);        // max_speed
  buf.writeUint8(0);    // trigger = activity_end
  buf.writeUint16(1);   // num_laps

  // === activity message (mesg 34) ===
  const ACTIVITY_FIELDS: FieldDef[] = [
    FIELD(253, 4, BASE_TYPE_UINT32),  // timestamp
    FIELD(0, 4, BASE_TYPE_UINT32),    // total_timer_time (s * 1000)
    FIELD(1, 2, BASE_TYPE_UINT16),    // num_sessions
    FIELD(2, 1, BASE_TYPE_ENUM),      // type
    FIELD(3, 1, BASE_TYPE_ENUM),      // event
    FIELD(4, 1, BASE_TYPE_ENUM),      // event_type
    FIELD(5, 4, BASE_TYPE_UINT32),    // local_timestamp
  ];
  writeDefinition(buf, 5, 34, ACTIVITY_FIELDS);
  writeDataHeader(buf, 5);
  buf.writeUint32(toFitTimestamp(recording.endTime));                  // timestamp
  buf.writeUint32(Math.round(recording.totalTimerTime * 1000));       // total_timer_time
  buf.writeUint16(1);   // num_sessions
  buf.writeUint8(0);    // type = manual
  buf.writeUint8(26);   // event = activity
  buf.writeUint8(1);    // event_type = stop
  buf.writeUint32(toFitTimestamp(recording.endTime));                  // local_timestamp

  // === Finalize: patch data size and write CRC ===
  const dataSize = buf.offset - dataStart;
  buf._view.setUint32(4, dataSize, true);

  // CRC over entire file (header + data)
  const fileCrc = fitCrc(buf.bytes, 0, buf.offset);
  buf.writeUint16(fileCrc);

  return buf.bytes;
}
