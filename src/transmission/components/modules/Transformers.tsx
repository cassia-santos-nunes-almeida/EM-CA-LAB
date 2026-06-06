import { useEffect } from 'react';
import { ArrowRight, BookOpen, Activity, GraduationCap } from 'lucide-react';
import { getSectionNumber } from '@shared/constants/curriculum';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { TabSet } from '@transmission/components/common/TabSet';
import { useProgressStore } from '@shared/store/progressStore';
import { CoupledCoilsSim } from '@transmission/components/simulations/CoupledCoilsSim';

/**
 * Section 3.4 page component: Transformers.
 *
 * Covers coupling coefficient, dot convention, ideal transformer analysis,
 * and an interactive coupled-coils simulation.
 */
const CHALLENGE = {
  title: `Engineer a Transformer: Coupling, Turns Ratio, and Reflected Impedance`,
  description: `In the Simulations tab, the CoupledCoilsSim lets you manipulate the coupling coefficient, both turns counts, and the load impedance while watching mutual inductance, ideal vs. actual secondary voltage, secondary current, and reflected impedance update live. This guided exploration walks through the three core transformer relationships (voltage ratio, current ratio, reflected impedance) and the practical effect of imperfect coupling (flux leakage), connecting the live readouts back to the ideal-transformer equations from the Theory tab.`,
  instructions: [
    `Set Primary turns N1 and Secondary turns N2 equal (for example both at 50), then drag the Coupling coefficient k slider from 0 up to 1 and watch the canvas: note that the two coils move closer together, the magnetic field lines and flux dots intensify, and the iron-core line appears once k passes 0.8.`,
    `With k still near 1, compare the 'V2 (ideal, k=1)' and 'V2 (actual)' readout cards: confirm they agree closely at high k, then slide k down below 0.9 and observe the amber flux-leakage warning appear and 'V2 (actual)' fall while 'V2 (ideal)' stays fixed, demonstrating that actual V2 is approximately k times the ideal value.`,
    `Set k back to 1 and fix N1 at 50, then double the Secondary turns N2 from 50 to 100 and read 'V2 (actual)': verify it doubles, matching the voltage ratio V2/V1 = N2/N1 from the Theory tab.`,
    `Keep N2 = 100 and N1 = 50 and read 'Secondary current I2': note that as N2 exceeded N1 the secondary current is smaller than the primary current, consistent with the current ratio I2/I1 = N1/N2 and the fact that power in equals power out.`,
    `Set N1 = 50, N2 = 50, and ZL = 200 Ω and read 'Reflected impedance Z_ref' (200 Ω, since the turns ratio is 1:1); now double N1 to 100 and watch Z_ref jump to roughly 800 Ω — a 4× increase confirming Z_ref scales with the square of the turns ratio (N1/N2)² times ZL.`,
    `Conclude in your own words how coupling coefficient k governs flux leakage and the gap between ideal and actual V2, while the turns ratio N1/N2 sets voltage linearly, current inversely, and reflected impedance by its square.`,
  ],
  hint: `Watch the readout cards change as you move one slider at a time, and remember V2/V1 = N2/N1, I2/I1 = N1/N2, and Z_ref = (N1/N2)² × ZL.`,
};

