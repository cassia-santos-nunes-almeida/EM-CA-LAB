import { useState } from 'react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { Slider } from '@em/components/common/Slider';
import type { QuizQuestion } from '@em/types/index';
import {
  ETA0,
  intrinsicImpedance,
  lossTangent,
  attenuationGoodConductor,
  skinDepth,
  nepersToDb,
  normalIncidenceGamma,
  normalIncidenceTau,
  reflectedPowerFraction,
} from './mediaMath';

/**
 * toFixed that renders negatives with the typographic minus (U+2212) used by
 * every hand-set value on this page — Number.toFixed emits ASCII '-'.
 */
function fixedMinus(v: number, digits: number): string {
  return v.toFixed(digits).replace('-', '−');
}

// ── Display constants — every number flows through mediaMath (no inline physics) ──

/** Seawater conductivity σ = 4 S/m. */
const SEA_SIGMA = 4;
/** Seawater relative permittivity εr = 81. */
const SEA_EPSR = 81;
/** tan δ for seawater at 1 MHz: 4 / 4.506×10⁻³ ≈ 888 ≫ 1 — a good conductor. */
const SEA_TAN_1MHZ = lossTangent(SEA_SIGMA, 1e6, SEA_EPSR);
/** Good-conductor α for seawater at 1 MHz: √15.79 = 3.97 Np/m. */
const SEA_ALPHA_1MHZ = attenuationGoodConductor(1e6, SEA_SIGMA);
/** Skin depth at 1 MHz: 1/α = 0.252 m. */
const SEA_SKIN_1MHZ = skinDepth(1e6, SEA_SIGMA);
/** 3.97 Np/m × 8.686 = 34.5 dB per metre. */
const SEA_DB_PER_M_1MHZ = nepersToDb(SEA_ALPHA_1MHZ);
/** A 25 m-deep submarine sits 25/0.252 ≈ 99 skin depths down. */
const SEA_NP_25M_1MHZ = 25 / SEA_SKIN_1MHZ;
/** ≈ 99 Np ≈ 863 dB of path loss at 1 MHz. */
const SEA_DB_25M_1MHZ = nepersToDb(SEA_NP_25M_1MHZ);
/** Skin depth at 10 kHz: f ÷ 100 ⇒ δs × 10 = 2.52 m. */
const SEA_SKIN_10KHZ = skinDepth(1e4, SEA_SIGMA);
/** 10 m of depth at 10 kHz costs 10/2.52 = 3.97 Np. */
const SEA_NP_10M_10KHZ = 10 / SEA_SKIN_10KHZ;
/** = 34.5 dB — the same loss one metre cost at 1 MHz. */
const SEA_DB_10M_10KHZ = nepersToDb(SEA_NP_10M_10KHZ);
/** Copper (σ = 5.8×10⁷ S/m) at 1 GHz: δs = 2.1 μm. */
const COPPER_SKIN_UM_1GHZ = skinDepth(1e9, 5.8e7) * 1e6;
/** Glass (εr = 2.25, n = 1.5): η = η₀/1.5 = 251.2 Ω. */
const ETA_GLASS = intrinsicImpedance(2.25);
/** Air → glass: Γ = (251.2 − 376.7)/(251.2 + 376.7) = −0.200. */
const GAMMA_GLASS = normalIncidenceGamma(ETA0, ETA_GLASS);
/** Air → glass: τ = 1 + Γ = 0.800. */
const TAU_GLASS = normalIncidenceTau(ETA0, ETA_GLASS);
/** Air → glass reflected power Γ² = 0.040 (4%). */
const REFL_GLASS = reflectedPowerFraction(GAMMA_GLASS);

const Q_INTRINSIC: QuizQuestion = {
  question:
    'In free space E₀/H₀ = 377 Ω for any travelling EM wave. What does this "impedance of free space" physically represent?',
  options: [
    'A resistance of vacuum that converts wave energy into heat',
    'The fixed ratio of E to H amplitudes in a travelling wave — no dissipation involved',
    'The resistance an ohmmeter would read between two points in empty space',
    'The input impedance of every antenna',
  ],
  correctIndex: 1,
  explanation:
    'η = √(μ/ε) is a wave impedance: it fixes the E/H ratio the medium permits a travelling wave to have, exactly as a transmission line\'s Z₀ fixes V/I. Nothing dissipates — vacuum is lossless; 377 Ω describes energy in transit, not energy converted to heat. (Antenna input impedance is a different, geometry-dependent quantity — the half-wave dipole\'s ~73 Ω from the Antennas section.)',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Compare with a cable\'s characteristic impedance Z₀ = V/I for a travelling wave.' },
    { tier: 2, label: 'Procedural hint', content: 'Does a wave crossing vacuum lose energy? Then what kind of "ohms" can 377 Ω be?' },
    { tier: 3, label: 'Show worked step', content: 'It is the ratio η = E/H enforced by μ₀ and ε₀ — a property of propagation, not dissipation. Option B.' },
  ],
};

