import { useCallback, useRef, useState } from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { useCanvasSetup } from '@transmission/hooks/useCanvasSetup';
import { useAnimationFrame } from '@transmission/hooks/useAnimationFrame';

/* ── Subdivision stages ──────────────────────────────────────────── */

const STAGES = [1, 2, 4, 8, 16, 32] as const;


/** Props for the LadderAnimation component. */
export interface LadderAnimationProps {
  /** Total inductance of the ladder in henries (default 1 uH). */
  totalL?: number;
  /** Total capacitance of the ladder in farads (default 1 pF). */
  totalC?: number;
  /** Physical length of the ladder in metres (default 0.3 m). */
  length?: number;
  /** Additional CSS class names for the outermost container. */
  className?: string;
}

/* ── Unit formatting helper ──────────────────────────────────────── */

interface SiResult {
  value: number;
  prefix: string;
}

function toSi(val: number): SiResult {
  const prefixes: { threshold: number; prefix: string; divisor: number }[] = [
    { threshold: 1, prefix: '', divisor: 1 },
    { threshold: 1e-3, prefix: 'm', divisor: 1e-3 },
    { threshold: 1e-6, prefix: '\u00B5', divisor: 1e-6 },
    { threshold: 1e-9, prefix: 'n', divisor: 1e-9 },
    { threshold: 1e-12, prefix: 'p', divisor: 1e-12 },
    { threshold: 1e-15, prefix: 'f', divisor: 1e-15 },
  ];
  for (const p of prefixes) {
    if (Math.abs(val) >= p.threshold * 0.999) {
      return { value: val / p.divisor, prefix: p.prefix };
    }
  }
  return { value: val * 1e15, prefix: 'f' };
}

function formatValue(val: number, unit: string): string {
  const si = toSi(val);
  const digits = si.value >= 100 ? 1 : si.value >= 10 ? 2 : 3;
  return `${si.value.toFixed(digits)} ${si.prefix}${unit}`;
}

/* ── Detect dark mode ────────────────────────────────────────────── */

function isDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

/* ── Drawing helpers ─────────────────────────────────────────────── */

/**
 * Draw a coil (inductor) symbol centred at (cx, cy) with the given width and height.
 * The coil is drawn as a series of arcs resembling a classic inductor schematic symbol.
 */
function drawInductor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  dark: boolean,
) {
  const bumps = 4;
  const bumpW = width / bumps;
  const startX = cx - width / 2;
  const amplitude = height / 2;

  ctx.strokeStyle = dark ? '#93c5fd' : '#1e40af';
  ctx.lineWidth = Math.max(1.5, Math.min(2.5, width / 20));
  ctx.beginPath();
  for (let i = 0; i < bumps; i++) {
    const bx = startX + i * bumpW;
    ctx.arc(bx + bumpW / 2, cy, Math.min(bumpW / 2, amplitude), Math.PI, 0, false);
  }
  ctx.stroke();
}

/**
 * Draw a capacitor symbol centred at (cx, cy) with the given plate width and gap.
 */
function drawCapacitor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  plateWidth: number,
  gap: number,
  dark: boolean,
) {
  const halfGap = gap / 2;
  const halfPlate = plateWidth / 2;

  ctx.strokeStyle = dark ? '#93c5fd' : '#1e40af';
  ctx.lineWidth = Math.max(1.5, Math.min(2.5, plateWidth / 12));

  // Left plate
  ctx.beginPath();
  ctx.moveTo(cx - halfGap, cy - halfPlate);
  ctx.lineTo(cx - halfGap, cy + halfPlate);
  ctx.stroke();

  // Right plate
  ctx.beginPath();
  ctx.moveTo(cx + halfGap, cy - halfPlate);
  ctx.lineTo(cx + halfGap, cy + halfPlate);
  ctx.stroke();
}

/* ── Main component ──────────────────────────────────────────────── */

/**
 * Animated LC ladder network that progressively subdivides from a single section
 * to a continuous transmission line, demonstrating the transition from lumped
 * to distributed circuit models.
 *
 * Uses HTML5 Canvas with requestAnimationFrame for smooth 60 fps rendering.
 */
