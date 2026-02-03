// FTMS Fitness Machine Control Point (0x2AD9) Protocol
// For controlling trainer resistance in ERG mode

export const CONTROL_POINT_UUID = 0x2AD9;

// Opcodes
const OP_REQUEST_CONTROL = 0x00;
const OP_RESET = 0x01;
const OP_SET_TARGET_POWER = 0x05;
const OP_START_RESUME = 0x07;
const OP_STOP_PAUSE = 0x08;

// Response codes
const RESPONSE_CODE = 0x80;
const RESULT_SUCCESS = 0x01;

export interface ControlPointResponse {
  success: boolean;
  result: number;
  error?: Error;
}

export type WriteAndWaitFn = (
  data: Uint8Array,
  opcode: number,
  timeout?: number
) => Promise<ControlPointResponse>;

export interface TrainerControl {
  characteristic: BluetoothRemoteGATTCharacteristic;
  writeAndWait: WriteAndWaitFn;
}

/**
 * Setup trainer control - subscribe to indications and request control
 */
export async function setupTrainerControl(
  server: BluetoothRemoteGATTServer
): Promise<TrainerControl | null> {
  try {
    const service = await server.getPrimaryService(0x1826); // FTMS
    const characteristic = await service.getCharacteristic(CONTROL_POINT_UUID);

    // Queue for pending operations
    let pendingResolve: ((response: ControlPointResponse) => void) | null = null;
    let pendingOpcode: number | null = null;

    // Handle indications (responses)
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
      const data = new Uint8Array(target.value!.buffer as ArrayBuffer);

      if (data[0] === RESPONSE_CODE && pendingResolve) {
        const responseOpcode = data[1];
        const result = data[2];

        if (responseOpcode === pendingOpcode) {
          pendingResolve({ success: result === RESULT_SUCCESS, result });
          pendingResolve = null;
          pendingOpcode = null;
        }
      }
    });

    // Start indications
    await characteristic.startNotifications();

    /**
     * Write command and wait for response
     */
    const writeAndWait: WriteAndWaitFn = async (data, opcode, timeout = 3000) => {
      return new Promise((resolve) => {
        pendingOpcode = opcode;
        pendingResolve = resolve;

        const timeoutId = setTimeout(() => {
          if (pendingResolve === resolve) {
            pendingResolve = null;
            pendingOpcode = null;
            resolve({ success: false, result: -1 });
          }
        }, timeout);

        characteristic.writeValue(data as unknown as ArrayBuffer).then(() => {
          // Wait for indication response
        }).catch((err: Error) => {
          clearTimeout(timeoutId);
          pendingResolve = null;
          pendingOpcode = null;
          resolve({ success: false, result: -1, error: err });
        });
      });
    };

    // Request control
    const requestResult = await writeAndWait(
      new Uint8Array([OP_REQUEST_CONTROL]),
      OP_REQUEST_CONTROL
    );

    if (!requestResult.success) {
      console.warn('Failed to request trainer control:', requestResult);
      // Some trainers may still work without explicit control request
    }

    return { characteristic, writeAndWait };
  } catch (err) {
    console.error('Trainer control setup failed:', err);
    return null;
  }
}

/**
 * Set target power (ERG mode)
 */
export async function setTargetPower(
  writeAndWait: WriteAndWaitFn,
  watts: number
): Promise<boolean> {
  // Clamp to reasonable range
  const power = Math.max(0, Math.min(2000, Math.round(watts)));

  // Create command: opcode (1 byte) + power (sint16 little-endian)
  const data = new Uint8Array(3);
  data[0] = OP_SET_TARGET_POWER;
  // Write as signed 16-bit little-endian
  const view = new DataView(data.buffer);
  view.setInt16(1, power, true);

  const result = await writeAndWait(data, OP_SET_TARGET_POWER);
  return result.success;
}

/**
 * Start or resume workout
 */
export async function startTrainerWorkout(
  writeAndWait: WriteAndWaitFn
): Promise<boolean> {
  const result = await writeAndWait(
    new Uint8Array([OP_START_RESUME]),
    OP_START_RESUME
  );
  return result.success;
}

/**
 * Stop or pause workout
 */
export async function stopTrainerWorkout(
  writeAndWait: WriteAndWaitFn,
  stop: boolean = true
): Promise<boolean> {
  const result = await writeAndWait(
    new Uint8Array([OP_STOP_PAUSE, stop ? 0x01 : 0x02]),
    OP_STOP_PAUSE
  );
  return result.success;
}

/**
 * Reset trainer
 */
export async function resetTrainer(
  writeAndWait: WriteAndWaitFn
): Promise<boolean> {
  const result = await writeAndWait(
    new Uint8Array([OP_RESET]),
    OP_RESET
  );
  return result.success;
}
