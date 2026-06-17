import { useEffect, useState } from 'react';
import { Activity, BookOpen, FlaskConical } from 'lucide-react';
import { SectionHook } from '@shared/components/common/SectionHook';
import { Tabs } from '@shared/components/common/Tabs';
import { LabLayout } from '@shared/components/common/LabLayout';
import { LabStation } from '@shared/components/common/LabStation';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { secondOrderStepICs } from '@circuits/utils/circuitSolver';
import { SwitchedRCSim } from './SwitchedRCSim';

const SECTION_ID = 'switched-circuits';

// The second-order worked example's underdamped coefficients, interpolated
// from the tested solver export (oracle-backed by the unit suite) rather than
// hardcoded: alpha = 3000 s^-1, omega_d = 4000 rad/s, v_C(0+) = 5 V,
// v_C(inf) = 10 V, dv_C/dt(0+) = 0 gives A1 = -5, A2 = -3.75.
const { A1, A2 } = secondOrderStepICs(3000, 4000, 5, 10, 0);

const CHALLENGE = {
  title: 'Throw the Switch: From Pre-State to Steady State',
  description:
    "A guided run of the Throw the Switch bench (First-Order Recipe tab): start on the worked example's two-position circuit, verify the bench against your pencil digit for digit, then bend each of the three recipe numbers in turn.",
  instructions: [
    'Open the First-Order Recipe tab and commit the Predict-First prediction to reveal the bench. Confirm the four readouts against the worked example: v_C(0⁻) = v_C(0⁺) = 8.00 V, v_C(∞) = 20.0 V, τ = 50.0 ms, i_C jump 0 → 6.00 mA.',
    'Look at the chart around t = 0: the voltage trace crosses the SWITCH line without a jump — it bends but does not break — while the dashed current trace breaks vertically from 0 to 6 mA. State the two continuity rules this picture is drawing.',
    'Find the dot at t = τ = 50 ms and read v ≈ 15.6 V. Check the 63.2% rule by hand: 8 + 0.632 × (20 − 8) ≈ 15.6 V.',
    "Press 'Discharge (V₂ = 0)'. The final value drops to 0, the current jump flips to 0 → −4.00 mA, and the curve becomes a pure decay v = 8e^(−t/τ). The recipe handles charging and discharging with the same line.",
    "Press 'No precharge (V₁ = 0)'. Now v_C(0⁺) = 0 and the curve is exactly the zero-state response from the Circuit Analysis section — that whole page was this bench with one slider parked at zero.",
    "Restore 'Worked example', then drag R₃ from 2 kΩ to 4 kΩ. Confirm τ doubles to 100 ms and the current jump halves to 3.00 mA — then say in one sentence which of the three recipe numbers R₃ touched (τ and the jump) and which it could not (v_C(0⁺) and v_C(∞)).",
  ],
  hint: "Every run is the same three questions: where does x start (old circuit + continuity), where does it end (new circuit at DC), how fast does it travel (τ from the new circuit's resistance). The sliders only ever move those three numbers.",
};

const TABLE_HEADER_CLASSES =
  'border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-4 py-3 text-left font-semibold text-slate-800 dark:text-slate-200';
const TABLE_CELL_CLASSES =
  'border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300';

