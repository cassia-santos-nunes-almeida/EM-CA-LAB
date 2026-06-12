import { useRef, useEffect, useCallback, useState } from 'react';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { FigureImage } from '@shared/components/common/FigureImage';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { RadiatingChargeSim } from './RadiatingChargeSim';
import type { Challenge, QuizQuestion } from '@em/types/index';

interface MaxwellCardProps {
  title: string;
  formula: string;
  description: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

function MaxwellCard({ title, formula, description, draw, expanded, onToggleExpand }: MaxwellCardProps) {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);

  useEffect(() => {
    let req: number;
    const animate = () => {
      if (cvsRef.current) {
        const c = cvsRef.current;
        const ctx = c.getContext('2d');
        if (ctx) {
          c.width = c.clientWidth;
          c.height = c.clientHeight;
          draw(ctx, c.width, c.height, tRef.current++);
        }
      }
      req = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(req);
  }, [draw]);

  if (expanded) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.key === ' ') e.preventDefault();
            onToggleExpand?.();
          }
        }}
      >
        <div
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col shadow-xl w-[90vw] max-w-[700px] max-h-[90vh]"
          role="presentation"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
            <button
              onClick={onToggleExpand}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none px-2"
              aria-label="Close expanded view"
            >
              &times;
            </button>
          </div>
          <div className="text-center text-xl text-indigo-700 dark:text-indigo-400 mb-4 bg-indigo-50 dark:bg-indigo-900/30 rounded py-3">
            <MathWrapper formula={formula} />
          </div>
          <div className="flex-grow relative bg-white dark:bg-slate-900 rounded-lg overflow-hidden min-h-[300px] mb-3 border border-slate-100 dark:border-slate-700">
            <canvas ref={cvsRef} className="w-full h-full absolute inset-0" role="img" aria-label={`${title} expanded visualization`} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{description}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">Click outside or &times; to close</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-500 transition-shadow"
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleExpand?.(); }}
    >
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
      <div className="text-center text-lg text-indigo-700 dark:text-indigo-400 mb-2 bg-indigo-50 dark:bg-indigo-900/30 rounded py-2 min-h-[50px] flex items-center justify-center">
        <MathWrapper formula={formula} />
      </div>
      <div className="flex-grow relative bg-white dark:bg-slate-900 rounded-lg overflow-hidden min-h-[160px] mb-2 border border-slate-100 dark:border-slate-700">
        <canvas ref={cvsRef} className="w-full h-full absolute inset-0" role="img" aria-label="Maxwell's equation animated visualization" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">{description}</p>
      <p className="text-xs text-indigo-400 dark:text-indigo-500 text-center mt-1">Click to expand</p>
    </div>
  );
}

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_DISPLACEMENT: QuizQuestion = {
  question: "Which of Maxwell's equations introduces the displacement current term?",
  options: ["Gauss's law for electricity", "Gauss's law for magnetism", "Faraday's law", 'Ampère–Maxwell law'],
  correctIndex: 3,
  explanation:
    "The Ampère–Maxwell law adds the displacement current ε₀(∂E/∂t) to the original Ampère's law, allowing it to account for time-varying electric fields and ensuring consistency with charge conservation.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Think about which equation was modified to include a new term that accounts for time-varying electric fields.' },
    { tier: 2, label: 'Procedural hint', content: 'The displacement current term ε₀(∂E/∂t) was added to one of the original equations to fix an inconsistency with charge conservation. Which equation relates magnetic fields to currents?' },
    { tier: 3, label: 'Show worked step', content: "Original Ampère's law: ∮B·dl = μ₀I_enc. Maxwell added: ∮B·dl = μ₀I_enc + μ₀ε₀(dΦ_E/dt). The extra term is the displacement current. This is the Ampère–Maxwell law — option D." },
  ],
};

