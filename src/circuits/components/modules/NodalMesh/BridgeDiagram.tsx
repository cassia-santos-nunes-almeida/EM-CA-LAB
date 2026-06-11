import { useId } from 'react';
import { BRIDGE_SOLUTION, type BridgeBranch } from './nodalMeshData';

interface BridgeDiagramProps {
  /** Branch to glow amber while a term is being picked. */
  highlightBranch?: BridgeBranch | null;
  /** Draw the ground glyph under the bottom rail (after the reference is chosen). */
  showGround?: boolean;
  /** Show the V_A / V_B unknown badges. */
  showUnknownLabels?: boolean;
  /** Paint the solved node voltages and the 0.6 A bridge-current arrow. */
  showSolution?: boolean;
}

/** Highlight underlay geometry per branch (x1, y1, x2, y2). */
const BRANCH_SEGMENTS: Record<BridgeBranch, [number, number, number, number]> = {
  r1: [140, 40, 140, 130],
  r2: [300, 40, 300, 130],
  r3: [140, 130, 140, 220],
  r4: [300, 130, 300, 220],
  r5: [140, 130, 300, 130],
};

/** Vertical zig-zag resistor polyline points, centered on x from y1 to y2. */
function verticalZigzag(x: number, y1: number, y2: number): string {
  const pts: string[] = [`${x},${y1}`];
  const span = y2 - y1;
  for (let i = 1; i <= 6; i++) {
    const dx = i % 2 === 1 ? -10 : 10;
    pts.push(`${x + dx},${y1 + (span * i) / 7}`);
  }
  pts.push(`${x},${y2}`);
  return pts.join(' ');
}

/** Horizontal zig-zag resistor polyline points, centered on y from x1 to x2. */
function horizontalZigzag(y: number, x1: number, x2: number): string {
  const pts: string[] = [`${x1},${y}`];
  const span = x2 - x1;
  for (let i = 1; i <= 6; i++) {
    const dy = i % 2 === 1 ? -10 : 10;
    pts.push(`${x1 + (span * i) / 7},${y + dy}`);
  }
  pts.push(`${x2},${y}`);
  return pts.join(' ');
}

/**
 * The fixed bridge circuit: 12 V source on the left, top rail = the source's
 * + node; R1 drops to node A, R2 drops to node B, R5 bridges A–B, R3/R4 drop
 * to the bottom rail. Presentational only (aria-hidden) — callers render an
 * adjacent one-sentence text description.
 */
