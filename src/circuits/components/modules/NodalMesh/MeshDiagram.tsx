import { useId } from 'react';
import { MESH_SOLUTION, type MeshElement } from './nodalMeshData';
import { verticalZigzag, horizontalZigzag } from './zigzag';

interface MeshDiagramProps {
  /** True = mesh-1 arrow drawn clockwise. */
  mesh1CW: boolean;
  /** True = mesh-2 arrow drawn clockwise. */
  mesh2CW: boolean;
  /** Element to glow amber while a KVL term is being picked. */
  highlight?: MeshElement | null;
  /** Paint the solved mesh currents and the shared-branch readout. */
  showSolution?: boolean;
}

/** Highlight underlay geometry per element (x1, y1, x2, y2). */
const ELEMENT_SEGMENTS: Record<MeshElement, [number, number, number, number]> = {
  vs1: [50, 40, 50, 180],
  r1: [90, 40, 170, 40],
  r3: [210, 40, 210, 180],
  r2: [250, 40, 330, 40],
  vs2: [370, 40, 370, 180],
};

/** Circulating-current arrow: a half-circle over the top with an arrowhead. */
function MeshArrow({ cx, cy, cw, label, markerId }: { cx: number; cy: number; cw: boolean; label: string; markerId: string }) {
  const r = 22;
  const d = cw
    ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
    : `M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx - r} ${cy}`;
  return (
    <>
      <path d={d} stroke="#f59e0b" strokeWidth="1.5" fill="none" markerEnd={`url(#${markerId})`} />
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fontStyle="italic" fill="#f59e0b">{label}</text>
    </>
  );
}

/**
 * The fixed two-window mesh circuit: 20 V source (left, + up), R1 = 2 Ω
 * top-left, shared R3 = 4 Ω on the center wall, R2 = 8 Ω top-right, 4 V
 * source (right, + up — opposing clockwise i2). Presentational only
 * (aria-hidden) — callers render an adjacent one-sentence text description.
 */
export function MeshDiagram({
  mesh1CW,
  mesh2CW,
  highlight = null,
  showSolution = false,
}: MeshDiagramProps) {
  const markerId = useId();
  const wireColor = 'var(--circuit-wire)';
  const textColor = 'var(--circuit-text)';

  const resistorStroke = (el: MeshElement) => (highlight === el ? '#f59e0b' : '#ef4444');

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
          <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
        </marker>
      </defs>

      {/* Highlight underlay */}
      {highlight && (
        <line
          x1={ELEMENT_SEGMENTS[highlight][0]}
          y1={ELEMENT_SEGMENTS[highlight][1]}
          x2={ELEMENT_SEGMENTS[highlight][2]}
          y2={ELEMENT_SEGMENTS[highlight][3]}
          stroke="#f59e0b"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.3"
        />
      )}

      {/* Left branch: 20 V source, + up */}
      <line x1="50" y1="40" x2="50" y2="90" stroke={wireColor} strokeWidth="2" />
      <circle cx="50" cy="110" r="20" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <text x="50" y="107" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">+</text>
      <text x="50" y="119" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">-</text>
      <text x="22" y="113" textAnchor="middle" fontSize="9" fill={textColor}>20 V</text>
      <line x1="50" y1="130" x2="50" y2="180" stroke={wireColor} strokeWidth="2" />

      {/* Top rail with R1 and R2 */}
      <line x1="50" y1="40" x2="90" y2="40" stroke={wireColor} strokeWidth="2" />
      <polyline points={horizontalZigzag(40, 90, 170)} stroke={resistorStroke('r1')} strokeWidth="2" fill="none" />
      <text x="130" y="20" textAnchor="middle" fontSize="9" fill={textColor}>R1 = 2&#937;</text>
      <line x1="170" y1="40" x2="250" y2="40" stroke={wireColor} strokeWidth="2" />
      <polyline points={horizontalZigzag(40, 250, 330)} stroke={resistorStroke('r2')} strokeWidth="2" fill="none" />
      <text x="290" y="20" textAnchor="middle" fontSize="9" fill={textColor}>R2 = 8&#937;</text>
      <line x1="330" y1="40" x2="370" y2="40" stroke={wireColor} strokeWidth="2" />

      {/* Shared center branch: R3 */}
      <line x1="210" y1="40" x2="210" y2="70" stroke={wireColor} strokeWidth="2" />
      <polyline points={verticalZigzag(210, 70, 150)} stroke={resistorStroke('r3')} strokeWidth="2" fill="none" />
      <line x1="210" y1="150" x2="210" y2="180" stroke={wireColor} strokeWidth="2" />
      <text x="226" y="113" textAnchor="start" fontSize="9" fill={textColor}>R3 = 4&#937;</text>

      {/* Right branch: 4 V source, + up (opposing clockwise i2) */}
      <line x1="370" y1="40" x2="370" y2="90" stroke={wireColor} strokeWidth="2" />
      <circle cx="370" cy="110" r="20" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <text x="370" y="107" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">+</text>
      <text x="370" y="119" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">-</text>
      <text x="398" y="113" textAnchor="middle" fontSize="9" fill={textColor}>4 V</text>
      <line x1="370" y1="130" x2="370" y2="180" stroke={wireColor} strokeWidth="2" />

      {/* Bottom rail */}
      <line x1="50" y1="180" x2="370" y2="180" stroke={wireColor} strokeWidth="2" />

      {/* Junction dots */}
      <circle cx="210" cy="40" r="3" fill={wireColor} />
      <circle cx="210" cy="180" r="3" fill={wireColor} />

      {/* Mesh-current arrows */}
      <MeshArrow cx={130} cy={112} cw={mesh1CW} label="i1" markerId={markerId} />
      <MeshArrow cx={290} cy={112} cw={mesh2CW} label="i2" markerId={markerId} />

      {/* Solved readouts */}
      {showSolution && (
        <>
          <text x="130" y="152" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#16a34a">
            i1 = {MESH_SOLUTION.i1} A
          </text>
          <text x="290" y="152" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#16a34a">
            i2 = {MESH_SOLUTION.i2} A
          </text>
          <line x1="194" y1="85" x2="194" y2="135" stroke="#f59e0b" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
          <text x="186" y="113" textAnchor="end" fontSize="9" fontStyle="italic" fill="#f59e0b">
            {MESH_SOLUTION.shared} A
          </text>
          <text x="226" y="130" textAnchor="start" fontSize="9" fontWeight="bold" fill="#16a34a">
            {MESH_SOLUTION.vR3} V
          </text>
        </>
      )}
    </svg>
  );
}
