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

/**
 * Setup trainer control - subscribe to indications and request control
 * @param {BluetoothRemoteGATTServer} server - Connected GATT server
 * @returns {Promise<{ characteristic: BluetoothRemoteGATTCharacteristic, writeAndWait: Function } | null>}
 */
export async function setupTrainerControl(server) {
  try {
    const service = await server.getPrimaryService(0x1826); // FTMS
    const characteristic = await service.getCharacteristic(CONTROL_POINT_UUID);

    // Queue for pending operations
    let pendingResolve = null;
    let pendingOpcode = null;

    // Handle indications (responses)
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const data = new Uint8Array(event.target.value.buffer);

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
     * @param {Uint8Array} data - Command data to write
     * @param {number} opcode - Expected response opcode
     * @param {number} [timeout=3000] - Timeout in milliseconds
     * @returns {Promise<{ success: boolean, result: number }>}
     */
    const writeAndWait = async (data, opcode, timeout = 3000) => {
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

        characteristic.writeValue(data).then(() => {
          // Wait for indication response
        }).catch((err) => {
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
 * @param {Function} writeAndWait - Write function from setupTrainerControl
 * @param {number} watts - Target power in watts
 * @returns {Promise<boolean>}
 */
export async function setTargetPower(writeAndWait, watts) {
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
 * @param {Function} writeAndWait - Write function from setupTrainerControl
 * @returns {Promise<boolean>}
 */
export async function startTrainerWorkout(writeAndWait) {
  const result = await writeAndWait(
    new Uint8Array([OP_START_RESUME]),
    OP_START_RESUME
  );
  return result.success;
}

/**
 * Stop or pause workout
 * @param {Function} writeAndWait - Write function from setupTrainerControl
 * @param {boolean} [stop=true] - true to stop, false to pause
 * @returns {Promise<boolean>}
 */
export async function stopTrainerWorkout(writeAndWait, stop = true) {
  const result = await writeAndWait(
    new Uint8Array([OP_STOP_PAUSE, stop ? 0x01 : 0x02]),
    OP_STOP_PAUSE
  );
  return result.success;
}

/**
 * Reset trainer
 * @param {Function} writeAndWait - Write function from setupTrainerControl
 * @returns {Promise<boolean>}
 */
export async function resetTrainer(writeAndWait) {
  const result = await writeAndWait(
    new Uint8Array([OP_RESET]),
    OP_RESET
  );
  return result.success;
}
