import { useEffect, useState } from 'react';
import { BookOpen, Activity, GraduationCap } from 'lucide-react';
import { getSectionNumber } from '@shared/constants/curriculum';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { SectionHook } from '@shared/components/common/SectionHook';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { FigureImage } from '@shared/components/common/FigureImage';
import { Tabs } from '@shared/components/common/Tabs';
import { useProgressStore } from '@shared/store/progressStore';
import { BounceDiagram } from '@transmission/components/simulations/BounceDiagram';

/**
 * Transients on Transmission Lines page.
 *
 * Covers step response, bounce diagrams, and the bridge to antennas.
 * Includes an interactive bounce diagram simulation, prediction gates,
 * worked examples, and a your-turn exercise panel.
 */
const CHALLENGE = {
  title: `Build a Bounce Diagram and Watch It Settle`,
  description: `Use the interactive Bounce Diagram Builder to launch a voltage step onto a 50 Ω line and track how reflections at the load and source ends superimpose, overshoot, alternate, and converge toward the DC voltage-divider steady state.`,
  instructions: [
    `Open the Simulations tab. Set 'Γ at Load (Γₗ)' to about +0.50 and 'Γ at Source (Γₛ)' to 0.00, then read the V₀ and Vss values in the readout strip — confirm V₀ = 5.00 V (half of Vs because the source is matched) and Vss = 7.50 V.`,
    `Click 'Start Step-Through', then press 'Next Bounce' once to reveal the first blue forward wave; note its +5.00 V label on the canvas and watch the 'Voltage at Load End' chart jump only after one propagation delay T_D.`,
    `Press 'Next Bounce' again to add the red backward wave and observe that with Γₛ = 0 no further forward bounce appears — the load voltage settles at 7.50 V after a single round trip (the matched source absorbs the returning wave).`,
    `Drag 'Γ at Source (Γₛ)' to a negative value such as -0.30 (keeping Γₗ ≈ +0.50) and raise 'Number of Bounces' to 8; click 'Play All' and watch the load-end voltage overshoot above Vss then alternate above and below it on successive bounces because the product Γₗ·Γₛ is negative.`,
    `Drag 'Γ at Load (Γₗ)' down to a negative value like -0.50 and compare the new Vss readout to the positive-Γₗ case — confirm the steady-state voltage drops (to 2.50 V at Γₛ = 0) because the reflected wave now subtracts from the incident wave.`,
    `Finally, drag both 'Γ at Load (Γₗ)' and 'Γ at Source (Γₛ)' all the way to their +1.00 endpoints (a fully open–open extreme) and observe the Vss readout switch to '∞ (unstable)' as Γₗ·Γₛ → 1; summarize how the sign and magnitude of the two reflection coefficients set whether the line overshoots, undershoots, alternates, or fails to converge, while Vss otherwise always matches the DC voltage divider Vs·Zₗ/(Zₛ+Zₗ).`,
  ],
  hint: `Vss is always the DC voltage-divider result; the reflection coefficients only control the transient path (overshoot, alternation, settling speed) taken to reach it.`,
};