const Q_WAVES: QuizQuestion = {
  question: "What do Maxwell's equations collectively predict when combined in free space?",
  options: [
    'Static electric fields only',
    'The existence of electromagnetic waves propagating at speed c',
    'That magnetic monopoles must exist',
    'That electric charge is not conserved',
  ],
  correctIndex: 1,
  explanation:
    "By taking the curl of Faraday's law and the Ampère–Maxwell law and combining them, one derives the electromagnetic wave equation, predicting waves that travel at c = 1/√(μ₀ε₀).",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Think about what happens when time-varying electric and magnetic fields feed into each other in empty space.' },
    { tier: 2, label: 'Procedural hint', content: "Take the curl of Faraday's law (∇×E = −∂B/∂t) and substitute the Ampère–Maxwell law (∇×B = μ₀ε₀∂E/∂t) to eliminate B. What kind of equation do you get for E?" },
    { tier: 3, label: 'Show worked step', content: 'Curl of Faraday: ∇×(∇×E) = −∂(∇×B)/∂t. Substitute Ampère–Maxwell: ∇²E = μ₀ε₀ ∂²E/∂t². This is the wave equation with speed c = 1/√(μ₀ε₀) — option B.' },
  ],
};

const Q_COUNT_B: QuizQuestion = {
  question: "How many of Maxwell's equations explicitly contain B or Φ_B?",
  options: ['One', 'Two', 'Three', 'Four'],
  correctIndex: 2,
  explanation:
    "Three of Maxwell's equations explicitly contain B or Φ_B: Gauss's law for magnetism (∮B·dA = 0), Faraday's law (∮E·dl = −dΦ_B/dt), and the Ampère–Maxwell law (∮B·dl = μ₀I + μ₀ε₀ dΦ_E/dt). Gauss's law for electricity (∮E·dA = Q/ε₀) involves only E and charge — it contains no magnetic field term.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: "Write out all four Maxwell's equations and look for B or Φ_B in each one." },
    { tier: 2, label: 'Procedural hint', content: 'The four equations are: (1) ∮E·dA = Q/ε₀, (2) ∮B·dA = 0, (3) ∮E·dl = −dΦ_B/dt, (4) ∮B·dl = μ₀I + μ₀ε₀dΦ_E/dt. Which ones contain B or Φ_B?' },
    { tier: 3, label: 'Show worked step', content: "Equation 1 (Gauss electric): only E — no B. Equation 2 (Gauss magnetic): contains B. Equation 3 (Faraday): contains Φ_B. Equation 4 (Ampère–Maxwell): contains B on the left side. That's 3 equations — option C." },
  ],
};

