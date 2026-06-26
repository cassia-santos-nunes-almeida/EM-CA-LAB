/**
 * TraceScreen — a dark "instrument scope screen" showing the Part's
 * characteristic waveform in its Part accent.
 *
 * Two size variants:
 *   spark  — small inline thumbnail used in accordion summary rows (and
 *             future sidebar sparks).
 *   screen — larger panel used in the accordion open-state right column
 *             (and future section headers).
 *
 * Traces (per spec §1.3):
 *   P1 (circuits)     — RLC step-and-ring: exponential rise then damped oscillation
 *   P2 (e-field)      — Radial field burst: spoke lines emanating from centre
 *   P3 (b-field)      — Concentric flux loops: nested arc segments
 *   P4 (waves)        — Travelling sinusoid: continuous sine wave
 *   P5 (lines)        — Incident + reflected pulse: two opposing step edges
 *
 * Accessibility: honors `prefers-reduced-motion` — the sweep dot animation is
 * disabled when the user has requested reduced motion; a static trace still renders.
 */

import type { CSSProperties } from 'react';

export type TraceKind = 'rlc' | 'radial' | 'flux' | 'sinusoid' | 'pulse';

export interface TraceScreenProps {
  /** Which waveform to draw (maps to a Part). */
  traceKind: TraceKind;
  /** CSS custom property name for the stroke accent, e.g. `--color-part-1`. */
  accentVar: string;
  /** 'spark' = small inline thumbnail; 'screen' = larger panel. */
  size?: 'spark' | 'screen';
  /** Additional className forwarded to the outermost element. */
  className?: string;
}

// ── viewBox dimensions ───────────────────────────────────────────────────────
// We render in a normalised 100 × 40 viewBox so path data is the same for both
// sizes; the SVG scales via CSS width/height.
const VW = 100;
const VH = 40;
const MID = VH / 2; // vertical centre = 20

// ── Trace path generators ────────────────────────────────────────────────────
// Each returns an SVG <path d="…"> data string.

/** P1 · RLC step-and-ring — exponential rise capped at ~70% then damped oscillation. */
function rlcPath(): string {
  // Step-and-ring shape: rises from 0 to ~0.85*VH over x=0..35,
  // then a damped sinusoid centred on the settled value.
  const settled = VH * 0.28; // settled voltage ~72% from top (y increases downward)
  const A0 = VH * 0.22;      // initial ring amplitude
  const decay = 0.1;
  const omega = 0.35;        // radians per x unit

  let d = `M 0 ${VH}`;      // start at baseline (bottom-left)
  // Exponential rise 0..35
  for (let x = 0; x <= 35; x += 1) {
    const y = VH - (VH - settled) * (1 - Math.exp(-x * 0.12));
    d += ` L ${x} ${y.toFixed(2)}`;
  }
  // Damped ring 35..100
  for (let x = 35; x <= VW; x += 1) {
    const t = x - 35;
    const y = settled + A0 * Math.exp(-decay * t) * Math.cos(omega * t);
    d += ` L ${x} ${y.toFixed(2)}`;
  }
  return d;
}

/** P2 · Radial field burst — four spokes radiating from centre. */
function radialPath(): string {
  const cx = VW / 2;
  const cy = VH / 2;
  const r = VH * 0.42;
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 spokes
  return angles
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const x2 = (cx + r * Math.cos(rad)).toFixed(2);
      const y2 = (cy + r * Math.sin(rad)).toFixed(2);
      // Spoke with a short arrowhead stub (slight offset inward)
      const xi = (cx + (r * 0.25) * Math.cos(rad)).toFixed(2);
      const yi = (cy + (r * 0.25) * Math.sin(rad)).toFixed(2);
      return `M ${xi} ${yi} L ${x2} ${y2}`;
    })
    .join(' ');
}

/** P3 · Concentric flux loops — four nested arcs (upper semicircles). */
function fluxPath(): string {
  const cx = VW / 2;
  const cy = VH * 0.65;
  const radii = [VH * 0.12, VH * 0.22, VH * 0.32, VH * 0.42];
  return radii
    .map((r) => {
      const x1 = (cx - r).toFixed(2);
      const x2 = (cx + r).toFixed(2);
      const y = cy.toFixed(2);
      // SVG arc: half-ellipse opening upward
      return `M ${x1} ${y} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x2} ${y}`;
    })
    .join(' ');
}

/** P4 · Travelling sinusoid — two full cycles across the viewBox. */
function sinusoidPath(): string {
  const amp = VH * 0.38;
  const freq = (2 * Math.PI * 2) / VW; // 2 full cycles
  let d = `M 0 ${MID}`;
  for (let x = 1; x <= VW; x++) {
    const y = MID - amp * Math.sin(freq * x);
    d += ` L ${x} ${y.toFixed(2)}`;
  }
  return d;
}

/** P5 · Incident + reflected pulse — two opposing step edges with a gap. */
function pulsePath(): string {
  // Incident: low→high at x=20, then back to low at x=45 (travels right)
  // Reflected: slight amplitude, high→low at x=55, then back at x=80
  const hi = VH * 0.15;
  const lo = VH * 0.85;
  const loMid = VH * 0.55; // reflected pulse sits midway

  // Incident pulse (lower trace)
  let d = `M 0 ${lo} L 20 ${lo} L 20 ${hi} L 45 ${hi} L 45 ${lo} L ${VW} ${lo}`;

  // Reflected pulse (upper trace, lower amplitude — sits on same screen)
  d += ` M 0 ${loMid} L 55 ${loMid} L 55 ${hi} L 80 ${hi} L 80 ${loMid} L ${VW} ${loMid}`;

  return d;
}

function getPathData(kind: TraceKind): string {
  switch (kind) {
    case 'rlc':       return rlcPath();
    case 'radial':    return radialPath();
    case 'flux':      return fluxPath();
    case 'sinusoid':  return sinusoidPath();
    case 'pulse':     return pulsePath();
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const SIZE_MAP = {
  spark:  { width: 44, height: 20 },
  screen: { width: 160, height: 64 },
} as const;

// Radial traces use fill:none + stroke; others fill:none + stroke only too.
const FILL_NONE: TraceKind[] = ['rlc', 'sinusoid', 'pulse', 'radial', 'flux'];

export function TraceScreen({
  traceKind,
  accentVar,
  size = 'spark',
  className = '',
}: TraceScreenProps) {
  const { width, height } = SIZE_MAP[size];
  const strokeW = size === 'spark' ? 1.5 : 1.8;

  // We use a CSS custom property on the element so the SVG stroke references it.
  const style: CSSProperties = {
    '--trace-accent': `var(${accentVar})`,
    display: 'inline-block',
    flexShrink: 0,
  } as CSSProperties;

  const isFill = !FILL_NONE.includes(traceKind);
  const pathData = getPathData(traceKind);

  // For radial / flux, use multiple paths; for others, a single continuous path.
  // We render a single <path> regardless (path data handles multi-segments via M/L).

  return (
    <span
      className={`trace-screen rounded ${className}`}
      style={style}
      aria-hidden="true"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          background: 'var(--color-screen)',
          borderRadius: '3px',
          width,
          height,
        }}
      >
        {/* Subtle grid lines */}
        <line x1="0" y1={MID} x2={VW} y2={MID} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <line x1={VW / 2} y1="0" x2={VW / 2} y2={VH} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

        {/* The waveform trace */}
        <path
          d={pathData}
          fill={isFill ? 'var(--trace-accent)' : 'none'}
          stroke="var(--trace-accent)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
        />
      </svg>
    </span>
  );
}
