import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { circuitAnalysisFormulas } from '@circuits/utils/componentMath';
import { CircuitComparisonLayout } from '@circuits/components/modules/TimeDomain/CircuitComparisonLayout';
import { MethodComparisonTable } from '@circuits/components/modules/TimeDomain/MethodComparisonTable';
import { ResponseComparisons } from '@circuits/components/modules/TimeDomain/ResponseComparisons';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { CircuitAnalysisExercise } from '@circuits/components/modules/CircuitAnalysisExercise';

import type { CircuitType } from '@circuits/types/circuit';

const tocEntries = [
  { id: 'circuit-analysis', label: 'Circuit Analysis' },
  { id: 'concept-check', label: 'Check Understanding' },
  { id: 'method-comparison', label: 'Method Comparison' },
  { id: 'response-types', label: 'Response Types' },
];

const CHALLENGE = {
  title: `Compare Circuit Types Across Time-Domain and S-Domain`,
  description: `A guided exploration of the "Circuit Analysis" section. Using the RC / RL / RLC circuit-type selector tabs, the student steps through the three circuits, comparing how the same physics is solved with a differential equation in the Time-Domain panel versus an algebraic transform in the S-Domain panel, and predicts how parameter changes move the s-plane poles.`,
  instructions: [
    `Select the 'RC Circuit' tab. In the Time-Domain Approach panel, follow Steps 1-3 and note that KVL plus the capacitor law i = C dv_C/dt gives a first-order ODE with time constant τ = RC; confirm the solution v_C(t) = V_s(1 - e^{-t/τ}) rises toward V_s.`,
    `Still on RC, read the S-Domain Approach panel: see the capacitor become impedance Z_C = 1/(sC) and the ODE turn into the algebra I(s) = (V_s/R)·1/(s + 1/RC). Note that the inverse transform reproduces the identical i(t) and v_C(t) — confirm the green Conclusion box says both methods agree.`,
    `Open the RC 'Your Turn' panel and predict the effect of doubling R before revealing: check that τ doubles and the pole at s = -1/τ moves toward the origin (slower decay), reading the Correct Reveal that the pole shifts from -1000 to -500 rad/s.`,
    `Switch to the 'RL Circuit' tab and compare its time constant to the RC case: observe τ = L/R, so in the RL 'Your Turn' panel doubling R now halves τ and pushes the pole at s = -R/L further from the origin — the opposite direction to the RC circuit you just saw.`,
    `Switch to the 'RLC Circuit' tab and compare the two panels: note the Time-Domain side splits into overdamped / critically damped / underdamped cases, while the S-Domain side gets there in one characteristic equation s² + (R/L)s + 1/LC = 0 with poles s = -α ± √(α² - ω₀²); use the 'Your Turn' panel to confirm that halving C raises ω₀ by √2 and lowers ζ by √2.`,
    `Conclude in your own words: as circuit order rises from first-order (RC, RL) to second-order (RLC), explain why the s-domain (algebraic poles) scales far better than repeatedly solving differential equations, and relate pole position in the s-plane to response speed and damping.`,
  ],
  hint: `Whichever tab you pick, read the two panels as the same problem twice — the s-domain pole location (s = -1/τ for RC, s = -R/L for RL, the roots of s² + (R/L)s + 1/LC for RLC) tells you the decay rate and damping that the time-domain exponential is hiding.`,
};

