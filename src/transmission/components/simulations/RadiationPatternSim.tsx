import { useState, useRef, useEffect, useCallback } from 'react';
import {
  calculateRadiationPattern,
  calculateDirectivity,
  calculateRadiationResistance,
  calculateHPBW,
} from '@transmission/utils/transmissionMath';

/** Props for the RadiationPatternSim component. */
interface RadiationPatternSimProps {
  /** Additional CSS class names for the outer container. */
  className?: string;
}

/**
 * Interactive radiation pattern simulation for a thin dipole antenna.
 *
 * Renders an HTML5 Canvas polar plot of the far-field E-plane radiation pattern.
 * A slider controls dipole length as a fraction of wavelength.
 * Numerical readouts show directivity, radiation resistance, and HPBW.
 */
export function RadiationPatternSim({ className = '' }: RadiationPatternSimProps) {
  const [dipoleFraction, setDipoleFraction] = useState(0.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const directivity = calculateDirectivity(dipoleFraction);
  const radiationResistance = calculateRadiationResistance(dipoleFraction);
  const hpbw = calculateHPBW(dipoleFraction);

  const drawPattern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    const displayWidth = container ? container.clientWidth : 400;
    const displaySize = Math.min(displayWidth, 500);

    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains('dark');

    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.2)';
    const labelColor = isDark ? '#94a3b8' : '#64748b';
    const axisColor = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.35)';
    const patternStroke = isDark ? '#60a5fa' : '#2563eb';
    const patternFill = isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.12)';

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const maxRadius = displaySize * 0.4;

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, displaySize, displaySize);

    // --- Polar grid ---

    // Concentric circles
    const numCircles = 4;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 1; i <= numCircles; i++) {
      const r = (maxRadius / numCircles) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Radial lines every 30 degrees
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 0.75;
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(rad), cy - maxRadius * Math.sin(rad));
      ctx.stroke();
    }

    // Angle labels
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const angleLabelRadius = maxRadius + 16;
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const lx = cx + angleLabelRadius * Math.cos(rad);
      const ly = cy - angleLabelRadius * Math.sin(rad);
      ctx.fillText(`${deg}\u00B0`, lx, ly);
    }

    // --- Compute radiation pattern ---
    const numPoints = 360;
    const patternValues: number[] = [];
    let maxE = 0;

    for (let i = 0; i <= numPoints; i++) {
      // theta in the antenna coordinate system: 0 = along axis, pi/2 = broadside
      // We map the polar plot angle phi to antenna theta
      // In the polar plot: 0 deg (right) = theta=90 (broadside), 90 deg (up) = theta=0 (along axis)
      const phi = (i / numPoints) * 2 * Math.PI;
      // Convert plot angle to antenna theta: theta = pi/2 - phi for upper half
      // Actually, for a standard antenna polar plot in E-plane:
      // Plot angle measured from horizontal = theta measured from z-axis minus 90
      // phi on plot corresponds to theta on antenna: theta = pi/2 - phi
      // Simpler: just use the plot angle directly as the angle from the z-axis
      const theta = phi; // We'll re-interpret below
      const E = calculateRadiationPattern(dipoleFraction, theta);
      patternValues.push(E);
      if (E > maxE) maxE = E;
    }

    if (maxE === 0) maxE = 1;

    // --- Draw filled pattern ---
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const phi = (i / numPoints) * 2 * Math.PI;
      // Map: antenna theta=0 is along z-axis (up in plot), theta=pi/2 is broadside (right in plot)
      // In the polar plot: angle measured CCW from right = pi/2 - theta
      // So plot angle = pi/2 - theta => theta = pi/2 - plotAngle
      // But we computed pattern for theta = phi, so we plot:
      // The pattern at antenna-theta goes at plot-angle = (pi/2 - theta)
      // Easier approach: compute E at each antenna theta, then place at plot angle = pi/2 - theta
      // Let's re-do: iterate over antenna theta 0..2pi, plot at plotAngle = pi/2 - theta
      const r = (patternValues[i] / maxE) * maxRadius;
      // theta=0 is along antenna axis (top of plot), theta=pi/2 is broadside (right)
      // Standard polar: plotAngle=0 is right, plotAngle=pi/2 is up
      // We want antenna axis pointing up => theta=0 at top => plotAngle = pi/2
      // theta increases going CW from top in antenna coords
      // plotX = r * sin(theta), plotY = -r * cos(theta)  [theta from top, CW]
      const plotX = cx + r * Math.sin(phi);
      const plotY = cy - r * Math.cos(phi);

      if (i === 0) {
        ctx.moveTo(plotX, plotY);
      } else {
        ctx.lineTo(plotX, plotY);
      }
    }
    ctx.closePath();

    ctx.fillStyle = patternFill;
    ctx.fill();

    ctx.strokeStyle = patternStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Axis labels ---
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.fillText('Antenna axis', cx, 14);
    ctx.fillText('Broadside', displaySize - 6, cy + 4);
  }, [dipoleFraction]);

  // Observe container resize (also fires on initial mount, covering window resize)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(drawPattern);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [drawPattern]);

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(drawPattern);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [drawPattern]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Slider */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5">
        <label className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Dipole Length
            </span>
            <span className="text-sm font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
              {dipoleFraction.toFixed(2)}&lambda;
            </span>
          </div>
          <input
            type="range"
            aria-label="Dipole Length"
            min={0.1}
            max={1.5}
            step={0.05}
            value={dipoleFraction}
            onChange={(e) => setDipoleFraction(parseFloat(e.target.value))}
            className="w-full accent-engineering-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            <span>0.10&lambda;</span>
            <span>0.50&lambda;</span>
            <span>1.00&lambda;</span>
            <span>1.50&lambda;</span>
          </div>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex items-center justify-center"
        >
          <canvas ref={canvasRef} aria-label="Polar radiation pattern plot for a dipole antenna" />
        </div>

        {/* Numerical readouts */}
        <div className="flex flex-col gap-3 lg:w-56">
          <ReadoutCard
            label="Directivity"
            value={`${directivity.toFixed(2)}`}
            unit="(linear)"
            sublabel={`${(10 * Math.log10(directivity)).toFixed(1)} dBi`}
          />
          <ReadoutCard
            label="Radiation Resistance"
            value={`${radiationResistance.toFixed(1)}`}
            unit={'\u03A9'}
          />
          <ReadoutCard
            label="Half-Power Beamwidth"
            value={`${hpbw.toFixed(1)}`}
            unit="\u00B0"
          />
        </div>
      </div>
    </div>
  );
}

/** Props for the ReadoutCard helper component. */
interface ReadoutCardProps {
  /** Metric label displayed above the value. */
  label: string;
  /** The primary numerical value to display. */
  value: string;
  /** Unit string displayed after the value. */
  unit: string;
  /** Optional secondary label displayed below the value. */
  sublabel?: string;
}

/** Small card that shows a single numerical readout. */
function ReadoutCard({ label, value, unit, sublabel }: ReadoutCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
        {value}{' '}
        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{unit}</span>
      </p>
      {sublabel && (
        <p className="text-xs text-engineering-blue-600 dark:text-engineering-blue-400 font-mono mt-0.5">
          {sublabel}
        </p>
      )}
    </div>
  );
}
