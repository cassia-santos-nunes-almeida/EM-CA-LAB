import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { Tabs } from '@shared/components/common/Tabs';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { laplaceTransforms, laplaceProperties } from '@circuits/utils/componentMath';
import { BookOpen, Zap as ZapIcon, ArrowRightLeft, Table2 } from 'lucide-react';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { LaplaceMotivation } from '@circuits/components/modules/LaplaceMotivation';

interface TheoryTabProps {
  /** Lifted gate state — persists the motivation gate's unlock across tab remounts. */
  motivationPassed: boolean;
  onMotivationPassed: () => void;
}

function TheoryTab({ motivationPassed, onMotivationPassed }: TheoryTabProps) {
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);

  return (
    <div className="space-y-6">
      <FigureImage
        className="mb-6"
        src={`${import.meta.env.BASE_URL}figures/pierre-simon-laplace.jpg`}
        alt="Portrait of Pierre-Simon Laplace"
        caption="Pierre-Simon Laplace (1749–1827): his integral transform converts differential equations into algebraic ones."
        attribution="Public Domain — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Pierre-Simon_Laplace.jpg"
      />

      <LaplaceMotivation initialPassed={motivationPassed} onPassed={onMotivationPassed} />

      {/* Definition */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-engineering-blue-600 dark:text-engineering-blue-400 mt-1" />
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Definition</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The Laplace Transform converts a function of time <MathWrapper formula="f(t)" /> into
              a function of complex frequency <MathWrapper formula="F(s)" />, where{' '}
              <MathWrapper formula="s = \sigma + j\omega" /> is a complex variable.
            </p>

            <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 p-4 rounded-lg">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Forward Laplace Transform:</p>
              <MathWrapper formula="\mathcal{L}\{f(t)\} = F(s) = \int_0^\infty f(t)e^{-st}dt" block />
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mt-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Inverse Laplace Transform:</p>
              <MathWrapper formula="\mathcal{L}^{-1}\{F(s)\} = f(t) = \frac{1}{2\pi j}\int_{\sigma-j\infty}^{\sigma+j\infty}F(s)e^{st}ds" block />
            </div>
          </div>
        </div>
      </section>

      {/* Why Use */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <ZapIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-1" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Why Use Laplace Transforms?</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">1. Simplification</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Converts differential equations into algebraic equations, making them much easier to solve.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-engineering-blue-900 dark:text-engineering-blue-300 mb-2">2. Initial Conditions</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Naturally incorporates initial conditions into the transformed equation.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">3. System Analysis</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Provides insight into system behavior through poles and zeros in the s-plane.
            </p>
          </div>
        </div>

        {/* Process flow diagram */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-5 border border-slate-200 dark:border-slate-600">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">The Laplace Transform Process</h4>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Time Domain</p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Differential Eq.</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500 font-bold text-lg">&rarr;</div>
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Laplace Transform</p>
              <p className="text-sm font-semibold text-green-900 dark:text-green-200">Algebraic Eq.</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500 font-bold text-lg">&rarr;</div>
            <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Solve in s-domain</p>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">Y(s)</p>
            </div>
            <div className="text-slate-400 dark:text-slate-500 font-bold text-lg">&rarr;</div>
            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Inverse Transform</p>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">y(t) Solution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section className="bg-amber-50 dark:bg-amber-900/20 rounded-lg shadow-md p-6 border-l-4 border-amber-500">
        <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-300 mb-3">Key Insights</h3>
        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">&bull;</span>
            <span>
              The Laplace transform is a powerful tool that converts calculus problems (differentiation,
              integration) into algebra problems (multiplication, division).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">&bull;</span>
            <span>
              Initial conditions are automatically incorporated through the differentiation property.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">&bull;</span>
            <span>
              The inverse transform often requires partial fraction decomposition to match standard
              transform pairs.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">&bull;</span>
            <span>
              For circuit analysis, the s-domain representation provides deep insight into system
              behavior through pole and zero locations.
            </span>
          </li>
        </ul>
      </section>

      <ConceptCheck data={{
        mode: 'multiple-choice',
        question: 'What does the Laplace Transform do to a derivative df/dt in the time domain?',
        options: [
          { text: 'Multiplies by s and subtracts the initial condition: sF(s) - f(0)', correct: true, explanation: 'Correct! The differentiation property converts d/dt into multiplication by s, and the initial condition f(0) is subtracted. This is why Laplace Transforms naturally handle initial conditions.' },
          { text: 'Divides by s: F(s)/s', correct: false, explanation: 'Division by s corresponds to integration, not differentiation. The Laplace Transform of an integral is F(s)/s.' },
          { text: 'Takes the derivative of F(s): dF/ds', correct: false, explanation: 'The derivative of F(s) with respect to s corresponds to multiplying f(t) by -t, not to differentiation in time.' },
          { text: 'Leaves it unchanged: F(s)', correct: false, explanation: 'The Laplace Transform changes the operation — differentiation in time becomes multiplication by s in the s-domain. This is the key simplification.' },
        ],
      }}
        onComplete={() => incrementConceptChecks('laplace-theory')}
        onHint={() => incrementHints('laplace-theory')}
      />
    </div>
  );
}

function TablesTab() {
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);

  return (
    <div className="space-y-6">
      {/* Transform Pairs Table */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Common Laplace Transform Pairs
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-engineering-blue-50 dark:bg-engineering-blue-900/30">
                <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">#</th>
                <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">Time Domain f(t)</th>
                <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">S-Domain F(s)</th>
                <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">Description</th>
              </tr>
            </thead>
            <tbody>
              {laplaceTransforms.map((transform, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/50'}>
                  <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-mono">{index + 1}</td>
                  <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                    <MathWrapper formula={transform.function} />
                  </td>
                  <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                    <MathWrapper formula={transform.transform} />
                  </td>
                  <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {transform.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Important Properties as a proper table */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Important Properties
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-engineering-blue-50 dark:bg-engineering-blue-900/30">
                <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">#</th>
                <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">Property</th>
                <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">Formula</th>
              </tr>
            </thead>
            <tbody>
              {laplaceProperties.map((property, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/50'}>
                  <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-mono">{index + 1}</td>
                  <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {property.property}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                    <MathWrapper formula={property.formula} />
                    {'caveat' in property && property.caveat && (
                      <p className="text-xs italic text-amber-600 dark:text-amber-400 mt-1">
                        ⚠ {property.caveat}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick-reference tip */}
      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 rounded-lg p-4 border-l-4 border-engineering-blue-500">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Tip:</span> When solving circuit problems, first convert all
          components to their s-domain equivalents using the impedance formulas, then use these transform
          pairs and properties to move between domains.
        </p>
      </div>

      <ConceptCheck data={{
        mode: 'predict-reveal',
        question: 'What is the Laplace Transform of f(t) = 5·sin(3t)·u(t)?',
        answer: 'Using the sine transform pair: L{sin(ωt)} = ω/(s² + ω²). With the linearity property: L{5·sin(3t)} = 5 · 3/(s² + 9) = 15/(s² + 9).',
      }}
        onComplete={() => incrementConceptChecks('laplace-theory')}
        onHint={() => incrementHints('laplace-theory')}
      />
    </div>
  );
}

function ExamplesTab() {
  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <ArrowRightLeft className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Worked Examples</h2>
        </div>

        <div className="space-y-4">
          <CollapsibleSection title="Example 1: Transform a Simple Function" defaultOpen>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Find the Laplace transform of <MathWrapper formula="f(t) = 3e^{-2t}" />
            </p>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mt-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Solution:</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Using linearity and the exponential transform:
              </p>
              <MathWrapper formula="\mathcal{L}\{3e^{-2t}\} = 3\mathcal{L}\{e^{-2t}\}" block />
              <MathWrapper formula="= 3 \cdot \frac{1}{s+2}" block />
              <MathWrapper formula="= \frac{3}{s+2}" block />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Example 2: Transform a Derivative">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Find <MathWrapper formula="\mathcal{L}\{\frac{df}{dt}\}" /> given <MathWrapper formula="f(0) = 5" />
            </p>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mt-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Solution:</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Using the differentiation property:
              </p>
              <MathWrapper formula="\mathcal{L}\{\frac{df}{dt}\} = sF(s) - f(0)" block />
              <MathWrapper formula="= sF(s) - 5" block />
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">
                This shows how initial conditions are naturally incorporated!
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Example 3: Inverse Transform Using Partial Fractions">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Find the inverse transform of <MathWrapper formula="F(s) = \frac{5}{s(s+2)}" />
            </p>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mt-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Solution:</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Step 1: Partial fraction decomposition
              </p>
              <MathWrapper formula="\frac{5}{s(s+2)} = \frac{A}{s} + \frac{B}{s+2}" block />
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 mb-2">
                Solving: <MathWrapper formula="A = 2.5" />, <MathWrapper formula="B = -2.5" />
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">
                Where do those numbers come from? The{' '}
                <Link to="/partial-fractions" className="underline">
                  Partial Fractions &amp; Heaviside
                </Link>{' '}
                section shows the ten-second method.
              </p>
              <MathWrapper formula="F(s) = \frac{2.5}{s} - \frac{2.5}{s+2}" block />
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 mb-2">
                Step 2: Inverse transform each term
              </p>
              <MathWrapper formula="f(t) = 2.5u(t) - 2.5e^{-2t}u(t)" block />
              <MathWrapper formula="f(t) = 2.5(1 - e^{-2t})u(t)" block />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Example 4: Solving a Differential Equation">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Solve: <MathWrapper formula="\frac{dy}{dt} + 3y = 6" />, with <MathWrapper formula="y(0) = 2" />
            </p>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mt-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Solution:</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Step 1: Take Laplace transform of both sides
              </p>
              <MathWrapper formula="\mathcal{L}\{\frac{dy}{dt}\} + 3\mathcal{L}\{y\} = \mathcal{L}\{6\}" block />
              <MathWrapper formula="sY(s) - y(0) + 3Y(s) = \frac{6}{s}" block />
              <MathWrapper formula="sY(s) - 2 + 3Y(s) = \frac{6}{s}" block />

              <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 mb-2">
                Step 2: Solve for Y(s)
              </p>
              <MathWrapper formula="Y(s)(s + 3) = \frac{6}{s} + 2" block />
              <MathWrapper formula="Y(s) = \frac{6 + 2s}{s(s + 3)} = \frac{2s + 6}{s(s + 3)}" block />

              <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 mb-2">
                Step 3: Partial fractions
              </p>
              <MathWrapper formula="Y(s) = \frac{2}{s} + \frac{0}{s+3} = \frac{2}{s}" block />

              <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 mb-2">
                Step 4: Inverse transform
              </p>
              <MathWrapper formula="y(t) = 2u(t)" block />
            </div>
          </CollapsibleSection>
        </div>
      </section>
    </div>
  );
}

export function LaplaceTheory() {
  const markVisited = useProgressStore((s) => s.markVisited);
  useEffect(() => { markVisited('laplace-theory'); }, [markVisited]);

  // Lift the motivation gate's unlocked state ABOVE the Tabs. The active panel
  // remounts on tab switch (key={activeIndex}), so holding this here keeps a
  // committed gate from re-locking when the student returns to the Theory tab.
  const [motivationPassed, setMotivationPassed] = useState(false);

  return (
    <div className="space-y-8">
      <SectionHook text="Oliver Heaviside developed the operational calculus that became Laplace transforms in the 1880s, largely to analyze telegraph lines. He was self-taught, often wrong in his methods, and completely right in his results. The transform tables you use today are his legacy." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('laplace-theory')}
          </span>
          Laplace Transform Theory
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Mathematical foundation for s-domain circuit analysis
        </p>
      </div>

      <Tabs
        tabs={[
          {
            label: 'Theory & Why Use',
            icon: <BookOpen className="w-4 h-4" />,
            content: <TheoryTab motivationPassed={motivationPassed} onMotivationPassed={() => setMotivationPassed(true)} />,
          },
          {
            label: 'Tables & Properties',
            icon: <Table2 className="w-4 h-4" />,
            content: <TablesTab />,
          },
          {
            label: 'Worked Examples',
            icon: <ArrowRightLeft className="w-4 h-4" />,
            content: <ExamplesTab />,
          },
        ]}
      />

      <CourseNavigation />
    </div>
  );
}
