/**
 * Presentational SVG diagrams for the Circuit Theorems section.
 *
 * All diagrams are `aria-hidden` — every parent renders an adjacent one-sentence
 * text description. Styling follows InteractiveLab/CircuitDiagram.tsx: CSS-var
 * wires/labels, blue sources, red resistor zig-zags, amber current arrows.
 */

export type PortMode = 'open' | 'voltmeter' | 'ammeter' | 'load';

const SVG_CLASS =
  'w-full h-auto [--circuit-wire:#334155] dark:[--circuit-wire:#94a3b8] [--circuit-text:#475569] dark:[--circuit-text:#94a3b8]';
const WIRE = 'var(--circuit-wire)';
const TEXT = 'var(--circuit-text)';

/** Horizontal resistor zig-zag from (x, y) spanning 56 px. */
function HResistor({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <>
      <polyline
        points={`${x},${y} ${x + 7},${y - 9} ${x + 14},${y + 9} ${x + 21},${y - 9} ${x + 28},${y + 9} ${x + 35},${y - 9} ${x + 42},${y + 9} ${x + 49},${y - 9} ${x + 56},${y}`}
        stroke="#ef4444"
        strokeWidth="2"
        fill="none"
      />
      <text x={x + 28} y={y - 14} textAnchor="middle" fontSize="9" fill={TEXT}>{label}</text>
    </>
  );
}

/** Vertical resistor zig-zag from (x, y) spanning 56 px downward. */
function VResistor({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <>
      <polyline
        points={`${x},${y} ${x - 9},${y + 7} ${x + 9},${y + 14} ${x - 9},${y + 21} ${x + 9},${y + 28} ${x - 9},${y + 35} ${x + 9},${y + 42} ${x - 9},${y + 49} ${x},${y + 56}`}
        stroke="#ef4444"
        strokeWidth="2"
        fill="none"
      />
      <text x={x + 14} y={y + 31} textAnchor="start" fontSize="9" fill={TEXT}>{label}</text>
    </>
  );
}

/** Voltage source: blue circle with +/− (plus terminal up). */
function VoltageSource({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <>
      <circle cx={x} cy={y} r="18" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <text x={x} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">+</text>
      <text x={x} y={y + 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">-</text>
      <text x={x - 24} y={y + 3} textAnchor="end" fontSize="9" fill={TEXT}>{label}</text>
    </>
  );
}

/** Current source: blue circle with an upward arrow (injects toward the top rail). */
function CurrentSource({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <>
      <circle cx={x} cy={y} r="18" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <line x1={x} y1={y + 10} x2={x} y2={y - 6} stroke="#3b82f6" strokeWidth="2" />
      <polygon points={`${x - 4},${y - 5} ${x + 4},${y - 5} ${x},${y - 12}`} fill="#3b82f6" />
      <text x={x + 24} y={y + 3} textAnchor="start" fontSize="9" fill={TEXT}>{label}</text>
    </>
  );
}

/** Three-line ground glyph hanging from (x, y). */
function Ground({ x, y }: { x: number; y: number }) {
  return (
    <>
      <line x1={x} y1={y} x2={x} y2={y + 8} stroke={WIRE} strokeWidth="2" />
      <line x1={x - 14} y1={y + 8} x2={x + 14} y2={y + 8} stroke={WIRE} strokeWidth="2" />
      <line x1={x - 9} y1={y + 13} x2={x + 9} y2={y + 13} stroke={WIRE} strokeWidth="1.5" />
      <line x1={x - 4} y1={y + 18} x2={x + 4} y2={y + 18} stroke={WIRE} strokeWidth="1" />
    </>
  );
}

/** Open port terminal dot. */
function PortDot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r="3.5" stroke={WIRE} strokeWidth="2" fill="none" />;
}

/** Meter circle (voltmeter "V" or ammeter "A") wired across a port column. */
function Meter({ x, top, bottom, glyph }: { x: number; top: number; bottom: number; glyph: 'V' | 'A' }) {
  const cy = (top + bottom) / 2;
  return (
    <>
      <line x1={x} y1={top} x2={x} y2={cy - 14} stroke={WIRE} strokeWidth="2" />
      <line x1={x} y1={cy + 14} x2={x} y2={bottom} stroke={WIRE} strokeWidth="2" />
      <circle cx={x} cy={cy} r="14" stroke="#f59e0b" strokeWidth="2" fill="none" />
      <text x={x} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#f59e0b">{glyph}</text>
    </>
  );
}

