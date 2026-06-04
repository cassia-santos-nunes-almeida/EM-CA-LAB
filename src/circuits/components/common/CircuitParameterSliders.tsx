import { RotateCcw } from 'lucide-react';
import { RCritMarker, DurationControl } from '@circuits/components/common/CircuitCharts';
import type { CircuitType } from '@circuits/types/circuit';

interface SliderProps {
  R: number;
  L: number;
  C: number;
  onR: (v: number) => void;
  onL: (v: number) => void;
  onC: (v: number) => void;
  /** Which components to show sliders for. Default: determined by circuitType. */
  circuitType?: CircuitType;
  /** Source voltage slider (optional). */
  voltage?: { value: number; onChange: (v: number) => void };
  /** Duration control (optional). */
  duration?: {
    effectiveDuration: number;
    autoDuration: boolean;
    duration: number;
    onAutoDurationChange: (v: boolean) => void;
    onDurationChange: (v: number) => void;
  };
  /** Reset callback. */
  onReset?: () => void;
  /** Title for the section. Default: "Configuration". */
  title?: string;
  /** Show R_crit marker on R slider (for RLC circuits). */
  rCrit?: number | null;
}

export function CircuitParameterSliders({
  R, L, C, onR, onL, onC,
  circuitType = 'RLC',
  voltage,
  duration,
  onReset,
  title = 'Configuration',
  rCrit,
}: SliderProps) {
  const showL = circuitType === 'RL' || circuitType === 'RLC';
  const showC = circuitType === 'RC' || circuitType === 'RLC';
  const rCritPercent = rCrit != null ? Math.min(100, Math.max(0, (rCrit / 10000) * 100)) : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* R slider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Resistance (R): <span className="text-engineering-blue-700 dark:text-engineering-blue-400 font-semibold">{R >= 1000 ? `${(R/1000).toFixed(1)} k\u03A9` : `${R.toFixed(0)} \u03A9`}</span>
          </label>
          <div className="relative">
            <input type="range" min="1" max="10000" step="1" value={R} onChange={(e) => onR(parseFloat(e.target.value))} className="w-full accent-red-500" />
            {rCritPercent !== null && rCrit != null && (
              <RCritMarker rCrit={rCrit} rCritPercent={rCritPercent} />
            )}
          </div>
          <div className={`flex justify-between text-xs text-slate-400 dark:text-slate-500 ${rCritPercent !== null ? 'mt-5' : 'mt-0.5'}`}>
            <span>1 &#937;</span><span>10 k&#937;</span>
          </div>
        </div>

        {/* L slider */}
        {showL && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Inductance (L): <span className="text-engineering-blue-700 dark:text-engineering-blue-400 font-semibold">{(L * 1000).toFixed(1)} mH</span>
            </label>
            <input type="range" min="1" max="1000" step="1" value={L * 1000} onChange={(e) => onL(parseFloat(e.target.value) / 1000)} className="w-full accent-purple-500" />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-0.5"><span>1 mH</span><span>1 H</span></div>
          </div>
        )}

        {/* C slider */}
        {showC && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Capacitance (C): <span className="text-engineering-blue-700 dark:text-engineering-blue-400 font-semibold">{(C * 1e6).toFixed(1)} &#181;F</span>
            </label>
            <input type="range" min="1" max="1000" step="1" value={C * 1e6} onChange={(e) => onC(parseFloat(e.target.value) / 1e6)} className="w-full accent-green-500" />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-0.5"><span>1 &#181;F</span><span>1 mF</span></div>
          </div>
        )}

        {/* Voltage slider */}
        {voltage && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Source Voltage: <span className="text-engineering-blue-700 dark:text-engineering-blue-400 font-semibold">{voltage.value.toFixed(1)} V</span>
            </label>
            <input type="range" min="1" max="50" step="0.5" value={voltage.value} onChange={(e) => voltage.onChange(parseFloat(e.target.value))} className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-0.5"><span>1 V</span><span>50 V</span></div>
          </div>
        )}

        {/* Duration control */}
        {duration && (
          <DurationControl
            effectiveDuration={duration.effectiveDuration}
            autoDuration={duration.autoDuration}
            duration={duration.duration}
            onAutoDurationChange={duration.onAutoDurationChange}
            onDurationChange={duration.onDurationChange}
          />
        )}
      </div>
    </div>
  );
}
