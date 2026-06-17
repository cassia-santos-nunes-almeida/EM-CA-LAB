import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { FigureImage } from '@shared/components/common/FigureImage';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { SectionHook } from '@shared/components/common/SectionHook';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { LabStation } from '@shared/components/common/LabStation';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { SourceKnockoutBench } from '@circuits/components/modules/CircuitTheorems/SourceKnockoutBench';
import { BlackBoxPort } from '@circuits/components/modules/CircuitTheorems/BlackBoxPort';
import { MaxPowerChart } from '@circuits/components/modules/CircuitTheorems/MaxPowerChart';
import {
  SourceNetworkDiagram,
  TheveninTwinDiagram,
  NortonDiagram,
} from '@circuits/components/modules/CircuitTheorems/TheoremsDiagrams';
import { LOAD_TABLE } from '@circuits/components/modules/CircuitTheorems/theoremData';

const SECTION_ID = 'circuit-theorems';

const tocEntries = [
  { id: 'puzzle', label: 'Four Loads, One Circuit' },
  { id: 'knockout', label: 'Lab: Source Knock-Out Bench' },
  { id: 'blackbox', label: 'Lab: Black-Box Port' },
  { id: 'norton', label: 'Norton & Source Transformation' },
  { id: 'max-power', label: 'Lab: Max-Power Bench' },
  { id: 'sanity', label: 'The Sanity-Check Triad' },
  { id: 'challenge', label: 'Guided Challenge' },
];

/** Tiny P–R curve sketches for the max-power prediction options. */
const fallingSketch = (
  <svg viewBox="0 0 80 40" className="w-full h-auto" aria-hidden="true">
    <line x1="6" y1="36" x2="76" y2="36" stroke="#94a3b8" strokeWidth="1" />
    <line x1="6" y1="36" x2="6" y2="4" stroke="#94a3b8" strokeWidth="1" />
    <path d="M8 6 Q 22 28 74 33" stroke="#3b82f6" strokeWidth="2" fill="none" />
  </svg>
);

const peakSketch = (
  <svg viewBox="0 0 80 40" className="w-full h-auto" aria-hidden="true">
    <line x1="6" y1="36" x2="76" y2="36" stroke="#94a3b8" strokeWidth="1" />
    <line x1="6" y1="36" x2="6" y2="4" stroke="#94a3b8" strokeWidth="1" />
    <path d="M8 34 Q 18 6 28 8 Q 44 12 74 30" stroke="#3b82f6" strokeWidth="2" fill="none" />
  </svg>
);

const risingSketch = (
  <svg viewBox="0 0 80 40" className="w-full h-auto" aria-hidden="true">
    <line x1="6" y1="36" x2="76" y2="36" stroke="#94a3b8" strokeWidth="1" />
    <line x1="6" y1="36" x2="6" y2="4" stroke="#94a3b8" strokeWidth="1" />
    <path d="M8 34 Q 50 30 74 6" stroke="#3b82f6" strokeWidth="2" fill="none" />
  </svg>
);

const CHALLENGE = {
  title: 'Two Numbers Beat Four Solves',
  description: 'A guided pass over all three benches, ending with the one idea they share: a linear two-terminal network has only two degrees of freedom.',
  instructions: [
    'On the Knock-Out Bench, record V_A with each source alone and verify 8 + 4 = 12.',
    'State in one sentence why the same addition would fail for power.',
    'On the Black-Box instrument, take both measurements and compute R_th two ways: V_oc/I_sc and killed-sources 6∥3.',
    'Attach all four catalog loads and confirm the full network and the 2-component twin never disagree.',
    'On the Max-Power chart, find which two catalog loads tie at 16 W and explain how two different resistors can draw equal power.',
  ],
  hint: 'Every number in this section comes from just two facts: V_th = 12 V and R_th = 2 Ω.',
};

