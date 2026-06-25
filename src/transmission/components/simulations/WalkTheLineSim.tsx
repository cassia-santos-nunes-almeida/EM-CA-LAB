import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { getSectionNumber } from '@shared/constants/curriculum';
import { ReadoutCard } from './ReadoutCard';
import {
  calculateComplexReflectionCoefficient,
  calculateInputImpedance,
  calculateVSWR,
  gammaToImpedance,
  rotateGamma,
} from '@transmission/utils/transmissionMath';

/** Props for the WalkTheLineSim component. */
interface WalkTheLineSimProps {
  /** Additional CSS class names for the outermost container. */
  className?: string;
}

/** The line's characteristic impedance — fixed to match the exam task. */
const Z0 = 50;

/** Strip-chart samples: 201 points across l/λ ∈ [0, 1]. */
const CHART_POINTS = 201;

/** |Z| beyond this is mapped to null so traces break at short/open singularities. */
const CHART_CLIP = 400;

/** Format a complex impedance as "26.9 + j11.9 Ω" (numerical dust snapped to 0). */
function formatComplexOhms(re: number, im: number): string {
  const reSafe = Math.abs(re) < 0.05 ? 0 : re;
  const imSafe = Math.abs(im) < 0.05 ? 0 : im;
  return `${reSafe.toFixed(1)} ${imSafe >= 0 ? '+' : '−'} j${Math.abs(imSafe).toFixed(1)} Ω`;
}

/**
 * Snap a tiny phase (numerical dust from full-lap rotations) to exactly 0°,
 * and fold the −180°/+180° seam to +180° so the readout matches the guided
 * challenge's "∠180°" at l = λ/4 (atan2 dust makes it ≈ −180° otherwise).
 */
function snapPhase(phaseDeg: number): number {
  if (Math.abs(phaseDeg) < 0.05) return 0;
  return phaseDeg <= -179.95 ? phaseDeg + 360 : phaseDeg;
}

/** SVG arrowhead polygon points for the tip at (toX, toY) coming from (fromX, fromY). */
function arrowheadPoints(fromX: number, fromY: number, toX: number, toY: number, size: number): string {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const a1 = angle - Math.PI / 6;
  const a2 = angle + Math.PI / 6;
  return [
    `${toX},${toY}`,
    `${toX - size * Math.cos(a1)},${toY - size * Math.sin(a1)}`,
    `${toX - size * Math.cos(a2)},${toY - size * Math.sin(a2)}`,
  ].join(' ');
}

/**
 * "Walk the Line" bench: drag a probe along a mismatched 50 Ω line and watch
 * Z_in, the electrical length, and the rotating Γ phasor respond. SVG + recharts
 * only (no canvas): a schematic with a movable probe cursor, a Γ-dial showing the
 * constant-|Γ| rotation, an R/X-vs-l strip chart, and four readout cards. All
 * physics goes through the exported transmissionMath utilities.
 */