export function Transformers() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('transformers'); }, [markVisited]);

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('transformers')}
          </span>
          Transformers &amp; Coupled Coils
        </h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
          Before we study waves on transmission lines, we need to understand what happens when
          two inductors share magnetic flux. That relationship — mutual inductance — is the
          foundation of every transformer and, ultimately, of distributed-parameter models.
        </p>
      </div>

      <SectionHook text="Every phone charger, laptop adapter, and power substation depends on transformers. Understanding how energy couples magnetically from one coil to another is the first step toward understanding how signals propagate along transmission lines." />

      <TabSet tabs={[
        {
          label: 'Theory',
          icon: <BookOpen className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
      {/* Real-world transformer images */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/iron-core-transformer.png`}
          alt="Cutaway diagram of an iron-core power transformer showing primary and secondary windings around a laminated core"
          caption="Iron-core power transformer: primary (red) and secondary (blue) windings share nearly all magnetic flux through the core, achieving k ≈ 0.95–0.99."
          attribution="BillC, CC BY-SA 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Transformer3d_col3.svg"
        />
        <FigureImage
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Transformer_au_poste_%C3%A9lectrique_de_Bondy.jpg/500px-Transformer_au_poste_%C3%A9lectrique_de_Bondy.jpg"
          alt="Large power transformer at an electrical substation with high-voltage bushings"
          caption="A utility-scale power transformer at an electrical substation. These transformers step voltage up or down for efficient long-distance power transmission."
          attribution="Lionel Allorge, CC BY-SA 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Transformer_au_poste_%C3%A9lectrique_de_Bondy.jpg"
        />
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* Coupling Coefficient & Dot Convention                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Coupling Coefficient &amp; Dot Convention
        </h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Imagine holding two coils side by side. When current flows through the first coil, it
          creates a magnetic field. Some of those field lines pass through the second coil —
          and by Faraday's law (Module 1), that changing flux induces a voltage. Move the coils
          closer together, and more flux links — the induced voltage increases. Pull them apart,
          and it decreases. Wrap them on the same iron core, and nearly all the flux links.
        </p>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The <strong>coupling coefficient</strong> <MathWrapper formula="k" /> quantifies
          what fraction of one coil's flux links the other:
        </p>

        <MathWrapper
          formula="k = \frac{M}{\sqrt{L_1 L_2}}, \qquad 0 \le k \le 1"
          block
        />

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <MathWrapper formula="k = 0" /> means no shared flux (completely decoupled);{' '}
          <MathWrapper formula="k = 1" /> means every flux line produced by one coil passes
          through the other (perfect coupling). In practice, iron-core power transformers
          achieve <MathWrapper formula="k \approx 0.95{-}0.99" />, while air-core RF
          transformers may have <MathWrapper formula="k \approx 0.1{-}0.5" />.
        </p>

        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/toroidal-inductor.jpg`}
          alt="Toroidal air-core inductor coil used in RF circuits"
          caption="An air-core toroidal coil typical of RF applications. Without a ferromagnetic core, coupling between adjacent coils is much lower (k ≈ 0.1–0.5)."
          attribution="Eliashossain01, CC BY-SA 4.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Toroidal_inductor.jpg"
          className="sm:max-w-sm"
        />

        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-6">
          Dot Convention
        </h3>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The <strong>dot convention</strong> tells us the relative polarity of the mutual
          voltage. If current enters the dotted terminal of one coil, the mutual voltage is
          positive at the dotted terminal of the other coil (aiding flux). If current enters
          the undotted terminal, the mutual voltage polarity reverses (opposing flux).
        </p>

        <div className="grid gap-6 sm:grid-cols-2 mt-4">
          {/* Aiding flux diagram */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-3">
              Aiding Flux (Same Dot Terminals)
            </p>
            <svg viewBox="0 0 260 120" className="w-full h-auto" aria-label="Aiding flux dot convention diagram">
              {/* Primary coil */}
              <rect x="20" y="30" width="60" height="60" rx="4" fill="none" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="1.5" />
              <text x="50" y="65" textAnchor="middle" className="text-slate-700 dark:text-slate-300 fill-current" fontSize="12" fontFamily="ui-sans-serif, system-ui">L&#x2081;</text>
              {/* Primary dot */}
              <circle cx="30" cy="30" r="4" className="fill-amber-500" />
              {/* Current arrow into dot */}
              <line x1="30" y1="10" x2="30" y2="26" stroke="currentColor" className="text-engineering-blue-600 dark:text-engineering-blue-400" strokeWidth="2" markerEnd="url(#arrowAid)" />
              <text x="38" y="18" className="text-engineering-blue-600 dark:text-engineering-blue-400 fill-current" fontSize="10" fontFamily="ui-sans-serif, system-ui">i&#x2081;</text>

              {/* Secondary coil */}
              <rect x="160" y="30" width="60" height="60" rx="4" fill="none" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="1.5" />
              <text x="190" y="65" textAnchor="middle" className="text-slate-700 dark:text-slate-300 fill-current" fontSize="12" fontFamily="ui-sans-serif, system-ui">L&#x2082;</text>
              {/* Secondary dot */}
              <circle cx="170" cy="30" r="4" className="fill-amber-500" />
              {/* Positive voltage marker */}
              <text x="170" y="18" className="text-green-600 dark:text-green-400 fill-current" fontSize="11" fontWeight="bold" fontFamily="ui-sans-serif, system-ui">+</text>
              <text x="170" y="104" className="text-green-600 dark:text-green-400 fill-current" fontSize="11" fontWeight="bold" fontFamily="ui-sans-serif, system-ui">&minus;</text>

              {/* Mutual coupling lines */}
              <path d="M85 45 Q120 35 155 45" fill="none" stroke="currentColor" className="text-amber-500" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M85 75 Q120 85 155 75" fill="none" stroke="currentColor" className="text-amber-500" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="120" y="62" textAnchor="middle" className="text-amber-600 dark:text-amber-400 fill-current" fontSize="10" fontFamily="ui-sans-serif, system-ui">M</text>

              <defs>
                <marker id="arrowAid" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" className="fill-engineering-blue-600 dark:fill-engineering-blue-400" />
                </marker>
              </defs>
            </svg>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Current enters the dotted terminal of L&#x2081;. The induced voltage is positive at the
              dotted terminal of L&#x2082;.
            </p>
          </div>

          {/* Opposing flux diagram */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">
              Opposing Flux (Opposite Terminals)
            </p>
            <svg viewBox="0 0 260 120" className="w-full h-auto" aria-label="Opposing flux dot convention diagram">
              {/* Primary coil */}
              <rect x="20" y="30" width="60" height="60" rx="4" fill="none" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="1.5" />
              <text x="50" y="65" textAnchor="middle" className="text-slate-700 dark:text-slate-300 fill-current" fontSize="12" fontFamily="ui-sans-serif, system-ui">L&#x2081;</text>
              {/* Primary dot at top */}
              <circle cx="30" cy="30" r="4" className="fill-amber-500" />
              {/* Current arrow into undotted terminal (bottom) */}
              <line x1="30" y1="110" x2="30" y2="94" stroke="currentColor" className="text-engineering-blue-600 dark:text-engineering-blue-400" strokeWidth="2" markerEnd="url(#arrowOpp)" />
              <text x="38" y="108" className="text-engineering-blue-600 dark:text-engineering-blue-400 fill-current" fontSize="10" fontFamily="ui-sans-serif, system-ui">i&#x2081;</text>

              {/* Secondary coil */}
              <rect x="160" y="30" width="60" height="60" rx="4" fill="none" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="1.5" />
              <text x="190" y="65" textAnchor="middle" className="text-slate-700 dark:text-slate-300 fill-current" fontSize="12" fontFamily="ui-sans-serif, system-ui">L&#x2082;</text>
              {/* Secondary dot at top */}
              <circle cx="170" cy="30" r="4" className="fill-amber-500" />
              {/* Negative voltage at dot (opposing) */}
              <text x="170" y="18" className="text-amber-600 dark:text-amber-400 fill-current" fontSize="11" fontWeight="bold" fontFamily="ui-sans-serif, system-ui">&minus;</text>
              <text x="170" y="104" className="text-amber-600 dark:text-amber-400 fill-current" fontSize="11" fontWeight="bold" fontFamily="ui-sans-serif, system-ui">+</text>

              {/* Mutual coupling lines (crossed) */}
              <path d="M85 45 Q120 55 155 45" fill="none" stroke="currentColor" className="text-red-400 dark:text-red-500" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M85 75 Q120 65 155 75" fill="none" stroke="currentColor" className="text-red-400 dark:text-red-500" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="120" y="62" textAnchor="middle" className="text-red-500 dark:text-red-400 fill-current" fontSize="10" fontFamily="ui-sans-serif, system-ui">&minus;M</text>

              <defs>
                <marker id="arrowOpp" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" className="fill-engineering-blue-600 dark:fill-engineering-blue-400" />
                </marker>
              </defs>
            </svg>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Current enters the <em>undotted</em> terminal of L&#x2081;. The induced voltage is
              negative at the dotted terminal of L&#x2082; (flux opposes).
            </p>
          </div>
        </div>

        <ConceptCheck
          onComplete={() => incrementConceptChecks('transformers')}
          onHint={() => incrementHints('transformers')}
          data={{
            mode: 'multiple-choice',
            question: 'Current enters the undotted terminal of the primary coil. What is the polarity of the induced voltage at the dotted terminal of the secondary?',
            options: [
              { text: 'Positive (aiding flux)', correct: false, explanation: 'Aiding flux occurs when current enters the dotted terminal. Here it enters the undotted terminal, so the flux opposes.' },
              { text: 'Negative (opposing flux)', correct: true, explanation: 'Correct. When current enters the undotted terminal, the mutual flux opposes, making the voltage negative at the secondary dot.' },
              { text: 'Zero — polarity depends only on k', correct: false, explanation: 'The coupling coefficient k determines the magnitude of mutual inductance, but the dot convention determines the sign.' },
            ],
            hints: [
              'Look at the opposing flux diagram above. Which terminal does the current enter?',
              'The dot convention rule: current into a dot creates positive voltage at the other dot. What happens when current enters the opposite terminal?',
            ],
          }}
        />
      </section>


      {/* ────────────────────────────────────────────────────────── */}
      {/* Ideal Transformer                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Ideal Transformer
        </h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          An <strong>ideal transformer</strong> has perfect coupling (
          <MathWrapper formula="k = 1" />
          ), zero winding resistance, and infinite core permeability. Three key relationships
          follow directly from Faraday's law and energy conservation:
        </p>

        {/* Voltage ratio */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Voltage Ratio
          </p>
          <MathWrapper
            formula="\frac{V_2}{V_1} = \frac{N_2}{N_1}"
            block
          />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The secondary voltage scales linearly with the turns ratio.
          </p>
        </div>

        {/* Current ratio */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Current Ratio
          </p>
          <MathWrapper
            formula="\frac{I_2}{I_1} = \frac{N_1}{N_2}"
            block
          />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Current scales inversely — power in equals power out.
          </p>
        </div>

        {/* Reflected impedance */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Reflected Impedance
          </p>
          <MathWrapper
            formula="Z_{\text{reflected}} = \left(\frac{N_1}{N_2}\right)^2 Z_L"
            block
          />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The load impedance "seen" by the source is scaled by the square of the turns ratio.
          </p>
        </div>

        <ConceptCheck
          onComplete={() => incrementConceptChecks('transformers')}
          onHint={() => incrementHints('transformers')}
          data={{
            mode: 'multiple-choice',
            question: 'An ideal transformer steps the voltage up by a factor of 2 (N₂/N₁ = 2). What happens to the maximum available secondary current relative to the primary?',
            options: [
              { text: 'It is halved (I₂/I₁ = N₁/N₂ = ½)', correct: true, explanation: 'Correct. An ideal transformer conserves power, so V₁I₁ = V₂I₂. Doubling the voltage forces the current to halve: I₂/I₁ = N₁/N₂ = ½.' },
              { text: 'It also doubles', correct: false, explanation: 'That would double the output power for free. An ideal transformer conserves power (V₁I₁ = V₂I₂), so stepping the voltage up steps the current down.' },
              { text: 'It stays the same', correct: false, explanation: 'Current scales inversely with the turns ratio, I₂/I₁ = N₁/N₂, so it cannot stay constant while the voltage changes if power is conserved.' },
            ],
            hints: [
              'An ideal transformer conserves power: V₁I₁ = V₂I₂.',
              'The current ratio is the inverse of the voltage (turns) ratio: I₂/I₁ = N₁/N₂.',
            ],
          }}
        />

        {/* Worked example */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 space-y-3 mt-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-engineering-blue-500" />
            Worked Example
          </h3>

          <p className="text-sm text-slate-700 dark:text-slate-300">
            A transformer has <MathWrapper formula="N_1 = 100" /> turns,{' '}
            <MathWrapper formula="N_2 = 50" /> turns, and a load{' '}
            <MathWrapper formula="Z_L = 200\,\Omega" />. The source voltage is{' '}
            <MathWrapper formula="V_1 = 120\,\text{V}" />.
          </p>

          <div className="space-y-2 pl-4 border-l-2 border-engineering-blue-300 dark:border-engineering-blue-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 1: Turns ratio
            </p>
            <MathWrapper
              formula="\frac{N_1}{N_2} = \frac{100}{50} = 2"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 2: Secondary voltage
            </p>
            <MathWrapper
              formula="V_2 = V_1 \cdot \frac{N_2}{N_1} = 120 \cdot \frac{50}{100} = 60\,\text{V}"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 3: Reflected impedance
            </p>
            <MathWrapper
              formula="Z_{\text{reflected}} = \left(\frac{N_1}{N_2}\right)^2 Z_L = (2)^2 \times 200 = 800\,\Omega"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 4: Primary current
            </p>
            <MathWrapper
              formula="I_1 = \frac{V_1}{Z_{\text{reflected}}} = \frac{120}{800} = 0.15\,\text{A}"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 5: Secondary current
            </p>
            <MathWrapper
              formula="I_2 = I_1 \cdot \frac{N_1}{N_2} = 0.15 \times 2 = 0.30\,\text{A}"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Verify: Power balance
            </p>
            <MathWrapper
              formula="P_1 = V_1 I_1 = 120 \times 0.15 = 18\,\text{W} = V_2 I_2 = 60 \times 0.30 = 18\,\text{W} \;\checkmark"
              block
            />
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* Coupled Coils Simulation                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Coupled Coils Simulation
        </h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Use the simulation below to explore how the coupling coefficient, turns counts, and
          load impedance affect transformer behavior. Before you start, make a prediction:
        </p>

        <PredictionGate
          question="If k = 0.9 and you double N\u2082 while keeping N\u2081 fixed, what happens to the secondary voltage?"
          options={[
            { id: 'doubles', label: 'Doubles' },
            { id: 'halves', label: 'Halves' },
            { id: 'same', label: 'Stays the same' },
            { id: 'quadruples', label: 'Quadruples' },
          ]}
          getCorrectAnswer={() => 'doubles'}
          onPredict={(correct) => markPredictionGate('transformers', correct)}
          explanation={
            <p>
              The voltage ratio is{' '}
              <MathWrapper formula="V_2 / V_1 = N_2 / N_1" />. Doubling{' '}
              <MathWrapper formula="N_2" /> doubles the ratio, so{' '}
              <MathWrapper formula="V_2" /> doubles.
            </p>
          }
        >
          <CoupledCoilsSim className="mt-4" />
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* Your Turn                                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      <YourTurnPanel
        scenario="Given N\u2081 = 100, N\u2082 = 50, Z_L = 200\u03A9. You found Z_reflected = (100/50)\u00B2 \u00D7 200 = 800\u03A9. Now change the turns ratio to N\u2081 = 200, N\u2082 = 50."
        question="How does Z_reflected change?"
        options={[
          {
            text: 'Quadruples',
            correct: true,
            explanation:
              'Z_reflected = (N\u2081/N\u2082)\u00B2 \u00D7 Z_L. The turns ratio doubled from 2:1 to 4:1, so (4)\u00B2 = 16 vs (2)\u00B2 = 4. Z_reflected quadruples to 3200\u03A9.',
          },
          {
            text: 'Doubles',
            correct: false,
            explanation:
              'The reflected impedance depends on the square of the turns ratio, not linearly.',
          },
          {
            text: 'Stays the same',
            correct: false,
            explanation:
              'Z_reflected depends on the turns ratio, which changed from 2:1 to 4:1.',
          },
          {
            text: 'Halves',
            correct: false,
            explanation:
              'The turns ratio increased, so Z_reflected increases (not decreases).',
          },
        ]}
        correctReveal={
          <div className="space-y-1">
            <MathWrapper
              formula="Z_{\text{reflected}} = \left(\frac{200}{50}\right)^2 \times 200 = 16 \times 200 = 3200\,\Omega"
              block
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Compared to the original 800 &Omega;, the reflected impedance quadrupled.
            </p>
          </div>
        }
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* Bridge Callout                                            */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-engineering-blue-50 to-indigo-50 dark:from-engineering-blue-900/20 dark:to-indigo-900/20 border border-engineering-blue-200 dark:border-engineering-blue-800 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <ArrowRight className="w-5 h-5 text-engineering-blue-600 dark:text-engineering-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
              Looking Ahead
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              A transformer is two coupled inductors analyzed with Kirchhoff's laws. In the next
              section, we'll apply the same Kirchhoff's laws to an infinitesimal segment of a
              conductor pair — with distributed self-inductance and self-capacitance along its
              length — and the wave equation will appear. That's the transmission line.
            </p>
          </div>
        </div>
      </div>

            </div>
          ),
        },
      ]} />


      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation currentSectionId="transformers" />
    </div>
  );
}
