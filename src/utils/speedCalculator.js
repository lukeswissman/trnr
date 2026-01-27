/**
 * Calculate cycling speed from power output using physics model.
 *
 * Power = (F_rolling + F_gravity + F_drag) × velocity
 *
 * For flat ground (slope = 0):
 * Power = Crr × g × W × v + 0.5 × CdA × ρ × v³
 *
 * This is a cubic equation solved using Newton-Raphson iteration.
 */

// Physical constants
const G = 9.8067; // gravitational acceleration (m/s²)
const AIR_DENSITY = 1.225; // kg/m³ at sea level, 15°C

// Default cycling parameters
const DEFAULT_CRR = 0.004; // rolling resistance coefficient (road tire on trainer)
const DEFAULT_CDA = 0.32; // drag coefficient × frontal area (m²) - hoods position

/**
 * Calculate speed from power and total weight.
 *
 * @param {number} power - Power output in watts
 * @param {number} totalWeight - Combined rider + bike weight in kg
 * @param {number} slope - Grade percentage (default 0 for flat)
 * @param {Object} options - Optional parameters (crr, cda, airDensity)
 * @returns {number} Speed in km/h
 */
export function calculateSpeed(power, totalWeight, slope = 0, options = {}) {
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
  // F_gravity = G × sin(slope) × W
  // F_rolling = G × cos(slope) × W × Crr
  // F_drag = 0.5 × CdA × ρ × v²
  //
  // Power = (F_gravity + F_rolling + F_drag) × v
  // Power = G × W × (sin(slope) + Crr × cos(slope)) × v + 0.5 × CdA × ρ × v³

  const linearCoeff = G * totalWeight * (sinSlope + crr * cosSlope);
  const cubicCoeff = 0.5 * cda * rho;

  // Solve: cubicCoeff × v³ + linearCoeff × v - power = 0
  // Using Newton-Raphson: v_new = v - f(v) / f'(v)
  // f(v) = cubicCoeff × v³ + linearCoeff × v - power
  // f'(v) = 3 × cubicCoeff × v² + linearCoeff

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
