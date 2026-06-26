import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { getSectionNumber } from '@shared/constants/curriculum';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { EquationBox } from '@em/components/common/EquationBox';
import { PlayControls } from '@em/components/common/PlayControls';
import { HintBox } from '@em/components/common/HintBox';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { FigureImage } from '@shared/components/common/FigureImage';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { PlausibilityCallout } from '@shared/components/common/PlausibilityCallout';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { RodOnRailsFigure } from './RodOnRailsFigure';
import type { Challenge, QuizQuestion } from '@em/types/index';
import { rateToHz, emfArbToMillivolts } from './unitMapping';

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_NO_EMF: QuizQuestion = {
  question: 'Which of the following will NOT induce an EMF in a stationary loop?',
  options: [
    'Increasing the magnetic field through the loop',
    'Rotating the loop in a uniform magnetic field',
    'A constant, uniform magnetic field perpendicular to the loop',
    'Moving a bar magnet toward the loop',
  ],
  correctIndex: 2,
  explanation:
    "Faraday's law requires a changing magnetic flux (dΦ/dt ≠ 0) to induce an EMF. A constant, uniform field through a stationary loop of fixed area produces constant flux, so dΦ/dt = 0 and no EMF is induced.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'EMF is induced only when the magnetic flux through the loop is changing. Which scenario produces constant (unchanging) flux?' },
    { tier: 2, label: 'Procedural hint', content: 'Φ = B·A·cos(θ). For EMF = 0, you need dΦ/dt = 0, meaning B, A, and θ must all be constant. Which option has all three constant?' },
    { tier: 3, label: 'Show worked step', content: 'Option A: B changes → dΦ/dt ≠ 0. Option B: θ changes → dΦ/dt ≠ 0. Option C: B, A, θ all constant → dΦ/dt = 0 → no EMF. Option D: B at the loop changes as magnet moves → dΦ/dt ≠ 0. Answer: option C.' },
  ],
};

const Q_EMF_MAGNITUDE: QuizQuestion = {
  question:
    'A coil of 100 turns experiences a change in magnetic flux of 0.05 Wb in 0.1 s. What is the magnitude of the induced EMF?',
  options: ['0.5 V', '5 V', '50 V', '500 V'],
  correctIndex: 2,
  explanation:
    "Faraday's law gives |EMF| = N|dΦ/dt| = 100 × (0.05/0.1) = 100 × 0.5 = 50 V. The number of turns acts as a multiplicative factor on the rate of flux change.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: "Faraday's law relates EMF to the rate of change of magnetic flux and the number of turns. Write down the formula." },
    { tier: 2, label: 'Procedural hint', content: '|EMF| = N × |ΔΦ/Δt|. Plug in N = 100, ΔΦ = 0.05 Wb, Δt = 0.1 s.' },
    { tier: 3, label: 'Show worked step', content: '|EMF| = N|ΔΦ/Δt| = 100 × (0.05/0.1) = 100 × 0.5 = 50 V — option C.' },
  ],
};

const Q_MISSING_AREA: QuizQuestion = {
  question:
    'A classmate models this sim\'s coil at N = 10, f = 10 Hz (B₀ = 50 mT, loop radius 5 cm) and reports a peak EMF of 31.4 V. The equation-box readout peaks near 247 mV. What did the classmate miss?',
  options: [
    'The loop area A — they computed N·B₀·ω, whose units (T/s) are not even volts',
    'The number of turns N',
    'A factor of 2π — they used f where ω belongs',
    'Nothing — the sim readout must be wrong',
  ],
  correctIndex: 0,
  explanation:
    'ℰ_peak = N·B₀·A·ω. Dropping A = πr² = 7.85×10⁻³ m² leaves N·B₀·ω = 10 × 0.05 × 62.8 = 31.4 — with units T/s, not volts: a weber needs the m² (Wb = T·m²). Restore the area: 31.4 × 7.85×10⁻³ = 0.247 V, matching the readout. The units test catches the slip without redoing any arithmetic.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Check the units of their formula before checking any numbers.' },
    { tier: 2, label: 'Procedural hint', content: 'ℰ = −N dΦ/dt and Φ = B·A. Which ingredient of Φ never appears in 31.4 = 10 × 0.05 × 62.8?' },
    { tier: 3, label: 'Show worked step', content: 'ℰ_peak = N·B₀·A·ω = 10 × 0.05 × (π × 0.05²) × (2π × 10) ≈ 0.247 V — option A.' },
  ],
};