export function TimeDomain() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('circuit-analysis'); }, [markVisited]);

  const [selectedCircuit, setSelectedCircuit] = useState<CircuitType>('RC');

  return (
    <div className="space-y-8">
      <SectionHook text="The differential equation approach and the Laplace approach give identical answers. One takes three pages of algebra. The other takes three lines. This section shows both — and why engineers stopped using the first." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('circuit-analysis')}
          </span>
          Circuit Analysis
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Comparing time-domain differential equations with Laplace transform s-domain methods
        </p>
      </div>

      <FigureImage
        className="mb-6"
        src={`${import.meta.env.BASE_URL}figures/rc-charging-curve.png`}
        alt="RC circuit charge and discharge curves showing exponential behavior"
        caption="RC charge and discharge: voltage rises to 63% after one time constant τ = RC."
        attribution="Public Domain — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Series_RC_capacitor_voltage.svg"
      />

      <TableOfContents items={tocEntries} />

      <PredictionGate
        question="You double R in a series RC circuit (C fixed). What happens to the time constant τ and the s-domain pole at s = −1/τ?"
        options={[
          { id: 'slower', label: 'τ doubles; pole moves toward the origin (slower)' },
          { id: 'faster', label: 'τ halves; pole moves away from origin (faster)' },
          { id: 'same', label: 'τ unchanged; pole fixed' },
          { id: 'gain', label: 'Only the DC gain changes' },
        ]}
        getCorrectAnswer={() => 'slower'}
        explanation={<span>τ = RC, so doubling R doubles τ; the pole at s = −1/τ slides toward the origin and the circuit responds more slowly. (RL is the opposite — there τ = L/R.)</span>}
        onPredict={(correct) => markPredictionGate('circuit-analysis', correct)}
      >
        {/* circuit-type tab strip + selected comparison panel */}
        <div id="circuit-analysis" className="scroll-mt-4 flex border-b-2 border-slate-200 dark:border-slate-700">
          {(['RC', 'RL', 'RLC'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedCircuit(type)}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-3 -mb-[2px] ${
                selectedCircuit === type
                  ? 'border-engineering-blue-600 text-engineering-blue-700 dark:text-engineering-blue-400 bg-engineering-blue-50 dark:bg-engineering-blue-900/20'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {type} Circuit
            </button>
          ))}
        </div>

        {selectedCircuit === 'RC' && <RCCircuitComparison />}
        {selectedCircuit === 'RL' && <RLCircuitComparison />}
        {selectedCircuit === 'RLC' && <RLCCircuitComparison />}
      </PredictionGate>

      <div id="concept-check" className="scroll-mt-4" />
      {selectedCircuit === 'RC' && (
        <ConceptCheck data={{
          mode: 'predict-reveal',
          question: 'If you double R in an RC circuit, what happens to the time constant τ?',
          answer: 'τ = RC, so doubling R doubles the time constant. The circuit responds twice as slowly — it takes twice as long to reach 63.2% of the final value.',
        }}
          onComplete={() => incrementConceptChecks('circuit-analysis')}
          onHint={() => incrementHints('circuit-analysis')}
        />
      )}
      {selectedCircuit === 'RL' && (
        <ConceptCheck data={{
          mode: 'predict-reveal',
          question: 'If you double R in an RL circuit, what happens to the time constant τ?',
          answer: 'τ = L/R, so doubling R halves the time constant. The circuit responds twice as fast — opposite to the RC case! This is because higher R dissipates energy faster.',
        }}
          onComplete={() => incrementConceptChecks('circuit-analysis')}
          onHint={() => incrementHints('circuit-analysis')}
        />
      )}
      {selectedCircuit === 'RLC' && (
        <ConceptCheck data={{
          mode: 'predict-reveal',
          question: 'For a 3rd-order circuit, which method (time-domain or s-domain) would be easier and why?',
          answer: 'The s-domain method is much easier. A 3rd-order circuit requires solving a 3rd-order ODE in the time domain (very tedious), but in the s-domain it\'s just a 3rd-degree polynomial in s — solve algebraically, find poles, and inverse-transform.',
        }}
          onComplete={() => incrementConceptChecks('circuit-analysis')}
          onHint={() => incrementHints('circuit-analysis')}
        />
      )}

      <CollapsibleSection title="Method Comparison" defaultOpen={true} className="scroll-mt-4" id="method-comparison">
        <MethodComparisonTable />
      </CollapsibleSection>
      <CollapsibleSection title="Circuit Response Types" defaultOpen={false} className="scroll-mt-4" id="response-types">
        <ResponseComparisons />
      </CollapsibleSection>

      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-xs font-semibold font-mono text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
          Up Next
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Every solution on this page assumed <MathWrapper formula="v_C(0) = 0" /> or{' '}
          <MathWrapper formula="i(0) = 0" />. That is an assumption, not a law: real circuits
          get switched with charge and current already stored. Finding the true starting values
          from the pre-switch DC state — and solving from there with a three-number recipe — is
          Section {getSectionNumber('switched-circuits')}: Switched Circuits &amp; Initial Conditions.
        </p>
      </div>

      <section id="systematic-analysis" className="scroll-mt-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Equation-Writing Practice (KVL &amp; KCL)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          These drills practice writing a single equation. Solving whole networks
          systematically starts in{' '}
          <Link to="/nodal-mesh-analysis" className="underline text-engineering-blue-600 dark:text-engineering-blue-400">
            Nodal &amp; Mesh Analysis
          </Link>.
        </p>
        <CircuitAnalysisExercise
          onConceptCheckComplete={() => incrementConceptChecks('circuit-analysis')}
          onHint={() => incrementHints('circuit-analysis')}
        />
      </section>

      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation />
    </div>
  );
}

