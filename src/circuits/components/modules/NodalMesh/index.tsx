import { useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { LabStation } from '@shared/components/common/LabStation';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { BridgeDiagram } from './BridgeDiagram';
import { NodeEquationBuilder } from './NodeEquationBuilder';
import { MeshCurrentAssigner } from './MeshCurrentAssigner';

const SECTION_ID = 'nodal-mesh-analysis';

const tocEntries = [
  { id: 'puzzle', label: 'The Unreducible Bridge' },
  { id: 'node-builder', label: 'Lab: Node-Equation Builder' },
  { id: 'mesh-assigner', label: 'Lab: Mesh-Current Assigner' },
  { id: 'choosing', label: 'Choosing a Method' },
  { id: 'escapes', label: 'Supernode & Supermesh' },
  { id: 'challenge', label: 'Guided Challenge' },
];

const CHALLENGE = {
  title: 'Crack the Bridge Both Ways',
  description:
    'A guided run through both labs of this section, connecting the click-by-click equation building to the counting rule that decides which method to use.',
  instructions: [
    'In the Node-Equation Builder, choose the bottom node as reference and state why the source + node needs no equation.',
    'Deliberately pick a wrong sign for the R5 term and read the convention feedback — then pick the right one.',
    'Complete the solve and verify KCL closure at node A: 2.4 A in = 1.8 + 0.6 A out.',
    "In the Mesh-Current Assigner, set the arrows CCW/CW first to trigger the convention check, then build mesh 1's equation.",
    'Compare: 2 nodal unknowns vs 3 meshes for the bridge, but 2 meshes for the two-window circuit — state the counting rule in your own words.',
  ],
  hint: 'The shared element is always the interesting term — (V_A − V_B)/R in nodal, R(i_1 − i_2) in mesh.',
};

const TABLE_HEADER_CLASSES =
  'border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-4 py-3 text-left font-semibold text-slate-800 dark:text-slate-200';
const TABLE_CELL_CLASSES =
  'border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300';

/**
 * Static supernode example circuit: a 6 A source into node 1, a 5 V ideal
 * source floating between node 1 (+) and node 2, R1 = 5 Ω and R2 = 10 Ω to
 * ground, and a 2 A source out of node 2; a dashed boundary encloses both
 * nodes. Presentational only — a text description sits alongside.
 */
function SupernodeDiagram() {
  const markerId = useId();
  const wireColor = 'var(--circuit-wire)';
  const textColor = 'var(--circuit-text)';

  const verticalZigzag = (x: number, y1: number, y2: number): string => {
    const pts: string[] = [`${x},${y1}`];
    const span = y2 - y1;
    for (let i = 1; i <= 6; i++) {
      const dx = i % 2 === 1 ? -10 : 10;
      pts.push(`${x + dx},${y1 + (span * i) / 7}`);
    }
    pts.push(`${x},${y2}`);
    return pts.join(' ');
  };

  return (
    <svg
      viewBox="0 0 420 220"
      className="w-full h-auto [--circuit-wire:#334155] dark:[--circuit-wire:#94a3b8] [--circuit-text:#475569] dark:[--circuit-text:#94a3b8]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
        </marker>
      </defs>

      {/* Dashed supernode boundary around node 1, the 5 V source, and node 2 */}
      <rect x="118" y="38" width="184" height="46" rx="12" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="210" y="100" textAnchor="middle" fontSize="9" fontStyle="italic" fill="#f59e0b">supernode</text>

      {/* 6 A current source (into node 1) */}
      <line x1="60" y1="60" x2="60" y2="100" stroke={wireColor} strokeWidth="2" />
      <circle cx="60" cy="120" r="20" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <line x1="60" y1="130" x2="60" y2="110" stroke="#3b82f6" strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <text x="28" y="123" textAnchor="middle" fontSize="9" fill={textColor}>6 A</text>
      <line x1="60" y1="140" x2="60" y2="190" stroke={wireColor} strokeWidth="2" />
      <line x1="60" y1="60" x2="140" y2="60" stroke={wireColor} strokeWidth="2" />

      {/* Top rail: node 1 — 5 V source — node 2 */}
      <line x1="140" y1="60" x2="190" y2="60" stroke={wireColor} strokeWidth="2" />
      <circle cx="210" cy="60" r="20" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <text x="201" y="64" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">+</text>
      <text x="219" y="64" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">-</text>
      <text x="210" y="28" textAnchor="middle" fontSize="9" fill={textColor}>5 V</text>
      <line x1="230" y1="60" x2="280" y2="60" stroke={wireColor} strokeWidth="2" />

      {/* R1 = 5 Ω: node 1 → ground */}
      <line x1="140" y1="60" x2="140" y2="90" stroke={wireColor} strokeWidth="2" />
      <polyline points={verticalZigzag(140, 90, 160)} stroke="#ef4444" strokeWidth="2" fill="none" />
      <line x1="140" y1="160" x2="140" y2="190" stroke={wireColor} strokeWidth="2" />
      <text x="120" y="128" textAnchor="end" fontSize="9" fill={textColor}>R1 = 5&#937;</text>

      {/* R2 = 10 Ω: node 2 → ground */}
      <line x1="280" y1="60" x2="280" y2="90" stroke={wireColor} strokeWidth="2" />
      <polyline points={verticalZigzag(280, 90, 160)} stroke="#ef4444" strokeWidth="2" fill="none" />
      <line x1="280" y1="160" x2="280" y2="190" stroke={wireColor} strokeWidth="2" />
      <text x="300" y="128" textAnchor="start" fontSize="9" fill={textColor}>R2 = 10&#937;</text>

      {/* 2 A current source (out of node 2) */}
      <line x1="280" y1="60" x2="360" y2="60" stroke={wireColor} strokeWidth="2" />
      <line x1="360" y1="60" x2="360" y2="100" stroke={wireColor} strokeWidth="2" />
      <circle cx="360" cy="120" r="20" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <line x1="360" y1="110" x2="360" y2="130" stroke="#3b82f6" strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <text x="392" y="123" textAnchor="middle" fontSize="9" fill={textColor}>2 A</text>
      <line x1="360" y1="140" x2="360" y2="190" stroke={wireColor} strokeWidth="2" />

      {/* Bottom rail + ground glyph */}
      <line x1="60" y1="190" x2="360" y2="190" stroke={wireColor} strokeWidth="2" />
      <line x1="210" y1="190" x2="210" y2="200" stroke={wireColor} strokeWidth="2" />
      <line x1="196" y1="200" x2="224" y2="200" stroke={wireColor} strokeWidth="2" />
      <line x1="201" y1="206" x2="219" y2="206" stroke={wireColor} strokeWidth="1.5" />
      <line x1="206" y1="212" x2="214" y2="212" stroke={wireColor} strokeWidth="1" />

      {/* Node dots and unknown labels */}
      <circle cx="140" cy="60" r="4" fill={wireColor} />
      <circle cx="280" cy="60" r="4" fill={wireColor} />
      <text x="140" y="52" textAnchor="middle" fontSize="11" fontWeight="bold" fontStyle="italic" fill={textColor}>v1</text>
      <text x="280" y="52" textAnchor="middle" fontSize="11" fontWeight="bold" fontStyle="italic" fill={textColor}>v2</text>
    </svg>
  );
}

export function NodalMesh() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  useEffect(() => { markVisited(SECTION_ID); }, [markVisited]);

  return (
    <div className="space-y-8">
      <SectionHook text="Five resistors, one source, one question: how much current crosses the bridge? Series-parallel reduction — the only tool you have so far — cannot even start. By the end of this section you will solve it with two equations, and you will know a second method that solves it with three." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber(SECTION_ID)}
          </span>
          Nodal & Mesh Analysis
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Node-voltage and mesh-current methods — systematic analysis that works on any topology
        </p>
      </div>

      <FigureImage
        className="mb-6"
        src={`${import.meta.env.BASE_URL}figures/wheatstone-portrait.jpg`}
        alt="Engraved portrait of Charles Wheatstone"
        caption="Charles Wheatstone — he popularised (and credited to Samuel Christie) the bridge circuit that opens this section: the classic network that series-parallel reduction cannot touch."
        attribution="Public Domain — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Wheatstone_Charles_drawing_1868.jpg"
      />

      <TableOfContents items={tocEntries} />

      {/* ── The puzzle ─────────────────────────────────────────────────── */}
      <section id="puzzle" className="scroll-mt-4 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          The Unreducible Bridge
        </h2>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <BridgeDiagram />
          <p className="text-sm text-muted">
            A 12 V source feeds two voltage dividers — R1 (2 Ω) over R3 (4 Ω) on the left, R2
            (4 Ω) over R4 (2 Ω) on the right — with R5 (4 Ω) bridging their midpoints A and B.
          </p>
        </div>
        <div className="rounded-lg border-l-4 border-engineering-blue-600 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 p-4">
          <p className="font-semibold text-slate-900 dark:text-white">
            Find <MathWrapper formula="I_5" />, the current through the 4 Ω bridge resistor.
          </p>
        </div>
        <div className="rounded-lg bg-chassis border border-card-border p-4 font-mono text-xs space-y-1.5">
          <p className="text-muted uppercase tracking-widest text-[10px]">
            Attempt log — series-parallel reduction
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            &gt; Is R5 &#8741; R3? <span className="text-amber-600 dark:text-amber-400">No — different node pairs.</span>
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            &gt; Is R5 in series with R1? <span className="text-amber-600 dark:text-amber-400">No — node A has three branches.</span>
          </p>
          <p className="font-bold text-red-600 dark:text-red-400 tracking-widest pt-1">
            &#9632; NOT REDUCIBLE
          </p>
        </div>
        <p className="text-slate-700 dark:text-slate-300">
          Series-parallel reduction only works on ladder topologies — chains where every element
          sits end-to-end or side-by-side with a neighbour. R5 shares one node with R1 and R3,
          the other with R2 and R4, and no pair shares both end-nodes. General networks need a
          systematic method that does not care about shape — that is exactly what node-voltage
          and mesh-current analysis are.
        </p>
      </section>

      {/* ── Lab 1: Node-Equation Builder ───────────────────────────────── */}
      <LabStation
        id="node-builder"
        className="scroll-mt-4"
        number={getSectionNumber(SECTION_ID)}
        title="Node-Equation Builder"
        objective="Build the two KCL equations that crack the bridge — term by term, with the circuit highlighting each branch as you go."
      >
        <PredictionGate
          question="In this bridge circuit, what can series-parallel reduction say about R5?"
          options={[
            { id: 'series', label: 'R5 is in series with R1' },
            { id: 'parallel', label: 'R5 is in parallel with R3' },
            { id: 'neither', label: 'Neither — no two elements share both end-nodes, so reduction cannot start' },
            { id: 'balanced', label: 'R5 can be deleted because the bridge is balanced' },
          ]}
          getCorrectAnswer={() => 'neither'}
          explanation={
            <span>
              Two elements are in series only if they share exactly one node carrying no other
              branch, and in parallel only if they share <em>both</em> nodes. R5 (A–B) does
              neither. And the bridge is not balanced:{' '}
              <MathWrapper formula="R_1/R_3 = 2/4" /> but <MathWrapper formula="R_2/R_4 = 4/2" />.
            </span>
          }
          onPredict={(correct) => markPredictionGate(SECTION_ID, correct)}
        >
          <NodeEquationBuilder />
        </PredictionGate>
      </LabStation>

      <ConceptCheck
        data={{
          mode: 'multiple-choice',
          question:
            'A circuit has n essential nodes and one voltage source tied to the reference node. How many node-voltage equations do you need?',
          options: [
            { text: 'n − 2', correct: true, explanation: 'Correct! n − 1 for the free reference, minus one more node already pinned by the source. For the bridge: 4 − 2 = 2.' },
            { text: 'n', correct: false, explanation: 'The reference node never needs an equation.' },
            { text: 'n − 1', correct: false, explanation: "Right baseline, but the grounded source already fixed one node's voltage — that is exactly why the bridge needed only 2." },
            { text: 'one per resistor', correct: false, explanation: 'That is branch-current counting — the method exists to avoid it.' },
          ],
          hints: ['The reference node is free.', 'What did the 12 V source do to its + node?'],
        }}
        onComplete={() => incrementConceptChecks(SECTION_ID)}
        onHint={() => incrementHints(SECTION_ID)}
      />

      {/* ── Lab 2: Mesh-Current Assigner ───────────────────────────────── */}
      <LabStation
        id="mesh-assigner"
        className="scroll-mt-4"
        number={getSectionNumber(SECTION_ID)}
        title="Mesh-Current Assigner"
        objective="Assign circulating currents, walk each loop, and let the shared branch do the talking."
      >
        <PredictionGate
          question="R3 (4 Ω) sits on the wall between the two mesh windows. With clockwise mesh currents i₁ and i₂, the actual downward current through R3 is:"
          options={[
            { id: 'i1', label: 'i₁' },
            { id: 'diff', label: 'i₁ − i₂' },
            { id: 'sum', label: 'i₁ + i₂' },
          ]}
          getCorrectAnswer={() => 'diff'}
          explanation={
            <span>
              A shared branch carries the superposition of the two circulating currents: i₁
              pushes down through it, i₂ pushes up, so the net is{' '}
              <MathWrapper formula="i_1 - i_2" />. This one idea is the whole trick of mesh
              analysis.
            </span>
          }
          onPredict={(correct) => markPredictionGate(SECTION_ID, correct)}
        >
          <MeshCurrentAssigner />
        </PredictionGate>
      </LabStation>

      <ConceptCheck
        data={{
          mode: 'predict-reveal',
          question:
            'Suppose you re-solved with V_s2 raised until i₂ came out as −2 A. What does the minus sign mean — and is the answer wrong?',
          answer:
            'Nothing is wrong. The mesh current simply circulates counter-clockwise, opposite to the assigned arrow. Systematic methods never require you to guess directions correctly — the sign of the result corrects your guess. This is why you can assign all arrows clockwise without thinking.',
          hints: ['The arrow was an assumption, not a claim.', "What does a negative current mean in Ohm's law?"],
        }}
        onComplete={() => incrementConceptChecks(SECTION_ID)}
        onHint={() => incrementHints(SECTION_ID)}
      />

      {/* ── Choosing a method ──────────────────────────────────────────── */}
      <section id="choosing" className="scroll-mt-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Choosing a Method
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
          Count unknowns before writing a single equation — the cheaper method is usually obvious.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={TABLE_HEADER_CLASSES}>Circuit</th>
                <th className={TABLE_HEADER_CLASSES}>Node-voltage unknowns</th>
                <th className={TABLE_HEADER_CLASSES}>Mesh-current unknowns</th>
                <th className={TABLE_HEADER_CLASSES}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TABLE_CELL_CLASSES} font-medium`}>Wheatstone bridge (above)</td>
                <td className={TABLE_CELL_CLASSES}>2 — four essential nodes, minus the reference, minus the source-pinned node</td>
                <td className={TABLE_CELL_CLASSES}>3 — three windows</td>
                <td className={`${TABLE_CELL_CLASSES} font-semibold`}>Nodal wins</td>
              </tr>
              <tr className="bg-slate-50/50 dark:bg-slate-700/30">
                <td className={`${TABLE_CELL_CLASSES} font-medium`}>Two-window circuit (above)</td>
                <td className={TABLE_CELL_CLASSES}>1 — of three non-reference nodes, the sources pin two</td>
                <td className={TABLE_CELL_CLASSES}>2 — two windows</td>
                <td className={`${TABLE_CELL_CLASSES} font-semibold`}>Nodal slightly cheaper (1 vs 2)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-4">
          Rule of thumb: compare{' '}
          <MathWrapper formula="(\text{essential nodes} - 1 - \text{grounded V-sources})" />{' '}
          against the number of meshes and pick the smaller — counting a source only when it
          pins a node you would otherwise have solved for. Mesh analysis additionally requires
          a planar circuit — one you can draw with no crossing wires.
        </p>
      </section>

      {/* ── The two escapes ────────────────────────────────────────────── */}
      <section id="escapes" className="scroll-mt-4 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Supernode & Supermesh
        </h2>
        <p className="text-slate-700 dark:text-slate-300">
          What if a voltage source floats between two non-reference nodes, so neither node is
          pinned? You escape with one constraint plus one merged equation.
        </p>

        <CollapsibleSection title="Supernode — worked example" defaultOpen={false}>
          <div className="space-y-4">
            <SupernodeDiagram />
            <p className="text-sm text-muted">
              A 6 A source feeds node 1, a 5 V source floats between node 1 (+) and node 2
              (dashed supernode boundary), R1 = 5 Ω and R2 = 10 Ω drop to ground, and a 2 A
              source leaves node 2.
            </p>
            <WorkedSteps
              tryFirstPrompt="Try this step on paper before revealing."
              steps={[
                {
                  title: 'Step 1 — Constraint (the source dictates)',
                  body: (
                    <>
                      <p className="mb-2">
                        The 5 V source pins the difference between the two node voltages — that
                        is one equation for free:
                      </p>
                      <MathWrapper formula="v_1 - v_2 = 5" block />
                    </>
                  ),
                },
                {
                  title: 'Step 2 — One KCL around the supernode boundary',
                  body: (
                    <>
                      <p className="mb-2">
                        Sum the currents crossing the dashed boundary (the source current inside
                        it never appears):
                      </p>
                      <MathWrapper formula="\frac{v_1}{5} + \frac{v_2}{10} = 6 - 2 = 4" block />
                    </>
                  ),
                },
                {
                  title: 'Step 3 — Substitute the constraint',
                  body: (
                    <MathWrapper formula="\frac{v_2 + 5}{5} + \frac{v_2}{10} = 4 \;\Rightarrow\; 0.3v_2 = 3" block />
                  ),
                },
                {
                  title: 'Step 4 — Solve and check',
                  body: (
                    <>
                      <MathWrapper formula="v_2 = 10\ \text{V}, \quad v_1 = 15\ \text{V}" block />
                      <MathWrapper formula="\frac{15}{5} + \frac{10}{10} = 4\ \checkmark" block />
                      <p className="mt-2">
                        Takeaway: a voltage source between non-reference nodes = one constraint
                        + one merged KCL. The equation count never changes.
                      </p>
                    </>
                  ),
                },
              ]}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Supermesh — the same trick, rotated 90°" defaultOpen={false}>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            A current source shared by two meshes pins the difference of the mesh currents:{' '}
            <MathWrapper formula="i_a - i_b = I_{src}" /> — that is the constraint. For the
            missing equation you write one KVL around the combined perimeter of both windows,
            stepping over the source entirely. It is the supernode trick, rotated 90°.
          </p>
        </CollapsibleSection>

        <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4">
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-1">
            Looking ahead
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            In the{' '}
            <Link to="/s-domain" className="underline text-engineering-blue-700 dark:text-engineering-blue-400 hover:text-engineering-blue-800 dark:hover:text-engineering-blue-300">
              s-Domain Analysis section
            </Link>{' '}
            you will write these exact equations with <MathWrapper formula="Z_R = R" />,{' '}
            <MathWrapper formula="Z_L = sL" /> and <MathWrapper formula="Z_C = \frac{1}{sC}" /> —
            nodal analysis IS s-domain circuit analysis.
          </p>
        </div>
      </section>

      <ConceptCheck
        data={{
          mode: 'multiple-choice',
          question: 'For the bridge circuit, why was nodal analysis the cheaper method?',
          options: [
            { text: '2 node unknowns vs 3 mesh unknowns', correct: true, explanation: 'Counting first is the meta-skill: essential nodes − 1 − (grounded sources) = 2, meshes = 3.' },
            { text: 'Mesh analysis cannot handle bridges', correct: false, explanation: 'False — it works fine, with 3 equations.' },
            { text: 'Nodal works without a reference node', correct: false, explanation: 'Nodal always needs a reference — it is just free.' },
            { text: 'The bridge is balanced', correct: false, explanation: "It is not: 2/4 ≠ 4/2 — and balance wouldn't change the equation count anyway." },
          ],
        }}
        onComplete={() => incrementConceptChecks(SECTION_ID)}
        onHint={() => incrementHints(SECTION_ID)}
      />

      <YourTurnPanel
        scenario="Same bridge, but R4 is swapped from 2 Ω to 8 Ω."
        question="What is I₅ now?"
        options={[
          { text: 'I₅ = 0 — the bridge is balanced', correct: true, explanation: 'Now R1/R3 = 2/4 = R2/R4 = 4/8 — both dividers give the same voltage, so no current crosses.' },
          { text: 'I₅ increases', correct: false, explanation: 'Raising R4 raises V_B toward V_A — the imbalance shrinks, it does not grow.' },
          { text: 'I₅ reverses direction', correct: false, explanation: 'It heads toward zero and stops exactly there — check the two divider voltages.' },
        ]}
        correctReveal={
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <MathWrapper formula="V_A = 12 \cdot \frac{4}{2+4} = 8\ \text{V}" block />
            <MathWrapper formula="V_B = 12 \cdot \frac{8}{4+8} = 8\ \text{V}" block />
            <MathWrapper formula="V_A = V_B \;\Rightarrow\; I_5 = 0" block />
            <p className="font-medium">
              This is exactly how a Wheatstone bridge measures an unknown resistance: tune until
              the meter reads zero.
            </p>
          </div>
        }
      />

      <div id="challenge" className="scroll-mt-4">
        <GuidedChallenge challenge={CHALLENGE} />
      </div>

      <CourseNavigation />
    </div>
  );
}