export function WalkTheLineSim({ className }: WalkTheLineSimProps) {
  /** Observation distance from the load, in wavelengths (0 … 1λ). */
  const [lOverLambda, setLOverLambda] = useState(0);
  /** Load resistance in ohms (ignored while isOpen). */
  const [RL, setRL] = useState(100);
  /** Load reactance in ohms (ignored while isOpen). */
  const [XL, setXL] = useState(0);
  /** Open-circuit termination (Z_L = ∞ — not reachable by the RL slider). */
  const [isOpen, setIsOpen] = useState(false);

  /* ── Derived electrical values (all via transmissionMath exports) ── */
  const betaL = 2 * Math.PI * lOverLambda;
  const gammaL = isOpen
    ? { real: 1, imag: 0, magnitude: 1, phaseDeg: 0 }
    : calculateComplexReflectionCoefficient(RL, XL, Z0);
  const gammaIn = rotateGamma(gammaL.real, gammaL.imag, betaL);
  const zin = gammaToImpedance(gammaIn.real, gammaIn.imag, Z0);
  const vswr = calculateVSWR(gammaL.magnitude);

  /* ── Strip-chart data: R_in(l), X_in(l) over one wavelength ─────── */
  const chartData = useMemo(() => {
    const points: { l: number; R: number | null; X: number | null }[] = [];
    for (let i = 0; i < CHART_POINTS; i++) {
      const l = i / (CHART_POINTS - 1);
      const z = calculateInputImpedance(isOpen ? Infinity : RL, isOpen ? 0 : XL, Z0, 2 * Math.PI * l);
      const clip = (v: number): number | null =>
        Number.isFinite(v) && Math.abs(v) <= CHART_CLIP ? v : null;
      points.push({ l, R: clip(z.real), X: clip(z.imag) });
    }
    return points;
  }, [RL, XL, isOpen]);

  /* ── Schematic geometry (viewBox 400×120) ─────────────────────── */
  const probeX = 330 - 260 * lOverLambda; // load (l=0) right → generator (l=1λ) left
  const terminationLabel = isOpen
    ? 'OPEN'
    : RL === 0 && XL === 0
      ? 'SHORT'
      : RL === Z0 && XL === 0
        ? 'MATCHED'
        : `Z_L = ${RL} ${XL >= 0 ? '+' : '−'} j${Math.abs(XL)} Ω`;

  /* ── Γ-dial geometry (viewBox 220×220) ─────────────────────────── */
  const dialC = 110;
  const dialR = 86;
  const phiL = Math.atan2(gammaL.imag, gammaL.real); // ∠Γ_L in radians
  const mag = Math.min(gammaL.magnitude, 1);
  const dotL = { x: dialC + mag * dialR * Math.cos(phiL), y: dialC - mag * dialR * Math.sin(phiL) };
  const phiIn = Math.atan2(gammaIn.imag, gammaIn.real);
  const tip = { x: dialC + mag * dialR * Math.cos(phiIn), y: dialC - mag * dialR * Math.sin(phiIn) };
  // Swept arc Γ_L → Γ(l), clockwise on screen, drawn modulo one full lap.
  const sweep = 2 * betaL;
  const sweepMod = sweep % (2 * Math.PI);
  const showArc = lOverLambda > 0 && mag > 0.02 && sweepMod > 1e-6;
  const arcEndPhi = phiL - sweepMod;
  const arcStart = { x: dialC + mag * dialR * Math.cos(phiL), y: dialC - mag * dialR * Math.sin(phiL) };
  const arcEnd = { x: dialC + mag * dialR * Math.cos(arcEndPhi), y: dialC - mag * dialR * Math.sin(arcEndPhi) };
  const arcMidPhi = phiL - sweepMod / 2;
  const arcLabel = {
    x: dialC + (mag * dialR + 12) * Math.cos(arcMidPhi),
    y: dialC - (mag * dialR + 12) * Math.sin(arcMidPhi),
  };
  // A point slightly before the arc end gives the arrowhead its direction.
  const arcPrevPhi = arcEndPhi + Math.min(0.12, sweepMod / 2);
  const arcPrev = { x: dialC + mag * dialR * Math.cos(arcPrevPhi), y: dialC - mag * dialR * Math.sin(arcPrevPhi) };

  /* ── Control handlers ───────────────────────────────────────────── */
  const applyPreset = (r: number, x: number, open: boolean) => {
    setIsOpen(open);
    if (!open) { setRL(r); setXL(x); }
  };

  return (
    <div className={className}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-5 space-y-5">
          {/* 1 · Line schematic with the movable probe */}
          <svg
            viewBox="0 0 400 120"
            className="w-full h-auto"
            role="img"
            aria-label="Transmission line with movable observation probe"
          >
            {/* Generator box */}
            <rect x="10" y="40" width="60" height="40" rx="4" className="fill-slate-100 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
            <text x="40" y="65" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="13" fontFamily="ui-monospace, monospace">GEN ~</text>
            {/* Load box */}
            <rect x="330" y="40" width="60" height="40" rx="4" className="fill-slate-100 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
            <text x="360" y="64" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="11" fontFamily="ui-monospace, monospace">LOAD</text>
            <text x="360" y="100" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300" fontSize="9" fontFamily="ui-monospace, monospace">{terminationLabel}</text>
            {/* Two-conductor line */}
            <line x1="70" y1="48" x2="330" y2="48" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2" />
            <line x1="70" y1="72" x2="330" y2="72" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2" />
            <text x="200" y="92" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontFamily="ui-monospace, monospace">Z₀ = 50 Ω (fixed)</text>
            {/* Probe cursor */}
            <line x1={probeX} y1="22" x2={probeX} y2="95" strokeDasharray="5 3" className="stroke-engineering-blue-600 dark:stroke-engineering-blue-400" strokeWidth="2" />
            <text x={probeX} y="14" textAnchor="middle" className="fill-engineering-blue-700 dark:fill-engineering-blue-400" fontSize="10" fontFamily="ui-monospace, monospace">
              l = {lOverLambda.toFixed(3)} λ
            </text>
          </svg>

          {/* 2 · Γ-dial: rotation at constant |Γ| (deliberately NOT a Smith chart) */}
          <div className="flex flex-col items-center">
            <svg
              viewBox="0 0 220 220"
              className="w-full max-w-[220px] h-auto"
              role="img"
              aria-label={`Gamma phasor: magnitude ${gammaIn.magnitude.toFixed(3)}, phase ${snapPhase(gammaIn.phaseDeg).toFixed(1)} degrees at the probe`}
            >
              {/* Unit circle + real axis */}
              <circle cx={dialC} cy={dialC} r={dialR} className="fill-none stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
              <line x1={dialC - dialR} y1={dialC} x2={dialC + dialR} y2={dialC} className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1" />
              <text x={dialC - dialR} y={dialC + 12} textAnchor="start" className="fill-slate-500 dark:fill-slate-400" fontSize="8">Short (Γ=−1)</text>
              <text x={dialC} y={dialC + 12} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="8">Matched</text>
              <text x={dialC + dialR} y={dialC + 12} textAnchor="end" className="fill-slate-500 dark:fill-slate-400" fontSize="8">Open (Γ=+1)</text>

              {mag > 0.02 && (
                <>
                  {/* Constant-|Γ| circle */}
                  <circle cx={dialC} cy={dialC} r={mag * dialR} strokeDasharray="6 4" className="fill-none stroke-engineering-blue-400/60 dark:stroke-engineering-blue-500/60" strokeWidth="1.5" />
                  {/* Real-axis crossings: Z purely real here (voltage max / min) */}
                  <line x1={dialC + mag * dialR} y1={dialC - 5} x2={dialC + mag * dialR} y2={dialC + 5} className="stroke-amber-500" strokeWidth="2" />
                  <line x1={dialC - mag * dialR} y1={dialC - 5} x2={dialC - mag * dialR} y2={dialC + 5} className="stroke-amber-500" strokeWidth="2" />
                  <text x={dialC} y={214} textAnchor="middle" className="fill-amber-600 dark:fill-amber-400" fontSize="8">
                    Z purely real here — voltage max / min
                  </text>

                  {/* Swept arc Γ_L → Γ(l), clockwise */}
                  {showArc && (
                    <>
                      <path
                        d={`M ${arcStart.x} ${arcStart.y} A ${mag * dialR} ${mag * dialR} 0 ${sweepMod > Math.PI ? 1 : 0} 1 ${arcEnd.x} ${arcEnd.y}`}
                        className="fill-none stroke-amber-500"
                        strokeWidth="2"
                      />
                      <polygon points={arrowheadPoints(arcPrev.x, arcPrev.y, arcEnd.x, arcEnd.y, 7)} className="fill-amber-500" />
                      <text x={arcLabel.x} y={arcLabel.y} textAnchor="middle" className="fill-amber-600 dark:fill-amber-400" fontSize="9" fontFamily="ui-monospace, monospace">−2βl</text>
                    </>
                  )}

                  {/* Γ_L dot */}
                  <circle cx={dotL.x} cy={dotL.y} r="4" className="fill-slate-500 dark:fill-slate-400" />
                  <text x={dotL.x + 7} y={dotL.y - 5} className="fill-slate-600 dark:fill-slate-300" fontSize="9" fontFamily="ui-monospace, monospace">Γ_L</text>
                </>
              )}

              {/* Γ(l) phasor arrow */}
              <line x1={dialC} y1={dialC} x2={tip.x} y2={tip.y} className="stroke-engineering-blue-600 dark:stroke-engineering-blue-400" strokeWidth="2.5" />
              {mag > 0.05 && (
                <polygon points={arrowheadPoints(dialC, dialC, tip.x, tip.y, 9)} className="fill-engineering-blue-600 dark:fill-engineering-blue-400" />
              )}
              <circle cx={dialC} cy={dialC} r="2.5" className="fill-slate-400 dark:fill-slate-500" />
            </svg>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-1">
              Rotation at constant |Γ| — exactly what the Smith chart in Section{' '}
              {getSectionNumber('transmission-lines')} does.{' '}
              <Link to="/transmission-lines#smith-chart" className="text-engineering-blue-700 dark:text-engineering-blue-400 hover:underline">
                See it on the full chart →
              </Link>
            </p>
          </div>

          {/* 3 · Strip chart: R_in / X_in vs distance from the load */}
          <div role="img" aria-label="Input resistance and reactance versus distance from the load">
            <div className="flex items-center gap-4 mb-1">
              <span className="text-[10px] font-mono text-engineering-blue-700 dark:text-engineering-blue-400">— R_in(l)</span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">- - X_in(l)</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-auto">Ω vs l/λ</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis
                  dataKey="l"
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={42} />
                <ReferenceLine y={0} stroke="rgba(148,163,184,0.5)" />
                <ReferenceLine x={lOverLambda} stroke="#2563eb" strokeDasharray="5 3" />
                <Line type="monotone" dataKey="R" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="X" stroke="#64748b" strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 · Controls */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-5">
          <div className="block space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="walkline-dist-label">
              Distance from load l = {lOverLambda.toFixed(3)} λ (βl = {(360 * lOverLambda).toFixed(1)}°)
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={lOverLambda}
              onChange={(e) => setLOverLambda(parseFloat(e.target.value))}
              className="w-full accent-engineering-blue-600"
              aria-labelledby="walkline-dist-label"
              aria-valuetext={`${lOverLambda.toFixed(3)} wavelengths from the load, electrical length ${(360 * lOverLambda).toFixed(0)} degrees`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="walkline-rl-label">
                {isOpen ? 'R_L = ∞ (open)' : `R_L = ${RL} Ω`}
              </span>
              <input
                type="range"
                min={0}
                max={500}
                step={1}
                value={RL}
                onChange={(e) => { setIsOpen(false); setRL(parseInt(e.target.value, 10)); }}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="walkline-rl-label"
              />
            </div>
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="walkline-xl-label">
                {isOpen ? 'X_L = — (open)' : `X_L = ${XL} Ω`}
              </span>
              <input
                type="range"
                min={-500}
                max={500}
                step={1}
                value={XL}
                onChange={(e) => { setIsOpen(false); setXL(parseInt(e.target.value, 10)); }}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="walkline-xl-label"
              />
            </div>
          </div>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Match (50 Ω)', r: 50, x: 0, open: false },
              { label: 'Exam load (100 Ω)', r: 100, x: 0, open: false },
              { label: 'Short (0 Ω)', r: 0, x: 0, open: false },
              { label: 'Open (∞)', r: RL, x: XL, open: true },
            ].map((preset) => {
              const pressed = preset.open
                ? isOpen
                : !isOpen && RL === preset.r && XL === preset.x;
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => applyPreset(preset.r, preset.x, preset.open)}
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

          {/* 5 · Readouts */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadoutCard
              label="Electrical length βl"
              value={`${(360 * lOverLambda).toFixed(1)}° · ${lOverLambda.toFixed(3)} λ`}
            />
            <ReadoutCard
              label="Z_in"
              value={Number.isFinite(zin.real) ? formatComplexOhms(zin.real, zin.imag) : '→ ∞ (open)'}
            />
            <ReadoutCard
              label="Γ(l)"
              value={`${gammaIn.magnitude.toFixed(3)} ∠ ${snapPhase(gammaIn.phaseDeg).toFixed(1)}°`}
            />
            <ReadoutCard
              label="VSWR (constant along line)"
              value={Number.isFinite(vswr) ? vswr.toFixed(2) : '∞'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper sub-component (per-sim duplication is the house convention) ── */

