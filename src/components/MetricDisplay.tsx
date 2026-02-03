interface MetricDisplayProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  formatter?: (value: number) => string | number;
}

export function MetricDisplay({ label, value, unit, formatter }: MetricDisplayProps) {
  const displayValue = value !== null && value !== undefined
    ? (formatter ? formatter(value) : value)
    : '--';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 dark:bg-gray-800 light:bg-white rounded-2xl shadow-lg">
      <span className="text-gray-400 dark:text-gray-400 text-sm uppercase tracking-wider mb-2">
        {label}
      </span>
      <span className="text-6xl md:text-7xl lg:text-8xl font-bold tabular-nums">
        {displayValue}
      </span>
      <span className="text-gray-400 dark:text-gray-400 text-lg mt-2">
        {unit}
      </span>
    </div>
  );
}