function RCCircuitComparison() {
  return (
    <>
    <CircuitComparisonLayout
      timeContent={<>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Circuit Setup</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Consider a series RC circuit with a voltage source <MathWrapper formula="V_s" />,
              resistor <MathWrapper formula="R" />, and capacitor <MathWrapper formula="C" />.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 1: Apply KVL</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Kirchhoff's Voltage Law around the loop:
            </p>
            <MathWrapper formula="V_s = v_R + v_C" block />
            <MathWrapper formula="V_s = iR + v_C" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 2: Use Constitutive Law</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              For a capacitor: <MathWrapper formula="i = C\frac{dv_C}{dt}" />
            </p>
            <MathWrapper formula="V_s = RC\frac{dv_C}{dt} + v_C" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 3: Solve ODE</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              This is a first-order linear ODE. Rearranging:
            </p>
            <MathWrapper formula="\frac{dv_C}{dt} + \frac{1}{RC}v_C = \frac{V_s}{RC}" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 mb-2">
              Time constant: <MathWrapper formula="\tau = RC" />
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Solution (assuming <MathWrapper formula="v_C(0) = 0" />):
            </p>
            <MathWrapper formula={circuitAnalysisFormulas.rc.voltage} block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 4: Find Current</h4>
            <MathWrapper formula="i(t) = C\frac{dv_C}{dt} = \frac{V_s}{R}e^{-t/\tau}" block />
          </div>
      </>}
      sContent={<>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Circuit Setup</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Same RC circuit, but we'll transform to the s-domain using Laplace transforms.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 1: Transform to S-Domain</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Apply Laplace transform to the time-domain equation:
            </p>
            <MathWrapper formula="\mathcal{L}\{V_s\} = \mathcal{L}\{iR + v_C\}" block />
            <MathWrapper formula="\frac{V_s}{s} = RI(s) + V_C(s)" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 2: Capacitor Impedance</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              In s-domain, capacitor impedance is:
            </p>
            <MathWrapper formula="Z_C(s) = \frac{1}{sC}" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 mb-2">
              Using Ohm's law in s-domain:
            </p>
            <MathWrapper formula="V_C(s) = I(s) \cdot \frac{1}{sC}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 3: Solve Algebraically</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Substitute and solve for <MathWrapper formula="I(s)" />:
            </p>
            <MathWrapper formula="\frac{V_s}{s} = I(s)\left(R + \frac{1}{sC}\right)" block />
            <MathWrapper formula="I(s) = \frac{V_s/s}{R + \frac{1}{sC}} = \frac{V_s C}{s(RCs + 1)}" block />
            <MathWrapper formula="I(s) = \frac{V_s}{R} \cdot \frac{1}{s + \frac{1}{RC}}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 4: Inverse Transform</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Using the transform pair <MathWrapper formula="\mathcal{L}^{-1}\{\frac{1}{s+a}\} = e^{-at}" />:
            </p>
            <MathWrapper formula="i(t) = \frac{V_s}{R}e^{-t/RC}" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">
              For voltage:
            </p>
            <MathWrapper formula="v_C(t) = V_s(1 - e^{-t/RC})" block />
          </div>
      </>}
      conclusion={
        <p className="text-slate-700 dark:text-slate-300">
          Both methods yield the <strong>identical result</strong>! The time-domain approach
          requires solving a differential equation, while the s-domain approach transforms
          it into an algebraic problem. For simple circuits, both are manageable, but for
          complex circuits, the s-domain method is significantly easier.
        </p>
      }
    />
    <YourTurnPanel
      scenario="Now consider the same RC circuit but with R doubled — 200 Ω instead of 100 Ω. The capacitance stays the same."
      question="How does doubling R affect the time constant τ and the s-domain pole location?"
      options={[
        { text: 'τ doubles; the pole moves closer to the origin', correct: true, explanation: 'Correct! τ = RC, so doubling R doubles τ. The pole at s = −1/τ moves closer to zero, meaning slower decay.' },
        { text: 'τ halves; the pole moves further from the origin', correct: false, explanation: 'That would be the case for an RL circuit where τ = L/R. For RC circuits, τ = RC — doubling R doubles τ.' },
        { text: 'τ stays the same; only the gain changes', correct: false, explanation: 'The time constant τ = RC depends directly on R, so changing R changes τ.' },
      ]}
      correctReveal={
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p>With R = 200 Ω, C = 10 μF:</p>
          <MathWrapper formula="\tau_{\text{new}} = RC = 200 \times 10\,\mu\text{F} = 2\text{ ms} \quad (\text{was } 1\text{ ms})" block />
          <MathWrapper formula="s_{\text{pole}} = -\frac{1}{\tau} = -\frac{1}{0.002} = -500\text{ rad/s} \quad (\text{was } -1000\text{ rad/s})" block />
          <p className="font-medium">The pole moves from s = −1000 to s = −500 (closer to the origin) — the circuit responds more slowly.</p>
        </div>
      }
    />
    </>
  );
}

