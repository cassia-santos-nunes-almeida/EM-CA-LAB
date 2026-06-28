import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { EquationBox } from '@em/components/common/EquationBox';
import { HintBox } from '@em/components/common/HintBox';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { PhysicsChart } from '@em/components/common/PhysicsChart';
import { FigureImage } from '@shared/components/common/FigureImage';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { LabLayout } from '@shared/components/common/LabLayout';
import { LabStation } from '@shared/components/common/LabStation';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PlausibilityCallout } from '@shared/components/common/PlausibilityCallout';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import type { Challenge, QuizQuestion } from '@em/types/index';
import { buildGaussData } from './chartData';

const EPSILON_0 = 8.854e-12;

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_FLUX_RADIUS: QuizQuestion = {
  question:
    'A spherical Gaussian surface encloses a net charge of +Q. If the radius of the surface is doubled, what happens to the total electric flux through it?',
  options: ['It quadruples', 'It doubles', 'It stays the same', 'It is halved'],
  correctIndex: 2,
  explanation:
    "Gauss's law states Φ_E = Q_enc/ε₀. The total flux depends only on the enclosed charge, not the size or shape of the Gaussian surface. Doubling the radius does not change Q_enc.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: "What does Gauss's law say the total flux depends on? Does it mention the surface radius?" },
    { tier: 2, label: 'Procedural hint', content: "Gauss's law: Φ_E = Q_enc/ε₀. The enclosed charge Q_enc hasn't changed — only the surface got bigger. What does that tell you about Φ_E?" },
    { tier: 3, label: 'Show worked step', content: 'Φ_E = Q_enc/ε₀ = Q/ε₀. Since Q_enc = Q regardless of the surface radius, Φ_E is unchanged. The flux stays the same — option C.' },
  ],
};

const Q_LINE_CHARGE: QuizQuestion = {
  question: 'Which Gaussian surface is most useful for finding the electric field of an infinite line charge?',
  options: [
    'A sphere centred on the line',
    'A cube with one face on the line',
    'A coaxial cylinder centred on the line',
    'A flat disk perpendicular to the line',
  ],
  correctIndex: 2,
  explanation:
    'The symmetry of an infinite line charge is cylindrical. A coaxial cylindrical Gaussian surface exploits this symmetry so that E is constant on the curved surface and the flux integral simplifies to E(2πrL) = λL/ε₀.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'The key to choosing a Gaussian surface is matching it to the symmetry of the charge distribution. What symmetry does an infinite line have?' },
    { tier: 2, label: 'Procedural hint', content: 'An infinite line charge has cylindrical symmetry — the field points radially outward and has the same magnitude at equal distances from the line. Which surface shape lets you factor E out of the flux integral?' },
    { tier: 3, label: 'Show worked step', content: 'Cylindrical symmetry → use a coaxial cylinder. On the curved surface, E is constant and parallel to dA, so ∮E·dA = E(2πrL). The end caps contribute zero (E ⊥ dA). This gives E = λ/(2πε₀r) — option C.' },
  ],
};

