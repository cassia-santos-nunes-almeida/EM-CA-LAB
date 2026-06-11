import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
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
import { LabStation } from '@shared/components/common/LabStation';
import { LabLayout } from '@shared/components/common/LabLayout';
import { Tabs } from '@shared/components/common/Tabs';
import { useProgressStore } from '@shared/store/progressStore';
import { TransmissionLineSim } from '@transmission/components/simulations/TransmissionLineSim';
import { StandingWaveQuiz } from '@transmission/components/simulations/StandingWaveQuiz';
import { SmithChartSim } from '@transmission/components/simulations/SmithChartSim';

/**
 * Section 5.2 page: Transmission Lines.
 *
 * Virtual-lab layout: the section is chaptered into Tabs panels (one
 * digestible chunk each). Theory-only chapters render full width; lab chapters
 * use the split-pane LabLayout — theory on the left, a sticky "lab bench" on the
 * right whose simulation is revealed only after the student commits a prediction
 * (a blocking, non-skippable PredictionGate). The unlocked state is lifted into
 * this component so switching tabs (which remounts the panel) does not re-lock a
 * lab the student already opened.
 */
const CHALLENGE = {
  title: `Reading Reflections: From Matched Line to Standing Wave`,
  description: `A guided exploration of the interactive transmission line simulation (in the Reflections & Standing Waves lab). Sweep the load impedance through matched, mismatched, open, and short conditions while watching the incident, reflected, and total waves and the live Γ / VSWR readouts, building intuition for how the load termination controls reflection and the standing-wave pattern.`,
  instructions: [
    `Open the 🧪 Reflections lab tab. The line simulation sits in the bench on the right — commit the Predict-First prediction to reveal it. Then set the Signal toggle to Sinusoidal, leave Z₀ (characteristic) at 50 Ω, and drag Zₗ (load) to 50 Ω so it equals Z₀. Observe that the orange Reflected wave flattens out and the green Total wave becomes a clean travelling wave, and confirm the readouts show Γ ≈ 0 and VSWR ≈ 1.`,
    `Now drag Zₗ (load) up to about 150 Ω. Watch the orange Reflected wave grow and the green Total wave develop fixed peaks and dips that no longer travel, and note how the VSWR readout climbs above 1 as |Γ| increases.`,
    `Tick the Open checkbox (Zₗ = ∞). Observe that |Γ| jumps to 1 and VSWR reads ∞, and that the Total voltage at the load (right) end swells to roughly twice the incident amplitude, consistent with Γ = +1.`,
    `Untick Open and drag Zₗ (load) down to 0 Ω (short circuit). Compare with the open case: |Γ| is again 1 but the Total voltage now goes to zero at the load end, confirming Γ = −1 inverts the reflected wave.`,
    `Return Zₗ to a mismatch like 150 Ω and sweep the Frequency slider from 1 MHz toward 10 GHz. Watch the Wavelength λ readout shrink and the 'Line = Nλ₀' value grow, and note how many more standing-wave peaks fit along the same physical line at higher frequency.`,
    `Conclude: in your own words, explain how the load impedance Zₗ relative to Z₀ sets the reflection coefficient and VSWR, why open and short circuits both give |Γ| = 1 yet produce opposite voltage at the load, and how electrical length (line length in wavelengths) governs the standing-wave pattern.`,
  ],
  hint: `Watch the |Γ| and VSWR readouts together: VSWR = 1 means a perfect match (no reflection), and VSWR → ∞ means total reflection (open or short).`,
};

const flaskIcon = <FlaskConical className="w-4 h-4" aria-hidden="true" />;

