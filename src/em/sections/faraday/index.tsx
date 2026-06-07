import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
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
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import type { Challenge, QuizQuestion } from '@em/types/index';

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

const CHALLENGE: Challenge = {
  title: `Induce an EMF`,
  description: `Use the induction simulation to investigate how the rate of magnetic-flux change and the number of loops together determine the induced EMF, and how the EMF direction tracks the changing flux (Lenz's law). The simulation drives a sinusoidal field B = sin(ωt) through the loops; you control its rate of change and the number of turns, and read the results in arbitrary units.`,
  instructions: [
    `Set the Loops (N) slider to 1 and the Rate (ω) slider to a low value (e.g. 0.5). Press Play in the PlayControls, then watch the EMF(t) readout in the Faraday's Law equation box and the on-canvas 'Induced EMF' label as the field cycles. Note the largest |EMF(t)| value you see.`,
    `Drag the Rate (ω) slider (or the 'Drag to set ω' bar at the bottom of the canvas) up to about 2.0 and watch again: the induced-current arrows in the loop spin faster and the peak EMF(t) grows. Confirm that a faster dΦ/dt produces a larger induced EMF.`,
    `Keep ω fixed and raise the Loops (N) slider from 1 toward 10. Watch the peak EMF(t) value in the equation box scale up roughly in proportion to N — verify that doubling the turns doubles the EMF, matching ℰ = −N dΦ/dt.`,
    `Let it run and watch the 'B Field' label cycle between 'Out ⊙' and 'In ⊗' while the 'Induced EMF' label flips between 'CW ↻' and 'CCW ↺'. Note that the EMF reverses sign each time the flux switches from rising to falling — this sign flip is Lenz's law in action.`,
    `Use the Slider readouts and the live B(t) and EMF(t) values in the equation box to confirm the timing: EMF(t) peaks when B(t) crosses zero (fastest change) and falls to None when B(t) is at its maximum or minimum (momentarily unchanging).`,
    `Write a one-line conclusion tying your observations to ℰ = −N dΦ/dt: larger ω and larger N both increase the induced EMF, and the minus sign (the CW/CCW reversal) shows the EMF always opposes the change in flux.`,
  ],
  hint: `There is no bar magnet to move here — the Rate (ω) slider IS your "magnet speed": it sets how fast the flux changes (dΦ/dt). Watch the EMF(t) readout peak exactly when the B Field label is switching between Out ⊙ and In ⊗.`,
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasTouch(canvasRef);
  const timeRef = useRef(0);
  const animationRef = useRef(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartRate = useRef(1);

  useEffect(() => {
    // Schedule the loop unconditionally so the simulation starts drawing as soon
    // as the canvas mounts — including after the PredictionGate reveals it.
    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext('2d') : null;
      if (canvas && ctx) {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
        const cx = canvas.width / 2, cy = canvas.height / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        const barX = cx - barW / 2, barY = canvas.height - 30;
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
        ctx.fillText(`Drag to set ω = ${rate.toFixed(1)}`, cx, barY + 20);
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, rate, loops, c, isDarkMode]);

  // Canvas drag handlers for rate control
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const handleRateDragDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Check if click is near the rate bar area (bottom 60px)
    if (y > canvas.height - 50) {
      dragStartX.current = x;
      dragStartRate.current = rate;
    }
  }, [rate, getCanvasPos]);

  const handleRateDragMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragStartX.current === null) return;
    const { x } = getCanvasPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const barW = 200;
    const barX = cx - barW / 2;
    // Map mouse x to rate value
    const frac = Math.max(0, Math.min(1, (x - barX) / barW));
    const newRate = Math.round((0.1 + frac * 2.9) * 10) / 10;
    setRate(newRate);
  }, [getCanvasPos]);

  const handleRateDragUp = useCallback(() => {
    dragStartX.current = null;
  }, []);

  return (
    <SectionLayout
      sectionId="faraday"
      hook="Every electrical transformer relies on Faraday's Law: a changing current in one coil creates a changing magnetic flux that induces a voltage in a neighboring coil — the principle behind the entire power grid."
    >
      {/* ── Predict-first gate around the simulation ── */}
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
                ref={canvasRef}
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
            <Slider label="Rate (ω)" value={rate} min={0.1} max={3.0} step={0.1} onChange={setRate} />
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

      {/* ── Theory ── */}
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
            { label: 'Parameters', math: `N = ${loops},\\quad \\omega = ${rate.toFixed(1)}` },
            { label: 'B(t)', math: `B = \\sin(\\omega t) \\approx ${liveB.toFixed(2)}` },
            { label: 'EMF(t)', math: `\\mathcal{E} \\approx ${liveEmf.toFixed(2)}\\text{ (arb.)}`, color: Math.abs(liveEmf) > 0.5 ? 'text-amber-600 dark:text-amber-400 font-bold' : '' },
          ]}
        />

        {/* Check: EMF magnitude calculation (after the Faraday's-law equation) */}
        <ConceptCheck data={toConceptCheck(Q_EMF_MAGNITUDE)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {/* Check: meaning of the negative sign (Lenz's law) */}
        <ConceptCheck data={toConceptCheck(Q_LENZ_SIGN)} onComplete={onCheckComplete} onHint={onCheckHint} />

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
      <GuidedChallenge challenge={CHALLENGE} />
    </SectionLayout>
  );
}
