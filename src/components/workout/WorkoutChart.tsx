import { useMemo, useId } from 'react';
import { flattenWorkout, calculateTotalDuration } from '../../utils/workoutUtils';
import { getZoneColor, ZONES } from '../../utils/zones';
import type { Workout, FlatStep } from '../../types/workout';

interface WorkoutChartProps {
  workout: Workout | null;
  height?: number;
  highlightTime?: number | null;
  actualPower?: number | null;
  ftp?: number;
  id?: string;
}

interface ChartPoint {
  time: number;
  power: number;
}

export function WorkoutChart({
  workout,
  height = 120,
  highlightTime = null,
  actualPower = null,
  ftp,
  id: providedId
}: WorkoutChartProps) {
  const generatedId = useId();
  const id = providedId || generatedId.replace(/:/g, '');
  const { points, maxPower, totalDuration, plan } = useMemo(() => {
    if (!workout || workout.segments.length === 0) {
      return { points: [] as ChartPoint[], maxPower: 200, totalDuration: 0, plan: [] as FlatStep[] };
    }

    const flatPlan = flattenWorkout(workout);
    const duration = calculateTotalDuration(workout.segments);

    if (flatPlan.length === 0) {
      return { points: [] as ChartPoint[], maxPower: 200, totalDuration: 0, plan: [] as FlatStep[] };
    }

    // Find max power for scaling
    let max = 100;
    for (const step of flatPlan) {
      if (step.type === 'block') {
        max = Math.max(max, step.power);
      } else {
        max = Math.max(max, step.startPower!, step.endPower!);
      }
    }
    max = Math.ceil(max / 50) * 50;

    // Generate SVG path points
    const pts: ChartPoint[] = [];
    for (const step of flatPlan) {
      if (step.type === 'block') {
        pts.push({ time: step.startTime, power: step.power });
        pts.push({ time: step.endTime, power: step.power });
      } else {
        pts.push({ time: step.startTime, power: step.startPower! });
        pts.push({ time: step.endTime, power: step.endPower! });
      }
    }

    return { points: pts, maxPower: max, totalDuration: duration, plan: flatPlan };
  }, [workout]);

  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const chartWidth = 400;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (time: number) => padding.left + (time / totalDuration) * innerWidth;
  const yScale = (power: number) => padding.top + innerHeight - (power / maxPower) * innerHeight;

  const useZoneColors = ftp != null && ftp > 0;

  // Build per-step zone-colored fill paths
  const zoneFills = useMemo(() => {
    if (!useZoneColors) return [];

    return plan.map((step) => {
      const x1 = xScale(step.startTime);
      const x2 = xScale(step.endTime);
      const baseY = yScale(0);

      if (step.type === 'block') {
        const topY = yScale(step.power);
        const color = getZoneColor(step.power, ftp!);
        const d = `M ${x1} ${topY} L ${x2} ${topY} L ${x2} ${baseY} L ${x1} ${baseY} Z`;
        return { d, color, key: `${step.startTime}-block` };
      } else {
        // Ramp: create a trapezoid
        const startY = yScale(step.startPower!);
        const endY = yScale(step.endPower!);
        const avgPower = (step.startPower! + step.endPower!) / 2;
        const color = getZoneColor(avgPower, ftp!);
        const d = `M ${x1} ${startY} L ${x2} ${endY} L ${x2} ${baseY} L ${x1} ${baseY} Z`;
        return { d, color, key: `${step.startTime}-ramp` };
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, ftp, totalDuration, maxPower]);

  // Zone boundary lines (horizontal)
  const zoneBands = useMemo(() => {
    if (!useZoneColors) return [];

    return ZONES
      .filter((z) => z.maxFtp !== Infinity && z.maxFtp * ftp! <= maxPower)
      .map((z) => ({
        power: Math.round(z.maxFtp * ftp!),
        y: yScale(z.maxFtp * ftp!),
        color: z.color,
        label: `Z${z.number}`,
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ftp, maxPower]);

  if (points.length === 0) {
    return (
      <div
        className="bg-gray-200 rounded-lg flex items-center justify-center text-gray-400"
        style={{ height }}
      >
        No segments
      </div>
    );
  }

  // Build top line path
  let pathD = `M ${xScale(points[0].time)} ${yScale(points[0].power)}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${xScale(points[i].time)} ${yScale(points[i].power)}`;
  }

  // Fallback area fill path (uniform blue, used when no FTP)
  const areaD = `${pathD} L ${xScale(totalDuration)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  // Y-axis labels
  const yTicks = [0, maxPower / 2, maxPower];

  // X-axis labels
  const xTicks: number[] = [];
  const step = totalDuration > 600 ? 300 : totalDuration > 120 ? 60 : 30;
  for (let t = 0; t <= totalDuration; t += step) {
    xTicks.push(t);
  }
  if (xTicks[xTicks.length - 1] !== totalDuration) {
    xTicks.push(totalDuration);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const getTargetPowerAtTime = (time: number) => {
    if (points.length === 0) return 0;
    let p1 = points[0];
    let p2 = points[0];

    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        p1 = points[i];
        p2 = points[i + 1];
        break;
      }
    }

    if (p1 === p2) return p1.power;
    const ratio = (time - p1.time) / (p2.time - p1.time);
    return p1.power + (p2.power - p1.power) * ratio;
  };

  const targetPower = highlightTime !== null ? getTargetPowerAtTime(highlightTime) : 0;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full bg-white rounded-xl shadow-inner border border-gray-200"
      style={{ height }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick) => (
        <line
          key={tick}
          x1={padding.left}
          y1={yScale(tick)}
          x2={chartWidth - padding.right}
          y2={yScale(tick)}
          stroke="#d1d5db"
          strokeDasharray="2,2"
        />
      ))}

      {/* Zone boundary lines */}
      {zoneBands.map((band) => (
        <g key={band.label}>
          <line
            x1={padding.left}
            y1={band.y}
            x2={chartWidth - padding.right}
            y2={band.y}
            stroke={band.color}
            strokeOpacity="0.2"
            strokeDasharray="4,4"
          />
          <text
            x={chartWidth - padding.right + 2}
            y={band.y + 3}
            fontSize="7"
            fill={band.color}
            fillOpacity="0.5"
          >
            {band.label}
          </text>
        </g>
      ))}

      {/* Area fill: zone-colored segments or uniform blue */}
      {useZoneColors ? (
        zoneFills.map((fill) => (
          <path key={fill.key} d={fill.d} fill={fill.color} fillOpacity="0.35" />
        ))
      ) : (
        <path d={areaD} fill={`url(#${id}-gradient)`} className="transition-all duration-300" />
      )}

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${id}-glow)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
      />

      {/* Y-axis labels */}
      {yTicks.map((tick) => (
        <text
          key={tick}
          x={padding.left - 5}
          y={yScale(tick) + 4}
          textAnchor="end"
          className="text-xs fill-gray-500"
          fontSize="10"
        >
          {tick}
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((tick) => (
        <text
          key={tick}
          x={xScale(tick)}
          y={chartHeight - 4}
          textAnchor="middle"
          className="text-xs fill-gray-500"
          fontSize="10"
        >
          {formatTime(tick)}
        </text>
      ))}

      {/* Current position marker */}
      {highlightTime !== null && highlightTime >= 0 && highlightTime <= totalDuration && (
        <g>
          <line
            x1={xScale(highlightTime)}
            y1={padding.top}
            x2={xScale(highlightTime)}
            y2={chartHeight - padding.bottom}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
          {/* Target Power Marker */}
          <circle
            cx={xScale(highlightTime)}
            cy={yScale(targetPower)}
            r="4"
            fill="#10b981"
            className="shadow-lg"
          />

          {/* Actual Power Marker (if available) */}
          {actualPower !== null && (
            <circle
              cx={xScale(highlightTime)}
              cy={yScale(actualPower)}
              r="6"
              fill="#fbbf24"
              className="animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]"
            />
          )}
        </g>
      )}
    </svg>
  );
}