function RLCircuitComparison() {
  return (
    <>
    <CircuitComparisonLayout
      timeContent={<>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Circuit Setup</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Consider a series RL circuit with voltage source <MathWrapper formula="V_s" />,
              resistor <MathWrapper formula="R" />, and inductor <MathWrapper formula="L" />.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 1: Apply KVL</h4>
            <MathWrapper formula="V_s = v_R + v_L" block />
            <MathWrapper formula="V_s = iR + v_L" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 2: Use Constitutive Law</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              For an inductor: <MathWrapper formula="v_L = L\frac{di}{dt}" />
            </p>
            <MathWrapper formula="V_s = iR + L\frac{di}{dt}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 3: Solve ODE</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Rearranging:
            </p>
            <MathWrapper formula="\frac{di}{dt} + \frac{R}{L}i = \frac{V_s}{L}" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 mb-2">
              Time constant: <MathWrapper formula="\tau = \frac{L}{R}" />
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Solution (assuming <MathWrapper formula="i(0) = 0" />):
            </p>
            <MathWrapper formula={circuitAnalysisFormulas.rl.current} block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 4: Find Voltage</h4>
            <MathWrapper formula="v_L(t) = L\frac{di}{dt} = V_s e^{-Rt/L}" block />
          </div>
      </>}
      sContent={<>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Circuit Setup</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Same RL circuit, transformed to the s-domain.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 1: Transform to S-Domain</h4>
            <MathWrapper formula="\frac{V_s}{s} = I(s)R + V_L(s)" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 2: Inductor Impedance</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              In s-domain, inductor impedance is:
            </p>
            <MathWrapper formula="Z_L(s) = sL" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 mb-2">
              Therefore:
            </p>
            <MathWrapper formula="V_L(s) = I(s) \cdot sL" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 3: Solve Algebraically</h4>
            <MathWrapper formula="\frac{V_s}{s} = I(s)(R + sL)" block />
            <MathWrapper formula="I(s) = \frac{V_s}{s(R + sL)} = \frac{V_s}{sR(1 + \frac{sL}{R})}" block />
            <MathWrapper formula="I(s) = \frac{V_s}{R} \cdot \frac{1}{s(1 + \frac{sL}{R})} = \frac{V_s}{R}\left(\frac{1}{s} - \frac{1}{s + \frac{R}{L}}\right)" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 4: Inverse Transform</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Using standard transform pairs:
            </p>
            <MathWrapper formula="i(t) = \frac{V_s}{R}(1 - e^{-Rt/L})" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">
              For voltage across inductor:
            </p>
            <MathWrapper formula="v_L(t) = V_s e^{-Rt/L}" block />
          </div>
      </>}
      conclusion={
        <p className="text-slate-700 dark:text-slate-300">
          Again, both approaches give the <strong>same result</strong>. The RL circuit behaves
          similarly to the RC circuit with an exponential rise in current and exponential decay
          in voltage across the inductor. The time constant <MathWrapper formula="\tau = L/R" />
          determines the response speed.
        </p>
      }
    />
    <YourTurnPanel
      scenario="Now consider the same RL circuit but with R doubled — 200 Ω instead of 100 Ω. The inductance stays the same."
      question="How does doubling R affect the time constant τ and the s-domain pole location?"
      options={[
        { text: 'τ halves; the pole moves further from the origin', correct: true, explanation: 'Correct! τ = L/R, so doubling R halves τ. The pole at s = −R/L moves further left, meaning faster decay — opposite to the RC case!' },
        { text: 'τ doubles; the pole moves closer to the origin', correct: false, explanation: 'That would be the RC case where τ = RC. For RL circuits, τ = L/R — doubling R halves τ.' },
        { text: 'τ stays the same; the pole doesn\'t move', correct: false, explanation: 'The time constant τ = L/R depends directly on R. Changing R always changes τ in an RL circuit.' },
      ]}
      correctReveal={
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p>With R = 200 Ω, L = 10 mH:</p>
          <MathWrapper formula="\tau = \frac{L}{R} = \frac{10\text{ mH}}{200\;\Omega} = 0.05\text{ ms}" block />
          <p className="font-medium">Doubling R in an RL circuit has the opposite effect to doubling R in an RC circuit — the RL circuit speeds up while the RC circuit slows down.</p>
        </div>
      }
    />
    </>
  );
}