const Q_LOSSTAN: QuizQuestion = {
  question:
    'Which single dimensionless ratio decides whether a material behaves as a conductor or as a dielectric at a given frequency?',
  options: ['σ/(ωε) — the loss tangent', 'μ/ε', 'E/H', 'The refractive index n'],
  correctIndex: 0,
  explanation:
    'tan δ = σ/(ωε) compares conduction current (σE) to displacement current (ωεE). ≫1 ⇒ conductor, ≪1 ⇒ dielectric — and because ω sits in the denominator, the SAME material flips class with frequency: seawater is a solid conductor at 1 MHz (tan δ ≈ 888) but, on the ideal constant-σ model, drops to tan δ ≈ 0.009 at 100 GHz, dielectric territory (real water adds relaxation losses up there, but the classification logic stands).',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Compare the two current densities in Ampère–Maxwell: σE versus ωεE.' },
    { tier: 2, label: 'Procedural hint', content: 'Their ratio is σ/(ωε). What happens to it as ω grows?' },
    { tier: 3, label: 'Show worked step', content: 'σ/(ωε) ≫ 1 conductor, ≪ 1 dielectric — option A.' },
  ],
};

const EPSR_PRESETS: { label: string; value: number; caption: string }[] = [
  { label: 'Air (1)', value: 1, caption: 'No step, no echo — identical impedances reflect nothing.' },
  { label: 'Glass (2.25)', value: 2.25, caption: 'Γ = −0.200: 4% of the power reflects, 96% gets through.' },
  {
    label: 'Seawater-RF (81)',
    value: 81,
    caption: '64% of the power bounces — which is why radar pings bounce off the sea and fish-finders must live IN the water.',
  },
];

/**
 * Two-media normal-incidence interface explorer: static SVG + readouts (no
 * canvas, no rAF). All numbers flow through mediaMath; arrow lengths are
 * AMPLITUDE-proportional while the readout percentages are power.
 */
function MediaInterfacePanel() {
  const [epsR, setEpsR] = useState(2.25);

  const eta2 = intrinsicImpedance(epsR);
  const gamma = normalIncidenceGamma(ETA0, eta2);
  const tau = normalIncidenceTau(ETA0, eta2);
  const reflected = reflectedPowerFraction(gamma);
  const reflectedPct = (reflected * 100).toFixed(1);
  const transmittedPct = ((1 - reflected) * 100).toFixed(1);

  const reflLen = 100 * Math.abs(gamma);
  const transLen = 100 * tau;
  const presetCaption = EPSR_PRESETS.find((p) => p.value === epsR)?.caption;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md p-4 space-y-4">
      <svg
        viewBox="0 0 400 140"
        className="w-full h-auto"
        role="img"
        aria-label={`Interface: Γ = ${fixedMinus(gamma, 3)}, ${reflectedPct}% reflected, ${transmittedPct}% transmitted`}
      >
        {/* Medium 2 tint + boundary */}
        <rect x="200" y="0" width="200" height="140" className="fill-slate-200/60 dark:fill-slate-600/40" />
        <line x1="200" y1="0" x2="200" y2="140" strokeWidth="2" className="stroke-slate-400 dark:stroke-slate-500" />
        <text x="100" y="16" textAnchor="middle" fontSize="10" className="fill-slate-600 dark:fill-slate-300">
          Medium 1 — air, η₁ = {ETA0.toFixed(1)} Ω
        </text>
        <text x="300" y="16" textAnchor="middle" fontSize="10" className="fill-slate-600 dark:fill-slate-300">
          Medium 2 — ε_r = {epsR}, η₂ = {eta2.toFixed(1)} Ω
        </text>
        {/* Incident arrow (amplitude 1 → 100 px) */}
        <line x1="60" y1="55" x2="160" y2="55" stroke="#dc2626" strokeWidth="3" />
        <polygon points="160,49 172,55 160,61" fill="#dc2626" />
        <text x="110" y="44" textAnchor="middle" fontSize="9" className="fill-slate-500 dark:fill-slate-400">
          incident
        </text>
        {/* Reflected arrow (length 100·|Γ| px, dashed) */}
        {reflLen > 1 && (
          <>
            <line x1="160" y1="92" x2={160 - reflLen} y2="92" stroke="#dc2626" strokeWidth="3" strokeDasharray="6 4" />
            <polygon points={`${160 - reflLen - 12},92 ${160 - reflLen},86 ${160 - reflLen},98`} fill="#dc2626" />
            <text x={160 - reflLen / 2} y="110" textAnchor="middle" fontSize="9" className="fill-slate-500 dark:fill-slate-400">
              reflected
            </text>
          </>
        )}
        {/* Transmitted arrow (length 100·τ px, into medium 2) */}
        <line x1="208" y1="55" x2={208 + transLen} y2="55" stroke="#2563eb" strokeWidth="3" />
        <polygon points={`${208 + transLen + 12},55 ${208 + transLen},49 ${208 + transLen},61`} fill="#2563eb" />
        <text x={208 + transLen / 2} y="44" textAnchor="middle" fontSize="9" className="fill-slate-500 dark:fill-slate-400">
          transmitted
        </text>
      </svg>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Arrow lengths show field amplitude; the percentages below are power.
      </p>

      <Slider label="ε_r of medium 2" value={epsR} min={1} max={81} step={0.05} displayDecimals={2} onChange={setEpsR} />

      <div className="flex flex-wrap gap-2">
        {EPSR_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setEpsR(p.value)}
            aria-pressed={epsR === p.value}
            className={`px-3 py-1 rounded text-xs font-bold border ${
              epsR === p.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        {[
          { label: 'η₂', value: `${eta2.toFixed(1)} Ω` },
          { label: 'Γ', value: fixedMinus(gamma, 3) },
          { label: 'Reflected power', value: `${reflectedPct}%` },
          { label: 'Transmitted power', value: `${transmittedPct}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {presetCaption && (
        <p className="text-xs italic text-slate-500 dark:text-slate-400">{presetCaption}</p>
      )}
    </div>
  );
}

