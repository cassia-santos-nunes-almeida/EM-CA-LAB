import { useEffect } from 'react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { LabStation } from '@shared/components/common/LabStation';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { CoverUpStepper } from '@circuits/components/modules/PartialFractions/CoverUpStepper';
import { IDENTIFICATION_COST } from '@circuits/components/modules/PartialFractions/coverUpData';

const tocEntries = [
  { id: 'puzzle', label: 'Not in the Table' },
  { id: 'identification', label: 'Method 1: Identification' },
  { id: 'cover-up', label: 'Lab: The Cover-Up' },
  { id: 'repeated-poles', label: 'Repeated Poles' },
  { id: 'complex-poles', label: 'Complex Poles' },
  { id: 'challenge', label: 'Guided Challenge' },
];

/** Compact 4-row rendering of the Laplace Theory transform-pair table. */
const TABLE_ROWS: Array<{ time: string; freq: string }> = [
  { time: 'u(t)', freq: '\\frac{1}{s}' },
  { time: 'e^{-at}u(t)', freq: '\\frac{1}{s+a}' },
  { time: '\\sin(\\omega t)\\,u(t)', freq: '\\frac{\\omega}{s^2+\\omega^2}' },
  { time: 'te^{-at}u(t)', freq: '\\frac{1}{(s+a)^2}' },
];

const CHALLENGE = {
  title: 'Beat the Table',
  description:
    'A guided pass from brute-force identification to the ten-second thumb, ending at the two theorems that audit your arithmetic for free.',
  instructions: [
    'Confirm the flagship F(s) matches no row of the Laplace Theory transform table.',
    'Count what identification costs in the worked block: one expansion, three simultaneous equations.',
    'Run the Cover-Up solving C first, then A, then B — order does not matter, isolation does.',
    'Before assembling f(t), verify A + B + C = 0 and name the theorem that demands it (initial value: f(0⁺) = 0).',
    'Enable the terms one by one on the plot and watch which pole rules early times (−8, the fast one) and which coefficient sets the final value (A = 10).',
    'Explain in one sentence why the thumb slips for B at a repeated pole — then verify B = −100 both ways in the Repeated Poles block.',
  ],
  hint: 'Cover-up is just "multiply by the factor, then make every other term vanish" — when one cover cannot fully cancel a factor, the thumb slips and identification (or the derivative rule) takes over.',
};

