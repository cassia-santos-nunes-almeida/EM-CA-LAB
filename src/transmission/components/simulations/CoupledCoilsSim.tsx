import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculateMutualInductance,
  calculateSecondaryVoltage,
  calculateActualSecondaryVoltage,
  calculateSecondaryCurrent,
  calculateReflectedImpedance,
} from '@transmission/utils/transmissionMath';
import { useCanvasSetup } from '@transmission/hooks/useCanvasSetup';
import { useAnimationFrame } from '@transmission/hooks/useAnimationFrame';

/** Props for the CoupledCoilsSim component. */
interface CoupledCoilsSimProps {
  /** Additional CSS class names for the outermost container. */
  className?: string;
}

/** Fixed circuit parameters used for computation. */
const L1 = 10e-3; // 10 mH
const L2 = 10e-3; // 10 mH
const VS = 120;    // 120 V source

/**
 * Interactive HTML5 Canvas simulation of coupled coils / transformers.
 *
 * Students adjust the coupling coefficient k, turns counts N1 and N2, and
 * load impedance |ZL| via sliders. The component computes mutual inductance,
 * secondary voltage, secondary current, and reflected impedance in real time,
 * and renders an animated canvas with two coils whose magnetic field lines
 * strengthen as k approaches 1.
 */
export function CoupledCoilsSim({ className }: CoupledCoilsSimProps) {
  /* ── Slider state ─────────────────────────────────────────────── */

  /** Coupling coefficient (0 to 1). */
  const [k, setK] = useState(0.5);
  /** Primary turns count (integer, 1 to 100). */
  const [N1, setN1] = useState(50);
  /** Secondary turns count (integer, 1 to 100). */
  const [N2, setN2] = useState(50);
  /** Load impedance magnitude in ohms (1 to 500). */
  const [ZL, setZL] = useState(100);

  /* ── Derived electrical values ────────────────────────────────── */

  const M = calculateMutualInductance(k, L1, L2);
  const V2ideal = calculateSecondaryVoltage(VS, N1, N2);
  const V2actual = calculateActualSecondaryVoltage(VS, N1, N2, k);
  const Zref = calculateReflectedImpedance(N1, N2, ZL);
  const I1 = Zref === 0 ? 0 : VS / Zref;
  const I2 = calculateSecondaryCurrent(I1, N1, N2);

  /* ── Canvas refs & animation ──────────────────────────────────── */

  const { canvasRef, prepareFrame } = useCanvasSetup();
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  /** Latest slider params, read by the render loop so it need not be recreated on each change. */
  const paramsRef = useRef({ k, N1, N2 });

  /** Detect dark mode by checking the root element class list. */
  const isDark = (): boolean =>
    document.documentElement.classList.contains('dark');

  /** Draw a single coil as a series of half-ellipses (solenoid style). */
  const drawCoil = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      turns: number,
      coilHeight: number,
      coilWidth: number,
      dark: boolean,
    ) => {
      const displayTurns = Math.max(4, Math.min(turns, 30));
      const spacing = coilHeight / displayTurns;
      const startY = cy - (coilHeight / 2);

      ctx.strokeStyle = dark ? '#93c5fd' : '#1e40af';
      ctx.lineWidth = 2;

      for (let i = 0; i < displayTurns; i++) {
        const y = startY + i * spacing;
        ctx.beginPath();
        ctx.ellipse(cx, y + spacing / 2, coilWidth / 2, spacing / 2, 0, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, y + spacing / 2, coilWidth / 2, spacing / 2, 0, Math.PI, 2 * Math.PI);
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Lead wires
      ctx.beginPath();
      ctx.moveTo(cx - coilWidth / 2, startY);
      ctx.lineTo(cx - coilWidth / 2, startY - 20);
      ctx.moveTo(cx - coilWidth / 2, startY + coilHeight);
      ctx.lineTo(cx - coilWidth / 2, startY + coilHeight + 20);
      ctx.stroke();

      // Dot convention marker at the top
      ctx.fillStyle = dark ? '#fbbf24' : '#d97706';
      ctx.beginPath();
      ctx.arc(cx - coilWidth / 2, startY - 8, 4, 0, 2 * Math.PI);
      ctx.fill();
    },
    [],
  );

  /** Draw animated magnetic field lines between the coils. */
  const drawFieldLines = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx1: number,
      cx2: number,
      cy: number,
      coilHeight: number,
      coupling: number,
      time: number,
      dark: boolean,
    ) => {
      const numLines = Math.max(1, Math.round(coupling * 8));
      const alpha = 0.15 + coupling * 0.6;
      const gap = cx2 - cx1;
      const lineSpacing = coilHeight / (numLines + 1);
      const startY = cy - coilHeight / 2;

      for (let i = 0; i < numLines; i++) {
        const y = startY + (i + 1) * lineSpacing;
        // Animate the curvature with time
        const animOffset = Math.sin(time * 2 + i * 0.7) * 6 * coupling;
        const cp1x = cx1 + gap * 0.3;
        const cp2x = cx1 + gap * 0.7;
        const cpY1 = y - 20 * coupling + animOffset;
        const cpY2 = y + 20 * coupling - animOffset;

        ctx.strokeStyle = dark
          ? `rgba(147, 197, 253, ${alpha})`
          : `rgba(37, 99, 235, ${alpha})`;
        ctx.lineWidth = 1.5 + coupling;

        // Top arc
        ctx.beginPath();
        ctx.moveTo(cx1, y);
        ctx.bezierCurveTo(cp1x, cpY1, cp2x, cpY1, cx2, y);
        ctx.stroke();

        // Bottom arc
        ctx.beginPath();
        ctx.moveTo(cx1, y);
        ctx.bezierCurveTo(cp1x, cpY2, cp2x, cpY2, cx2, y);
        ctx.stroke();
      }

      // Animated flux dots traveling along the field lines
      if (coupling > 0.05) {
        const dotCount = Math.round(coupling * 6);
        ctx.fillStyle = dark
          ? `rgba(251, 191, 36, ${0.3 + coupling * 0.5})`
          : `rgba(217, 119, 6, ${0.3 + coupling * 0.5})`;
        for (let d = 0; d < dotCount; d++) {
          const t = ((time * 0.8 + d / dotCount) % 1);
          const x = cx1 + t * gap;
          const y = cy + Math.sin(t * Math.PI) * 15 * coupling * Math.sin(time + d);
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    },
    [],
  );

  /** Render one frame; the loop is built once and always runs the latest closure. */
  useAnimationFrame(({ dt }) => {
    const frame = prepareFrame();
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;
    const dark = isDark();
    const { k, N1, N2 } = paramsRef.current;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = dark ? '#1e293b' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Layout positions
    const coilHeight = Math.min(h * 0.55, 160);
    const coilWidth = 50;
    const separation = Math.max(80, w * 0.22) * (1.3 - k * 0.5); // Coils move closer as k increases
    const cx1 = w / 2 - separation / 2;
    const cx2 = w / 2 + separation / 2;
    const cy = h / 2;

    // Draw field lines behind coils
    drawFieldLines(ctx, cx1, cx2, cy, coilHeight, k, timeRef.current, dark);

    // Draw coils
    drawCoil(ctx, cx1, cy, N1, coilHeight, coilWidth, dark);
    drawCoil(ctx, cx2, cy, N2, coilHeight, coilWidth, dark);

    // Labels
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? '#cbd5e1' : '#334155';
    ctx.fillText(`Primary (N₁ = ${N1})`, cx1, cy + coilHeight / 2 + 45);
    ctx.fillText(`Secondary (N₂ = ${N2})`, cx2, cy + coilHeight / 2 + 45);

    // Coupling indicator
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = dark ? '#fbbf24' : '#d97706';
    ctx.fillText(`k = ${k.toFixed(2)}`, w / 2, 22);

    // Core lines for tight coupling
    if (k > 0.8) {
      ctx.strokeStyle = dark ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.4)';
      ctx.lineWidth = 3;
      const coreX = w / 2;
      ctx.beginPath();
      ctx.moveTo(coreX - 2, cy - coilHeight / 2 - 10);
      ctx.lineTo(coreX - 2, cy + coilHeight / 2 + 10);
      ctx.moveTo(coreX + 2, cy - coilHeight / 2 - 10);
      ctx.lineTo(coreX + 2, cy + coilHeight / 2 + 10);
      ctx.stroke();
    }

    // Advance animation time
    timeRef.current += dt;
  });

  /** Keep the params ref in sync with the sliders (read by the render loop). */
  useEffect(() => {
    paramsRef.current = { k, N1, N2 };
  }, [k, N1, N2]);

  /* ── UI ───────────────────────────────────────────────────────── */

  return (
    <div className={className}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="w-full aspect-[2/1] min-h-[240px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            aria-label="Coupled coils simulation canvas showing two coils with animated magnetic field lines"
          />
        </div>

        {/* Controls + Readouts */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-5">
          {/* Sliders */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* k slider */}
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Coupling coefficient k = {k.toFixed(2)}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={k}
                onChange={(e) => setK(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
              />
            </label>

            {/* N1 slider */}
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Primary turns N₁ = {N1}
              </span>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={N1}
                onChange={(e) => setN1(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
              />
            </label>

            {/* N2 slider */}
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Secondary turns N₂ = {N2}
              </span>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={N2}
                onChange={(e) => setN2(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
              />
            </label>

            {/* ZL slider */}
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Load impedance |Z<sub>L</sub>| = {ZL} &Omega;
              </span>
              <input
                type="range"
                min={1}
                max={500}
                step={1}
                value={ZL}
                onChange={(e) => setZL(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
              />
            </label>
          </div>

          {/* Computed values */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ReadoutCard
              label="Mutual inductance M"
              value={`${(M * 1e3).toFixed(2)} mH`}
            />
            <ReadoutCard
              label="V₂ (ideal, k=1)"
              value={`${V2ideal.toFixed(1)} V`}
            />
            <ReadoutCard
              label="V₂ (actual)"
              value={`${V2actual.toFixed(1)} V`}
            />
            <ReadoutCard
              label="Secondary current I₂"
              value={`${I2.toFixed(3)} A`}
            />
            <ReadoutCard
              label="Reflected impedance Z_ref"
              value={isFinite(Zref) ? `${Zref.toFixed(1)} \u03A9` : '\u221E \u03A9'}
            />
          </div>

          {/* Coupling warning */}
          {k < 0.9 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 px-3 py-2">
              <span className="text-amber-600 dark:text-amber-400 text-sm mt-0.5">⚠</span>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>k = {k.toFixed(2)} &lt; 0.9</strong> — significant flux leakage.
                The actual secondary voltage is reduced to k &times; V<sub>ideal</sub> = {V2actual.toFixed(1)} V.
                I₂ and Z<sub>ref</sub> still use the ideal transformer model.
              </p>
            </div>
          )}

          {/* Fixed parameter note */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Fixed: L₁ = 10 mH, L₂ = 10 mH, V<sub>s</sub> = 120 V.
            V₂ (actual) ≈ k &times; V<sub>s</sub> &times; N₂/N₁. I₂ and Z<sub>ref</sub> use the ideal transformer model (k = 1).
            These quantities are illustrative: M is computed from the fixed reference inductances while the
            voltage ratio follows the turns ratio (which would require L &prop; N<sup>2</sup>), so they are not
            jointly solved from one consistent coil geometry. M here is k × √(L₁L₂) — the
            coupling definition rearranged; the Theory tab's 'What is mutual inductance?' shows
            where M itself comes from (flux linkage per ampere).
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Helper sub-component ───────────────────────────────────────── */

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