interface RealMediaProps {
  /** Wired to incrementConceptChecks('em-wave') by the section index. */
  onCheckComplete: () => void;
  /** Wired to incrementHints('em-wave') by the section index. */
  onCheckHint: () => void;
  /** Wired to markPredictionGate('em-wave', correct) by the section index. */
  onGatePredict: (correct: boolean) => void;
}

/**
 * "Waves in Real Media" block for em-wave 4.2: intrinsic impedance, loss
 * tangent / skin depth, and the gated two-media interface panel. All progress
 * wiring stays in the section index (props), all arithmetic in ./mediaMath.
 */
export function RealMedia({ onCheckComplete, onCheckHint, onGatePredict }: RealMediaProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Waves in Real Media</h3>

      {/* ── (a) Intrinsic impedance ── */}
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">
          Intrinsic impedance — what the medium charges per field
        </h4>
        <p>
          In any travelling EM wave the E and H amplitudes are locked in a fixed ratio set by the medium
          alone: <MathWrapper formula="\eta = \sqrt{\mu/\varepsilon}" /> — the{' '}
          <strong>intrinsic impedance</strong> (units: V/m ÷ A/m = Ω). For free space:
        </p>
        <div className="font-mono text-xs bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-slate-700 dark:text-slate-300">
          <p>η₀ = √(μ₀/ε₀) = √(1.2566×10⁻⁶ / 8.8542×10⁻¹²)</p>
          <p>&nbsp;&nbsp;&nbsp;= √(1.4193×10⁵) = {ETA0.toFixed(1)} Ω ≈ 120π ≈ 377 Ω</p>
        </div>
        <p>
          For a non-magnetic dielectric{' '}
          <MathWrapper formula="\eta = \eta_0/\sqrt{\varepsilon_r} = \eta_0/n" />: glass (n = 1.5, ε_r = 2.25)
          → 376.73/1.5 = {ETA_GLASS.toFixed(1)} Ω — the medium dropdown you have been using just acquired a
          brand-new meaning.
        </p>
        <p>
          Part 5 will hand you the circuit twin of this number: a cable's{' '}
          <MathWrapper formula="Z_0 = \sqrt{L'/C'}" /> — same idea, volts-per-amp of a travelling wave, and
          the same reflection formula below.
        </p>
      </div>

      <ConceptCheck data={toConceptCheck(Q_INTRINSIC)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── (b) Conductor or dielectric? The loss tangent ── */}
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">
          Conductor or dielectric? One ratio decides
        </h4>
        <p>
          The <strong>loss tangent</strong>{' '}
          <MathWrapper formula="\tan\delta = \dfrac{\sigma}{\omega\varepsilon}" /> compares conduction current
          to displacement current. <MathWrapper formula="\gg 1" />: conductor (the wave is mostly eaten);{' '}
          <MathWrapper formula="\ll 1" />: low-loss dielectric (the wave mostly propagates). The same material
          switches class with frequency.
        </p>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">
            Seawater swallows radio (σ = 4 S/m, ε_r = 81)
          </p>
          <ol className="list-decimal list-outside ml-5 space-y-2">
            <li>
              <em>Classify at f = 1 MHz:</em> ωε = 2π·10⁶ · 81 · 8.854×10⁻¹² = 4.506×10⁻³ S/m, so
              tan δ = 4 / 4.506×10⁻³ ≈ {SEA_TAN_1MHZ.toFixed(0)} ≫ 1 — seawater is a{' '}
              <strong>good conductor</strong> at 1 MHz.
            </li>
            <li>
              <em>Attenuation (good-conductor limit):</em>{' '}
              <MathWrapper formula="\alpha = \sqrt{\pi f \mu_0 \sigma}" /> = √(π·10⁶ · 1.2566×10⁻⁶ · 4) =
              √15.79 = {SEA_ALPHA_1MHZ.toFixed(2)} Np/m.
            </li>
            <li>
              <em>Skin depth:</em> <MathWrapper formula="\delta_s = 1/\alpha" /> ={' '}
              {SEA_SKIN_1MHZ.toFixed(3)} m — the field falls to 1/e in{' '}
              <strong>{(SEA_SKIN_1MHZ * 100).toFixed(0)} cm</strong> of seawater.
            </li>
            <li>
              <em>In engineering units:</em> 1 Np = 8.686 dB, so {SEA_ALPHA_1MHZ.toFixed(2)} × 8.686 ={' '}
              <strong>{SEA_DB_PER_M_1MHZ.toFixed(1)} dB per metre</strong>. A 25 m-deep submarine sits
              25/{SEA_SKIN_1MHZ.toFixed(3)} ≈ {SEA_NP_25M_1MHZ.toFixed(0)} skin depths down →
              ~{SEA_DB_25M_1MHZ.toFixed(0)} dB of path loss. No transmitter on Earth covers that.
            </li>
            <li>
              <em>The fix is frequency:</em> <MathWrapper formula="\delta_s \propto 1/\sqrt{f}" />. Drop to
              10 kHz (f ÷ 100 → δ_s × 10): δ_s = {SEA_SKIN_10KHZ.toFixed(2)} m, so 10 m of depth costs
              10/{SEA_SKIN_10KHZ.toFixed(2)} = {SEA_NP_10M_10KHZ.toFixed(2)} Np ={' '}
              <strong>{SEA_DB_10M_10KHZ.toFixed(1)} dB</strong> — the same loss one metre cost at 1 MHz, now
              survivable with a megawatt shore station. That is why submarine broadcast lives at VLF.
            </li>
          </ol>
        </div>

        <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4">
          <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
            Does this make sense?
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Copper (σ = 5.8×10⁷ S/m) at 1 GHz: <MathWrapper formula="\delta_s = 1/\sqrt{\pi f \mu_0 \sigma}" /> ={' '}
            {COPPER_SKIN_UM_1GHZ.toFixed(1)} μm. RF current lives in the outer couple of microns of a
            conductor — which is why good coax only needs a whisper of plating, and why the braid can be
            hollow.
          </p>
        </div>

        <YourTurnPanel
          scenario="Same seawater (σ = 4 S/m), but now an ELF-curious engineer proposes f = 10 kHz for a sensor floating just below the surface. You computed δ_s = 25 cm at 1 MHz."
          question="What is the skin depth at 10 kHz?"
          options={[
            {
              text: '≈ 2.5 m — δ_s ∝ 1/√f, and f fell by 100, so δ_s grows ×10',
              correct: true,
              explanation: 'Correct: δ_s = 1/√(πfμσ); f ÷ 100 ⇒ δ_s × √100 = ×10 ⇒ 2.52 m.',
            },
            {
              text: '≈ 25 m — δ_s ∝ 1/f, so ×100',
              correct: false,
              explanation: 'That is linear 1/f scaling — but f sits under a square root: ÷100 in f buys only ×10 in depth.',
            },
            {
              text: '≈ 25 cm — skin depth does not depend on frequency',
              correct: false,
              explanation: 'f is inside δ_s = 1/√(πfμσ) — frequency is the ONLY lever a designer has here.',
            },
            {
              text: '≈ 79 cm — δ_s grows by √10',
              correct: false,
              explanation: '×√10 would follow from f ÷ 10. Here f fell by a factor 100: √100 = 10.',
            },
          ]}
          correctReveal={
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <MathWrapper
                formula="\delta_s = \dfrac{1}{\sqrt{\pi f \mu_0 \sigma}} = \dfrac{1}{\sqrt{\pi \cdot 10^4 \cdot 1.2566\times10^{-6} \cdot 4}} = \dfrac{1}{0.397} = 2.52\ \text{m}"
                block
              />
              <p>Ten metres down now costs 34.5 dB instead of 863 dB. Frequency is the dial that opens the ocean.</p>
            </div>
          }
          hints={['Write δ_s with f under the square root before scaling.']}
        />
      </div>

      <ConceptCheck data={toConceptCheck(Q_LOSSTAN)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── (c) The two-media interface ── */}
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">The two-media interface</h4>
        <p>
          At a normal-incidence boundary the wave obeys the SAME reflection law a transmission-line junction
          does:
        </p>
        <div className="text-center py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <MathWrapper formula="\Gamma = \dfrac{\eta_2 - \eta_1}{\eta_2 + \eta_1} \qquad \tau = \dfrac{2\eta_2}{\eta_1 + \eta_2} = 1 + \Gamma" />
        </div>
        <p>
          with power split <MathWrapper formula="|\Gamma|^2" /> reflected and{' '}
          <MathWrapper formula="1 - |\Gamma|^2" /> transmitted. Worked example, air → glass:
        </p>
        <div className="font-mono text-xs bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-slate-700 dark:text-slate-300 space-y-1">
          <p>η₁ = {ETA0.toFixed(2)} Ω (air)&nbsp;&nbsp;&nbsp;η₂ = 376.73/1.5 = {ETA_GLASS.toFixed(2)} Ω (glass, n = 1.5)</p>
          <p>Γ&nbsp; = (251.15 − 376.73)/(251.15 + 376.73) = −125.58/627.88 = {fixedMinus(GAMMA_GLASS, 3)}</p>
          <p>τ&nbsp; = 1 + Γ = {TAU_GLASS.toFixed(3)}</p>
          <p>reflected power&nbsp; = Γ² = {REFL_GLASS.toFixed(3)}&nbsp; (4%)</p>
          <p>transmitted power = 1 − Γ² = {(1 - REFL_GLASS).toFixed(3)}&nbsp; (96%)</p>
          <p>cross-check: τ²·(η₁/η₂) = 0.64 × 1.5 = 0.96 ✓&nbsp; (power balances exactly)</p>
          <p>independent check via n: Γ = (1−n)/(1+n) = −0.5/2.5 = −0.200 ✓</p>
        </div>
        <p>
          The minus sign means the reflected E flips phase — exactly like a line hitting a LOWER Z₀ load. And
          a window pane has two surfaces: 0.96² = 0.9216, so ~8% of light never makes it through — you have
          seen this number every time you noticed your reflection in a shop window.
        </p>
      </div>

      <PredictionGate
        question="A radio wave in air hits a thick glass wall (ε_r = 2.25) head-on. What fraction of the incident POWER reflects back?"
        options={[
          { id: 'four', label: '4%' },
          { id: 'twenty', label: '20%' },
          { id: 'zero', label: '0% — glass is transparent' },
          { id: 'thirtythree', label: '33%' },
        ]}
        getCorrectAnswer={() => 'four'}
        explanation={<span>The impedance step does the reflecting: <MathWrapper formula="\Gamma = \frac{\eta_2-\eta_1}{\eta_2+\eta_1} = \frac{251-377}{251+377} = -0.20" />, and power goes as the square: <MathWrapper formula="|\Gamma|^2 = 0.04" /> — 4%. (20% is the <em>amplitude</em> ratio; transparent only means the other 96% gets through.)</span>}
        onPredict={onGatePredict}
      >
        <MediaInterfacePanel />
      </PredictionGate>

      {/* ── (d) Closing bridge ── */}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Both halves of this section meet in Part 5: a transmission line is a wave in a really well-organized
        medium — <MathWrapper formula="Z_0" /> plays η, the load plays medium 2, and Γ is the very same
        formula. When you get there, you will already know it.
      </p>
    </div>
  );
}