/** A load resistor wired across a port column. */
function PortLoad({ x, top, bottom, label }: { x: number; top: number; bottom: number; label: string }) {
  const mid = (top + bottom) / 2 - 28;
  return (
    <>
      <line x1={x} y1={top} x2={x} y2={mid} stroke={WIRE} strokeWidth="2" />
      <VResistor x={x} y={mid} label={label} />
      <line x1={x} y1={mid + 56} x2={x} y2={bottom} stroke={WIRE} strokeWidth="2" />
    </>
  );
}

/** What is attached across a port (two stacked terminals at x, yTop/yBottom). */
function PortAttachment({ mode, loadR, x, yTop, yBottom }: {
  mode: PortMode;
  loadR?: number;
  x: number;
  yTop: number;
  yBottom: number;
}) {
  if (mode === 'open') return null;
  const stub = 26;
  return (
    <>
      <line x1={x} y1={yTop} x2={x + stub} y2={yTop} stroke={WIRE} strokeWidth="2" />
      <line x1={x} y1={yBottom} x2={x + stub} y2={yBottom} stroke={WIRE} strokeWidth="2" />
      {mode === 'voltmeter' && <Meter x={x + stub} top={yTop} bottom={yBottom} glyph="V" />}
      {mode === 'ammeter' && <Meter x={x + stub} top={yTop} bottom={yBottom} glyph="A" />}
      {mode === 'load' && (
        <PortLoad x={x + stub} top={yTop} bottom={yBottom} label={`R_L = ${loadR ?? '?'} Ω`} />
      )}
    </>
  );
}

interface SourceNetworkDiagramProps {
  /** Whether the 24 V voltage source is on (off → replaced by a short). */
  vOn?: boolean;
  /** Whether the 2 A current source is on (off → replaced by an open). */
  iOn?: boolean;
  /** What is attached across the A–ground port. */
  portMode?: PortMode;
  /** Load resistance label when portMode is 'load'. */
  loadR?: number;
}

/**
 * The ONE fixed source network of the section: 24 V in series with R1 = 6 Ω
 * into node A, a 2 A source injecting into A, R2 = 3 Ω from A to ground,
 * port = A–ground.
 */
export function SourceNetworkDiagram({
  vOn = true,
  iOn = true,
  portMode = 'open',
  loadR,
}: SourceNetworkDiagramProps) {
  const topY = 50;
  const botY = 190;
  const portX = 330;

  return (
    <svg viewBox="0 0 420 240" className={SVG_CLASS} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Left branch: 24 V source (or its dead short) */}
      <line x1="40" y1={topY} x2="40" y2="102" stroke={WIRE} strokeWidth="2" />
      {vOn ? (
        <VoltageSource x={40} y={120} label="24 V" />
      ) : (
        <>
          <line x1="40" y1="102" x2="40" y2="138" stroke={WIRE} strokeWidth="2" />
          <text x="14" y="123" textAnchor="end" fontSize="8" fill={TEXT}>replaced</text>
          <text x="14" y="133" textAnchor="end" fontSize="8" fill={TEXT}>by short</text>
        </>
      )}
      <line x1="40" y1="138" x2="40" y2={botY} stroke={WIRE} strokeWidth="2" />

      {/* Top rail with R1 — everything right of R1 is node A */}
      <line x1="40" y1={topY} x2="80" y2={topY} stroke={WIRE} strokeWidth="2" />
      <HResistor x={80} y={topY} label="R1 = 6 Ω" />
      <line x1="136" y1={topY} x2={portX} y2={topY} stroke={WIRE} strokeWidth="2" />
      <circle cx="210" cy={topY} r="3" fill={WIRE} />
      <text x="210" y={topY - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill={TEXT}>A</text>

      {/* Middle branch: 2 A current source (or its dead open) */}
      {iOn ? (
        <>
          <line x1="190" y1={topY} x2="190" y2="102" stroke={WIRE} strokeWidth="2" />
          <CurrentSource x={190} y={120} label="2 A" />
          <line x1="190" y1="138" x2="190" y2={botY} stroke={WIRE} strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1="190" y1={topY} x2="190" y2="100" stroke={WIRE} strokeWidth="2" />
          <circle cx="190" cy="104" r="3" stroke={WIRE} strokeWidth="1.5" fill="none" />
          <circle cx="190" cy="136" r="3" stroke={WIRE} strokeWidth="1.5" fill="none" />
          <line x1="190" y1="140" x2="190" y2={botY} stroke={WIRE} strokeWidth="2" />
          <text x="210" y="118" textAnchor="start" fontSize="8" fill={TEXT}>replaced</text>
          <text x="210" y="128" textAnchor="start" fontSize="8" fill={TEXT}>by open</text>
        </>
      )}

      {/* Right branch: R2 to ground */}
      <line x1="265" y1={topY} x2="265" y2="92" stroke={WIRE} strokeWidth="2" />
      <VResistor x={265} y={92} label="R2 = 3 Ω" />
      <line x1="265" y1="148" x2="265" y2={botY} stroke={WIRE} strokeWidth="2" />

      {/* Bottom rail + ground */}
      <line x1="40" y1={botY} x2={portX} y2={botY} stroke={WIRE} strokeWidth="2" />
      <Ground x={120} y={botY} />

      {/* Port terminals */}
      <line x1={portX} y1={topY} x2={portX + 24} y2={topY} stroke={WIRE} strokeWidth="2" />
      <line x1={portX} y1={botY} x2={portX + 24} y2={botY} stroke={WIRE} strokeWidth="2" />
      <PortDot x={portX + 28} y={topY} />
      <PortDot x={portX + 28} y={botY} />
      <text x={portX + 28} y="124" textAnchor="middle" fontSize="8" fill={TEXT}>port</text>

      <PortAttachment mode={portMode} loadR={loadR} x={portX + 32} yTop={topY} yBottom={botY} />
    </svg>
  );
}