export function BridgeDiagram({
  highlightBranch = null,
  showGround = false,
  showUnknownLabels = false,
  showSolution = false,
}: BridgeDiagramProps) {
  const markerId = useId();
  const wireColor = 'var(--circuit-wire)';
  const textColor = 'var(--circuit-text)';

  const resistorStroke = (branch: BridgeBranch) =>
    highlightBranch === branch ? '#f59e0b' : '#ef4444';

  return (
    <svg
      viewBox="0 0 420 260"
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
      {highlightBranch && (
        <line
          x1={BRANCH_SEGMENTS[highlightBranch][0]}
          y1={BRANCH_SEGMENTS[highlightBranch][1]}
          x2={BRANCH_SEGMENTS[highlightBranch][2]}
          y2={BRANCH_SEGMENTS[highlightBranch][3]}
          stroke="#f59e0b"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.3"
        />
      )}

      {/* 12 V source (left branch) */}
      <line x1="60" y1="40" x2="60" y2="110" stroke={wireColor} strokeWidth="2" />
      <circle cx="60" cy="130" r="20" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <text x="60" y="127" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">+</text>
      <text x="60" y="139" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">-</text>
      <text x="26" y="133" textAnchor="middle" fontSize="9" fill={textColor}>12 V</text>
      <line x1="60" y1="150" x2="60" y2="220" stroke={wireColor} strokeWidth="2" />

      {/* Top rail (the + node) */}
      <line x1="60" y1="40" x2="300" y2="40" stroke={wireColor} strokeWidth="2" />

      {/* R1: + node → A */}
      <line x1="140" y1="40" x2="140" y2="55" stroke={wireColor} strokeWidth="2" />
      <polyline points={verticalZigzag(140, 55, 115)} stroke={resistorStroke('r1')} strokeWidth="2" fill="none" />
      <line x1="140" y1="115" x2="140" y2="130" stroke={wireColor} strokeWidth="2" />
      <text x="120" y="88" textAnchor="end" fontSize="9" fill={textColor}>R1 = 2&#937;</text>

      {/* R2: + node → B */}
      <line x1="300" y1="40" x2="300" y2="55" stroke={wireColor} strokeWidth="2" />
      <polyline points={verticalZigzag(300, 55, 115)} stroke={resistorStroke('r2')} strokeWidth="2" fill="none" />
      <line x1="300" y1="115" x2="300" y2="130" stroke={wireColor} strokeWidth="2" />
      <text x="320" y="88" textAnchor="start" fontSize="9" fill={textColor}>R2 = 4&#937;</text>

      {/* R5: bridge A → B */}
      <line x1="140" y1="130" x2="170" y2="130" stroke={wireColor} strokeWidth="2" />
      <polyline points={horizontalZigzag(130, 170, 270)} stroke={resistorStroke('r5')} strokeWidth="2" fill="none" />
      <line x1="270" y1="130" x2="300" y2="130" stroke={wireColor} strokeWidth="2" />
      <text x="220" y="112" textAnchor="middle" fontSize="9" fill={textColor}>R5 = 4&#937;</text>

      {/* R3: A → bottom rail */}
      <line x1="140" y1="130" x2="140" y2="145" stroke={wireColor} strokeWidth="2" />
      <polyline points={verticalZigzag(140, 145, 205)} stroke={resistorStroke('r3')} strokeWidth="2" fill="none" />
      <line x1="140" y1="205" x2="140" y2="220" stroke={wireColor} strokeWidth="2" />
      <text x="120" y="178" textAnchor="end" fontSize="9" fill={textColor}>R3 = 4&#937;</text>

      {/* R4: B → bottom rail */}
      <line x1="300" y1="130" x2="300" y2="145" stroke={wireColor} strokeWidth="2" />
      <polyline points={verticalZigzag(300, 145, 205)} stroke={resistorStroke('r4')} strokeWidth="2" fill="none" />
      <line x1="300" y1="205" x2="300" y2="220" stroke={wireColor} strokeWidth="2" />
      <text x="320" y="178" textAnchor="start" fontSize="9" fill={textColor}>R4 = 2&#937;</text>

      {/* Bottom rail */}
      <line x1="60" y1="220" x2="300" y2="220" stroke={wireColor} strokeWidth="2" />

      {/* Node dots + names */}
      <circle cx="140" cy="130" r="4" fill={wireColor} />
      <circle cx="300" cy="130" r="4" fill={wireColor} />
      <circle cx="140" cy="40" r="3" fill={wireColor} />
      <circle cx="300" cy="40" r="3" fill={wireColor} />
      <text x="150" y="125" textAnchor="start" fontSize="11" fontWeight="bold" fill={textColor}>A</text>
      <text x="290" y="125" textAnchor="end" fontSize="11" fontWeight="bold" fill={textColor}>B</text>

      {/* Ground glyph on the bottom rail */}
      {showGround && (
        <>
          <line x1="220" y1="220" x2="220" y2="232" stroke={wireColor} strokeWidth="2" />
          <line x1="206" y1="232" x2="234" y2="232" stroke={wireColor} strokeWidth="2" />
          <line x1="211" y1="238" x2="229" y2="238" stroke={wireColor} strokeWidth="1.5" />
          <line x1="216" y1="244" x2="224" y2="244" stroke={wireColor} strokeWidth="1" />
          <text x="244" y="240" textAnchor="start" fontSize="8" fill={textColor}>0 V</text>
        </>
      )}

      {/* Unknown badges or solved values */}
      {showSolution ? (
        <>
          <text x="128" y="152" textAnchor="end" fontSize="10" fontWeight="bold" fill="#16a34a">
            V_A = {BRIDGE_SOLUTION.vA} V
          </text>
          <text x="312" y="152" textAnchor="start" fontSize="10" fontWeight="bold" fill="#16a34a">
            V_B = {BRIDGE_SOLUTION.vB} V
          </text>
          <line x1="185" y1="150" x2="250" y2="150" stroke="#f59e0b" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
          <text x="220" y="164" textAnchor="middle" fontSize="9" fontStyle="italic" fill="#f59e0b">
            I5 = {BRIDGE_SOLUTION.i5} A
          </text>
        </>
      ) : (
        showUnknownLabels && (
          <>
            <text x="128" y="152" textAnchor="end" fontSize="10" fontWeight="bold" fill="#3b82f6">V_A = ?</text>
            <text x="312" y="152" textAnchor="start" fontSize="10" fontWeight="bold" fill="#3b82f6">V_B = ?</text>
          </>
        )
      )}
    </svg>
  );
}
