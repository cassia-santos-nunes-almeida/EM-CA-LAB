import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import {
  calculateDCDivider,
  switchedRCTau,
  switchedRCCurrentJump,
  switchedFirstOrder,
} from '@circuits/utils/circuitSolver';
import { useThemeStore } from '@shared/store/progressStore';

/** Props for the SwitchedRCSim component. */
interface SwitchedRCSimProps {
  /** Additional CSS class names for the outermost container. */
  className?: string;
}

/** One strip-chart sample: time in ms, v_C in volts, i_C in milliamps. */
interface ChartPoint {
  time: number;
  v: number;
  i: number;
}

/** Fixed pre-switch divider resistors (printed, not adjustable). */
const R1_OHMS = 4000;
const R2_OHMS = 8000;

/** Full-state presets; the worked example is the bench default. */
const PRESETS = [
  { label: 'Worked example', V1: 12, V2: 20, R3: 2, Cuf: 25 },
  { label: 'Discharge (V₂ = 0)', V1: 12, V2: 0, R3: 2, Cuf: 25 },
  { label: 'No precharge (V₁ = 0)', V1: 0, V2: 20, R3: 2, Cuf: 25 },
] as const;

/* ── Schematic colour vocabulary (Tailwind classes) ─────────────── */
/** Pre-switch branch — greyed out for t ≥ 0. */
const OLD_STROKE = 'stroke-slate-300 dark:stroke-slate-600';
const OLD_TEXT = 'fill-slate-400 dark:fill-slate-500';
/** Post-switch branch — the live circuit. */
const NEW_STROKE = 'stroke-engineering-blue-600 dark:stroke-engineering-blue-400';
const NEW_TEXT = 'fill-engineering-blue-700 dark:fill-engineering-blue-400';
/** Shared elements (capacitor, ground rail, switch pole). */
const WIRE_STROKE = 'stroke-slate-500 dark:stroke-slate-400';
const WIRE_TEXT = 'fill-slate-600 dark:fill-slate-300';

/** Format a milliamp value with a proper minus sign, e.g. "6.00" / "−4.00". */
function formatMilliamps(mA: number): string {
  return `${mA < 0 ? '−' : ''}${Math.abs(mA).toFixed(2)}`;
}

/** Props for the ReadoutCard helper. */
interface ReadoutCardProps {
  /** Label describing the quantity. */
  label: string;
  /** Formatted value string. */
  value: string;
}

/** Small card displaying a computed quantity. */
function ReadoutCard({ label, value }: ReadoutCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
        {value}
      </p>
    </div>
  );
}

/**
 * "Throw the Switch" bench — the two-position RC switch circuit from the
 * Switched Circuits worked example.
 *
 * For t < 0 the capacitor sits in the V₁ – R₁ – (R₂ ∥ C) divider at DC steady
 * state; at t = 0 the switch moves to the V₂ – R₃ series branch. The strip
 * chart shows v_C(t) crossing the boundary without a kink while i_C(t) breaks
 * vertically — the two continuity facts of the section. All transient physics
 * goes through the tested circuitSolver exports (calculateDCDivider,
 * switchedRCTau, switchedRCCurrentJump, switchedFirstOrder); the component
 * adds only unit conversions.
 */
