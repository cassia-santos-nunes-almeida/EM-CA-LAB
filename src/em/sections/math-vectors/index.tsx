import { useEffect, useRef, useState } from 'react';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { LabLayout } from '@shared/components/common/LabLayout';
import { EquationBox } from '@em/components/common/EquationBox';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { useProgressStore, useThemeStore } from '@shared/store/progressStore';
import type { QuizQuestion } from '@em/types';
import { dot2, cross2z, angleBetweenDeg, projectionLength, vecFromPolarDeg, vadd, magnitude } from './physics';

// Exported for the concept-check-directions guard (CASES imports these directly).
// eslint-disable-next-line react-refresh/only-export-components
export const Q_CROSS_DIR: QuizQuestion = {
  question: 'A points along +x, B points along +y, both in the screen plane. Which direction is A×B?',
  options: ['Out of the screen', 'Into the screen', 'Along +x', 'Along −y'],
  correctIndex: 0,
  explanation: 'Right-hand rule: fingers sweep from A (+x) toward B (+y), thumb points out of the screen — x̂×ŷ = ẑ. This is the same triad em-wave uses for E, B, and k.',
  hints: [
    { tier: 1, label: 'Nudge', content: 'Point your right-hand fingers along A, curl them toward B — where does your thumb aim?' },
    { tier: 2, label: 'Conceptual hint', content: 'The cross product is perpendicular to BOTH inputs — in the screen plane, only two candidates survive.' },
    { tier: 3, label: 'Worked step', content: 'x̂×ŷ = ẑ is the defining right-handed orientation, and ẑ is out of the screen here.' },
  ],
};

// eslint-disable-next-line react-refresh/only-export-components
export const Q_QE_DIR: QuizQuestion = {
  question: 'The electric field at a point aims along +x. Which direction is the force on an electron there?',
  options: ['Along −x', 'Along +x', 'Zero — electrons only feel magnetic forces', 'Along +y'],
  correctIndex: 0,
  explanation: 'F = qE is a scalar times a vector: the magnitude scales by |q|, and a NEGATIVE scalar flips the direction. The electron (q < 0) is pushed opposite E, along −x.',
  hints: [
    { tier: 1, label: 'Nudge', content: 'F = qE. What sign is q for an electron?' },
    { tier: 2, label: 'Conceptual hint', content: 'Multiplying a vector by a negative scalar reverses its direction.' },
  ],
};

const Q_DOT_ZERO = {
  question: 'Slide B around A on the bench: at exactly what angle between them is A·B zero — and what does the projection picture say at that angle?',
  answer: '90°. The projection of B onto A has zero length there — B spends none of itself along A. That is why "E ⊥ dA" will kill flux terms when you reach Gauss’s law.',
  hints: [
    'Watch the dashed projection segment as θ crosses 90°.',
    'A·B = |A||B|cosθ — which factor can be zero when neither length is?',
  ],
};

const Q_ADD = {
  question: 'Two equal-strength repulsive pushes act on a charge, at right angles to each other. Compared with ONE push alone, how strong is the net push, and where does it point?',
  answer: '√2 ≈ 1.41 times one push, pointing along the diagonal between the two. Vectors add tip-to-tail (componentwise), not by adding magnitudes — magnitude-adding would wrongly give 2×. Check it on the bench’s Add mode with |B| = 2 at 90°. This is exactly how two Coulomb forces combine in the next section.',
  hints: [
    'Draw the two pushes tip-to-tail — what triangle do you get?',
    'Add components: (F, 0) + (0, F) = (F, F). How long is that?',
  ],
};

const CHALLENGE = {
  title: 'Where the two products trade places',
  description: 'A is fixed at 2 units along +x. Use the bench to find the angle where the dot readout A·B and the signed cross readout (A×B)·ẑ are exactly equal.',
  instructions: [
    'Set |B| = 1.5 and sweep the angle slider slowly from 0° to 90°, toggling between the Dot and Cross readouts as you go.',
    'A·B falls as (A×B)·ẑ grows — find the crossing angle, then check it against tanθ = 1.',
    'Now set 225° — verify the two readouts are equal there too, and BOTH negative.',
    'Why can the cross-product MAGNITUDE |A×B| never equal a negative dot product? (That is why the bench shows you the signed ẑ-component.)',
  ],
  hint: 'A·B ∝ cosθ and (A×B)·ẑ ∝ sinθ — equal where tanθ = 1: 45° and 225°. At 225° both are −2.12; the magnitude |A×B| would be +2.12.',
};

