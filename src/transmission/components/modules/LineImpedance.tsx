import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { getSectionNumber } from '@shared/constants/curriculum';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { SectionHook } from '@shared/components/common/SectionHook';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { LabStation } from '@shared/components/common/LabStation';
import { LabLayout } from '@shared/components/common/LabLayout';
import { Tabs } from '@shared/components/common/Tabs';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { useProgressStore } from '@shared/store/progressStore';
import { WalkTheLineSim } from '@transmission/components/simulations/WalkTheLineSim';
import { calculatePhaseConstant, calculateStubReactance } from '@transmission/utils/transmissionMath';

/**
 * Section page: Line Impedance & Matching.
 *
 * Closes the position question Γ alone cannot answer: β and electrical length,
 * the phasor line solution, Γ(l) rotation, the Z_in tan-transformation (with the
 * 0.3λ exam task worked by hand), λ/2 + λ/4 special cases, the quarter-wave
 * transformer derived at last, and stub reactance. Four Tabs chapters; the Z_in
 * Lab chapter uses the split-pane LabLayout with a blocking PredictionGate whose
 * unlocked state is lifted here (Tabs remounts panels on switch).
 */
const CHALLENGE = {
  title: `Walk the Line: From the Load to the Quarter-Wave Sweet Spot`,
  description: `A guided traverse of the Walk the Line bench (in the Z_in Lab): start on the exam load, drag the probe from the load outward, and watch Z_in, the Γ phasor, and the strip chart act out every special case this section derived.`,
  instructions: [
    `Open the 🧪 Z_in Lab tab and commit the Predict-First prediction to reveal the bench. Press the 'Exam load (100 Ω)' preset and set the distance slider to l = 0. Confirm the readouts: Z_in = 100.0 + j0.0 Ω, βl = 0°, Γ = 0.333 ∠ 0.0° (the phasor sits on the positive real axis), VSWR = 2.00.`,
    `Drag slowly to l = 0.125 λ (βl = 45°). Watch the Γ phasor sweep 90° clockwise and read Z_in = 40.0 − j30.0 Ω — the purely resistive load now looks capacitive, and the strip chart's X trace has dipped below zero.`,
    `Continue to l = 0.250 λ. The phasor reaches ∠180°, and Z_in = 25.0 + j0.0 Ω — exactly Z₀²/Z_L, the quarter-wave inversion and the minimum of the R trace. Compare with the prediction you committed at the gate.`,
    `Nudge to l = 0.300 λ (βl = 108°) and read Z_in ≈ 26.9 + j11.9 Ω. Check it digit-for-digit against the hand-worked example in the theory column — the bench and your pencil must agree.`,
    `Carry on to l = 0.500 λ: the phasor completes its lap and Z_in returns to 100.0 + j0.0 Ω. Conclude from the strip chart that EVERYTHING repeats with period λ/2, and that the two purely-real crossings per period are the voltage-max (100 Ω) and voltage-min (25 Ω) points.`,
    `Press the 'Short (0 Ω)' preset and sweep l from 0 to 0.250 λ. Watch Z_in stay purely reactive (+jX) and climb from 0 toward ∞, passing +j50 Ω at exactly l = 0.125 λ — then state in one sentence why this makes a piece of shorted cable a designable inductor (and, past λ/4, a capacitor): the stub idea behind the Stubs tab.`,
  ],
  hint: `Keep one eye on the Γ-dial: |Γ| never moves on a lossless line — distance only rotates the phase, two degrees of dial per degree of electrical length.`,
};

const flaskIcon = <FlaskConical className="w-4 h-4" aria-hidden="true" />;

/* Static stub-reactance figure data: X/Z₀ over l/λ ∈ [0, 0.5], 101 points from
 * the exported calculateStubReactance (Z₀ = 1 yields the normalized curve;
 * β = calculatePhaseConstant(1) = 2π rad per λ — no inline math). Values beyond
 * ±5 break to null at the λ/4 singularities. */
const STUB_BETA_PER_LAMBDA = calculatePhaseConstant(1);
const STUB_CHART_DATA = Array.from({ length: 101 }, (_, i) => {
  const l = (0.5 * i) / 100;
  const clip = (v: number): number | null => (Number.isFinite(v) && Math.abs(v) <= 5 ? v : null);
  return {
    l,
    short: clip(calculateStubReactance(1, STUB_BETA_PER_LAMBDA * l, 'short')),
    open: clip(calculateStubReactance(1, STUB_BETA_PER_LAMBDA * l, 'open')),
  };
});

