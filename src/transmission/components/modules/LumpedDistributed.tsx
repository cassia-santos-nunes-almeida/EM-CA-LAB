import { useEffect, useState } from 'react';
import { BookOpen, Activity, GraduationCap } from 'lucide-react';
import { getSectionNumber } from '@shared/constants/curriculum';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { SectionHook } from '@shared/components/common/SectionHook';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { FigureImage } from '@shared/components/common/FigureImage';
import { Tabs } from '@shared/components/common/Tabs';
import { useProgressStore } from '@shared/store/progressStore';
import { LadderAnimation } from '@transmission/components/simulations/LadderAnimation';
import { Z0_YOUR_TURN_OPTIONS } from './lumpedDistributedChallenge';

/**
 * Section 5.1 page: Lumped to Distributed.
 *
 * Covers the LC ladder network, its progressive subdivision into a continuous
 * transmission line, and the derivation of the telegrapher's equations from
 * Kirchhoff's laws applied to an infinitesimal segment.
 */
const CHALLENGE = {
  title: `From Lumped LC Sections to a Continuous Line`,
  description: `Use the LadderAnimation in the Simulations tab to subdivide an LC ladder from a single lumped section toward a continuous transmission line, and discover why the wave speed v = 1/√(L′C′) stays fixed even as the individual components shrink.`,
  instructions: [
    `In the Simulations tab, press Reset so the canvas shows Stage 1 / 7, a single LC section. Read the 'Sections (N)', 'L per section', 'C per section', and 'Wave speed v' readout cards and write down all four starting values.`,
    `Click Step once to move to 2 sections. Note that 'L per section' and 'C per section' each roughly halve, but record what happens to the 'Wave speed v' card.`,
    `Keep clicking Step (4, then 8, then 16, then 32 sections), watching the 'Sections (N)' and per-section readouts after each press. Confirm L per section and C per section keep shrinking while the canvas shows ever-smaller inductor and capacitor symbols.`,
    `Step one more time to reach the 'Continuous transmission line' stage (Stage 7 / 7). Observe that 'Sections (N)' now reads ∞ and that 'L per section' and 'C per section' both read → 0, yet compare 'Wave speed v' to the value you recorded in step 1.`,
    `Press Reset, then press Play and watch the Stage indicator auto-advance through all stages. Track the highlighted 'Wave speed v' card the whole way through to verify it never changes as the ladder subdivides.`,
    `Conclude why v stays constant: because v = 1/√(L′C′) depends only on the per-unit-length L′ and C′ (total L and C over the fixed physical length), and subdividing changes N without changing L′ or C′ — so the discrete ladder smoothly becomes a continuous line carrying a wave at the same speed.`,
  ],
  hint: `Watch the highlighted Wave speed v card, not the shrinking per-section L and C values — that contrast is the whole point.`,
};