export function PartialFractions() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('partial-fractions'); }, [markVisited]);

  return (
    <div className="space-y-8">
      <SectionHook text="In 1880s London, a self-taught telegraph engineer named Oliver Heaviside got tired of solving simultaneous equations just to invert a transform. So he found a shortcut: cover a factor with your thumb, substitute, done. The establishment called it unrigorous. It was also always right — and it is still the fastest trick in circuit analysis." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('partial-fractions')}
          </span>
          Partial Fractions &amp; Heaviside
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          The expansion methods behind every inverse transform — identification and the Heaviside cover-up
        </p>
      </div>

      <FigureImage
        className="mb-6"
        src={`${import.meta.env.BASE_URL}figures/heaviside-portrait.jpg`}
        alt="Black-and-white portrait photograph of Oliver Heaviside"
        caption="Oliver Heaviside — the self-taught telegraph engineer whose thumb-on-the-factor shortcut turns partial-fraction expansion into a ten-second trick."
        attribution="Public Domain — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Oheaviside.jpg"
      />

      <TableOfContents items={tocEntries} />

      {/* ── The puzzle ── */}
      <SectionAnchor id="puzzle" label="Not in the Table" className="scroll-mt-4">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Not in the Table</h2>
        <p className="text-slate-700 dark:text-slate-300">
          An s-domain nodal analysis of a two-stage RC filter's step response (you will build these
          yourself in the next section) leaves you holding
        </p>
        <MathWrapper formula="F(s) = \frac{96(s+5)}{s(s+8)(s+6)}" block />
        <p className="text-slate-700 dark:text-slate-300">
          Find <MathWrapper formula="v(t)" />. First instinct: look it up.
        </p>
        <table className="w-full max-w-md mx-auto text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
              <th scope="col" className="py-1.5 pr-3 font-semibold text-slate-600 dark:text-slate-400">f(t)</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold text-slate-600 dark:text-slate-400">F(s)</th>
              <th scope="col" className="py-1.5 font-semibold text-slate-600 dark:text-slate-400">Match?</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row) => (
              <tr key={row.time} className="border-b border-slate-100 dark:border-slate-700/50">
                <td className="py-1.5 pr-3"><MathWrapper formula={row.time} /></td>
                <td className="py-1.5 pr-3"><MathWrapper formula={row.freq} /></td>
                <td className="py-1.5 text-amber-600 dark:text-amber-400 font-mono">✗</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-center">
          <span className="inline-block font-mono text-sm font-bold tracking-widest uppercase text-amber-700 dark:text-amber-400 border-2 border-amber-400 dark:border-amber-600 rounded px-3 py-1 -rotate-2">
            No match
          </span>
        </p>
        <p className="text-slate-700 dark:text-slate-300">
          The plan from the Laplace Theory section still stands: split <MathWrapper formula="F(s)" /> into
          table-sized pieces
        </p>
        <MathWrapper formula="F(s) = \frac{A}{s} + \frac{B}{s+8} + \frac{C}{s+6}" block />
        <p className="text-slate-700 dark:text-slate-300">
          But that section never showed HOW to get A, B, C — its Example 3 just announced
          "A&nbsp;=&nbsp;2.5, B&nbsp;=&nbsp;−2.5". This page pays that debt — twice over.
        </p>
      </section>
      </SectionAnchor>

      {/* ── Method 1: identification, shown in full pain ── */}
      <SectionAnchor id="identification" label="Method 1: Identification" className="scroll-mt-4">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Method 1: Identification</h2>
        <p className="text-slate-700 dark:text-slate-300">
          The course-named "identification method": expand, match coefficients, solve the system.
          Shown completely, once.
        </p>
        <WorkedSteps
          tryFirstPrompt="Try matching the s² coefficients yourself before revealing."
          steps={[
            {
              title: 'Step 1 — Multiply through by the denominator',
              body: (
                <>
                  <p className="mb-2">Clear all fractions — multiply both sides by <MathWrapper formula="s(s+8)(s+6)" />:</p>
                  <MathWrapper formula="A(s+8)(s+6) + Bs(s+6) + Cs(s+8) = 96s + 480" block />
                </>
              ),
            },
            {
              title: 'Step 2 — Match powers of s',
              body: (
                <>
                  <MathWrapper formula="s^2:\; A + B + C = 0" block />
                  <MathWrapper formula="s^1:\; 14A + 6B + 8C = 96" block />
                  <MathWrapper formula="s^0:\; 48A = 480" block />
                </>
              ),
            },
            {
              title: 'Step 3 — Back-substitute',
              body: (
                <>
                  <MathWrapper formula="A = 10, \quad B = -18, \quad C = 8" block />
                  <p className="mt-2">
                    Verify the s¹ row: <MathWrapper formula="140 - 108 + 64 = 96" /> ✓
                  </p>
                </>
              ),
            },
          ]}
        />
        <p className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded px-3 py-2 inline-block">
          {IDENTIFICATION_COST}
        </p>
        <p className="text-slate-700 dark:text-slate-300">
          Identification ALWAYS works — it is the fully general method, and the only route for some
          repeated and complex cases. But for distinct poles there is a ten-second shortcut.
        </p>
      </section>
      </SectionAnchor>

      {/* ── LabStation: The Cover-Up ── */}
      <SectionAnchor id="cover-up" label="Lab: The Cover-Up" className="scroll-mt-4">
      <LabStation
        number={getSectionNumber('partial-fractions')}
        title="The Cover-Up"
        objective="Cover each factor with your thumb, harvest the residues in any order, then assemble f(t) term by term."
      >
        <PredictionGate
          question="To find B in F(s) = A/s + B/(s+8) + C/(s+6) by cover-up, you cover one factor and evaluate everything you can still see at s = ?"
          options={[
            { id: 'm8', label: 's = −8' },
            { id: 'zero', label: 's = 0' },
            { id: 'm5', label: 's = −5' },
          ]}
          getCorrectAnswer={() => 'm8'}
          explanation={
            <span>
              Multiply both sides by (s+8): every term on the right except B keeps a factor that
              vanishes at s = −8 — evaluating there isolates B exactly. The "cover-up" is just this
              multiplication done with your thumb. (And −5 is a ZERO of F(s), not a pole — zeros get
              covered by nobody.)
            </span>
          }
          onPredict={(correct) => markPredictionGate('partial-fractions', correct)}
        >
          <CoverUpStepper />
        </PredictionGate>
      </LabStation>
      </SectionAnchor>

      <ConceptCheck
        data={{
          mode: 'predict-reveal',
          question: 'Without inverting anything: what is the final value f(∞) of the flagship response — and which single coefficient already told you?',
          answer: '10 — the coefficient A of the 1/s term IS the DC final value. Equivalently the final-value theorem: lim s→0 of sF(s) = 96·5/(8·6) = 10. The s = 0 cover-up and the FVT are the same computation — if they ever disagree, an arithmetic slip is hiding. (FVT is valid here because the remaining poles sit in the left half-plane.)',
          hints: ['Which term survives as t → ∞?', 'Multiply by s, let s → 0.'],
        }}
        onComplete={() => incrementConceptChecks('partial-fractions')}
        onHint={() => incrementHints('partial-fractions')}
      />

      {/* ── Repeated poles ── */}
      <SectionAnchor id="repeated-poles" label="Repeated Poles" className="scroll-mt-4">
      <CollapsibleSection title="Repeated Poles" defaultOpen={true}>
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            A squared factor needs one slot per power:
          </p>
          <MathWrapper formula="F(s) = \frac{100(s+25)}{s(s+5)^2} = \frac{A}{s} + \frac{B}{s+5} + \frac{C}{(s+5)^2}" block />
          <WorkedSteps
            steps={[
              {
                title: 'Step 1 — Cover-up still nails the two extremes',
                body: (
                  <>
                    <MathWrapper formula="A = \left.\frac{100(s+25)}{(s+5)^2}\right|_{s=0} = \frac{2500}{25} = 100" block />
                    <MathWrapper formula="C = \left.\frac{100(s+25)}{s}\right|_{s=-5} = \frac{2000}{-5} = -400" block />
                    <p className="mt-2">
                      A is a simple pole; C comes from covering the ENTIRE squared factor.
                    </p>
                  </>
                ),
              },
              {
                title: 'Step 2 — B resists the thumb',
                body: (
                  <>
                    <p className="mb-2">
                      Covering <MathWrapper formula="(s+5)" /> once still leaves a factor vanishing
                      at −5 — the thumb slips. Two escapes, both shown. Escape 1, identification —
                      match the s² coefficients:
                    </p>
                    <MathWrapper formula="s^2:\; A + B = 0 \;\Rightarrow\; B = -100" block />
                  </>
                ),
              },
              {
                title: 'Step 3 — …or the derivative rule',
                body: (
                  <MathWrapper formula="B = \left.\frac{d}{ds}\!\left[\frac{100(s+25)}{s}\right]\right|_{s=-5} = \left.\frac{-2500}{s^2}\right|_{s=-5} = -100" block />
                ),
              },
              {
                title: 'Step 4 — Assemble and audit',
                body: (
                  <>
                    <MathWrapper formula="f(t) = \left(100 - 100e^{-5t} - 400te^{-5t}\right)u(t)" block />
                    <p className="mt-2">
                      Note the <MathWrapper formula="te^{-5t}" /> term: a repeated pole IS the
                      critically-damped shape from the Circuit Analysis and Interactive Lab
                      sections. Check: f(0⁺) = 100 − 100 − 0 = 0 ✓.
                    </p>
                  </>
                ),
              },
            ]}
          />
          <ConceptCheck
            data={{
              mode: 'multiple-choice',
              question: 'For N(s)/(s(s+5)²), which coefficient can the plain cover-up NOT deliver directly?',
              options: [
                { text: 'B, the coefficient of 1/(s+5)', correct: true, explanation: 'Correct! Covering one (s+5) still leaves the other vanishing at −5 — use identification or the derivative rule.' },
                { text: 'A, the coefficient of 1/s', correct: false, explanation: 'The pole at 0 is simple — the thumb works.' },
                { text: 'C, the coefficient of 1/(s+5)²', correct: false, explanation: 'Covering the ENTIRE squared factor isolates C cleanly.' },
                { text: 'none — cover-up always works', correct: false, explanation: 'Only for distinct poles, and only the highest power of a repeated one.' },
              ],
              hints: ['Try covering and watch what still vanishes.', 'Cover-up returns the coefficient of the factor you covered — at its FULL power.'],
            }}
            onComplete={() => incrementConceptChecks('partial-fractions')}
            onHint={() => incrementHints('partial-fractions')}
          />
        </div>
      </CollapsibleSection>
      </SectionAnchor>

      {/* ── Complex poles (stretch) ── */}
      <SectionAnchor id="complex-poles" label="Complex Poles" className="scroll-mt-4">
      <CollapsibleSection title="Complex Poles" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            A complex-conjugate pole pair never factors over the reals — keep the quadratic whole:
            {' '}The arrow picture of complex numbers behind this cos/sin split — magnitudes, angles,
            and Euler's identity — is built hands-on in Section {getSectionNumber('math-phasors')}.
          </p>
          <MathWrapper formula="F(s) = \frac{100(s+3)}{(s+6)(s^2+6s+25)}" block />
          <WorkedSteps
            steps={[
              {
                title: 'Step 1 — Cover-up at the real pole',
                body: (
                  <MathWrapper formula="\left.\frac{100(s+3)}{s^2+6s+25}\right|_{s=-6} = \frac{-300}{25} = -12" block />
                ),
              },
              {
                title: 'Step 2 — Remainder by identification',
                body: (
                  <MathWrapper formula="\frac{100(s+3)}{(s+6)(s^2+6s+25)} = \frac{-12}{s+6} + \frac{12s+100}{s^2+6s+25}" block />
                ),
              },
              {
                title: 'Step 3 — Complete the square and split',
                body: (
                  <>
                    <MathWrapper formula="s^2+6s+25 = (s+3)^2 + 4^2" block />
                    <MathWrapper formula="12s + 100 = 12(s+3) + 64" block />
                  </>
                ),
              },
              {
                title: 'Step 4 — Table rows: damped cosine + sine',
                body: (
                  <MathWrapper formula="f(t) = \left(-12e^{-6t} + 12e^{-3t}\cos 4t + 16e^{-3t}\sin 4t\right)u(t)" block />
                ),
              },
            ]}
          />
          <p className="rounded-lg bg-engineering-blue-50 dark:bg-engineering-blue-900/20 border border-engineering-blue-200 dark:border-engineering-blue-800 p-3 text-sm text-slate-700 dark:text-slate-300">
            Complex-conjugate poles ⇒ damped oscillation — exactly the underdamped pole pairs you
            will read straight off the s-plane in the next section. No further machinery here —
            that section owns the map.
          </p>
        </div>
      </CollapsibleSection>
      </SectionAnchor>

      {/* ── Improper-fraction guard ── */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Before you expand: the improper-fraction guard
        </h3>
        <p className="text-slate-700 dark:text-slate-300">
          If <MathWrapper formula="\deg N \ge \deg D" />, polynomial-divide first:
        </p>
        <MathWrapper formula="\frac{s^2+3s+1}{s^2+2s+1} = 1 + \frac{s}{(s+1)^2}" block />
        <p className="text-slate-700 dark:text-slate-300">
          The quotient 1 inverts to <MathWrapper formula="\delta(t)" />. Partial fractions applies
          to proper fractions only.
        </p>
        <ConceptCheck
          data={{
            mode: 'multiple-choice',
            question: 'Before expanding F(s) = (s³ + 2s + 6)/(s² + 3s + 2) you must first:',
            options: [
              { text: 'polynomial-divide — the fraction is improper (deg 3 ≥ deg 2)', correct: true, explanation: 'Correct! The quotient terms become impulse/doublet terms; only the proper remainder gets partial fractions.' },
              { text: 'factor the numerator', correct: false, explanation: 'Numerator roots are zeros — they never get expanded over.' },
              { text: 'complete the square', correct: false, explanation: 'That is for complex poles; these poles are −1 and −2, real.' },
              { text: 'nothing — expand directly', correct: false, explanation: 'Cover-up assumes a proper fraction; try it and watch the t → ∞ behavior break.' },
            ],
          }}
          onComplete={() => incrementConceptChecks('partial-fractions')}
          onHint={() => incrementHints('partial-fractions')}
        />
      </div>

      <YourTurnPanel
        scenario="A different bench problem hands you F(s) = (17s + 8) / (s(s+1)(s+4))."
        question="Use the cover-up: what is B, the coefficient of 1/(s+1)?"
        options={[
          { text: '3', correct: true, explanation: 'Correct! B = (17·(−1)+8)/((−1)(−1+4)) = (−9)/(−3) = 3.' },
          { text: '−3', correct: false, explanation: 'Watch both signs: the visible factors at s = −1 are (−1) and (3) — their product is −3, and −9/−3 = +3.' },
          { text: '2', correct: false, explanation: 'That is A (cover s, set s = 0: 8/4 = 2) — you covered the wrong factor.' },
        ]}
        correctReveal={
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <MathWrapper formula="B = \left.\frac{17s+8}{s(s+4)}\right|_{s=-1} = \frac{-9}{(-1)(3)} = 3" block />
            <p>And for free:</p>
            <MathWrapper formula="A = \frac{8}{4} = 2 \qquad C = \left.\frac{17s+8}{s(s+1)}\right|_{s=-4} = \frac{-60}{(-4)(-3)} = -5" block />
            <MathWrapper formula="f(t) = \left(2 + 3e^{-t} - 5e^{-4t}\right)u(t)" block />
            <p className="font-medium">Sanity check: f(0) = 2 + 3 − 5 = 0 ✓ (the degree gap is 2 again).</p>
          </div>
        }
      />

      <p className="text-slate-700 dark:text-slate-300">
        You can now invert anything the table cannot swallow whole. Next: stop inverting and start
        READING — the s-plane map where each pole's position tells you the story before you compute
        a single residue.
      </p>

      <SectionAnchor id="challenge" label="Guided Challenge" className="scroll-mt-4">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>

      <CourseNavigation />
    </div>
  );
}
