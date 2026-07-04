import { useEffect } from 'react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { SectionHook } from '@shared/components/common/SectionHook';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { LabStation } from '@shared/components/common/LabStation';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { PhasorMultiplierSim } from './PhasorMultiplierSim';

const tocEntries = [
  { id: 'motivation', label: 'Rotating Arrows' },
  { id: 'euler', label: "Euler's Formula" },
  { id: 'multiplier', label: 'Lab: The Phasor Multiplier' },
  { id: 'phasors', label: 'Phasor Dictionary' },
  { id: 'challenge', label: 'Guided Challenge' },
];

const CHALLENGE = {
  title: 'Walk the unit circle',
  description: 'Use the multiplier to verify Euler’s identity by construction.',
  instructions: [
    'Set z₁ = 1∠90° (that is j) and z₂ = 1∠90°.',
    'Read the product: 1∠180° — you built j² = −1.',
    'Now set z₂ = 1∠270° (that is ∠−90°: a clockwise quarter turn — the sliders count 0–360°) and explain why the product is 1∠0°.',
    'Finish: what z₂ turns 2∠30° into a pure real number?',
  ],
  hint: 'Angles add. To land on the real axis, the angles must sum to 0° or 360° (or 180°) — z₂ = 1∠330° (that is ∠−30°) or 1∠150°.',
};