const Q_MONOPOLE: QuizQuestion = {
  question: "What does Gauss's law for magnetism (∮B·dA = 0) imply?",
  options: [
    'Magnetic field lines are always straight',
    'There are no magnetic monopoles; magnetic field lines form closed loops',
    'The magnetic field inside any closed surface is zero',
    'Magnetic flux can be created from nothing',
  ],
  correctIndex: 1,
  explanation:
    'A zero net magnetic flux through every closed surface means magnetic field lines have no beginning or end — they form closed loops. This is equivalent to saying isolated magnetic monopoles do not exist.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'If the total magnetic flux through any closed surface is always zero, what does that say about where field lines start and end?' },
    { tier: 2, label: 'Procedural hint', content: "Zero net flux means every field line entering a closed surface must also exit it. This means field lines can't originate from or terminate at a point source — what does that rule out?" },
    { tier: 3, label: 'Show worked step', content: '∮B·dA = 0 for all closed surfaces → no net magnetic "charge" can be enclosed → no magnetic monopoles exist. Field lines must form closed loops (no start/end points) — option B.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Flux Through Any Surface`,
  description: `Use the Gaussian surface tool to verify that the total electric flux through a closed surface depends only on the enclosed charge, not on the surface's size — then switch to the magnetic mode to see why a dipole encloses zero net flux.`,
  instructions: [
    `Make sure the Electric (E) button is selected, then drag the Enclosed Charge Q slider to a positive value (for example Q = +5 μC). Watch the field lines stream radially outward from the central charge.`,
    `Read the 'Gauss's Law for Electric Fields' equation box below the simulation: it shows Φ_E = Q/ε₀ with the note '(indep. of r)'. Note this flux value as your baseline.`,
    `Drag the Surface Radius r slider (or drag the dashed purple circle's edge) from a small radius out to its maximum, and confirm the number of field lines crossing the dashed surface stays constant while the equation-box flux value does NOT change.`,
    `Move your mouse around inside the canvas and watch the hover tooltip's |E| readout: confirm that the field strength falls off as you go farther from the charge, even though the total flux stayed fixed — flux and local field strength are different quantities.`,
    `Drag the Enclosed Charge Q slider to a negative value and watch the arrowheads on the surface flip to point inward; check that the equation-box flux changes sign but still ignores the radius.`,
    `Click the Magnetic (B) button and resize the Surface Radius again: observe that the equation box now reads Φ_B = 0 (Flux In = Flux Out) for the dipole at every radius, and write a short conclusion about why total flux depends only on enclosed 'charge' — which is zero for a magnet.`,
  ],
  hint: `Gauss's law guarantees Φ_E = Q_enc/ε₀ — only the enclosed charge matters, never the surface radius. Field strength |E| changes with distance, but the total flux through the closed surface does not.`,
};

export function GaussSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const col = isDarkMode ? COLORS_DARK : COLORS;

  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);

  const [mode, setMode] = useState<'ELECTRIC' | 'MAGNETIC'>('ELECTRIC');
  const [charge, setCharge] = useState(5);
  const [radius, setRadius] = useState(100);
  const [dragging, setDragging] = useState(false);
  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
  const canvasTouchRef = useCanvasTouch(canvasRef);
  const animationRef = useRef(0);
  const hoverPos = useRef<{ x: number; y: number } | null>(null);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, [canvasRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    const canvas = canvasRef.current;
    if (!pt || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const dist = Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2);
    // Click near the dashed circle edge (within 12px)
    if (Math.abs(dist - radius) < 12) {
      setDragging(true);
    }
  }, [canvasRef, getCanvasPoint, radius]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    hoverPos.current = pt;
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!pt || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const dist = Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2);
    setRadius(Math.round(Math.max(50, Math.min(200, dist))));
  }, [canvasRef, dragging, getCanvasPoint]);

  const handleMouseUp = useCallback(() => setDragging(false), []);
  const handleMouseLeaveGauss = useCallback(() => {
    setDragging(false);
    hoverPos.current = null;
  }, []);


  useEffect(() => {
    const render = () => {
      const frame = prepareFrame();
      if (!frame) {
        // Canvas not mounted yet (it appears only once the PredictionGate is
        // passed): keep the loop alive so drawing starts the moment it mounts.
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const { ctx, width, height } = frame;
      const cx = width / 2,
        cy = height / 2;
      ctx.clearRect(0, 0, width, height);

      if (isDarkMode) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      // Gaussian surface
      ctx.beginPath();
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col.TEXT_MAIN;
      ctx.font = '12px sans-serif';
      ctx.fillText(`Gaussian Surface (r = ${(radius * 0.01).toFixed(2)} m)`, cx + radius + 5, cy);
      // Drag hint
      ctx.fillStyle = col.TEXT_MUTED;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↔ Drag edge to resize', cx, cy - radius - 8);
      ctx.textAlign = 'start';

      if (mode === 'ELECTRIC') {
        ctx.fillStyle = charge > 0 ? col.E_FIELD : col.B_FIELD;
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(charge > 0 ? `+${charge}μC` : `${charge}μC`, cx, cy);

        const lines = Math.abs(charge) * 4;
        ctx.strokeStyle = charge > 0 ? `${col.E_FIELD}60` : `${col.B_FIELD}60`;
        ctx.lineWidth = 2;
        for (let i = 0; i < lines; i++) {
          const angle = (i / lines) * Math.PI * 2;
          ctx.beginPath();
          const rStart = 20,
            rEnd = 300;
          const sx = cx + Math.cos(angle) * rStart,
            sy = cy + Math.sin(angle) * rStart;
          const ex = cx + Math.cos(angle) * rEnd,
            ey = cy + Math.sin(angle) * rEnd;
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          const ix = cx + Math.cos(angle) * radius;
          const iy = cy + Math.sin(angle) * radius;
          const arrowAngle = charge > 0 ? angle : angle + Math.PI;
          const headLen = 8;
          ctx.beginPath();
          ctx.fillStyle = charge > 0 ? col.E_FIELD : col.B_FIELD;
          ctx.moveTo(ix, iy);
          ctx.lineTo(ix - headLen * Math.cos(arrowAngle - Math.PI / 6), iy - headLen * Math.sin(arrowAngle - Math.PI / 6));
          ctx.lineTo(ix - headLen * Math.cos(arrowAngle + Math.PI / 6), iy - headLen * Math.sin(arrowAngle + Math.PI / 6));
          ctx.fill();
        }
      } else {
        const mw = 60,
          mh = 24;
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(cx - mw / 2, cy - mh / 2, mw / 2, mh);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(cx, cy - mh / 2, mw / 2, mh);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('S', cx - mw / 4, cy + 4);
        ctx.fillText('N', cx + mw / 4, cy + 4);
        ctx.strokeStyle = `${col.B_FIELD}60`;
        ctx.lineWidth = 2;
        const loops = 8;
        for (let i = 1; i <= loops; i++) {
          const scale = i * 25;
          ctx.beginPath();
          ctx.moveTo(cx + mw / 2, cy);
          ctx.bezierCurveTo(cx + mw / 2 + scale, cy - scale, cx - mw / 2 - scale, cy - scale, cx - mw / 2, cy);
          ctx.moveTo(cx + mw / 2, cy);
          ctx.bezierCurveTo(cx + mw / 2 + scale, cy + scale, cx - mw / 2 - scale, cy + scale, cx - mw / 2, cy);
          ctx.stroke();
        }
        ctx.fillStyle = col.B_FIELD;
        const dots = 12;
        for (let i = 0; i < dots; i++) {
          const angle = (i / dots) * Math.PI * 2;
          const ix = cx + Math.cos(angle) * radius,
            iy = cy + Math.sin(angle) * radius;
          if (radius > 40) {
            ctx.beginPath();
            ctx.arc(ix, iy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      // Hover tooltip: E-field at mouse position
      if (hoverPos.current && mode === 'ELECTRIC' && charge !== 0 && !dragging) {
        const hx = hoverPos.current.x, hy = hoverPos.current.y;
        const distPx = Math.hypot(hx - cx, hy - cy);
        if (distPx > 20) {
          const rM = distPx * 0.01; // 1px = 0.01m
          const Q = Math.abs(charge * 1e-6);
          const E = Q / (4 * Math.PI * EPSILON_0 * rM * rM);
          const eStr = E >= 1e6
            ? `${(E / 1e6).toFixed(1)} MV/m`
            : E >= 1e3
              ? `${(E / 1e3).toFixed(1)} kV/m`
              : `${E.toFixed(1)} V/m`;

          // Crosshair
          ctx.strokeStyle = isDarkMode ? '#94a3b8' : '#475569';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(hx - 5, hy); ctx.lineTo(hx + 5, hy);
          ctx.moveTo(hx, hy - 5); ctx.lineTo(hx, hy + 5);
          ctx.stroke();

          // Tooltip
          const line1 = `|E| = ${eStr}`;
          const line2 = `r = ${rM.toFixed(2)} m`;
          ctx.font = '11px sans-serif';
          const tw = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 14;
          const th = 34;
          const tx = Math.min(hx + 12, width - tw - 4);
          const ty = Math.max(hy - 36, 4);
          ctx.fillStyle = isDarkMode ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)';
          ctx.beginPath();
          ctx.roundRect(tx, ty, tw, th, 4);
          ctx.fill();
          ctx.strokeStyle = isDarkMode ? '#475569' : '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(line1, tx + 7, ty + 4);
          ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
          ctx.fillText(line2, tx + 7, ty + 19);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [mode, charge, radius, isDarkMode, col, dragging, prepareFrame]);

  const equations =
    mode === 'ELECTRIC'
      ? [
          { label: 'Gauss Law (E)', math: '\\Phi_E = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{enc}}{\\epsilon_0}', color: 'text-red-600 dark:text-red-400' },
          { label: 'Result', math: `\\Phi_E = \\frac{${charge}\\,\\mu\\text{C}}{\\epsilon_0} = ${(charge * 1e-6 / 8.854e-12).toFixed(0)} \\text{ N}\\!\\cdot\\!\\text{m}^2\\text{/C (indep. of } r\\text{)}` },
        ]
      : [
          { label: 'Gauss Law (B)', math: '\\Phi_B = \\oint \\vec{B} \\cdot d\\vec{A} = 0', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Result', math: '\\text{Flux In} = \\text{Flux Out}' },
        ];

  const onCheckComplete = () => incrementConceptChecks('gauss');
  const onCheckHint = () => incrementHints('gauss');

  const TOC = [
    { id: 'gauss-flux-sim', label: 'Flux Simulation' },
    { id: 'gauss-concept-checks', label: 'Concept Checks' },
    { id: 'gauss-theory', label: "Gauss's Law" },
    { id: 'gauss-challenge', label: 'Guided Challenge' },
  ];

  const bench = (
    <SectionAnchor id="gauss-flux-sim" label="Flux Simulation">
      <LabStation
        title="Flux Through a Gaussian Surface"
        objective="Predict what the total flux does first, then drag the Gaussian surface to test whether it really depends on the surface radius."
      >
      <PredictionGate
        question="You enclose a fixed charge +Q in a Gaussian sphere, then double the sphere's radius. What happens to the total electric flux through it?"
        options={[
          { id: 'quadruples', label: 'It quadruples' },
          { id: 'doubles', label: 'It doubles' },
          { id: 'same', label: 'It stays the same' },
          { id: 'quarter', label: 'It drops to one quarter' },
        ]}
        getCorrectAnswer={() => 'same'}
        explanation={<span>Gauss's law gives Φ_E = Q_enc/ε₀ — flux depends only on the enclosed charge, not on the surface radius, so it is unchanged.</span>}
        onPredict={(correct) => markPredictionGate('gauss', correct)}
      >
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden h-[400px]">
          <canvas
            ref={canvasTouchRef}
            className="w-full h-full block"
            style={{ cursor: dragging ? 'grabbing' : 'default' }}
            role="img"
            aria-label="Gauss's law simulation showing electric or magnetic flux through a surface"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeaveGauss}
          />
          <div className="absolute top-4 left-4 pointer-events-none bg-white/90 dark:bg-slate-800/90 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
            <h5 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Visualization</h5>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {mode === 'ELECTRIC' ? 'Electric Monopole' : 'Magnetic Dipole'}
            </div>
          </div>
        </div>
        <ControlPanel title="Gauss's Law Controls">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button
              onClick={() => setMode('ELECTRIC')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${mode === 'ELECTRIC' ? 'bg-white dark:bg-slate-600 shadow text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Electric (E)
            </button>
            <button
              onClick={() => setMode('MAGNETIC')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${mode === 'MAGNETIC' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Magnetic (B)
            </button>
          </div>
          <Slider label={`Surface Radius r = ${(radius * 0.01).toFixed(2)} m`} value={radius} min={50} max={200} onChange={setRadius} color="bg-purple-600" />
          {mode === 'ELECTRIC' && (
            <Slider label={`Enclosed Charge Q = ${charge} μC`} value={charge} min={-10} max={10} onChange={setCharge} color={charge > 0 ? 'bg-red-600' : 'bg-blue-600'} />
          )}
          <HintBox>
            {mode === 'ELECTRIC'
              ? 'Try changing the radius. Notice the number of field lines crossing the surface stays constant!'
              : 'No matter how big the surface, flux is zero because magnetic lines always loop back.'}
          </HintBox>
        </ControlPanel>
      </div>
      </PredictionGate>
      </LabStation>
    </SectionAnchor>
  );

  const theory = (
    <div className="space-y-6">
      {/* ── Inline concept checks (distributed by mode: 2 electric, 1 magnetic) ── */}
      <SectionAnchor id="gauss-concept-checks" label="Concept Checks">
      {mode === 'ELECTRIC' ? (
        <div className="space-y-4">
          <ConceptCheck data={toConceptCheck(Q_FLUX_RADIUS)} onComplete={onCheckComplete} onHint={onCheckHint} />
          <ConceptCheck data={toConceptCheck(Q_LINE_CHARGE)} onComplete={onCheckComplete} onHint={onCheckHint} />
        </div>
      ) : (
        <ConceptCheck data={toConceptCheck(Q_MONOPOLE)} onComplete={onCheckComplete} onHint={onCheckHint} />
      )}
      </SectionAnchor>

      {/* ── Theory ── */}
      <SectionAnchor id="gauss-theory" label="Gauss's Law">
      <div className="space-y-6">
        <FigureImage
          className="mb-6"
          src={`${import.meta.env.BASE_URL}figures/faraday-cage.jpg`}
          alt="Faraday cage demonstration showing electric field shielding"
          caption="A Faraday cage: Gauss's law explains why the electric field inside a closed conductor is zero."
          attribution="Amanjosan2008, CC BY-SA 4.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Faraday_Cage.JPG"
        />
        <EquationBox title={`Gauss's Law for ${mode === 'ELECTRIC' ? 'Electric Fields' : 'Magnetism'}`} equations={equations} />

        {/* ── Plausibility callout (unit 2G): the three-pass audit on the Result line ── */}
        <PlausibilityCallout>
          The Result line reports ≈ <strong>5.6×10⁵ N·m²/C</strong> of flux from just 5 μC.
          Three quick passes: <strong>units</strong> — N·m²/C = V·m, so flux is
          “volts times metres”, not a field strength; <strong>magnitude</strong> — at
          r = 1 m this charge&apos;s own field is{' '}
          <MathWrapper formula="E = kQ/r^2 \approx 45\ \text{kV/m}" />, just 1.5 % of
          air&apos;s 3 MV/m breakdown, so the setup is buildable;{' '}
          <strong>limiting case</strong> — double r and E falls 4× exactly as the area
          grows 4×. That last one is the gate question you already answered:
          r-independence is the sanity test <em>built into</em> Gauss&apos;s law.
        </PlausibilityCallout>

        {(() => {
          const Q = charge * 1e-6;
          const flux = mode === 'ELECTRIC' ? Q / EPSILON_0 : 0;
          const data = buildGaussData(mode, charge, flux, EPSILON_0);
          const isElectric = mode === 'ELECTRIC';
          const eLog = isElectric && charge !== 0;
          return (
            <PhysicsChart
              title={isElectric ? 'Flux & Field vs Radius' : 'Magnetic Flux (always zero)'}
              data={data}
              xKey="r"
              xType="number"
              xLabel="Radius (m)"
              yLabel={isElectric ? 'E-field (N/C, log)' : 'Flux (Wb)'}
              yScale={eLog ? 'log' : 'linear'}
              y2Label={isElectric ? 'Flux (N·m²/C)' : undefined}
              lines={
                isElectric
                  ? [
                      { dataKey: 'E', color: '#dc2626', name: 'E-field (N/C)', axis: 'left' },
                      { dataKey: 'Flux', color: '#9333ea', name: 'Flux (N·m²/C)', axis: 'right' },
                    ]
                  : [{ dataKey: 'Flux', color: '#2563eb', name: 'Magnetic Flux (Wb)' }]
              }
            />
          );
        })()}
        <TheoryGuide>
          {mode === 'ELECTRIC' ? (
            <p>
              <strong>Electric Flux:</strong> Proportional to enclosed charge (<MathWrapper formula="Q" />).
              Independent of surface size (<MathWrapper formula="r" />). <MathWrapper formula="\Phi_E \neq 0" />.
            </p>
          ) : (
            <p>
              <strong>Magnetic Flux:</strong> Always zero for closed surfaces (
              <MathWrapper formula="\oint B \cdot dA = 0" />
              ). Field lines form loops; what goes in must come out.
            </p>
          )}
        </TheoryGuide>
      </div>
      </SectionAnchor>
      <SectionAnchor id="gauss-challenge" label="Guided Challenge">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>
    </div>
  );

  return (
    <SectionLayout
      sectionId="gauss"
      hook="Electrostatic shielding in coaxial cables, Faraday cages in microwave ovens, and the uniform field inside a capacitor all follow directly from this single law applied to the right surface."
      toc={TOC}
    >
      <LabLayout leadWithBench theory={theory} bench={bench} />
    </SectionLayout>
  );
}
