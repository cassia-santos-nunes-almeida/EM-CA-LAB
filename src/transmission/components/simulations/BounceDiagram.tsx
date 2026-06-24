import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/** Props for the BounceDiagram component. */
interface BounceDiagramProps {
  /** Additional CSS class names for the outer container. */
  className?: string;
}

/** A single bounce segment carrying voltage amplitude and direction info. */
interface BounceSegment {
  /** Bounce index (0-based). */
  index: number;
  /** Voltage amplitude of this wave segment. */
  amplitude: number;
  /** Whether this segment travels from source to load (forward) or load to source (backward). */
  direction: 'forward' | 'backward';
  /** Cumulative time index at start of this segment (in units of one-way travel time T_D). */
  timeStart: number;
  /** Cumulative time index at end of this segment. */
  timeEnd: number;
}

/** Fixed circuit parameters. */
const VS = 10; // Source voltage in volts
const Z0 = 50; // Characteristic impedance in ohms

/**
 * Derive source impedance from the source reflection coefficient.
 *
 * Gamma_s = (Zs - Z0) / (Zs + Z0)  =>  Zs = Z0 * (1 + Gamma_s) / (1 - Gamma_s)
 */
function zsFromGamma(gammaSource: number): number {
  if (gammaSource >= 1) return 1e9; // Effectively open
  if (gammaSource <= -1) return 0;  // Short
  return Z0 * (1 + gammaSource) / (1 - gammaSource);
}

/**
 * Compute the initial forward voltage launched onto the line.
 *
 * V0 = Vs * Z0 / (Zs + Z0)
 */
function initialVoltage(gammaSource: number): number {
  const Zs = zsFromGamma(gammaSource);
  return VS * Z0 / (Zs + Z0);
}

/**
 * Compute all bounce segments for the given parameters.
 */
function computeBounces(
  gammaLoad: number,
  gammaSource: number,
  numBounces: number,
): BounceSegment[] {
  const segments: BounceSegment[] = [];
  const V0 = initialVoltage(gammaSource);
  let currentAmplitude = V0;
  let time = 0;

  for (let i = 0; i < numBounces; i++) {
    if (i === 0) {
      // First forward wave
      segments.push({
        index: i,
        amplitude: currentAmplitude,
        direction: 'forward',
        timeStart: time,
        timeEnd: time + 1,
      });
      time += 1;
    } else if (i % 2 === 1) {
      // Odd bounce: reflect at load, travel backward
      currentAmplitude *= gammaLoad;
      segments.push({
        index: i,
        amplitude: currentAmplitude,
        direction: 'backward',
        timeStart: time,
        timeEnd: time + 1,
      });
      time += 1;
    } else {
      // Even bounce: reflect at source, travel forward
      currentAmplitude *= gammaSource;
      segments.push({
        index: i,
        amplitude: currentAmplitude,
        direction: 'forward',
        timeStart: time,
        timeEnd: time + 1,
      });
      time += 1;
    }
  }

  return segments;
}

/**
 * Compute voltage vs time data at source and load ends.
 *
 * At any point in time, the voltage at an end is the superposition
 * of all waves that have arrived at that end.
 */
function computeVoltageData(segments: BounceSegment[]) {
  const sourceData: { time: number; voltage: number }[] = [{ time: 0, voltage: 0 }];
  const loadData: { time: number; voltage: number }[] = [{ time: 0, voltage: 0 }];

  let sourceVoltage = 0;
  let loadVoltage = 0;

  for (const seg of segments) {
    if (seg.direction === 'forward') {
      // Forward wave: departs source at timeStart, arrives at load at timeEnd
      // At source: voltage changes when wave departs (incident + reflected at source)
      // The voltage at source updates when a forward wave departs
      sourceVoltage += seg.amplitude;
      sourceData.push({ time: seg.timeStart, voltage: sourceVoltage });

      // At load: voltage changes when forward wave arrives
      loadVoltage += seg.amplitude;
      loadData.push({ time: seg.timeEnd, voltage: loadVoltage });
    } else {
      // Backward wave: departs load at timeStart, arrives at source at timeEnd
      // At load: voltage changes when backward wave departs (add reflected)
      loadVoltage += seg.amplitude;
      loadData.push({ time: seg.timeStart, voltage: loadVoltage });

      // At source: voltage changes when backward wave arrives
      sourceVoltage += seg.amplitude;
      sourceData.push({ time: seg.timeEnd, voltage: sourceVoltage });
    }
  }

  // Extend both to the max time so the charts look complete
  const maxTime = segments.length > 0 ? segments[segments.length - 1].timeEnd + 1 : 2;
  sourceData.push({ time: maxTime, voltage: sourceVoltage });
  loadData.push({ time: maxTime, voltage: loadVoltage });

  return { sourceData, loadData, maxTime };
}

