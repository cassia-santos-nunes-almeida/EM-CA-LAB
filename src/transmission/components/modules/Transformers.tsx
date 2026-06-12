import { useEffect, useState } from 'react';
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
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { Tabs } from '@shared/components/common/Tabs';
import { useProgressStore } from '@shared/store/progressStore';
import { CoupledCoilsSim } from '@transmission/components/simulations/CoupledCoilsSim';

/**
 * Transformers section page component.
 *
 * Covers coupling coefficient, dot convention, ideal transformer analysis,
 * and an interactive coupled-coils simulation.
 */
const CHALLENGE = {
  title: `Engineer a Transformer: Coupling, Turns Ratio, and Reflected Impedance`,
  description: `In the Simulations tab, the CoupledCoilsSim lets you manipulate the coupling coefficient, both turns counts, and the load impedance while watching mutual inductance, ideal vs. actual secondary voltage, secondary current, and reflected impedance update live. This guided exploration walks through the three core transformer relationships (voltage ratio, current ratio, reflected impedance) and the practical effect of imperfect coupling (flux leakage), connecting the live readouts back to the ideal-transformer equations from the Theory tab.`,
  instructions: [
    `Set Primary turns N1 and Secondary turns N2 equal (for example both at 50), then drag the Coupling coefficient k slider from 0 up to 1 and watch the canvas: note that the two coils move closer together, the magnetic field lines and flux dots intensify, and the iron-core line appears once k passes 0.8.`,
    `With N1 = N2 = 50, set k = 0.50 and read the 'Mutual inductance M' card: confirm M = k × √(L1L2) = 0.50 × √(10 mH × 10 mH) = 5.00 mH — the coupling definition from the Theory tab rearranged. Slide k to 1.00 and watch M rise to its energy-allowed ceiling √(L1L2) = 10 mH, the k = 1 limit the Theory tab proves can never be exceeded.`,
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

  // Lifted above the Tabs: switching tabs remounts the panel, so each gate's
  // unlocked state must live here for a within-visit unlock to survive.
  const [simUnlocked, setSimUnlocked] = useState(false);
  const [flybackUnlocked, setFlybackUnlocked] = useState(false);

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
          two inductors share magnetic flux. That relationship — mutual inductance —{' '}
          <em>defined and measured below</em> — is the foundation of every transformer and,
          ultimately, of distributed-parameter models.
        </p>
      </div>

      <SectionHook text="Every phone charger, laptop adapter, and power substation depends on transformers. Understanding how energy couples magnetically from one coil to another is the first step toward understanding how signals propagate along transmission lines." />

      <Tabs tabs={[
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
          src={`${import.meta.env.BASE_URL}figures/power-transformer.jpg`}
          alt="Large power transformer at an electrical substation with high-voltage bushings"
          caption="A utility-scale power transformer at an electrical substation. These transformers step voltage up or down for efficient long-distance power transmission."
          attribution="Bidgee, CC BY 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Pole_mounted_Transformer.jpg"
        />
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* What is mutual inductance?                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          What is mutual inductance?
        </h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          So far the course has <em>used</em> M — the sim below reads it out in millihenries,
          and the coupling coefficient is about to be defined as a ratio involving it. Time to
          pay the debt: M is not an abstract knob. It is a number you can compute from geometry
          and measure at the terminals with nothing but a ramp generator and a voltmeter.
        </p>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Recall from the Faraday's Law section ({getSectionNumber('faraday')}) that a coil's
          self-inductance is flux linkage per ampere, <MathWrapper formula="L = N\Phi/i" />.
          Now send current <MathWrapper formula="i_1" /> through coil 1. Some of its flux,{' '}
          <MathWrapper formula="\Phi_{21}" />, threads each of coil 2's{' '}
          <MathWrapper formula="N_2" /> turns. The <strong>mutual inductance</strong> is coil
          2's flux linkage per ampere of coil 1's current:
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Mutual Inductance — Definition
          </p>
          <MathWrapper
            formula="M = \frac{N_2\,\Phi_{21}}{i_1} \qquad [\text{H} = \text{Wb/A}]"
            block
          />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Coil 2's flux linkage per ampere of coil 1's current — the first definition of M in
            this course.
          </p>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Remarkably, the linkage is reciprocal: the flux coil 2's current links into coil 1
          gives exactly the same number, <MathWrapper formula="M_{12} = M_{21} = M" /> — one M
          per coil <em>pair</em> (we state this; the proof is a Neumann double integral beyond
          this course). Combine the definition with Faraday's law{' '}
          <MathWrapper formula="v_2 = N_2\,d\Phi_{21}/dt" /> and, with coil 2 open (no
          secondary current, no secondary flux):
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            The Transformer's Whole Job in One Line
          </p>
          <MathWrapper formula="v_2 = M\,\frac{di_1}{dt}" block />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The open secondary reports the <em>rate of change</em> of the primary current,
            scaled by M.
          </p>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Read it twice: a <em>steady</em> primary current — however large — induces{' '}
          <strong>nothing</strong>. Only change couples. That is why transformers are AC
          machines, and why interrupting a DC current is so violent (the gate below).
        </p>

        {/* Worked example — coaxial solenoids */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 space-y-3 mt-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-engineering-blue-500" />
            Worked Example — Coaxial Solenoids
          </h3>

          <p className="text-sm text-slate-700 dark:text-slate-300">
            A long solenoid, <MathWrapper formula="N_1 = 500" /> turns wound over{' '}
            <MathWrapper formula="l = 10\,\text{cm}" />, cross-section{' '}
            <MathWrapper formula="A = 2\,\text{cm}^2" />; a second winding of{' '}
            <MathWrapper formula="N_2 = 100" /> turns wound tightly over its{' '}
            <strong>full length</strong> (same core, same cross-section, spread over the same
            10 cm). Drive <MathWrapper formula="i_1 = 2\,\text{A}" />.
          </p>

          <div className="space-y-2 pl-4 border-l-2 border-engineering-blue-300 dark:border-engineering-blue-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 1: Field of coil 1
            </p>
            <MathWrapper
              formula="B_1 = \mu_0 \frac{N_1}{l} i_1 = 4\pi\times10^{-7} \times \frac{500}{0.10} \times 2 = 1.257\times10^{-2}\,\text{T} \approx 12.6\,\text{mT}"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 2: Flux through one turn of coil 2
            </p>
            <MathWrapper
              formula="\Phi_{21} = B_1 A = 1.257\times10^{-2} \times 2\times10^{-4} = 2.51\,\mu\text{Wb}"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 3: Linkage and M
            </p>
            <MathWrapper
              formula="\lambda_2 = N_2\Phi_{21} = 100 \times 2.51\,\mu\text{Wb} = 251\,\mu\text{Wb-turns}"
              block
            />
            <MathWrapper
              formula="M = \frac{\lambda_2}{i_1} = \frac{251\,\mu\text{Wb}}{2\,\text{A}} \approx 126\,\mu\text{H}"
              block
            />

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 4: The current cancels (audit)
            </p>
            <MathWrapper
              formula="M = \frac{N_2 B_1 A}{i_1} = \frac{\mu_0 N_1 N_2 A}{l} = \frac{4\pi\times10^{-7} \times 500 \times 100 \times 2\times10^{-4}}{0.10} = 125.7\,\mu\text{H}"
              block
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              Pure geometry — i₁ has cancelled out. If your M depends on the drive current, you
              computed flux, not flux per ampere.
            </p>

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Step 5: Use it
            </p>
            <MathWrapper
              formula="\frac{di_1}{dt} = 500\,\text{A/s} \;\Rightarrow\; v_2 = M\,\frac{di_1}{dt} = 1.257\times10^{-4} \times 500 = 62.8\,\text{mV}"
              block
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              — on the open secondary, with nothing else connected.
            </p>
          </div>
        </div>

        {/* Plausibility callout */}
        <div className="rounded-lg p-4 border-l-4 border-sky-500 bg-sky-50 dark:bg-sky-900/20">
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide mb-1">
            Does this make sense?
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Order of magnitude: air-core, centimetre-scale, hundreds of turns → tens-to-hundreds
            of μH is the right ballpark for M (the sim's iron-core-flavoured mH values are
            10–100× larger because μᵣ ≫ 1). A henry of mutual inductance in air would need a
            coil the size of a room.
          </p>
        </div>
      </section>

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
          and, as you saw in the Faraday's Law section, that changing flux induces a voltage. Move the coils
          closer together, and more flux links — the induced voltage increases. Pull them apart,
          and it decreases. Wrap them on the same iron core, and nearly all the flux links.
        </p>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Now that M is defined, we can ask how good a given pair is: compare its M to the
          largest value the two self-inductances allow. The{' '}
          <strong>coupling coefficient</strong> <MathWrapper formula="k" /> quantifies
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

        <CollapsibleSection title="Why M can never exceed √(L₁L₂)" variant="inline">
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              The energy stored in a coupled pair is
            </p>
            <MathWrapper
              formula="w = \tfrac{1}{2}L_1 i_1^2 + M i_1 i_2 + \tfrac{1}{2}L_2 i_2^2"
              block
            />
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              and stored energy can never be negative for <em>any</em> pair of currents. Pick
              the most adversarial secondary current,{' '}
              <MathWrapper formula="i_2 = -(M/L_2)\,i_1" />:
            </p>
            <MathWrapper
              formula="w = \tfrac{1}{2}L_1 i_1^2 - \frac{M^2}{L_2}i_1^2 + \tfrac{1}{2}\frac{M^2}{L_2}i_1^2 = \tfrac{1}{2}i_1^2\!\left(L_1 - \frac{M^2}{L_2}\right) \ge 0 \;\Longrightarrow\; M^2 \le L_1 L_2"
              block
            />
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              So <MathWrapper formula="k = M/\sqrt{L_1 L_2}" /> is <em>forced</em> into [0, 1]
              — a coil pair with k &gt; 1 would be a free-energy machine.
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Tie-back to the worked example above: there,{' '}
              <MathWrapper formula="L_1 = \mu_0 N_1^2 A/l = 628.3\,\mu\text{H}" /> and{' '}
              <MathWrapper formula="L_2 = \mu_0 N_2^2 A/l = 25.13\,\mu\text{H}" />, so{' '}
              <MathWrapper formula="\sqrt{L_1 L_2} = \mu_0 N_1 N_2 A/l = 125.7\,\mu\text{H} = M" />{' '}
              exactly — the idealized shared-core geometry is the k = 1 limit. Real windings
              leak (end effects, imperfect overlap), which is exactly what k &lt; 1 measures.
            </p>
          </div>
        </CollapsibleSection>

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
      {/* The coupled-coil equations                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          The coupled-coil equations
        </h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The dot convention just gave you a <em>sign rule</em> — but a sign rule for what
          equation? This one. Each coil sees its own self-induced voltage plus a mutual term
          from the other coil's changing current:
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            The Coupled-Coil Equations
          </p>
          <MathWrapper formula="v_1 = L_1\frac{di_1}{dt} + M\frac{di_2}{dt}" block />
          <MathWrapper formula="v_2 = M\frac{di_1}{dt} + L_2\frac{di_2}{dt}" block />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            KVL's new vocabulary — every transformer problem starts from this pair.
          </p>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
          How to read this:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li>
            The signs as written hold when <strong>both</strong> currents enter dotted
            terminals (passive sign convention on both ports); a current entering an undotted
            terminal flips the sign of <em>both</em> M terms — that is the entire content of
            the dot rule above.
          </li>
          <li>
            Open the secondary (<MathWrapper formula="i_2 = 0" />) and the second line
            collapses to <MathWrapper formula="v_2 = M\,di_1/dt" /> — the definition and the
            circuit equation are the same physics.
          </li>
          <li>
            They are simultaneous: the secondary's current talks <em>back</em> to the primary
            through the same M. Solving the pair with Kirchhoff is how every transformer
            problem in Part 5's distributed world starts.
          </li>
        </ul>

        <ConceptCheck
          onComplete={() => incrementConceptChecks('transformers')}
          onHint={() => incrementHints('transformers')}
          data={{
            mode: 'multiple-choice',
            question: 'Two coils have M = 50 mH. The primary current ramps steadily from 0 to 2 A in 4 ms while the secondary is open-circuited. What voltage magnitude appears at the secondary terminals during the ramp?',
            options: [
              { text: '25 V', correct: true, explanation: 'Correct. di₁/dt = 2 A / 0.004 s = 500 A/s, so |v₂| = M·di₁/dt = 0.05 × 500 = 25 V. An open coil with zero current can still show a healthy terminal voltage — it reports the other coil\'s rate of change.' },
              { text: '25 mV', correct: false, explanation: 'You divided by 4 instead of 0.004 — the ramp lasts 4 milliseconds. A 1000× unit slip is the classic error here.' },
              { text: '0.1 V', correct: false, explanation: 'That is M × i₁ = 0.05 × 2. Mutual voltage couples to the rate of change di₁/dt, never to the current itself — a steady 2 A would induce exactly nothing.' },
              { text: '0 V — the secondary is open, so no current means no voltage', correct: false, explanation: 'No current means no I·R drop, but v₂ = M di₁/dt is an EMF: it exists at open terminals, like a battery nobody has connected yet. (Measuring it is precisely how the Practice tab\'s new exercise determines M.)' },
            ],
            hints: [
              'v₂ = M di₁/dt — you need the rate of change of the PRIMARY current.',
              'di₁/dt = 2 A ÷ 4 ms. Watch the milli.',
            ],
          }}
        />

        <PredictionGate
          question="The same pair (M = 50 mH) carries a steady primary current of 2 A. You snap a mechanical switch open, collapsing i₁ from 2 A to zero in about 10 µs. What appears across the open secondary at that instant?"
          options={[
            { id: 'zero', label: '≈0 V — the current is gone, so the voltage is gone' },
            { id: 'ramp', label: '25 V — same as the slow ramp' },
            { id: 'spark', label: '≈10 000 V — a high-voltage spike' },
            { id: 'vs', label: '2 V — whatever drove the primary' },
          ]}
          getCorrectAnswer={() => 'spark'}
          initialPassed={flybackUnlocked}
          onPassed={() => setFlybackUnlocked(true)}
          onPredict={(correct) => markPredictionGate('transformers', correct)}
          explanation={
            <p>
              Same formula, savage rate:{' '}
              <MathWrapper formula="|v_2| = M\,\frac{|\Delta i_1|}{\Delta t} = 0.05 \times \frac{2}{10^{-5}} = 10\,000\,\text{V}" />
              . The faster the interruption, the bigger the spike — di₁/dt is the whole game.
            </p>
          }
        >
          <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5 space-y-3">
            <p className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
              The Flyback Spike
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              This is not a malfunction — it is a product. A car's{' '}
              <strong>ignition coil</strong> is exactly this circuit: charge the primary to a
              few amps, snap it open with a transistor, and the mutual spike (helped by a
              deliberately large turns ratio) fires 10–40 kV across the spark-plug gap. The
              same physics, uninvited, is why switching any inductive load arcs across the
              opening contacts: the primary's own <MathWrapper formula="L_1\,di_1/dt" /> spikes
              too, so relay datasheets demand a <strong>flyback diode</strong> to give the
              current somewhere to go. One equation, two industries: ignition systems exploit{' '}
              <MathWrapper formula="M\,di_1/dt" />; every relay driver in existence defends
              against it.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Plausibility check: the slow ramp above changed the same 2 A over 4 ms → 25 V;
              the switch does it 400× faster (10 μs) → 400 × 25 V = 10 kV. Same change of flux,
              shorter time, scaled voltage. ✓
            </p>
          </div>
        </PredictionGate>
      </section>


      {/* ────────────────────────────────────────────────────────── */}
      {/* Ideal Transformer                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Ideal Transformer
        </h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The three ratios below are what the coupled-coil equations collapse to in the limit
          of perfect coupling (k = 1) and large inductance — the everyday working model. An{' '}
          <strong>ideal transformer</strong> has perfect coupling (
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
          question="If k = 0.9 and you double N₂ while keeping N₁ fixed, what happens to the secondary voltage?"
          options={[
            { id: 'doubles', label: 'Doubles' },
            { id: 'halves', label: 'Halves' },
            { id: 'same', label: 'Stays the same' },
            { id: 'quadruples', label: 'Quadruples' },
          ]}
          getCorrectAnswer={() => 'doubles'}
          initialPassed={simUnlocked}
          onPassed={() => setSimUnlocked(true)}
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
        scenario="You have two coils in a sealed module — no geometry visible, no datasheet. You drive the primary with a current ramp of 200 A/s and measure a steady 30 mV on the open-circuited secondary."
        question="What is the mutual inductance M of the pair?"
        options={[
          {
            text: '0.15 mH (150 μH)',
            correct: true,
            explanation:
              'Correct. M = v₂ ÷ (di₁/dt) = 0.030 V ÷ 200 A/s = 1.5×10⁻⁴ H. The definition runs backwards: M is measurable at the terminals with a ramp and a voltmeter — no geometry needed.',
          },
          {
            text: '6 H',
            correct: false,
            explanation:
              'That is 0.030 × 200 — multiplied instead of divided. A 6 H mutual inductance from a sealed module you can hold in one hand should fail your plausibility check instantly (compare: the air-core solenoid pair in Theory managed 126 μH).',
          },
          {
            text: '1.5 mH',
            correct: false,
            explanation:
              'Decade slip: 0.030/200 = 1.5×10⁻⁴ H = 0.15 mH, not 1.5 mH. Carry the exponents explicitly.',
          },
          {
            text: 'Cannot be determined without N₂ and the flux',
            correct: false,
            explanation:
              'N₂Φ₂₁ is exactly what the secondary voltage already reports: v₂ = d(N₂Φ₂₁)/dt = M di₁/dt. M is a terminal quantity — that is the entire point of defining it.',
          },
        ]}
        correctReveal={
          <div className="space-y-1">
            <MathWrapper
              formula="M = \frac{v_2}{di_1/dt} = \frac{0.030}{200} = 1.5\times10^{-4}\,\text{H} = 150\,\mu\text{H}"
              block
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Flip it for the forward use: at 500 A/s this pair would show 75 mV.
            </p>
          </div>
        }
      />

      <YourTurnPanel
        scenario="Given N₁ = 100, N₂ = 50, Z_L = 200Ω. You found Z_reflected = (100/50)² × 200 = 800Ω. Now change the turns ratio to N₁ = 200, N₂ = 50."
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