const Q_LENZ_SIGN: QuizQuestion = {
  question: "In Faraday's law, EMF = −NdΦ/dt, the negative sign is a mathematical expression of:",
  options: ["Coulomb's law", "Lenz's law", "Ampère's law", "Ohm's law"],
  correctIndex: 1,
  explanation:
    "The negative sign in Faraday's law embodies Lenz's law: the induced EMF drives a current whose magnetic field opposes the change in flux that produced it, ensuring energy conservation.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'The negative sign means the induced EMF opposes the change causing it. Which law states exactly this principle?' },
    { tier: 2, label: 'Procedural hint', content: 'This principle says: "the induced current flows in a direction such that its magnetic field opposes the change in flux." It\'s named after a Russian physicist.' },
    { tier: 3, label: 'Show worked step', content: "The minus sign ensures EMF opposes the flux change (if Φ increases, EMF drives current to reduce it). This is Lenz's law, a consequence of energy conservation — option B." },
  ],
};

const Q_MOTIONAL: QuizQuestion = {
  question:
    "An aircraft with a 60 m wingspan flies at 250 m/s through the vertical component of Earth's magnetic field, B = 5×10⁻⁵ T. What is the motional EMF between its wingtips?",
  options: ['0.75 V', '0.75 mV', '75 V', 'Zero — there is no closed circuit, so no EMF'],
  correctIndex: 0,
  explanation:
    'The wings are a flying rod: ε = Blv = 5×10⁻⁵ × 60 × 250 = 0.75 V. An EMF needs no closed circuit — the wingtips simply sit 0.75 V apart, like a battery nobody has connected (it is current that needs the loop). And you could never harvest it: any return wire flies through the same field and develops the same EMF, cancelling around the loop.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'The wingspan is the rod, the airspeed is v. Which formula from this block applies?' },
    { tier: 2, label: 'Procedural hint', content: 'ε = Blv = 5×10⁻⁵ × 60 × 250. Carry the exponent carefully.' },
    { tier: 3, label: 'Show worked step', content: '5×10⁻⁵ × 60 = 3×10⁻³; × 250 = 0.75 V — option A. Open-circuit EMF exists without current.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Induce an EMF`,
  description: `Use the induction simulation to investigate how the rate of magnetic-flux change and the number of loops together determine the induced EMF, and how the EMF direction tracks the changing flux (Lenz's law). The simulation drives a sinusoidal field B = sin(ωt) through the loops; you control its rate of change and the number of turns, and read the results on a real model coil: radius 5 cm, peak field 50 mT, frequency set by you from 1 to 30 Hz.`,
  instructions: [
    `Set the Loops (N) slider to 1 and the Frequency f slider to a low value (e.g. f = 5 Hz). Press Play in the PlayControls, then watch the EMF(t) readout in the Faraday's Law equation box and the on-canvas 'Induced EMF' label as the field cycles. Note the largest |EMF(t)| value you see.`,
    `Drag the Frequency f slider (or the 'Drag to set f' bar at the bottom of the canvas) up to about 20 Hz and watch again: the induced-current arrows in the loop spin faster and the peak EMF(t) grows. Confirm that a faster dΦ/dt produces a larger induced EMF.`,
    `Keep f fixed and raise the Loops (N) slider from 1 toward 10. Watch the peak EMF(t) value in the equation box scale up roughly in proportion to N — verify that doubling the turns doubles the EMF, matching ℰ = −N dΦ/dt.`,
    `Let it run and watch the 'B Field' label cycle between 'Out ⊙' and 'In ⊗' while the 'Induced EMF' label flips between 'CW ↻' and 'CCW ↺'. Note that the EMF reverses sign each time the flux switches from rising to falling — this sign flip is Lenz's law in action.`,
    `Use the Slider readouts and the live B(t) and EMF(t) values in the equation box to confirm the timing: EMF(t) peaks when B(t) crosses zero (fastest change) and falls to None when B(t) is at its maximum or minimum (momentarily unchanging).`,
    `Write a one-line conclusion tying your observations to ℰ = −N dΦ/dt: larger ω and larger N both increase the induced EMF, and the minus sign (the CW/CCW reversal) shows the EMF always opposes the change in flux.`,
  ],
  hint: `There is no bar magnet to move here — the Frequency slider IS your "magnet speed": it sets how fast the flux changes (dΦ/dt). Watch the EMF(t) readout peak exactly when the B Field label is switching between Out ⊙ and In ⊗.`,
};

export function FaradaySection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const c = isDarkMode ? COLORS_DARK : COLORS;

  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('faraday');
  const onCheckHint = () => incrementHints('faraday');

  const [rate, setRate] = useState(1);
  const [loops, setLoops] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liveB, setLiveB] = useState(0);
  const [liveEmf, setLiveEmf] = useState(0);

  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
  const canvasTouchRef = useCanvasTouch(canvasRef);
  const timeRef = useRef(0);
  const animationRef = useRef(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartRate = useRef(1);

  useEffect(() => {
    // Schedule the loop unconditionally so the simulation starts drawing as soon
    // as the canvas mounts — including after the PredictionGate reveals it.
    const render = () => {
      const frame = prepareFrame();
      if (!frame) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const { ctx, width, height } = frame;
      {
        const cx = width / 2, cy = height / 2;
        ctx.clearRect(0, 0, width, height);
        if (isPlaying) timeRef.current += 0.02 * rate;
        const t = timeRef.current;
        const B = Math.sin(t);
        // Chain rule: dB/dt_real = d(sin(ω·t_real))/dt_real = ω·cos(ω·t_real)
        // Since t = ω·t_real, cos(t) = cos(ω·t_real), so dB/dt_real = rate·cos(t)
        const dBdt = rate * Math.cos(t);
        setLiveB(B);
        setLiveEmf(-dBdt * loops);

        // Draw conducting loops
        ctx.beginPath();
        ctx.strokeStyle = isDarkMode ? '#94a3b8' : '#94a3b8';
        ctx.lineWidth = 2;
        for (let i = 0; i < loops; i++) {
          ctx.beginPath();
          ctx.arc(cx + (i - (loops - 1) / 2) * 4, cy - (i - (loops - 1) / 2) * 4, 150, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw B-field symbols
        ctx.fillStyle = c.B_FIELD;
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let x = cx - 120; x <= cx + 120; x += 40) {
          for (let y = cy - 120; y <= cy + 120; y += 40) {
            if (Math.hypot(x - cx, y - cy) < 130) {
              ctx.globalAlpha = Math.abs(B);
              ctx.fillText(B > 0 ? '⊙' : '⊗', x, y);
            }
          }
        }
        ctx.globalAlpha = 1;

        // Induced current arrows — speed proportional to |EMF|
        const emf = -dBdt * loops;
        const isCW = emf < 0;
        const emfNorm = Math.abs(emf) / (loops || 1); // normalized to [0, 1]
        const arrowSpeed = emfNorm * 2; // proportional rotation speed
        ctx.fillStyle = c.CURRENT;
        ctx.globalAlpha = 0.3 + 0.7 * emfNorm; // fade arrows when EMF is small
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + t * arrowSpeed * (isCW ? 1 : -1);
          const ax = cx + 150 * Math.cos(angle), ay = cy + 150 * Math.sin(angle);
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(angle + Math.PI / 2 + (isCW ? 0 : Math.PI));
          ctx.beginPath();
          ctx.moveTo(-6, -3);
          ctx.lineTo(6, 0);
          ctx.lineTo(-6, 3);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;

        // Status labels
        ctx.textAlign = 'left';
        ctx.fillStyle = c.B_FIELD;
        ctx.font = '14px sans-serif';
        ctx.fillText(`B Field: ${Math.abs(B) < 0.1 ? 'Zero' : (B > 0 ? 'Out ⊙' : 'In ⊗')}`, 20, 30);
        ctx.fillStyle = c.E_FIELD;
        ctx.fillText(`Induced EMF: ${Math.abs(emf) < 0.1 ? 'None' : (isCW ? 'CW ↻' : 'CCW ↺')}`, 20, 50);

        // Rate drag indicator at bottom
        const barW = 200, barH = 6;
        const barX = cx - barW / 2, barY = height - 30;
        ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(barX - 4, barY - 4, barW + 8, barH + 8, 4);
        ctx.fill();
        ctx.fillStyle = isDarkMode ? '#334155' : '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 3);
        ctx.fill();
        // Filled portion representing rate
        const fillW = ((rate - 0.1) / 2.9) * barW;
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, 3);
        ctx.fill();
        // Handle
        ctx.beginPath();
        ctx.arc(barX + fillW, barY + barH / 2, dragStartX.current !== null ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.globalAlpha = dragStartX.current !== null ? 0.8 : 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
        // Label
        ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Drag to set f = ${rateToHz(rate).toFixed(0)} Hz`, cx, barY + 20);
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, rate, loops, c, isDarkMode, prepareFrame]);

  // Canvas drag handlers for rate control
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, [canvasRef]);

  const handleRateDragDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Check if click is near the rate bar area (bottom 60px, CSS px)
    if (y > rect.height - 50) {
      dragStartX.current = x;
      dragStartRate.current = rate;
    }
  }, [rate, getCanvasPos, canvasRef]);

  const handleRateDragMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragStartX.current === null) return;
    const { x } = getCanvasPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const barW = 200;
    const barX = cx - barW / 2;
    // Map mouse x to rate value (CSS px)
    const frac = Math.max(0, Math.min(1, (x - barX) / barW));
    const newRate = Math.round((0.1 + frac * 2.9) * 10) / 10;
    setRate(newRate);
  }, [getCanvasPos, canvasRef]);

  const handleRateDragUp = useCallback(() => {
    dragStartX.current = null;
  }, []);

  const TOC = [
    { id: 'faraday-induction-sim', label: 'Induction Simulation' },
    { id: 'faraday-theory', label: "Faraday's Law" },
    { id: 'faraday-challenge', label: 'Guided Challenge' },
  ];

  return (
    <SectionLayout
      sectionId="faraday"
      hook="Every electrical transformer relies on Faraday's Law: a changing current in one coil creates a changing magnetic flux that induces a voltage in a neighboring coil — the principle behind the entire power grid."
      toc={TOC}
    >
      {/* ── Predict-first gate around the simulation ── */}
      <SectionAnchor id="faraday-induction-sim" label="Induction Simulation">
      <PredictionGate
        question="A bar magnet's north pole approaches a coil from the left. In which direction does the induced current flow when viewed from the left?"
        options={[
          { id: 'cw', label: 'Clockwise' },
          { id: 'ccw', label: 'Counterclockwise' },
        ]}
        getCorrectAnswer={() => 'ccw'}
        explanation={
          <span>
            Counterclockwise current (viewed from the left) creates a field pointing left — opposing the increasing
            flux from the approaching north pole. This is exactly what Lenz's law predicts: the induced current
            opposes the change in flux.
          </span>
        }
        onPredict={(correct) => markPredictionGate('faraday', correct)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex-grow min-h-[400px]">
              <canvas
                ref={canvasTouchRef}
                className="w-full h-full block"
                role="img"
                aria-label="Faraday's law simulation showing electromagnetic induction"
                onMouseDown={handleRateDragDown}
                onMouseMove={handleRateDragMove}
                onMouseUp={handleRateDragUp}
                onMouseLeave={handleRateDragUp}
                style={{ cursor: 'crosshair' }}
              />
            </div>
          </div>
          <ControlPanel title="Experiment Controls">
            <Slider label={`Frequency f = ${rateToHz(rate).toFixed(0)} Hz`} value={rate} min={0.1} max={3.0} step={0.1} onChange={setRate} />
            <Slider label="Loops (N)" value={loops} min={1} max={10} onChange={setLoops} color="bg-indigo-600" />
            <PlayControls
              isPlaying={isPlaying}
              onToggle={() => setIsPlaying(!isPlaying)}
              onReset={() => { timeRef.current = 0; }}
            />
            <HintBox>
              <span>
                Increase the Rate (<MathWrapper formula="\omega" />) or Loops (<MathWrapper formula="N" />) to generate a stronger induced voltage/current!
              </span>
            </HintBox>
          </ControlPanel>
        </div>
      </PredictionGate>

      {/* Check: what produces a changing flux (after the induction demo) */}
      <ConceptCheck data={toConceptCheck(Q_NO_EMF)} onComplete={onCheckComplete} onHint={onCheckHint} />
      </SectionAnchor>

      {/* ── Theory ── */}
      <SectionAnchor id="faraday-theory" label="Faraday's Law">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/faraday-emf-experiment.png`}
            alt="Diagram of Faraday's electromagnetic induction experiment"
            caption="Faraday's induction experiment (1831): changing magnetic flux through the coil induces an EMF."
            attribution="Chetvorno, Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Faraday_emf_experiment.svg"
          />
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/three-gorges-dam.jpg`}
            alt="Three Gorges Dam hydroelectric power station"
            caption="The Three Gorges Dam: Faraday's law converts mechanical rotation into electrical power at massive scale."
            attribution="Rehman, CC BY-SA 2.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Three_Gorges_Dam,_Yangtze_River,_China.jpg"
          />
        </div>
        <FigureImage
          className="mb-6"
          src={`${import.meta.env.BASE_URL}figures/eddy-current-induction.gif`}
          alt="Animation of a changing magnetic field inducing eddy currents in a conductor"
          caption="A changing magnetic field inducing eddy currents in a conductor — Faraday's law in action, with Lenz's law setting their opposing direction."
          attribution="Ariste2, CC0 Public Domain — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Animation_Controle_Non_Destructif_Courants_Foucault.gif"
        />
        <EquationBox
          title="Faraday's Law"
          equations={[
            { label: 'General', math: '\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}', color: 'text-indigo-600' },
            { label: 'Model coil', math: 'a = 5\\ \\text{cm},\\ A = \\pi a^2 = 7.85\\times 10^{-3}\\ \\text{m}^2,\\ B_0 = 50\\ \\text{mT}' },
            { label: 'Parameters', math: `N = ${loops},\\quad f = ${rateToHz(rate).toFixed(0)}\\ \\text{Hz}` },
            { label: 'B(t)', math: `B = B_0\\sin(2\\pi f t) \\approx ${(liveB * 50).toFixed(1)}\\ \\text{mT}` },
            { label: 'EMF(t)', math: `\\mathcal{E} \\approx ${emfArbToMillivolts(liveEmf).toFixed(1)}\\ \\text{mV}`, color: Math.abs(liveEmf) > 0.5 ? 'text-amber-600 dark:text-amber-400 font-bold' : '' },
          ]}
        />

        {/* ── Plausibility callout (unit 2G): the magnitude judgment the SI units enable ── */}
        <PlausibilityCallout>
          Max out the sim — N = 10 turns, f = 30 Hz, 50 mT through a 5 cm loop — and the
          peak EMF is still only ≈ 0.74 V. Volts are <em>hard</em> to make with palm-sized
          hardware. A grid generator gets to kilovolts by scaling every factor of{' '}
          <MathWrapper formula="\mathcal{E} = N B A \omega" /> at once: hundreds of turns,
          B near 1 T, square metres of coil, a 3000 rpm rotor.{' '}
          <em>(Check: N = 100, B = 1 T, A = 1 m², ω = 314 rad/s → 31 kV — stator scale.)</em>{' '}
          When homework hands you hundreds of volts from a desk-toy coil, run the magnitude
          ladder before believing it.
        </PlausibilityCallout>

        {/* Check: EMF magnitude calculation (after the Faraday's-law equation) */}
        <ConceptCheck data={toConceptCheck(Q_EMF_MAGNITUDE)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {/* Check: critique exercise — the classmate's missing area (unit 2G) */}
        <ConceptCheck data={toConceptCheck(Q_MISSING_AREA)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {/* Check: meaning of the negative sign (Lenz's law) */}
        <ConceptCheck data={toConceptCheck(Q_LENZ_SIGN)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {/* ── Motional EMF: the rod on rails (unit 2D) ──
            The derivations and the static figure are ungated (the figure is
            purely presentational → gate-exempt, same class as FigureImage);
            the EquationBox, the worked-numbers card and the energy-loop payoff
            all sit behind the PredictionGate — the box's 'Energy audit' row IS
            the gate's answer and its 'Drag force' row defuses the 'zero — constant
            speed' trap, so neither may render before the prediction. */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Motional EMF: the rod on rails
          </h4>
          <RodOnRailsFigure />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Derivation 1 — the Lorentz view</strong> (the force you met in Section{' '}
            {getSectionNumber('lorentz')}): drag a conducting rod of length{' '}
            <MathWrapper formula="l" /> rightward at speed <MathWrapper formula="v" /> through a
            field <MathWrapper formula="\vec{B}" /> (into the page). Every free charge{' '}
            <em>inside the rod</em> is carried along at <MathWrapper formula="v" />, so each feels{' '}
            <MathWrapper formula="\vec{F} = q\vec{v}\times\vec{B}" /> — magnitude{' '}
            <MathWrapper formula="qvB" />, directed <strong>along the rod</strong> (check it:{' '}
            <MathWrapper formula="\hat{x}\times(-\hat{z}) = +\hat{y}" />, up the rod for positive
            charge). The magnetic force acts like a battery&apos;s chemistry: it pumps charge along
            the rod. Work per unit charge from end to end:
          </p>
          <div className="bg-white dark:bg-slate-800/60 rounded-lg p-4">
            <MathWrapper block formula="\mathcal{E} = \frac{W}{q} = \frac{qvB \cdot l}{q} = Blv" />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Derivation 2 — the Faraday view:</strong> same answer, no force argument. The
            loop&apos;s area is <MathWrapper formula="l \cdot x" />, so{' '}
            <MathWrapper formula="\Phi = Blx" />, and
          </p>
          <div className="bg-white dark:bg-slate-800/60 rounded-lg p-4">
            <MathWrapper
              block
              formula="|\mathcal{E}| = \left|\frac{d\Phi}{dt}\right| = Bl\frac{dx}{dt} = Blv"
            />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Two different pieces of physics, one number — that agreement is not luck. In this
            section&apos;s sim <em>you changed B with the loop fixed</em>; the rod{' '}
            <em>changes the area with B fixed</em>. Faraday&apos;s law{' '}
            <MathWrapper formula="\mathcal{E} = -N\,d\Phi_B/dt" /> covers both, and the Lorentz
            force is the machinery behind the moving-conductor case. This is the generator: every
            spinning turbine coil in the grid is rods sweeping through field.
          </p>
        </div>

        <PredictionGate
          question="You pull the rod at a steady 2.0 m/s against the magnetic drag. How does the mechanical power your hand delivers compare with the electrical power dissipated in the resistor?"
          options={[
            { id: 'more', label: 'More — some power is lost to the magnetic field' },
            { id: 'equal', label: 'Exactly equal' },
            { id: 'less', label: 'Less — the field contributes energy too' },
            { id: 'zero', label: 'Zero — constant speed needs no power' },
          ]}
          getCorrectAnswer={() => 'equal'}
          explanation={
            <span>
              Equal — and not approximately.{' '}
              <MathWrapper formula="P_{mech} = Fv = (BIl)v = (Blv)I = \mathcal{E}I = P_{elec}" />:
              the identity is algebra, not coincidence. The field brokers the transaction and keeps
              nothing — a static magnetic field can do no work. (&quot;Zero&quot; is the subtle
              trap: constant speed means zero <em>net</em> force, but the drag F = BIl is real, so
              your hand pushes — and pushing at speed v is power.)
            </span>
          }
          onPredict={(correct) => markPredictionGate('faraday', correct)}
        >
          {/* Summary equations (gated: 'Energy audit' is the gate's answer verbatim,
              'Drag force' would defuse the constant-speed trap) */}
          <EquationBox
            title="Motional EMF (rod on rails)"
            equations={[
              { label: 'EMF', math: '\\mathcal{E} = Blv' },
              { label: 'Current', math: 'I = Blv/R' },
              { label: 'Drag force', math: 'F = BIl = B^2l^2v/R' },
              { label: 'Energy audit', math: 'P_{mech} = Fv = \\mathcal{E}I = P_{elec}' },
            ]}
          />

          {/* Worked example: run the whole loop, by hand */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Worked example: Run the whole loop, by hand
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <MathWrapper formula="B = 0.5\,\text{T}" /> into the page, rod length{' '}
              <MathWrapper formula="l = 0.4\,\text{m}" />, pulled at{' '}
              <MathWrapper formula="v = 2.0\,\text{m/s}" />; total loop resistance{' '}
              <MathWrapper formula="R = 0.1\,\Omega" />.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-engineering-blue-300 dark:border-engineering-blue-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Step 1: EMF</p>
              <MathWrapper
                block
                formula="\mathcal{E} = Blv = 0.5 \times 0.4 \times 2.0 = 0.40\,\text{V}"
              />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Step 2: Current
              </p>
              <MathWrapper block formula="I = \mathcal{E}/R = 0.40/0.10 = 4.0\,\text{A}" />
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Direction: flux into the page is <em>growing</em>, so the induced current opposes
                it — <strong>counter-clockwise</strong> (up the rod). Lenz, exactly as drawn in the
                figure.
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Step 3: The drag appears
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                That 4.0 A now flows <em>across</em> the field, so the rod itself feels the wire
                force from Section {getSectionNumber('lorentz')}:
              </p>
              <MathWrapper block formula="F = BIl = 0.5 \times 4.0 \times 0.4 = 0.80\,\text{N}" />
              <p className="text-sm text-slate-700 dark:text-slate-300">
                and <MathWrapper formula="I\,\vec{L}\times\vec{B}" /> points{' '}
                <strong>left — against the pull</strong>. Lenz&apos;s law has become a measurable
                force. Closed-form cross-check:{' '}
                <MathWrapper formula="F = B^2l^2v/R = 0.25 \times 0.16 \times 2.0/0.1 = 0.80\,\text{N}" />{' '}
                — identical.
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Step 4: The books balance
              </p>
              <MathWrapper block formula="P_{mech} = Fv = 0.80 \times 2.0 = 1.6\,\text{W}" />
              <MathWrapper block formula="P_{elec} = \mathcal{E}I = 0.40 \times 4.0 = 1.6\,\text{W}" />
              <MathWrapper block formula="P_{heat} = I^2R = (4.0)^2 \times 0.1 = 1.6\,\text{W}" />
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Three independent routes, one number.
              </p>
            </div>
          </div>

          {/* Reveal card: the energy loop closes */}
          <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/15 p-5 space-y-3">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              The energy loop closes
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Moving conductor → EMF (<MathWrapper formula="Blv" />) → current (
              <MathWrapper formula="Blv/R" />) → opposing force (
              <MathWrapper formula="B^2l^2v/R" />) → and the work done against that force comes
              back out, joule for joule, as heat in the resistor.{' '}
              <strong>This single loop is ILO 6 in one diagram</strong>: it is why Lenz&apos;s law{' '}
              <em>must</em> oppose (aid the motion and the loop manufactures free energy), why
              generators get harder to crank when you draw current from them, and why a magnetic
              brake needs no brake pads. Next section ({getSectionNumber('lenz')}) you will{' '}
              <em>feel</em> this drag in the magnet-and-coil sim — now you can also compute it.
            </p>
          </div>
        </PredictionGate>

        {/* Check: motional EMF between aircraft wingtips (CC-F) */}
        <ConceptCheck data={toConceptCheck(Q_MOTIONAL)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <TheoryGuide>
          <p><strong>Induction:</strong> A changing magnetic field generates an Electric Field (EMF).</p>
          <p>
            <strong>Lenz&apos;s Law logic:</strong><br />
            1. B (Out) Increasing<br />
            2. Flux <MathWrapper formula="\Phi" /> increases Out<br />
            3. Nature opposes change -&gt; Needs Induced B (In)<br />
            4. RHR: Thumb In -&gt; Fingers <span className="font-bold text-amber-600">CW &#x21bb;</span>
          </p>
        </TheoryGuide>
      </div>
      </SectionAnchor>

      <SectionAnchor id="faraday-challenge" label="Guided Challenge">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>
    </SectionLayout>
  );
}