/**
 * Compute the steady-state voltage on the line from the geometric series.
 *
 * V_ss = V0 * (1 + GammaL) / (1 - GammaL * GammaS)
 *
 * This is equivalent to Vs * ZL / (Zs + ZL).
 */
function steadyStateVoltage(gammaLoad: number, gammaSource: number): number {
  // The bounce series converges to a steady state only when |Γ_L·Γ_S| < 1. At
  // |Γ_L·Γ_S| = 1 the reflections never decay: Γ_L·Γ_S = +1 makes the closed form
  // diverge (denom→0), while Γ_L·Γ_S = −1 (e.g. Γ_L=+1, Γ_S=−1) keeps a finite
  // closed form (denom=2) yet the partial sums oscillate forever — both are unstable.
  if (Math.abs(gammaLoad * gammaSource) >= 1 - 1e-9) return Infinity;
  return initialVoltage(gammaSource) * (1 + gammaLoad) / (1 - gammaLoad * gammaSource);
}

/**
 * Interactive bounce diagram simulation for transmission line transients.
 *
 * Renders an HTML5 Canvas bounce diagram showing forward and backward traveling
 * waves with their voltage amplitudes, and Recharts line charts showing the
 * voltage versus time at both the source and load ends of the line.
 *
 * Students can adjust the reflection coefficients at both ends, control the
 * number of bounces, and step through the diagram one bounce at a time.
 */