export function SwitchedCircuits() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited(SECTION_ID); }, [markVisited]);

  // Gate unlock state lifted above the Tabs: the tabpanel remounts on every
  // tab switch, so the gate restores via initialPassed instead of re-locking.
  const [unlocked, setUnlocked] = useState(false);

  const onConcept = () => incrementConceptChecks(SECTION_ID);
  const onHint = () => incrementHints(SECTION_ID);

  /* ================================================================
     Tab 1 — The 0⁻/0⁺ Boundary
     ================================================================ */
  const boundaryTheory = (
    <section className="space-y-6">
      {/* The exposed debt */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          The assumption every solution smuggled in
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Section {getSectionNumber('circuit-analysis')} solved RC, RL and RLC step
          responses — beautifully. Look again at the fine print:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={TABLE_HEADER_CLASSES}>Where</th>
                <th className={TABLE_HEADER_CLASSES}>The fine print</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TABLE_CELL_CLASSES} font-medium`}>RC solution</td>
                <td className={TABLE_CELL_CLASSES}>
                  “assuming <MathWrapper formula="v_C(0) = 0" />”
                </td>
              </tr>
              <tr className="bg-slate-50/50 dark:bg-slate-700/30">
                <td className={`${TABLE_CELL_CLASSES} font-medium`}>RL solution</td>
                <td className={TABLE_CELL_CLASSES}>
                  “assuming <MathWrapper formula="i(0) = 0" />”
                </td>
              </tr>
              <tr>
                <td className={`${TABLE_CELL_CLASSES} font-medium`}>RLC (all three damping cases)</td>
                <td className={TABLE_CELL_CLASSES}>
                  constants chosen so <MathWrapper formula="v(0) = 0" />,{' '}
                  <MathWrapper formula="i(0) = 0" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4">
          <p className="font-mono text-sm font-bold tracking-widest text-amber-700 dark:text-amber-400">
            REAL CIRCUITS GET SWITCHED WITH ENERGY ALREADY STORED.
          </p>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          A relay drops out while its coil carries 4 A. A logic rail powers up while its
          decoupling caps still hold half a volt. This page is the missing first move of
          every transient problem: <em>what are the true values at the instant after the
          switch acts</em> — and the notation for that instant is{' '}
          <MathWrapper formula="t = 0^+" />, one tick after <MathWrapper formula="t = 0^-" />.
        </p>
      </div>

      {/* The two continuity rules */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          The two continuity rules
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Two quantities in a circuit are <em>state variables</em> — they store energy,
          and energy cannot teleport:
        </p>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <MathWrapper block formula="v_C(0^+) = v_C(0^-) \qquad\qquad i_L(0^+) = i_L(0^-)" />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Why: <MathWrapper formula="i_C = C\,\frac{dv_C}{dt}" /> — a jump in{' '}
          <MathWrapper formula="v_C" /> would need infinite current;{' '}
          <MathWrapper formula="v_L = L\,\frac{di_L}{dt}" /> — a jump in{' '}
          <MathWrapper formula="i_L" /> would need infinite voltage.{' '}
          <strong>Everything else may jump</strong>: resistor voltages and currents,
          capacitor <em>current</em>, inductor <em>voltage</em> — these are slaved to the
          state variables through whatever circuit is connected <em>right now</em>, and at{' '}
          <MathWrapper formula="t = 0" /> the circuit itself changes.
        </p>
        <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
          <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
            Key Insight
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Continuity is a property of the element, not the circuit.</strong>{' '}
            The switch can rip the topology apart; <MathWrapper formula="v_C" /> and{' '}
            <MathWrapper formula="i_L" /> walk across the boundary unchanged, and you
            re-solve the <em>new</em> circuit with those two numbers as starting capital.
          </p>
        </div>
      </div>

      {/* Reading the DC pre-state */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Reading the DC pre-state
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Before the switch acts, the circuit has usually sat still for a long time — DC
          steady state. Then nothing changes in time, so:
        </p>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <MathWrapper
            block
            formula="\frac{dv_C}{dt} = 0 \;\Rightarrow\; i_C = 0 \quad \text{(capacitor = open circuit)} \qquad \frac{di_L}{dt} = 0 \;\Rightarrow\; v_L = 0 \quad \text{(inductor = short circuit)}"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-card-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Capacitor
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              12 V source — 4 kΩ — node — (8 kΩ ∥ C) to ground. C open ⇒ voltage divider:
            </p>
            <MathWrapper block formula="v_C(0^-) = 12\,\frac{8}{4+8} = 8\ \text{V}" />
            <p className="text-xs italic text-slate-500 dark:text-slate-400">
              (This exact circuit returns as the bench default.)
            </p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Inductor
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              24 V source — 6 Ω — node — (10 Ω ∥ L) to ground. L is a DC short ⇒ it shorts
              out the 10 Ω entirely (<MathWrapper formula="v_{node} = 0" />, so the 10 Ω
              carries nothing):
            </p>
            <MathWrapper block formula="i_L(0^-) = 24/6 = 4\ \text{A}" />
            <p className="text-xs italic text-slate-500 dark:text-slate-400">
              (Returns in the Your Turn.)
            </p>
          </div>
        </div>
        <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
          <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
            Does this make sense?
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            In the inductor example, check the bypassed resistor:{' '}
            <MathWrapper formula="v_{node} = 0" /> ⇒{' '}
            <MathWrapper formula="i_{10\Omega} = 0/10 = 0" /> — all 4 A really does flow
            through the wire-like inductor. If you had treated L as an <em>open</em>{' '}
            you&apos;d get <MathWrapper formula="24/(6+10) = 1.5" /> A — keep that wrong
            number in mind; it reappears below as a trap.
          </p>
        </div>
      </div>

      <ConceptCheck
        data={{
          mode: 'multiple-choice',
          question:
            'A switch opens at t = 0, interrupting the only current path of an inductor carrying 2 A. What happens at t = 0⁺?',
          options: [
            {
              text: 'The inductor forces 2 A to keep flowing for an instant — v_L = L di/dt spikes as high as needed (this is why switch contacts arc)',
              correct: true,
              explanation:
                'Correct. i_L cannot jump, so the current momentarily punches through the opening contacts as an arc; the voltage spike is whatever it takes. Flyback diodes exist precisely to give that 2 A somewhere lawful to go.',
            },
            {
              text: 'i_L steps cleanly to 0 — inductors oppose voltage changes, not current changes',
              correct: false,
              explanation:
                "Rule swap: it is the CAPACITOR's voltage that cannot jump. The inductor's protected quantity is its current.",
            },
            {
              text: 'v_L holds its 0⁻ value (0 V) — voltages are always continuous',
              correct: false,
              explanation:
                "There is no continuity law for v_L. Only v_C and i_L are state variables; an inductor's voltage jumps whenever the circuit demands it.",
            },
            {
              text: 'Nothing dramatic — the stored energy simply vanishes when the loop opens',
              correct: false,
              explanation:
                'Energy ½Li² = ½·L·(2 A)² cannot vanish. It must be dissipated — in the arc, a snubber, or a flyback diode.',
            },
          ],
          hints: [
            'Only two circuit quantities are guaranteed continuous: i_L and v_C.',
            'If i_L tried to jump, what would v_L = L di/dt have to be?',
          ],
        }}
        onComplete={onConcept}
        onHint={onHint}
      />
    </section>
  );

  /* ================================================================
     Tab 2 — The First-Order Recipe (theory column)
     ================================================================ */
  const recipeTheory = (
    <section className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Three numbers, one curve
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Any first-order circuit, however gnarly, reduces (Thévenin, Section{' '}
          {getSectionNumber('circuit-theorems')}) to one source, one resistance, one
          storage element. Its ODE is{' '}
          <MathWrapper formula="\frac{dx}{dt} = -\frac{x - x(\infty)}{\tau}" />, and the
          solution every formula sheet prints:
        </p>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <MathWrapper block formula="x(t) = x(\infty) + \bigl[x(0^+) - x(\infty)\bigr]e^{-t/\tau}" />
          <p className="text-xs font-mono text-center text-slate-500 dark:text-slate-400 mt-2">
            THE first-order recipe — x is v_C or i_L
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            How to read this formula
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            <li>
              At <MathWrapper formula="t = 0" />: <MathWrapper formula="x = x(0^+)" /> ✓
            </li>
            <li>
              As <MathWrapper formula="t \to \infty" />: <MathWrapper formula="x = x(\infty)" /> ✓
            </li>
            <li>
              The exponential only carries the <em>gap</em> between start and finish —
              after one τ, 63.2 % of the gap is closed
            </li>
            <li>
              The three inputs come from three different circuits:{' '}
              <MathWrapper formula="x(0^+)" /> from the OLD circuit&rsquo;s DC state
              (+ continuity), <MathWrapper formula="x(\infty)" /> from the NEW
              circuit&rsquo;s DC state, <MathWrapper formula="\tau" /> from the NEW
              circuit&rsquo;s resistance as seen by the storage element
              (<MathWrapper formula="\tau = R_{eq}C" /> or <MathWrapper formula="L/R_{eq}" />).{' '}
              <strong>Using the old circuit&rsquo;s resistors for τ is the classic exam error.</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          The exam task, by hand
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Two-position switch, C = 25 µF: position <strong>a</strong> (t &lt; 0, a long
          time): 12 V — 4 kΩ — node — (8 kΩ ∥ C). At t = 0 the switch moves to position{' '}
          <strong>b</strong>: C connects in series with 2 kΩ to a 20 V source (the
          12 V/4 kΩ/8 kΩ branch is disconnected).
        </p>
        <WorkedSteps
          tryFirstPrompt="Find v_C(0⁻) from the position-a circuit yourself before revealing step 1."
          steps={[
            {
              title: 'Step 1 — Pre-state (capacitor = open)',
              body: (
                <>
                  <p className="mb-2">Divider:</p>
                  <MathWrapper
                    block
                    formula="v_C(0^-) = 12 \times \frac{8\,\text{k}}{4\,\text{k} + 8\,\text{k}} = 12 \times \tfrac{2}{3} = 8\ \text{V}"
                  />
                  <p className="mt-2">
                    Also <MathWrapper formula="i_C(0^-) = 0" /> (steady state).
                  </p>
                </>
              ),
            },
            {
              title: 'Step 2 — Cross the boundary',
              body: (
                <>
                  <p className="mb-2">
                    Continuity: <MathWrapper formula="v_C(0^+) = 8\ \text{V}" />. But the
                    capacitor <em>current</em> jumps:
                  </p>
                  <MathWrapper block formula="i_C(0^+) = \frac{20 - 8}{2\,\text{k}} = 6\ \text{mA}" />
                  <p className="mt-2">
                    (was 0). <em>Voltage continuous, current discontinuous — the bench plots both.</em>
                  </p>
                </>
              ),
            },
            {
              title: 'Step 3 — Final value (new circuit, capacitor = open)',
              body: (
                <p>
                  No current ⇒ no drop on the 2 kΩ ⇒{' '}
                  <MathWrapper formula="v_C(\infty) = 20\ \text{V}" />.
                </p>
              ),
            },
            {
              title: 'Step 4 — Time constant (NEW circuit only)',
              body: (
                <>
                  <MathWrapper
                    block
                    formula="\tau = R C = 2000 \times 25\times10^{-6} = 0.05\ \text{s} = 50\ \text{ms}"
                  />
                  <p className="mt-2">
                    <em>(The 4 kΩ and 8 kΩ left with the old circuit — they are gone.)</em>
                  </p>
                </>
              ),
            },
            {
              title: 'Step 5 — Assemble',
              body: (
                <MathWrapper
                  block
                  formula="v_C(t) = 20 + (8 - 20)e^{-t/0.05} = 20 - 12e^{-20t}\ \text{V}, \quad t \ge 0"
                />
              ),
            },
            {
              title: 'Step 6 — Audit (does this make sense?)',
              body: (
                <div className="space-y-2">
                  <p>
                    <MathWrapper formula="v_C(0^+) = 20 - 12 = 8" /> ✓ matches Step 2;{' '}
                    <MathWrapper formula="v_C(\infty) = 20" /> ✓ matches Step 3.
                  </p>
                  <p className="mb-1">Current two ways — Ohm:</p>
                  <MathWrapper
                    block
                    formula="i = \frac{20 - v_C}{2\,\text{k}} = \frac{12e^{-20t}}{2000} = 6e^{-20t}\ \text{mA}"
                  />
                  <p className="mb-1">constitutive:</p>
                  <MathWrapper
                    block
                    formula="i = C\frac{dv_C}{dt} = 25\times10^{-6} \times 240e^{-20t} = 6e^{-20t}\ \text{mA}"
                  />
                  <p>
                    — identical ✓ (and <MathWrapper formula="i(0^+) = 6" /> mA matches
                    Step 2). One τ later (t = 50 ms):{' '}
                    <MathWrapper formula="v = 20 - 12e^{-1} = 20 - 4.41 = 15.59\ \text{V}" /> —
                    exactly 63.2 % of the 12 V gap closed:{' '}
                    <MathWrapper formula="8 + 0.6321 \times 12 = 15.59" /> ✓ (1 − e⁻¹ =
                    0.6321). After 5τ (250 ms):{' '}
                    <MathWrapper formula="20 - 12e^{-5} = 19.92\ \text{V}" /> — settled.
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConceptCheck
        data={{
          mode: 'multiple-choice',
          question:
            'A first-order circuit has v(0⁺) = 2 V, v(∞) = 10 V, τ = 1 ms. What is v one time constant later, at t = 1 ms?',
          options: [
            {
              text: '7.06 V',
              correct: true,
              explanation:
                'Correct. v = 10 + (2 − 10)e⁻¹ = 10 − 8(0.368) = 7.06 V — equivalently, start + 63.2 % of the 8 V gap: 2 + 5.06 = 7.06 V.',
            },
            {
              text: '2.94 V',
              correct: false,
              explanation:
                '2.94 V = 8e⁻¹ is the size of the gap still REMAINING, not the voltage. Add it back under the final value: 10 − 2.94 = 7.06 V. (Treating the answer as a bare decay to zero is the zero-state habit this section is curing.)',
            },
            {
              text: '6.32 V',
              correct: false,
              explanation:
                'That is 0.632 × 10 — the 63 % rule applied to the final VALUE. It applies to the GAP: the circuit covers 63.2 % of (10 − 2) in one τ.',
            },
            {
              text: '6 V',
              correct: false,
              explanation:
                '6 V is halfway. One τ takes you 63.2 % of the way; the halfway point comes earlier, at t = τ·ln 2 ≈ 0.69 τ.',
            },
          ],
          hints: [
            'Write the recipe with the three numbers in place, then set t = τ so e^(−t/τ) = e^(−1) ≈ 0.368.',
            'The 63.2% rule applies to the gap x(∞) − x(0⁺), not to x(∞) itself.',
          ],
        }}
        onComplete={onConcept}
        onHint={onHint}
      />

      <YourTurnPanel
        scenario="The inductor circuit from the 0⁻/0⁺ tab: 24 V source — 6 Ω — node — (10 Ω ∥ L), L = 0.5 H, sitting at DC steady state with i_L(0⁻) = 4 A. At t = 0 the switch OPENS the source branch (24 V and 6 Ω disconnect), leaving the inductor and the 10 Ω alone in a loop."
        question="What is i_L(t) for t ≥ 0 — and what happens to the voltage across the 10 Ω resistor at t = 0⁺?"
        options={[
          {
            text: 'i_L(t) = 4e^(−20t) A, and the resistor voltage jumps to 40 V — larger than the source ever supplied',
            correct: true,
            explanation:
              'Correct. Continuity: i_L(0⁺) = 4 A; final value 0; τ = L/R = 0.5/10 = 50 ms ⇒ 1/τ = 20 s⁻¹. The 4 A is forced through the 10 Ω: |v| = 4 × 10 = 40 V, polarity flipped — the inductive kick that erodes relay contacts.',
          },
          {
            text: 'i_L drops to 0 instantly — its source is gone',
            correct: false,
            explanation:
              'i_L cannot jump, source or no source. The stored ½Li² = ½(0.5)(4²) = 4 J must be dissipated through the resistor over the decay.',
          },
          {
            text: 'i_L(t) = 1.5e^(−20t) A',
            correct: false,
            explanation:
              "1.5 A = 24/(6+10) treats the inductor as a DC OPEN — that is the capacitor's rule. At DC an inductor is a short: i_L(0⁻) = 24/6 = 4 A.",
          },
          {
            text: 'i_L(t) = 4e^(−32t) A',
            correct: false,
            explanation:
              'You used τ = L/(R₁+R₂) = 0.5/16 = 31.25 ms, i.e. a rate of 32 s⁻¹. The 6 Ω left with the source; for t > 0 the inductor sees only the 10 Ω: τ = 0.5/10 = 50 ms, rate 20 s⁻¹.',
          },
        ]}
        hints={[
          'At DC an inductor is a short — which resistor does it bypass before the switch opens?',
          'τ uses only the resistance the inductor actually sees AFTER the switch acts.',
        ]}
        correctReveal={
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <MathWrapper formula="i_L(0^-) = \frac{24}{6} = 4\ \text{A}" block />
            <p>(L shorts the 10 Ω.)</p>
            <MathWrapper formula="\tau = \frac{L}{R} = \frac{0.5}{10} = 0.05\ \text{s}" block />
            <MathWrapper formula="i_L(t) = 4e^{-20t}\ \text{A}" block />
            <MathWrapper formula="|v_R(0^+)| = 4 \times 10 = 40\ \text{V}" block />
            <p className="mb-1">Energy audit:</p>
            <MathWrapper
              block
              formula="\int_0^\infty i^2R\,dt = \int_0^\infty 16e^{-40t}\cdot 10\,dt = \frac{160}{40} = 4\ \text{J} = \tfrac{1}{2}Li_L(0)^2 = \tfrac{1}{2}(0.5)(16)"
            />
            <p>✓ — every joule the field stored comes out through the resistor.</p>
            <p className="font-medium">
              40 V from a 24 V circuit — inductors are voltage multipliers when
              interrupted. That is both a hazard (arcing) and a product (boost
              converters, ignition coils).
            </p>
          </div>
        }
      />
    </section>
  );

  /* ================================================================
     Tab 2 — bench (LabStation + blocking gate + SwitchedRCSim)
     ================================================================ */
  const recipeBench = (
    <LabStation
      id="switched-rc"
      number={getSectionNumber(SECTION_ID)}
      title="Throw the Switch"
      objective="Drive the two-position RC switch circuit from the worked example: watch v_C cross t = 0 without a jump while i_C breaks, and read x(0⁺), x(∞) and τ straight off the instrument."
    >
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Predict first, then run the lab. Commit your prediction to reveal the bench.
      </p>
      <PredictionGate
        initialPassed={unlocked}
        onPassed={() => setUnlocked(true)}
        onPredict={(correct) => markPredictionGate(SECTION_ID, correct)}
        question="This capacitor has sat at 8 V for a long time. At t = 0 a switch connects it through a 2 kΩ resistor to a 20 V source. What does a voltmeter across the capacitor read at t = 0⁺ — the instant after the switch closes?"
        options={[
          { id: 'hold', label: '8 V — exactly what it held at 0⁻' },
          { id: 'snap', label: '20 V — it snaps to the new source' },
          { id: 'mid', label: '14 V — halfway between' },
          { id: 'reset', label: '0 V — switching resets it' },
        ]}
        getCorrectAnswer={() => 'hold'}
        explanation={
          <span>
            Capacitor voltage is a continuity-protected state variable: changing it means
            moving charge, and moving charge in zero time means infinite current. So{' '}
            <MathWrapper formula="v_C(0^+) = v_C(0^-) = 8\ \text{V}" /> — what jumps is
            the <em>current</em>, from 0 to{' '}
            <MathWrapper formula="(20-8)/2\,\text{k} = 6\ \text{mA}" />. The bench plots
            both traces so you can see one bend and the other break.
          </span>
        }
      >
        <SwitchedRCSim />
      </PredictionGate>
    </LabStation>
  );

  /* ================================================================
     Tab 3 — Second Order: A₁ & A₂
     ================================================================ */
  const secondOrderTheory = (
    <section className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Where A₁ and A₂ come from
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Section {getSectionNumber('circuit-analysis')} gave you the underdamped{' '}
          <em>shape</em>:{' '}
          <MathWrapper formula="v_C(t) = V_f + e^{-\alpha t}(A_1\cos\omega_d t + A_2\sin\omega_d t)" />.
          It never showed where <MathWrapper formula="A_1, A_2" /> come from — the
          app&rsquo;s solver computes them silently, always for a zero start. They come
          from the SAME two continuity rules: two state variables
          (<MathWrapper formula="v_C" />, <MathWrapper formula="i_L" />) ⇒ two initial
          facts ⇒ two coefficients. Second order is first order&rsquo;s bookkeeping, done
          twice.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          A step that doesn&rsquo;t start at zero
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Series RLC: <MathWrapper formula="R = 6\ \Omega" />,{' '}
          <MathWrapper formula="L = 1\ \text{mH}" />,{' '}
          <MathWrapper formula="C = 40\ \mu\text{F}" />. The source has been 5 V forever;
          at <MathWrapper formula="t = 0" /> it steps to 10 V.
        </p>
        <WorkedSteps
          tryFirstPrompt="Compute α, ω₀ and ω_d from R = 6 Ω, L = 1 mH, C = 40 µF before revealing step 1."
          steps={[
            {
              title: 'Step 1 — Pre-state',
              body: (
                <p>
                  DC steady state with 5 V: capacitor open ⇒{' '}
                  <MathWrapper formula="i_L(0^-) = 0" />; no current ⇒ no drops ⇒{' '}
                  <MathWrapper formula="v_C(0^-) = 5\ \text{V}" />.
                </p>
              ),
            },
            {
              title: 'Step 2 — Cross the boundary, translate to calculus',
              body: (
                <>
                  <p className="mb-2">
                    <MathWrapper formula="v_C(0^+) = 5\ \text{V}" />;{' '}
                    <MathWrapper formula="i_L(0^+) = 0" />. In a series loop{' '}
                    <MathWrapper formula="i_C = i_L" />, so
                  </p>
                  <MathWrapper block formula="\frac{dv_C}{dt}(0^+) = \frac{i_C(0^+)}{C} = 0" />
                  <p className="mt-2">
                    <em>Two facts: a value and a slope.</em>
                  </p>
                </>
              ),
            },
            {
              title: 'Step 3 — Parameters',
              body: (
                <>
                  <MathWrapper
                    block
                    formula="\alpha = \frac{R}{2L} = \frac{6}{2\times10^{-3}} = 3000\ \text{s}^{-1}"
                  />
                  <MathWrapper
                    block
                    formula="\omega_0 = \frac{1}{\sqrt{LC}} = \frac{1}{\sqrt{10^{-3}\times 40\times10^{-6}}} = \frac{1}{2\times10^{-4}} = 5000\ \text{rad/s}"
                  />
                  <p className="my-2">
                    <MathWrapper formula="\zeta = 3000/5000 = 0.6 < 1" /> ⇒ underdamped;
                  </p>
                  <MathWrapper
                    block
                    formula="\omega_d = \omega_0\sqrt{1-\zeta^2} = 5000 \times 0.8 = 4000\ \text{rad/s}"
                  />
                  <p className="mt-2">
                    <em>(A 3-4-5 triangle: α = 3000, ω_d = 4000, ω₀ = 5000.)</em>
                  </p>
                </>
              ),
            },
            {
              title: 'Step 4 — Fit A₁ from the value',
              body: (
                <MathWrapper
                  block
                  formula={String.raw`v_C(0^+) = 10 + A_1 = 5 \Rightarrow A_1 = ${A1}`}
                />
              ),
            },
            {
              title: 'Step 5 — Fit A₂ from the slope',
              body: (
                <>
                  <MathWrapper
                    block
                    formula={String.raw`\frac{dv_C}{dt}(0^+) = -\alpha A_1 + \omega_d A_2 = 0 \Rightarrow A_2 = \frac{\alpha A_1}{\omega_d} = \frac{3000(${A1})}{4000} = ${A2}`}
                  />
                  <MathWrapper
                    block
                    formula={String.raw`v_C(t) = 10 - e^{-3000t}\left(${-A1}\cos 4000t + ${-A2}\sin 4000t\right)\ \text{V}`}
                  />
                </>
              ),
            },
            {
              title: 'Step 6 — Audit (does this make sense?)',
              body: (
                <div className="space-y-2">
                  <p>
                    <MathWrapper formula="v_C(0) = 10 - 5 = 5" /> ✓;{' '}
                    <MathWrapper formula="t\to\infty \Rightarrow 10" /> ✓. Slope check:
                    derivative cosine coefficient{' '}
                    <MathWrapper formula="-\alpha A_1 + \omega_d A_2 = 15000 - 15000 = 0" /> ✓.
                  </p>
                  <p className="mb-1">
                    Compact form: amplitude{' '}
                    <MathWrapper formula="\sqrt{5^2 + 3.75^2} = \sqrt{39.0625} = 6.25" />{' '}
                    (the 3-4-5 again: 6.25 = 5 × 1.25), so
                  </p>
                  <MathWrapper
                    block
                    formula="v_C = 10 - 6.25\,e^{-3000t}\cos(4000t - 36.87^\circ)"
                  />
                  <p>
                    Loop current{' '}
                    <MathWrapper formula="i = C\frac{dv_C}{dt} = 1.25\,e^{-3000t}\sin 4000t\ \text{A}" /> ⇒{' '}
                    <MathWrapper formula="i(0) = 0" /> ✓ (sine coefficient of the
                    derivative:{' '}
                    <MathWrapper formula="-\alpha A_2 - \omega_d A_1 = 11250 + 20000 = 31250" />;{' '}
                    <MathWrapper formula="\times C = 40\times10^{-6} \times 31250 = 1.25" />).
                    First voltage peak where the current crosses zero:{' '}
                    <MathWrapper formula="\omega_d t = \pi \Rightarrow t = 0.785\ \text{ms}" />,{' '}
                    <MathWrapper formula="v_{peak} = 10 + 5e^{-3\pi/4} = 10 + 5(0.0948) = 10.47\ \text{V}" /> —
                    a 9.5 % overshoot of the 5 V swing, exactly the textbook{' '}
                    <MathWrapper formula="e^{-\zeta\pi/\sqrt{1-\zeta^2}} = e^{-0.75\pi} = 9.5\,\%" />{' '}
                    for ζ = 0.6 ✓.
                  </p>
                  <p>
                    Magnitude plausibility: the circuit&rsquo;s natural impedance is{' '}
                    <MathWrapper formula="\sqrt{L/C} = \sqrt{10^{-3}/(4\times10^{-5})} = 5\ \Omega" />,
                    so a 5 V step should drive a ~1 A-scale ring; the damped peak is
                    ≈ 0.50 A — plausible ✓.
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConceptCheck
        data={{
          mode: 'multiple-choice',
          question:
            'In the worked example, the source snaps from 5 V to 10 V at t = 0 — yet we set dv_C/dt(0⁺) = 0. Why is the capacitor-voltage slope zero at the very moment of the step?',
          options: [
            {
              text: 'Because in a series loop i_C = i_L, and i_L(0⁻) = 0 cannot jump — so dv_C/dt(0⁺) = i_C(0⁺)/C = 0',
              correct: true,
              explanation:
                'Correct. The inductor stands between the step and the capacitor: until current builds, no charge flows, so v_C leaves t = 0 flat (value AND slope continuous here).',
            },
            {
              text: 'Because v_C cannot jump',
              correct: false,
              explanation:
                'That rule pins the VALUE v_C(0⁺) = 5 V. The slope is a separate fact, and it comes from the OTHER state variable, i_L.',
            },
            {
              text: 'Because every quantity has zero derivative at DC steady state',
              correct: false,
              explanation:
                'True at 0⁻ — but 0⁺ is after the step, in a circuit that is no longer at steady state. The slope is zero only because the series inductor pins the current.',
            },
            {
              text: "It isn't zero — the step forces dv_C/dt(0⁺) = (10 − 5)/RC immediately",
              correct: false,
              explanation:
                "That is the FIRST-order RC result, where the resistor connects source to capacitor directly. Here an inductor is in the way, and its current (zero) sets the capacitor's initial slope.",
            },
          ],
          hints: [
            'What is i_C in a series RLC loop?',
            'Translate i_L(0⁺) = 0 into a statement about dv_C/dt(0⁺).',
          ],
        }}
        onComplete={onConcept}
        onHint={onHint}
      />

      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-xs font-semibold font-mono text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
          Up Next
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          You just did the bookkeeping by hand: carry <MathWrapper formula="v_C(0^-)" />,{' '}
          <MathWrapper formula="i_L(0^-)" /> across the switch, fit constants, check
          limits. The Laplace transform does ALL of it automatically — initial conditions
          enter the algebra as built-in source terms, and the constants fall out of a
          partial-fraction expansion. That machine is Section{' '}
          {getSectionNumber('laplace-theory')}, and the IC-source trick itself returns in
          Section {getSectionNumber('s-domain')}&rsquo;s toolkit later in the course.
        </p>
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      <SectionHook text="Flip a switch and the circuit does not start from nothing — its capacitors are charged, its inductors are carrying current. Every transient you have solved so far began at zero. Real ones almost never do. Two continuity rules and one three-number recipe solve any switched first-order circuit in four lines — no differential equation required." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber(SECTION_ID)}
          </span>
          Switched Circuits &amp; Initial Conditions
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Continuity rules, the 0⁻/0⁺ boundary, and the three-number recipe for switched
          transients
        </p>
      </div>

      <Tabs
        tabs={[
          {
            label: 'The 0⁻/0⁺ Boundary',
            icon: <BookOpen className="w-4 h-4" aria-hidden="true" />,
            content: boundaryTheory,
          },
          {
            label: 'The First-Order Recipe',
            icon: <FlaskConical className="w-4 h-4" aria-hidden="true" />,
            content: (
              <LabLayout
                benchId="lab-switched"
                jumpLabel="Jump to lab"
                theory={recipeTheory}
                bench={recipeBench}
              />
            ),
          },
          {
            label: 'Second Order: A₁ & A₂',
            icon: <Activity className="w-4 h-4" aria-hidden="true" />,
            content: secondOrderTheory,
          },
        ]}
      />

      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation currentSectionId={SECTION_ID} />
    </div>
  );
}
