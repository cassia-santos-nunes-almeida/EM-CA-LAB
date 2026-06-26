import { useState, useCallback } from 'react';
import { useAnimationFrame } from '@em/hooks/useAnimationFrame';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { PlayControls } from '@em/components/common/PlayControls';
import { chargeY, fieldLinePoint, type ChargeMode, type ChargeParams } from './radiationMath';

/** Simulation light speed (px per frame): a kink crosses a ~700 px canvas in ~6 s. */
const C_SIM = 2;
/** Rendered oscillation wavelength is WAVELENGTH_SCALE / freq px (λ = 2π·cSim/ω). */
const WAVELENGTH_SCALE = 150;
/** Single-kick hop distance (px). */
const KICK_DIST = 40;
/** Single-kick duration (frames). */
const KICK_TAU = 15;
/** Number of field lines (one every 22.5°). */
const LINE_COUNT = 16;
/** Innermost sampled field-line radius (px). */
const R_MIN = 14;
/** Radial sampling step (px). */
const R_STEP = 4;

const MODES: { id: ChargeMode; label: string }[] = [
  { id: 'rest', label: 'Rest' },
  { id: 'kick', label: 'Single kick' },
  { id: 'oscillate', label: 'Oscillate' },
];

/**
 * Field-line-kink animation for the radiation mechanism (Thomson/Purcell
 * construction): 16 radial spokes anchored to the charge's RETARDED position,
 * so an accelerating charge launches transverse kinks that march outward at
 * the simulation light speed. All physics lives in ./radiationMath.
 */
export function RadiatingChargeSim() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const c = isDarkMode ? COLORS_DARK : COLORS;

  const [mode, setMode] = useState<ChargeMode>('oscillate');
  const [freq, setFreq] = useState(1);
  const [amp, setAmp] = useState(25);
  const [isPlaying, setIsPlaying] = useState(true);

  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
  const canvasTouchRef = useCanvasTouch(canvasRef);

  // Drawing only — the rAF loop inside useAnimationFrame reschedules
  // unconditionally, so a canvas revealed late by the PredictionGate (or
  // remounted) starts painting on its first available frame.
  const drawFrame = useCallback(
    (t: number) => {
      const frame = prepareFrame();
      if (!frame) return;
      const { ctx, width: w, height: h } = frame;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      const params: ChargeParams = {
        amp,
        omega: (freq * 2 * Math.PI * C_SIM) / WAVELENGTH_SCALE,
        kickDist: KICK_DIST,
        kickTau: KICK_TAU,
      };
      const rMax = Math.max(w, h);

      // Field lines: radial spokes anchored to the retarded position — the
      // transverse offsets ARE the kinks, marching outward at C_SIM.
      ctx.strokeStyle = c.E_FIELD;
      ctx.lineWidth = 2;
      for (let i = 0; i < LINE_COUNT; i++) {
        const theta = (i / LINE_COUNT) * Math.PI * 2;
        ctx.beginPath();
        for (let r = R_MIN; r <= rMax; r += R_STEP) {
          const { dx, dy } = fieldLinePoint(mode, t, r, theta, C_SIM, params);
          const x = cx + dx;
          const y = cy - dy;
          if (r === R_MIN) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Kick mode: faint guide circles bracketing the radiated shell — news of
      // the kick's start (outer) and end (inner), both travelling at C_SIM.
      if (mode === 'kick') {
        const rOuter = C_SIM * t;
        const rInner = Math.max(0, C_SIM * (t - KICK_TAU));
        ctx.strokeStyle = c.TEXT_MUTED;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (const r of [rOuter, rInner]) {
          if (r > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.setLineDash([]);
        if (rOuter > 0) {
          ctx.fillStyle = c.TEXT_MUTED;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('news of the kick — speed c', cx, cy - rOuter - 6);
        }
      }

      // The charge itself, at its CURRENT position (the distant field lags).
      const yQ = chargeY(mode, t, params);
      const chargePy = cy - yQ;
      ctx.fillStyle = c.E_FIELD;
      ctx.beginPath();
      ctx.arc(cx, chargePy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px sans';
      ctx.fillText('+', cx, chargePy + 1);
    },
    [mode, freq, amp, c, prepareFrame],
  );

  const { reset } = useAnimationFrame({ isPlaying, onFrame: drawFrame });

  const selectMode = (m: ChargeMode) => {
    setMode(m);
    reset(); // restart the clock so a fresh kick launches from t = 0
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex-grow min-h-[350px]">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {MODES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => selectMode(id)}
                aria-pressed={mode === id}
                className={`px-3 py-1 rounded text-xs font-bold border ${
                  mode === id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <canvas
            ref={canvasTouchRef}
            className="w-full h-full block"
            role="img"
            aria-label="Radiating charge field-line simulation showing kinks propagating outward"
          />
        </div>
        {mode === 'kick' && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inside the inner circle the field points at the NEW position; outside the outer it still
            points at the OLD one; the kink shell in between is the radiated pulse.
          </p>
        )}
      </div>
      <ControlPanel title="Charge Motion">
        <Slider
          label="Frequency"
          value={freq}
          min={0.5}
          max={3.0}
          step={0.1}
          unit=" (arb.)"
          onChange={setFreq}
          color="bg-purple-600"
        />
        <Slider
          label="Amplitude"
          value={amp}
          min={10}
          max={40}
          step={1}
          unit=" px"
          onChange={setAmp}
          color="bg-pink-600"
        />
        <PlayControls
          isPlaying={isPlaying}
          onToggle={() => setIsPlaying(!isPlaying)}
          onReset={reset}
        />
      </ControlPanel>
    </div>
  );
}
