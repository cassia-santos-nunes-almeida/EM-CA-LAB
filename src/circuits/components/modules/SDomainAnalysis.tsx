import { useEffect, useState } from 'react';
import { BookOpen, Activity, FlaskConical, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { Tabs } from '@circuits/components/common/Tabs';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';

function TheoryTab() {
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);

  return (
    <div className="space-y-6">
      <FigureImage
        className="mb-6"
        src={`${import.meta.env.BASE_URL}figures/bode-plot.png`}
        alt="Bode plot showing magnitude and phase response"
        caption="A Bode plot: frequency response directly derivable from the transfer function H(s)."
        attribution="Wikimedia Commons, Public Domain"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Asymptotic_Bode_plot.svg"
      />

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Transfer Function Fundamentals</h2>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Definition:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              A transfer function <MathWrapper formula="H(s)" /> is the ratio of the output to input
              in the s-domain, assuming zero initial conditions.
            </p>
            <MathWrapper formula="H(s) = \frac{Y(s)}{X(s)} = \frac{N(s)}{D(s)}" block />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Poles</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Values of <MathWrapper formula="s" /> where <MathWrapper formula="D(s) = 0" />
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Poles determine system stability and transient response characteristics.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Zeros</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Values of <MathWrapper formula="s" /> where <MathWrapper formula="N(s) = 0" />
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Zeros affect the magnitude and phase of the frequency response.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">RLC Circuit Transfer Function</h2>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">For a series RLC circuit:</p>
            <MathWrapper formula="H(s) = \frac{V_C(s)}{V_s(s)} = \frac{\omega_0^2}{s^2 + 2\alpha s + \omega_0^2}" block />
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p>where:</p>
              <p><MathWrapper formula="\alpha = \frac{R}{2L}" /> = Damping coefficient</p>
              <p><MathWrapper formula="\omega_0 = \frac{1}{\sqrt{LC}}" /> = Natural frequency (rad/s)</p>
              <p><MathWrapper formula="\zeta = \frac{\alpha}{\omega_0} = \frac{R}{2}\sqrt{\frac{C}{L}}" /> = Damping ratio</p>
            </div>
          </div>

          <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Characteristic Equation:</p>
            <MathWrapper formula="s^2 + 2\alpha s + \omega_0^2 = 0" block />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              Poles: <MathWrapper formula="s_{1,2} = -\alpha \pm \sqrt{\alpha^2 - \omega_0^2}" />
            </p>
          </div>

          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/lc-tuned-circuit-oscillation.gif`}
            alt="Animation of energy oscillating between a capacitor and an inductor in an LC circuit"
            caption="Energy sloshing between a capacitor's electric field and an inductor's magnetic field — the lossless LC oscillation behind resonance and the s-plane poles."
            attribution="Chetvorno, CC0 Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Tuned_circuit_animation_3.gif"
          />
        </div>
      </section>

      <ConceptCheck data={{
        mode: 'multiple-choice',
        question: 'A system has poles at s = -3 ± 4j. Is it stable? What damping type?',
        options: [
          { text: 'Stable, underdamped', correct: true, explanation: 'Correct! Both poles have negative real parts (σ = -3 < 0), so the system is stable. The nonzero imaginary parts (±4j) indicate complex conjugate poles → underdamped response with oscillations.' },
          { text: 'Unstable, underdamped', correct: false, explanation: 'The real part is -3, which is negative. Poles in the left half-plane mean the system is stable.' },
          { text: 'Stable, overdamped', correct: false, explanation: 'Overdamped systems have two distinct real poles (no imaginary part). These poles have imaginary parts ±4j, so the response oscillates → underdamped.' },
          { text: 'Stable, critically damped', correct: false, explanation: 'Critical damping requires repeated real poles (same location, no imaginary part). These are complex conjugate poles → underdamped.' },
        ],
      }}
        onComplete={() => incrementConceptChecks('s-domain')}
        onHint={() => incrementHints('s-domain')}
      />

      <Link
        to="/interactive-lab"
        className="flex items-center gap-4 p-5 rounded-lg bg-gradient-to-r from-engineering-blue-50 to-indigo-50 dark:from-engineering-blue-900/20 dark:to-indigo-900/20 border border-engineering-blue-200 dark:border-engineering-blue-800 hover:shadow-md transition-all hover:-translate-y-0.5 group"
      >
        <div className="w-10 h-10 rounded-xl bg-engineering-blue-100 dark:bg-engineering-blue-900/50 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-engineering-blue-600 dark:text-engineering-blue-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-engineering-blue-900 dark:text-engineering-blue-200 text-sm">Try it in the Interactive Lab</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compute transfer functions, visualize poles on the s-plane, and see how R, L, C affect stability — all in real time.
          </p>
        </div>
        <Activity className="w-4 h-4 text-engineering-blue-400 dark:text-engineering-blue-500 group-hover:text-engineering-blue-600 dark:group-hover:text-engineering-blue-300 transition-colors shrink-0" />
      </Link>
    </div>
  );
}

function DampingTab() {
  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Damping Behavior</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 p-5 rounded-lg border-2 border-blue-300 dark:border-blue-700">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Underdamped (ζ &lt; 1)
            </h4>
            <div className="mb-3">
              <MathWrapper formula="\alpha < \omega_0" block />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Poles:</strong> Complex conjugate pair
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Response:</strong> Oscillatory with exponential decay
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Common in lightly damped resonant circuits. Exhibits ringing and overshoot.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-800 p-5 rounded-lg border-2 border-green-300 dark:border-green-700">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              Critically Damped (ζ = 1)
            </h4>
            <div className="mb-3">
              <MathWrapper formula="\alpha = \omega_0" block />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Poles:</strong> Two identical real poles
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Response:</strong> Fastest rise time without overshoot
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Ideal for control systems requiring fast settling without oscillation.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800 p-5 rounded-lg border-2 border-amber-300 dark:border-amber-700">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
              Overdamped (ζ &gt; 1)
            </h4>
            <div className="mb-3">
              <MathWrapper formula="\alpha > \omega_0" block />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Poles:</strong> Two distinct real poles
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <strong>Response:</strong> Slow exponential approach, no overshoot
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Heavily damped systems. Slow to reach steady state but very stable.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-engineering-blue-50 to-slate-50 dark:from-engineering-blue-900/20 dark:to-slate-800 rounded-lg shadow-md p-6 border-l-4 border-engineering-blue-600">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Key Takeaways</h3>
        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">•</span>
            <span>
              Transfer functions provide a complete description of system dynamics in the s-domain.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">•</span>
            <span>
              Pole locations determine stability and transient behavior. Poles in the left half-plane
              indicate stability.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">•</span>
            <span>
              The damping ratio ζ predicts oscillatory behavior: ζ &lt; 1 gives oscillations,
              ζ = 1 is optimal damping, ζ &gt; 1 is sluggish.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">•</span>
            <span>
              Natural frequency ω₀ determines how fast the system responds, while α controls
              the rate of decay.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}

const readThePlotCases = [
  {
    id: 'A',
    title: 'Case A',
    poles: [{ x: -1, y: 0 }, { x: -4, y: 0 }],
    domain: { x: [-6, 1], y: [-3, 3] },
    options: [
      { text: 'Overdamped — stable, no oscillation, two exponential decay terms', correct: true, explanation: 'Correct! Two real negative poles produce a stable response with no oscillation. Each pole contributes an exponential decay term e^(st), and since both s values are real and negative, the response decays smoothly.' },
      { text: 'Underdamped — stable, oscillatory decay', correct: false, explanation: 'Underdamped requires complex conjugate poles. These poles are both real.' },
      { text: 'Marginally stable — sustained oscillation', correct: false, explanation: 'Marginally stable requires poles on the imaginary axis (zero real part). These poles are at s = -1 and s = -4.' },
      { text: 'Unstable — response grows without bound', correct: false, explanation: 'Unstable requires at least one pole in the right half-plane (positive real part). Both poles here have negative real parts.' },
    ],
    callout: 'The pole at s = -4 decays four times faster than the pole at s = -1. After a few time constants of 1/4 = 0.25s, only the slower mode (s = -1) dominates.',
  },
  {
    id: 'B',
    title: 'Case B',
    poles: [{ x: -2, y: 3 }, { x: -2, y: -3 }],
    domain: { x: [-5, 1], y: [-5, 5] },
    options: [
      { text: 'Underdamped — stable, oscillatory decay', correct: true, explanation: 'Correct! Complex conjugate poles with negative real parts produce a decaying sinusoid. The real part (-2) sets the decay rate, and the imaginary part (±3) sets the oscillation frequency.' },
      { text: 'Overdamped — stable, no oscillation', correct: false, explanation: 'Overdamped requires two distinct real poles. These poles have imaginary parts (±3j), which produce oscillation.' },
      { text: 'Marginally stable — sustained oscillation', correct: false, explanation: 'Marginally stable requires the real part to be exactly zero. These poles have real part = -2, so the oscillation decays.' },
      { text: 'Unstable — response grows without bound', correct: false, explanation: 'Unstable requires positive real parts. Both poles have negative real parts (-2), so the response decays.' },
    ],
    callout: 'The oscillation frequency is ω = 3 rad/s and the envelope decays as e^(-2t). After t = 1/2 = 0.5s, the amplitude drops to 37% of its initial value.',
  },
  {
    id: 'C',
    title: 'Case C',
    poles: [{ x: 0, y: 4 }, { x: 0, y: -4 }],
    domain: { x: [-3, 3], y: [-6, 6] },
    options: [
      { text: 'Marginally stable — sustained oscillation', correct: true, explanation: 'Correct! Poles on the imaginary axis (zero real part) produce a pure sinusoid that neither grows nor decays. The response oscillates forever at ω = 4 rad/s.' },
      { text: 'Underdamped — stable, oscillatory decay', correct: false, explanation: 'Underdamped requires negative real parts. These poles have zero real part, so the oscillation sustains indefinitely.' },
      { text: 'Overdamped — stable, no oscillation', correct: false, explanation: 'These poles are complex (imaginary parts ±4j), which always produces oscillation.' },
      { text: 'Unstable — response grows without bound', correct: false, explanation: 'Unstable requires poles in the right half-plane (positive real part). These are exactly on the boundary.' },
    ],
    callout: 'In practice, marginally stable circuits don\'t stay perfectly stable — any tiny perturbation pushes them toward instability. This is why real oscillator circuits need nonlinear limiting.',
  },
  {
    id: 'D',
    title: 'Case D',
    poles: [{ x: 1, y: 2 }, { x: 1, y: -2 }],
    domain: { x: [-2, 3], y: [-4, 4] },
    options: [
      { text: 'Unstable — response grows without bound', correct: true, explanation: 'Correct! Poles in the right half-plane (positive real part) produce a growing exponential. The response grows as e^(+t) while oscillating at ω = 2 rad/s — it blows up.' },
      { text: 'Underdamped — stable, oscillatory decay', correct: false, explanation: 'The imaginary parts cause oscillation, but the positive real part (+1) means the envelope grows instead of decaying.' },
      { text: 'Marginally stable — sustained oscillation', correct: false, explanation: 'Marginally stable requires zero real parts. These poles have real part = +1, firmly in the right half-plane.' },
      { text: 'Overdamped — stable, no oscillation', correct: false, explanation: 'These poles are complex (they oscillate) and in the right half-plane (they\'re unstable). Nothing about this is overdamped or stable.' },
    ],
    callout: 'This is exactly what happens when feedback goes wrong — a pole crosses into the right half-plane and the system oscillates with growing amplitude until something limits it (or breaks).',
  },
];

const poleChartColors = { grid: '#e2e8f0', text: '#475569' };

function ReadThePlotTab() {
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);

  return (
    <div className="space-y-8">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Read the Plot</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          Given a pole-zero plot, identify the system&apos;s time-domain behavior. For each case, examine where the poles
          are in the s-plane and determine what that means for stability and transient response.
        </p>
      </section>

      {readThePlotCases.map((caseData) => (
        <section key={caseData.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{caseData.title}</h3>

          {/* Pole-zero plot */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={poleChartColors.grid} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Real"
                  tick={{ fill: poleChartColors.text, fontSize: 11 }}
                  label={{ value: 'Real (σ)', position: 'insideBottom', offset: -8, fill: poleChartColors.text, fontSize: 11 }}
                  domain={caseData.domain.x as [number, number]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Imaginary"
                  tick={{ fill: poleChartColors.text, fontSize: 11 }}
                  label={{ value: 'Imag (jω)', angle: -90, position: 'insideLeft', fill: poleChartColors.text, fontSize: 11 }}
                  domain={caseData.domain.y as [number, number]}
                />
                <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
                <Scatter
                  name="Poles"
                  data={caseData.poles}
                  fill="#ef4444"
                  shape="cross"
                  line={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
              Poles: {caseData.poles.map((p, i) => `s${i + 1} = ${p.x}${p.y !== 0 ? `${p.y > 0 ? '+' : ''}${p.y}j` : ''}`).join(', ')}
            </p>
          </div>

          {/* Multiple choice */}
          <ConceptCheck data={{
            mode: 'multiple-choice',
            question: 'What time-domain behavior does this pole configuration produce?',
            options: caseData.options,
          }}
            onComplete={() => incrementConceptChecks('s-domain')}
            onHint={() => incrementHints('s-domain')}
          />

          {/* Does this make sense? callout */}
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            {caseData.callout}
          </p>
        </section>
      ))}

      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
        A pole at s = -100 decays much faster than one at s = -1. Is that consistent with the e<sup>st</sup> form of the solution?
      </p>
    </div>
  );
}

export function SDomainAnalysis() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { markVisited('s-domain'); }, [markVisited]);

  return (
    <div className="space-y-8">
      <SectionHook text="Every audio amplifier, every feedback control system, every switching power supply has a pole-zero plot. Stability, bandwidth, and transient behavior are all visible in that plot before a single component is chosen." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('s-domain')}
          </span>
          S-Domain Theory
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Transfer functions, poles, zeros, and stability analysis
        </p>
      </div>

      <PredictionGate
        initialPassed={unlocked}
        onPassed={() => setUnlocked(true)}
        question="A second-order system has poles at s = +1 ± 2j (right half-plane). Is it stable?"
        options={[
          { id: 'unstable', label: 'Unstable — the response grows without bound' },
          { id: 'stable', label: 'Stable — it decays' },
          { id: 'marginal', label: 'Marginally stable — sustained oscillation' },
          { id: 'cant', label: "Can't tell from pole location" },
        ]}
        getCorrectAnswer={() => 'unstable'}
        explanation={<span>Any pole with a positive real part (right half-plane) makes the response grow as e^(+σt). The ±2j gives oscillation, but the +1 real part means it blows up — unstable.</span>}
        onPredict={(correct) => markPredictionGate('s-domain', correct)}
      >
        <Tabs
          tabs={[
            {
              label: 'Theory',
              icon: <BookOpen className="w-4 h-4" />,
              content: <TheoryTab />,
            },
            {
              label: 'Damping & Takeaways',
              icon: <Activity className="w-4 h-4" />,
              content: <DampingTab />,
            },
            {
              label: 'Read the Plot',
              icon: <Search className="w-4 h-4" />,
              content: <ReadThePlotTab />,
            },
          ]}
        />
      </PredictionGate>

      <CourseNavigation />
    </div>
  );
}