const Q_KINK: QuizQuestion = {
  question:
    'The static Coulomb field falls off as 1/r², while the radiation (kink) field falls off as 1/r. Why does only the radiation field carry energy all the way to infinity?',
  options: [
    'Because 1/r fields travel faster than 1/r² fields',
    'Energy flux ∝ E², so radiated power through a sphere ∝ (1/r)²·r² = constant, while the Coulomb term ∝ (1/r²)²·r² → 0',
    'Because the Coulomb field is imaginary at large r',
    'It does not — both fields carry equal energy outward',
  ],
  correctIndex: 1,
  explanation:
    'The Poynting flux scales as E². A sphere of radius r has area 4πr². Radiation: E ∝ 1/r ⇒ S ∝ 1/r² ⇒ P = S·4πr² = constant — the same total power crosses every sphere, however large. Coulomb: E ∝ 1/r² ⇒ S ∝ 1/r⁴ ⇒ P ∝ 1/r² → 0 — the static field stores energy locally but ships none of it away.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Compare how E² × (surface area of a sphere) behaves as r grows for each field.' },
    { tier: 2, label: 'Procedural hint', content: 'Sphere area grows as r². Multiply: (1/r)²·r² vs (1/r²)²·r².' },
    { tier: 3, label: 'Show worked step', content: '(1/r)²·r² = 1 (constant power escapes); (1/r²)²·r² = 1/r² → 0. Only the 1/r kink field survives — option B.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Unify the Equations`,
  description: `Use the four animated Maxwell's-equation cards (and the differential-form panel) to trace how the equations couple electric and magnetic fields, and reason out why all four together are required for an electromagnetic wave to propagate. This is an open-ended exploration: you expand cards, watch the animations, and draw the conclusion yourself.`,
  instructions: [
    `Click each of the four cards in turn — '1. Gauss's Law (E)', '2. Gauss's Law (B)', '3. Faraday's Law', and '4. Ampère-Maxwell' — to expand it, and read the formula and one-line description; note that cards 1 and 2 (the two Gauss laws) describe static sources only and contain no time-derivative.`,
    `Expand '3. Faraday's Law' and watch the animation: as the central magnetic flux grows and shrinks (the changing dot/cross region), a circulating electric field is induced around the loop (the orbiting point reverses direction). Note that this card shows B changing in time PRODUCES E — the -dΦ_B/dt coupling.`,
    `Expand '4. Ampère-Maxwell' and watch how circulating magnetic-field loops are generated around the source; read the description ('Magnetic fields are generated by currents OR changing E-fields') and identify the displacement-current term ε₀ dΦ_E/dt in the formula — this is the reverse coupling, where changing E produces B.`,
    `Compare cards 3 and 4 side by side and observe that together they form a feedback loop: a changing B makes an E (Faraday), and a changing E makes a B (Ampère-Maxwell). Mentally remove the displacement-current term from card 4 and note that this feedback loop would break, so no self-sustaining wave could form.`,
    `Answer the radiation Predict-First prompt, then press "Single kick": watch one transverse kink shell expand outward at c between the two guide circles, with straight Coulomb spokes inside and outside it. Switch to "Oscillate" and watch the kinks chain into the detaching closed loops — then compare with the dipole-antenna animation in the figure below: they are the same picture.`,
    `Expand the 'Differential Form (Point Form)' panel and confirm the same coupling in point form: ∇×E = -∂B/∂t (Faraday) and ∇×B = μ₀J + μ₀ε₀ ∂E/∂t (Ampère-Maxwell) are the two curl equations that feed each other.`,
    `Write a short summary: explain why all four equations are needed — the two Gauss laws fix the field sources and the no-monopole rule, while Faraday and the Ampère-Maxwell displacement term together close the E-to-B feedback loop that lets an electromagnetic wave propagate at c = 1/√(μ₀ε₀).`,
  ],
  hint: `Focus on cards 3 and 4: which two equations let a changing electric field and a changing magnetic field regenerate each other? That mutual feedback is what sustains a wave.`,
};