export function TransmissionLines() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('transmission-lines'); }, [markVisited]);

  // Unlocked lab benches, lifted above the Tabs so a remounted panel
  // (Tabs remounts on tab switch) restores its revealed simulation.
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const unlock = (key: string) => setUnlocked((u) => ({ ...u, [key]: true }));

  const onConcept = () => incrementConceptChecks('transmission-lines');
  const onHint = () => incrementHints('transmission-lines');
  const onPredict = (correct: boolean) => markPredictionGate('transmission-lines', correct);

  /* ================================================================
     Characteristic impedance (theory only, full width)
     ================================================================ */
  const impedanceTheory = (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Characteristic Impedance
      </h2>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        When a wave travels down a transmission line, the ratio of voltage to current is
        fixed by the line&rsquo;s geometry &mdash; not by the source or load. That ratio is
        the <strong>characteristic impedance</strong> <MathWrapper formula="Z_0" />.
      </p>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        For a <strong>lossless</strong> line, it depends only on the per-unit-length
        inductance and capacitance:
      </p>

      <MathWrapper block formula="Z_0 = \sqrt{\frac{L'}{C'}}" />

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        This is a real number, independent of frequency, line length, or what is connected
        at either end. It is a property of the line&rsquo;s cross-section and dielectric.
      </p>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Typical Values
        </p>
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li><strong>50 &Omega;</strong> &mdash; standard coaxial cable (RF, instrumentation)</li>
          <li><strong>75 &Omega;</strong> &mdash; television / video coax (RG-6)</li>
          <li><strong>100 &Omega;</strong> &mdash; differential pair (Ethernet, USB)</li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/sma-connector.jpg`}
          alt="SMA coaxial RF connector used in precision 50 Ω systems"
          caption="An SMA coaxial connector: a precision 50 Ω connector widely used in RF instrumentation to maintain characteristic impedance through the connection point."
          attribution="Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:SMA_connector.jpg"
        />
        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/rg-59-coax.jpg`}
          alt="Cross-section of RG-59 75-ohm coaxial cable showing inner conductor and braided shield"
          caption="RG-59 coaxial cable (75 Ω): used for television and video. Compare its dimensions to a 50 Ω cable — the different Z₀ comes from the ratio of conductor diameters."
          attribution="FDominec, CC BY-SA 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:RG-59.jpg"
        />
      </div>

      <CollapsibleSection title="General case: lossy line" variant="inline">
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            When the line has series resistance <MathWrapper formula="R'" /> and shunt
            conductance <MathWrapper formula="G'" /> per unit length, the characteristic
            impedance becomes complex and frequency-dependent:
          </p>
          <MathWrapper block formula="Z_0 = \sqrt{\frac{R' + j\omega L'}{G' + j\omega C'}}" />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            At high frequencies where <MathWrapper formula="\omega L' \gg R'" /> and{' '}
            <MathWrapper formula="\omega C' \gg G'" />, the lossy formula reduces to the
            lossless case above.
          </p>
        </div>
      </CollapsibleSection>
    </section>
  );

  /* ================================================================
     Reflections & Standing Waves (lab)
     ================================================================ */
  const reflectionsTheory = (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Reflections &amp; Standing Waves
      </h2>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        When a wave travelling along a line of impedance{' '}
        <MathWrapper formula="Z_0" /> encounters a load{' '}
        <MathWrapper formula="Z_L" />, part of the wave is reflected. The voltage
        reflection coefficient is:
      </p>

      <MathWrapper block formula="\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0}" />

      <div className="space-y-3">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>Open circuit</strong> (<MathWrapper formula="Z_L = \infty" />
            ): <MathWrapper formula="\Gamma = +1" />. The reflected wave has the same
            amplitude and sign as the incident wave. Voltage doubles at the open end; current
            is zero.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>Short circuit</strong> (<MathWrapper formula="Z_L = 0" />
            ): <MathWrapper formula="\Gamma = -1" />. The reflected wave inverts. Voltage
            is zero at the short; current doubles.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>Matched load</strong> (<MathWrapper formula="Z_L = Z_0" />
            ): <MathWrapper formula="\Gamma = 0" />. No reflection at all. All power is
            delivered to the load. This is the ideal condition in most RF systems.
          </p>
        </div>
      </div>

      <FigureImage
        src={`${import.meta.env.BASE_URL}figures/standing-wave-forward-reflected.gif`}
        alt="Animation of a forward wave and its reflection forming a standing wave"
        caption="A forward wave and its reflection superposing into a standing-wave pattern (here SWR = 9): the nodes and antinodes stay fixed in space."
        attribution="Pyrometer, Public Domain — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Standing_wave_SWR_9_(forward,_reflected).gif"
      />

      <ConceptCheck
        onComplete={onConcept}
        onHint={onHint}
        data={{
          mode: 'multiple-choice',
          question: 'What Γ and VSWR indicate a perfectly matched load?',
          options: [
            { text: 'Γ = 0, VSWR = 1', correct: true, explanation: 'Correct. When Z_L = Z₀, the reflection coefficient is zero and the standing wave ratio is 1 (no standing wave). All power is delivered to the load.' },
            { text: 'Γ = 1, VSWR = ∞', correct: false, explanation: 'These values correspond to a total reflection (open or short circuit), the opposite of a match.' },
            { text: 'Γ = 0.5, VSWR = 3', correct: false, explanation: 'A non-zero Γ means there are reflections. A perfect match requires Γ = 0.' },
          ],
          hints: ['A "matched" load means Z_L = Z₀. Substitute into the Γ formula.'],
        }}
      />

      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
          Does this make sense?
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          For a short circuit, <MathWrapper formula="\Gamma = -1" />. The voltage at
          the load is zero. Is that consistent with what a short circuit means?
        </p>
      </div>
      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
          Does this make sense?
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          A 50 &Omega; coaxial cable has <MathWrapper formula="Z_0 = 50\,\Omega" />{' '}
          regardless of its length. Why does length not appear in the{' '}
          <MathWrapper formula="Z_0" /> formula?
        </p>
      </div>
    </section>
  );

  const reflectionsBench = (
    <LabStation
      title="Reflections & Standing Waves"
      objective="Sweep the load impedance through matched, mismatched, open, and short conditions and watch the incident, reflected, and total waves respond in real time."
    >
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Predict first, then run the lab. Commit your prediction to reveal the simulation &mdash;
        it sharpens what you notice once it appears.
      </p>
      <PredictionGate
        initialPassed={!!unlocked.refl}
        onPassed={() => unlock('refl')}
        onPredict={onPredict}
        question="The load impedance equals Z₀. What do you expect the reflected wave to look like?"
        options={[
          { id: 'same-amplitude', label: 'Same amplitude' },
          { id: 'half-amplitude', label: 'Half amplitude' },
          { id: 'no-reflection', label: 'No reflection' },
          { id: 'double-amplitude', label: 'Double amplitude' },
        ]}
        getCorrectAnswer={() => 'no-reflection'}
        explanation={
          <span>
            When <MathWrapper formula="Z_L = Z_0" />, the reflection coefficient{' '}
            <MathWrapper formula="\Gamma = 0" />. All power is absorbed by the matched
            load &mdash; no reflection.
          </span>
        }
      >
        <TransmissionLineSim />
      </PredictionGate>
    </LabStation>
  );

  /* ================================================================
     The Smith Chart (lab)
     ================================================================ */
  const smithTheory = (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        The Smith Chart
      </h2>

      <FigureImage
        src={`${import.meta.env.BASE_URL}figures/vector-network-analyzer.jpg`}
        alt="Agilent vector network analyzer displaying S-parameter measurements on a Smith chart"
        caption="A Vector Network Analyzer (VNA) measuring impedance and displaying results on a Smith chart. This is the primary instrument for characterizing transmission line and antenna impedance in the lab."
        attribution="Rohde &amp; Schwarz GmbH &amp; Co. KG, CC BY 3.0 — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Netzwerkanalysator_ZVA40_RSD.jpg"
        className="sm:max-w-md"
      />

      <p className="text-sm text-slate-600 dark:text-slate-400">
        The Smith chart is a graphical tool that maps every possible complex impedance onto a circle.
        The center represents a matched load (&Gamma; = 0), the left edge is a short circuit (&Gamma; = &minus;1),
        and the right edge is an open circuit (&Gamma; = +1). Constant-resistance circles and constant-reactance
        arcs form the grid. Click anywhere on the chart to place an impedance point.
      </p>

      <CollapsibleSection title="Matching Network Design" variant="inline">
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            When <MathWrapper formula="Z_L \neq Z_0" />, a matching network can be inserted to
            eliminate reflections. On the Smith chart, matching means transforming the load
            impedance to the center of the chart (<MathWrapper formula="\Gamma = 0" />).
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Common techniques include <strong>quarter-wave transformers</strong> (a{' '}
            <MathWrapper formula="\lambda/4" /> section with{' '}
            <MathWrapper formula="Z_T = \sqrt{Z_0 Z_L}" />) and <strong>stub matching</strong>{' '}
            (adding a short- or open-circuited transmission line stub at the right point to cancel
            the reactive part of the impedance).
          </p>
        </div>
      </CollapsibleSection>

      <ConceptCheck
        onComplete={onConcept}
        onHint={onHint}
        data={{
          mode: 'multiple-choice',
          question: 'On the Smith chart, where is the short circuit located?',
          options: [
            { text: 'At the leftmost point (Γ = −1)', correct: true, explanation: 'Correct. A short circuit has Z_L = 0, giving Γ = (0 − Z₀)/(0 + Z₀) = −1. This maps to the far left of the Smith chart on the real axis.' },
            { text: 'At the center (Γ = 0)', correct: false, explanation: 'The center is the matched point (Z_L = Z₀). A short circuit is at the edge of the chart.' },
            { text: 'At the rightmost point (Γ = +1)', correct: false, explanation: 'The rightmost point is the open circuit (Z_L = ∞, Γ = +1). The short circuit is at the opposite side.' },
          ],
          hints: ['Calculate Γ for Z_L = 0 and find where that maps on the chart.'],
        }}
      />

      <YourTurnPanel
        scenario="Given Z_L = 75 + j50 Ω and Z₀ = 50 Ω, calculate the reflection coefficient and VSWR, then locate the point on the Smith chart above."
        question="What is the VSWR for this load?"
        options={[
          { text: 'VSWR ≈ 2.0', correct: false, explanation: 'Close, but not quite. Calculate |Γ| first from the complex Z_L and Z₀.' },
          { text: 'VSWR ≈ 2.4', correct: true, explanation: 'Correct! Γ = (75 + j50 − 50)/(75 + j50 + 50) = (25 + j50)/(125 + j50). |Γ| = 55.9/134.6 ≈ 0.415, so VSWR = (1 + 0.415)/(1 − 0.415) ≈ 2.42.' },
          { text: 'VSWR ≈ 1.5', correct: false, explanation: 'That would correspond to |Γ| ≈ 0.2. The reactive component j50 Ω increases the mismatch significantly.' },
        ]}
        correctReveal={
          <div className="space-y-2">
            <MathWrapper formula="\Gamma = \frac{75 + j50 - 50}{75 + j50 + 50} = \frac{25 + j50}{125 + j50}" block />
            <MathWrapper formula="|\Gamma| = \frac{\sqrt{25^2 + 50^2}}{\sqrt{125^2 + 50^2}} = \frac{55.9}{134.6} \approx 0.415" block />
            <MathWrapper formula="\text{VSWR} = \frac{1 + 0.415}{1 - 0.415} \approx 2.42" block />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Try clicking on the Smith chart at the normalized impedance z = 1.5 + j1.0 to verify.
            </p>
          </div>
        }
        hints={['Normalize: z_L = Z_L/Z₀ = 1.5 + j1.0. Then Γ = (z_L − 1)/(z_L + 1).']}
      />
    </section>
  );

  const smithBench = (
    <LabStation
      id="smith-chart"
      title="The Smith Chart"
      objective="Place any complex load on the chart and read off Γ, VSWR, and the normalized impedance — the working tool of every RF bench."
    >
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Predict where the extreme case lands, then commit to reveal the interactive chart.
      </p>
      <PredictionGate
        initialPassed={!!unlocked.smith}
        onPassed={() => unlock('smith')}
        onPredict={onPredict}
        question="A short circuit has Zₗ = 0. Where will it sit on the Smith chart?"
        options={[
          { id: 'center', label: 'At the centre (Γ = 0)' },
          { id: 'left', label: 'Far-left point (Γ = −1)' },
          { id: 'right', label: 'Far-right point (Γ = +1)' },
          { id: 'top', label: 'On the top edge' },
        ]}
        getCorrectAnswer={() => 'left'}
        explanation={
          <span>
            A short circuit has <MathWrapper formula="Z_L = 0" />, so{' '}
            <MathWrapper formula="\Gamma = \frac{0 - Z_0}{0 + Z_0} = -1" /> &mdash; the
            far-left point of the chart on the real axis.
          </span>
        }
      >
        <SmithChartSim />
      </PredictionGate>
    </LabStation>
  );

  /* ================================================================
     Inverse problem: standing-wave quiz (lab)
     ================================================================ */
  const inverseTheory = (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Inverse Problem: Identifying Terminations
      </h2>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        In practice, engineers often measure the standing wave pattern on a line and work
        backwards to determine the load. Given each voltage envelope in the lab, identify the
        termination condition.
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Voltage Standing Wave Ratio (VSWR)
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The VSWR quantifies how much the voltage varies along the line:
        </p>
        <MathWrapper block formula="\text{VSWR} = \frac{1 + |\Gamma|}{1 - |\Gamma|}" />
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          A matched load gives VSWR = 1 (no standing wave). An open or short circuit gives
          VSWR = {'∞'}.
        </p>
      </div>

      <ConceptCheck
        onComplete={onConcept}
        onHint={onHint}
        data={{
          mode: 'multiple-choice',
          question: 'If VSWR = 3, what is |Γ|?',
          options: [
            { text: '|Γ| = 0.5', correct: true, explanation: 'Correct. Rearranging: |Γ| = (VSWR − 1)/(VSWR + 1) = (3 − 1)/(3 + 1) = 0.5.' },
            { text: '|Γ| = 0.33', correct: false, explanation: 'That would be |Γ| = 1/VSWR. The correct formula is |Γ| = (VSWR − 1)/(VSWR + 1).' },
            { text: '|Γ| = 3', correct: false, explanation: '|Γ| must be between 0 and 1 for a passive load. VSWR = 3 corresponds to |Γ| = 0.5.' },
          ],
          hints: ['Rearrange the VSWR formula to solve for |Γ|: multiply both sides by (1 − |Γ|).'],
        }}
      />
    </section>
  );

  const inverseBench = (
    <LabStation
      title="Inverse Problem: Identifying Terminations"
      objective="Work backwards like a bench engineer: read a measured standing-wave envelope and deduce the load that produced it."
    >
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Predict what a deeply-nulled envelope means, then commit to open the identification quiz.
      </p>
      <PredictionGate
        initialPassed={!!unlocked.inverse}
        onPassed={() => unlock('inverse')}
        onPredict={onPredict}
        question="A measured envelope has deep nulls that drop almost to zero (VSWR ≈ ∞). What load produced it?"
        options={[
          { id: 'matched', label: 'A matched load (Z₀)' },
          { id: 'slight', label: 'A slight mismatch' },
          { id: 'openshort', label: 'An open or short circuit' },
          { id: 'resistive', label: 'A pure 75 Ω resistor' },
        ]}
        getCorrectAnswer={() => 'openshort'}
        explanation={
          <span>
            Deep nulls reaching zero mean total reflection (<MathWrapper formula="|\Gamma| = 1" />,
            VSWR &rarr; &infin;). All the energy comes back &mdash; that is an open or short circuit.
          </span>
        }
      >
        <StandingWaveQuiz />
      </PredictionGate>
    </LabStation>
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <span className="font-mono text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('transmission-lines')}
          </span>
          Transmission Lines
        </h1>
      </div>

      <SectionHook text="Every high-speed digital bus, every RF cable, and every PCB trace longer than a few centimetres behaves as a transmission line. Understanding impedance matching and reflections is the difference between a clean signal and a corrupted one." />

      <Tabs
        tabs={[
          {
            label: 'Impedance',
            content: impedanceTheory,
          },
          {
            label: 'Reflections',
            icon: flaskIcon,
            content: <LabLayout benchId="lab-reflections" jumpLabel="Jump to lab" theory={reflectionsTheory} bench={reflectionsBench} />,
          },
          {
            label: 'Smith Chart',
            icon: flaskIcon,
            content: <LabLayout benchId="lab-smith" jumpLabel="Jump to lab" theory={smithTheory} bench={smithBench} />,
          },
          {
            label: 'Inverse',
            icon: flaskIcon,
            content: <LabLayout benchId="lab-inverse" jumpLabel="Jump to lab" theory={inverseTheory} bench={inverseBench} />,
          },
        ]}
      />

      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation currentSectionId="transmission-lines" />
    </div>
  );
}
