import { useState } from 'react';
import { cmul, fromPolarDeg, toPolarDeg } from '@transmission/utils/complexMath';

/** Pixels per unit on the complex-plane SVG (viewBox is 320x320, origin at center). */
const SCALE = 13;
const CENTER = 160;

function toPoint(real: number, imag: number) {
  return { x: CENTER + real * SCALE, y: CENTER - imag * SCALE };
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  accent: string;
  onChange: (value: number) => void;
}

function SliderField({ label, value, min, max, step, unit, accent, onChange }: SliderFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`text-sm font-mono font-bold ${accent}`}>
          {value.toFixed(unit === '°' ? 0 : 1)}{unit}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-engineering-blue-600"
      />
    </label>
  );
}

/**
 * The Phasor Multiplier lab: an SVG complex plane (Re/Im axes + unit circle)
 * with two independently-sliderable phasors z₁, z₂ and their product z₁z₂
 * drawn as arrows from the origin — lengths visibly multiply, angles visibly
 * add. Owns its own slider state (no props); consumed inside a PredictionGate
 * so it only ever mounts after the gate is passed.
 */
export function PhasorMultiplierSim() {
  const [z1Mag, setZ1Mag] = useState(2);
  const [z1AngleDeg, setZ1AngleDeg] = useState(30);
  const [z2Mag, setZ2Mag] = useState(3);
  const [z2AngleDeg, setZ2AngleDeg] = useState(45);

  const z1 = fromPolarDeg(z1Mag, z1AngleDeg);
  const z2 = fromPolarDeg(z2Mag, z2AngleDeg);
  const product = cmul(z1, z2);
  const p = toPolarDeg(product);
  // Round BEFORE normalizing mod 360, so a raw angle of ~360° (two angles
  // summing to a full turn) can never render as the excluded "360.0°" endpoint.
  const shownAngle = (Math.round(((p.angleDeg + 360) % 360) * 10) / 10) % 360;

  const z1Point = toPoint(z1.real, z1.imag);
  const z2Point = toPoint(z2.real, z2.imag);
  const productPoint = toPoint(product.real, product.imag);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
        <SliderField
          label="|z₁|"
          value={z1Mag}
          min={0.5}
          max={3}
          step={0.5}
          unit=""
          accent="text-blue-600 dark:text-blue-400"
          onChange={setZ1Mag}
        />
        <SliderField
          label="∠z₁"
          value={z1AngleDeg}
          min={0}
          max={360}
          step={1}
          unit="°"
          accent="text-blue-600 dark:text-blue-400"
          onChange={setZ1AngleDeg}
        />
        <SliderField
          label="|z₂|"
          value={z2Mag}
          min={0.5}
          max={3}
          step={0.5}
          unit=""
          accent="text-amber-600 dark:text-amber-400"
          onChange={setZ2Mag}
        />
        <SliderField
          label="∠z₂"
          value={z2AngleDeg}
          min={0}
          max={360}
          step={1}
          unit="°"
          accent="text-amber-600 dark:text-amber-400"
          onChange={setZ2AngleDeg}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex flex-col items-center gap-3">
        <svg
          viewBox="0 0 320 320"
          className="w-full max-w-sm"
          role="img"
          aria-label="Complex plane showing z1, z2, and their product z1 z2 as arrows from the origin"
        >
          <defs>
            <marker id="phasor-arrow-z1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="fill-blue-600 dark:fill-blue-400" />
            </marker>
            <marker id="phasor-arrow-z2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="fill-amber-600 dark:fill-amber-400" />
            </marker>
            <marker id="phasor-arrow-product" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="fill-emerald-600 dark:fill-emerald-400" />
            </marker>
          </defs>

          {/* Unit circle — the |z| = 1 reference */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={SCALE}
            fill="none"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeDasharray="3 3"
          />

          {/* Re/Im axes */}
          <line x1={10} y1={CENTER} x2={310} y2={CENTER} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1} />
          <line x1={CENTER} y1={10} x2={CENTER} y2={310} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1} />
          <text x={296} y={CENTER - 6} fontSize="12" className="fill-slate-500 dark:fill-slate-400">Re</text>
          <text x={CENTER + 6} y={20} fontSize="12" className="fill-slate-500 dark:fill-slate-400">Im</text>

          {/* z1 — blue */}
          <line x1={CENTER} y1={CENTER} x2={z1Point.x} y2={z1Point.y} className="stroke-blue-600 dark:stroke-blue-400" strokeWidth={2} markerEnd="url(#phasor-arrow-z1)" />
          {/* z2 — amber */}
          <line x1={CENTER} y1={CENTER} x2={z2Point.x} y2={z2Point.y} className="stroke-amber-600 dark:stroke-amber-400" strokeWidth={2} markerEnd="url(#phasor-arrow-z2)" />
          {/* z1z2 — emerald, thicker */}
          <line x1={CENTER} y1={CENTER} x2={productPoint.x} y2={productPoint.y} className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth={3.5} markerEnd="url(#phasor-arrow-product)" />

          <text x={z1Point.x + 4} y={z1Point.y - 4} fontSize="12" fontWeight="bold" className="fill-blue-600 dark:fill-blue-400">z₁</text>
          <text x={z2Point.x + 4} y={z2Point.y - 4} fontSize="12" fontWeight="bold" className="fill-amber-600 dark:fill-amber-400">z₂</text>
          <text x={productPoint.x + 4} y={productPoint.y - 4} fontSize="12" fontWeight="bold" className="fill-emerald-600 dark:fill-emerald-400">z₁z₂</text>
        </svg>

        <p className="font-mono text-sm" data-testid="phasor-product-readout">z₁z₂ = {p.mag.toFixed(2)}∠{shownAngle.toFixed(1)}° — lengths multiply, angles add</p>
      </div>
    </div>
  );
}
