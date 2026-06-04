/**
 * Shared chart tooltip for time-domain response charts.
 * Used by both SDomainAnalysis and InteractiveLab.
 */
export function ResponseChartTooltip({ payload, label }: {
  payload?: Array<{ color?: string; name?: string; value?: string | number }>;
  label?: string | number;
}) {
  if (!payload || payload.length === 0) return null;
  return (
    <div className="bg-white dark:bg-slate-800 p-3 border border-slate-300 dark:border-slate-600 rounded shadow-lg">
      <p className="font-semibold text-slate-800 dark:text-slate-200">
        Time: {typeof label === 'string' ? parseFloat(label).toFixed(3) : Number(label).toFixed(3)} ms
      </p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="text-sm">
          {entry.name}: {parseFloat(entry.value as string).toFixed(3)} {entry.name === 'Voltage' ? 'V' : 'mA'}
        </p>
      ))}
    </div>
  );
}

/**
 * Critical resistance marker triangle shown on the R slider.
 * Displays R_crit value and position for RLC circuits.
 */
export function RCritMarker({ rCrit, rCritPercent }: { rCrit: number; rCritPercent: number }) {
  return (
    <div
      className="absolute top-full mt-0.5 -translate-x-1/2 pointer-events-none"
      style={{ left: `${rCritPercent}%` }}
    >
      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-500 mx-auto" />
      <span className="text-[10px] font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
        R<sub>crit</sub>={rCrit >= 1000 ? `${(rCrit / 1000).toFixed(1)}k` : rCrit.toFixed(0)}&Omega;
      </span>
    </div>
  );
}

/**
 * Duration slider with auto-duration (5*tau) checkbox.
 * Shared between SDomainAnalysis InteractiveTab and InteractiveLab.
 */
export function DurationControl({ effectiveDuration, autoDuration, duration, onAutoDurationChange, onDurationChange }: {
  effectiveDuration: number;
  autoDuration: boolean;
  duration: number;
  onAutoDurationChange: (auto: boolean) => void;
  onDurationChange: (duration: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Duration: <span className="text-engineering-blue-700 dark:text-engineering-blue-400 font-semibold">{(effectiveDuration * 1000).toFixed(1)} ms</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={autoDuration}
            onChange={(e) => onAutoDurationChange(e.target.checked)}
            className="w-3.5 h-3.5 accent-engineering-blue-600"
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Auto (5&#964;)</span>
        </label>
      </div>
      <input
        type="range" min="1" max="100" step="1"
        value={autoDuration ? effectiveDuration * 1000 : duration * 1000}
        onChange={(e) => { onAutoDurationChange(false); onDurationChange(parseFloat(e.target.value) / 1000); }}
        className={`w-full ${autoDuration ? 'opacity-40' : ''}`}
        disabled={autoDuration}
      />
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-0.5"><span>1 ms</span><span>100 ms</span></div>
    </div>
  );
}

/**
 * Pole-zero tooltip for scatter chart.
 */
export function PoleTooltip({ payload }: {
  payload?: Array<{ payload: { name: string; x: number; y: number } }>;
}) {
  if (!payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 p-2 border border-slate-300 dark:border-slate-600 rounded shadow-lg text-xs text-slate-800 dark:text-slate-200">
      <p className="font-semibold">{data.name}</p>
      <p>Real: {data.x.toFixed(3)}</p>
      <p>Imag: {data.y.toFixed(3)}</p>
    </div>
  );
}