const TOC = [
  { id: 'math-vectors-products-sim', label: 'Lab: Two-Arrow Bench' },
  { id: 'math-vectors-concept-checks', label: 'Concept Checks' },
  { id: 'math-vectors-theory', label: 'Theory: The Two Products' },
  { id: 'math-vectors-challenge', label: 'Guided Challenge' },
];

const A = vecFromPolarDeg(2, 0); // fixed reference arrow, 2 units along +x

// One epsilon for BOTH the canvas marker and the readout, so the two surfaces
// can never disagree about "parallel" (vecFromPolarDeg(m, 180) gives y ≈ +1e-16).
const CROSS_EPS = 1e-9;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, v: { x: number; y: number }, scale: number,
  color: string, label: string,
) {
  const tx = cx + v.x * scale;
  const ty = cy - v.y * scale; // canvas y is down; math y is up
  const ang = Math.atan2(cy - ty, tx - cx);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.beginPath(); // arrowhead
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - 10 * Math.cos(ang - 0.4), ty + 10 * Math.sin(ang - 0.4));
  ctx.lineTo(tx - 10 * Math.cos(ang + 0.4), ty + 10 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 14px monospace';
  ctx.fillText(label, tx + 8, ty - 8);
}

export function MathVectorsSection() {
  const [mode, setMode] = useState<'dot' | 'cross' | 'add'>('dot');
  const [bMag, setBMag] = useState(1.5);
  const [bAngle, setBAngle] = useState(120);
  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
  const animationRef = useRef(0);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  // Theme-aware canvas (audit C-02 defect class: hardcoded hexes go illegible in
  // dark mode) — the em house pattern; coulomb does the same. If COLORS/COLORS_DARK
  // in @em/constants/physics already provide these roles, use them instead of literals.
  const isDarkMode = useThemeStore((s) => s.theme) === 'dark';

  const b = vecFromPolarDeg(bMag, bAngle);

  useEffect(() => {
    const colAxis = isDarkMode ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.35)';
    const colDrop = isDarkMode ? '#94a3b8' : '#64748b';
    const colMark = isDarkMode ? '#94a3b8' : '#475569';
    const colA = isDarkMode ? '#f87171' : '#dc2626';
    const colB = isDarkMode ? '#60a5fa' : '#2563eb';
    const colPos = isDarkMode ? '#34d399' : '#059669';
    const colNeg = isDarkMode ? '#f87171' : '#dc2626';
    const render = () => {
      const frame = prepareFrame();
      if (!frame) {
        // Canvas hidden behind the gate: keep the loop alive (gauss pattern).
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const { ctx, width, height } = frame;
      const cx = width / 2;
      const cy = height / 2;
      // Add mode draws A+B (up to 5 units) — widen the world so it never clips.
      const scale = Math.min(width, height) / (mode === 'add' ? 11 : 8);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = colAxis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
      ctx.stroke();
      const bv = vecFromPolarDeg(bMag, bAngle);
      if (mode === 'dot') {
        // dashed drop from B's tip onto the A line + bold signed projection
        const p = projectionLength(bv, A);
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = colDrop;
        ctx.beginPath();
        ctx.moveTo(cx + bv.x * scale, cy - bv.y * scale);
        ctx.lineTo(cx + p * scale, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = p >= 0 ? colPos : colNeg;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + p * scale, cy);
        ctx.stroke();
      } else if (mode === 'cross') {
        // parallelogram spanned by A and B; ⊙/⊗ marker for A×B direction
        const z = cross2z(A, bv);
        const zEff = Math.abs(z) < CROSS_EPS ? 0 : z;
        ctx.fillStyle = zEff >= 0 ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + A.x * scale, cy - A.y * scale);
        ctx.lineTo(cx + (A.x + bv.x) * scale, cy - (A.y + bv.y) * scale);
        ctx.lineTo(cx + bv.x * scale, cy - bv.y * scale);
        ctx.closePath();
        ctx.fill();
        if (zEff !== 0) {
          // ring + direction marker draw together; parallel vectors (zEff === 0) draw nothing
          ctx.strokeStyle = colMark;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 11, 0, 2 * Math.PI);
          ctx.stroke();
          if (zEff > 0) {
            ctx.beginPath(); // ⊙ out of screen
            ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
            ctx.fillStyle = colMark;
            ctx.fill();
          } else {
            ctx.beginPath(); // ⊗ into screen
            ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6);
            ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx - 6, cy + 6);
            ctx.stroke();
          }
        }
      } else {
        // Add: ghost copy of B re-rooted at A's tip (tip-to-tail), then the resultant
        const r = vadd(A, bv);
        ctx.setLineDash([6, 4]);
        drawArrow(ctx, cx + A.x * scale, cy - A.y * scale, bv, scale, colDrop, '');
        ctx.setLineDash([]);
        // Skip drawing resultant arrow if it is near-zero (float noise).
        if (magnitude(r) >= CROSS_EPS) {
          drawArrow(ctx, cx, cy, r, scale, colPos, 'A+B');
        }
      }
      drawArrow(ctx, cx, cy, A, scale, colA, 'A');
      drawArrow(ctx, cx, cy, bv, scale, colB, 'B');
      animationRef.current = requestAnimationFrame(render);
    };
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [prepareFrame, bMag, bAngle, mode, isDarkMode]);

  const bench = (
    <SectionAnchor id="math-vectors-products-sim" label="Lab: Two-Arrow Bench" className="scroll-mt-4">
      <PredictionGate
        question="A is fixed along +x. You swing B to 120° away from A — past the perpendicular. Without computing: what is the SIGN of A·B there?"
        options={[
          { id: 'neg', label: 'Negative' },
          { id: 'zero', label: 'Exactly zero' },
          { id: 'pos', label: 'Still positive' },
        ]}
        getCorrectAnswer={() => 'neg'}
        explanation={<span>A·B = |A||B|cosθ, and cos120° &lt; 0. Geometrically: past 90° the projection of B onto A points <em>backwards</em> along A — B spends part of itself opposing A.</span>}
        onPredict={(correct) => markPredictionGate('math-vectors', correct)}
      >
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Vector bench: arrows A and B with the dot-product projection, cross-product parallelogram and out/into-screen marker, or the tip-to-tail resultant, depending on mode"
            className="w-full h-[300px] rounded-md bg-white dark:bg-slate-900"
          />
          <ControlPanel title="Vector Controls">
            <div className="flex gap-2" role="group" aria-label="Bench mode">
              {([['dot', 'Dot A·B'], ['cross', 'Cross A×B'], ['add', 'Add A+B']] as const).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`px-3 py-1 rounded border text-sm ${mode === m
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Slider label="B angle from A (°)" value={bAngle} min={0} max={360} step={5} onChange={setBAngle} />
            <Slider label="|B|" value={bMag} min={0.5} max={3} step={0.1} onChange={setBMag} />
          </ControlPanel>
          {mode === 'dot' && (() => {
            const d = dot2(A, b);
            const dEff = Math.abs(d) < CROSS_EPS ? 0 : d;
            return (
              <p className="font-mono text-sm" data-testid="dot-readout">
                A·B = |A||B|cosθ = 2 × {bMag.toFixed(1)} × cos({angleBetweenDeg(A, b).toFixed(0)}°) = {dEff.toFixed(2)}
              </p>
            );
          })()}
          {mode === 'cross' && (() => {
            const z = cross2z(A, b);
            const zEff = Math.abs(z) < CROSS_EPS ? 0 : z; // same epsilon as the canvas marker
            return (
              <p className="font-mono text-sm" data-testid="cross-readout">
                (A×B)·ẑ = {zEff.toFixed(2)} — {zEff > 0 ? 'out of the screen ⊙' : zEff < 0 ? 'into the screen ⊗' : 'zero (parallel)'}
              </p>
            );
          })()}
          {mode === 'add' && (
            <p className="font-mono text-sm" data-testid="add-readout">
              A+B = ({vadd(A, b).x.toFixed(2)}, {vadd(A, b).y.toFixed(2)}), |A+B| = {magnitude(vadd(A, b)).toFixed(2)}
            </p>
          )}
        </div>
      </PredictionGate>
    </SectionAnchor>
  );

  const theory = (
    <>
      <SectionAnchor id="math-vectors-concept-checks" label="Concept Checks" className="scroll-mt-4">
        <div className="space-y-4">
          <ConceptCheck data={toConceptCheck(Q_CROSS_DIR)} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
          <ConceptCheck data={{ mode: 'predict-reveal', question: Q_DOT_ZERO.question, answer: Q_DOT_ZERO.answer, hints: Q_DOT_ZERO.hints }} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
          <ConceptCheck data={toConceptCheck(Q_QE_DIR)} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
          {/* 4 wired checks ≥ expectedChecks: 3 — audit roadmap #3 guard satisfied */}
          <ConceptCheck data={{ mode: 'predict-reveal', question: Q_ADD.question, answer: Q_ADD.answer, hints: Q_ADD.hints }} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
        </div>
      </SectionAnchor>
      <SectionAnchor id="math-vectors-theory" label="Theory: The Two Products" className="scroll-mt-4">
        <div className="space-y-4">
          <EquationBox
            title="The two ways vectors multiply"
            equations={[
              { label: 'Anatomy of a vector', math: '\\vec{A} = A_x\\hat{x} + A_y\\hat{y},\\quad |\\vec{A}| = \\sqrt{A_x^2 + A_y^2}\\quad (\\hat{x}: \\text{a length-1 direction marker})' },
              { label: 'Addition (tip-to-tail)', math: '\\vec{A} + \\vec{B} = (A_x + B_x)\\,\\hat{x} + (A_y + B_y)\\,\\hat{y}', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Dot (projection)', math: '\\vec{A} \\cdot \\vec{B} = |\\vec{A}||\\vec{B}|\\cos\\theta = A_x B_x + A_y B_y + A_z B_z', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Cross (area + axis)', math: '|\\vec{A} \\times \\vec{B}| = |\\vec{A}||\\vec{B}|\\sin\\theta', color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Cross, component form (in-plane)', math: '(\\vec{A} \\times \\vec{B})_z = A_x B_y - A_y B_x', color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Right-handed triad', math: '\\hat{x} \\times \\hat{y} = \\hat{z},\\quad \\hat{y} \\times \\hat{z} = \\hat{x},\\quad \\hat{z} \\times \\hat{x} = \\hat{y}' },
              { label: 'Scalar × vector', math: '\\vec{F} = q\\vec{E} \\;\\;(q < 0 \\text{ flips the direction})' },
            ]}
          />
          <WorkedSteps
            tryFirstPrompt="Compute A·B for the gate's setup (A = 2x̂, B at 120°, |B| = 1.5) before revealing."
            steps={[
              {
                title: 'Step 1 — Components from the polar form',
                body: (
                  <>
                    <p className="mb-2">B at 120° with length 1.5:</p>
                    <MathWrapper formula="\vec{B} = 1.5(\cos 120^{\circ}\,\hat{x} + \sin 120^{\circ}\,\hat{y}) = -0.75\,\hat{x} + 1.30\,\hat{y}" block />
                  </>
                ),
              },
              {
                title: 'Step 2 — Multiply matching components and add',
                body: <MathWrapper formula="\vec{A} \cdot \vec{B} = (2)(-0.75) + (0)(1.30) = -1.5" block />,
              },
              {
                title: 'Step 3 — Cross-check against the projection picture',
                body: (
                  <p>
                    |A||B|cos120° = 2 × 1.5 × (−0.5) = −1.5. Same number, two routes: components when you have coordinates, projection when you have geometry. The bench readout shows both at once.
                  </p>
                ),
              },
            ]}
          />
          <YourTurnPanel
            scenario="A field-mapping bench hands you A = 3x̂ + 4ŷ and B = −2x̂ + 1ŷ (units of field × meters)."
            question="What is A·B?"
            options={[
              { text: '−2', correct: true, explanation: 'Correct: (3)(−2) + (4)(1) = −6 + 4 = −2. Obtuse pair — the projection opposes A.' },
              { text: '+10', correct: false, explanation: 'You dropped the minus sign on (3)(−2) — component products keep their signs: −6 + 4 = −2, not 6 + 4.' },
              { text: '−10', correct: false, explanation: 'You flipped the sign of (4)(1); only the x-term is negative: −6 + 4 = −2, not −6 − 4.' },
              { text: '+2', correct: false, explanation: 'Watch the sign of (3)(−2).' },
            ]}
            correctReveal={
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <MathWrapper formula="\vec{A} \cdot \vec{B} = (3)(-2) + (4)(1) = -2" block />
                <p>Negative dot product ⇒ the angle between them is obtuse — check it: cosθ = −2/(5·√5) ⇒ θ ≈ 100°.</p>
              </div>
            }
          />
        </div>
      </SectionAnchor>
      <SectionAnchor id="math-vectors-challenge" label="Guided Challenge" className="scroll-mt-4">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>
    </>
  );

  return (
    <SectionLayout
      sectionId="math-vectors"
      hook="A solar panel tilted 60° away from facing the sun loses half its power; a motor's torque peaks when the coil face lies parallel to the field. Both facts are one small algebra away — and the whole of Part 2 speaks it."
      toc={TOC}
    >
      <LabLayout leadWithBench theory={theory} bench={bench} />
    </SectionLayout>
  );
}
