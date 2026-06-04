import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { COLORS, COLORS_DARK, WaveViewMode, type WaveViewModeType } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { EquationBox } from '@em/components/common/EquationBox';
import { PlayControls } from '@em/components/common/PlayControls';
import { HintBox } from '@em/components/common/HintBox';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { PhysicsChart } from '@em/components/common/PhysicsChart';
import { FigureImage } from '@shared/components/common/FigureImage';
import type { Challenge, EMWaveState, QuizQuestion } from '@em/types/index';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';

const POINTS = 200;

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_TRIAD: QuizQuestion = {
  question:
    'In a plane electromagnetic wave propagating in the +z direction, the electric field oscillates in the x direction. In which direction does the magnetic field oscillate?',
  options: ['+z direction', '−z direction', '+y direction', '+x direction'],
  correctIndex: 2,
  explanation:
    'In an EM wave, E, B, and the propagation direction k are mutually perpendicular and form a right-handed triad. With E along x and k along z, B must oscillate along the y direction (x̂ × ŷ = ẑ).',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'In an EM wave, E, B, and the propagation direction are all mutually perpendicular. If E is along x and the wave travels along z, what direction is left for B?' },
    { tier: 2, label: 'Procedural hint', content: 'E × B must point in the propagation direction (Poynting vector). If E = E₀ x̂ and k = ẑ, then B must be along ŷ so that x̂ × ŷ = ẑ.' },
    { tier: 3, label: 'Show worked step', content: 'Propagation direction: k̂ = ẑ. E along x̂. For right-handed triad: E × B ∝ k̂, so x̂ × B̂ = ẑ, which means B̂ = ŷ. B oscillates in the +y direction — option C.' },
  ],
};

const Q_MEDIUM_SPEED: QuizQuestion = {
  question:
    'The speed of light in vacuum is given by c = 1/√(μ₀ε₀). If light enters a medium with refractive index n = 1.5, its speed becomes:',
  options: ['1.5c', 'c', 'c/1.5 ≈ 2 × 10⁸ m/s', 'c/1.5² ≈ 1.33 × 10⁸ m/s'],
  correctIndex: 2,
  explanation:
    'The speed of light in a medium is v = c/n. For n = 1.5, v = (3 × 10⁸)/1.5 = 2 × 10⁸ m/s. The refractive index quantifies how much slower light travels in the medium compared to vacuum.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'The refractive index tells you how much slower light travels in the medium. A higher n means slower light.' },
    { tier: 2, label: 'Procedural hint', content: 'The relationship is v = c/n. Plug in n = 1.5 and c = 3 × 10⁸ m/s.' },
    { tier: 3, label: 'Show worked step', content: 'v = c/n = (3 × 10⁸)/1.5 = 2 × 10⁸ m/s — option C.' },
  ],
};

