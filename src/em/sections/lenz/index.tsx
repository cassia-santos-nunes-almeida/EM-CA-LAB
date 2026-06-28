import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { EquationBox } from '@em/components/common/EquationBox';
import { HintBox } from '@em/components/common/HintBox';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { FigureImage } from '@shared/components/common/FigureImage';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { PlausibilityCallout } from '@shared/components/common/PlausibilityCallout';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import type { Challenge, QuizQuestion } from '@em/types/index';
import { brakingForceArrowX } from './physics';

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_REPEL: QuizQuestion = {
  question:
    'A bar magnet is pushed north-pole-first toward a conducting loop. The induced current in the loop will:',
  options: [
    'Create a magnetic field that attracts the magnet',
    'Create a magnetic field that repels the magnet',
    'Have no magnetic effect',
    "Create an electric field parallel to the magnet's axis",
  ],
  correctIndex: 1,
  explanation:
    "Lenz's law states that the induced current opposes the change causing it. As the magnet approaches, flux through the loop increases, so the induced current creates a field that repels the incoming magnet, opposing the increase in flux.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Lenz\'s law says the induced effect always opposes the change that caused it. The magnet is approaching — how would the loop "fight back"?' },
    { tier: 2, label: 'Procedural hint', content: 'As the north pole approaches, the flux through the loop increases. The induced current must create a magnetic field that opposes this increase — i.e., a field pointing back toward the magnet (another north pole facing it).' },
    { tier: 3, label: 'Show worked step', content: 'Approaching north pole → increasing flux into loop → induced current creates a north pole on the magnet-facing side (by right-hand rule) → north repels north → the loop repels the magnet — option B.' },
  ],
};

// Exported solely for the directional distractor-independence test (A.1#5); not a
// shared component, so the fast-refresh constraint does not apply here.
// eslint-disable-next-line react-refresh/only-export-components
export const Q_RING_DIR: QuizQuestion = {
  question:
    'A conducting ring is being pulled out of a region of uniform magnetic field pointing into the page. As the ring exits, the induced current flows:',
  options: [
    'Counter-clockwise, to oppose the decrease in flux through the ring',
    'Counter-clockwise, to reduce the flux through the ring',
    'Clockwise, to oppose the decrease in flux through the ring',
    'There is no induced current because the field is uniform',
  ],
  correctIndex: 2,
  explanation:
    'As the ring exits the field region, the flux through it decreases. By Lenz\'s law the induced current must oppose this decrease by producing its own field into the page inside the loop, which requires a clockwise current (by the right-hand rule).',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'As the ring leaves the field region, is the flux through it increasing or decreasing? Lenz\'s law says the induced current opposes whatever change is happening.' },
    { tier: 2, label: 'Procedural hint', content: 'Flux is decreasing (less of the ring is in the field). To oppose the decrease, the induced current must create additional flux in the same direction (into the page). Use the right-hand rule to find the current direction.' },
    { tier: 3, label: 'Show worked step', content: 'Flux decreasing → oppose by adding flux into the page → right-hand rule: curl fingers into the page → thumb points into page when fingers curl clockwise. Current flows clockwise — option C.' },
  ],
};