/** The Thevenin twin: 12 V in series with 2 Ω, port-aligned to the full network. */
export function TheveninTwinDiagram({ loadR }: { loadR?: number }) {
  const topY = 50;
  const botY = 190;
  const portX = 190;

  return (
    <svg viewBox="0 0 290 240" className={SVG_CLASS} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="40" y1={topY} x2="40" y2="102" stroke={WIRE} strokeWidth="2" />
      <VoltageSource x={40} y={120} label="12 V" />
      <line x1="40" y1="138" x2="40" y2={botY} stroke={WIRE} strokeWidth="2" />

      <line x1="40" y1={topY} x2="70" y2={topY} stroke={WIRE} strokeWidth="2" />
      <HResistor x={70} y={topY} label="R_th = 2 Ω" />
      <line x1="126" y1={topY} x2={portX} y2={topY} stroke={WIRE} strokeWidth="2" />

      <line x1="40" y1={botY} x2={portX} y2={botY} stroke={WIRE} strokeWidth="2" />
      <Ground x={110} y={botY} />

      <PortDot x={portX + 4} y={topY} />
      <PortDot x={portX + 4} y={botY} />
      <text x={portX + 4} y="124" textAnchor="middle" fontSize="8" fill={TEXT}>port</text>

      <PortAttachment mode={loadR ? 'load' : 'open'} loadR={loadR} x={portX + 8} yTop={topY} yBottom={botY} />
    </svg>
  );
}

/** The Norton dual: 6 A in parallel with 2 Ω. */
export function NortonDiagram() {
  const topY = 50;
  const botY = 190;
  const portX = 190;

  return (
    <svg viewBox="0 0 290 240" className={SVG_CLASS} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="50" y1={topY} x2="50" y2="102" stroke={WIRE} strokeWidth="2" />
      <CurrentSource x={50} y={120} label="6 A" />
      <line x1="50" y1="138" x2="50" y2={botY} stroke={WIRE} strokeWidth="2" />

      <line x1="50" y1={topY} x2={portX} y2={topY} stroke={WIRE} strokeWidth="2" />
      <line x1="50" y1={botY} x2={portX} y2={botY} stroke={WIRE} strokeWidth="2" />

      {/* Parallel R_N branch */}
      <line x1="125" y1={topY} x2="125" y2="92" stroke={WIRE} strokeWidth="2" />
      <VResistor x={125} y={92} label="R_N = 2 Ω" />
      <line x1="125" y1="148" x2="125" y2={botY} stroke={WIRE} strokeWidth="2" />

      <Ground x={85} y={botY} />

      <PortDot x={portX + 4} y={topY} />
      <PortDot x={portX + 4} y={botY} />
      <text x={portX + 4} y="124" textAnchor="middle" fontSize="8" fill={TEXT}>port</text>
    </svg>
  );
}