export function SwitchedRCSim({ className }: SwitchedRCSimProps) {
  const [V1, setV1] = useState<number>(12);
  const [V2, setV2] = useState<number>(20);
  const [R3, setR3] = useState<number>(2);
  const [Cuf, setCuf] = useState<number>(25);

  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#cbd5e1' : '#475569',
    legend: isDark ? '#e2e8f0' : '#334155',
  };

  /* ── Derived quantities + strip-chart samples ─────────────────── */
  const { data, v0, vInf, tauMs, iJumpmA, vAtTau } = useMemo(() => {
    const v0 = calculateDCDivider(V1, R1_OHMS, R2_OHMS);
    const vInf = V2;
    const tau = switchedRCTau(R3 * 1000, Cuf * 1e-6); // seconds
    const iJumpmA = switchedRCCurrentJump(V2, v0, R3 * 1000) * 1000;

    // 181 samples over t ∈ [−τ, 5τ]: 30 pre-switch, a doubled boundary pair
    // at 0⁻/0⁺ (clean vertical current break), then up to 5τ inclusive.
    const points: ChartPoint[] = [];
    for (let k = 0; k < 30; k++) {
      const t = -tau + (k * tau) / 30;
      points.push({ time: t * 1000, v: switchedFirstOrder(v0, vInf, tau, t), i: 0 });
    }
    // 0⁻ sample (t = −1 ns): still the old circuit, i_C = 0.
    points.push({ time: -1e-6, v: v0, i: 0 });
    // 0⁺ onward: i_C lands at the jump value and decays with the same τ.
    for (let k = 0; k < 150; k++) {
      const t = (k * 5 * tau) / 149;
      points.push({
        time: t * 1000,
        v: switchedFirstOrder(v0, vInf, tau, t),
        i: switchedFirstOrder(iJumpmA, 0, tau, t),
      });
    }

    return {
      data: points,
      v0,
      vInf,
      tauMs: tau * 1000,
      iJumpmA,
      vAtTau: switchedFirstOrder(v0, vInf, tau, tau),
    };
  }, [V1, V2, R3, Cuf]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setV1(preset.V1);
    setV2(preset.V2);
    setR3(preset.R3);
    setCuf(preset.Cuf);
  };

  return (
    <div className={className}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-5 space-y-4">
          {/* 1 · Two-position switch schematic */}
          <svg
            viewBox="0 0 480 140"
            className="w-full h-auto"
            role="img"
            aria-label="Two-position switch moving a capacitor from a charging divider to a new source"
          >
            {/* Ground rail */}
            <line x1="20" y1="112" x2="460" y2="112" className={WIRE_STROKE} strokeWidth="2" />

            {/* Pre-switch branch (position a) — greyed for t ≥ 0 */}
            <circle cx="40" cy="78" r="14" fill="none" className={OLD_STROKE} strokeWidth="2" />
            <text x="40" y="82" textAnchor="middle" className={OLD_TEXT} fontSize="11" fontFamily="ui-monospace, monospace">V₁</text>
            <text x="40" y="130" textAnchor="middle" className={OLD_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">V₁ = {V1.toFixed(1)} V</text>
            <line x1="40" y1="64" x2="40" y2="30" className={OLD_STROKE} strokeWidth="2" />
            <line x1="40" y1="92" x2="40" y2="112" className={OLD_STROKE} strokeWidth="2" />
            <line x1="40" y1="30" x2="70" y2="30" className={OLD_STROKE} strokeWidth="2" />
            <rect x="70" y="22" width="50" height="16" fill="none" className={OLD_STROKE} strokeWidth="2" />
            <text x="95" y="16" textAnchor="middle" className={OLD_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">R₁ 4 kΩ</text>
            <line x1="120" y1="30" x2="195" y2="30" className={OLD_STROKE} strokeWidth="2" />
            <rect x="142" y="55" width="16" height="40" fill="none" className={OLD_STROKE} strokeWidth="2" />
            <line x1="150" y1="30" x2="150" y2="55" className={OLD_STROKE} strokeWidth="2" />
            <line x1="150" y1="95" x2="150" y2="112" className={OLD_STROKE} strokeWidth="2" />
            <text x="164" y="78" textAnchor="start" className={OLD_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">R₂ 8 kΩ</text>

            {/* Switch contacts + arm (thrown to position b) */}
            <circle cx="195" cy="30" r="3" className="fill-slate-300 dark:fill-slate-600" />
            <text x="195" y="18" textAnchor="middle" className={OLD_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">a · t &lt; 0</text>
            <circle cx="285" cy="30" r="3" className="fill-engineering-blue-600 dark:fill-engineering-blue-400" />
            <text x="285" y="18" textAnchor="middle" className={NEW_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">b · t ≥ 0</text>
            <circle cx="240" cy="56" r="3" className="fill-slate-500 dark:fill-slate-400" />
            <line x1="240" y1="56" x2="285" y2="30" className={NEW_STROKE} strokeWidth="2.5" />

            {/* Post-switch branch (position b) — the live circuit */}
            <line x1="285" y1="30" x2="310" y2="30" className={NEW_STROKE} strokeWidth="2" />
            <rect x="310" y="22" width="50" height="16" fill="none" className={NEW_STROKE} strokeWidth="2" />
            <text x="335" y="16" textAnchor="middle" className={NEW_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">R₃ {R3.toFixed(1)} kΩ</text>
            <line x1="360" y1="30" x2="440" y2="30" className={NEW_STROKE} strokeWidth="2" />
            <circle cx="440" cy="78" r="14" fill="none" className={NEW_STROKE} strokeWidth="2" />
            <text x="440" y="82" textAnchor="middle" className={NEW_TEXT} fontSize="11" fontFamily="ui-monospace, monospace">V₂</text>
            <text x="440" y="130" textAnchor="middle" className={NEW_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">V₂ = {V2.toFixed(1)} V</text>
            <line x1="440" y1="30" x2="440" y2="64" className={NEW_STROKE} strokeWidth="2" />
            <line x1="440" y1="92" x2="440" y2="112" className={NEW_STROKE} strokeWidth="2" />

            {/* Capacitor (carries its state across the boundary) */}
            <line x1="240" y1="56" x2="240" y2="84" className={WIRE_STROKE} strokeWidth="2" />
            <line x1="224" y1="84" x2="256" y2="84" className={WIRE_STROKE} strokeWidth="2.5" />
            <line x1="224" y1="92" x2="256" y2="92" className={WIRE_STROKE} strokeWidth="2.5" />
            <line x1="240" y1="92" x2="240" y2="112" className={WIRE_STROKE} strokeWidth="2" />
            <text x="262" y="80" textAnchor="start" className={WIRE_TEXT} fontSize="9" fontFamily="ui-monospace, monospace">C = {Cuf} µF</text>
            <text x="262" y="102" textAnchor="start" className={NEW_TEXT} fontSize="10" fontFamily="ui-monospace, monospace">v_C(0⁺) = {v0.toFixed(2)} V</text>
          </svg>

          {/* 2 · Strip chart: v_C continuous, i_C breaking at t = 0 */}
          <div
            role="img"
            aria-label="Capacitor voltage continuous across the switch; capacitor current jumping at t equals zero"
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 18, right: 6, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fontSize: 10, fill: chartColors.text }}
                  tickFormatter={(value: number) => `${parseFloat(value.toFixed(1))}`}
                  label={{ value: 'Time (ms)', position: 'insideBottom', offset: -6, fontSize: 11, fill: chartColors.text }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: chartColors.text }}
                  label={{ value: 'v_C (V)', angle: -90, position: 'insideLeft', offset: 8, fontSize: 11, fill: chartColors.text }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: chartColors.text }}
                  label={{ value: 'i_C (mA)', angle: 90, position: 'insideRight', offset: 8, fontSize: 11, fill: chartColors.text }}
                />
                <Legend wrapperStyle={{ color: chartColors.legend, fontSize: 11 }} />
                <ReferenceLine
                  yAxisId="left"
                  x={0}
                  stroke="#64748b"
                  strokeWidth={1.5}
                  label={{ value: 'SWITCH', position: 'top', fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                />
                <ReferenceLine yAxisId="left" y={vInf} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.5} />
                <ReferenceDot
                  yAxisId="left"
                  x={tauMs}
                  y={vAtTau}
                  r={4}
                  fill="#16a34a"
                  stroke="#ffffff"
                  label={{
                    value: '1 τ — 63.2 % of the gap',
                    position: vInf >= v0 ? 'bottom' : 'top',
                    fontSize: 10,
                    fill: '#16a34a',
                  }}
                />
                <Line
                  yAxisId="left"
                  type="linear"
                  dataKey="v"
                  name="v_C (V)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey="i"
                  name="i_C (mA)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 · Controls + 4 · Readouts */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="swrc-v1-label">
                V₁ (pre-switch source) = {V1.toFixed(1)} V
              </span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={V1}
                onChange={(e) => setV1(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="swrc-v1-label"
              />
            </div>
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="swrc-v2-label">
                V₂ (post-switch source) = {V2.toFixed(1)} V
              </span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={V2}
                onChange={(e) => setV2(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="swrc-v2-label"
              />
            </div>
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="swrc-r3-label">
                R₃ = {R3.toFixed(1)} kΩ
              </span>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={R3}
                onChange={(e) => setR3(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="swrc-r3-label"
              />
            </div>
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="swrc-c-label">
                C = {Cuf} µF
              </span>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={Cuf}
                onChange={(e) => setCuf(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="swrc-c-label"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Pre-switch divider: R₁ = 4 kΩ, R₂ = 8 kΩ (fixed)
          </p>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const pressed =
                V1 === preset.V1 && V2 === preset.V2 && R3 === preset.R3 && Cuf === preset.Cuf;
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    pressed
                      ? 'bg-engineering-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadoutCard label="v_C(0⁻) = v_C(0⁺)" value={`${v0.toFixed(2)} V`} />
            <ReadoutCard label="v_C(∞)" value={`${vInf.toFixed(1)} V`} />
            <ReadoutCard label="τ = R₃C" value={`${tauMs.toFixed(1)} ms`} />
            <ReadoutCard label="i_C across the switch" value={`0 → ${formatMilliamps(iJumpmA)} mA`} />
          </div>
        </div>
      </div>
    </div>
  );
}
