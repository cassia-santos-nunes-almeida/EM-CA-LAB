import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateReflectionCoefficient,
  calculateVSWR,
  calculateWavelength,
} from '@transmission/utils/transmissionMath';
import { useCanvasSetup } from '@transmission/hooks/useCanvasSetup';
import { useAnimationFrame } from '@transmission/hooks/useAnimationFrame';

/** Props for the TransmissionLineSim component. */
interface TransmissionLineSimProps {
  /** Additional CSS class names for the outermost container. */
  className?: string;
}

/**
 * Interactive HTML5 Canvas transmission line simulation.
 *
 * Renders animated incident (blue), reflected (red/orange), and total (green)
 * voltage waves on a transmission line. Students adjust line length, Z0, ZL,
 * Zs, frequency, and signal type via sliders. Numerical readouts display the
 * reflection coefficient, VSWR, and wavelength in real time.
 */
export function TransmissionLineSim({ className }: TransmissionLineSimProps) {
  /* -- Slider state ---------------------------------------------------- */

  /** Line length in meters (0.1 to 2.0). */
  const [lineLength, setLineLength] = useState(1.0);
  /** Characteristic impedance in ohms (10 to 200). */
  const [Z0, setZ0] = useState(50);
  /** Load impedance in ohms (0 to 500), or Infinity when open toggle is on. */
  const [ZLValue, setZLValue] = useState(50);
  /** Whether the load is set to open circuit (Z_L = Infinity). */
  const [isOpen, setIsOpen] = useState(false);
  /** Source impedance in ohms (10 to 200). */
  const [Zs, setZs] = useState(50);
  /** Frequency in Hz. Stored as the log10 exponent for smooth slider feel. */
  const [freqExp, setFreqExp] = useState(9); // 1 GHz default
  /** Signal type: sinusoidal or step. */
  const [signalType, setSignalType] = useState<'sinusoidal' | 'step'>('sinusoidal');

  /* -- Derived values --------------------------------------------------- */

  const ZL = isOpen ? Infinity : ZLValue;
  const frequency = Math.pow(10, freqExp);
  const gamma = useMemo(() => calculateReflectionCoefficient(ZL, Z0), [ZL, Z0]);
  const gammaMag = Math.abs(gamma);
  const vswr = calculateVSWR(gamma);
  const wavelength = useMemo(() => calculateWavelength(frequency), [frequency]);

  /* -- Canvas refs & animation ------------------------------------------ */

  const { canvasRef, prepareFrame } = useCanvasSetup();
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  /** Latest slider/derived params, read by the render loop so it need not be recreated on each change. */
  const paramsRef = useRef({ lineLength, Z0, ZLValue, isOpen, Zs, signalType, gamma, wavelength });

  /** Detect dark mode from root element class list. */
  const isDark = (): boolean =>
    document.documentElement.classList.contains('dark');

  /** Format frequency for display with appropriate SI prefix. */
  const formatFrequency = (f: number): string => {
    if (f >= 1e9) return `${(f / 1e9).toFixed(2)} GHz`;
    if (f >= 1e6) return `${(f / 1e6).toFixed(2)} MHz`;
    if (f >= 1e3) return `${(f / 1e3).toFixed(2)} kHz`;
    return `${f.toFixed(0)} Hz`;
  };

  /** Format wavelength for display with appropriate unit. */
  const formatWavelength = (lam: number): string => {
    if (!isFinite(lam)) return '\u221E';
    if (lam >= 1) return `${lam.toFixed(3)} m`;
    if (lam >= 1e-2) return `${(lam * 100).toFixed(2)} cm`;
    return `${(lam * 1000).toFixed(2)} mm`;
  };

  /* -- Main render loop ------------------------------------------------- */

  useAnimationFrame(({ dt }) => {
    const frame = prepareFrame();
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;
    const dark = isDark();
    const { lineLength, Z0, ZLValue, isOpen, Zs, signalType, gamma, wavelength } = paramsRef.current;

    // Clear
    ctx.fillStyle = dark ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Layout constants
    const margin = 40;
    const lineStartX = margin + 30;
    const lineEndX = w - margin - 30;
    const lineW = lineEndX - lineStartX;
    const centerY = h / 2;
    const lineGap = 24; // vertical separation between parallel conductors
    const waveAmp = Math.min(h * 0.25, 60); // max wave amplitude in pixels

    // -- Draw the transmission line as two parallel conductors --
    ctx.strokeStyle = dark ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 3;

    // Top conductor
    ctx.beginPath();
    ctx.moveTo(lineStartX, centerY - lineGap);
    ctx.lineTo(lineEndX, centerY - lineGap);
    ctx.stroke();

    // Bottom conductor
    ctx.beginPath();
    ctx.moveTo(lineStartX, centerY + lineGap);
    ctx.lineTo(lineEndX, centerY + lineGap);
    ctx.stroke();

    // Source end marker
    ctx.strokeStyle = dark ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineStartX, centerY - lineGap - 10);
    ctx.lineTo(lineStartX, centerY + lineGap + 10);
    ctx.stroke();

    // Load end marker
    ctx.beginPath();
    ctx.moveTo(lineEndX, centerY - lineGap - 10);
    ctx.lineTo(lineEndX, centerY + lineGap + 10);
    ctx.stroke();

    // Labels
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? '#94a3b8' : '#64748b';
    ctx.fillText('Source', lineStartX, centerY + lineGap + 28);
    ctx.fillText(`Z\u209B = ${Zs}\u03A9`, lineStartX, centerY + lineGap + 42);
    ctx.fillText('Load', lineEndX, centerY + lineGap + 28);
    ctx.fillText(
      isOpen ? 'Z\u2097 = \u221E (Open)' : `Z\u2097 = ${ZLValue}\u03A9`,
      lineEndX,
      centerY + lineGap + 42,
    );
    ctx.fillText(`Z\u2080 = ${Z0}\u03A9`, (lineStartX + lineEndX) / 2, centerY + lineGap + 28);

    // -- Compute and draw voltage waves --
    const t = timeRef.current;
    const k = (2 * Math.PI) / wavelength; // wave number
    const numPoints = Math.max(200, Math.round(lineW));

    // Phase velocity normalized so animation is visible
    // We scale time so one full cycle takes about 2 seconds visually
    const animOmega = 2 * Math.PI * 0.5; // visual angular frequency

    const incidentY: number[] = [];
    const reflectedY: number[] = [];
    const totalY: number[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints; // 0 at source, 1 at load

      // Physical position along line (0 = source, lineLength = load)
      const pos = frac * lineLength;

      if (signalType === 'sinusoidal') {
        // Incident wave: travels source -> load (positive x direction)
        const inc = Math.sin(k * pos + animOmega * t);

        // Reflected wave: travels load -> source, reflected at load with coefficient gamma
        const ref = gamma * Math.sin(k * (2 * lineLength - pos) + animOmega * t);

        incidentY.push(inc);
        reflectedY.push(ref);
        totalY.push(inc + ref);
      } else {
        // Step signal: incident step propagating right, reflected step propagating left
        const stepPos = ((t * 0.4) % 2.5) * lineLength; // position of step front
        const inc = pos < stepPos ? 1 : 0;

        const ref = (stepPos > lineLength && (lineLength - pos) < (stepPos - lineLength))
          ? gamma
          : 0;

        incidentY.push(inc);
        reflectedY.push(ref);
        totalY.push(inc + ref);
      }
    }

    // Normalize peak for display
    let maxVal = 0;
    for (let i = 0; i <= numPoints; i++) {
      maxVal = Math.max(maxVal, Math.abs(totalY[i]), Math.abs(incidentY[i]), Math.abs(reflectedY[i]));
    }
    if (maxVal === 0) maxVal = 1;
    const scale = waveAmp / maxVal;

    // Helper to draw a waveform
    const drawWave = (values: number[], color: string, lineWidth: number, dash: number[] = []) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dash);
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const px = lineStartX + (i / numPoints) * lineW;
        const py = centerY - values[i] * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw incident wave (blue)
    drawWave(
      incidentY,
      dark ? '#60a5fa' : '#2563eb',
      1.5,
      [6, 3],
    );

    // Draw reflected wave (red/orange)
    drawWave(
      reflectedY,
      dark ? '#fb923c' : '#ea580c',
      1.5,
      [6, 3],
    );

    // Draw total voltage (green / white, solid, thicker)
    drawWave(
      totalY,
      dark ? '#f0fdf4' : '#16a34a',
      2.5,
    );

    // -- Legend --
    const legendX = lineStartX + 10;
    const legendY = margin - 18;
    const legendItems: [string, string, number[]][] = [
      ['Incident', dark ? '#60a5fa' : '#2563eb', [6, 3]],
      ['Reflected', dark ? '#fb923c' : '#ea580c', [6, 3]],
      ['Total', dark ? '#f0fdf4' : '#16a34a', []],
    ];
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'left';
    let lx = legendX;
    for (const [label, color, dash] of legendItems) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(lx, legendY);
      ctx.lineTo(lx + 20, legendY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = dark ? '#e2e8f0' : '#334155';
      ctx.fillText(label, lx + 24, legendY + 4);
      lx += 80;
    }

    // Advance time
    timeRef.current += dt;
  });

  /** Keep the render loop's params ref in sync with the sliders and derived values. */
  useEffect(() => {
    paramsRef.current = { lineLength, Z0, ZLValue, isOpen, Zs, signalType, gamma, wavelength };
  }, [lineLength, Z0, ZLValue, isOpen, Zs, signalType, gamma, wavelength]);

  /* -- UI ---------------------------------------------------------------- */

  return (
    <div className={className}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="w-full aspect-[5/2] min-h-[260px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            aria-label="Transmission line simulation showing incident, reflected, and total voltage waves"
          />
        </div>

        {/* Controls */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-5">
          {/* Signal type toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Signal:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
              <button
                onClick={() => setSignalType('sinusoidal')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  signalType === 'sinusoidal'
                    ? 'bg-engineering-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                Sinusoidal
              </button>
              <button
                onClick={() => setSignalType('step')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  signalType === 'step'
                    ? 'bg-engineering-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                Step
              </button>
            </div>
          </div>

          {/* Sliders grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Line length */}
            <label className="block space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Line length
                </span>
                <span className="text-xs font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
                  {lineLength.toFixed(1)} m
                </span>
              </div>
              <input
                type="range"
                aria-label="Line length"
                min={0.1}
                max={2.0}
                step={0.1}
                value={lineLength}
                onChange={(e) => setLineLength(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0.1 m</span>
                <span>1.0 m</span>
                <span>2.0 m</span>
              </div>
            </label>

            {/* Z0 */}
            <label className="block space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Z&#x2080; (characteristic)
                </span>
                <span className="text-xs font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
                  {Z0} &Omega;
                </span>
              </div>
              <input
                type="range"
                aria-label="Z0 characteristic impedance"
                min={10}
                max={200}
                step={1}
                value={Z0}
                onChange={(e) => setZ0(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>10 &Omega;</span>
                <span>100 &Omega;</span>
                <span>200 &Omega;</span>
              </div>
            </label>

            {/* ZL with open toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Z&#x2097; (load)
                </span>
                <span className="text-xs font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
                  {isOpen ? '\u221E (Open)' : `${ZLValue} \u03A9`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={1}
                  value={ZLValue}
                  disabled={isOpen}
                  onChange={(e) => setZLValue(parseInt(e.target.value, 10))}
                  className="flex-1 accent-engineering-blue-600 disabled:opacity-40"
                />
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => setIsOpen(e.target.checked)}
                    className="accent-engineering-blue-600"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Open
                  </span>
                </label>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0 &Omega;</span>
                <span>250 &Omega;</span>
                <span>500 &Omega;</span>
              </div>
            </div>

            {/* Zs */}
            <label className="block space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Z&#x209B; (source)
                </span>
                <span className="text-xs font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
                  {Zs} &Omega;
                </span>
              </div>
              <input
                type="range"
                aria-label="Zs source impedance"
                min={10}
                max={200}
                step={1}
                value={Zs}
                onChange={(e) => setZs(parseInt(e.target.value, 10))}
                className="w-full accent-engineering-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>10 &Omega;</span>
                <span>100 &Omega;</span>
                <span>200 &Omega;</span>
              </div>
            </label>

            {/* Frequency (logarithmic) */}
            <label className="block space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Frequency
                </span>
                <span className="text-xs font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
                  {formatFrequency(frequency)}
                </span>
              </div>
              <input
                type="range"
                aria-label="Frequency"
                min={6}
                max={10}
                step={0.01}
                value={freqExp}
                onChange={(e) => setFreqExp(parseFloat(e.target.value))}
                className="w-full accent-engineering-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>1 MHz</span>
                <span>1 GHz</span>
                <span>10 GHz</span>
              </div>
            </label>

            {/* Wavelength display (read-only) */}
            <div className="flex flex-col justify-center space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Free-space wavelength &lambda;&#x2080;
              </span>
              <span className="text-sm font-mono font-bold text-engineering-blue-600 dark:text-engineering-blue-400">
                {formatWavelength(wavelength)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Line = {(lineLength / wavelength).toFixed(2)}&lambda;&#x2080;
              </span>
            </div>
          </div>

          {/* Numerical readouts */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadoutCard
              label="Reflection coeff. Γ"
              value={gamma.toFixed(4)}
            />
            <ReadoutCard
              label="|Γ| magnitude"
              value={gammaMag.toFixed(4)}
            />
            <ReadoutCard
              label="VSWR"
              value={isFinite(vswr) ? vswr.toFixed(2) : '\u221E'}
            />
            <ReadoutCard
              label="Wavelength λ"
              value={formatWavelength(wavelength)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -- Helper sub-component ------------------------------------------------ */

/** Props for the ReadoutCard helper. */
interface ReadoutCardProps {
  /** Label describing the quantity. */
  label: string;
  /** Formatted value string. */
  value: string;
}

/** Small card displaying a single computed quantity. */
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