export function LadderAnimation({
  totalL = 1e-6,
  totalC = 1e-12,
  length: lineLength = 0.3,
  className,
}: LadderAnimationProps) {
  /* ── State ─────────────────────────────────────────────────────── */

  /** Index into STAGES; value >= STAGES.length means continuous mode. */
  const [stageIndex, setStageIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  /** Animation time reference (seconds). */
  const timeRef = useRef(0);
  /** Timestamp of the last stage advance while auto-playing. */
  const lastAdvanceRef = useRef(0);

  const { canvasRef, prepareFrame } = useCanvasSetup();
  const containerRef = useRef<HTMLDivElement>(null);

  const isContinuous = stageIndex >= STAGES.length;
  const N = isContinuous ? Infinity : STAGES[stageIndex];

  /* ── Derived quantities ────────────────────────────────────────── */

  const Lprime = totalL / lineLength; // H/m
  const Cprime = totalC / lineLength; // F/m
  const waveSpeed = 1 / Math.sqrt(Lprime * Cprime); // m/s

  /* ── Auto-play logic ───────────────────────────────────────────── */

  const advanceStage = useCallback(() => {
    setStageIndex((prev) => {
      if (prev >= STAGES.length) return prev; // already continuous
      return prev + 1;
    });
  }, []);

  /* ── Render loop ───────────────────────────────────────────────── */

  useAnimationFrame(({ dt }) => {
    const frame = prepareFrame();
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;
    const dark = isDark();

    // --- Clear ---
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = dark ? '#1e293b' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // --- Layout constants ---
    const margin = 40;
    const railY = h * 0.38; // top rail vertical centre
    const groundY = h * 0.72; // bottom rail (ground)
    const railLeft = margin;
    const railRight = w - margin;
    const railW = railRight - railLeft;

    const wireColor = dark ? '#94a3b8' : '#475569';

    const currentStageIdx = stageIndex;
    const continuous = currentStageIdx >= STAGES.length;
    const sections = continuous ? 64 : STAGES[currentStageIdx]; // draw 64 sections for continuous visual

    if (continuous) {
      // ── Continuous mode: draw a smooth line with traveling sinusoidal wave ──

      // Top rail as the transmission line
      ctx.strokeStyle = dark ? '#60a5fa' : '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const freq = 3; // cycles across the line
      const speed = 0.8; // normalised canvas units per second
      const amplitude = (groundY - railY) * 0.3;
      const midY = (railY + groundY) / 2;

      for (let px = 0; px <= railW; px++) {
        const x = railLeft + px;
        const phase = (px / railW) * freq * 2 * Math.PI - timeRef.current * speed * 2 * Math.PI;
        const y = midY + amplitude * Math.sin(phase);
        if (px === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Ground reference line
      ctx.strokeStyle = dark ? 'rgba(148,163,184,0.3)' : 'rgba(71,85,105,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(railLeft, midY);
      ctx.lineTo(railRight, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = dark ? '#cbd5e1' : '#334155';
      ctx.textAlign = 'center';
      ctx.fillText('Continuous transmission line', w / 2, h * 0.12);

      ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = dark ? '#60a5fa' : '#2563eb';
      ctx.fillText('V(x,t) = V\u207A sin(\u03C9t \u2212 \u03B2x)', w / 2, h * 0.92);

      // Arrow showing direction of wave travel
      const arrowY = midY - amplitude - 18;
      ctx.strokeStyle = dark ? '#fbbf24' : '#d97706';
      ctx.fillStyle = dark ? '#fbbf24' : '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 30, arrowY);
      ctx.lineTo(w / 2 + 30, arrowY);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(w / 2 + 30, arrowY);
      ctx.lineTo(w / 2 + 22, arrowY - 4);
      ctx.lineTo(w / 2 + 22, arrowY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('wave propagation', w / 2, arrowY - 7);
    } else {
      // ── Discrete LC ladder mode ──

      const sectionW = railW / sections;

      // Component sizing: shrink as sections increase, with min sizes
      const inductorW = Math.max(8, Math.min(sectionW * 0.6, 60));
      const inductorH = Math.max(4, Math.min(18, 200 / sections));
      const capPlateW = Math.max(4, Math.min(16, 120 / sections));
      const capGap = Math.max(2, Math.min(8, 60 / sections));

      // Top rail (series inductors + wires)
      for (let i = 0; i < sections; i++) {
        const sx = railLeft + i * sectionW;
        const ex = sx + sectionW;
        const midX = sx + sectionW / 2;

        // Wire from section start to inductor
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, railY);
        ctx.lineTo(midX - inductorW / 2, railY);
        ctx.stroke();

        // Inductor
        drawInductor(ctx, midX, railY, inductorW, inductorH, dark);

        // Wire from inductor to junction point
        ctx.strokeStyle = wireColor;
        ctx.beginPath();
        ctx.moveTo(midX + inductorW / 2, railY);
        ctx.lineTo(ex, railY);
        ctx.stroke();

        // Junction dot at the right end of this section (capacitor tap point)
        const jx = ex;

        // Vertical wire from top rail down to capacitor
        const capCenterY = (railY + groundY) / 2;
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(jx, railY);
        ctx.lineTo(jx, capCenterY - capPlateW / 2 - capGap / 2);
        ctx.stroke();

        // Capacitor
        drawCapacitor(ctx, jx, capCenterY, capPlateW, capGap, dark);

        // Wire from capacitor to ground rail
        ctx.strokeStyle = wireColor;
        ctx.beginPath();
        ctx.moveTo(jx, capCenterY + capPlateW / 2 + capGap / 2);
        ctx.lineTo(jx, groundY);
        ctx.stroke();

        // Junction dots
        if (sections <= 16) {
          ctx.fillStyle = dark ? '#60a5fa' : '#2563eb';
          ctx.beginPath();
          ctx.arc(jx, railY, 2.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(jx, groundY, 2.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Ground rail
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(railLeft, groundY);
      ctx.lineTo(railRight, groundY);
      ctx.stroke();

      // Input terminal dot
      ctx.fillStyle = dark ? '#60a5fa' : '#2563eb';
      ctx.beginPath();
      ctx.arc(railLeft, railY, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(railLeft, groundY, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Travelling voltage "pulse" along the top rail for stages > 1
      if (sections >= 2) {
        const travelFrac = (timeRef.current * 0.3) % 1.0;
        const waveX = railLeft + travelFrac * railW;
        const waveAmplitude = (groundY - railY) * 0.15;
        const waveWidth = railW * 0.25;

        ctx.strokeStyle = dark
          ? 'rgba(251,191,36,0.7)'
          : 'rgba(217,119,6,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let px = 0; px <= railW; px += 1) {
          const x = railLeft + px;
          const dist = x - waveX;
          const envelope = Math.exp(-(dist * dist) / (2 * waveWidth * waveWidth / 9));
          const y = railY - waveAmplitude * Math.sin((dist / waveWidth) * 4 * Math.PI) * envelope;
          if (px === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Labels
      ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = dark ? '#cbd5e1' : '#334155';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${sections} LC section${sections > 1 ? 's' : ''}`,
        w / 2,
        h * 0.12,
      );

      // Component labels for small section counts
      if (sections <= 4) {
        ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = dark ? '#94a3b8' : '#64748b';
        const lPerSection = toSi(totalL / sections);
        const cPerSection = toSi(totalC / sections);
        ctx.fillText(
          `L = ${lPerSection.value.toFixed(1)} ${lPerSection.prefix}H each`,
          w / 2,
          h * 0.92,
        );
        ctx.fillText(
          `C = ${cPerSection.value.toFixed(1)} ${cPerSection.prefix}F each`,
          w / 2,
          h * 0.97,
        );
      }
    }

    // Advance time
    timeRef.current += dt;

    // Auto-advance stage while playing (every 2 seconds)
    if (playing) {
      if (timeRef.current - lastAdvanceRef.current >= 2.0) {
        lastAdvanceRef.current = timeRef.current;
        advanceStage();
      }
    }
  }, true);

  /* ── Control handlers ──────────────────────────────────────────── */

  const handlePlayPause = () => {
    if (!playing) {
      lastAdvanceRef.current = timeRef.current;
    }
    setPlaying((p) => !p);
  };

  const handleStep = () => {
    setPlaying(false);
    advanceStage();
  };

  const handleReset = () => {
    setPlaying(false);
    setStageIndex(0);
    timeRef.current = 0;
    lastAdvanceRef.current = 0;
  };

  /* ── Readout values ────────────────────────────────────────────── */

  const nDisplay = isContinuous ? '\u221E' : `${N}`;
  const lPerSection = isContinuous ? '\u2192 0' : formatValue(totalL / N, 'H');
  const cPerSection = isContinuous ? '\u2192 0' : formatValue(totalC / N, 'F');
  const waveSpeedDisplay = `${(waveSpeed / 1e6).toFixed(2)} \u00D7 10\u2076 m/s`;

  /* ── UI ────────────────────────────────────────────────────────── */

  return (
    <div className={cn('', className)}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="w-full aspect-[2.5/1] min-h-[220px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            aria-label="LC ladder network animation showing progressive subdivision from lumped to distributed"
          />
        </div>

        {/* Controls + Readouts */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-4">
          {/* Transport controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                'bg-engineering-blue-600 text-white hover:bg-engineering-blue-700',
              )}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </button>

            <button
              onClick={handleStep}
              disabled={isContinuous}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                isContinuous
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600',
              )}
              aria-label="Step to next subdivision"
            >
              <SkipForward className="w-4 h-4" />
              Step
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>

            {/* Stage indicator */}
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-mono">
              Stage {Math.min(stageIndex + 1, STAGES.length + 1)} / {STAGES.length + 1}
            </span>
          </div>

          {/* Readout cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadoutCard label="Sections (N)" value={nDisplay} />
            <ReadoutCard label="L per section" value={lPerSection} />
            <ReadoutCard label="C per section" value={cPerSection} />
            <ReadoutCard
              label="Wave speed v"
              value={waveSpeedDisplay}
              highlight
            />
          </div>

          {/* Constant wave speed callout */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            v = 1/&radic;(L&prime;&middot;C&prime;) where L&prime; = L<sub>total</sub>/length,
            C&prime; = C<sub>total</sub>/length. Subdividing changes N but
            <strong className="text-slate-600 dark:text-slate-300"> not </strong>
            the per-unit-length values, so wave speed stays constant.
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
  /** Whether to visually highlight this card (e.g. wave speed stays constant). */
  highlight?: boolean;
}

/** Small card displaying a computed quantity. */
function ReadoutCard({ label, value, highlight = false }: ReadoutCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg px-3 py-2',
        highlight
          ? 'bg-engineering-blue-50 dark:bg-engineering-blue-900/20 ring-1 ring-engineering-blue-200 dark:ring-engineering-blue-800'
          : 'bg-slate-50 dark:bg-slate-700/50',
      )}
    >
      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p
        className={cn(
          'text-sm font-bold font-mono',
          highlight
            ? 'text-engineering-blue-700 dark:text-engineering-blue-300'
            : 'text-slate-900 dark:text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}
