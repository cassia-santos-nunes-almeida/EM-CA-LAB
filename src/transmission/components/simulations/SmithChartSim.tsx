import { useEffect, useRef, useState } from 'react';
import {
  calculateComplexReflectionCoefficient,
  calculateVSWR,
  gammaToImpedance,
  rotateGamma,
} from '@transmission/utils/transmissionMath';
import { useCanvasSetup } from '@transmission/hooks/useCanvasSetup';
import { useAnimationFrame } from '@transmission/hooks/useAnimationFrame';
import { getSectionNumber } from '@shared/constants/curriculum';
import { ReadoutCard } from './ReadoutCard';

/** Props for the SmithChartSim component. */
interface SmithChartSimProps {
  /** Additional CSS class names for the outermost container. */
  className?: string;
}

/** Detect dark mode by checking the root element class list. */
const isDark = (): boolean =>
  document.documentElement.classList.contains('dark');

/** Constant-resistance circle values to draw. */
const R_CIRCLES = [0, 0.2, 0.5, 1, 2, 5];

/** Constant-reactance arc values to draw. */
const X_ARCS = [0.2, 0.5, 1, 2, 5];

/* ── Pure helper functions (no React dependencies) ─────────────── */

/** Convert Gamma coordinates (-1..1) to canvas pixel coordinates. */
function _gammaToPixel(gr: number, gi: number, cx: number, cy: number, radius: number) {
  return { x: cx + gr * radius, y: cy - gi * radius };
}

/** Convert canvas pixel to Gamma coordinates. */
function _pixelToGamma(px: number, py: number, cx: number, cy: number, radius: number) {
  return { real: (px - cx) / radius, imag: -(py - cy) / radius };
}

/** Format a complex impedance as "26.9 + j11.9 Ω" (numerical dust snapped to 0). */
function formatComplexOhms(re: number, im: number): string {
  const reSafe = Math.abs(re) < 0.05 ? 0 : re;
  const imSafe = Math.abs(im) < 0.05 ? 0 : im;
  return `${reSafe.toFixed(1)} ${imSafe >= 0 ? '+' : '−'} j${Math.abs(imSafe).toFixed(1)} Ω`;
}

/** Draw an arrowhead at the end of a line. */
function _drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number, toX: number, toY: number, size: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

/**
 * Interactive HTML5 Canvas Smith chart simulation.
 *
 * Students adjust the real and imaginary parts of load impedance and
 * characteristic impedance via sliders. The component renders a Smith chart
 * with constant-resistance circles, constant-reactance arcs, the impedance
 * point, VSWR circle, and Gamma vector. Clicking on the chart places an
 * impedance point directly.
 */