function RLCCircuitComparison() {
  return (
    <>
    <CircuitComparisonLayout
      timeContent={<>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Circuit Setup</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Series RLC circuit with <MathWrapper formula="V_s" />, <MathWrapper formula="R" />,
              <MathWrapper formula="L" />, and <MathWrapper formula="C" />.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 1: Apply KVL</h4>
            <MathWrapper formula="V_s = v_R + v_L + v_C" block />
            <MathWrapper formula="V_s = iR + L\frac{di}{dt} + v_C" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 2: Express in Terms of Voltage</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Since <MathWrapper formula="i = C\frac{dv_C}{dt}" />:
            </p>
            <MathWrapper formula="V_s = RC\frac{dv_C}{dt} + LC\frac{d^2v_C}{dt^2} + v_C" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 3: Standard Form</h4>
            <MathWrapper formula="\frac{d^2v_C}{dt^2} + \frac{R}{L}\frac{dv_C}{dt} + \frac{1}{LC}v_C = \frac{V_s}{LC}" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              Define parameters:
            </p>
            <MathWrapper formula="\alpha = \frac{R}{2L}" block />
            <MathWrapper formula="\omega_0 = \frac{1}{\sqrt{LC}}" block />
            <MathWrapper formula="\zeta = \frac{\alpha}{\omega_0}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 4: Solutions by Damping Type</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Overdamped</strong> (<MathWrapper formula="\zeta > 1" />):
            </p>
            <MathWrapper formula={circuitAnalysisFormulas.rlc.overdamped} block />

            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 mt-3">
              <strong>Critically Damped</strong> (<MathWrapper formula="\zeta = 1" />):
            </p>
            <MathWrapper formula={circuitAnalysisFormulas.rlc.criticallyDamped} block />

            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 mt-3">
              <strong>Underdamped</strong> (<MathWrapper formula="\zeta < 1" />):
            </p>
            <MathWrapper formula={circuitAnalysisFormulas.rlc.underdamped} block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              where <MathWrapper formula="\omega_d = \omega_0\sqrt{1-\zeta^2}" />
            </p>
          </div>
      </>}
      sContent={<>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Circuit Setup</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Same RLC circuit, transformed to s-domain. Much simpler!
            </p>
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 1: Component Impedances</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              In s-domain:
            </p>
            <MathWrapper formula="Z_R(s) = R" block />
            <MathWrapper formula="Z_L(s) = sL" block />
            <MathWrapper formula="Z_C(s) = \frac{1}{sC}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 2: Total Impedance</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Series impedance:
            </p>
            <MathWrapper formula="Z_{total}(s) = R + sL + \frac{1}{sC}" block />
            <MathWrapper formula="Z_{total}(s) = \frac{s^2LC + sRC + 1}{sC}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 3: Transfer Function</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Current in s-domain:
            </p>
            <MathWrapper formula="I(s) = \frac{V_s/s}{Z_{total}(s)}" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 mb-2">
              Voltage across capacitor:
            </p>
            <MathWrapper formula="V_C(s) = I(s) \cdot \frac{1}{sC}" block />
            <MathWrapper formula="V_C(s) = \frac{V_s}{s^2LC + sRC + 1}" block />
            <MathWrapper formula="V_C(s) = \frac{V_s/LC}{s(s^2 + \frac{R}{L}s + \frac{1}{LC})}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 4: Find Poles</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Characteristic equation:
            </p>
            <MathWrapper formula="s^2 + \frac{R}{L}s + \frac{1}{LC} = 0" block />
            <MathWrapper formula="s^2 + 2\alpha s + \omega_0^2 = 0" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 mb-2">
              Poles:
            </p>
            <MathWrapper formula="s_{1,2} = -\alpha \pm \sqrt{\alpha^2 - \omega_0^2}" block />
          </div>

          <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 5: Inverse Transform</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Depending on pole locations (real vs complex), we get:
            </p>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 ml-4">
              <li>• Two real poles → Overdamped</li>
              <li>• One repeated real pole → Critically damped</li>
              <li>• Complex conjugate poles → Underdamped</li>
            </ul>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">
              The inverse Laplace transform yields the same time-domain solutions!
            </p>
          </div>
      </>}
      conclusion={<>
        <p className="text-slate-700 dark:text-slate-300 mb-3">
          For the RLC circuit, the s-domain advantage becomes clear! Instead of solving a
          second-order differential equation with multiple cases, we:
        </p>
        <ol className="text-slate-700 dark:text-slate-300 space-y-2 ml-6 list-decimal">
          <li>Find the transfer function algebraically</li>
          <li>Determine the pole locations</li>
          <li>Apply inverse Laplace transform based on pole type</li>
        </ol>
        <p className="text-slate-700 dark:text-slate-300 mt-3">
          The damping behavior (<MathWrapper formula="\zeta" />) directly relates to pole
          positions in the s-plane, providing deep physical insight!
        </p>
      </>}
    />
    <YourTurnPanel
      scenario="Now consider the same RLC circuit but with C halved. R and L stay the same."
      question="How does halving C affect the natural frequency ω₀ and the damping ratio ζ?"
      options={[
        { text: 'ω₀ increases by √2; ζ decreases', correct: true, explanation: 'Correct! ω₀ = 1/√(LC) — halving C increases ω₀ by √2. Since ζ = R√C/(2√L), halving C decreases ζ by √2. The system oscillates faster and is less damped.' },
        { text: 'ω₀ doubles; ζ stays the same', correct: false, explanation: 'ω₀ = 1/√(LC), so halving C increases ω₀ by √2, not by 2. And ζ = R√C/(2√L) also changes because it depends on √C.' },
        { text: 'ω₀ decreases; ζ decreases', correct: false, explanation: 'Halving C makes LC smaller, which increases ω₀ = 1/√(LC). The ζ part is right though — ζ = R√C/(2√L) decreases when C decreases.' },
        { text: 'ω₀ increases by √2; ζ increases', correct: false, explanation: 'ω₀ is correct, but ζ = R√C/(2√L) — since ζ depends on √C, halving C decreases ζ by √2, not increases it.' },
      ]}
      correctReveal={
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <MathWrapper formula="\omega_0 = \frac{1}{\sqrt{LC}} \to \frac{1}{\sqrt{L \cdot C/2}} = \sqrt{2} \cdot \omega_{0,\text{old}}" block />
          <MathWrapper formula="\zeta = \frac{R}{2}\sqrt{\frac{C}{L}} \to \frac{R}{2}\sqrt{\frac{C/2}{L}} = \frac{\zeta_{\text{old}}}{\sqrt{2}}" block />
          <p className="font-medium">Halving C increases ω₀ by √2 but decreases ζ by √2. The system oscillates faster and is less damped — it may even cross from overdamped to underdamped!</p>
        </div>
      }
    />
    </>
  );
}
