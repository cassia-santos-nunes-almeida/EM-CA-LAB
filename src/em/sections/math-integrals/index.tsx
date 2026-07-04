import { useEffect, useRef, useState } from 'react';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { LabLayout } from '@shared/components/common/LabLayout';
import { EquationBox } from '@em/components/common/EquationBox';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { useProgressStore, useThemeStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import type { QuizQuestion } from '@em/types';
import {
  fluxTilted,
  pathIntegralUniform,
  netFluxBox,
  circulationBox,
  fieldUniform,
  fieldPointSource,
  fieldVortex,
  type Field2,
} from './physics';

// Same epsilon-clamp discipline as math-vectors' CROSS_EPS: several readouts
// here are sums/cosines that land on exact zero only up to float noise (e.g.
// the path integral at 270°, or the point-source circulation), and
// Number.prototype.toFixed happily prints "-0.0" for a tiny negative residual.
const FLUX_EPS = 1e-9;
function clampZero(v: number): number {
  return Math.abs(v) < FLUX_EPS ? 0 : v;
}

const FIELD_PRESETS: Record<'uniform' | 'point' | 'vortex', Field2> = {
  uniform: fieldUniform,
  point: fieldPointSource,
  vortex: fieldVortex,
};

const Q_PERP_PATH: QuizQuestion = {
  question: 'Along a path that is everywhere perpendicular to E, what is ∫E·dl?',
  options: [
    'Exactly zero — the dot product kills every step',
    'E times the path length',
    'It depends on how long the path is',
    'Negative',
  ],
  correctIndex: 0,
  explanation:
    "∫E·dl = ∫|E||dl|cosθ, and θ = 90° at every step along this path, so each term in the sum is zero no matter how long the path runs. It's the same symmetry move Gauss's and Ampère's laws lean on: choose a path or surface where the field is either parallel (θ = 0°, the integral factors to E×length) or perpendicular (θ = 90°, it vanishes) to dl/dA at every point.",
};

const Q_CLOSED_UNIFORM = {
  question: 'Close the surface: a sealed box sits in a uniform field. What is the NET flux through the whole closed box, and why?',
  answer:
    "Zero. Every line that enters one face exits another; with outward normals, ∮E·dA counts out-minus-in — net outflow. Only enclosed sources make the closed-surface total nonzero — which is exactly Gauss's law's punchline. Check it on the bench: Local view, Uniform preset — the flux readout sits at 0.00 at every box size.",
  hints: [
    'Track one field line through the box.',
    'The closed-integral sign ∮ means the whole skin, outward normals everywhere: exits count positive, entries negative.',
  ],
};

const Q_POINT_SOURCE = {
  question: 'Switch the bench to Local view and pick the Point source field. Predict: as you shrink the box around the source, what happens to the outward-flux readout — and what is the divergence at a point AWAY from the source?',
  answer:
    "The flux readout stays put at ≈6.28 (2π per unit depth): every box that encloses the source catches everything it emits, however small the box. Away from the source the divergence is ZERO — whatever flows into a small box there flows back out (the field spreads and weakens at exactly the compensating rate). All the source-ness lives at one point: that is precisely how Gauss's law reads charge. Contrast the Vortex preset: flux 0 everywhere, but circulation 2 × box area — that is curl.",
  hints: [
    'Just try it: sweep the box slider and watch the flux readout.',
    'Divergence is net outflow per unit volume of a tiny box — away from the source, is any field being created inside the box?',
  ],
};

const CHALLENGE = {
  title: 'Half-flux hunt',
  description: "Use the Flux Meter to pin down two cosθ landmarks: the tilt where a loop's flux is exactly half its face-on value, and the two path directions where ∫E·dl vanishes.",
  instructions: [
    'Set the tilt slider to 0° (face-on) and read the flux readout — that is your 100% baseline.',
    'Sweep the tilt slider upward and watch the flux readout fall. Find the angle where it reads exactly HALF the baseline. (It is not 45° — flux runs on cosθ, not a straight-line drop.)',
    'Switch to Path mode and sweep the direction slider through the full 360°. Find the two angles where the ∫E·dl readout reads exactly zero.',
  ],
  hint: 'cosθ = ½ at 60° — the readout falls slowly at first, then fast.',
};

const TOC = [
  { id: 'math-integrals-flux-sim', label: 'Lab: Flux Meter' },
  { id: 'math-integrals-concept-checks', label: 'Concept Checks' },
  { id: 'math-integrals-theory', label: 'Theory: Line & Surface Integrals' },
  { id: 'math-integrals-challenge', label: 'Guided Challenge' },
];

// Background/foreground world-space offsets shared by the flux and path
// canvases: five evenly-spaced vertical field lines standing in for a
// uniform E field.
const FIELD_LINE_OFFSETS = [-3, -1.5, 0, 1.5, 3];

function drawArrowSeg(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, lineWidth: number,
) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath(); // arrowhead
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

export function MathIntegralsSection() {
  const [mode, setMode] = useState<'flux' | 'path' | 'local'>('flux');
  const [tilt, setTilt] = useState(30);
  const [pathAngle, setPathAngle] = useState(45);
  const [fieldPreset, setFieldPreset] = useState<'uniform' | 'point' | 'vortex'>('uniform');
  const [boxHalf, setBoxHalf] = useState(1);
  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
  const animationRef = useRef(0);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  // Theme-aware canvas (audit C-02 defect class: hardcoded hexes go illegible in
  // dark mode) — the em house pattern; math-vectors does the same.
  const isDarkMode = useThemeStore((s) => s.theme) === 'dark';

  useEffect(() => {
    const colField = isDarkMode ? '#60a5fa' : '#2563eb';
    const colPierced = isDarkMode ? '#34d399' : '#059669';
    const colSurface = isDarkMode ? '#f87171' : '#dc2626';
    const colPath = isDarkMode ? '#fbbf24' : '#d97706';
    const colBox = isDarkMode ? '#f87171' : '#dc2626';
    const colAxis = isDarkMode ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.35)';

    const render = () => {
      const frame = prepareFrame();
      if (!frame) {
        // Canvas hidden behind the gate: keep the loop alive (gauss/math-vectors pattern).
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const { ctx, width, height } = frame;
      const cx = width / 2;
      const cy = height / 2;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = colAxis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
      ctx.stroke();

      if (mode === 'flux') {
        const worldScale = Math.min(width, height) / 8;
        const R = Math.min(width, height) * 0.26;
        const tiltRad = (tilt * Math.PI) / 180;
        const dirX = Math.cos(tiltRad);
        const dirY = Math.sin(tiltRad);
        const segX1 = cx - R * dirX, segY1 = cy - R * dirY;
        const segX2 = cx + R * dirX, segY2 = cy + R * dirY;
        const segXMin = Math.min(segX1, segX2) - 1;
        const segXMax = Math.max(segX1, segX2) + 1;

        FIELD_LINE_OFFSETS.forEach((dx) => {
          const x = cx + dx * worldScale;
          // Edge-on (90°) pierces NOTHING — the ±1px x-extent padding would
          // otherwise let the center line pass and contradict the 0.0 readout.
          const pierced = tilt < 90 && x >= segXMin && x <= segXMax;
          drawArrowSeg(ctx, x, height - 16, x, 16, pierced ? colPierced : colField, pierced ? 2.5 : 1.5);
        });

        ctx.strokeStyle = colSurface;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(segX1, segY1);
        ctx.lineTo(segX2, segY2);
        ctx.stroke();
      } else if (mode === 'path') {
        const worldScale = Math.min(width, height) / 8;
        FIELD_LINE_OFFSETS.forEach((dx) => {
          const x = cx + dx * worldScale;
          drawArrowSeg(ctx, x, height - 16, x, 16, colField, 1.2);
        });
        const rad = (pathAngle * Math.PI) / 180;
        const halfLen = worldScale * 1; // 2-unit path, 1 unit each side of center
        // pathAngle is measured FROM THE FIELD (the vertical up-arrows), matching
        // the readout's E·L·cos(pathAngle): 0° = parallel to the field (max),
        // 90° = horizontal (zero), 180° = antiparallel (−max). Hence sin/cos.
        const ux = Math.sin(rad), uy = Math.cos(rad);
        const sx = cx - ux * halfLen, sy = cy + uy * halfLen; // canvas y is down; math y is up
        const ex = cx + ux * halfLen, ey = cy - uy * halfLen;
        drawArrowSeg(ctx, sx, sy, ex, ey, colPath, 3);
      } else {
        const field = FIELD_PRESETS[fieldPreset];
        const xHalfWorld = 2.2, yHalfWorld = 1.7;
        const worldScale = Math.min(width / (2 * xHalfWorld), height / (2 * yHalfWorld));
        const cols = 9, rows = 7;
        const maxArrowPx = 14; // length cap so the point-source arrows near the origin don't blow up
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const wx = -xHalfWorld + (i + 0.5) * ((2 * xHalfWorld) / cols);
            const wy = -yHalfWorld + (j + 0.5) * ((2 * yHalfWorld) / rows);
            const v = field({ x: wx, y: wy });
            const mag = Math.hypot(v.x, v.y);
            // Zero vector (e.g. the vortex center): nothing to draw — a
            // zero-length segment would still paint a phantom 8px arrowhead.
            if (mag < 1e-12) continue;
            const cappedWorld = Math.min(mag, maxArrowPx / worldScale);
            const ux2 = v.x / mag;
            const uy2 = v.y / mag;
            const px = cx + wx * worldScale;
            const py = cy - wy * worldScale;
            const ex2 = px + ux2 * cappedWorld * worldScale;
            const ey2 = py - uy2 * cappedWorld * worldScale;
            drawArrowSeg(ctx, px, py, ex2, ey2, colField, 1.2);
          }
        }
        const boxPx = boxHalf * worldScale;
        ctx.strokeStyle = colBox;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - boxPx, cy - boxPx, boxPx * 2, boxPx * 2);
      }

      animationRef.current = requestAnimationFrame(render);
    };
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [prepareFrame, mode, tilt, pathAngle, fieldPreset, boxHalf, isDarkMode]);

  const bench = (
    <SectionAnchor id="math-integrals-flux-sim" label="Lab: Flux Meter" className="scroll-mt-4">
      <PredictionGate
        question="A flat loop sits face-on in a uniform field. You tilt it all the way to edge-on (90°). What happens to the flux through it?"
        options={[
          { id: 'zero', label: 'It drops to exactly zero' },
          { id: 'same', label: 'It stays the same — same loop, same field' },
          { id: 'half', label: 'It halves' },
          { id: 'flip', label: 'It reverses sign' },
        ]}
        getCorrectAnswer={() => 'zero'}
        explanation={<span>Flux counts field lines <em>through</em> the surface: Φ = E·A·cosθ. Edge-on, every line skims past and none pierce — cos90° = 0. This is the "E ⊥ dA contributes nothing" move Gauss's law leans on next section.</span>}
        onPredict={(correct) => markPredictionGate('math-integrals', correct)}
      >
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Flux meter: field arrows with a tiltable surface, a directional path, or a closed box with flux and circulation readouts, depending on mode"
            className="w-full h-[300px] rounded-md bg-white dark:bg-slate-900"
          />
          <ControlPanel title="Flux Meter Controls">
            <div className="flex gap-2 mb-4" role="group" aria-label="Bench mode">
              {([['flux', 'Flux Φ'], ['path', 'Path ∫E·dl'], ['local', 'Local view']] as const).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`px-3 py-1 rounded border text-sm ${mode === m
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {mode === 'flux' && (
              <Slider label="Tilt from face-on (°)" value={tilt} min={0} max={90} step={1} onChange={setTilt} />
            )}
            {mode === 'path' && (
              <Slider label="Path direction (°)" value={pathAngle} min={0} max={360} step={5} onChange={setPathAngle} />
            )}
            {mode === 'local' && (
              <>
                <div className="flex gap-2 mb-4" role="group" aria-label="Field preset">
                  {([['uniform', 'Uniform'], ['point', 'Point source'], ['vortex', 'Vortex']] as const).map(([p, label]) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFieldPreset(p)}
                      aria-pressed={fieldPreset === p}
                      className={`px-3 py-1 rounded border text-sm ${fieldPreset === p
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Slider label="Box half-size" value={boxHalf} min={0.4} max={1.5} step={0.1} onChange={setBoxHalf} />
              </>
            )}
          </ControlPanel>
          {mode === 'flux' && (
            <p className="font-mono text-sm" data-testid="flux-readout">
              Φ = E·A·cosθ = 200 × 0.50 × cos({tilt}°) = {clampZero(fluxTilted(200, 0.5, tilt)).toFixed(1)}
            </p>
          )}
          {mode === 'path' && (
            <p className="font-mono text-sm" data-testid="path-readout">
              ∫E·dl = E·L·cosθ = 10 × 2 × cos({pathAngle}°) = {clampZero(pathIntegralUniform(10, 2, pathAngle)).toFixed(1)}
            </p>
          )}
          {mode === 'local' && (
            <div className="space-y-1">
              <p className="font-mono text-sm" data-testid="box-flux-readout">
                ∮F·n̂ dl (out of the box) = {clampZero(netFluxBox(FIELD_PRESETS[fieldPreset], boxHalf, 128)).toFixed(2)} per unit depth
              </p>
              <p className="font-mono text-sm" data-testid="box-circulation-readout">
                ∮F·t̂ dl (around the box, CCW) = {clampZero(circulationBox(FIELD_PRESETS[fieldPreset], boxHalf, 128)).toFixed(2)} per unit depth
              </p>
            </div>
          )}
        </div>
      </PredictionGate>
    </SectionAnchor>
  );

  const theory = (
    <>
      <SectionAnchor id="math-integrals-concept-checks" label="Concept Checks" className="scroll-mt-4">
        <div className="space-y-4">
          <ConceptCheck data={{ mode: 'predict-reveal', question: Q_CLOSED_UNIFORM.question, answer: Q_CLOSED_UNIFORM.answer, hints: Q_CLOSED_UNIFORM.hints }} onComplete={() => incrementConceptChecks('math-integrals')} onHint={() => incrementHints('math-integrals')} />
          <ConceptCheck data={toConceptCheck(Q_PERP_PATH)} onComplete={() => incrementConceptChecks('math-integrals')} onHint={() => incrementHints('math-integrals')} />
          <ConceptCheck data={{ mode: 'predict-reveal', question: Q_POINT_SOURCE.question, answer: Q_POINT_SOURCE.answer, hints: Q_POINT_SOURCE.hints }} onComplete={() => incrementConceptChecks('math-integrals')} onHint={() => incrementHints('math-integrals')} />
        </div>
      </SectionAnchor>
      <SectionAnchor id="math-integrals-theory" label="Theory: Line & Surface Integrals" className="scroll-mt-4">
        <div className="space-y-4">
          <EquationBox
            title="Adding up a field"
            equations={[
              { label: 'Line integral (work per unit charge along C)', math: '\\int_C \\vec{E} \\cdot d\\vec{l}', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Flux through a surface', math: '\\Phi_E = \\int \\vec{E} \\cdot d\\vec{A}', color: 'text-red-600 dark:text-red-400' },
              { label: 'Closed surface (outward normals)', math: '\\oint \\vec{E} \\cdot d\\vec{A}' },
              { label: 'Uniform field, flat surface (θ from face-on: between E and the surface NORMAL; 0° face-on, 90° edge-on)', math: '\\Phi = E\\,A\\cos\\theta' },
            ]}
          />
          <WorkedSteps
            tryFirstPrompt="A point charge sits at the center of a sphere of radius R. Try writing ∮E·dA as E × (something) before revealing."
            steps={[
              {
                title: 'Step 1 — Chop the sphere into patches',
                body: (
                  <p>On every patch, E is parallel to dA (both point radially outward from the point charge), so the dot product collapses to a plain product: E·dA = E dA — no angle, no cosine needed.</p>
                ),
              },
              {
                title: 'Step 2 — Factor the symmetry',
                body: (
                  <>
                    <p className="mb-2">By symmetry, E is the same number on every patch, so it factors straight out of the sum:</p>
                    <MathWrapper formula="\oint \vec{E} \cdot d\vec{A} = E \oint dA = E\,(4\pi R^2)" block />
                  </>
                ),
              },
              {
                title: 'Step 3 — Why this is the whole course',
                body: (
                  <p>
                    This ONE move is the entire computational content of Gauss's and Ampère's laws; the sections ahead only ever choose surfaces that let you make it.
                  </p>
                ),
              },
            ]}
          />
          <CollapsibleSection title="The local view: divergence and curl" defaultOpen={false}>
            <div className="space-y-4">
              <EquationBox
                title="Shrink the box, shrink the loop"
                equations={[
                  { label: 'Divergence (flux per volume)', math: '\\nabla \\cdot \\vec{E} = \\lim_{V \\to 0} \\frac{1}{V} \\oint \\vec{E} \\cdot d\\vec{A}', color: 'text-red-600 dark:text-red-400' },
                  { label: 'Curl (circulation per area; loop ⊥ n̂, traversed right-handedly about n̂ — curl your right hand along C, thumb = n̂)', math: '(\\nabla \\times \\vec{B}) \\cdot \\hat{n} = \\lim_{A \\to 0} \\frac{1}{A} \\oint \\vec{B} \\cdot d\\vec{l}', color: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'Divergence theorem', math: '\\oint_S \\vec{E} \\cdot d\\vec{A} = \\int_V (\\nabla \\cdot \\vec{E})\\,dV' },
                  { label: "Stokes' theorem", math: '\\oint_C \\vec{B} \\cdot d\\vec{l} = \\int_S (\\nabla \\times \\vec{B}) \\cdot d\\vec{A}' },
                ]}
              />
              <p className="text-sm text-slate-700 dark:text-slate-300">
                One honesty note about the bench: it is a 2-D slice. Its closed 'surface' is the box OUTLINE and its flux is counted per unit depth into the screen, so its flux readout is the raw ∮F·n̂ dl — divide it by the box area yourself and you have the 2-D stand-in for (1/V)∮E·dA. Same idea, one dimension down; the 3-D forms on this card are the ones Maxwell's equations use.
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                The two theorems say the same thing at two zoom levels: total outflow through a skin = summed sources inside; total circulation around a rim = summed swirl across the sheet (with C and S oriented by the same right-hand pairing as the curl card). Section {getSectionNumber('maxwell')} writes all four field laws in this local language.
              </p>
            </div>
          </CollapsibleSection>
        </div>
      </SectionAnchor>
      <SectionAnchor id="math-integrals-challenge" label="Guided Challenge" className="scroll-mt-4">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>
    </>
  );

  return (
    <SectionLayout
      sectionId="math-integrals"
      hook="Gauss's law next section opens with ∮E·dA and never says what ∮, ·, or dA mean. Thirty minutes here buys every field law in the course: they are all one sentence about flux or circulation."
      toc={TOC}
    >
      <LabLayout leadWithBench theory={theory} bench={bench} />
    </SectionLayout>
  );
}