export function MaxwellSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const c = isDarkMode ? COLORS_DARK : COLORS;
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('maxwell');
  const onCheckHint = () => incrementHints('maxwell');

  const drawGaussE = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = c.E_FIELD;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px sans';
    ctx.fillText('+', cx, cy + 1);
    ctx.strokeStyle = c.E_FIELD;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const rEnd = 70 + (Math.sin(t * 0.05) + 1) * 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 20, cy + Math.sin(angle) * 20);
      const tipX = cx + Math.cos(angle) * rEnd;
      const tipY = cy + Math.sin(angle) * rEnd;
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      const headLen = 6;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - headLen * Math.cos(angle - Math.PI / 6), tipY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tipX - headLen * Math.cos(angle + Math.PI / 6), tipY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.fillStyle = c.E_FIELD;
      ctx.fill();
    }
  }, [c]);

  const drawGaussB = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = c.B_FIELD;
    ctx.fillRect(cx - 30, cy - 12, 30, 24);
    ctx.fillStyle = c.E_FIELD;
    ctx.fillRect(cx, cy - 12, 30, 24);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', cx - 15, cy);
    ctx.fillText('N', cx + 15, cy);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.5;
    const loops = 4;
    for (let i = 1; i <= loops; i++) {
      const scale = i * 25;
      ctx.beginPath();
      ctx.moveTo(cx + 30, cy);
      ctx.bezierCurveTo(cx + 30 + scale, cy - scale, cx - 30 - scale, cy - scale, cx - 30, cy);
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy - scale * 0.75);
      ctx.rotate(Math.PI);
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.moveTo(-3, -2);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 2);
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(cx + 30, cy);
      ctx.bezierCurveTo(cx + 30 + scale, cy + scale, cx - 30 - scale, cy + scale, cx - 30, cy);
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy + scale * 0.75);
      ctx.rotate(Math.PI);
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.moveTo(-3, -2);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 2);
      ctx.fill();
      ctx.restore();
    }
  }, [c]);

  const drawFaraday = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cx = w / 2, cy = h / 2;
    const flux = Math.sin(t * 0.05);
    ctx.fillStyle = c.B_FIELD;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 * Math.abs(flux), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flux > 0 ? '⊙' : '⊗', cx, cy);
    ctx.strokeStyle = c.E_FIELD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.stroke();
    const dFlux = Math.cos(t * 0.05);
    const angle = t * 0.1 * (dFlux > 0 ? -1 : 1);
    ctx.fillStyle = c.E_FIELD;
    ctx.beginPath();
    ctx.arc(cx + 60 * Math.cos(angle), cy + 60 * Math.sin(angle), 4, 0, Math.PI * 2);
    ctx.fill();
  }, [c]);

  const drawAmpere = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = c.CURRENT;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⊗', cx, cy + 1);
    ctx.strokeStyle = c.B_FIELD;
    for (let r = 30; r <= 60; r += 15) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const angle = t * 0.05 + r;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = c.B_FIELD;
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 3);
      ctx.fill();
      ctx.restore();
    }
  }, [c]);

  return (
    <SectionLayout
      sectionId="maxwell"
      hook="The entire modern electrical grid — from power generation to wireless communication — is governed by four equations written in the 1860s. Every device you've ever used obeys them without exception."
    >
      {/* ── Animated 4-equation overview ── */}
      <PredictionGate
        question="Which single addition to Ampère's law let Maxwell predict self-propagating electromagnetic waves?"
        options={[
          { id: 'monopole', label: 'A magnetic monopole term' },
          { id: 'displacement', label: 'The displacement current ε₀ dΦ_E/dt' },
          { id: 'gravity', label: 'A gravitational coupling term' },
          { id: 'charge', label: 'A new electric-charge source term' },
        ]}
        getCorrectAnswer={() => 'displacement'}
        explanation={<span>Maxwell added the displacement current ε₀ dΦ_E/dt, which closes the E↔B feedback loop and yields the wave equation with c = 1/√(μ₀ε₀).</span>}
        onPredict={(correct) => markPredictionGate('maxwell', correct)}
      >
        {/* existing 4-card animated overview grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          <MaxwellCard
            title="1. Gauss's Law (E)"
            formula="\oint \vec{E} \cdot d\vec{A} = \frac{Q}{\epsilon_0}"
            description="Electric charges produce electric fields. Field lines diverge from (+) charges."
            draw={drawGaussE}
            expanded={expandedCard === 0}
            onToggleExpand={() => setExpandedCard(expandedCard === 0 ? null : 0)}
          />
          <MaxwellCard
            title="2. Gauss's Law (B)"
            formula="\oint \vec{B} \cdot d\vec{A} = 0"
            description="No magnetic monopoles exist. Magnetic field lines always form closed loops."
            draw={drawGaussB}
            expanded={expandedCard === 1}
            onToggleExpand={() => setExpandedCard(expandedCard === 1 ? null : 1)}
          />
          <MaxwellCard
            title="3. Faraday's Law"
            formula="\oint \vec{E} \cdot d\vec{l} = -\frac{d\Phi_B}{dt}"
            description="Changing B-field induces E-field (and Voltage)."
            draw={drawFaraday}
            expanded={expandedCard === 2}
            onToggleExpand={() => setExpandedCard(expandedCard === 2 ? null : 2)}
          />
          <MaxwellCard
            title="4. Ampère-Maxwell"
            formula="\oint \vec{B} \cdot d\vec{l} = \mu_0(I + \epsilon_0 \frac{d\Phi_E}{dt})"
            description="Magnetic fields are generated by currents OR changing E-fields."
            draw={drawAmpere}
            expanded={expandedCard === 3}
            onToggleExpand={() => setExpandedCard(expandedCard === 3 ? null : 3)}
          />
        </div>
      </PredictionGate>

      {/* Check: which equation introduces displacement current (after the 4-card overview) */}
      <ConceptCheck data={toConceptCheck(Q_DISPLACEMENT)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── Radiation mechanism: the Thomson/Purcell kink construction ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Why accelerating charges radiate</h3>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <p>
            A charge <strong>at rest</strong> wears its Coulomb field like spokes — radial lines, strength falling
            as <MathWrapper formula="1/r^2" />. Nothing leaves.
          </p>
          <p>
            A charge in <strong>uniform motion</strong> carries those spokes along. No radiation either — hop into
            the charge's frame and it is just a charge at rest. Radiation cannot depend on who is watching.
          </p>
          <p>
            <strong>Accelerate</strong> the charge and something irreversible happens: the field far away cannot
            know yet. News of the new position travels outward at <MathWrapper formula="c" />. Inside the sphere of
            radius <MathWrapper formula="ct" />, field lines point at the charge's <strong>new</strong> position;
            outside, they still point where the charge <strong>would have been</strong>. Field lines cannot break
            (Gauss's law: they end only on charge) — so a transverse <strong>kink</strong> stitches the two zones
            together.
          </p>
          <p>
            That kink is a transverse E (and by Ampère–Maxwell a transverse B) propagating
            at <MathWrapper formula="c" />: <strong>the kink IS the radiation</strong>. Its field falls
            as <MathWrapper formula="1/r" /> — not <MathWrapper formula="1/r^2" /> — which is the whole secret of
            why it reaches the other side of the universe (the concept check below makes this quantitative).
          </p>
          <p>
            <strong>Oscillate</strong> the charge and kinks launch every half-cycle, chain into the closed loops of
            the dipole animation below, and detach: a self-sustaining wave, Faraday and Ampère–Maxwell handing the
            energy back and forth — exactly the feedback loop the four cards above predicted.
          </p>
          <p>Every antenna in the Antennas section is a machine for accelerating charges on schedule.</p>
        </div>
      </div>

      <PredictionGate
        question="Three charges: one sits at rest, one cruises at constant velocity, one oscillates back and forth. Which of them radiates electromagnetic energy away to large distances?"
        options={[
          { id: 'all', label: 'All three — every charge has a field' },
          { id: 'moving', label: 'The two moving ones' },
          { id: 'oscillating', label: 'Only the oscillating one' },
          { id: 'none', label: 'None — fields stay attached to their charge' },
        ]}
        getCorrectAnswer={() => 'oscillating'}
        explanation={<span>Radiation requires <em>acceleration</em>. A charge at rest has a static Coulomb field; a charge in uniform motion is "at rest" in its own frame, so it cannot radiate either. Only the oscillating charge accelerates — and the simulation shows exactly what its field lines do about it.</span>}
        onPredict={(correct) => markPredictionGate('maxwell', correct)}
      >
        <RadiatingChargeSim />
      </PredictionGate>

      {/* Check: why only the 1/r kink field ships energy to infinity (after the kink sim) */}
      <ConceptCheck data={toConceptCheck(Q_KINK)} onComplete={onCheckComplete} onHint={onCheckHint} />

      <CollapsibleSection title="How much power? Larmor's scaling" variant="inline">
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <p>Larmor's formula (stated, not derived) gives the power an accelerating charge radiates:</p>
          <div className="text-center py-2">
            <MathWrapper formula="P = \dfrac{q^2 a^2}{6\pi\varepsilon_0 c^3}" />
          </div>
          <p>
            For an oscillating charge <MathWrapper formula="x = x_0\sin\omega t" /> the acceleration amplitude
            is <MathWrapper formula="a_0 = \omega^2 x_0" />, and time-averaging <MathWrapper formula="a^2" /> gives{' '}
            <MathWrapper formula="\langle a^2\rangle = \tfrac{1}{2}\omega^4 x_0^2" />,
            so <strong>average radiated power scales as ω⁴</strong> at fixed amplitude. Double the frequency
            → 2⁴ = <strong>16×</strong> the power.
          </p>
          <p>
            That fourth power is why the sky is blue: air molecules re-radiate the high-frequency (blue) end of
            sunlight far more strongly than the red end (Rayleigh scattering), and it is why antennas shrink as
            frequency rises — fast wiggles radiate ferociously.
          </p>
        </div>
      </CollapsibleSection>

      {/* ── Theory ── */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/james-clerk-maxwell.jpg`}
            alt="Portrait of James Clerk Maxwell"
            caption="James Clerk Maxwell (1831–1879): unified electricity, magnetism, and light into four elegant equations."
            attribution="Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:James_Clerk_Maxwell_big.jpg"
          />
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/dipole-antenna-radiation.gif`}
            alt="Animation of a dipole antenna radiating electromagnetic waves"
            caption="An oscillating dipole antenna radiating electromagnetic waves: changing currents launch self-propagating electric-field loops — the radiation Maxwell's equations predict."
            attribution="Chetvorno, CC0 Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Dipole_xmting_antenna_animation_4_408x318x150ms.gif"
          />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Maxwell's Equations — The Complete Framework</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            James Clerk Maxwell unified electricity, magnetism, and optics into four elegant equations.
            Together they describe how electric and magnetic fields are generated, interact, and propagate as electromagnetic waves.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">1. Gauss's Law (E)</h4>
              <div className="text-center py-2"><MathWrapper formula="\oint \vec{E} \cdot d\vec{A} = \frac{Q_{enc}}{\epsilon_0}" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Electric flux through a closed surface equals the enclosed charge divided by <MathWrapper formula="\epsilon_0" />. Charges are sources/sinks of electric fields.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">2. Gauss's Law (B)</h4>
              <div className="text-center py-2"><MathWrapper formula="\oint \vec{B} \cdot d\vec{A} = 0" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Magnetic flux through a closed surface is always zero. There are no magnetic monopoles — field lines always form closed loops.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">3. Faraday's Law</h4>
              <div className="text-center py-2"><MathWrapper formula="\oint \vec{E} \cdot d\vec{l} = -\frac{d\Phi_B}{dt}" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">A changing magnetic flux induces an electric field (EMF). This is the basis for generators, transformers, and inductors.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-2">4. Ampère–Maxwell</h4>
              <div className="text-center py-2"><MathWrapper formula="\oint \vec{B} \cdot d\vec{l} = \mu_0\left(I_{enc} + \epsilon_0 \frac{d\Phi_E}{dt}\right)" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Magnetic fields are generated by currents AND changing electric fields. Maxwell's displacement current term (<MathWrapper formula="\epsilon_0 \frac{d\Phi_E}{dt}" />) predicts electromagnetic waves.</p>
            </div>
          </div>
        </div>

        {/* Check: what the equations predict in free space (after the integral forms) */}
        <ConceptCheck data={toConceptCheck(Q_WAVES)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <CollapsibleSection title="Differential Form (Point Form)">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            The integral forms above are equivalent to these point-form (differential) equations,
            which describe the fields at every point in space rather than over surfaces and paths.
            The differential and integral forms are connected by the divergence and Stokes' theorems.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">1. Gauss's Law (E)</h4>
              <div className="text-center py-2"><MathWrapper formula="\nabla \cdot \vec{E} = \frac{\rho}{\epsilon_0}" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">The divergence of E equals the local charge density. Electric field lines originate from positive charges and terminate on negative charges.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">2. Gauss's Law (B)</h4>
              <div className="text-center py-2"><MathWrapper formula="\nabla \cdot \vec{B} = 0" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">The divergence of B is always zero everywhere. Magnetic field lines have no beginning or end — they always form closed loops.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">3. Faraday's Law</h4>
              <div className="text-center py-2"><MathWrapper formula="\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">The curl of E equals the negative time rate of change of B. A time-varying magnetic field creates a circulating electric field.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-2">4. Ampère–Maxwell</h4>
              <div className="text-center py-2"><MathWrapper formula="\nabla \times \vec{B} = \mu_0 \vec{J} + \mu_0 \epsilon_0 \frac{\partial \vec{E}}{\partial t}" /></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">The curl of B is generated by current density J and the displacement current. This predicts that a changing electric field produces a magnetic field.</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Check: counting equations that contain B or Φ_B (after the differential forms) */}
        <ConceptCheck data={toConceptCheck(Q_COUNT_B)} onComplete={onCheckComplete} onHint={onCheckHint} />
      </div>
      <GuidedChallenge challenge={CHALLENGE} />
    </SectionLayout>
  );
}
