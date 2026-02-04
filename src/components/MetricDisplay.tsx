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
    <div className="flex flex-col items-center justify-center p-8 bg-synth-purple/10 backdrop-blur-md rounded-3xl border border-synth-red/20 hover:border-synth-red/50 transition-all shadow-[0_0_15px_rgba(58,5,111,0.2)] group">
      <span className="text-synth-red/60 text-xs uppercase tracking-[0.2em] mb-3 font-black italic">
        {label}
      </span>
      <span className="text-6xl md:text-7xl lg:text-9xl font-black tabular-nums italic tracking-tighter text-white drop-shadow-[0_0_10px_rgba(197,2,2,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(197,2,2,0.6)] transition-all">
        {displayValue}
      </span>
      <span className="text-synth-purple/80 text-lg mt-3 font-bold italic lowercase tracking-widest">
        {unit}
      </span>
    </div>
  );
}
