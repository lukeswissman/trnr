import type { LiveData } from '../types/bluetooth';
import { calculateSpeed } from '../utils/speedCalculator';

const TICK_MS = 250; // ~4Hz update rate
const TICK_S = TICK_MS / 1000;
const TOTAL_WEIGHT = 80; // kg (rider + bike)

// Power smoothing
const POWER_TIME_CONSTANT = 2; // seconds
const POWER_ALPHA = 1 - Math.exp(-TICK_S / POWER_TIME_CONSTANT);
const POWER_NOISE_STDDEV = 5; // watts

// HR model
const HR_BASELINE = 70;
const HR_POWER_SCALE = 0.5;
const HR_MAX = 190;
const HR_TIME_CONSTANT = 15; // seconds — physiological lag
const HR_ALPHA = 1 - Math.exp(-TICK_S / HR_TIME_CONSTANT);

// Cadence model
const CADENCE_BASELINE = 90;
const CADENCE_MIN = 70;
const CADENCE_MAX = 110;
const CADENCE_WALK_STDDEV = 1; // rpm per tick

// Idle defaults (no ERG target set)
const IDLE_POWER = 75;

function gaussianRandom(): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export class DeviceSimulator {
  private targetPower = IDLE_POWER;
  private currentPower = IDLE_POWER;
  private currentHR = HR_BASELINE;
  private currentCadence = CADENCE_BASELINE;
  private distance = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(onData: (data: LiveData) => void): void {
    this.stop();

    this.intervalId = setInterval(() => {
      // Power: exponential smoothing toward target + noise
      this.currentPower +=
        POWER_ALPHA * (this.targetPower - this.currentPower);
      const noisyPower = Math.max(
        0,
        Math.round(this.currentPower + gaussianRandom() * POWER_NOISE_STDDEV)
      );

      // HR: lagged response to current power output
      const targetHR = Math.min(
        HR_MAX,
        HR_BASELINE + this.currentPower * HR_POWER_SCALE
      );
      this.currentHR += HR_ALPHA * (targetHR - this.currentHR);
      const heartRate = Math.round(this.currentHR);

      // Cadence: random walk bounded 70-110
      this.currentCadence += gaussianRandom() * CADENCE_WALK_STDDEV;
      this.currentCadence = Math.max(
        CADENCE_MIN,
        Math.min(CADENCE_MAX, this.currentCadence)
      );
      const cadence = Math.round(this.currentCadence);

      // Speed from power (km/h)
      const speed = calculateSpeed(noisyPower, TOTAL_WEIGHT);

      // Distance in meters, accumulated
      this.distance += (speed / 3.6) * TICK_S;

      onData({
        power: noisyPower,
        speed,
        cadence,
        distance: this.distance,
        heartRate,
      });
    }, TICK_MS);
  }

  setTargetPower(watts: number): void {
    this.targetPower = watts;
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.targetPower = IDLE_POWER;
    this.currentPower = IDLE_POWER;
    this.currentHR = HR_BASELINE;
    this.currentCadence = CADENCE_BASELINE;
    this.distance = 0;
  }
}