export function Transients() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('transients'); }, [markVisited]);

  // Lifted above the Tabs: switching tabs remounts the panel, so the gate's
  // unlocked state must live here for a within-visit unlock to survive.
  const [simUnlocked, setSimUnlocked] = useState(false);

  return (
    <div className="space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-engineering-blue-600 to-engineering-blue-800 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">
          <span className="font-mono text-white/80 mr-2">
            {getSectionNumber('transients')}
          </span>
          Transients on Transmission Lines
        </h1>
        <p className="text-engineering-blue-100 leading-relaxed mt-3 max-w-3xl">
          When a voltage step is launched onto a transmission line, it doesn't just arrive at the
          load and stop. It reflects, bounces back, reflects again, and gradually settles to a
          steady-state value. The <em>bounce diagram</em> is the tool engineers use to track every
          one of those reflections.
        </p>
      </div>

      <SectionHook
        text="Every time you plug in a high-speed USB cable, the signal bounces back and forth
          along the trace before settling. If the impedances aren't matched, those reflections
          cause signal integrity problems — ringing, overshoot, and bit errors. This section
          gives you the tools to predict and prevent that."
      />


      <Tabs tabs={[
        {
          label: 'Theory',
          icon: <BookOpen className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
      {/* Real-world signal integrity images */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/transmission-line-reflections.gif`}
          alt="Animated simulation of pulse reflections on open- and short-terminated transmission lines"
          caption="Animated pulse reflections on a transmission line: a step voltage travels to the load end and reflects with polarity determined by the termination (open = positive, short = negative)."
          attribution="Sbyrnes321 / MrAureliusR, CC0 Public Domain — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Transmission_line_pulse_reflections.gif"
        />
        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/eye-diagram.png`}
          alt="Eye diagram showing a multi-level high-speed digital signal with open eyes indicating good signal integrity"
          caption="An eye diagram: overlapping many bit transitions reveals whether the signal has clean 'eyes' (good integrity) or closed eyes (excessive ringing and jitter from reflections)."
          attribution="Chabacano, CC BY-SA 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Eye-diagram_no_circles_border.svg"
        />
      </div>

      {/* ── Step Response ────────────────────────────────────────── */}

      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Step Response on a Transmission Line
        </h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Consider a transmission line of length <MathWrapper formula="\ell" /> with characteristic
          impedance <MathWrapper formula="Z_0" />, connected to a source with internal
          impedance <MathWrapper formula="Z_s" /> and terminated by a load <MathWrapper formula="Z_L" />.
          When the source applies a voltage step <MathWrapper formula="V_s" />, an initial wave is
          launched onto the line.
        </p>

        <MathWrapper
          formula="V_0^+ = V_s \cdot \frac{Z_0}{Z_s + Z_0}"
          block
        />

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          This wave takes one propagation delay to reach the load:
        </p>

        <MathWrapper
          formula="T_D = \frac{\ell}{v_p}"
          block
        />

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          where <MathWrapper formula="v_p" /> is the phase velocity on the line. Upon reaching the
          load, the wave reflects with reflection coefficient:
        </p>

        <MathWrapper
          formula="\Gamma_L = \frac{Z_L - Z_0}{Z_L + Z_0}"
          block
        />

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The reflected wave travels back to the source, where it reflects again with:
        </p>

        <MathWrapper
          formula="\Gamma_s = \frac{Z_s - Z_0}{Z_s + Z_0}"
          block
        />

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Each successive reflection multiplies by the appropriate <MathWrapper formula="\Gamma" />.
          If <MathWrapper formula="|\Gamma_L \cdot \Gamma_s| < 1" />, the reflections decay and
          the voltage converges to the steady-state value:
        </p>

        <MathWrapper
          formula="V_{ss} = V_0^+ \cdot \frac{1 + \Gamma_L}{1 - \Gamma_L \Gamma_s} = V_s \cdot \frac{Z_L}{Z_s + Z_L}"
          block
        />

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          This is exactly the voltage-divider result you'd expect from DC circuit analysis &mdash;
          the transmission line just adds a transient settling process.
        </p>

        <CollapsibleSection title="Derivation: Lattice Diagram Method" variant="inline">
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              The lattice (or bounce) diagram is a systematic way to track every reflection on the
              line. Each bounce multiplies by the appropriate reflection coefficient:
            </p>
            <MathWrapper
              formula="V_n = V_0^+ \cdot \Gamma_L^{\lceil n/2 \rceil} \cdot \Gamma_s^{\lfloor n/2 \rfloor}"
              block
            />
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              The total voltage at the load after <MathWrapper formula="N" /> bounces is the
              geometric series sum of all arriving waves. As{' '}
              <MathWrapper formula="N \to \infty" />, this converges to{' '}
              <MathWrapper formula="V_{ss}" /> provided{' '}
              <MathWrapper formula="|\Gamma_L \Gamma_s| < 1" />.
            </p>
          </div>
        </CollapsibleSection>

        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/transmission-line-open-short.gif`}
          alt="Animation comparing wave reflection on open- vs short-circuited transmission lines"
          caption="A voltage step reflecting off an open vs. a short termination: the open end reflects with the same polarity, the short end with inverted polarity."
          attribution="Sbyrnes321, CC0 Public Domain — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Transmission_line_animation_open_short.gif"
        />

      </section>

      {/* ── Bridge to Antennas ───────────────────────────────────── */}
      <section className="bg-gradient-to-r from-engineering-blue-50 to-blue-50 dark:from-engineering-blue-900/20 dark:to-blue-900/20 border border-engineering-blue-200 dark:border-engineering-blue-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
          Bridge to Antennas
        </h2>
        <div className="flex gap-3">
          <div className="shrink-0 mt-1">
            <svg className="w-6 h-6 text-engineering-blue-600 dark:text-engineering-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              A matched transmission line (<MathWrapper formula="\Gamma = 0" />) delivers all power
              to the load. An antenna is a load designed to "absorb" power by <em>radiating</em> it
              into space rather than dissipating it as heat.
            </p>
            <p className="font-semibold text-engineering-blue-700 dark:text-engineering-blue-300">
              What does <MathWrapper formula="Z_0" /> matching mean for an antenna? That's the next
              section.
            </p>
          </div>
        </div>
      </section>
            </div>
          ),
        },
        {
          label: 'Simulations',
          icon: <Activity className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
      {/* ── Bounce Diagram Builder ───────────────────────────────── */}
      <section className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Bounce Diagram Builder
          </h2>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            A bounce diagram plots position (horizontal) against time (vertical, increasing
            downward). Each diagonal line represents a wave traveling across the line. Forward
            waves (source to load) are shown in <span className="font-semibold text-blue-600 dark:text-blue-400">blue</span>;
            backward waves (load to source) in <span className="font-semibold text-red-600 dark:text-red-400">red</span>.
            The voltage label on each segment shows its amplitude contribution.
          </p>

          {/* Prediction Gate before the simulation */}
          <PredictionGate
            question={
              '\u0393_source = 0 (matched source), \u0393_load = +1 (open circuit). ' +
              'After the first reflection, what is the voltage at the load end?'
            }
            options={[
              { id: 'vs', label: 'V\u209B' },
              { id: '2vs', label: '2V\u209B' },
              { id: 'zero', label: '0' },
              { id: 'vshalf', label: 'V\u209B / 2' },
            ]}
            getCorrectAnswer={() => 'vs'}
            initialPassed={simUnlocked}
            onPassed={() => setSimUnlocked(true)}
            onPredict={(correct) => markPredictionGate('transients', correct)}
            explanation={
              <p>
                With a matched source (<MathWrapper formula="Z_s = Z_0" />), the initial voltage
                launched onto the line is <MathWrapper formula="V_0 = V_s / 2" />. At an open
                circuit, <MathWrapper formula="\Gamma_L = +1" />, so the total voltage at the
                load is <MathWrapper formula="V_0(1 + \Gamma_L) = V_0 \times 2 = V_s" />.
              </p>
            }
          >
            {/* The interactive simulation */}
            <BounceDiagram className="mt-6" />
          </PredictionGate>
        </div>

        {/* ── Worked Example ───────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Worked Example
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold">Given:</span>{' '}
            <MathWrapper formula="V_s = 10\text{V}" />,{' '}
            <MathWrapper formula="Z_0 = 50\,\Omega" />,{' '}
            <MathWrapper formula="\Gamma_L = +0.5" />,{' '}
            <MathWrapper formula="\Gamma_s = 0" /> (matched source). Show the first 3 bounces.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <span className="font-semibold">Bounce 1 (forward):</span>{' '}
              <MathWrapper formula="V_0^+ = 10 \times \frac{50}{50 + 50} = 5\text{V}" />.
              This wave travels from source to load.
            </p>
            <p>
              <span className="font-semibold">Bounce 2 (backward):</span>{' '}
              Reflects at load: <MathWrapper formula="V_1^- = 5 \times 0.5 = 2.5\text{V}" />.
              Travels back toward the source.
            </p>
            <p>
              <span className="font-semibold">Bounce 3 (forward):</span>{' '}
              Reflects at source: <MathWrapper formula="V_2^+ = 2.5 \times 0 = 0\text{V}" />.
              With a matched source (<MathWrapper formula="\Gamma_s = 0" />), no further reflections
              occur. The line settles after just one round trip.
            </p>
            <p className="font-semibold pt-2 border-t border-slate-200 dark:border-slate-600">
              Steady-state voltage:{' '}
              <MathWrapper formula="V_{ss} = 5 \times \frac{1 + 0.5}{1 - 0} = 7.5\text{V}" />.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check: <MathWrapper formula="V_s \times Z_L / (Z_s + Z_L)" />.
              With <MathWrapper formula="\Gamma_L = 0.5" />,{' '}
              <MathWrapper formula="Z_L = Z_0 \frac{1+\Gamma_L}{1-\Gamma_L} = 50 \times \frac{1.5}{0.5} = 150\,\Omega" />.
              So <MathWrapper formula="V_{ss} = 10 \times 150 / (50 + 150) = 7.5\text{V}" />. Confirmed.
            </p>
          </div>

        </div>
      </section>
            </div>
          ),
        },
        {
          label: 'Practice',
          icon: <GraduationCap className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
        <ConceptCheck
          onComplete={() => incrementConceptChecks('transients')}
          onHint={() => incrementHints('transients')}
          data={{
            mode: 'multiple-choice',
            question: 'With \u0393_L = 0.5 and \u0393_S = \u22120.3, where does V_load sit right after the 3rd arrival \u2014 above or below V_ss?',
            options: [
              { text: 'Above V_ss \u2014 it overshoots then settles down', correct: true, explanation: 'Correct. With \u0393_L > 0, the first reflection adds to the initial wave, causing an overshoot. The product \u0393_L\u0393_S < 0 means successive corrections alternate in sign, oscillating around V_ss.' },
              { text: 'Below V_ss \u2014 it climbs monotonically', correct: false, explanation: 'With a positive \u0393_L the first reflection adds voltage, pushing above V_ss. The negative \u0393_S then causes the next correction to subtract.' },
              { text: 'Exactly at V_ss after 3 bounces', correct: false, explanation: 'Convergence to V_ss requires infinitely many bounces (or \u0393_S = 0). After 3 round trips there is still a residual error.' },
            ],
            hints: [
              'Think about the sign of each successive bounce. \u0393_L > 0 adds voltage; \u0393_S < 0 subtracts on the return.',
              'The product \u0393_L\u0393_S is negative, so the corrections alternate in sign \u2014 an oscillatory convergence.',
            ],
          }}
        />

          <YourTurnPanel
            scenario={'Change \u0393_L to \u22120.5 (keeping \u0393_s = 0). Use the bounce diagram above to verify.'}
            question="How does the steady-state voltage change compared to Γ_L = +0.5?"
            options={[
              {
                text: "It's lower",
                correct: true,
                explanation:
                  'Negative \u0393_L means the reflected wave subtracts from the incident. The steady-state voltage will be lower than with positive \u0393_L.',
              },
              {
                text: "It's higher",
                correct: false,
                explanation:
                  'A negative reflection coefficient causes reflected waves to subtract, not add.',
              },
              {
                text: 'Same',
                correct: false,
                explanation:
                  'The sign of \u0393_L determines whether reflections add or subtract, so the result is different.',
              },
              {
                text: 'Zero',
                correct: false,
                explanation:
                  'The voltage isn\'t zero \u2014 the initial forward wave still exists. With \u0393_L = \u22120.5, V_ss = V_0(1 + \u0393_L)/(1 \u2212 \u0393_L\u0393_s) = 5 \u00D7 0.5 / 1 = 2.5V.',
              },
            ]}
            correctReveal={
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  With <MathWrapper formula="\Gamma_L = -0.5" /> and <MathWrapper formula="\Gamma_s = 0" />:
                </p>
                <MathWrapper
                  formula="V_{ss} = 5 \times \frac{1 + (-0.5)}{1 - 0} = 5 \times 0.5 = 2.5\text{V}"
                  block
                />
                <p>
                  Compare to 7.5V with <MathWrapper formula="\Gamma_L = +0.5" />. The negative
                  reflection coefficient significantly reduces the steady-state voltage.
                </p>
              </div>
            }
          />

      <ConceptCheck
        onComplete={() => incrementConceptChecks('transients')}
        onHint={() => incrementHints('transients')}
        data={{
          mode: 'multiple-choice',
          question: 'What determines the final steady-state voltage on a transmission line?',
          options: [
            { text: 'Only the source voltage and the voltage divider Z_S, Z_L', correct: true, explanation: 'Correct. At DC steady state, the transmission line is transparent \u2014 V_ss = V_S \u00D7 Z_L / (Z_S + Z_L). The line only affects the transient settling, not the final value.' },
            { text: 'The characteristic impedance Z\u2080 and the line length', correct: false, explanation: 'Z\u2080 and length affect the transient (how many bounces, how fast), but the steady-state is set by the DC voltage divider.' },
            { text: 'The number of bounces before convergence', correct: false, explanation: 'The number of bounces affects how quickly the line settles, but V_ss is independent of the convergence rate.' },
          ],
          hints: [
            'Think about what happens at t = \u221E. The transmission line is lossless, so at DC it looks like a short piece of wire.',
          ],
        }}
      />
            </div>
          ),
        },
      ]} />

      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation currentSectionId="transients" />
    </div>
  );
}
