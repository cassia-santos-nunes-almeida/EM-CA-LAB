import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { ComponentSectionLayout } from '@circuits/components/modules/ComponentPhysics/ComponentSectionLayout';
import {
  capacitanceFormula,
  materials,
} from '@circuits/utils/componentMath';

export function CapacitorSection({
  area,
  distance,
  permittivity,
  capacitance,
  onAreaChange,
  onDistanceChange,
  onPermittivityChange,
  onConceptCheckComplete,
  onHint,
}: {
  area: number;
  distance: number;
  permittivity: number;
  capacitance: number;
  onAreaChange: (v: number) => void;
  onDistanceChange: (v: number) => void;
  onPermittivityChange: (v: number) => void;
  onConceptCheckComplete?: () => void;
  onHint?: (tier: number) => void;
}) {
  // Normalized to slider ranges so SVG visibly changes
  // area: 0.005–0.10 (slider 0.5–10 cm²), distance: 0.0001–0.005 (slider 0.1–5 mm)
  const areaNorm = (area - 0.005) / (0.10 - 0.005);   // 0 → 1
  const distNorm = (distance - 0.0001) / (0.005 - 0.0001); // 0 → 1
  const plateH = 40 + areaNorm * 90;   // 40–130 px
  const gap = 25 + distNorm * 80;      // 25–105 px
  const plateFaceSize = 30 + areaNorm * 70; // 30–100 for cross-section

  const plateX1 = 160;
  const plateX2 = plateX1 + gap;
  const cy = 90;

  return (
    <ComponentSectionLayout
      theory={<>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Theory</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            A capacitor stores energy in an electric field between two conductive plates
            separated by a dielectric material. Capacitance depends on plate area, separation
            distance, and the dielectric's permittivity.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Basic Formula:</p>
              <MathWrapper formula={capacitanceFormula.basic} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Current-Voltage Relation:</p>
              <MathWrapper formula={capacitanceFormula.currentVoltage} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Energy Storage:</p>
              <MathWrapper formula={capacitanceFormula.energy} block />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Impedance (AC):</p>
              <MathWrapper formula={capacitanceFormula.impedance} block />
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            <p className="mb-2"><strong>Where:</strong></p>
            <ul className="space-y-1 ml-4">
              <li><MathWrapper formula="\epsilon" /> = Permittivity (F/m)</li>
              <li><MathWrapper formula="A" /> = Plate area (m&sup2;)</li>
              <li><MathWrapper formula="d" /> = Separation distance (m)</li>
            </ul>
          </div>
      </>}
      materialsTitle="Dielectric Materials"
      materials={
          <div className="space-y-2">
            {materials.filter(m => m.permittivity).map((material) => (
              <button
                key={material.name}
                onClick={() => onPermittivityChange(material.permittivity!)}
                className="w-full text-left px-4 py-2 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{material.name}</span>
                <span className="text-slate-600 dark:text-slate-400 ml-2">
                  &epsilon; = {material.permittivity?.toExponential(2)} F/m
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
              <line x1="20" y1="30" x2="120" y2="30" stroke="#1e40af" strokeWidth="2.5" />
              <line x1="120" y1="8" x2="120" y2="52" stroke="#1e40af" strokeWidth="3" />
              <line x1="136" y1="8" x2="136" y2="52" stroke="#1e40af" strokeWidth="3" />
              <line x1="136" y1="30" x2="260" y2="30" stroke="#1e40af" strokeWidth="2.5" />
              <text x="128" y="6" textAnchor="middle" className="text-xs fill-slate-700 font-semibold">C</text>
            </svg>
          </div>

          {/* 2. Engineering Drawing: Side View + Front View */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Physical Structure</p>

            {/* Side view */}
            <div className="mb-3">
              <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Side View (showing gap <em>d</em> and plate height)</p>
              <svg viewBox="0 0 400 200" className="w-full">
                <defs>
                  <marker id="cArrowDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <polygon points="0 1, 8 4, 0 7" fill="#64748b" />
                  </marker>
                  <marker id="cArrowE" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <polygon points="0 0.5, 6 3, 0 5.5" fill="#dc2626" />
                  </marker>
                  <linearGradient id="cPlate" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>

                {/* Wire leads */}
                <line x1="60" y1={cy} x2={plateX1} y2={cy} stroke="#1e40af" strokeWidth="3" />
                <line x1={plateX2 + 12} y1={cy} x2="360" y2={cy} stroke="#1e40af" strokeWidth="3" />

                {/* Plates */}
                <rect x={plateX1 - 12} y={cy - plateH / 2} width="12" height={plateH} rx="2" fill="url(#cPlate)" stroke="#1e40af" strokeWidth="1.5" />
                <rect x={plateX2} y={cy - plateH / 2} width="12" height={plateH} rx="2" fill="url(#cPlate)" stroke="#1e40af" strokeWidth="1.5" />

                {/* Dielectric fill */}
                <rect x={plateX1} y={cy - plateH / 2} width={gap} height={plateH} fill="#fef3c7" opacity="0.5" />

                {/* Electric field arrows */}
                {[-2, -1, 0, 1, 2].filter(o => Math.abs(o) * (plateH / 6) < plateH / 2 - 4).map((offset) => (
                  <line
                    key={offset}
                    x1={plateX1 + 4}
                    y1={cy + offset * (plateH / 6)}
                    x2={plateX2 - 2}
                    y2={cy + offset * (plateH / 6)}
                    stroke="#dc2626"
                    strokeWidth="1"
                    strokeDasharray="4,3"
                    markerEnd="url(#cArrowE)"
                  />
                ))}

                {/* Charge symbols */}
                {[-2, -1, 0, 1, 2].filter(o => Math.abs(o) * (plateH / 6) < plateH / 2 - 4).map((offset) => (
                  <g key={`ch-${offset}`}>
                    <text x={plateX1 - 18} y={cy + offset * (plateH / 6) + 4} textAnchor="middle" className="text-xs font-bold" fill="#2563eb">+</text>
                    <text x={plateX2 + 18} y={cy + offset * (plateH / 6) + 4} textAnchor="middle" className="text-xs font-bold" fill="#2563eb">&minus;</text>
                  </g>
                ))}

                {/* Dimension: gap d */}
                <line x1={plateX1} y1={cy + plateH / 2 + 16} x2={plateX2 + 12} y2={cy + plateH / 2 + 16} stroke="#64748b" strokeWidth="1" markerEnd="url(#cArrowDim)" />
                <line x1={plateX1} y1={cy + plateH / 2 + 10} x2={plateX1} y2={cy + plateH / 2 + 22} stroke="#64748b" strokeWidth="0.5" />
                <line x1={plateX2 + 12} y1={cy + plateH / 2 + 10} x2={plateX2 + 12} y2={cy + plateH / 2 + 22} stroke="#64748b" strokeWidth="0.5" />
                <text x={(plateX1 + plateX2 + 12) / 2} y={cy + plateH / 2 + 32} textAnchor="middle" className="text-xs fill-slate-600" fontStyle="italic">d</text>

                {/* Dimension: plate height (represents A) */}
                <line x1={plateX1 - 30} y1={cy - plateH / 2} x2={plateX1 - 30} y2={cy + plateH / 2} stroke="#64748b" strokeWidth="1" markerEnd="url(#cArrowDim)" />
                <line x1={plateX1 - 36} y1={cy - plateH / 2} x2={plateX1 - 24} y2={cy - plateH / 2} stroke="#64748b" strokeWidth="0.5" />
                <line x1={plateX1 - 36} y1={cy + plateH / 2} x2={plateX1 - 24} y2={cy + plateH / 2} stroke="#64748b" strokeWidth="0.5" />
                <text x={plateX1 - 42} y={cy + 4} textAnchor="middle" className="text-xs fill-slate-600" fontStyle="italic">A</text>

                {/* E-field label */}
                <text x={(plateX1 + plateX2) / 2 + 6} y={cy - plateH / 2 + 12} textAnchor="middle" className="text-xs fill-red-500 font-medium">E field</text>
              </svg>
            </div>

            {/* Front view (plate face) */}
            <div>
              <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Front View (plate face, area <em>A</em>)</p>
              <svg viewBox="0 0 180 150" className="w-full max-w-[200px] mx-auto">
                {/* Plate face as square */}
                <rect
                  x={90 - plateFaceSize / 2}
                  y={68 - plateFaceSize / 2}
                  width={plateFaceSize}
                  height={plateFaceSize}
                  rx="3"
                  fill="#93c5fd"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />
                <text x="90" y={72} textAnchor="middle" className="fill-blue-900 font-bold" style={{ fontSize: '11px' }}>A</text>

                {/* Charge symbols on face */}
                {[-1, 0, 1].map(r => [-1, 0, 1].map(c => (
                  <text
                    key={`${r}-${c}`}
                    x={90 + c * (plateFaceSize * 0.28)}
                    y={68 + r * (plateFaceSize * 0.28) + 3}
                    textAnchor="middle"
                    fill="#1e40af"
                    opacity="0.4"
                    style={{ fontSize: '10px' }}
                  >+</text>
                )))}

                {/* Width dimension */}
                <line x1={90 - plateFaceSize / 2} y1={68 + plateFaceSize / 2 + 12} x2={90 + plateFaceSize / 2} y2={68 + plateFaceSize / 2 + 12} stroke="#64748b" strokeWidth="0.8" />
                <line x1={90 - plateFaceSize / 2} y1={68 + plateFaceSize / 2 + 7} x2={90 - plateFaceSize / 2} y2={68 + plateFaceSize / 2 + 17} stroke="#64748b" strokeWidth="0.5" />
                <line x1={90 + plateFaceSize / 2} y1={68 + plateFaceSize / 2 + 7} x2={90 + plateFaceSize / 2} y2={68 + plateFaceSize / 2 + 17} stroke="#64748b" strokeWidth="0.5" />

                <text x="90" y="145" textAnchor="middle" className="text-xs fill-slate-500">{(area * 10000).toFixed(2)} cm&sup2;</text>
              </svg>
            </div>
          </div>

          {/* 3. Sliders */}
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Plate Area: <span className="text-green-600 font-semibold">{(area * 10000).toFixed(2)} cm&sup2;</span>
              </label>
              <input type="range" min="0.5" max="10" step="0.5" value={area * 10000} onChange={(e) => onAreaChange(parseFloat(e.target.value) / 10000)} className="w-full accent-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Distance: <span className="text-green-600 font-semibold">{(distance * 1000).toFixed(2)} mm</span>
              </label>
              <input type="range" min="0.1" max="5" step="0.1" value={distance * 1000} onChange={(e) => onDistanceChange(parseFloat(e.target.value) / 1000)} className="w-full accent-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Permittivity: <span className="text-green-600 font-semibold">{permittivity.toExponential(2)} F/m</span>
              </label>
              <input type="range" min="8.854" max="40" step="0.1" value={permittivity * 1e12} onChange={(e) => onPermittivityChange(parseFloat(e.target.value) * 1e-12)} className="w-full accent-green-500" />
            </div>
          </div>

          {/* 4. Result */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 mb-5">
            <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">Calculated Capacitance:</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">{(capacitance * 1e12).toFixed(2)} pF</p>
          </div>

          {/* 5. Concept Check */}
          <ConceptCheck data={{
            mode: 'multiple-choice',
            question: 'A capacitor uses a glass dielectric (εr ≈ 4.5) instead of air (εr = 1). What happens to the capacitance?',
            hints: [
              'C = εA/d, where ε = ε₀ × εr. What happens when εr increases?',
              'The dielectric polarizes under the electric field, effectively storing more charge for the same voltage.',
            ],
            options: [
              {
                text: 'Capacitance increases by a factor of about 4.5',
                correct: true,
                explanation: 'Correct! C = εA/d = ε₀εrA/d. Replacing air (εr = 1) with glass (εr ≈ 4.5) multiplies the capacitance by 4.5. This is exactly why dielectric materials are used — they let you get more capacitance from the same physical size.',
              },
              {
                text: 'Capacitance decreases — glass blocks the electric field',
                correct: false,
                explanation: 'Glass doesn\'t block the field — it polarizes under it. The aligned dipoles in the dielectric actually enhance charge storage, increasing capacitance.',
              },
              {
                text: 'Capacitance stays the same — only geometry matters',
                correct: false,
                explanation: 'Geometry (A and d) matters, but so does the dielectric material. C = ε₀εrA/d — the relative permittivity εr is a direct multiplier on capacitance.',
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