const Q_ENERGY: QuizQuestion = {
  question: "Lenz's law is fundamentally a consequence of:",
  options: [
    'Conservation of charge',
    'Conservation of momentum',
    'Conservation of energy',
    'Conservation of angular momentum',
  ],
  correctIndex: 2,
  explanation:
    'If the induced current aided the flux change instead of opposing it, it would amplify the change, creating a runaway process that generates energy from nothing. Lenz\'s law prevents this, enforcing conservation of energy.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Imagine if the induced current helped the change instead of opposing it — what would happen? Would that violate any fundamental physics principle?' },
    { tier: 2, label: 'Procedural hint', content: 'If induced current aided flux change, it would increase flux further, inducing more current, increasing flux more — a runaway positive feedback loop creating energy from nothing. Which conservation law forbids this?' },
    { tier: 3, label: 'Show worked step', content: 'Without the opposing effect: more flux → more current → more flux → infinite energy from nothing. This violates conservation of energy. Lenz\'s law (opposition) prevents this perpetual motion — option C.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Oppose the Change`,
  description: `Use the magnet-and-coil simulation to watch the direction of the induced current and the resulting magnetic force, and reason out why the coil always opposes the motion — the physical content of Lenz's law and its link to energy conservation.`,
  instructions: [
    `Make sure Auto-Oscillate is unchecked and Show Field Lines is checked, then drag the S/N bar magnet across the canvas toward the coil (or push the Magnet Position slider so the magnet moves closer). Watch the green 'v' arrow and the induced-current symbols (the dots and crosses on the coil turns).`,
    `While the magnet is approaching, read the live equation panel: confirm 'Flux Φ_B' shows 'Increasing' and 'Response' shows 'Repulsion (opposes approach)'. Note that the orange 'F_mag' arrow and the on-canvas 'REPULSION' label point the magnet back the way it came.`,
    `Now drag the magnet the other way, away from the coil. Confirm the induced-current symbols flip, 'Flux Φ_B' now reads 'Decreasing', and 'Response' reads 'Attraction (opposes removal)' — the force has reversed to pull the magnet back, so the induced current opposes whichever change you make.`,
    `Slide 'Turns (N)' up toward 20 and repeat a sweep of the magnet, then slide it down toward 1 and repeat. Observe that with more turns the induced effect (current-symbol brightness and the length of the 'F_mag' arrow) is stronger, since the EMF scales with N in ε = -N dΦ/dt.`,
    `Tick Auto-Oscillate and just watch: as the magnet swings in and out on its own, confirm the force arrow always opposes the current motion — pushing back on approach, pulling back on departure — never aiding it.`,
    `Conclude: because the induced force always opposes the motion, you must do work to move the magnet against it. That work is what supplies the electrical energy in the coil — if the force ever aided the motion instead, you would get energy for free. This is why Lenz's law (the minus sign) is required by conservation of energy.`,
  ],
  hint: `The induced current always creates a force that opposes the motion causing the flux change — an approaching magnet is repelled, a departing magnet is attracted. Watch the 'Response' readout flip as you reverse the drag direction.`,
};