export function BounceDiagram({ className = '' }: BounceDiagramProps) {
  /** Whether dark mode is active. */
  const [isDarkMode, setIsDarkMode] = useState(
    () => document.documentElement.classList.contains('dark'),
  );

  // Listen for dark mode class changes on documentElement
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  /** Reflection coefficient at the load end (-1 to +1). */
  const [gammaLoad, setGammaLoad] = useState(0.5);
  /** Reflection coefficient at the source end (-1 to +1). */
  const [gammaSource, setGammaSource] = useState(0);
  /** Maximum number of bounces to display. */
  const [maxBounces, setMaxBounces] = useState(4);
  /** Number of bounces currently visible (for step-through mode). */
  const [visibleBounces, setVisibleBounces] = useState(4);
  /** Whether an animation is currently playing. */
  const [isAnimating, setIsAnimating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  // Compute segments for currently visible bounces
  const visibleSegments = useMemo(
    () => computeBounces(gammaLoad, gammaSource, visibleBounces),
    [gammaLoad, gammaSource, visibleBounces],
  );

  const { sourceData, loadData, maxTime } = useMemo(
    () => computeVoltageData(visibleSegments),
    [visibleSegments],
  );

  const vSS = steadyStateVoltage(gammaLoad, gammaSource);

  // Reset visible bounces when max changes
  useEffect(() => {
    // Intentional reset of the animation counter when maxBounces changes; runs
    // once per prop change, not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleBounces(maxBounces);
  }, [maxBounces]);

  // Stop animation on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  /** Reset the diagram to show all bounces immediately. */
  const handleReset = () => {
    cancelledRef.current = true;
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setIsAnimating(false);
    setVisibleBounces(maxBounces);
  };

  /** Add one bounce to the visible set. */
  const handleNextBounce = () => {
    setVisibleBounces((prev) => Math.min(prev + 1, maxBounces));
  };

  /** Start step-through from 0, reveal one bounce at a time. */
  const handleStepStart = () => {
    setVisibleBounces(0);
  };

  /** Animate bounces appearing one by one. */
  const handlePlayAll = () => {
    if (isAnimating) return;
    cancelledRef.current = false;
    setIsAnimating(true);
    setVisibleBounces(0);

    let count = 0;
    const tick = () => {
      if (cancelledRef.current) return;
      count += 1;
      if (count <= maxBounces) {
        setVisibleBounces(count);
        animTimerRef.current = setTimeout(tick, 600);
      } else {
        setIsAnimating(false);
      }
    };
    animTimerRef.current = setTimeout(tick, 400);
  };

  // ─── Canvas drawing ────────────────────────────────────────────────

  const drawDiagram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    const displayWidth = container ? container.clientWidth : 500;
    const displayHeight = Math.min(displayWidth * 1.1, 520);

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains('dark');

    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(100, 116, 139, 0.12)';
    const axisColor = isDark ? '#94a3b8' : '#64748b';
    const fwdColor = isDark ? '#60a5fa' : '#2563eb'; // Blue for forward waves
    const bwdColor = isDark ? '#f87171' : '#dc2626'; // Red for backward waves
    const labelBg = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)';

    // Layout margins
    const marginLeft = 50;
    const marginRight = 30;
    const marginTop = 40;
    const marginBottom = 30;
    const plotWidth = displayWidth - marginLeft - marginRight;
    const plotHeight = displayHeight - marginTop - marginBottom;

    // Clear
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Total time range
    const totalTime = maxBounces + 1;

    // Helper: position to x
    const posToX = (pos: number) => marginLeft + pos * plotWidth; // pos: 0=source, 1=load
    // Helper: time to y
    const timeToY = (t: number) => marginTop + (t / totalTime) * plotHeight;

    // ── Grid lines ──
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Horizontal time gridlines
    for (let t = 0; t <= totalTime; t++) {
      const y = timeToY(t);
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotWidth, y);
      ctx.stroke();
    }

    // Vertical lines at source and load
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(posToX(0), marginTop);
    ctx.lineTo(posToX(0), marginTop + plotHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(posToX(1), marginTop);
    ctx.lineTo(posToX(1), marginTop + plotHeight);
    ctx.stroke();

    // ── Axis labels ──
    ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = axisColor;
    ctx.textAlign = 'center';
    ctx.fillText('Source', posToX(0), marginTop - 12);
    ctx.fillText('Load', posToX(1), marginTop - 12);

    // Time labels on left
    ctx.textAlign = 'right';
    ctx.font = '10px ui-monospace, monospace';
    for (let t = 0; t <= totalTime; t++) {
      ctx.fillStyle = axisColor;
      ctx.fillText(`${t}T\u1D30`, marginLeft - 6, timeToY(t) + 4);
    }

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText('Bounce Diagram', displayWidth / 2, 16);

    // ── Draw bounce segments ──
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);

    for (const seg of visibleSegments) {
      const color = seg.direction === 'forward' ? fwdColor : bwdColor;
      ctx.strokeStyle = color;

      let x1: number, x2: number;
      if (seg.direction === 'forward') {
        x1 = posToX(0);
        x2 = posToX(1);
      } else {
        x1 = posToX(1);
        x2 = posToX(0);
      }

      const y1 = timeToY(seg.timeStart);
      const y2 = timeToY(seg.timeEnd);

      // Draw line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const arrowLen = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - arrowLen * Math.cos(angle - Math.PI / 6),
        y2 - arrowLen * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        x2 - arrowLen * Math.cos(angle + Math.PI / 6),
        y2 - arrowLen * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();

      // Label voltage amplitude at midpoint
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const labelText = `${seg.amplitude >= 0 ? '+' : ''}${seg.amplitude.toFixed(2)}V`;

      ctx.font = '10px ui-monospace, monospace';
      const textWidth = ctx.measureText(labelText).width;

      // Background pill for readability
      const paddingX = 4;
      const paddingY = 2;
      ctx.fillStyle = labelBg;
      const offsetY = seg.direction === 'forward' ? -12 : 8;
      ctx.beginPath();
      ctx.roundRect(
        midX - textWidth / 2 - paddingX,
        midY + offsetY - 8 - paddingY,
        textWidth + 2 * paddingX,
        12 + 2 * paddingY,
        3,
      );
      ctx.fill();

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, midX, midY + offsetY - 2);
    }

    // ── Legend ──
    const legendX = marginLeft + 8;
    const legendY = marginTop + plotHeight + 16;
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif';

    ctx.fillStyle = fwdColor;
    ctx.fillRect(legendX, legendY - 4, 14, 3);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText('Forward', legendX + 18, legendY);

    ctx.fillStyle = bwdColor;
    ctx.fillRect(legendX + 80, legendY - 4, 14, 3);
    ctx.fillStyle = textColor;
    ctx.fillText('Backward', legendX + 98, legendY);
  }, [visibleSegments, maxBounces]);

  // Observe container resize (also fires on initial mount, covering window resize)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(drawDiagram);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [drawDiagram]);

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(drawDiagram);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [drawDiagram]);

  // ─── Recharts data: step functions ─────────────────────────────────

  // Create proper step-function data by duplicating points
  const sourceStepData = useMemo(() => {
    const result: { time: number; voltage: number }[] = [];
    for (let i = 0; i < sourceData.length; i++) {
      if (i > 0 && sourceData[i].time !== sourceData[i - 1].time) {
        // Add point at new time with old voltage to create step
        result.push({ time: sourceData[i].time, voltage: sourceData[i - 1].voltage });
      }
      result.push({ ...sourceData[i] });
    }
    return result;
  }, [sourceData]);

  const loadStepData = useMemo(() => {
    const result: { time: number; voltage: number }[] = [];
    for (let i = 0; i < loadData.length; i++) {
      if (i > 0 && loadData[i].time !== loadData[i - 1].time) {
        result.push({ time: loadData[i].time, voltage: loadData[i - 1].voltage });
      }
      result.push({ ...loadData[i] });
    }
    return result;
  }, [loadData]);

  // Determine Y-axis domain
  const allVoltages = [...sourceStepData, ...loadStepData].map((d) => d.voltage);
  const vMin = Math.min(0, ...allVoltages);
  const vMax = Math.max(1, ...allVoltages);
  const vPad = (vMax - vMin) * 0.15 || 1;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Controls</h3>

        {/* Gamma Load */}
        <SliderControl
          label={'\u0393 at Load (\u0393\u2097)'}
          value={gammaLoad}
          min={-1}
          max={1}
          step={0.01}
          onChange={(v) => { setGammaLoad(v); setVisibleBounces(maxBounces); }}
          format={(v) => v.toFixed(2)}
        />

        {/* Gamma Source */}
        <SliderControl
          label={'\u0393 at Source (\u0393\u209B)'}
          value={gammaSource}
          min={-1}
          max={1}
          step={0.01}
          onChange={(v) => { setGammaSource(v); setVisibleBounces(maxBounces); }}
          format={(v) => v.toFixed(2)}
        />

        {/* Number of bounces */}
        <SliderControl
          label="Number of Bounces"
          value={maxBounces}
          min={1}
          max={8}
          step={1}
          onChange={(v) => setMaxBounces(v)}
          format={(v) => String(v)}
        />

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleStepStart}
            disabled={isAnimating}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Start Step-Through
          </button>
          <button
            onClick={handleNextBounce}
            disabled={isAnimating || visibleBounces >= maxBounces}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors disabled:opacity-50"
          >
            Next Bounce
          </button>
          <button
            onClick={handlePlayAll}
            disabled={isAnimating}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors disabled:opacity-50"
          >
            {isAnimating ? 'Playing\u2026' : 'Play All'}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Fixed parameters & steady-state readout */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-700">
          <span>V<sub>s</sub> = {VS}V</span>
          <span>Z<sub>0</sub> = {Z0}Ω</span>
          <span>V<sub>0</sub> = {initialVoltage(gammaSource).toFixed(2)}V</span>
          <span className="font-semibold text-engineering-blue-600 dark:text-engineering-blue-400">
            V<sub>ss</sub> = {Number.isFinite(vSS) ? `${vSS.toFixed(2)}V` : '\u221E (unstable)'}
          </span>
        </div>
      </div>

      {/* ── Bounce Diagram Canvas ────────────────────────────────── */}
      <div
        ref={containerRef}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex items-center justify-center"
      >
        <canvas ref={canvasRef} aria-label="Bounce diagram showing voltage reflections on a transmission line" />
      </div>

      {/* ── Voltage vs Time Charts ───────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <VoltageChart
          title="Voltage at Source End"
          data={sourceStepData}
          maxTime={maxTime}
          yDomain={[vMin - vPad, vMax + vPad]}
          steadyState={vSS}
          isDarkMode={isDarkMode}
        />
        <VoltageChart
          title="Voltage at Load End"
          data={loadStepData}
          maxTime={maxTime}
          yDomain={[vMin - vPad, vMax + vPad]}
          steadyState={vSS}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}

// ─── Helper Components ─────────────────────────────────────────────

/** Props for the SliderControl helper. */
interface SliderControlProps {
  /** Label text displayed above the slider. */
  label: string;
  /** Current value of the slider. */
  value: number;
  /** Minimum allowed value. */
  min: number;
  /** Maximum allowed value. */
  max: number;
  /** Step increment for the slider. */
  step: number;
  /** Callback fired when the slider value changes. */
  onChange: (value: number) => void;
  /** Formatter for the numeric display. */
  format: (value: number) => string;
}

/** Reusable labeled slider control with value readout. */
function SliderControl({ label, value, min, max, step, onChange, format }: SliderControlProps) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-xs font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-engineering-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </label>
  );
}