export function LumpedDistributed() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('lumped-distributed'); }, [markVisited]);

  // Lifted above the Tabs: switching tabs remounts the panel, so the gate's
  // unlocked state must live here for a within-visit unlock to survive.
  const [simUnlocked, setSimUnlocked] = useState(false);

  return (
    <div className="space-y-10">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('lumped-distributed')}
          </span>
          From Lumped Circuits to Distributed Systems
        </h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
          Every transmission line can be understood as the limiting case of an LC ladder network.
          This section shows how ordinary circuit elements, when subdivided to the infinitesimal
          limit, naturally produce wave equations.
        </p>
      </div>

      <Tabs tabs={[
        {
          label: 'Theory',
          icon: <BookOpen className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
      {/* ── The ladder network ────────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          The Ladder Network
        </h2>

        <SectionHook
          text="A coaxial cable, a PCB trace over a ground plane, even a pair of wires strung across
                a room — they all have distributed inductance and capacitance along their length.
                The ladder model lets us build intuition for how voltage and current propagate
                through such structures."
        />

        {/* Real-world distributed structures */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/coaxial-cable-cutaway.png`}
            alt="Cutaway diagram of a coaxial cable showing center conductor, dielectric insulator, shield, and outer jacket"
            caption="Coaxial cable cross-section: the center conductor and outer shield form a distributed inductance and capacitance per unit length — exactly the L' and C' in the ladder model."
            attribution="Tkgd2007, CC BY-SA 3.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Coaxial_cable_cutaway_new.svg"
          />
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/microstrip-geometry.png`}
            alt="Cross-section diagram of a microstrip transmission line showing trace, substrate, and ground plane"
            caption="Microstrip geometry: a PCB trace over a ground plane. The trace width, substrate thickness, and dielectric constant determine L' and C', and therefore Z₀."
            attribution="Dassault Systèmes, CC BY-SA 3.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Microstrip_geometry.svg"
          />
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
          <p>
            Start with the simplest possible model: a single series inductor{' '}
            <MathWrapper formula="L" /> followed by a shunt capacitor{' '}
            <MathWrapper formula="C" /> to ground. This is one LC section. If you
            apply a voltage step at the input, current flows through{' '}
            <MathWrapper formula="L" />, charges up <MathWrapper formula="C" />,
            and a delayed version of the input eventually appears at the output.
          </p>

          <p>
            Now split that single section into <em>two</em> sections, each with half the
            inductance and half the capacitance:
          </p>

          <MathWrapper
            formula="L_1 = L_2 = \frac{L_{\text{total}}}{2}, \qquad C_1 = C_2 = \frac{C_{\text{total}}}{2}"
            block
          />

          <p>
            The total inductance and capacitance are unchanged, but the signal now
            passes through two smaller LC stages. Repeat the subdivision:
            two becomes four, four becomes eight, eight becomes sixteen.
          </p>

          <MathWrapper
            formula="L_n = \frac{L_{\text{total}}}{N}, \qquad C_n = \frac{C_{\text{total}}}{N}"
            block
          />

          <p>
            At each stage, the individual components shrink, but the overall ladder
            stores the same total energy and presents the same impedance to the source.
            Something remarkable happens in the limit{' '}
            <MathWrapper formula="N \to \infty" />: the discrete ladder becomes a
            <strong> continuous transmission line</strong>.
          </p>

          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Does the wave speed change as we subdivide?
          </p>

          <p>
            The wave speed on the ladder is determined by the per-unit-length inductance{' '}
            <MathWrapper formula="L' = L_{\text{total}} / \ell" /> and per-unit-length
            capacitance <MathWrapper formula="C' = C_{\text{total}} / \ell" />, where{' '}
            <MathWrapper formula="\ell" /> is the physical length:
          </p>

          <MathWrapper
            formula="v = \frac{1}{\sqrt{L' \cdot C'}}"
            block
          />

          <p>
            Subdividing increases <MathWrapper formula="N" /> but does not change{' '}
            <MathWrapper formula="L'" /> or <MathWrapper formula="C'" />.
            The wave speed is therefore <strong>independent of the number of sections</strong>.
          </p>
        </div>
      </section>

      {/* ── Telegrapher's equations ───────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Telegrapher&rsquo;s Equations (Derivation Sketch)
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
          <p>
            Take one infinitesimal segment of the ladder&mdash;a tiny length{' '}
            <MathWrapper formula="\Delta x" /> containing series inductance{' '}
            <MathWrapper formula="L' \Delta x" /> and shunt capacitance{' '}
            <MathWrapper formula="C' \Delta x" />. Apply Kirchhoff&rsquo;s voltage
            law (KVL) around the loop and Kirchhoff&rsquo;s current law (KCL) at
            the node.
          </p>

          <p>
            <strong>KVL</strong> gives the voltage drop across the series inductor:
          </p>

          <MathWrapper
            formula="\frac{\partial V}{\partial x} = -L' \frac{\partial I}{\partial t}"
            block
          />

          <p>
            <strong>KCL</strong> gives the current diverted through the shunt capacitor:
          </p>

          <MathWrapper
            formula="\frac{\partial I}{\partial x} = -C' \frac{\partial V}{\partial t}"
            block
          />

          <p>
            These are the <strong>telegrapher&rsquo;s equations</strong>. Taking{' '}
            <MathWrapper formula="\partial / \partial x" /> of the first and
            substituting the second yields the wave equation:
          </p>

          <MathWrapper
            formula="\frac{\partial^2 V}{\partial x^2} = L' C' \frac{\partial^2 V}{\partial t^2}"
            block
          />

          <p>
            The general solution is a superposition of forward and backward
            travelling waves:
          </p>

          <MathWrapper
            formula="V(x,t) = V^{+} f\!\left(t - \frac{x}{v}\right) + V^{-} g\!\left(t + \frac{x}{v}\right)"
            block
          />

          <p>
            where <MathWrapper formula="v = 1/\sqrt{L' C'}" /> is the propagation
            speed&mdash;the same quantity we saw remain constant during subdivision.
          </p>
        </div>

        {/* Callout box */}
        <div className="rounded-lg border-l-4 border-engineering-blue-500 bg-engineering-blue-50 dark:bg-engineering-blue-900/15 px-5 py-4">
          <p className="text-xs font-bold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-2">
            Key Insight
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            These are <strong>Kirchhoff&rsquo;s laws</strong>. Applied to an
            infinitesimal segment. The wave equation emerges from circuit analysis
            you already know.
          </p>
        </div>

        <ConceptCheck
          onComplete={() => incrementConceptChecks('lumped-distributed')}
          onHint={() => incrementHints('lumped-distributed')}
          data={{
            mode: 'multiple-choice',
            question: 'Which Kirchhoff law yields the second telegrapher equation, ∂I/∂x = −C′ ∂V/∂t?',
            options: [
              { text: 'KCL (Kirchhoff’s Current Law), applied at the node', correct: true, explanation: 'Correct. At the node, the current that does not continue along the line is diverted to charge the shunt capacitance C′Δx, giving ∂I/∂x = −C′ ∂V/∂t.' },
              { text: 'KVL (Kirchhoff’s Voltage Law), applied around the loop', correct: false, explanation: 'KVL around the loop gives the first telegrapher equation, ∂V/∂x = −L′ ∂I/∂t. The second equation comes from current balance at the node (KCL).' },
              { text: 'Faraday’s law of induction', correct: false, explanation: 'Faraday’s law underlies the series inductor’s V–I relation, but both telegrapher equations are obtained by applying KVL and KCL to the infinitesimal LC segment.' },
            ],
            hints: [
              'The first equation came from the loop (KVL); the second comes from the node.',
              'At the node, current splits between continuing down the line and charging the shunt capacitor C′Δx.',
            ],
          }}
        />
      </section>
            </div>
          ),
        },
        {
          label: 'Simulations',
          icon: <Activity className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
      {/* ── The ladder animation ──────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          The Ladder Animation
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Before watching the animation, make a prediction. This will help you pay
          attention to the right quantity as the ladder subdivides.
        </p>

        <PredictionGate
          question="If we split the LC ladder into 10x more sections (same total L and C), does the wave speed increase, decrease, or stay the same?"
          options={[
            { id: 'increases', label: 'Increases' },
            { id: 'decreases', label: 'Decreases' },
            { id: 'same', label: 'Stays the same' },
          ]}
          getCorrectAnswer={() => 'same'}
          initialPassed={simUnlocked}
          onPassed={() => setSimUnlocked(true)}
          onPredict={(correct) => markPredictionGate('lumped-distributed', correct)}
          explanation={
            <p>
              The wave speed{' '}
              <MathWrapper formula="v = 1/\sqrt{L' C'}" /> depends on the{' '}
              <em>per-unit-length</em> values <MathWrapper formula="L'" /> and{' '}
              <MathWrapper formula="C'" />. When you subdivide, the per-unit-length
              values stay the same because both total{' '}
              <MathWrapper formula="L" /> and total <MathWrapper formula="C" />{' '}
              are unchanged for the same physical length. More sections means
              smaller components, but the product{' '}
              <MathWrapper formula="L' \cdot C'" /> is invariant.
            </p>
          }
        >
          <div className="mt-6">
            <LadderAnimation />
          </div>
        </PredictionGate>
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
          onComplete={() => incrementConceptChecks('lumped-distributed')}
          onHint={() => incrementHints('lumped-distributed')}
          data={{
            mode: 'multiple-choice',
            question: 'Which Kirchhoff law gives the first telegrapher\'s equation (\u2202V/\u2202x = \u2212L\u2032 \u2202I/\u2202t)?',
            options: [
              { text: 'KVL (Kirchhoff\u2019s Voltage Law)', correct: true, explanation: 'Correct. The voltage drop across the series inductor in the loop gives \u2202V/\u2202x = \u2212L\u2032 \u2202I/\u2202t.' },
              { text: 'KCL (Kirchhoff\u2019s Current Law)', correct: false, explanation: 'KCL gives the second telegrapher\u2019s equation (\u2202I/\u2202x = \u2212C\u2032 \u2202V/\u2202t), which describes current diverted through the shunt capacitor.' },
            ],
            hints: [
              'The first equation relates a voltage change (\u2202V/\u2202x) to current change. Which Kirchhoff law involves summing voltages around a loop?',
            ],
          }}
        />

      {/* ── Your Turn: compute v and Z₀ ──────────────────────────── */}
      <YourTurnPanel
        scenario="A coaxial cable has per-unit-length inductance L′ = 0.25 μH/m and per-unit-length capacitance C′ = 100 pF/m."
        question="What is the wave speed v and characteristic impedance Z₀?"
        options={Z0_YOUR_TURN_OPTIONS}
        correctReveal={
          <div className="space-y-1">
            <MathWrapper
              formula="v = \frac{1}{\sqrt{L' C'}} = \frac{1}{\sqrt{0.25 \times 10^{-6} \times 100 \times 10^{-12}}} = 2 \times 10^8\,\text{m/s}"
              block
            />
            <MathWrapper
              formula="Z_0 = \sqrt{\frac{L'}{C'}} = \sqrt{\frac{0.25 \times 10^{-6}}{100 \times 10^{-12}}} = 50\,\Omega"
              block
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              The velocity factor is v/c = 2/3 — typical for polyethylene-filled coax.
            </p>
          </div>
        }
      />

            </div>
          ),
        },
      ]} />

      {/* ── Module navigation ─────────────────────────────────────── */}
      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation currentSectionId="lumped-distributed" />
    </div>
  );
}
