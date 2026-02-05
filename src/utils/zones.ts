import type { FlatStep } from '../types/workout';

export interface Zone {
  number: number;
  name: string;
  minFtp: number;   // lower bound as fraction of FTP
  maxFtp: number;   // upper bound as fraction of FTP
  color: string;    // hex color
}

export const ZONES: Zone[] = [
  { number: 1, name: 'Active Recovery', minFtp: 0,    maxFtp: 0.55, color: '#94a3b8' },
  { number: 2, name: 'Endurance',       minFtp: 0.56, maxFtp: 0.75, color: '#3b82f6' },
  { number: 3, name: 'Tempo',           minFtp: 0.76, maxFtp: 0.90, color: '#22c55e' },
  { number: 4, name: 'Threshold',       minFtp: 0.91, maxFtp: 1.05, color: '#eab308' },
  { number: 5, name: 'VO2max',          minFtp: 1.06, maxFtp: 1.20, color: '#f97316' },
  { number: 6, name: 'Anaerobic',       minFtp: 1.21, maxFtp: 1.50, color: '#ef4444' },
  { number: 7, name: 'Neuromuscular',   minFtp: 1.51, maxFtp: Infinity, color: '#a855f7' },
];

/** Default durations (seconds) for zone-based quick-add */
export const ZONE_DEFAULT_DURATIONS: Record<number, number> = {
  1: 300,   // 5 min recovery
  2: 600,   // 10 min endurance
  3: 480,   // 8 min tempo
  4: 300,   // 5 min threshold
  5: 180,   // 3 min VO2max
  6: 60,    // 1 min anaerobic
  7: 15,    // 15s neuromuscular
};

export function getZone(power: number, ftp: number): Zone {
  const ratio = power / ftp;
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (ratio >= ZONES[i].minFtp) {
      return ZONES[i];
    }
  }
  return ZONES[0];
}

export function getZoneColor(power: number, ftp: number): string {
  return getZone(power, ftp).color;
}

export function getZoneBounds(zoneNumber: number, ftp: number): { min: number; max: number } {
  const zone = ZONES.find((z) => z.number === zoneNumber) || ZONES[0];
  return {
    min: Math.round(zone.minFtp * ftp),
    max: zone.maxFtp === Infinity ? Infinity : Math.round(zone.maxFtp * ftp),
  };
}

export function getZoneMidpoint(zoneNumber: number, ftp: number): number {
  const zone = ZONES.find((z) => z.number === zoneNumber) || ZONES[0];
  // For Z7 (Infinity upper bound), use 160% FTP as midpoint
  const effectiveMax = zone.maxFtp === Infinity ? 1.60 : zone.maxFtp;
  return Math.round(((zone.minFtp + effectiveMax) / 2) * ftp);
}

export interface ZoneDistribution {
  zone: Zone;
  seconds: number;
  percentage: number;
}

export function calculateZoneDistribution(steps: FlatStep[], ftp: number): ZoneDistribution[] {
  const zoneTimes = new Map<number, number>();

  for (const step of steps) {
    if (step.type === 'block') {
      const zone = getZone(step.power, ftp);
      zoneTimes.set(zone.number, (zoneTimes.get(zone.number) || 0) + step.duration);
    } else {
      // Ramp: sample at 1-second intervals for accurate zone distribution
      const startPower = step.startPower ?? step.power;
      const endPower = step.endPower ?? step.power;
      for (let t = 0; t < step.duration; t++) {
        const progress = step.duration > 1 ? t / (step.duration - 1) : 0;
        const power = startPower + (endPower - startPower) * progress;
        const zone = getZone(power, ftp);
        zoneTimes.set(zone.number, (zoneTimes.get(zone.number) || 0) + 1);
      }
    }
  }

  const totalSeconds = Array.from(zoneTimes.values()).reduce((sum, s) => sum + s, 0);

  return ZONES
    .map((zone) => {
      const seconds = zoneTimes.get(zone.number) || 0;
      return {
        zone,
        seconds,
        percentage: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0,
      };
    })
    .filter((d) => d.seconds > 0);
}
