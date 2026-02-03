interface TargetDisplayProps {
  targetPower: number;
  actualPower: number | null;
}

export function TargetDisplay({ targetPower, actualPower }: TargetDisplayProps) {
  const diff = actualPower != null ? actualPower - targetPower : null;

  return (
    <div className="text-center">
      <div className="text-gray-400 text-sm mb-1">Target Power</div>
      <div className="text-6xl font-bold tabular-nums">{targetPower}</div>
      <div className="text-gray-400 text-sm">watts</div>

      {actualPower != null && diff != null && (
        <div className="mt-4">
          <div className="text-gray-400 text-sm mb-1">Actual</div>
          <div className="text-3xl font-semibold tabular-nums">
            {Math.round(actualPower)}
            <span
              className={`ml-2 text-lg ${
                diff > 10 ? 'text-red-400' : diff < -10 ? 'text-blue-400' : 'text-green-400'
              }`}
            >
              {diff > 0 ? '+' : ''}{Math.round(diff)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
