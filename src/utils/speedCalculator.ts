/**
 * Calculate cycling speed from power output using physics model.
 *
 * Power = (F_rolling + F_gravity + F_drag) x velocity
 *
 * For flat ground (slope = 0):
 * Power = Crr x g x W x v + 0.5 x CdA x rho x v^3
 *
 * This is a cubic equation solved using Newton-Raphson iteration.
 */

// Physical constants
const G = 9.8067; // gravitational acceleration (m/s^2)
const AIR_DENSITY = 1.225; // kg/m^3 at sea level, 15C

// Default cycling parameters
const DEFAULT_CRR = 0.004; // rolling resistance coefficient (road tire on trainer)
const DEFAULT_CDA = 0.32; // drag coefficient x frontal area (m^2) - hoods position

export interface SpeedOptions {
  crr?: number;
  cda?: number;
  airDensity?: number;
}

/**
 * Calculate speed from power and total weight.
 */
export function calculateSpeed(
  power: number,
  totalWeight: number,
  slope: number = 0,
  options: SpeedOptions = {}
): number {
  if (power <= 0 || totalWeight <= 0) {
    return 0;
  }

  const crr = options.crr ?? DEFAULT_CRR;
  const cda = options.cda ?? DEFAULT_CDA;
  const rho = options.airDensity ?? AIR_DENSITY;

  // Convert slope percentage to radians
  const slopeRad = Math.atan(slope / 100);
  const sinSlope = Math.sin(slopeRad);
  const cosSlope = Math.cos(slopeRad);

  // Force coefficients
  // F_gravity = G x sin(slope) x W
  // F_rolling = G x cos(slope) x W x Crr
  // F_drag = 0.5 x CdA x rho x v^2
  //
  // Power = (F_gravity + F_rolling + F_drag) x v
  // Power = G x W x (sin(slope) + Crr x cos(slope)) x v + 0.5 x CdA x rho x v^3

  const linearCoeff = G * totalWeight * (sinSlope + crr * cosSlope);
  const cubicCoeff = 0.5 * cda * rho;

  // Solve: cubicCoeff x v^3 + linearCoeff x v - power = 0
  // Using Newton-Raphson: v_new = v - f(v) / f'(v)
  // f(v) = cubicCoeff x v^3 + linearCoeff x v - power
  // f'(v) = 3 x cubicCoeff x v^2 + linearCoeff

  // Initial guess based on flat ground approximation
  let v = Math.cbrt(power / cubicCoeff) * 0.8;

  // Newton-Raphson iteration
  for (let i = 0; i < 20; i++) {
    const f = cubicCoeff * v * v * v + linearCoeff * v - power;
    const fPrime = 3 * cubicCoeff * v * v + linearCoeff;

    if (Math.abs(fPrime) < 1e-10) break;

    const vNew = v - f / fPrime;

    if (Math.abs(vNew - v) < 1e-6) {
      v = vNew;
      break;
    }

    v = Math.max(0, vNew); // Ensure non-negative
  }

  // Convert m/s to km/h
  return v * 3.6;
}