/** Props for the VoltageChart helper. */
interface VoltageChartProps {
  /** Chart title. */
  title: string;
  /** Step-function data to plot. */
  data: { time: number; voltage: number }[];
  /** Maximum time value for the X-axis. */
  maxTime: number;
  /** Y-axis domain [min, max]. */
  yDomain: [number, number];
  /** Steady-state voltage value for reference line display. */
  steadyState: number;
  /** Whether dark mode is active. */
  isDarkMode: boolean;
}

/** Line chart showing voltage vs time at one end of the transmission line. */
function VoltageChart({ title, data, maxTime, yDomain, steadyState, isDarkMode }: VoltageChartProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{title}</h4>
        {Number.isFinite(steadyState) && (
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            V<sub>ss</sub> = {steadyState.toFixed(2)}V
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, maxTime]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            label={{ value: 'Time (T_D)', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#94a3b8' } }}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            label={{ value: 'V (volts)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#94a3b8' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              border: isDarkMode ? 'none' : '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '11px',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
            }}
            formatter={(value: unknown) => [`${Number(value).toFixed(3)} V`, 'Voltage']}
            labelFormatter={(label: unknown) => `t = ${Number(label).toFixed(1)} T_D`}
          />
          <Line
            type="linear"
            dataKey="voltage"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