export function LineImpedance() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited('line-impedance'); }, [markVisited]);

  // Unlocked lab benches, lifted above the Tabs so a remounted panel
  // (Tabs remounts on tab switch) restores its revealed simulation.
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const unlock = (key: string) => setUnlocked((u) => ({ ...u, [key]: true }));

  const onConcept = () => incrementConceptChecks('line-impedance');
  const onHint = () => incrementHints('line-impedance');
  const onPredict = (correct: boolean) => markPredictionGate('line-impedance', correct);

  /* ================================================================
     Tab 1 · Electrical Length (theory only, full width)
     ================================================================ */
  const electricalLengthTheory = (
    <section className="space-y-6">
      {/* The opening puzzle: the exposed-debt pattern */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          The question &Gamma; can&rsquo;t answer
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Section {getSectionNumber('transmission-lines')} gave you the load-end toolkit. Apply
          it to the setup from the hook &mdash; <MathWrapper formula="Z_0 = 50\,\Omega" />,{' '}
          <MathWrapper formula="Z_L = 100\,\Omega" />, line length{' '}
          <MathWrapper formula="l = 0.3\lambda" />:
        </p>
        <table className="w-full max-w-lg mx-auto text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
              <th scope="col" className="py-1.5 pr-3 font-semibold text-slate-600 dark:text-slate-400">Tool</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold text-slate-600 dark:text-slate-400">Result</th>
              <th scope="col" className="py-1.5 font-semibold text-slate-600 dark:text-slate-400">Z<sub>in</sub>?</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-1.5 pr-3"><MathWrapper formula="\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0}" /></td>
              <td className="py-1.5 pr-3"><MathWrapper formula="\Gamma = \frac{100-50}{100+50} = \frac{1}{3}" /></td>
              <td className="py-1.5 text-amber-600 dark:text-amber-400 font-mono">✗</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-1.5 pr-3"><MathWrapper formula="\text{VSWR} = \frac{1+|\Gamma|}{1-|\Gamma|}" /></td>
              <td className="py-1.5 pr-3"><MathWrapper formula="\text{VSWR} = 2" /></td>
              <td className="py-1.5 text-amber-600 dark:text-amber-400 font-mono">✗</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-1.5 pr-3">Smith chart (one point)</td>
              <td className="py-1.5 pr-3">locates <MathWrapper formula="z_L = 2" /></td>
              <td className="py-1.5 text-amber-600 dark:text-amber-400 font-mono">✗</td>
            </tr>
          </tbody>
        </table>
        <p className="text-center">
          <span className="inline-block font-mono text-sm font-bold tracking-widest uppercase text-amber-700 dark:text-amber-400 border-2 border-amber-400 dark:border-amber-600 rounded px-3 py-1 -rotate-2">
            &Gamma; describes the load. The source is 0.3&lambda; away.
          </span>
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Notice what all three tools ignore: the length. The missing quantity is how far along
          the line you stand &mdash; measured not in metres, but in <em>wavelengths</em>. This
          page builds that quantity, then uses it twice: to compute{' '}
          <MathWrapper formula="Z_{in}" />, and to design matching networks out of bare cable.
          (|&Gamma;|&sup2; = 1/9 &asymp; 11&nbsp;% of the power reflects at the load &mdash; you
          know that already. What the <em>generator</em> sees is a different question.)
        </p>
      </div>

      {/* The phase constant β */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          The phase constant &beta;
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          A wavelength of line is 360&deg; of phase. The conversion rate between metres and
          radians is the <strong>phase constant</strong>:
        </p>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <MathWrapper block formula="\beta = \frac{2\pi}{\lambda} = \frac{\omega}{v_p} \qquad [\text{rad/m}]" />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          A length <MathWrapper formula="l" /> of line &ldquo;winds&rdquo; the wave&rsquo;s phase
          by <MathWrapper formula="\beta l" /> radians &mdash; the{' '}
          <strong>electrical length</strong>. Two physically different cables are electrically
          identical if their <MathWrapper formula="\beta l" /> agree. (You have already{' '}
          <em>seen</em> it: the <MathWrapper formula="\text{Line} = N\lambda_0" /> readout in the
          Section {getSectionNumber('transmission-lines')} reflections lab is{' '}
          <MathWrapper formula="\beta l / 2\pi" />.)
        </p>
        <table className="w-full max-w-md text-sm text-center">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th scope="row" className="py-1.5 pr-3 font-semibold text-left text-slate-600 dark:text-slate-400">l/&lambda;</th>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">0</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">1/8</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">1/4</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">3/8</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">1/2</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="py-1.5 pr-3 font-semibold text-left text-slate-600 dark:text-slate-400">&beta;l</th>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">0&deg;</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">45&deg;</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">90&deg;</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">135&deg;</td>
              <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">180&deg;</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          At f = 1 GHz on the Section {getSectionNumber('lumped-distributed')} coax
          (<MathWrapper formula="v_p = 2\times10^8" /> m/s):{' '}
          <MathWrapper formula="\lambda = v_p/f = 0.2" /> m, so a 6 cm jumper is{' '}
          <MathWrapper formula="0.3\lambda" /> &rarr;{' '}
          <MathWrapper formula="\beta l = 0.6\pi = 108^\circ" />.{' '}
          <em>
            Same cable at 100 MHz: &lambda; = 2 m &rarr; 0.03&lambda; &asymp; 11&deg; &mdash;
            electrically invisible. Length means nothing; length-per-wavelength means everything.
          </em>
        </p>
      </div>

      {/* The phasor line solution */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          The phasor line solution
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          In Section {getSectionNumber('lumped-distributed')} you derived the wave equation from
          KVL/KCL and saw its travelling-wave solution{' '}
          <MathWrapper formula="V(x,t) = V^{+}f(t-x/v) + V^{-}g(t+x/v)" />. Drive the line
          sinusoidally and wait for steady state: each travelling wave becomes a phasor whose
          phase depends on position:
        </p>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <MathWrapper block formula="\widetilde{V}(z) = V_0^{+}e^{-j\beta z} + V_0^{-}e^{+j\beta z}" />
        </div>
        <MathWrapper block formula="\widetilde{I}(z) = \frac{V_0^{+}}{Z_0}e^{-j\beta z} - \frac{V_0^{-}}{Z_0}e^{+j\beta z}" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Note the minus &mdash; the backward wave carries current the other way.
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Nothing new is assumed: this is the two-wave solution written for one frequency. The
          ratio <MathWrapper formula="V_0^{-}/V_0^{+}" /> at the load is exactly the &Gamma; of
          Section {getSectionNumber('transmission-lines')}.
        </p>
      </div>

      {/* Γ along the line — the rotation */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          &Gamma; along the line &mdash; the rotation
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Now stand at distance <MathWrapper formula="l" /> from the load, looking toward it. The
          forward wave is <MathWrapper formula="\beta l" /> radians earlier in phase here; the
          returning wave <MathWrapper formula="\beta l" /> later. Their ratio &mdash; the local
          reflection coefficient &mdash; therefore rotates by the round trip:
        </p>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <MathWrapper block formula="\Gamma(l) = \Gamma_L\, e^{-j2\beta l}" />
        </div>
        <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
          <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
            Key Insight
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>The factor 2 is a round trip.</strong> Walking <MathWrapper formula="l" />{' '}
            toward the generator delays the forward wave by &beta;l <em>and</em> the returning
            wave by &beta;l. On a lossless line |&Gamma;| never changes &mdash; only its phase,
            clockwise on the &Gamma;-plane. One full lap ={' '}
            <MathWrapper formula="2\beta l = 2\pi" /> = <strong>half a wavelength</strong>. This
            single fact is the engine of everything below &mdash; and it is why the Smith
            chart&rsquo;s rim carries a{' '}
            <span className="font-mono text-xs">WAVELENGTHS TOWARD GENERATOR</span> scale running
            0 to 0.5.
          </p>
        </div>
      </div>

      <ConceptCheck
        onComplete={onConcept}
        onHint={onHint}
        data={{
          mode: 'multiple-choice',
          question: 'You move λ/4 along a lossless line toward the generator. What happens to the reflection coefficient Γ?',
          options: [
            { text: 'Its phase rotates by −180° (half a lap of the Γ-plane); |Γ| is unchanged', correct: true, explanation: 'Correct. Γ(l) = Γ_L e^(−j2βl) and 2β(λ/4) = 2·(2π/λ)·(λ/4) = π. The factor 2 is the round trip: the reflected wave travels there and back. A full 360° lap needs λ/2, not λ.' },
            { text: 'Its phase rotates by −90°; |Γ| is unchanged', correct: false, explanation: 'You dropped the round-trip factor 2: the phase shift is 2βl, not βl.' },
            { text: 'Its phase rotates by −360° — back where it started', correct: false, explanation: 'That would need 2βl = 2π, i.e. l = λ/2. A quarter wavelength is half a lap.' },
            { text: '|Γ| shrinks because the wave has travelled farther', correct: false, explanation: 'Only loss (α) shrinks |Γ|. This line is lossless — the magnitude is pinned; position only spins the phase.' },
          ],
          hints: ['Write Γ(l) = Γ_L e^(−j2βl) and substitute l = λ/4.', 'Why 2βl and not βl? Think about the path the reflected wave takes.'],
        }}
      />

      <CollapsibleSection title="Lossy lines: γ = α + jβ" variant="inline">
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            On a real cable the exponent generalizes. With series loss{' '}
            <MathWrapper formula="R'" /> and shunt loss <MathWrapper formula="G'" /> per metre,
            the propagation constant becomes complex:
          </p>
          <MathWrapper block formula="\gamma = \sqrt{(R' + j\omega L')(G' + j\omega C')} = \alpha + j\beta" />
          <MathWrapper block formula="\widetilde{V}(z) = V_0^{+}e^{-\alpha z}e^{-j\beta z} + V_0^{-}e^{+\alpha z}e^{+j\beta z}" />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            The <strong>attenuation constant</strong> <MathWrapper formula="\alpha" /> (nepers
            per metre; 1 Np = 8.686 dB) shrinks each wave&rsquo;s amplitude as it travels;{' '}
            <MathWrapper formula="\beta" /> still winds the phase exactly as above. In the
            lossless limit <MathWrapper formula="R' = G' = 0" />:{' '}
            <MathWrapper formula="\gamma = j\omega\sqrt{L'C'} = j\beta" />, and everything on
            this page survives unchanged. One practical consequence: on a lossy line{' '}
            <MathWrapper formula="|\Gamma(l)| = |\Gamma_L|\,e^{-2\alpha l}" /> <em>does</em>{' '}
            shrink toward the generator &mdash; a long lossy cable looks better-matched than its
            load. Real coax at 1 GHz loses a few dB per 100 m &mdash; utterly negligible across
            a 5 cm matching section, which is why the lossless formulas are the everyday working
            tool. The companion result &mdash; lossy <MathWrapper formula="Z_0" /> &mdash; is
            the collapsible you met in Section {getSectionNumber('transmission-lines')}.
          </p>
        </div>
      </CollapsibleSection>
    </section>
  );

  /* ================================================================
     Tab 2 · The Z_in Lab (split-pane: theory left, gated bench right)
     ================================================================ */
  const zinTheory = (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Input impedance: what the source sees
      </h2>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Take the ratio of the two phasors at <MathWrapper formula="l" />:
      </p>

      <CollapsibleSection title="The three-line derivation" variant="inline">
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Write both phasors at distance <MathWrapper formula="l" /> from the load and divide
            through by <MathWrapper formula="V_0^{+}e^{j\beta l}" />:
          </p>
          <MathWrapper block formula="Z_{in}(l) = Z_0\,\frac{e^{j\beta l} + (V_0^{-}/V_0^{+})\,e^{-j\beta l}}{e^{j\beta l} - (V_0^{-}/V_0^{+})\,e^{-j\beta l}} = Z_0\,\frac{1 + \Gamma_L e^{-j2\beta l}}{1 - \Gamma_L e^{-j2\beta l}}" />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Substitute <MathWrapper formula="\Gamma_L = \frac{Z_L - Z_0}{Z_L + Z_0}" /> and apply
            Euler (<MathWrapper formula="e^{\pm j\beta l} = \cos\beta l \pm j\sin\beta l" />) to
            trade the exponentials for a tangent.
          </p>
        </div>
      </CollapsibleSection>

      <MathWrapper block formula="Z_{in}(l) = \frac{\widetilde{V}(l)}{\widetilde{I}(l)} = Z_0\,\frac{1 + \Gamma_L e^{-j2\beta l}}{1 - \Gamma_L e^{-j2\beta l}}" />

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        and in the form every formula sheet prints:
      </p>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
          THE transmission-line formula
        </p>
        <MathWrapper block formula="Z_{in}(l) = Z_0\,\frac{Z_L + jZ_0\tan\beta l}{Z_0 + jZ_L\tan\beta l}" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          How to read this formula
        </p>
        <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-none">
          <li>
            (i) at <MathWrapper formula="l = 0" />, <MathWrapper formula="\tan 0 = 0" /> &rarr;{' '}
            <MathWrapper formula="Z_{in} = Z_L" /> ✓
          </li>
          <li>
            (ii) length enters ONLY through <MathWrapper formula="\tan\beta l" /> &rarr;
            everything repeats with period &lambda;/2
          </li>
          <li>
            (iii) a purely resistive load still produces a complex{' '}
            <MathWrapper formula="Z_{in}" /> &mdash; lines manufacture reactance from geometry
            alone (the Stubs tab weaponizes this)
          </li>
        </ul>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Warm-up: &lambda;/8 of the same line
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Z&#8320; = 50 &Omega;, Z<sub>L</sub> = 100 &Omega;.{' '}
          <MathWrapper formula="\beta l = 45^\circ" />, <MathWrapper formula="\tan\beta l = 1" />:
        </p>
        <MathWrapper block formula="Z_{in} = 50\,\frac{100 + j50}{50 + j100} = 50\,\frac{(100+j50)(50-j100)}{50^2+100^2} = 50\,\frac{10000 - j7500}{12500} = 40 - j30\ \Omega" />
        <p className="text-sm italic text-slate-600 dark:text-slate-400">
          The 3-4-5 triangle appears &mdash; and the input looks capacitive even though the load
          is a pure resistor.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          The exam task, by hand
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Given <MathWrapper formula="Z_0 = 50\,\Omega" />,{' '}
          <MathWrapper formula="Z_L = 100\,\Omega" />, <MathWrapper formula="l = 0.3\lambda" />:
        </p>
        <WorkedSteps
          tryFirstPrompt="Compute βl in degrees yourself before revealing step 1."
          steps={[
            {
              title: 'Step 1 — Electrical length',
              body: (
                <div className="space-y-2">
                  <MathWrapper block formula="\beta l = \frac{2\pi}{\lambda}(0.3\lambda) = 0.6\pi = 108^\circ, \qquad \tan 108^\circ = -3.078" />
                  <p>
                    <em>
                      Negative &mdash; past 90&deg; the tangent flips sign. Missing this sign
                      flip is the single most common exam mistake.
                    </em>
                  </p>
                </div>
              ),
            },
            {
              title: 'Step 2 — Substitute',
              body: (
                <MathWrapper block formula="Z_{in} = 50\,\frac{100 + j50(-3.078)}{50 + j100(-3.078)} = 50\,\frac{100 - j153.9}{50 - j307.8}" />
              ),
            },
            {
              title: 'Step 3 — Polar division',
              body: (
                <MathWrapper block formula="\frac{183.5\angle -57.0^\circ}{311.8\angle -80.8^\circ} = 0.589\angle 23.8^\circ \;\Rightarrow\; Z_{in} = 29.4\angle 23.8^\circ = 26.9 + j11.9\ \Omega" />
              ),
            },
            {
              title: 'Step 4 — Audit (does this make sense?)',
              body: (
                <div className="space-y-2">
                  <p>
                    |&Gamma;| = 1/3 everywhere on a lossless line, so the resistive part must
                    stay inside{' '}
                    <MathWrapper formula="[Z_0/\text{VSWR},\ Z_0\cdot\text{VSWR}] = [25, 100]\ \Omega" />.
                    26.9 &Omega; ✓ &mdash; just past the &lambda;/4 minimum of exactly 25
                    &Omega;; the small <em>positive</em> reactance confirms we rotated just
                    beyond the purely-real point (&ang;&Gamma;(0.3&lambda;) = &minus;216&deg;
                    &equiv; +144&deg;).
                  </p>
                  <p>
                    <strong>
                      If your hand calculation lands outside that band, hunt for a tan-sign
                      error.
                    </strong>
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          The same answer by rotation
        </p>
        <MathWrapper block formula="\Gamma(0.3\lambda) = \tfrac{1}{3}e^{-j216^\circ} = \tfrac{1}{3}\angle 144^\circ" />
        <MathWrapper block formula="Z_{in} = Z_0\,\frac{1+\Gamma}{1-\Gamma} = 26.9 + j11.9\ \Omega" />
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          &mdash; identical. The bench below computes it this way, and the Smith chart in
          Section {getSectionNumber('transmission-lines')} is this same calculation done
          graphically: rotate clockwise at constant |&Gamma;|, read off z.
        </p>
      </div>

      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
          Does this make sense?
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <MathWrapper formula="Z_{in}" /> of a <em>lossless</em> line came out complex. Where is
          the reactive energy stored, if the load is a resistor? &mdash; In the line&rsquo;s own
          L&prime; and C&prime;: the standing wave IS stored energy sloshing back and forth.
        </p>
      </div>
      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
          Does this make sense?
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          VSWR = 2 at every point on this line, yet <MathWrapper formula="Z_{in}" /> varies from
          25 &Omega; to 100 &Omega;. Reconcile: VSWR encodes |&Gamma;|, which is frozen;{' '}
          <MathWrapper formula="Z_{in}" /> encodes &ang;&Gamma; too, which rotates.
        </p>
      </div>

      <ConceptCheck
        onComplete={onConcept}
        onHint={onHint}
        data={{
          mode: 'multiple-choice',
          question: 'A 50 Ω line exactly λ/2 long is terminated in Z_L = 80 − j20 Ω. What is Z_in?',
          options: [
            { text: '80 − j20 Ω — identical to the load', correct: true, explanation: 'Correct. At βl = 180°, tan βl = 0 and the formula collapses to Z_in = Z_L for ANY load. A half-wave line is electrically invisible — but only at the frequency that makes it half-wave.' },
            { text: '50 Ω — the line matches it', correct: false, explanation: 'A line never matches a load by itself: Z_in = Z₀ only if Z_L = Z₀. Length can only transform a mismatch, not erase it.' },
            { text: '29.4 + j7.35 Ω', correct: false, explanation: 'That is Z₀²/Z_L — the QUARTER-wave result. A half-wave line rotates Γ a full 360°, back to where it started.' },
            { text: '80 + j20 Ω — conjugated', correct: false, explanation: 'Nothing conjugates here; the rotation 2βl = 360° is an identity.' },
          ],
          hints: ['What is tan(βl) at βl = 180°?', 'Full lap of the Γ-plane = λ/2 — where does Γ end up?'],
        }}
      />
    </section>
  );

  const zinBench = (
    <LabStation
      id="walk-the-line"
      title="Walk the Line"
      objective="Drag a probe along a mismatched 50 Ω line and watch Z_in, the electrical length, and the rotating Γ phasor respond — the quarter-wave sweet spots reveal themselves."
    >
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Predict first, then run the lab. Commit your prediction to reveal the bench.
      </p>
      <PredictionGate
        initialPassed={!!unlocked.walk}
        onPassed={() => unlock('walk')}
        onPredict={onPredict}
        question="This 50 Ω line is terminated in Z_L = 100 Ω (purely resistive). You probe the input impedance a quarter-wavelength (l = λ/4) from the load. What do you measure?"
        options={[
          { id: 'same', label: "100 Ω — length doesn't matter" },
          { id: 'matched', label: '50 Ω — the line matched it' },
          { id: 'inverted', label: '25 Ω — less than Z₀' },
          { id: 'reactive', label: 'j50 Ω — purely reactive' },
        ]}
        getCorrectAnswer={() => 'inverted'}
        explanation={
          <span>
            A quarter-wave of line <em>inverts</em> the normalized impedance:{' '}
            <MathWrapper formula="z_{in} = 1/z_L" />, i.e.{' '}
            <MathWrapper formula="Z_{in} = Z_0^2/Z_L = 2500/100 = 25\,\Omega" />. A load above
            Z&#8320; reappears below it &mdash; and the bench lets you watch the whole journey
            between those two extremes.
          </span>
        }
      >
        <WalkTheLineSim />
      </PredictionGate>
    </LabStation>
  );

  /* ================================================================
     Tab 3 · Matching (theory only, full width)
     ================================================================ */
  const matchingTheory = (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        The two magic lengths
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Half-wave, l = &lambda;/2
          </p>
          <MathWrapper block formula="\tan\beta l = \tan 180^\circ = 0 \Rightarrow Z_{in} = Z_L" />
          <p className="text-sm italic text-slate-600 dark:text-slate-400">
            The line vanishes (at this one frequency). Corollary: every property of{' '}
            <MathWrapper formula="Z_{in}" /> repeats with period &lambda;/2 &mdash; you saw it on
            the bench&rsquo;s strip chart.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Quarter-wave, l = &lambda;/4
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <MathWrapper formula="\beta l = 90^\circ" />,{' '}
            <MathWrapper formula="\tan\beta l \to \infty" />. Divide numerator and denominator
            by <MathWrapper formula="\tan\beta l" />:
          </p>
        </div>
      </div>

      <MathWrapper block formula="Z_{in} = Z_0\,\frac{Z_L/\tan\beta l + jZ_0}{Z_0/\tan\beta l + jZ_L} \;\xrightarrow{\beta l \to 90^\circ}\; Z_0\,\frac{jZ_0}{jZ_L} = \frac{Z_0^2}{Z_L}" />

      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>The quarter-wave inverter:</strong> normalized,{' '}
          <MathWrapper formula="z_{in} = 1/z_L" />. Big becomes small, inductive becomes
          capacitive, short becomes open. (On the &Gamma;-dial: half a lap,{' '}
          <MathWrapper formula="\Gamma \to -\Gamma" />.)
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          The quarter-wave transformer &mdash; derived at last
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Section {getSectionNumber('transmission-lines')} <em>asserted</em>{' '}
          <MathWrapper formula="Z_T = \sqrt{Z_0 Z_L}" />. You can now derive it in two lines.
          Insert a &lambda;/4 section of unknown impedance <MathWrapper formula="Z_T" /> between
          a <MathWrapper formula="Z_0" /> feed and a resistive load{' '}
          <MathWrapper formula="R_L" />. The feed sees:
        </p>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            The formula the Smith chapter used to assert; now it&rsquo;s yours
          </p>
          <MathWrapper block formula="Z_{in} = \frac{Z_T^2}{R_L} \overset{!}{=} Z_0 \quad\Longrightarrow\quad Z_T = \sqrt{Z_0 R_L}" />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The geometric mean &mdash; the transformer climbs exactly halfway up the impedance
          ladder in log space.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Design one: 100 &Omega; &rarr; 50 &Omega; at 1 GHz
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          On the Section {getSectionNumber('lumped-distributed')} coax family
          (<MathWrapper formula="v_p = 2\times10^8" /> m/s):
        </p>
        <WorkedSteps
          tryFirstPrompt="Sketch the feed–transformer–load chain and compute Z_T before revealing."
          steps={[
            {
              title: 'Step 1 — Impedance',
              body: (
                <div className="space-y-2">
                  <MathWrapper block formula="Z_T = \sqrt{50\times100} = \sqrt{5000} \approx 70.7\ \Omega" />
                  <p>
                    <em>
                      Commercial 70&ndash;75 &Omega; stock exists &mdash; part of why 75 &Omega;
                      cable is everywhere.
                    </em>
                  </p>
                </div>
              ),
            },
            {
              title: 'Step 2 — Physical length',
              body: (
                <div className="space-y-2">
                  <MathWrapper block formula="\lambda = v_p/f = \frac{2\times10^8}{10^9} = 0.20\ \text{m} \;\Rightarrow\; l = \lambda/4 = 5.0\ \text{cm}" />
                  <p>
                    <em>Use the LINE wavelength, never the free-space one.</em>
                  </p>
                </div>
              ),
            },
            {
              title: 'Step 3 — Verify',
              body: (
                <div className="space-y-2">
                  <MathWrapper block formula="Z_{in} = Z_T^2/Z_L = 70.7^2/100 = 50.0\ \Omega" />
                  <p>✓ &rarr; &Gamma; = 0 at the feed, VSWR = 1.</p>
                </div>
              ),
            },
            {
              title: 'Step 4 — The catch (bandwidth)',
              body: (
                <p>
                  The section is &lambda;/4 <em>only at 1 GHz</em>. At 1.2 GHz it is 0.3&lambda;
                  &mdash; and you now own the exact skill (the Z_in Lab&rsquo;s worked example)
                  to compute the residual mismatch. A quarter-wave transformer is a one-frequency
                  promise; that trade-off is the start of RF filter design.
                </p>
              ),
            },
          ]}
        />
      </div>

      <YourTurnPanel
        scenario="Your half-wave dipole from the Antennas section presents ≈ 73 Ω — call it 75 Ω — at 100 MHz. The feed is 50 Ω coax. Match it with a quarter-wave transformer cut from cable with velocity factor 0.66 (v_p ≈ 2×10⁸ m/s)."
        question="What characteristic impedance Z_T do you need, and how long do you cut the section?"
        options={[
          { text: 'Z_T ≈ 61.2 Ω, l = 0.50 m', correct: true, explanation: 'Correct! √(50·75) = √3750 ≈ 61.2 Ω, and λ_line = 2×10⁸/10⁸ = 2.0 m, so λ/4 = 0.50 m.' },
          { text: 'Z_T = 62.5 Ω, l = 0.50 m', correct: false, explanation: '62.5 is the ARITHMETIC mean (125/2). Matching needs the geometric mean √(Z₀Z_L) — close here, but the error grows with the impedance ratio.' },
          { text: 'Z_T ≈ 61.2 Ω, l = 0.75 m', correct: false, explanation: 'You used the free-space wavelength (3 m). Waves crawl at 0.66c inside the cable: λ_line = 2.0 m, so the section is 0.50 m.' },
          { text: 'Z_T ≈ 33.3 Ω, l = 0.50 m', correct: false, explanation: '33.3 Ω = Z₀²/Z_L is what a λ/4 of the FEED cable would produce — that is the transformation, not the transformer. Solve Z_T²/Z_L = Z₀ for Z_T.' },
        ]}
        correctReveal={
          <div className="space-y-2">
            <MathWrapper block formula="Z_T = \sqrt{50\times75} = \sqrt{3750} \approx 61.2\ \Omega" />
            <MathWrapper block formula="\lambda_{line} = \frac{2\times10^8}{10^8} = 2.0\ \text{m} \;\Rightarrow\; l = \frac{\lambda}{4} = 0.50\ \text{m}" />
            <MathWrapper block formula="Z_{in} = 3750/75 = 50\ \Omega \;\checkmark" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              61.2 &Omega; is not a stock cable. Real options: microstrip (set the trace width),
              or accept 60 &Omega; stock:{' '}
              <MathWrapper formula="Z_{in} = 3600/75 = 48\ \Omega" />,{' '}
              <MathWrapper formula="\Gamma = -2/98 = -0.020" />, VSWR &asymp; 1.04 &mdash; an
              excellent match. Engineering is knowing when &lsquo;close&rsquo; is closed.
            </p>
          </div>
        }
        hints={['Geometric mean for Z_T; LINE wavelength for l.']}
      />
    </section>
  );

  /* ================================================================
     Tab 4 · Stubs (theory only, full width)
     ================================================================ */
  const stubsTheory = (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Short and open stubs
      </h2>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Terminate a line in the two free loads &mdash; a short, or nothing at all &mdash; and{' '}
        <MathWrapper formula="Z_{in}" /> collapses to something with no resistive part. Set{' '}
        <MathWrapper formula="Z_L = 0" /> (numerator <MathWrapper formula="jZ_0\tan\beta l" />,
        denominator <MathWrapper formula="Z_0" />), or <MathWrapper formula="Z_L \to \infty" />:
      </p>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
        <MathWrapper block formula="Z_{in}^{\text{short}} = jZ_0\tan\beta l \qquad\qquad Z_{in}^{\text{open}} = -jZ_0\cot\beta l" />
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <strong>Pure reactance from bare cable.</strong> A shorted stub below &lambda;/4 looks
        like an inductor; between &lambda;/4 and &lambda;/2, a capacitor; the open stub is its
        mirror. By choosing a <em>length</em> you dial any reactance from &minus;&infin; to
        +&infin; &mdash; no component, no tolerance, no solder joint. At GHz frequencies, where
        a 5 nH inductor is a manufacturing problem, a stub is just trace geometry.{' '}
        <em>
          (You already verified the short-stub curve on the bench: the Short preset swept
          exactly <MathWrapper formula="jZ_0\tan\beta l" />.)
        </em>
      </p>

      <table className="w-full max-w-lg text-sm text-center">
        <caption className="text-xs text-slate-500 dark:text-slate-400 mb-1 text-left">
          Shorted-stub sweep, Z&#8320; = 50 &Omega;
        </caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th scope="col" className="py-1.5 pr-3 font-semibold text-left text-slate-600 dark:text-slate-400">l</th>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">&lambda;/16</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">&lambda;/8</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">&lambda;/4</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">3&lambda;/8</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">&lambda;/2</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="py-1.5 pr-3 font-semibold text-left text-slate-600 dark:text-slate-400">Z<sub>in</sub></th>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">+j20.7 &Omega;</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">+j50 &Omega;</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">&infin;</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">&minus;j50 &Omega;</td>
            <td className="py-1.5 font-mono text-slate-700 dark:text-slate-300">0</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        At &lambda;/4 the inverter strikes: the short looks open! Past it the stub turns
        capacitive, and at &lambda;/2 it is a short again.
      </p>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        &lambda;/8 shorted:{' '}
        <MathWrapper formula="\beta l = 45^\circ \Rightarrow Z_{in} = j50\tan 45^\circ = +j50\ \Omega" />{' '}
        &mdash; a perfect +50 &Omega; &lsquo;inductor&rsquo;. The open &lambda;/8 stub gives{' '}
        <MathWrapper formula="-j50\ \Omega" />.
      </p>

      {/* Static reactance figure. Gate-exemption rationale: the house rule gates
          sims/interactives; this chart has no inputs and nothing to manipulate —
          same class as FigureImage. The INTERACTIVE version of this exact curve
          already lives behind the Z_in Lab's gate (Short preset + distance slider). */}
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4"
        role="img"
        aria-label="Normalized stub reactance versus stub length: shorted-stub tangent curve and open-stub negative cotangent curve, both diverging at a quarter wavelength"
      >
        <div className="flex items-center gap-4 mb-1">
          <span className="text-[10px] font-mono text-engineering-blue-700 dark:text-engineering-blue-400">— short: tan βl</span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">- - open: −cot βl</span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-auto">X/Z₀ vs l/λ</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={STUB_CHART_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="l"
              type="number"
              domain={[0, 0.5]}
              ticks={[0, 0.125, 0.25, 0.375, 0.5]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis domain={[-5, 5]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={36} />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.5)" />
            <ReferenceLine
              x={0.25}
              stroke="#94a3b8"
              strokeDasharray="5 3"
              label={{ value: 'short → ∞ / open → 0', fontSize: 10, fill: '#94a3b8', position: 'top' }}
            />
            <Line type="monotone" dataKey="short" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="open" stroke="#64748b" strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          <span>below &lambda;/4: short looks like L</span>
          <span>open looks like C</span>
        </div>
      </div>

      <ConceptCheck
        onComplete={onConcept}
        onHint={onHint}
        data={{
          mode: 'multiple-choice',
          question: 'A shorted 50 Ω stub is exactly λ/8 long. What does it present at its input?',
          options: [
            { text: '+j50 Ω — purely inductive', correct: true, explanation: 'Correct. Z_in = jZ₀ tan βl = j·50·tan 45° = +j50 Ω. Zero resistance — a reactance manufactured from line geometry alone.' },
            { text: '−j50 Ω — purely capacitive', correct: false, explanation: 'That is the OPEN λ/8 stub: −jZ₀ cot 45° = −j50 Ω. Short and open stubs are reactive mirrors.' },
            { text: "0 Ω — it's a short, after all", correct: false, explanation: 'Only at l = 0. An eighth-wave of line transforms the short: the energy bouncing inside looks inductive from the input.' },
            { text: '∞ — open circuit', correct: false, explanation: 'That happens at exactly l = λ/4, where the quarter-wave inverter turns the short into an open.' },
          ],
          hints: ['What is βl for l = λ/8?', 'tan 45° = 1.'],
        }}
      />

      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>How stubs finish the matching story:</strong> move along the main line to the
          point where the load&rsquo;s admittance has real part{' '}
          <MathWrapper formula="1/Z_0" /> (such a point always exists within &lambda;/2 &mdash;
          the bench showed R sweeping through every value between Z&#8320;/S and
          Z&#8320;&middot;S); hang a stub there, with its length chosen so its susceptance
          cancels what remains. Two lengths to pick &mdash; <em>where</em> and{' '}
          <em>how long</em> &mdash; and both come from the formulas on this page. The systematic
          recipe (and doing it in seconds on the Smith chart) is single-stub design, the standard
          next step in any RF course &mdash; left on the shelf here <strong>deliberately</strong>:
          you now own every formula it is built from.
        </p>
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <span className="font-mono text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('line-impedance')}
          </span>
          Line Impedance &amp; Matching
        </h1>
      </div>

      <SectionHook text="A 50 Ω cable 0.3 wavelengths long, a 100 Ω load on the far end — what impedance does the source actually see? Not 100 Ω, not 50 Ω, and Γ alone cannot tell you. This number decides whether your amplifier delivers power or burns it, and computing it is the most-asked exam task in transmission lines. By the end of this section you will read it off a slider — and design the cable section that fixes it." />

      <Tabs
        tabs={[
          {
            label: 'Electrical Length',
            content: electricalLengthTheory,
          },
          {
            label: 'The Z_in Lab',
            icon: flaskIcon,
            content: <LabLayout benchId="lab-walk" jumpLabel="Jump to lab" theory={zinTheory} bench={zinBench} />,
          },
          {
            label: 'Matching',
            content: matchingTheory,
          },
          {
            label: 'Stubs',
            content: stubsTheory,
          },
        ]}
      />

      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation currentSectionId="line-impedance" />
    </div>
  );
}