export function SmithChartSim({ className }: SmithChartSimProps) {
  /* ── Slider state ─────────────────────────────────────────────── */

  /** Real part of load impedance (0 to 500 ohms). */
  const [ZLr, setZLr] = useState(100);
  /** Imaginary part of load impedance (-500 to 500 ohms). */
  const [ZLi, setZLi] = useState(0);
  /** Characteristic impedance (25 to 100 ohms). */
  const [Z0, setZ0] = useState(50);
  /** Observation distance from the load in wavelengths (0 … 0.5λ). At the
   *  default 0 the chart renders exactly as before this control existed. */
  const [lOverLambda, setLOverLambda] = useState(0);
  /** Whether the matching stub section is expanded. */
  const [showMatching, setShowMatching] = useState(false);
  /** Whether the user is dragging on the VSWR circle. */
  const isDraggingRef = useRef(false);
  /** Current |Gamma| for VSWR circle drag constraint. */
  const dragGammaMagRef = useRef(0);

  /* ── Derived electrical values ────────────────────────────────── */

  const gamma = calculateComplexReflectionCoefficient(ZLr, ZLi, Z0);
  const vswr = calculateVSWR(gamma.magnitude);

  // Γ and Z_in seen at the observation distance (Γ rotated by −2βl, βl = 2π·l/λ).
  const gammaIn = rotateGamma(gamma.real, gamma.imag, 2 * Math.PI * lOverLambda);
  const zin = gammaToImpedance(gammaIn.real, gammaIn.imag, Z0);

  // Normalized impedance
  const zr = ZLr / Z0;
  const zi = ZLi / Z0;

  // Quarter-wave transformer impedance (only meaningful for real loads)
  const zqw = ZLr > 0 ? Math.sqrt(Z0 * ZLr) : 0;

  /* ── Canvas refs & animation ──────────────────────────────────── */

  const { canvasRef, prepareFrame } = useCanvasSetup();
  const containerRef = useRef<HTMLDivElement>(null);

  /** Ref holding derived values for the canvas render function. */
  const stateRef = useRef({ gamma, zr, zi, gammaIn, lOverLambda });
  useEffect(() => { stateRef.current = { gamma, zr, zi, gammaIn, lOverLambda }; }, [gamma, zr, zi, gammaIn, lOverLambda]);

  /** Repaint each frame so live params and dark-mode toggles are reflected. */
  useAnimationFrame(() => {
      const frame = prepareFrame();
      if (!frame) return;
      const { ctx, width: w, height: h } = frame;
      const { gamma: g, zr: znr, zi: zni, gammaIn: gIn, lOverLambda: walkL } = stateRef.current;
      const dark = isDark();

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = dark ? '#1e293b' : '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const chartRadius = Math.min(w, h) * 0.4;

      // ── Constant-resistance circles ──
      ctx.strokeStyle = dark ? 'rgba(148,163,184,0.3)' : 'rgba(156,163,175,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

      for (const r of R_CIRCLES) {
        const centerX = cx + (r / (r + 1)) * chartRadius;
        const radius = (1 / (r + 1)) * chartRadius;
        ctx.beginPath();
        ctx.arc(centerX, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = dark ? 'rgba(148,163,184,0.6)' : 'rgba(107,114,128,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        if (r === 0) {
          ctx.fillText('0', cx - chartRadius, cy - 4);
        } else {
          const labelX = cx + (r / (r + 1)) * chartRadius + radius;
          if (labelX <= cx + chartRadius + 5) {
            ctx.fillText(String(r), Math.min(labelX, cx + chartRadius - 2), cy - 4);
          }
        }
      }

      // ── Constant-reactance arcs ──
      ctx.strokeStyle = dark ? 'rgba(148,163,184,0.2)' : 'rgba(156,163,175,0.3)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);

      for (const x of X_ARCS) {
        for (const sign of [1, -1]) {
          const arcCenterX = cx + chartRadius;
          const arcCenterY = cy - (sign / x) * chartRadius;
          const arcRadius = (1 / x) * chartRadius;

          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, chartRadius, 0, 2 * Math.PI);
          ctx.clip();
          ctx.beginPath();
          ctx.arc(arcCenterX, arcCenterY, arcRadius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();

          const labelAngle = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
          const lx = arcCenterX + arcRadius * Math.cos(labelAngle);
          const ly = arcCenterY + arcRadius * Math.sin(labelAngle);
          const dist = Math.sqrt((lx - cx) ** 2 + (ly - cy) ** 2);
          if (dist <= chartRadius + 15) {
            ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
            ctx.fillStyle = dark ? 'rgba(148,163,184,0.5)' : 'rgba(107,114,128,0.6)';
            ctx.textAlign = 'center';
            ctx.textBaseline = sign > 0 ? 'top' : 'bottom';
            const boundaryAngle = Math.atan2(ly - cy, lx - cx);
            const bx = cx + (chartRadius + 10) * Math.cos(boundaryAngle);
            const by = cy + (chartRadius + 10) * Math.sin(boundaryAngle);
            if (bx > 10 && bx < w - 10 && by > 10 && by < h - 10) {
              ctx.fillText(`${sign > 0 ? '+' : '-'}j${x}`, bx, by);
            }
          }
        }
      }

      ctx.setLineDash([]);

      // ── Unit circle ──
      ctx.strokeStyle = dark ? '#94a3b8' : '#374151';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, chartRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // ── Real axis ──
      ctx.strokeStyle = dark ? 'rgba(148,163,184,0.4)' : 'rgba(107,114,128,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - chartRadius, cy);
      ctx.lineTo(cx + chartRadius, cy);
      ctx.stroke();

      ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = dark ? '#94a3b8' : '#6b7280';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Short (\u0393=-1)', cx - chartRadius, cy + 8);
      ctx.fillText('Open (\u0393=+1)', cx + chartRadius, cy + 8);
      ctx.fillText('Matched', cx, cy + 8);

      // ── VSWR circle ──
      if (g.magnitude > 0.01 && g.magnitude < 1) {
        ctx.strokeStyle = dark ? 'rgba(96,165,250,0.5)' : 'rgba(59,130,246,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, g.magnitude * chartRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── Gamma vector ──
      const pt = _gammaToPixel(g.real, g.imag, cx, cy, chartRadius);
      ctx.strokeStyle = dark ? '#60a5fa' : '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();

      ctx.fillStyle = dark ? '#60a5fa' : '#2563eb';
      if (g.magnitude > 0.05) {
        _drawArrowhead(ctx, cx, cy, pt.x, pt.y, 10);
      }

      // ── Impedance point ──
      ctx.fillStyle = dark ? '#3b82f6' : '#2563eb';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = dark ? '#1e293b' : '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = dark ? '#60a5fa' : '#2563eb';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const labelOffX = pt.x + 10 > w - 60 ? -70 : 10;
      const labelOffY = pt.y - 10 < 15 ? 18 : -8;
      ctx.fillText(
        `z = ${znr.toFixed(2)}${zni >= 0 ? '+' : ''}j${zni.toFixed(2)}`,
        pt.x + labelOffX,
        pt.y + labelOffY,
      );

      // ── Observation-distance walk: Γ(l) marker + clockwise arc ──
      // Drawn only when l > 0 so the default render is pixel-identical to the
      // pre-upgrade chart. The arc rides the existing dashed VSWR circle: from
      // ∠Γ_L it sweeps 2βl clockwise ON THE CHART. Canvas y points down, so a
      // chart angle φ maps to canvas angle −φ and the clockwise sweep is the
      // canvas-positive direction.
      if (walkL > 0 && g.magnitude > 0.01) {
        const sweep = 4 * Math.PI * walkL; // 2βl, βl = 2π·l/λ (≤ 2π at l = 0.5)
        const startCanvasAngle = -Math.atan2(g.imag, g.real);
        const endCanvasAngle = startCanvasAngle + sweep;
        const arcRadius = g.magnitude * chartRadius;

        ctx.strokeStyle = dark ? '#fbbf24' : '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, arcRadius, startCanvasAngle, endCanvasAngle, false);
        ctx.stroke();

        // Arrowhead at the arc end, oriented along the sweep direction.
        const delta = Math.min(0.12, sweep / 2);
        const prevX = cx + arcRadius * Math.cos(endCanvasAngle - delta);
        const prevY = cy + arcRadius * Math.sin(endCanvasAngle - delta);
        const endPt = _gammaToPixel(gIn.real, gIn.imag, cx, cy, chartRadius);
        ctx.fillStyle = dark ? '#fbbf24' : '#d97706';
        _drawArrowhead(ctx, prevX, prevY, endPt.x, endPt.y, 9);

        // Hollow circle marker at Γ(l).
        ctx.strokeStyle = dark ? '#fbbf24' : '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, 6, 0, 2 * Math.PI);
        ctx.stroke();
      }

  });

  /* ── Click-to-place and drag interaction ──────────────────────── */

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const chartRadius = Math.min(rect.width, rect.height) * 0.4;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const g = _pixelToGamma(px, py, cx, cy, chartRadius);
    const gMag = Math.sqrt(g.real * g.real + g.imag * g.imag);

    if (gMag > 1.05) return;

    if (Math.abs(gMag - gamma.magnitude) < 0.08 && gamma.magnitude > 0.03) {
      isDraggingRef.current = true;
      dragGammaMagRef.current = gamma.magnitude;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }

    const clampedMag = Math.min(gMag, 0.999);
    const angle = Math.atan2(g.imag, g.real);
    const gr = clampedMag * Math.cos(angle);
    const gi = clampedMag * Math.sin(angle);
    // gammaToImpedance returns {real: Infinity} at |Γ|→1; the setZLr clamp below
    // (Math.min(500, …)) squeezes it to the 500 Ω click cap, matching the old local clamp.
    const zl = gammaToImpedance(gr, gi, Z0);
    setZLr(Math.max(0, Math.min(500, Math.round(zl.real))));
    setZLi(Math.max(-500, Math.min(500, Math.round(zl.imag))));
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const chartRadius = Math.min(rect.width, rect.height) * 0.4;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const g = _pixelToGamma(px, py, cx, cy, chartRadius);

    const angle = Math.atan2(g.imag, g.real);
    const constrainedMag = dragGammaMagRef.current;
    const gr = constrainedMag * Math.cos(angle);
    const gi = constrainedMag * Math.sin(angle);
    // gammaToImpedance returns {real: Infinity} at |Γ|→1; the setZLr clamp below
    // (Math.min(500, …)) squeezes it to the 500 Ω click cap, matching the old local clamp.
    const zl = gammaToImpedance(gr, gi, Z0);
    setZLr(Math.max(0, Math.min(500, Math.round(zl.real))));
    setZLi(Math.max(-500, Math.min(500, Math.round(zl.imag))));
  };

  const handleCanvasPointerUp = () => {
    isDraggingRef.current = false;
  };

  /* ── UI ───────────────────────────────────────────────────────── */

  return (
    <div className={className}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="w-full aspect-square min-h-[320px] max-h-[560px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            aria-label="Interactive Smith chart simulation canvas"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
          />
        </div>

        {/* Controls + Readouts */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-5">
          {/* Sliders */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* ZLr slider */}
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="zlr-label">
                R<sub>L</sub> (real) = {ZLr} &Omega;
              </span>
              <input
                type="range"
                min={0}
                max={500}
                step={1}
                value={ZLr}
                onChange={(e) => setZLr(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="zlr-label"
              />
            </div>

            {/* ZLi slider */}
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="zli-label">
                X<sub>L</sub> (imag) = {ZLi} &Omega;
              </span>
              <input
                type="range"
                min={-500}
                max={500}
                step={1}
                value={ZLi}
                onChange={(e) => setZLi(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="zli-label"
              />
            </div>

            {/* Z0 slider */}
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="z0-label">
                Z<sub>0</sub> = {Z0} &Omega;
              </span>
              <input
                type="range"
                min={25}
                max={100}
                step={1}
                value={Z0}
                onChange={(e) => setZ0(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="z0-label"
              />
            </div>

            {/* Observation-distance slider */}
            <div className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" id="smith-walk-label">
                Observation distance l = {lOverLambda.toFixed(3)} &lambda; (toward the generator)
              </span>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.005}
                value={lOverLambda}
                onChange={(e) => setLOverLambda(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
                aria-labelledby="smith-walk-label"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Walking toward the generator rotates &Gamma; clockwise at constant |&Gamma;|
                &mdash; Section {getSectionNumber('line-impedance')} turns this rotation into
                Z_in(l).
              </p>
            </div>
          </div>

          {/* Computed values */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ReadoutCard
              label="|Γ| (magnitude)"
              value={gamma.magnitude.toFixed(4)}
            />
            <ReadoutCard
              label="∠Γ (phase)"
              value={`${gamma.phaseDeg.toFixed(1)}\u00B0`}
            />
            <ReadoutCard
              label="VSWR"
              value={isFinite(vswr) ? vswr.toFixed(3) : '\u221E'}
            />
            <ReadoutCard
              label="Normalized z = Zₗ/Z₀"
              value={`${zr.toFixed(3)} ${zi >= 0 ? '+' : '\u2212'} j${Math.abs(zi).toFixed(3)}`}
            />
            <ReadoutCard
              label="Z_in at l"
              value={Number.isFinite(zin.real) ? formatComplexOhms(zin.real, zin.imag) : '\u2192 \u221E'}
            />
            <ReadoutCard
              label="Rotation 2βl"
              value={`${(720 * lOverLambda).toFixed(0)}\u00B0`}
            />
          </div>

          {/* Matching stub calculator (collapsible) */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMatching(!showMatching)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span>Quarter-Wave Matching</span>
              <span className="text-slate-400">{showMatching ? '\u25B2' : '\u25BC'}</span>
            </button>
            {showMatching && (
              <div className="px-4 pb-3 pt-1 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  A quarter-wave transformer section with impedance{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">
                    Z<sub>QW</sub> = &radic;(Z<sub>0</sub> &middot; R<sub>L</sub>)
                  </strong>{' '}
                  will match a purely resistive load to the line.
                </p>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                    Quarter-wave transformer impedance
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {ZLr > 0
                      ? `${zqw.toFixed(2)} \u03A9`
                      : 'N/A (R\u2097 must be > 0)'}
                  </p>
                </div>
                {ZLi !== 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Note: The load has a reactive component (X<sub>L</sub> = {ZLi} &Omega;).
                    The quarter-wave transformer formula assumes a purely resistive load.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fixed parameter note */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Click on the chart to place an impedance point. Drag along the VSWR circle to
            explore constant-|&Gamma;| impedances.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Helper sub-component ───────────────────────────────────────── */

