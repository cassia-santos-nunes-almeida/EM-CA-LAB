import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { ComponentSectionLayout } from '@circuits/components/modules/ComponentPhysics/ComponentSectionLayout';
import {
  resistanceFormula,
  materials,
} from '@circuits/utils/componentMath';

export function ResistorSection({
  length,
  area,
  resistivity,
  resistance,
  onLengthChange,
  onAreaChange,
  onResistivityChange,
  onConceptCheckComplete,
  onHint,
}: {
  length: number;
  area: number;
  resistivity: number;
  resistance: number;
  onLengthChange: (v: number) => void;
  onAreaChange: (v: number) => void;
  onResistivityChange: (v: number) => void;
  onConceptCheckComplete?: () => void;
  onHint?: (tier: number) => void;
}) {
  const bodyW = 40 + length * 100; // 40–240 px
  const bodyH = Math.max(20 + Math.sqrt(area * 1e6) * 16, 24); // height responds to area
  const crossR = 8 + Math.sqrt(area * 1e6) * 12; // cross-section radius 8–46

  return (
    <ComponentSectionLayout
      theory={<>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Theory</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            A resistor opposes the flow of electric current. Resistance depends on the material's
            resistivity, its length, and cross-sectional area.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Basic Formula:</p>
              <MathWrapper formula={resistanceFormula.basic} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Ohm's Law:</p>
              <MathWrapper formula={resistanceFormula.ohmsLaw} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Power Dissipation:</p>
              <MathWrapper formula={resistanceFormula.power} block />
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            <p className="mb-2"><strong>Where:</strong></p>
            <ul className="space-y-1 ml-4">
              <li><MathWrapper formula="\rho" /> = Resistivity (&Omega;&middot;m)</li>
              <li><MathWrapper formula="L" /> = Length (m)</li>
              <li><MathWrapper formula="A" /> = Cross-sectional area (m&sup2;)</li>
            </ul>
          </div>
      </>}
      materialsTitle="Material Properties"
      materials={
          <div className="space-y-2">
            {materials.filter(m => m.resistivity).map((material) => (
              <button
                key={material.name}
                onClick={() => onResistivityChange(material.resistivity!)}
                className="w-full text-left px-4 py-2 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{material.name}</span>
                <span className="text-slate-600 dark:text-slate-400 ml-2">
                  &rho; = {material.resistivity?.toExponential(2)} &Omega;&middot;m
                </span>
              </button>
            ))}
          </div>
      }
      interactive={<>
          {/* 1. Circuit Symbol */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Circuit Symbol</p>
            <svg viewBox="0 0 280 60" className="w-full max-w-xs mx-auto">
              <line x1="20" y1="30" x2="60" y2="30" stroke="#1e40af" strokeWidth="2.5" />
              <polyline points="60,30 72,10 96,50 120,10 144,50 168,10 192,50 204,30" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinejoin="round" />
              <line x1="204" y1="30" x2="260" y2="30" stroke="#1e40af" strokeWidth="2.5" />
              <text x="132" y="8" textAnchor="middle" className="text-xs fill-slate-700 font-semibold">R</text>
            </svg>
          </div>

          {/* 2. Engineering Drawing: Side View + Cross-Section */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Physical Structure</p>

            {/* Side view (longitudinal) */}
            <div className="mb-3">
              <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Side View</p>
              <svg viewBox="0 0 400 140" className="w-full">
                <defs>
                  <marker id="rArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <polygon points="0 1, 8 4, 0 7" fill="#64748b" />
                  </marker>
                  <linearGradient id="rBody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <marker id="rArrowRed" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <polygon points="0 1, 8 4, 0 7" fill="#dc2626" />
                  </marker>
                </defs>

                {/* Wire leads */}
                <line x1="20" y1="70" x2="80" y2="70" stroke="#1e40af" strokeWidth="3" />
                <line x1={80 + bodyW} y1="70" x2={80 + bodyW + 50} y2="70" stroke="#1e40af" strokeWidth="3" />

                {/* Body */}
                <rect x="80" y={70 - bodyH / 2} width={bodyW} height={bodyH} rx="5" fill="url(#rBody)" stroke="#92400e" strokeWidth="1.5" />

                {/* Color bands */}
                <rect x={80 + bodyW * 0.15} y={70 - bodyH / 2 + 2} width={bodyW * 0.05} height={bodyH - 4} rx="1" fill="#b91c1c" opacity="0.8" />
                <rect x={80 + bodyW * 0.28} y={70 - bodyH / 2 + 2} width={bodyW * 0.05} height={bodyH - 4} rx="1" fill="#7c3aed" opacity="0.8" />
                <rect x={80 + bodyW * 0.41} y={70 - bodyH / 2 + 2} width={bodyW * 0.05} height={bodyH - 4} rx="1" fill="#b45309" opacity="0.8" />
                <rect x={80 + bodyW * 0.70} y={70 - bodyH / 2 + 2} width={bodyW * 0.05} height={bodyH - 4} rx="1" fill="#d4af37" opacity="0.8" />

                {/* Length dimension */}
                <line x1="80" y1={70 - bodyH / 2 - 14} x2={80 + bodyW} y2={70 - bodyH / 2 - 14} stroke="#64748b" strokeWidth="1" markerEnd="url(#rArrow)" />
                <line x1="80" y1={70 - bodyH / 2 - 20} x2="80" y2={70 - bodyH / 2 - 8} stroke="#64748b" strokeWidth="0.5" />
                <line x1={80 + bodyW} y1={70 - bodyH / 2 - 20} x2={80 + bodyW} y2={70 - bodyH / 2 - 8} stroke="#64748b" strokeWidth="0.5" />
                <text x={80 + bodyW / 2} y={70 - bodyH / 2 - 22} textAnchor="middle" className="text-xs fill-slate-600" fontStyle="italic">L</text>

                {/* Cross-section cut line */}
                <line x1={80 + bodyW + 16} y1={70 - bodyH / 2 - 6} x2={80 + bodyW + 16} y2={70 + bodyH / 2 + 6} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,2" />
                <text x={80 + bodyW + 16} y={70 + bodyH / 2 + 18} textAnchor="middle" className="fill-slate-400" style={{ fontSize: '9px' }}>A-A</text>

                {/* Current arrow */}
                <line x1="30" y1="105" x2="65" y2="105" stroke="#dc2626" strokeWidth="2" markerEnd="url(#rArrowRed)" />
                <text x="48" y="120" textAnchor="middle" className="text-xs fill-red-600" fontStyle="italic">i</text>
              </svg>
            </div>

            {/* Front view (cross-section) */}
            <div>
              <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Cross-Section A-A (shows area <em>A</em>)</p>
              <svg viewBox="0 0 180 140" className="w-full max-w-[200px] mx-auto">
                {/* Outer body circle */}
                <circle cx="90" cy="65" r={crossR + 8} fill="#d97706" stroke="#92400e" strokeWidth="1.5" opacity="0.3" />
                {/* Conductor cross-section */}
                <circle cx="90" cy="65" r={crossR} fill="#f59e0b" stroke="#92400e" strokeWidth="1.5" />
                <text x="90" y={65 + 4} textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '11px' }}>A</text>

                {/* Dimension line for radius */}
                <line x1="90" y1="65" x2={90 + crossR} y2="65" stroke="#64748b" strokeWidth="1" />
                <line x1={90 + crossR} y1="58" x2={90 + crossR} y2="72" stroke="#64748b" strokeWidth="0.5" />
                <text x={90 + crossR / 2} y="58" textAnchor="middle" className="fill-slate-500" style={{ fontSize: '9px' }}>r</text>

                <text x="90" y="130" textAnchor="middle" className="text-xs fill-slate-500">{(area * 1e6).toFixed(2)} mm&sup2;</text>
              </svg>
            </div>
          </div>

          {/* 3. Sliders */}
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Length: <span className="text-red-600 font-semibold">{length.toFixed(2)} m</span>
              </label>
              <input type="range" min="0.1" max="2" step="0.1" value={length} onChange={(e) => onLengthChange(parseFloat(e.target.value))} className="w-full accent-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Area: <span className="text-red-600 font-semibold">{(area * 1e6).toFixed(2)} mm&sup2;</span>
              </label>
              <input type="range" min="0.1" max="10" step="0.1" value={area * 1e6} onChange={(e) => onAreaChange(parseFloat(e.target.value) * 1e-6)} className="w-full accent-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Resistivity: <span className="text-red-600 font-semibold">{resistivity.toExponential(2)} &Omega;&middot;m</span>
              </label>
              <input type="range" min="1" max="100" step="1" value={resistivity * 1e8} onChange={(e) => onResistivityChange(parseFloat(e.target.value) * 1e-8)} className="w-full accent-red-500" />
            </div>
          </div>

          {/* 4. Result */}
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 mb-5">
            <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">Calculated Resistance:</p>
            <p className="text-3xl font-bold text-red-700 dark:text-red-400">{resistance.toFixed(3)} &#937;</p>
          </div>

          {/* 5. Concept Check */}
          <ConceptCheck data={{
            mode: 'multiple-choice',
            question: 'You have two wires of the same material and length. Wire A has twice the cross-sectional area of Wire B. Which has more resistance?',
            hints: [
              'Look at the formula R = ρL/A. What happens when A increases?',
              'Larger cross-section means more room for electrons to flow.',
            ],
            options: [
              {
                text: 'Wire B (smaller area) has more resistance',
                correct: true,
                explanation: 'Correct! R = ρL/A — resistance is inversely proportional to area. Halving the area doubles the resistance, like forcing the same flow of water through a narrower pipe.',
              },
              {
                text: 'Wire A (larger area) has more resistance',
                correct: false,
                explanation: 'Larger cross-sectional area actually decreases resistance. Think of it like a wider pipe — more room for current to flow.',
              },
              {
                text: 'Both have the same resistance',
                correct: false,
                explanation: 'Cross-sectional area directly affects resistance. R = ρL/A shows that area is in the denominator — bigger area means lower resistance.',
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