const Q_PHASOR: QuizQuestion = {
  question:
    'In an AC circuit, voltage and current phasors are represented as rotating vectors. If the current lags the voltage by 90°, the circuit element is:',
  options: ['A pure resistor', 'A pure capacitor', 'A pure inductor', 'An open circuit'],
  correctIndex: 2,
  explanation:
    "In a pure inductor, the voltage leads the current by 90° (equivalently, current lags voltage by 90°). This phase relationship arises because the inductor's back-EMF is proportional to di/dt, introducing a quarter-cycle delay.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Remember the mnemonic "ELI the ICE man": E leads I in an inductor (L), I leads E in a capacitor (C).' },
    { tier: 2, label: 'Procedural hint', content: 'For an inductor: V = L di/dt. If i = sin(ωt), then V = Lω cos(ωt) = Lω sin(ωt + 90°). Voltage leads current by 90°, i.e., current lags voltage by 90°.' },
    { tier: 3, label: 'Show worked step', content: 'Current lags voltage by 90° → "ELI" → E leads I in an inductor (L). Resistor: 0° phase. Capacitor: current leads voltage by 90°. The element is a pure inductor — option C.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Wave Propagation and Phasors`,
  description: `Explore how the E and B fields of an electromagnetic wave relate to one another and how a medium changes the wave, then connect the same sinusoidal physics to AC voltage/current phasors and power transfer — all using the section's view selector and control sliders.`,
  instructions: [
    `Click the "EM Wave 3D" button (top-left of the canvas), then the "EM Wave 2D" button. In 3D note that the E field oscillates along the y (E) axis while the B field oscillates along the z (B) axis, both perpendicular to the horizontal propagation (x) direction; in 2D confirm E and B stay in step (in phase) and the "S (Poynting)" arrow always points forward along +x.`,
    `Drag the "Frequency" slider across its range (0.5 to 3.0, arbitrary units) and watch the on-canvas wavelength marker (the labelled λ bracket). Note that raising frequency shortens the wavelength while the wave speed (set by the medium) is unchanged.`,
    `Open the "Propagation Medium (n)" dropdown and switch from "Vacuum (n=1.00)" to "Water (n=1.33)" then "Glass (n=1.50)". Observe the wave slow down and the wavelength shrink as n increases, and check the Velocity / Wavelength lines in the equation box (v = c/n, λ = λ₀/n) — confirm the frequency you set has not changed.`,
    `Click the "AC Phasors" button. Drag the red V phasor tip and the amber I phasor tip around the dial (or use the "V Phase" and "I Phase" sliders), and watch both rotate together while keeping their fixed angular separation — read the live "Δφ = …°" and the "V leads I" / "V lags I" label.`,
    `With the phasors in phase (Δφ ≈ 0°), note the purple P(t) power curve sits mostly positive and the equation box shows the largest P_avg = ½V₀I₀cos(Δφ). Then set the phase difference to 90° and observe P_avg collapse toward zero — the cos(Δφ) power factor is doing the work.`,
    `Sweep Δφ between 0° and 90° (and try 180°) and conclude how the time-averaged power depends on cos(Δφ): maximum when in phase, zero at 90°, and negative-leaning when the phasors oppose.`,
  ],
  hint: `The same sinusoid drives both halves of this section: a faster-oscillating or denser medium reshapes the wave (v = c/n, λ shrinks, f fixed), and the angle between two rotating phasors sets the AC power through the cos(Δφ) factor — line up the phasors and power peaks, cross them at 90° and power vanishes.`,
};

export function EMWaveSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const c = isDarkMode ? COLORS_DARK : COLORS;

  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('em-wave');
  const onCheckHint = () => incrementHints('em-wave');

  const [viewMode, setViewMode] = useState<WaveViewModeType>(WaveViewMode.VIEW_3D);
  const [state, setState] = useState<EMWaveState>({
    frequency: 1,
    amplitude: 40,
    speed: 1,
    vAmplitude: 80,
    iAmplitude: 60,
    vPhase: 0,
    iPhase: 0,
    isPlaying: true,
    refractiveIndex: 1.0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phasorSyncTimeRef = useRef<HTMLCanvasElement>(null);
  const phasorSyncPhasorRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationRef = useRef(0);
  const phasorSyncAnimRef = useRef(0);

  useCanvasTouch(canvasRef);

  // Phasor drag state
  const draggingPhasor = useRef<'v' | 'i' | null>(null);
  const phasorCenter = useRef({ x: 120, y: 0 });
  const phasorTimeAngle = useRef(0);

  const formatPhase = (phase: number): string => {
    if (Math.abs(phase) < 0.1) return '';
    return phase > 0 ? `+ ${phase.toFixed(0)}\\degree` : `- ${Math.abs(phase).toFixed(0)}\\degree`;
  };

  const drawAxisSystemLocal = useCallback((
    ctx: CanvasRenderingContext2D,
    startX: number, endX: number, y: number,
    xLabel: string | null, yLabel: string | null
  ) => {
    ctx.strokeStyle = c.AXIS;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    ctx.fillStyle = c.AXIS;
    ctx.beginPath();
    ctx.moveTo(endX, y);
    ctx.lineTo(endX - 8, y - 4);
    ctx.lineTo(endX - 8, y + 4);
    ctx.fill();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = c.TEXT_MAIN;
    ctx.textAlign = 'left';
    if (xLabel) ctx.fillText(xLabel, endX + 10, y + 4);
    if (yLabel) {
      ctx.strokeStyle = c.AXIS;
      ctx.beginPath();
      const axisH = 110;
      ctx.moveTo(startX, y + axisH);
      ctx.lineTo(startX, y - axisH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX, y - axisH);
      ctx.lineTo(startX - 4, y - axisH + 8);
      ctx.lineTo(startX + 4, y - axisH + 8);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillText(yLabel, startX, y - axisH - 10);
    }
  }, [c]);

  const draw3DAxisArrows = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = c.AXIS;
    ctx.lineWidth = 1;
    const axisLen = 110;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - axisLen);
    ctx.stroke();
    ctx.fillStyle = c.E_FIELD;
    ctx.fillText('y (E)', x + 5, y - axisLen);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 50, y + 60);
    ctx.stroke();
    ctx.fillStyle = c.B_FIELD;
    ctx.fillText('z (B)', x - 60, y + 60);
  }, [c]);

  const drawVIView = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number, height: number,
    t: number, omega: number
  ) => {
    const centerY = height / 2;
    const startX = 250;
    const endX = width - 20;

    // Axes for waveform area
    ctx.strokeStyle = c.AXIS;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    ctx.lineTo(endX, centerY);
    const axisH = 110;
    ctx.moveTo(startX, centerY + axisH);
    ctx.lineTo(startX, centerY - axisH);
    ctx.stroke();

    ctx.fillStyle = c.TEXT_MAIN;
    ctx.font = '10px sans-serif';
    ctx.fillText('Time (t)', endX - 30, centerY + 15);
    ctx.fillText('Amplitude', startX + 5, centerY - axisH - 5);

    // Phasor diagram
    const phasorCX = 120, phasorCY = centerY, phasorRadius = 70;
    phasorCenter.current = { x: phasorCX, y: phasorCY };
    ctx.beginPath();
    ctx.strokeStyle = c.GRID;
    ctx.arc(phasorCX, phasorCY, phasorRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = c.TEXT_MUTED;
    ctx.textAlign = 'center';
    ctx.fillText('0 rad / 0°', phasorCX + phasorRadius + 30, phasorCY + 3);

    const radV = (state.vPhase * Math.PI) / 180;
    const radI = (state.iPhase * Math.PI) / 180;
    const timeAngle = omega * t * 0.02 * state.speed;
    phasorTimeAngle.current = timeAngle;

    // Helper: draw arrowhead at tip of phasor
    const drawPhasorArrow = (tipX: number, tipY: number, angle: number, color: string) => {
      const headLen = 10;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - headLen * Math.cos(angle - 0.4), tipY + headLen * Math.sin(angle - 0.4));
      ctx.lineTo(tipX - headLen * Math.cos(angle + 0.4), tipY + headLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    // Helper: draw draggable handle circle at phasor tip
    const drawHandle = (tipX: number, tipY: number, active: boolean, color: string) => {
      ctx.beginPath();
      ctx.arc(tipX, tipY, active ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = active ? 0.5 : 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    // V phasor arrow
    const vAngle = timeAngle + radV;
    const vPx = phasorCX + state.vAmplitude * Math.cos(vAngle);
    const vPy = phasorCY - state.vAmplitude * Math.sin(vAngle);
    ctx.beginPath();
    ctx.strokeStyle = c.E_FIELD;
    ctx.lineWidth = 3;
    ctx.moveTo(phasorCX, phasorCY);
    ctx.lineTo(vPx, vPy);
    ctx.stroke();
    drawPhasorArrow(vPx, vPy, vAngle, c.E_FIELD);
    drawHandle(vPx, vPy, draggingPhasor.current === 'v', c.E_FIELD);

    // I phasor arrow
    const iAngle = timeAngle + radI;
    const iPx = phasorCX + state.iAmplitude * Math.cos(iAngle);
    const iPy = phasorCY - state.iAmplitude * Math.sin(iAngle);
    ctx.beginPath();
    ctx.strokeStyle = c.CURRENT;
    ctx.lineWidth = 3;
    ctx.moveTo(phasorCX, phasorCY);
    ctx.lineTo(iPx, iPy);
    ctx.stroke();
    drawPhasorArrow(iPx, iPy, iAngle, c.CURRENT);
    drawHandle(iPx, iPy, draggingPhasor.current === 'i', c.CURRENT);

    // Drag hint (only when not dragging)
    if (!draggingPhasor.current) {
      ctx.fillStyle = c.TEXT_MUTED;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag phasor tips', phasorCX, phasorCY + phasorRadius + 50);
    }

    ctx.lineWidth = 2;

    // V(t) waveform
    ctx.beginPath();
    for (let x = 0; x < (endX - startX); x++) {
      const ct = t * state.speed + x * 0.05;
      const gx = startX + x;
      const vVal = state.vAmplitude * Math.sin(omega * 0.02 * ct + radV);
      const vY = centerY - vVal;
      if (x === 0) ctx.moveTo(gx, vY); else ctx.lineTo(gx, vY);
    }
    ctx.strokeStyle = c.E_FIELD;
    ctx.stroke();

    // I(t) waveform
    ctx.beginPath();
    for (let x = 0; x < (endX - startX); x++) {
      const ct = t * state.speed + x * 0.05;
      const gx = startX + x;
      const iVal = state.iAmplitude * Math.sin(omega * 0.02 * ct + radI);
      const iY = centerY - iVal;
      if (x === 0) ctx.moveTo(gx, iY); else ctx.lineTo(gx, iY);
    }
    ctx.strokeStyle = c.CURRENT;
    ctx.stroke();

    // Phase Lead/Lag Logic
    let diff = (state.vPhase - state.iPhase) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    let leadLagText = 'In Phase';
    if (diff > 0.1) leadLagText = 'V leads I';
    else if (diff < -0.1) leadLagText = 'V lags I';

    // Draw Phase Arc on Phasor Diagram
    if (Math.abs(diff) > 1) {
      ctx.beginPath();
      ctx.strokeStyle = c.TEXT_MAIN;
      ctx.lineWidth = 1;
      ctx.arc(phasorCX, phasorCY, 40, -iAngle, -vAngle, diff > 0);
      ctx.stroke();
    }
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = c.TEXT_MAIN;
    ctx.textAlign = 'center';
    ctx.fillText(leadLagText, phasorCX, phasorCY + phasorRadius + 20);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = c.TEXT_MUTED;
    ctx.fillText(`Δφ = ${Math.abs(diff).toFixed(0)}°`, phasorCX, phasorCY + phasorRadius + 35);

    // Power Curve Fill & Stroke
    let maxP = 0;
    let maxPx = 0;
    ctx.beginPath();
    ctx.fillStyle = `${c.POWER}20`;
    for (let x = 0; x < (endX - startX); x++) {
      const ct = t * state.speed + x * 0.05;
      const gx = startX + x;
      const vVal = state.vAmplitude * Math.sin(omega * 0.02 * ct + radV);
      const iVal = state.iAmplitude * Math.sin(omega * 0.02 * ct + radI);
      const pVal = (vVal * iVal) / 100;
      const pY = centerY - pVal;
      if (Math.abs(pVal) > maxP) { maxP = Math.abs(pVal); maxPx = gx; }
      if (x === 0) ctx.moveTo(gx, centerY);
      ctx.lineTo(gx, pY);
    }
    ctx.lineTo(endX, centerY);
    ctx.fill();

    // Draw Stroke for Power
    ctx.beginPath();
    ctx.strokeStyle = c.POWER;
    ctx.lineWidth = 1;
    for (let x = 0; x < (endX - startX); x++) {
      const ct = t * state.speed + x * 0.05;
      const gx = startX + x;
      const vVal = state.vAmplitude * Math.sin(omega * 0.02 * ct + radV);
      const iVal = state.iAmplitude * Math.sin(omega * 0.02 * ct + radI);
      const pVal = (vVal * iVal) / 100;
      const pY = centerY - pVal;
      if (x === 0) ctx.moveTo(gx, pY); else ctx.lineTo(gx, pY);
    }
    ctx.stroke();

    if (maxP > 10) {
      ctx.fillStyle = c.POWER;
      ctx.textAlign = 'center';
      ctx.fillText('P(t)', maxPx, centerY - maxP - 10);
    }

    // Phase Diff Dimension Line (Right Graph)
    const periodPx = 1000 / state.frequency;
    const periodY = centerY + 120;
    const pStart = startX;
    const pEnd = startX + periodPx;
    if (pEnd < endX) {
      ctx.strokeStyle = c.TEXT_MAIN;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pStart, periodY);
      ctx.lineTo(pEnd, periodY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pStart, periodY - 4);
      ctx.lineTo(pStart, periodY + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pEnd, periodY - 4);
      ctx.lineTo(pEnd, periodY + 4);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = c.TEXT_MAIN;
      ctx.fillText('T (Period)', pStart + periodPx / 2, periodY + 15);
    }

    // Amplitude markers
    const vAmpX = startX + 50;
    ctx.strokeStyle = c.TEXT_MUTED;
    ctx.beginPath();
    ctx.moveTo(vAmpX, centerY);
    ctx.lineTo(vAmpX, centerY - state.vAmplitude);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vAmpX - 3, centerY - state.vAmplitude);
    ctx.lineTo(vAmpX + 3, centerY - state.vAmplitude);
    ctx.stroke();
    ctx.fillStyle = c.TEXT_MAIN;
    ctx.textAlign = 'left';
    ctx.fillText(`V_peak=${state.vAmplitude}`, vAmpX + 5, centerY - state.vAmplitude / 2);

    // Visual Phase Difference Logic
    if (Math.abs(diff) > 1) {
      const pixelPhaseRate = omega * 0.001;
      const globalTime = t * state.speed;
      const currentPhaseAtStart = omega * 0.02 * globalTime + radV;
      let relativePhaseToPeak = (Math.PI / 2) - (currentPhaseAtStart % (2 * Math.PI));
      if (relativePhaseToPeak < 0) relativePhaseToPeak += 2 * Math.PI;
      const distToFirstPeak = relativePhaseToPeak / pixelPhaseRate;
      let vPeakX = startX + distToFirstPeak;
      if (vPeakX < startX + 50) vPeakX += periodPx;
      if (vPeakX > endX - 50) vPeakX -= periodPx;
      const iPeakX = vPeakX + (diff / 360) * periodPx;

      if (vPeakX > startX && vPeakX < endX) {
        const dimY = centerY - state.vAmplitude - 25;
        ctx.strokeStyle = c.TEXT_MAIN;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vPeakX, dimY);
        ctx.lineTo(iPeakX, dimY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(vPeakX, dimY - 3);
        ctx.lineTo(vPeakX, dimY + 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(iPeakX, dimY - 3);
        ctx.lineTo(iPeakX, dimY + 3);
        ctx.stroke();
        ctx.fillStyle = c.TEXT_MAIN;
        ctx.textAlign = 'center';
        ctx.fillText('Δφ', (vPeakX + iPeakX) / 2, dimY - 5);
      }
    }
  }, [state, c]);

  const drawWave = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    const t = timeRef.current;
    const omega = 2 * Math.PI * state.frequency;
    const k = (2 * Math.PI * state.frequency * state.refractiveIndex) / 300;
    const bVisualAmplitude = state.amplitude * state.refractiveIndex;

    if (viewMode === WaveViewMode.VIEW_VI) {
      drawVIView(ctx, width, height, t, omega);
      return;
    }

    const startX = 60, endX = width - 40, drawWidth = endX - startX;

    if (viewMode === WaveViewMode.VIEW_2D) {
      const cyE = height * 0.25, cyB = height * 0.75;

      // Separator line
      ctx.strokeStyle = c.GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, height / 2);
      ctx.lineTo(width - 20, height / 2);
      ctx.stroke();

      // E-field axis and wave
      drawAxisSystemLocal(ctx, startX, endX, cyE, 'x', 'E (y)');
      ctx.lineWidth = 3;
      ctx.strokeStyle = c.E_FIELD;
      ctx.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const x = startX + (i / POINTS) * drawWidth;
        const ph = k * ((i / POINTS) * drawWidth) - omega * t * 0.02 * state.speed;
        const val = state.amplitude * Math.sin(ph);
        const y = cyE - val;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Amplitude marker
      const ampX = startX + 40;
      ctx.strokeStyle = c.TEXT_MUTED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ampX, cyE);
      ctx.lineTo(ampX, cyE - state.amplitude);
      ctx.stroke();
      ctx.fillStyle = c.TEXT_MAIN;
      ctx.textAlign = 'left';
      ctx.font = '10px sans-serif';
      ctx.fillText(`A=${state.amplitude}`, ampX + 2, cyE - state.amplitude / 2);
      ctx.beginPath();
      ctx.moveTo(ampX - 3, cyE - state.amplitude);
      ctx.lineTo(ampX + 3, cyE - state.amplitude);
      ctx.stroke();

      // Wavelength marker
      const lambdaPx = 300 / (state.frequency * state.refractiveIndex);
      const waveY = cyE + state.amplitude + 25;
      const waveStart = startX + 100;
      const waveEnd = waveStart + lambdaPx;
      if (waveEnd < endX) {
        ctx.strokeStyle = c.TEXT_MAIN;
        ctx.beginPath();
        ctx.moveTo(waveStart, waveY);
        ctx.lineTo(waveEnd, waveY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(waveStart, waveY - 4);
        ctx.lineTo(waveStart, waveY + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(waveEnd, waveY - 4);
        ctx.lineTo(waveEnd, waveY + 4);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = c.TEXT_MAIN;
        ctx.fillText(`λ ≈ ${lambdaPx.toFixed(0)}px`, waveStart + lambdaPx / 2, waveY + 15);
      }

      // B-field axis and wave
      drawAxisSystemLocal(ctx, startX, endX, cyB, 'x', 'B (z)');
      ctx.lineWidth = 3;
      ctx.strokeStyle = c.B_FIELD;
      ctx.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const x = startX + (i / POINTS) * drawWidth;
        const ph = k * ((i / POINTS) * drawWidth) - omega * t * 0.02 * state.speed;
        const val = bVisualAmplitude * Math.sin(ph);
        const y = cyB - val;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // B-field symbols (dot/cross)
      ctx.fillStyle = c.B_FIELD;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= POINTS; i += 10) {
        const x = startX + (i / POINTS) * drawWidth;
        const ph = k * ((i / POINTS) * drawWidth) - omega * t * 0.02 * state.speed;
        const val = bVisualAmplitude * Math.sin(ph);
        if (Math.abs(val) > 5) {
          const symbol = val > 0 ? '⊙' : '⊗';
          ctx.fillText(symbol, x, cyB + (val > 0 ? 15 : -15));
        }
      }

      // Energy density bar: u ∝ E² + B² ∝ sin²(kx - ωt) at midpoint
      const midPh = k * (drawWidth / 2) - omega * t * 0.02 * state.speed;
      const sinVal = Math.sin(midPh);
      const uNorm = sinVal * sinVal; // u ∝ sin²
      const barY = height / 2 - 8;
      const barW = 120;
      ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
      ctx.fillRect(endX - barW - 10, barY - 4, barW + 8, 24);
      ctx.fillStyle = '#9333ea';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(endX - barW - 6, barY, barW * uNorm, 8);
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.TEXT_MUTED;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`u(x₀) ∝ E²+B² = ${uNorm.toFixed(2)}`, endX - 6, barY + 20);

      // Poynting vector arrow: S = (1/μ₀)(E×B), always in +x for forward wave
      ctx.fillStyle = '#9333ea';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      const sArrowY = barY - 14;
      const sLen = 40 * uNorm;
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(endX - barW - 6, sArrowY);
      ctx.lineTo(endX - barW - 6 + sLen, sArrowY);
      ctx.stroke();
      if (sLen > 5) {
        ctx.beginPath();
        ctx.moveTo(endX - barW - 6 + sLen, sArrowY);
        ctx.lineTo(endX - barW - 6 + sLen - 5, sArrowY - 3);
        ctx.lineTo(endX - barW - 6 + sLen - 5, sArrowY + 3);
        ctx.fill();
      }
      ctx.fillText('S (Poynting)', endX - barW - 6 + sLen + 4, sArrowY + 3);
    } else {
      // 3D View
      const centerY = height / 2;
      drawAxisSystemLocal(ctx, startX, endX, centerY, 'x', '');
      draw3DAxisArrows(ctx, startX, centerY);

      // Medium visualization
      if (state.refractiveIndex > 1) {
        ctx.fillStyle = `rgba(37, 99, 235, ${0.05 * state.refractiveIndex})`;
        ctx.fillRect(startX, 0, drawWidth, height);
        ctx.fillStyle = c.TEXT_MUTED;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Medium n=${state.refractiveIndex}`, endX - 10, height - 10);
      }

      // E-field (vertical component)
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.strokeStyle = c.E_FIELD;
      for (let i = 0; i <= POINTS; i++) {
        const x = startX + (i / POINTS) * drawWidth;
        const ph = k * ((i / POINTS) * drawWidth) - omega * t * 0.02 * state.speed;
        const val = state.amplitude * Math.sin(ph);
        const y = centerY - val;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        if (i % 8 === 0) {
          ctx.save();
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.2;
          ctx.moveTo(x, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.restore();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
      ctx.stroke();

      // B-field (perspective/depth component)
      ctx.beginPath();
      ctx.strokeStyle = c.B_FIELD;
      for (let i = 0; i <= POINTS; i++) {
        const x = startX + (i / POINTS) * drawWidth;
        const ph = k * ((i / POINTS) * drawWidth) - omega * t * 0.02 * state.speed;
        const val = bVisualAmplitude * Math.sin(ph);
        const drawX = x - val * 0.5;
        const drawY = centerY + val * 0.6;
        if (i === 0) ctx.moveTo(drawX, drawY); else ctx.lineTo(drawX, drawY);
        if (i % 8 === 0) {
          ctx.save();
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.2;
          ctx.moveTo(x, centerY);
          ctx.lineTo(drawX, drawY);
          ctx.stroke();
          ctx.restore();
          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
        }
      }
      ctx.stroke();
    }
  }, [state, viewMode, drawVIView, drawAxisSystemLocal, draw3DAxisArrows, c, isDarkMode]);

  // Animation loop (for 2D, 3D, V-I modes — skipped during Phasor Sync)
  useEffect(() => {
    if (viewMode === WaveViewMode.VIEW_PHASOR_SYNC) return;
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const parent = canvas.parentElement;
          if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
          }
          drawWave(ctx, canvas.width, canvas.height);
        }
      }
      if (state.isPlaying) timeRef.current += 1;
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [drawWave, state.isPlaying, viewMode]);

  // Phasor Sync view rendering
  useEffect(() => {
    if (viewMode !== WaveViewMode.VIEW_PHASOR_SYNC) return;
    const render = () => {
      const timeCvs = phasorSyncTimeRef.current;
      const phasorCvs = phasorSyncPhasorRef.current;
      if (!timeCvs || !phasorCvs) return;

      const timeCtx = timeCvs.getContext('2d');
      const phasorCtx = phasorCvs.getContext('2d');
      if (!timeCtx || !phasorCtx) return;

      // Size canvases to parent
      if (timeCvs.parentElement) {
        timeCvs.width = timeCvs.parentElement.clientWidth;
        timeCvs.height = timeCvs.parentElement.clientHeight;
      }
      if (phasorCvs.parentElement) {
        phasorCvs.width = phasorCvs.parentElement.clientWidth;
        phasorCvs.height = phasorCvs.parentElement.clientHeight;
      }

      const t = timeRef.current;
      const omega = 2 * Math.PI * state.frequency;
      const angle = omega * t * 0.02 * state.speed;

      // --- Time-domain canvas ---
      const tw = timeCvs.width, th = timeCvs.height;
      timeCtx.clearRect(0, 0, tw, th);
      if (isDarkMode) { timeCtx.fillStyle = '#0f172a'; timeCtx.fillRect(0, 0, tw, th); }

      const marginL = 50, marginR = 20, marginT = 30, marginB = 30;
      const drawW = tw - marginL - marginR;
      const midY = th / 2;

      // Axis
      timeCtx.strokeStyle = c.AXIS;
      timeCtx.lineWidth = 1.5;
      timeCtx.beginPath();
      timeCtx.moveTo(marginL, midY);
      timeCtx.lineTo(tw - marginR, midY);
      timeCtx.stroke();
      timeCtx.beginPath();
      timeCtx.moveTo(marginL, marginT);
      timeCtx.lineTo(marginL, th - marginB);
      timeCtx.stroke();

      // Labels
      timeCtx.fillStyle = c.TEXT_MAIN;
      timeCtx.font = '11px sans-serif';
      timeCtx.textAlign = 'center';
      timeCtx.fillText('t', tw - marginR + 10, midY + 4);
      timeCtx.textAlign = 'right';
      timeCtx.fillText('A', marginL - 8, marginT + 4);

      // Draw sinusoid
      const cycles = 3;
      const amp = (midY - marginT - 10) * (state.amplitude / 100);
      timeCtx.beginPath();
      timeCtx.strokeStyle = c.E_FIELD;
      timeCtx.lineWidth = 2.5;
      for (let i = 0; i <= POINTS; i++) {
        const frac = i / POINTS;
        const x = marginL + frac * drawW;
        const ph = frac * cycles * 2 * Math.PI - angle;
        const y = midY - amp * Math.sin(ph);
        if (i === 0) timeCtx.moveTo(x, y); else timeCtx.lineTo(x, y);
      }
      timeCtx.stroke();

      // "Now" line — fixed at 30% of the width
      const nowFrac = 0.3;
      const nowX = marginL + nowFrac * drawW;
      const nowPh = nowFrac * cycles * 2 * Math.PI - angle;
      const nowY = midY - amp * Math.sin(nowPh);

      timeCtx.setLineDash([4, 4]);
      timeCtx.strokeStyle = '#f59e0b';
      timeCtx.lineWidth = 1.5;
      timeCtx.beginPath();
      timeCtx.moveTo(nowX, marginT);
      timeCtx.lineTo(nowX, th - marginB);
      timeCtx.stroke();
      timeCtx.setLineDash([]);

      // Dot at current position
      timeCtx.beginPath();
      timeCtx.arc(nowX, nowY, 6, 0, Math.PI * 2);
      timeCtx.fillStyle = '#f59e0b';
      timeCtx.fill();

      // Label "now"
      timeCtx.fillStyle = '#f59e0b';
      timeCtx.font = '10px sans-serif';
      timeCtx.textAlign = 'center';
      timeCtx.fillText('now', nowX, th - marginB + 14);

      // --- Phasor canvas ---
      const pw = phasorCvs.width, ph2 = phasorCvs.height;
      phasorCtx.clearRect(0, 0, pw, ph2);
      if (isDarkMode) { phasorCtx.fillStyle = '#0f172a'; phasorCtx.fillRect(0, 0, pw, ph2); }

      const pcx = pw / 2, pcy = ph2 / 2;
      const pRadius = Math.min(pcx, pcy) - 40;
      const pAmp = pRadius * (state.amplitude / 100);

      // Circle outline
      phasorCtx.beginPath();
      phasorCtx.arc(pcx, pcy, pAmp, 0, Math.PI * 2);
      phasorCtx.strokeStyle = isDarkMode ? '#334155' : '#e2e8f0';
      phasorCtx.lineWidth = 1;
      phasorCtx.stroke();

      // Cross axes
      phasorCtx.strokeStyle = c.AXIS;
      phasorCtx.lineWidth = 1;
      phasorCtx.beginPath();
      phasorCtx.moveTo(pcx - pRadius - 10, pcy);
      phasorCtx.lineTo(pcx + pRadius + 10, pcy);
      phasorCtx.stroke();
      phasorCtx.beginPath();
      phasorCtx.moveTo(pcx, pcy - pRadius - 10);
      phasorCtx.lineTo(pcx, pcy + pRadius + 10);
      phasorCtx.stroke();

      // Axis labels
      phasorCtx.fillStyle = c.TEXT_MAIN;
      phasorCtx.font = '10px sans-serif';
      phasorCtx.textAlign = 'center';
      phasorCtx.fillText('Re', pcx + pRadius + 20, pcy + 4);
      phasorCtx.fillText('Im', pcx, pcy - pRadius - 16);

      // The phasor angle matches the "now" phase
      const phasorAngle = nowPh;

      // Phasor arrow
      const tipX = pcx + pAmp * Math.cos(phasorAngle);
      const tipY = pcy - pAmp * Math.sin(phasorAngle);

      phasorCtx.beginPath();
      phasorCtx.moveTo(pcx, pcy);
      phasorCtx.lineTo(tipX, tipY);
      phasorCtx.strokeStyle = c.E_FIELD;
      phasorCtx.lineWidth = 3;
      phasorCtx.stroke();

      // Arrowhead
      const arrAngle = Math.atan2(pcy - tipY, tipX - pcx);
      phasorCtx.save();
      phasorCtx.translate(tipX, tipY);
      phasorCtx.rotate(-arrAngle);
      phasorCtx.fillStyle = c.E_FIELD;
      phasorCtx.beginPath();
      phasorCtx.moveTo(8, 0);
      phasorCtx.lineTo(-4, -5);
      phasorCtx.lineTo(-4, 5);
      phasorCtx.fill();
      phasorCtx.restore();

      // Dot at tip
      phasorCtx.beginPath();
      phasorCtx.arc(tipX, tipY, 5, 0, Math.PI * 2);
      phasorCtx.fillStyle = '#f59e0b';
      phasorCtx.fill();

      // Projection line to show relationship
      phasorCtx.setLineDash([3, 3]);
      phasorCtx.strokeStyle = '#f59e0b';
      phasorCtx.lineWidth = 1;
      phasorCtx.beginPath();
      phasorCtx.moveTo(tipX, tipY);
      phasorCtx.lineTo(pcx - pRadius - 10, tipY);
      phasorCtx.stroke();
      phasorCtx.setLineDash([]);

      // Angle arc
      if (pAmp > 10) {
        const arcR = Math.min(30, pAmp * 0.4);
        phasorCtx.beginPath();
        phasorCtx.arc(pcx, pcy, arcR, -phasorAngle, 0, phasorAngle > 0);
        phasorCtx.strokeStyle = isDarkMode ? '#94a3b8' : '#64748b';
        phasorCtx.lineWidth = 1;
        phasorCtx.stroke();

        const angleDeg = ((phasorAngle % (2 * Math.PI)) * 180 / Math.PI).toFixed(0);
        phasorCtx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
        phasorCtx.font = '10px sans-serif';
        phasorCtx.textAlign = 'left';
        phasorCtx.fillText(`${angleDeg}°`, pcx + arcR + 4, pcy - 4);
      }

      // CCW rotation indicator
      phasorCtx.fillStyle = isDarkMode ? '#64748b' : '#94a3b8';
      phasorCtx.font = '9px sans-serif';
      phasorCtx.textAlign = 'center';
      phasorCtx.fillText('↺ CCW', pcx, ph2 - 10);

      if (state.isPlaying) timeRef.current += 1;
      phasorSyncAnimRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(phasorSyncAnimRef.current);
  }, [viewMode, state, c, isDarkMode]);

  // Phasor drag handlers
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const handlePhasorMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode !== WaveViewMode.VIEW_VI) return;
    const { x, y } = getCanvasPos(e);
    const cx = phasorCenter.current.x;
    const cy = phasorCenter.current.y;
    const ta = phasorTimeAngle.current;

    // Compute current phasor tip positions
    const radV = (state.vPhase * Math.PI) / 180;
    const radI = (state.iPhase * Math.PI) / 180;
    const vAngle = ta + radV;
    const iAngle = ta + radI;
    const vTipX = cx + state.vAmplitude * Math.cos(vAngle);
    const vTipY = cy - state.vAmplitude * Math.sin(vAngle);
    const iTipX = cx + state.iAmplitude * Math.cos(iAngle);
    const iTipY = cy - state.iAmplitude * Math.sin(iAngle);

    const distV = Math.hypot(x - vTipX, y - vTipY);
    const distI = Math.hypot(x - iTipX, y - iTipY);
    const threshold = 20;

    if (distV < threshold && distV <= distI) {
      draggingPhasor.current = 'v';
    } else if (distI < threshold) {
      draggingPhasor.current = 'i';
    }
  }, [viewMode, state.vPhase, state.iPhase, state.vAmplitude, state.iAmplitude, getCanvasPos]);

  const handlePhasorMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPhasor.current) return;
    const { x, y } = getCanvasPos(e);
    const cx = phasorCenter.current.x;
    const cy = phasorCenter.current.y;

    // Angle from center to mouse (canvas y-axis is inverted)
    const mouseAngle = Math.atan2(-(y - cy), x - cx);
    // Subtract the rotating timeAngle to get the static phase
    const staticPhase = mouseAngle - phasorTimeAngle.current;
    const phaseDeg = Math.round(((staticPhase * 180) / Math.PI + 360) % 360);
    const normalizedPhase = phaseDeg > 180 ? phaseDeg - 360 : phaseDeg;

    // Distance from center = amplitude
    const dist = Math.hypot(x - cx, y - cy);
    const amplitude = Math.round(Math.max(10, Math.min(100, dist)));

    if (draggingPhasor.current === 'v') {
      setState(s => ({ ...s, vPhase: normalizedPhase, vAmplitude: amplitude }));
    } else {
      setState(s => ({ ...s, iPhase: normalizedPhase, iAmplitude: amplitude }));
    }
  }, [getCanvasPos]);

  const handlePhasorMouseUp = useCallback(() => {
    draggingPhasor.current = null;
  }, []);

  // Computed values for equations
  const omega = (2 * Math.PI * state.frequency).toFixed(2);
  const lambda = (300 / (state.frequency * state.refractiveIndex)).toFixed(0);
  const kVal = ((2 * Math.PI) / parseFloat(lambda)).toFixed(3);
  const phaseDiff = state.vPhase - state.iPhase;
  const pAvg = (0.5 * state.vAmplitude * state.iAmplitude * Math.cos(phaseDiff * Math.PI / 180)).toFixed(0);

  return (
    <SectionLayout
      sectionId="em-wave"
      hook="The 2.4 GHz signal from your WiFi router has a wavelength of 12.5 cm — roughly the width of a laptop. When the wavelength matches physical dimensions, wave behavior dominates. That is exactly what this section is about."
    >
      {/* ── Interactive simulation with internal view selector (genuine sim state) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex-grow relative min-h-[350px]">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              {[WaveViewMode.VIEW_2D, WaveViewMode.VIEW_3D, WaveViewMode.VIEW_VI, WaveViewMode.VIEW_PHASOR_SYNC].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded text-xs font-bold border ${
                    viewMode === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {viewMode === WaveViewMode.VIEW_PHASOR_SYNC ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full h-full pt-10">
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center mb-1">Time domain</p>
                  <div className="flex-1 relative">
                    <canvas ref={phasorSyncTimeRef} className="w-full h-full" role="img" aria-label="Time-domain sinusoid" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center mb-1">Phasor (rotating)</p>
                  <div className="flex-1 relative">
                    <canvas ref={phasorSyncPhasorRef} className="w-full h-full" role="img" aria-label="Rotating phasor diagram" />
                  </div>
                </div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                role="img"
                aria-label="Electromagnetic wave simulation showing E and B field oscillations"
                onMouseDown={handlePhasorMouseDown}
                onMouseMove={handlePhasorMouseMove}
                onMouseUp={handlePhasorMouseUp}
                onMouseLeave={handlePhasorMouseUp}
                style={{ cursor: viewMode === WaveViewMode.VIEW_VI ? 'crosshair' : undefined }}
              />
            )}
          </div>
          {viewMode === WaveViewMode.VIEW_VI && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
              <strong>AC Circuits &amp; EM Waves:</strong> Maxwell&apos;s equations predict that time-varying fields propagate as waves.
              In circuits, the same sinusoidal solutions appear as voltage/current phasors. The power factor
              <MathWrapper formula="\cos(\Delta\phi)" /> determines energy transfer efficiency.
            </div>
          )}
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          <ControlPanel title="Configuration">
            {viewMode !== WaveViewMode.VIEW_VI && (
              <div className="mb-4">
                <label htmlFor="em-wave-refractive-index" className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                  Propagation Medium (n)
                </label>
                <select
                  id="em-wave-refractive-index"
                  value={state.refractiveIndex}
                  onChange={(e) => setState((s) => ({ ...s, refractiveIndex: parseFloat(e.target.value) }))}
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="1.0">Vacuum (n=1.00)</option>
                  <option value="1.33">Water (n=1.33)</option>
                  <option value="1.5">Glass (n=1.50)</option>
                </select>
              </div>
            )}
            <Slider
              label="Frequency"
              value={state.frequency}
              min={0.5}
              max={3.0}
              step={0.1}
              onChange={(v) => setState((s) => ({ ...s, frequency: v }))}
              color="bg-purple-600"
            />
            {viewMode !== WaveViewMode.VIEW_VI && (
              <Slider
                label="Amplitude"
                value={state.amplitude}
                min={10}
                max={100}
                onChange={(v) => setState((s) => ({ ...s, amplitude: v }))}
                color="bg-pink-600"
              />
            )}
            {viewMode === WaveViewMode.VIEW_VI && (
              <>
                <Slider
                  label="V Peak"
                  value={state.vAmplitude}
                  min={10}
                  max={100}
                  onChange={(v) => setState((s) => ({ ...s, vAmplitude: v }))}
                  color="bg-red-600"
                />
                <Slider
                  label="V Phase"
                  value={state.vPhase}
                  min={-180}
                  max={180}
                  onChange={(v) => setState((s) => ({ ...s, vPhase: v }))}
                  color="bg-red-600"
                />
                <Slider
                  label="I Peak"
                  value={state.iAmplitude}
                  min={10}
                  max={100}
                  onChange={(v) => setState((s) => ({ ...s, iAmplitude: v }))}
                  color="bg-amber-600"
                />
                <Slider
                  label="I Phase"
                  value={state.iPhase}
                  min={-180}
                  max={180}
                  onChange={(v) => setState((s) => ({ ...s, iPhase: v }))}
                  color="bg-amber-600"
                />
              </>
            )}
            <Slider
              label="Speed"
              value={state.speed}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => setState((s) => ({ ...s, speed: v }))}
              color="bg-emerald-600"
            />
            <PlayControls
              isPlaying={state.isPlaying}
              onToggle={() => setState((s) => ({ ...s, isPlaying: !s.isPlaying }))}
              onReset={() => setState((s) => ({ ...s, vPhase: 0, iPhase: 0, speed: 1 }))}
            />
            <HintBox>
              {viewMode === WaveViewMode.VIEW_VI
                ? 'Set V and I phase difference to 90° to see power drop to zero (Pure Inductive/Capacitive Load).'
                : 'Increase the Refractive Index (n) to see the wave slow down and the wavelength shorten.'}
            </HintBox>
          </ControlPanel>
        </div>
      </div>

      {/* ── Inline concept checks (distributed across the wave/medium/phasor views) ── */}
      <div className="space-y-4">
        <ConceptCheck data={toConceptCheck(Q_TRIAD)} onComplete={onCheckComplete} onHint={onCheckHint} />
        <ConceptCheck data={toConceptCheck(Q_MEDIUM_SPEED)} onComplete={onCheckComplete} onHint={onCheckHint} />
        <ConceptCheck data={toConceptCheck(Q_PHASOR)} onComplete={onCheckComplete} onHint={onCheckHint} />
      </div>

      {/* ── Theory ── */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <FigureImage
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Very_Large_Array%2C_2012.jpg/500px-Very_Large_Array%2C_2012.jpg"
            alt="Very Large Array radio telescope dishes in New Mexico"
            caption="The Very Large Array: 27 antennas detect electromagnetic waves from space."
            attribution="Hajor, CC BY-SA 2.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Very_Large_Array,_2012.jpg"
          />
          <FigureImage
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/EM_Spectrum_Properties_edit.svg/500px-EM_Spectrum_Properties_edit.svg.png"
            alt="Electromagnetic spectrum from radio waves to gamma rays"
            caption="The electromagnetic spectrum: all EM waves obey Maxwell's equations — they differ only in frequency and wavelength."
            attribution="Inductiveload/NASA, CC BY-SA 3.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:EM_Spectrum_Properties_edit.svg"
          />
        </div>
        <EquationBox
          title={viewMode === WaveViewMode.VIEW_VI ? 'AC Circuit Analysis' : 'Wave Function'}
          equations={
            viewMode !== WaveViewMode.VIEW_VI
              ? [
                  { label: 'E(x,t)', math: `E_0 \\sin(kx - \\omega t),\\quad k=${kVal},\\; \\omega=${omega}`, color: 'text-red-600' },
                  { label: 'B(x,t)', math: `\\frac{E_0}{v} \\sin(kx - \\omega t) = \\frac{n E_0}{c} \\sin(kx - \\omega t)`, color: 'text-blue-600' },
                  { label: 'Velocity', math: `v = \\frac{c}{n} = \\frac{c}{${state.refractiveIndex}}` },
                  { label: 'Wavelength', math: `\\lambda = \\frac{\\lambda_0}{n} \\approx ${lambda} \\text{ (arb.)}` },
                  { label: 'Energy', math: 'u = \\frac{1}{2}\\epsilon_0 E^2 + \\frac{1}{2\\mu_0} B^2', color: 'text-purple-600 dark:text-purple-400' },
                  { label: 'Poynting', math: '\\vec{S} = \\frac{1}{\\mu_0}(\\vec{E} \\times \\vec{B})', color: 'text-purple-600 dark:text-purple-400' },
                ]
              : [
                  { label: 'v(t)', math: `${state.vAmplitude}\\sin(\\omega t ${formatPhase(state.vPhase)})`, color: 'text-red-600' },
                  { label: 'i(t)', math: `${state.iAmplitude}\\sin(\\omega t ${formatPhase(state.iPhase)})`, color: 'text-amber-600' },
                  { label: 'p(t)', math: 'v(t) \\cdot i(t)', color: 'text-purple-600' },
                  { label: 'Power', math: `P_{avg} = \\frac{1}{2}V_0 I_0 \\cos(\\Delta\\phi) \\approx ${pAvg} \\text{ W}`, color: 'text-slate-700 dark:text-slate-300' },
                  { label: 'Phase Diff', math: `\\Delta\\phi = \\phi_v - \\phi_i = ${phaseDiff.toFixed(0)}^\\circ` },
                ]
          }
        />
        {(() => {
          const k = (2 * Math.PI * state.frequency * state.refractiveIndex) / 300;
          if (viewMode !== WaveViewMode.VIEW_VI) {
            const data = Array.from({ length: 50 }, (_, i) => {
              const x = i * 6;
              const E = state.amplitude * Math.sin(k * x);
              const Braw = (state.amplitude * state.refractiveIndex / 300) * Math.sin(k * x);
              // Multiply B by c so it is visible alongside E on the same scale
              const Bscaled = Braw * 300;
              return { x: x.toFixed(0), E: +E.toFixed(2), B: +Bscaled.toFixed(2) };
            });
            return (
              <PhysicsChart
                title="E & B Field Snapshot (t = 0)"
                data={data}
                xKey="x"
                xLabel="Position (arb.)"
                yLabel="Amplitude"
                lines={[
                  { dataKey: 'E', color: '#dc2626', name: 'E-field' },
                  { dataKey: 'B', color: '#2563eb', name: 'B-field (×c)' },
                ]}
              />
            );
          }
          const omegaVal = 2 * Math.PI * state.frequency;
          const phiV = state.vPhase * Math.PI / 180;
          const phiI = state.iPhase * Math.PI / 180;
          const data = Array.from({ length: 60 }, (_, i) => {
            const t = i * 0.05;
            const v = state.vAmplitude * Math.sin(omegaVal * t + phiV);
            const iVal = state.iAmplitude * Math.sin(omegaVal * t + phiI);
            return { t: t.toFixed(2), P: +(v * iVal / 1000).toFixed(2) };
          });
          return (
            <PhysicsChart
              title="Instantaneous Power p(t) = v·i"
              data={data}
              xKey="t"
              xLabel="Time (s)"
              yLabel="Power (kW)"
              lines={[{ dataKey: 'P', color: '#9333ea', name: 'p(t)' }]}
            />
          );
        })()}
        <TheoryGuide>
          {viewMode === WaveViewMode.VIEW_VI ? (
            <>
              <p>
                <strong>Instantaneous Power:</strong>{' '}
                <MathWrapper formula="p(t) = v(t) \cdot i(t)" />. It oscillates at{' '}
                <MathWrapper formula="2\omega" />.
              </p>
              <p>
                <strong>Average Power:</strong> Depends on phase difference{' '}
                <MathWrapper formula="\Delta\phi" />. Max when in phase (
                <MathWrapper formula="\Delta\phi=0" />), zero when{' '}
                <MathWrapper formula="90^\circ" /> out of phase.
              </p>
            </>
          ) : (
            <>
              <p>
                An EM wave consists of oscillating{' '}
                <strong className="text-red-600 dark:text-red-400">Electric (E)</strong> and{' '}
                <strong className="text-blue-600 dark:text-blue-400">Magnetic (B)</strong> fields.
                They are perpendicular to each other and to the direction of propagation.
              </p>
              <p>
                In a vacuum, velocity <MathWrapper formula="v = c" />. In a medium with refractive
                index <MathWrapper formula="n" />, velocity becomes <MathWrapper formula="v = c/n" />.
              </p>
            </>
          )}
        </TheoryGuide>
      </div>
      <GuidedChallenge challenge={CHALLENGE} />
    </SectionLayout>
  );
}
