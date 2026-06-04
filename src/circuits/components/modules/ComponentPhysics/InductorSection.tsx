import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { ComponentSectionLayout } from '@circuits/components/modules/ComponentPhysics/ComponentSectionLayout';
import {
  inductanceFormula,
  materials,
} from '@circuits/utils/componentMath';

export function InductorSection({
  turns,
  area,
  length,
  permeability,
  inductance,
  onTurnsChange,
  onAreaChange,
  onLengthChange,
  onPermeabilityChange,
  onConceptCheckComplete,
  onHint,
}: {
  turns: number;
  area: number;
  length: number;
  permeability: number;
  inductance: number;
  onTurnsChange: (v: number) => void;
  onAreaChange: (v: number) => void;
  onLengthChange: (v: number) => void;
  onPermeabilityChange: (v: number) => void;
  onConceptCheckComplete?: () => void;
  onHint?: (tier: number) => void;
}) {
  const coilR = Math.max(Math.sqrt(area * 10000) * 35, 18); // ellipse ry, 18–70
  const coilW = length * 500; // total coil width px
  const crossR = Math.max(Math.sqrt(area * 10000) * 30, 14); // cross-section radius

  return (
    <ComponentSectionLayout
      theory={<>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Theory</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            An inductor stores energy in a magnetic field created by current flowing through
            a coil of wire. Inductance depends on the number of turns, core material permeability,
            coil area, and length.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Basic Formula:</p>
              <MathWrapper formula={inductanceFormula.basic} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Voltage-Current Relation:</p>
              <MathWrapper formula={inductanceFormula.voltageCurrents} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Energy Storage:</p>
              <MathWrapper formula={inductanceFormula.energy} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Impedance (AC):</p>
              <MathWrapper formula={inductanceFormula.impedance} block />
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            <p className="mb-2"><strong>Where:</strong></p>
            <ul className="space-y-1 ml-4">
              <li><MathWrapper formula="N" /> = Number of turns</li>
              <li><MathWrapper formula="\mu" /> = Permeability (H/m)</li>
              <li><MathWrapper formula="A" /> = Core area (m&sup2;)</li>
              <li><MathWrapper formula="l" /> = Coil length (m)</li>
            </ul>
          </div>
      </>}
      materialsTitle="Core Materials"
      materials={
          <div className="space-y-2">
            {materials.filter(m => m.permeability).slice(0, 3).map((material) => (
              <button
                key={material.name}
                onClick={() => onPermeabilityChange(material.permeability!)}
                className="w-full text-left px-4 py-2 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{material.name}</span>
                <span className="text-slate-600 dark:text-slate-400 ml-2">
                  &mu; = {material.permeability?.toExponential(2)} H/m
                </span>
              </button>
            ))}
            <button
              onClick={() => onPermeabilityChange(6.3e-3)}
              className="w-full text-left px-4 py-2 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm"
            >
              <span className="font-medium text-slate-800 dark:text-slate-200">Iron Core</span>
              <span className="text-slate-600 dark:text-slate-400 ml-2">&mu; = 6.30e-3 H/m</span>
            </button>
          </div>
      }
      interactive={<>
          {/* 1. Circuit Symbol */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Circuit Symbol</p>
            <svg viewBox="0 0 280 60" className="w-full max-w-xs mx-auto">
              <line x1="20" y1="35" x2="60" y2="35" stroke="#059669" strokeWidth="2.5" />
              <path d="M60,35 C60,15 80,15 80,35 C80,15 100,15 100,35 C100,15 120,15 120,35 C120,15 140,15 140,35 C140,15 160,15 160,35 C160,15 180,15 180,35" fill="none" stroke="#059669" strokeWidth="2.5" />
              <line x1="180" y1="35" x2="260" y2="35" stroke="#059669" strokeWidth="2.5" />
              <text x="120" y="12" textAnchor="middle" className="text-xs fill-slate-700 font-semibold">L</text>
            </svg>
          </div>

          {/* 2. Engineering Drawing: Side View + Cross-Section */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Physical Structure</p>

            {/* Side view */}
            <div className="mb-3">
              <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Side View (shows turns <em>N</em> and length <em>l</em>)</p>
              <svg viewBox="0 0 400 200" className="w-full">
                <defs>
                  <marker id="iArrowDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <polygon points="0 1, 8 4, 0 7" fill="#64748b" />
                  </marker>
                </defs>

                {/* Wire leads */}
                <line x1="40" y1="100" x2="95" y2="100" stroke="#1e40af" strokeWidth="3" />
                <line x1={105 + coilW} y1="100" x2={105 + coilW + 55} y2="100" stroke="#1e40af" strokeWidth="3" />

                {/* Coil turns */}
                {Array.from({ length: Math.min(turns, 20) }).map((_, i) => {
                  const x = 100 + (i * coilW) / Math.min(turns, 20);
                  return (
                    <ellipse
                      key={i}
                      cx={x}
                      cy="100"
                      rx="15"
                      ry={coilR}
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2.5"
                    />
                  );
                })}

                {/* Length dimension */}
                <line x1="100" y1={100 - coilR - 14} x2={100 + coilW} y2={100 - coilR - 14} stroke="#64748b" strokeWidth="1" markerEnd="url(#iArrowDim)" />
                <line x1="100" y1={100 - coilR - 20} x2="100" y2={100 - coilR - 8} stroke="#64748b" strokeWidth="0.5" />
                <line x1={100 + coilW} y1={100 - coilR - 20} x2={100 + coilW} y2={100 - coilR - 8} stroke="#64748b" strokeWidth="0.5" />
                <text x={100 + coilW / 2} y={100 - coilR - 22} textAnchor="middle" className="text-xs fill-slate-600" fontStyle="italic">l</text>

                {/* Area dimension (coil height) */}
                <line x1="70" y1={100 - coilR} x2="70" y2={100 + coilR} stroke="#64748b" strokeWidth="1" markerEnd="url(#iArrowDim)" />
                <line x1="64" y1={100 - coilR} x2="76" y2={100 - coilR} stroke="#64748b" strokeWidth="0.5" />
                <line x1="64" y1={100 + coilR} x2="76" y2={100 + coilR} stroke="#64748b" strokeWidth="0.5" />
                <text x="52" y="103" textAnchor="middle" className="text-xs fill-slate-600" fontStyle="italic">A</text>
              </svg>
              <p className="text-center text-xs text-slate-500 mt-1">
                N = {turns} turns {turns > 20 && '(showing 20)'}
              </p>
            </div>

            {/* Front view (core cross-section) */}
            <div>
              <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Cross-Section (core area <em>A</em>)</p>
              <svg viewBox="0 0 180 140" className="w-full max-w-[200px] mx-auto">
                {/* Coil wire ring (outer) */}
                <circle cx="90" cy="65" r={crossR + 12} fill="none" stroke="#7c3aed" strokeWidth="10" opacity="0.2" />
                {/* Core */}
                <circle cx="90" cy="65" r={crossR} fill="#e9d5ff" stroke="#7c3aed" strokeWidth="1.5" />
                <text x="90" y={69} textAnchor="middle" className="fill-purple-800 font-bold" style={{ fontSize: '11px' }}>A</text>

                {/* Radius dimension */}
                <line x1="90" y1="65" x2={90 + crossR} y2="65" stroke="#64748b" strokeWidth="1" />
                <line x1={90 + crossR} y1="58" x2={90 + crossR} y2="72" stroke="#64748b" strokeWidth="0.5" />
                <text x={90 + crossR / 2} y="58" textAnchor="middle" className="fill-slate-500" style={{ fontSize: '9px' }}>r</text>

                <text x="90" y="130" textAnchor="middle" className="text-xs fill-slate-500">{(area * 10000).toFixed(2)} cm&sup2;</text>
              </svg>
            </div>
          </div>

          {/* 3. Sliders */}
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Number of Turns: <span className="text-purple-600 font-semibold">{turns}</span>
              </label>
              <input type="range" min="10" max="500" step="10" value={turns} onChange={(e) => onTurnsChange(parseFloat(e.target.value))} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Core Area: <span className="text-purple-600 font-semibold">{(area * 10000).toFixed(2)} cm&sup2;</span>
              </label>
              <input type="range" min="0.5" max="10" step="0.5" value={area * 10000} onChange={(e) => onAreaChange(parseFloat(e.target.value) / 10000)} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Coil Length: <span className="text-purple-600 font-semibold">{(length * 100).toFixed(1)} cm</span>
              </label>
              <input type="range" min="5" max="50" step="1" value={length * 100} onChange={(e) => onLengthChange(parseFloat(e.target.value) / 100)} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Permeability: <span className="text-purple-600 font-semibold">{permeability.toExponential(2)} H/m</span>
              </label>
              <input type="range" min="1.257" max="10" step="0.1" value={permeability * 1e6} onChange={(e) => onPermeabilityChange(parseFloat(e.target.value) * 1e-6)} className="w-full accent-purple-500" />
            </div>
          </div>

          {/* 4. Result */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800 mb-5">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">Calculated Inductance:</p>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{(inductance * 1000).toFixed(2)} mH</p>
          </div>

          {/* 5. Concept Check */}
          <ConceptCheck data={{
            mode: 'multiple-choice',
            question: 'An inductor has N = 100 turns. If you double the number of turns to N = 200 (keeping everything else the same), what happens to the inductance?',
            hints: [
              'Look at the formula L = μN²A/l. How does N appear?',
              'N is squared — doubling it doesn\'t just double the result.',
            ],
            options: [
              {
                text: 'Inductance quadruples (4× increase)',
                correct: true,
                explanation: 'Correct! L = μN²A/l — inductance depends on N². Doubling N means L increases by 2² = 4. Each turn not only adds its own flux but also links with flux from every other turn, creating a squared relationship.',
              },
              {
                text: 'Inductance doubles (2× increase)',
                correct: false,
                explanation: 'It\'s more than doubling! L = μN²A/l — the number of turns is squared. Each added turn links with the magnetic flux from all other turns, so the effect compounds.',
              },
              {
                text: 'Inductance increases by √2',
                correct: false,
                explanation: 'N enters the formula as N², not √N. Doubling N gives 2² = 4 times the inductance. The squared relationship comes from mutual coupling between turns.',
              },
            ],
          }}
            onComplete={onConceptCheckComplete}
            onHint={onHint}
          />
      </>}
    />
  );
}