export function PhasorAlgebra() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('math-phasors'); }, [markVisited]);

  return (
    <div className="space-y-8">
      <SectionHook text="Add v₁ = 3cos(ωt) and v₂ = 4cos(ωt + 90°) with trig identities: a page of algebra. As arrows tip-to-tail: one right triangle, 5∠53°. That arrow-algebra is a two-line theorem about e^{jθ} — and Part 5 runs on it." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('math-phasors')}
          </span>
          Complex Numbers &amp; Phasors
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          The algebra of rotating arrows — from the em-wave phasor view to Γ_L e^{'{'}−j2βl{'}'}
        </p>
      </div>

      <TableOfContents items={tocEntries} />

      {/* ── Motivation: the object you have already been drawing ── */}
      <SectionAnchor id="motivation" label="Rotating Arrows" className="scroll-mt-4">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Rotating Arrows</h2>
        <p className="text-slate-700 dark:text-slate-300">
          In Section {getSectionNumber('em-wave')} you watched a phasor spin and drop its shadow on
          the Re axis; in Section {getSectionNumber('s-domain')} you placed poles at s = σ + jω.
          Both are this section's object: a complex number is a 2-D arrow, j is the 90° rotation,
          and j² = −1 is 'two quarter-turns is a U-turn'.
        </p>
      </section>
      </SectionAnchor>

      {/* ── Euler's formula, derived not asserted ── */}
      <SectionAnchor id="euler" label="Euler's Formula" className="scroll-mt-4">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Euler's Formula</h2>
        <p className="text-slate-700 dark:text-slate-300">
          Rather than take the exponential-to-trig connection on faith, derive it — start from a
          function whose derivative is suspiciously familiar, and watch the rest fall out in four
          short steps.
        </p>
        <WorkedSteps
          tryFirstPrompt="Differentiate cosθ + j sinθ once and compare with the original before revealing."
          steps={[
            {
              title: 'Step 1 — Differentiate the guess',
              body: (
                <>
                  <MathWrapper formula="\frac{d}{d\theta}(\cos\theta + j\sin\theta) = -\sin\theta + j\cos\theta = j(\cos\theta + j\sin\theta)" block className="max-w-[calc(100vw-8rem)]" />
                  <p>The derivative is j times itself.</p>
                </>
              ),
            },
            {
              title: 'Step 2 — Pin the constant at θ = 0',
              body: (
                <>
                  <p className="mb-2">
                    Functions satisfying <MathWrapper formula="f' = jf" /> form the family{' '}
                    <MathWrapper formula="f = C\!\cdot\! e^{j\theta}" /> — the constant is pinned by
                    the starting value: at θ = 0 ours is <MathWrapper formula="\cos 0 + j\sin 0 = 1" />,
                    so <MathWrapper formula="C = 1" /> (without this step the answer could just as
                    well be <MathWrapper formula="7e^{j\theta}" />).
                  </p>
                </>
              ),
            },
            {
              title: 'Step 3 — Conclude',
              body: (
                <>
                  <MathWrapper formula="\cos\theta + j\sin\theta = e^{j\theta}" block />
                  <p>Exactly — not an approximation, not just for small θ.</p>
                </>
              ),
            },
            {
              title: 'Step 4 — What multiplying by e^{jθ} does',
              body: (
                <>
                  <p className="mb-2">
                    So multiplying by e^{'{'}jθ{'}'} rotates an arrow by θ without changing its
                    length — check:
                  </p>
                  <MathWrapper formula="e^{j\pi} = -1" block />
                  <p className="mt-2">
                    A half-turn, matching the e^{'{'}±jβl{'}'} line Section {getSectionNumber('line-impedance')} already cites.
                  </p>
                </>
              ),
            },
          ]}
        />
      </section>
      {/* Always visible — NOT inside WorkedSteps (which hides steps 2+ behind
          reveal clicks). The section's headline identity must never be hidden. */}
      <div className="rounded-lg bg-engineering-blue-50 dark:bg-engineering-blue-900/20 border border-engineering-blue-200 dark:border-engineering-blue-800 p-4 mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-engineering-blue-700 dark:text-engineering-blue-400 mb-1">
          Euler's Identity
        </p>
        <MathWrapper formula="e^{j\theta} = \cos\theta + j\sin\theta" block />
      </div>
      </SectionAnchor>

      {/* ── LabStation: The Phasor Multiplier ── */}
      <SectionAnchor id="multiplier" label="Lab: The Phasor Multiplier" className="scroll-mt-4">
      <LabStation
        number={getSectionNumber('math-phasors')}
        title="The Phasor Multiplier"
        objective="Predict where a product arrow lands, then sweep the angle sliders and watch lengths multiply while angles add."
      >
        <PredictionGate
          question="z₁ = 2∠30° and z₂ = 3∠45°. Where does the product z₁z₂ land?"
          options={[
            { id: 'mul-add', label: '6∠75° — lengths multiply, angles add' },
            { id: 'add-add', label: '5∠75° — lengths add, angles add' },
            { id: 'mul-mul', label: '6∠1350° — everything multiplies' },
          ]}
          getCorrectAnswer={() => 'mul-add'}
          explanation={<span>Write both in Euler form: z₁z₂ = 2e^(j30°) · 3e^(j45°) = (2·3)e^(j(30°+45°)). Exponents add — so angles add, and the magnitudes out front multiply.</span>}
          onPredict={(correct) => markPredictionGate('math-phasors', correct)}
        >
          <PhasorMultiplierSim />
        </PredictionGate>
      </LabStation>
      </SectionAnchor>

      {/* ── Phasor dictionary ── */}
      <SectionAnchor id="phasors" label="Phasor Dictionary" className="scroll-mt-4">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Phasor Dictionary</h2>
        <p className="text-slate-700 dark:text-slate-300">
          Every AC voltage or current in this course is, first, a real cosine — the phasor is a
          bookkeeping shortcut for its amplitude and phase, never a replacement for it:
        </p>
        <MathWrapper formula="v(t) = V_m\cos(\omega t + \phi)" block />
        <p className="text-slate-700 dark:text-slate-300">
          Euler lets you rewrite that cosine as the real part of a spinning complex exponential:
        </p>
        <MathWrapper formula="v(t) = \mathrm{Re}\{V_m e^{j\phi} e^{j\omega t}\}" block />
        <p className="text-slate-700 dark:text-slate-300">
          Freeze the spinning arrow at t = 0 and carry only the frozen part — that frozen arrow is
          the phasor (Nilsson's bold circuit-phasor typography):
        </p>
        <MathWrapper formula="\mathbf{V} = V_m e^{j\phi} = V_m\angle\phi" block />
        <p className="text-slate-700 dark:text-slate-300">
          This section's first consumers compute Γ = (Z_L − Z_0)/(Z_L + Z_0) and Z = V/I on contact,
          so division needs to be as automatic as multiplication:
        </p>
        <MathWrapper formula="\frac{z_1}{z_2}" block />
        <p className="text-slate-700 dark:text-slate-300">
          division divides lengths and subtracts angles:
        </p>
        <MathWrapper formula="\frac{e^{j\alpha}}{e^{j\beta}} = e^{j(\alpha-\beta)}" block />
      </section>

      <ConceptCheck
        data={{
          mode: 'predict-reveal',
          question: 'Multiply any z by j twice. Where does the arrow end up, and what famous equation did you just re-derive?',
          answer: 'Two 90° CCW turns = one 180° turn: −z. That is j² = −1, read as geometry.',
          hints: ['j is a 90° counter-clockwise rotation — apply it twice.'],
        }}
        onComplete={() => incrementConceptChecks('math-phasors')}
        onHint={() => incrementHints('math-phasors')}
      />

      <ConceptCheck
        data={{
          mode: 'multiple-choice',
          question: 'On a line with Γ_L = 0.5, the round-trip factor is Γ_L e^{−j2βl}. At βl = 90° (a quarter wavelength), what is it?',
          options: [
            { text: '−0.5 — the arrow rotated a half turn clockwise', correct: true, explanation: `2βl = 180°, and e^{−j180°} = −1. One quarter wave down the line, the reflected arrow points the opposite way — the quarter-wave transformer in Section ${getSectionNumber('line-impedance')} is exactly this sign flip.` },
            { text: '+0.5 — nothing changed', correct: false, explanation: 'A quarter-wavelength round trip is not zero rotation — e^{−j180°} flips the sign; it does not leave the factor unchanged.' },
            { text: '0.5e^{−j90°} = −j0.5', correct: false, explanation: 'That treats βl itself as the exponent, but the round trip covers the line twice — the exponent is −j2βl = −j180°, not −j90°.' },
            { text: 'Zero — the reflection dies', correct: false, explanation: 'Rotating a phasor never shrinks its length — |Γ_L e^{−j2βl}| = |Γ_L| = 0.5 always; only the angle changes.' },
          ],
        }}
        onComplete={() => incrementConceptChecks('math-phasors')}
        onHint={() => incrementHints('math-phasors')}
      />

      <ConceptCheck
        data={{
          mode: 'predict-reveal',
          question: 'What is the phasor of v(t) = 5cos(ωt − 90°)?',
          answer: "V = 5e^{−j90°} = −j5: length 5 pointing straight down the −Im axis. A −90° phase is a quarter-turn clockwise — 'lags by 90°' and '×(−j)' are the same sentence.",
          hints: ['Match −90° to the angle in V = 5∠(?).'],
        }}
        onComplete={() => incrementConceptChecks('math-phasors')}
        onHint={() => incrementHints('math-phasors')}
      />
      </SectionAnchor>

      <YourTurnPanel
        scenario="Two bench signals add at a node: 3∠0° and 4∠90° (same ω)."
        question="What is the phasor sum?"
        options={[
          { text: '5∠53.1°', correct: true, explanation: '3-4-5 triangle: tip-to-tail.' },
          { text: '7∠45°', correct: false, explanation: "lengths don't simply add unless the arrows are parallel." },
          { text: '5∠90°', correct: false, explanation: 'The magnitude is right, but the sum does not point straight up the Im axis — work out atan2(4,3), not just the larger component.' },
          { text: '1∠−90°', correct: false, explanation: 'Tip-to-tail addition of 3∠0° and 4∠90° lands in the first quadrant, not on the −Im axis.' },
        ]}
        correctReveal={
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <MathWrapper formula="3 + j4 = 5e^{j53.1^{\circ}}" block />
          </div>
        }
      />

      <p className="text-slate-700 dark:text-slate-300">
        Part 5 will write every wave on a line as one of these arrows: Section {getSectionNumber('transmission-lines')} launches
        them, Section {getSectionNumber('line-impedance')} rotates them with e^{'{'}−j2βl{'}'}.
      </p>

      <SectionAnchor id="challenge" label="Guided Challenge" className="scroll-mt-4">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>

      <CourseNavigation />
    </div>
  );
}