export function CircuitTheorems() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited(SECTION_ID); }, [markVisited]);

  const [showNorton, setShowNorton] = useState(false);

  return (
    <div className="space-y-8">
      <SectionHook text="Your sensor needs a load resistor, and the catalog has four candidates. You could re-run nodal analysis four times — once per resistor. Or you could collapse the entire source network into two numbers, once, and read off all four answers in your head. That collapse is Thevenin's theorem — proved by a French telegraph engineer in 1883." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber(SECTION_ID)}
          </span>
          Circuit Theorems
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Superposition, Thevenin &amp; Norton equivalents, and maximum power transfer
        </p>
      </div>

      <FigureImage
        className="mb-6"
        src={`${import.meta.env.BASE_URL}figures/thevenin-portrait.jpg`}
        alt="Portrait photograph of Léon Charles Thévenin"
        caption="Léon Charles Thévenin (1857–1926), the French telegraph engineer whose 1883 theorem collapses any linear source network into one voltage and one resistance."
        attribution="Public Domain — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Leon_Charles_Thevenin.jpg"
      />

      <TableOfContents items={tocEntries} />

      {/* ── The puzzle ───────────────────────────────────────────────────── */}
      <section id="puzzle" className="scroll-mt-4 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Four Loads, One Circuit
        </h2>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            A load <MathWrapper formula="R_L \in \{1, 2, 4, 10\}\ \Omega" /> will attach to the
            port. Find <MathWrapper formula="i_L" /> for each.
          </p>
          <div className="max-w-md">
            <SourceNetworkDiagram portMode="open" />
          </div>
          <p className="text-sm text-muted">
            The source network: a 24 V source behind R1 = 6 Ω into node A, a 2 A source
            injecting into A, R2 = 3 Ω from A to ground — and an open two-terminal port
            between A and ground.
          </p>
        </div>

        <div className="rounded-lg bg-chassis border border-card-border p-4 space-y-3">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
            Attempt log — brute force
          </p>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="font-mono">ATTACH R_L = 1 Ω → full nodal solve at node A:</p>
            <MathWrapper
              formula="\frac{V_A - 24}{6} + \frac{V_A}{3} + \frac{V_A}{1} - 2 = 0 \;\Rightarrow\; 1.5\,V_A = 6 \;\Rightarrow\; V_A = 4\ \text{V}, \quad i_L = 4\ \text{A}"
              block
            />
          </div>
          <ul className="space-y-1.5 font-mono text-sm text-slate-400 dark:text-slate-500">
            {[2, 4, 10].map((r, idx) => (
              <li key={r} className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>R_L = {r} Ω — queued: full nodal solve #{idx + 2}</span>
              </li>
            ))}
          </ul>
          <p className="font-mono font-bold text-red-600 dark:text-red-400 tracking-widest">
            WORKS, BUT DOESN'T SCALE
          </p>
        </div>

        <p className="text-slate-700 dark:text-slate-300">
          Re-solving the whole network for every candidate load is honest work — and a waste of
          it. By the end of this page each case is one division.
        </p>
      </section>

      {/* ── Lab 1: Source Knock-Out Bench (superposition) ────────────────── */}
      <LabStation
        id="knockout"
        className="scroll-mt-4"
        number={getSectionNumber(SECTION_ID)}
        title="Source Knock-Out Bench"
        objective="Turn each source off in turn, read node A, and watch the two partial answers add up to the real one."
      >
        <PredictionGate
          question="To analyze one source at a time, you must 'turn off' the others. Turning OFF the 2 A current source means replacing it with:"
          options={[
            { id: 'open', label: 'an open circuit (break the branch)' },
            { id: 'short', label: 'a short circuit (a wire)' },
            { id: 'remove', label: 'removing that branch AND the 24 V source' },
          ]}
          getCorrectAnswer={() => 'open'}
          explanation={<span>'Off' means the source quantity is zero. A current source set to 0 A passes no current — an open circuit. A VOLTAGE source set to 0 V is the opposite: a short. Mixing these up is the classic superposition error.</span>}
          onPredict={(correct) => markPredictionGate(SECTION_ID, correct)}
        >
          <SourceKnockoutBench />
        </PredictionGate>
      </LabStation>

      <ConceptCheck
        data={{
          mode: 'multiple-choice',
          question: 'While the 24 V source is off (shorted), what resistance does the 2 A source see looking into the rest of the circuit?',
          options: [
            { text: '6 ∥ 3 = 2 Ω', correct: true, explanation: 'Correct! The short puts R1 straight to ground — parallel with R2.' },
            { text: '6 + 3 = 9 Ω', correct: false, explanation: 'They are not in series: both now connect node A to ground.' },
            { text: '3 Ω only', correct: false, explanation: 'R1 still conducts — its far end is grounded by the dead source, not removed.' },
            { text: '∞ (open)', correct: false, explanation: 'It is the dead CURRENT source that opens — the dead voltage source shorts.' },
          ],
          hints: ['Trace from node A to ground along both paths.', 'A dead voltage source is a wire.'],
        }}
        onComplete={() => incrementConceptChecks(SECTION_ID)}
        onHint={() => incrementHints(SECTION_ID)}
      />

      <ConceptCheck
        data={{
          mode: 'predict-reveal',
          question: 'Power in R2 with both sources on: P = 12²/3 = 48 W. Do the two single-source powers add up to 48 W?',
          answer: 'No — 8²/3 + 4²/3 = 80/3 ≈ 26.7 W ≠ 48 W. Power is quadratic in voltage and (8+4)² ≠ 8² + 4² — the cross-term 2·8·4/3 = 21.3 W is real power. Superpose voltages and currents, THEN compute power from the totals — never superpose power.',
          hints: ['How does P depend on V?', 'Expand (8 + 4)².'],
        }}
        onComplete={() => incrementConceptChecks(SECTION_ID)}
        onHint={() => incrementHints(SECTION_ID)}
      />

      {/* ── Lab 2: Black-Box Port Instrument (Thevenin by measurement) ───── */}
      <LabStation
        id="blackbox"
        className="scroll-mt-4"
        number={getSectionNumber(SECTION_ID)}
        title="Black-Box Port Instrument"
        objective="Two measurements at a mystery port fully characterize whatever linear network hides inside — then prove it, load by load."
      >
        <PredictionGate
          question="At a mystery two-terminal port you measure open-circuit voltage V_oc = 12 V and short-circuit current I_sc = 6 A. The Thevenin resistance of whatever is inside is:"
          options={[
            { id: 'two', label: '2 Ω' },
            { id: 'seventytwo', label: '72 Ω' },
            { id: 'cant', label: 'cannot be determined without opening the box' },
          ]}
          getCorrectAnswer={() => 'two'}
          explanation={<span>The model V_th in series with R_th must reproduce both measurements: open circuit gives <MathWrapper formula="V_{th} = 12\ \text{V}" />; shorting gives <MathWrapper formula="I_{sc} = V_{th}/R_{th}" />, so <MathWrapper formula="R_{th} = 12/6 = 2\ \Omega" />. Two terminal measurements fully characterize ANY linear network — that is the theorem.</span>}
          onPredict={(correct) => markPredictionGate(SECTION_ID, correct)}
        >
          <BlackBoxPort />
        </PredictionGate>
      </LabStation>

      {/* ── Norton & source transformation ───────────────────────────────── */}
      <section id="norton" className="scroll-mt-4 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Norton &amp; Source Transformation
        </h2>

        <p className="text-slate-700 dark:text-slate-300">
          The same two numbers have a second packaging. One source transformation turns the
          Thevenin form into its Norton dual: <MathWrapper formula="I_N = I_{sc} = 6\ \text{A}" /> in
          parallel with <MathWrapper formula="R_N = R_{th} = 2\ \Omega" />, tied together by the
          pair rule <MathWrapper formula="V_{th} = I_N R_N" />.
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-3">
          <div className="flex items-center gap-3">
            <button
              aria-pressed={showNorton}
              onClick={() => setShowNorton((v) => !v)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
                showNorton
                  ? 'border-engineering-blue-500 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 text-engineering-blue-700 dark:text-engineering-blue-300'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              Norton form
            </button>
            <p className="text-sm text-muted">
              Showing the {showNorton ? 'Norton equivalent: 6 A in parallel with 2 Ω' : 'Thevenin equivalent: 12 V in series with 2 Ω'}.
            </p>
          </div>
          <div className="max-w-xs">
            {showNorton ? <NortonDiagram /> : <TheveninTwinDiagram />}
          </div>
        </div>

        <p className="text-slate-700 dark:text-slate-300">
          Repeated source transformations are themselves a systematic simplification technique:
          walk them along a ladder network and sources merge as you go.
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded px-3 py-2">
          The transformation is about the TERMINALS — never transform away the component you are
          asked about.
        </p>

        <ConceptCheck
          data={{
            mode: 'multiple-choice',
            question: 'The Norton equivalent of a 12 V source in series with 2 Ω is:',
            options: [
              { text: '6 A in parallel with 2 Ω', correct: true, explanation: 'Correct! I_N = V/R = 6 A; R stays.' },
              { text: '24 A in parallel with 2 Ω', correct: false, explanation: 'That is V·R; use I = V/R.' },
              { text: '6 A in series with 2 Ω', correct: false, explanation: "A resistor in series with a current source does not change the terminal behavior — Norton's R goes in PARALLEL." },
              { text: '12 A in parallel with 1 Ω', correct: false, explanation: 'R never changes in a source transformation.' },
            ],
          }}
          onComplete={() => incrementConceptChecks(SECTION_ID)}
          onHint={() => incrementHints(SECTION_ID)}
        />
      </section>

      {/* ── Lab 3: Max-Power Bench (payoff) ──────────────────────────────── */}
      <LabStation
        id="max-power"
        className="scroll-mt-4"
        number={getSectionNumber(SECTION_ID)}
        title="Max-Power Bench"
        objective="One curve answers the catalog question: which load pulls the most power from a 12 V / 2 Ω source?"
      >
        <PredictionGate
          question="Your source is now just 12 V behind 2 Ω. Which load draws the MOST power?"
          options={[
            { id: 'small', label: 'the smallest possible R_L — more current!', visual: fallingSketch },
            { id: 'match', label: 'R_L = R_th = 2 Ω', visual: peakSketch },
            { id: 'large', label: 'the largest possible R_L — more voltage!', visual: risingSketch },
          ]}
          getCorrectAnswer={() => 'match'}
          explanation={<span>Small R_L → big current but tiny voltage; large R_L → full voltage but tiny current. Power is the product: <MathWrapper formula="P_L = \left(\frac{12}{2+R_L}\right)^2 R_L" /> peaks exactly at <MathWrapper formula="R_L = R_{th}" />, giving <MathWrapper formula="P_{max} = \frac{V_{th}^2}{4R_{th}} = \frac{144}{8} = 18\ \text{W}" />.</span>}
          onPredict={(correct) => markPredictionGate(SECTION_ID, correct)}
        >
          <MaxPowerChart />

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              The opening puzzle, answered in one table:
            </p>
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Current, voltage, and power for each catalog load</caption>
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th scope="col" className="py-1.5 pr-3">R_L</th>
                  <th scope="col" className="py-1.5 pr-3">i_L = 12/(2 + R_L)</th>
                  <th scope="col" className="py-1.5 pr-3">v_L</th>
                  <th scope="col" className="py-1.5">P_L</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-700 dark:text-slate-300">
                {LOAD_TABLE.map((row) => (
                  <tr key={row.r} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-1.5 pr-3">{row.r} Ω</td>
                    <td className="py-1.5 pr-3">{row.iL} A</td>
                    <td className="py-1.5 pr-3">{row.vL} V</td>
                    <td className="py-1.5">{row.p} W{row.p === 18 ? ' — the winner' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              The efficiency caveat: at the matched load, exactly half the generated power burns
              inside R_th. Matching is for signal transfer (audio, RF) — power grids deliberately
              run far from match because they want efficiency, not maximum transfer.
            </p>
          </div>
        </PredictionGate>
      </LabStation>

      <YourTurnPanel
        scenario="The lab swaps the resistors: now R1 = 3 Ω and R2 = 6 Ω (sources stay 24 V and 2 A)."
        question="What is the new V_th at the port?"
        options={[
          { text: '20 V', correct: true, explanation: 'Correct! Nodal at A: (V − 24)/3 + V/6 − 2 = 0 → 3V = 60 → V = 20 V.' },
          { text: '12 V', correct: false, explanation: 'The resistors changed — both the divider and the current-source drop change with them.' },
          { text: '16 V', correct: false, explanation: 'Check the two contributions: 24·6/9 = 16 V from the source PLUS 2·(3∥6) = 4 V from the injection.' },
        ]}
        correctReveal={
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <MathWrapper formula="\frac{V - 24}{3} + \frac{V}{6} - 2 = 0 \;\Rightarrow\; 3V = 60 \;\Rightarrow\; V_{th} = 20\ \text{V}" block />
            <MathWrapper formula="R_{th} = 3 \parallel 6 = 2\ \Omega" block />
            <p className="font-medium">
              R_th is unchanged! Same internal resistance, stronger source.
            </p>
          </div>
        }
      />

      {/* ── The Sanity-Check Triad (plausibility anchor, unit 2G) ─────────── */}
      <section id="sanity" className="scroll-mt-4 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          The Sanity-Check Triad
        </h2>

        <p className="text-slate-700 dark:text-slate-300">
          Every answer on this page came with a free, instant audit — you just ran it without
          naming it. When the partial voltages added to 12 V you checked a <em>bound</em>;
          when the max-power curve died at both ends you checked <em>limiting cases</em>.
          Engineers run three tests on every computed number, in about ten seconds, before
          trusting it. From here to the end of the course, this triad is part of the job.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-engineering-blue-600 dark:text-engineering-blue-400">
              Units
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Does the formula even produce the right kind of quantity?
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Is the RC time constant <MathWrapper formula="\tau = RC" /> or{' '}
              <MathWrapper formula="R/C" />? Check the units, not your memory:{' '}
              <MathWrapper formula="\Omega \cdot \text{F} = \frac{\text{V}}{\text{A}} \cdot \frac{\text{A} \cdot \text{s}}{\text{V}} = \text{s}" /> ✓,
              while <MathWrapper formula="\Omega/\text{F}" /> gives{' '}
              <MathWrapper formula="\text{V}^2/(\text{A}^2\text{s})" /> — a rate-like mongrel,
              not a time. One line, no algebra redone.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-engineering-blue-600 dark:text-engineering-blue-400">
              Limiting cases
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Push one variable to 0 or ∞ — the answer must do something you can predict for
              free.
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Voltage divider <MathWrapper formula="V_{out} = V\frac{R_2}{R_1+R_2}" />:{' '}
              <MathWrapper formula="R_2 \to 0" /> (shorted output) → 0 ✓;{' '}
              <MathWrapper formula="R_2 \to \infty" /> (open) → V ✓. Page-native: the
              Max-Power Bench curve hits zero at <em>both</em> ends —{' '}
              <MathWrapper formula="R_L \to 0" /> kills the voltage,{' '}
              <MathWrapper formula="R_L \to \infty" /> kills the current — so the peak had to
              live in between. If a formula survives its limits, it has earned some trust.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-engineering-blue-600 dark:text-engineering-blue-400">
              Magnitude &amp; bounds
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Is the number the right <em>size</em> — and inside the hard ceilings?
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              A Thevenin port can never beat its own extremes: into <strong>any</strong> load,{' '}
              <MathWrapper formula="i_L \le I_{sc} = V_{th}/R_{th}" /> and{' '}
              <MathWrapper formula="v_L \le V_{oc} = V_{th}" />. These bounds cost nothing and
              catch dropped resistors, sign slips, and series/parallel mix-ups before any
              re-derivation.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            All three, run on this page's own table
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Run all three on the catalog row <MathWrapper formula="R_L = 4\ \Omega" />:
            units — <MathWrapper formula="12\,\text{V}/6\,\Omega = 2\,\text{A}" /> ✓;
            bounds — 2 A ≤ I_sc = 6 A ✓ and v = 8 V ≤ 12 V ✓; limiting cases — the table
            brackets it monotonically (1 Ω → 4 A down to 10 Ω → 1 A) ✓. Ten seconds, three
            passes — <em>now</em> it goes in the report.
          </p>
        </div>

        <ConceptCheck
          data={{
            mode: 'multiple-choice',
            question: "A classmate connects a 6 Ω load to this page's port (V_th = 12 V, R_th = 2 Ω) and reports i_L = 6 A. Which sanity test rejects the answer fastest?",
            options: [
              { text: "Bounds: 6 A is the port's short-circuit current 12/2 — the ceiling for ANY load. They dropped R_L; the real answer is 12/(2+6) = 1.5 A", correct: true, explanation: 'Correct! i_L can only reach I_sc with a dead short across the port. Any nonzero load must draw less — you can smell the error without redoing any arithmetic.' },
              { text: 'Units: the result should be in volts', correct: false, explanation: 'A current in amps is dimensionally fine — the units test passes; it is the magnitude that is impossible.' },
              { text: 'Limiting cases: at large R_L the current should approach V_th/R_th', correct: false, explanation: 'Backwards — as R_L → ∞ the current → 0; V_th/R_th is the R_L → 0 limit. (And 6 Ω is at neither extreme.)' },
              { text: 'No test fails — 6 A is plausible for a 12 V source', correct: false, explanation: 'The hardest this port can ever push is I_sc = 6 A, into a dead short. With 6 Ω attached: 12/(2+6) = 1.5 A — the report quadruples it.' },
            ],
            hints: ['What is the largest current this port can deliver into ANY load?', 'Compare the report against I_sc = V_th/R_th.'],
          }}
          onComplete={() => incrementConceptChecks(SECTION_ID)}
          onHint={() => incrementHints(SECTION_ID)}
        />

        <p className="text-slate-700 dark:text-slate-300">
          Part 2 turns fields into numbers — volts per metre, teslas, newtons on invisible
          charges — where intuition is weakest and the triad matters most. Watch for the
          blue <strong>“Does this make sense?”</strong> callouts beside every simulation from
          here on: they are this section riding along with you.
        </p>
      </section>

      <p className="text-slate-700 dark:text-slate-300">
        Everything here assumed resistors — pure algebra. Add capacitors and inductors and the
        same KVL/KCL produce differential equations. The next section builds the transform that
        turns those back into algebra — and once it has, every tool on this page (superposition,
        Thevenin, Norton) works verbatim on impedances Z(s).
      </p>

      <div id="challenge" className="scroll-mt-4">
        <GuidedChallenge challenge={CHALLENGE} />
      </div>

      <CourseNavigation />
    </div>
  );
}