export function LenzSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const c = isDarkMode ? COLORS_DARK : COLORS;

  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('lenz');
  const onCheckHint = () => incrementHints('lenz');

  const [magnetPos, setMagnetPos] = useState(20);
  const [prevPos, setPrevPos] = useState(20);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed] = useState(1);
  const [showField, setShowField] = useState(true);
  const [numTurns, setNumTurns] = useState(6);
  const [liveFluxDir, setLiveFluxDir] = useState('');
  const [liveResponse, setLiveResponse] = useState('');

  const [draggingMagnet, setDraggingMagnet] = useState(false);
  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
  const canvasTouchRef = useCanvasTouch(canvasRef);
  const timeRef = useRef(0);
  const animationRef = useRef(0);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, [canvasRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (autoPlay) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height, cy = h / 2;
    const mx = (magnetPos / 100) * w;
    // Hit test on magnet rectangle (mx-50 to mx+50, cy-20 to cy+20)
    if (pt.x >= mx - 50 && pt.x <= mx + 50 && pt.y >= cy - 20 && pt.y <= cy + 20) {
      setDraggingMagnet(true);
    }
  }, [autoPlay, canvasRef, getCanvasPoint, magnetPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingMagnet) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const rect = canvas.getBoundingClientRect();
    const newPos = Math.max(0, Math.min(100, (pt.x / rect.width) * 100));
    setPrevPos(magnetPos);
    setMagnetPos(newPos);
  }, [draggingMagnet, canvasRef, getCanvasPoint, magnetPos]);

  const handleMouseUp = useCallback(() => setDraggingMagnet(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (autoPlay) return;
    const step = 1.5;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPrevPos(magnetPos);
      setMagnetPos(p => Math.max(0, p - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPrevPos(magnetPos);
      setMagnetPos(p => Math.min(100, p + step));
    }
  }, [autoPlay, magnetPos]);


  // Auto-oscillation effect
  useEffect(() => {
    if (autoPlay) {
      const int = setInterval(() => {
        setPrevPos(magnetPos);
        timeRef.current += 0.05 * speed;
        setMagnetPos(50 + 35 * Math.sin(timeRef.current));
      }, 16);
      return () => clearInterval(int);
    }
  }, [autoPlay, speed, magnetPos]);

  // Custom drawArrow helper
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, len: number, angle: number, color: string, label?: string
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    if (Math.abs(len) > 5) {
      const headLen = 10, sign = len > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(len, 0);
      ctx.lineTo(len - sign * headLen, -5);
      ctx.lineTo(len - sign * headLen, 5);
      ctx.fill();
    }
    ctx.fillStyle = color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    if (label) ctx.fillText(label, len / 2, -10);
    ctx.restore();
  };

  // Custom drawFieldArrow helper
  const drawFieldArrow = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, angle: number, color: string
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.lineTo(4, 0);
    ctx.lineTo(-4, 3);
    ctx.fill();
    ctx.restore();
  };

  // Main render effect — schedule unconditionally so the sim starts drawing as
  // soon as the canvas mounts (including after the PredictionGate reveals it).
  useEffect(() => {
    const render = () => {
      const frame = prepareFrame();
      if (!frame) {
        // Canvas not mounted yet (it appears only once the PredictionGate is
        // passed): keep the loop alive so drawing starts the moment it mounts.
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const { ctx, width: w, height: h } = frame;
      const cy = h / 2, coilX = w / 2;
      ctx.clearRect(0, 0, w, h);

        // Draw coil turns
        ctx.fillStyle = '#64748b';
        const turnSpacing = Math.min(15, 200 / numTurns);
        const coilWidth = numTurns * turnSpacing;
        for (let i = 0; i < numTurns; i++) {
          const x = coilX - coilWidth / 2 + i * turnSpacing + turnSpacing / 2;
          ctx.beginPath();
          ctx.strokeStyle = isDarkMode ? '#64748b' : '#94a3b8';
          ctx.lineWidth = 4;
          ctx.arc(x, cy, 60, Math.PI * 0.5, Math.PI * 1.5, true);
          ctx.stroke();
        }

        // Draw magnet (S/N)
        const mx = (magnetPos / 100) * w;
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(mx - 50, cy - 20, 50, 40);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(mx, cy - 20, 50, 40);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('S', mx - 25, cy + 5);
        ctx.fillText('N', mx + 25, cy + 5);
        // Drag hint
        if (!autoPlay) {
          ctx.fillStyle = isDarkMode ? '#64748b' : '#94a3b8';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('↔ Drag magnet', mx, cy + 35);
        }

        // Draw field lines
        if (showField) {
          ctx.strokeStyle = `${c.B_FIELD}40`;
          ctx.lineWidth = 2;
          for (let i = 1; i <= 3; i++) {
            const s = i * 40;
            ctx.beginPath();
            ctx.moveTo(mx + 50, cy);
            ctx.bezierCurveTo(mx + 50 + s, cy - s, mx - 50 - s, cy - s, mx - 50, cy);
            ctx.stroke();
            drawFieldArrow(ctx, mx, cy - s * 0.75, Math.PI, c.B_FIELD);
            ctx.beginPath();
            ctx.moveTo(mx + 50, cy);
            ctx.bezierCurveTo(mx + 50 + s, cy + s, mx - 50 - s, cy + s, mx - 50, cy);
            ctx.stroke();
            drawFieldArrow(ctx, mx, cy + s * 0.75, Math.PI, c.B_FIELD);
          }
        }

        // Physical flux model: dipole on axis of circular coil
        // Φ ∝ a² / (a² + d²)^(3/2), so dΦ/dd ∝ -3ad² / (a² + d²)^(5/2) * v
        // We use normalized units with coil radius a = 60px as reference
        const v = magnetPos - prevPos; // velocity (slider units/frame)
        const coilCenterNorm = 50; // coil is at 50% of width
        const dNorm = (magnetPos - coilCenterNorm) / 100 * w; // distance in pixels
        const a = 60; // coil radius in pixels
        const a2 = a * a;
        const d2 = dNorm * dNorm;
        const denom = Math.pow(a2 + d2, 2.5); // (a² + d²)^(5/2)
        // dΦ/dd = -3 * a² * d / (a² + d²)^(5/2)  (derivative of dipole flux)
        const dPhiDd = denom > 0 ? -3 * a2 * dNorm / denom : 0;
        // EMF = -N * dΦ/dt = -N * (dΦ/dd) * (dd/dt)
        // velocity in slider units → pixel velocity
        const vPx = (v / 100) * w;
        const emfNorm = -numTurns * dPhiDd * vPx * 1e6; // scale for visibility

        const intensity = emfNorm;
        const currentDir = intensity > 0 ? 1 : -1;
        const alpha = Math.min(Math.abs(intensity) / 5, 1);
        // (v·dNorm) < 0 ⇔ the magnet is approaching ⇔ repulsion — single source for both
        // the live equation feedback and the canvas REPULSION/ATTRACTION label (A.5 #4).
        const approaching = (v * dNorm) < 0;

        // Update live equation feedback
        const fluxVal = a2 / Math.pow(a2 + d2, 1.5); // Φ ∝ this
        if (Math.abs(v) > 0.1 && Math.abs(fluxVal) > 0.001) {
          setLiveFluxDir(approaching ? '\\nearrow \\text{ Increasing}' : '\\searrow \\text{ Decreasing}');
          setLiveResponse(approaching ? '\\text{Repulsion (opposes approach)}' : '\\text{Attraction (opposes removal)}');
        } else {
          setLiveFluxDir('\\text{Steady}');
          setLiveResponse('\\text{No induced EMF}');
        }

        for (let i = 0; i < numTurns; i++) {
          const x = coilX - coilWidth / 2 + i * turnSpacing + turnSpacing / 2;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(217, 119, 6, ${0.4 + alpha * 0.6})`;
          ctx.lineWidth = 4;
          ctx.arc(x, cy, 60, Math.PI * 1.5, Math.PI * 0.5, true);
          ctx.stroke();

          if (Math.abs(intensity) > 0.5 && (i === 0 || i === numTurns - 1)) {
            ctx.fillStyle = c.CURRENT;
            ctx.beginPath();
            ctx.arc(x, cy - 60, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '10px sans';
            ctx.fillText(currentDir > 0 ? '⊙' : '⊗', x, cy - 60);

            ctx.fillStyle = c.CURRENT;
            ctx.beginPath();
            ctx.arc(x, cy + 60, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillText(currentDir > 0 ? '⊗' : '⊙', x, cy + 60);
          }
        }

        // Velocity/force arrows and REPULSION/ATTRACTION text
        if (Math.abs(v) > 0.1) {
          drawArrow(ctx, mx, cy - 40, v * 20, 0, '#10b981', 'v');
          if (Math.abs(intensity) > 0.3) {
            const fLen = brakingForceArrowX(v, intensity);
            drawArrow(ctx, mx, cy + 40, fLen, 0, '#ea580c', 'F_mag');
            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = '#ea580c';
            ctx.textAlign = 'center';
            ctx.fillText(approaching ? 'REPULSION' : 'ATTRACTION', w / 2, h - 50);
          }
        }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [magnetPos, prevPos, autoPlay, showField, numTurns, c, isDarkMode, prepareFrame]);

  const TOC = [
    { id: 'lenz-induction-sim', label: 'Induced-Current Simulation' },
    { id: 'lenz-theory', label: "Lenz's Law" },
    { id: 'lenz-challenge', label: 'Guided Challenge' },
  ];

  return (
    <SectionLayout
      sectionId="lenz"
      hook="Induction cooktops use a rapidly alternating magnetic field to induce eddy currents in the pan. Those currents dissipate energy as I²R heat. Lenz's Law tells us the eddy currents flow in the direction that opposes the changing flux."
      toc={TOC}
    >
      {/* ── Predict-first gate around the simulation ── */}
      <SectionAnchor id="lenz-induction-sim" label="Induced-Current Simulation">
      <PredictionGate
        question="If the magnet is pulled away from the coil instead of pushed toward it, how does the induced current direction change?"
        options={[
          { id: 'reverses', label: 'Reverses direction' },
          { id: 'same', label: 'Stays the same' },
          { id: 'stops', label: 'Stops flowing' },
        ]}
        getCorrectAnswer={() => 'reverses'}
        explanation={
          <span>
            When the magnet is pulled away, the flux through the coil decreases. To oppose this decrease, the induced
            current reverses — it now flows in the direction that tries to maintain the original flux, attracting the
            magnet back.
          </span>
        }
        onPredict={(correct) => markPredictionGate('lenz', correct)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex-grow min-h-[400px] outline-none"
              role="button"
              aria-label="Lenz's law simulation. Use the left and right arrow keys to move the magnet."
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >
              <canvas
                ref={canvasTouchRef}
                className="w-full h-full block"
                style={{ cursor: draggingMagnet ? 'grabbing' : autoPlay ? 'default' : 'grab' }}
                role="img"
                aria-label="Lenz's law simulation showing magnet and coil interaction"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>
          <ControlPanel title="Lenz's Law">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Auto-Oscillate</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={showField}
                onChange={(e) => setShowField(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Show Field Lines</span>
            </div>
            {!autoPlay && (
              <Slider
                label="Magnet Position"
                value={magnetPos}
                min={0}
                max={100}
                step={0.5}
                unit=" %"
                onChange={(v) => {
                  setPrevPos(magnetPos);
                  setMagnetPos(v);
                }}
                color="bg-slate-600"
              />
            )}
            <Slider label="Turns (N)" value={numTurns} min={1} max={20} onChange={setNumTurns} color="bg-slate-600" />
            <HintBox>Nature hates change! Move magnet closer -&gt; Coil repels. Move away -&gt; Coil attracts.</HintBox>
          </ControlPanel>
        </div>
      </PredictionGate>

      {/* Plausibility callout (ILO-8): put a real number on the induced EMF */}
      <PlausibilityCallout>
        Put a number on the induced EMF. Thrust a neodymium magnet (~0.1 T at its face)
        through a 200-turn, 4 cm² coil in about 0.05 s and Faraday&apos;s law gives{' '}
        <MathWrapper formula="\varepsilon = N\,\frac{\Delta\Phi}{\Delta t} = 200\cdot\frac{(0.1)(4\times10^{-4})}{0.05} \approx 0.16\ \text{V}" />
        {' '}— about a tenth of an AA cell. That is why shake-to-charge flashlights use many
        turns and a brisk shake: the EMF grows with N and with how fast the flux changes. If a
        tabletop demo predicts hundreds of volts, you have dropped the turns count or the
        timescale.
      </PlausibilityCallout>

      {/* Check: opposition principle (repel on approach) */}
      <ConceptCheck data={toConceptCheck(Q_REPEL)} onComplete={onCheckComplete} onHint={onCheckHint} />
      </SectionAnchor>

      {/* ── Theory ── */}
      <SectionAnchor id="lenz-theory" label="Lenz's Law">
      <div className="space-y-6">
        <FigureImage
          className="mb-6"
          src={`${import.meta.env.BASE_URL}figures/eddy-currents-magnet.png`}
          alt="Eddy currents induced in a conductor by a moving magnet"
          caption="Eddy currents from Lenz's law: a moving magnet induces currents that create an opposing field, braking the motion."
          attribution="Wikimedia Commons, CC BY-SA 3.0"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Eddy_currents_due_to_magnet.svg"
        />
        <EquationBox
          title="Lenz's Law"
          equations={[
            { label: 'Lenz\'s Law', math: '\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}', color: 'text-indigo-600' },
            { label: 'Flux', math: `\\Phi_B: ${liveFluxDir}` },
            { label: 'Response', math: liveResponse, color: 'text-orange-600 dark:text-orange-400' },
          ]}
        />

        {/* Check: induced-current direction for a ring leaving the field */}
        <ConceptCheck data={toConceptCheck(Q_RING_DIR)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {/* Check: Lenz's law as energy conservation */}
        <ConceptCheck data={toConceptCheck(Q_ENERGY)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <TheoryGuide>
          <p><strong>Lenz&apos;s Law:</strong> Nature hates change. If you try to increase flux, the coil creates a field to oppose you (Repulsion).</p>
          <p>If you try to remove flux, it tries to keep it (Attraction).</p>
        </TheoryGuide>
      </div>
      </SectionAnchor>
      <SectionAnchor id="lenz-challenge" label="Guided Challenge">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>
    </SectionLayout>
  );
}
