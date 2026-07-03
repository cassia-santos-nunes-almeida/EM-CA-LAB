import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { EquationBox } from '@em/components/common/EquationBox';
import { PlayControls } from '@em/components/common/PlayControls';
import { HintBox } from '@em/components/common/HintBox';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { FigureImage } from '@shared/components/common/FigureImage';
import { Layers } from 'lucide-react';
import type { Challenge, Equation, QuizQuestion } from '@em/types/index';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { LabLayout } from '@shared/components/common/LabLayout';
import { LabStation } from '@shared/components/common/LabStation';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { PlausibilityCallout } from '@shared/components/common/PlausibilityCallout';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { orientationPsi, ellipticityChi, axialRatio, linearSlope } from './physics';

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_LINEAR: QuizQuestion = {
  question: 'Linearly polarized light can be described as a superposition of two circularly polarized waves of:',
  options: [
    'The same handedness and equal amplitude',
    'Opposite handedness and equal amplitude',
    'Opposite handedness and different amplitudes',
    'The same handedness and different amplitudes',
  ],
  correctIndex: 1,
  explanation:
    'A linearly polarized wave is the sum of a right-circularly polarized (RCP) and a left-circularly polarized (LCP) wave of equal amplitude. The two rotating components add constructively along one axis and cancel along the perpendicular axis.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Think of two vectors rotating in opposite directions. When they align they add; when they point in opposite directions they cancel. What shape does the resultant trace?' },
    { tier: 2, label: 'Procedural hint', content: 'RCP rotates clockwise, LCP rotates counter-clockwise. Equal amplitudes: at any time, the perpendicular components cancel while the parallel components add. The resultant oscillates along a fixed line.' },
    { tier: 3, label: 'Show worked step', content: 'RCP: E₀[cos(ωt), −sin(ωt)]. LCP: E₀[cos(ωt), sin(ωt)]. Sum: [2E₀cos(ωt), 0] — linearly polarized along x. Requires opposite handedness and equal amplitude — option B.' },
  ],
};

// Exported for the +δ-convention pin (circularHintConvention.test); not a component.
// eslint-disable-next-line react-refresh/only-export-components
export const Q_CIRCULAR: QuizQuestion = {
  question:
    'Circularly polarized light is produced when two orthogonal linearly polarized components have equal amplitudes and a phase difference of:',
  options: ['0°', '45°', '90°', '180°'],
  correctIndex: 2,
  explanation:
    'When two equal-amplitude orthogonal components are 90° (π/2) out of phase, the resultant electric field vector traces a circle. A 0° phase difference gives linear polarization, and 180° gives linear polarization in a rotated direction.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'For the tip of the E-field vector to trace a circle, the x and y components must reach their peaks at different times. What phase shift makes sin and cos?' },
    { tier: 2, label: 'Procedural hint', content: 'Ex = E₀cos(ωt), Ey = E₀cos(ωt + δ). For circular polarization: Ex² + Ey² = constant. This requires δ = 90°, making Ey = E₀cos(ωt + 90°) = −E₀sin(ωt).' },
    { tier: 3, label: 'Show worked step', content: 'With δ = 90°: Ex = E₀cos(ωt), Ey = E₀cos(ωt + 90°) = −E₀sin(ωt). Then Ex² + Ey² = E₀² = constant → circle. With δ = 0° or 180°, you get a line. The answer is 90° — option C.' },
  ],
};

// Exported for the directional distractor-independence net (concept-check-directions.test).
// eslint-disable-next-line react-refresh/only-export-components
export const Q_JONES: QuizQuestion = {
  question: 'In the Jones vector formalism, which vector represents right-circularly polarized light?',
  options: ['(1/√2) [1, i]ᵀ', '(1/√2) [1, −i]ᵀ', '[1, 0]ᵀ', '[0, 1]ᵀ'],
  correctIndex: 1,
  explanation:
    'Right-circular polarization is represented by the Jones vector (1/√2)[1, −i]ᵀ, where the −i indicates the y-component lags the x-component by 90°. Left-circular polarization uses +i instead. The convention follows the optics standard where the observer faces the incoming wave.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Options C and D represent linear polarization (horizontal and vertical). The circular states must involve complex components (i or −i). Which sign corresponds to right-circular?' },
    { tier: 2, label: 'Procedural hint', content: 'In the optics convention, −i means the y-component lags the x-component by 90° (e^{−iπ/2} = −i). For right-circular polarization (clockwise when viewed facing the beam), y lags x.' },
    { tier: 3, label: 'Show worked step', content: 'RCP (optics convention): E_y lags E_x by 90°. Jones vector: (1/√2)[1, e^{−iπ/2}]ᵀ = (1/√2)[1, −i]ᵀ. LCP uses +i. The answer is (1/√2)[1, −i]ᵀ — option B.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Build Every Polarization State`,
  description: `Use the polarization simulator to construct linear, circular, and elliptical states by adjusting the two amplitude sliders and the phase-difference slider, then read the live State label and Stokes/ellipticity panel to confirm each state and its handedness.`,
  instructions: [
    `Set both 'Horizontal Amp (Ex)' and 'Vertical Amp (Ey)' to the same value (e.g. drag each to 50) and click the 'Linear (0°)' quick-set label beneath the 'Phase Difference (δ)' slider. Confirm the Head-On View label reads 'Linear Polarization' and the net E-field traces a straight diagonal line; check the equation panel shows Orientation ψ ≈ 45°.`,
    `Keep Ex = Ey and click the 'Circular (90°)' quick-set label (or drag the 'Phase Difference (δ)' slider to +90°). Watch the head-on trace become a circle, confirm the State label reads 'Right-Circular', and note the displayed handedness follows the optics convention stated in the theory.`,
    `Now drag the 'Phase Difference (δ)' slider to −90° (still with Ex = Ey). Observe that the trace stays circular but the State label flips to 'Left-Circular' — the sign of δ reverses the rotation sense, not the shape.`,
    `Leave δ at +90° and make the amplitudes unequal by lowering 'Vertical Amp (Ey)' (e.g. Ex = 80, Ey = 30). Confirm the State label changes to 'Elliptical' and the Ellipticity readout shows an axial ratio AR that is no longer 1 (and χ ≠ ±45°).`,
    `For any elliptical case, slowly sweep 'Phase Difference (δ)' from 0° up toward 180° and watch how the Stokes parameters [S0, S1, S2, S3] respond — note that S0 (total power) stays fixed while S2 and S3 trade off, and S3 (the circular part) peaks near ±90° and vanishes at 0° and 180°.`,
    `Pause the animation with the play/pause control, then drag the net E-field vector tip in the Head-On View to push Ex and Ey directly; confirm the State label and Stokes readout update consistently with the slider values, and conclude how amplitude ratio and δ together determine the polarization state.`,
  ],
  hint: `Equal amplitudes plus δ = ±90° gives a circle (AR = 1); the sign of δ only flips the handedness. Any other phase or unequal amplitudes gives an ellipse, and δ = 0° or 180° collapses it to a line. Let the live State label and the Stokes parameters confirm what you build.`,
};

export function PolarizationSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const c = isDarkMode ? COLORS_DARK : COLORS;

  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('polarization');
  const onCheckHint = () => incrementHints('polarization');

  const [ex, setEx] = useState(50);
  const [ey, setEy] = useState(50);
  const [phaseDelta, setPhaseDelta] = useState(90);
  const [isPlaying, setIsPlaying] = useState(true);

  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas({ scaled: false });
  const canvasTouchRef = useCanvasTouch(canvasRef);
  const timeRef = useRef(0);
  const animationRef = useRef(0);
  const traceRef = useRef<Array<{ x: number; y: number }>>([]);

  // Drag state for E-field vector tip
  const draggingVector = useRef(false);
  const lissajousCenter = useRef({ x: 0, y: 0, scale: 1 });

  // Clear trace on parameter change
  useEffect(() => {
    traceRef.current = [];
  }, [ex, ey, phaseDelta]);

  // Main render effect
  useEffect(() => {
    const render = () => {
      const frame = prepareFrame();
      if (!frame) {
        // Canvas not mounted yet (it appears only once the PredictionGate is
        // passed): keep the loop alive so drawing starts the moment it mounts.
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const canvas = canvasRef.current!;
      const ctx = frame.ctx;
      // scaled:false — backing store is rect*dpr, no ctx.scale; geometry stays in
      // backing-store pixels (canvas.width / canvas.height), consistent with
      // getCanvasPos (which also divides by rect to convert to backing-store px).
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (isPlaying) timeRef.current += 0.04;
      const t = timeRef.current;
      const rad = (phaseDelta * Math.PI) / 180;
      const midX = w * 0.35;

      // Divider line
      ctx.beginPath();
      ctx.strokeStyle = c.GRID;
      ctx.moveTo(midX, 20);
      ctx.lineTo(midX, h - 20);
      ctx.stroke();

      // Head-on view (Lissajous) - left half
      const cx = midX / 2, cy = h / 2;
      const maxR = Math.min(midX, h) * 0.35;
      const scale = maxR / 100;
      lissajousCenter.current = { x: cx, y: cy, scale };

      // Axes
      ctx.strokeStyle = c.AXIS;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxR - 20);
      ctx.lineTo(cx, cy + maxR + 20);
      ctx.moveTo(cx - maxR - 20, cy);
      ctx.lineTo(cx + maxR + 20, cy);
      ctx.stroke();

      ctx.fillStyle = c.TEXT_MUTED;
      ctx.font = '12px sans-serif';
      ctx.fillText('Ex', cx + maxR + 25, cy);
      ctx.fillText('Ey', cx, cy - maxR - 25);

      // Compute current values and add to trace
      const valX = ex * Math.cos(t);
      const valY = ey * Math.cos(t + rad);
      traceRef.current.push({ x: valX, y: valY });
      if (traceRef.current.length > 200) traceRef.current.shift();

      // Draw trace (Lissajous pattern)
      ctx.beginPath();
      ctx.strokeStyle = `${c.POWER}60`;
      ctx.lineWidth = 2;
      traceRef.current.forEach((pt, i) => {
        const px = cx + pt.x * scale;
        const py = cy - pt.y * scale;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Component dashed lines
      const tipX = cx + valX * scale;
      const tipY = cy - valY * scale;
      ctx.strokeStyle = c.E_FIELD;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tipX, cy);
      ctx.stroke();
      ctx.strokeStyle = c.B_FIELD;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, tipY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Net E-field vector
      ctx.strokeStyle = c.POWER;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      // Draggable handle at vector tip
      ctx.beginPath();
      ctx.arc(tipX, tipY, draggingVector.current ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = c.POWER;
      ctx.globalAlpha = draggingVector.current ? 0.6 : 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      // Solid dot
      ctx.beginPath();
      ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
      ctx.fillStyle = c.POWER;
      ctx.fill();

      // Drag hint
      if (!draggingVector.current) {
        ctx.fillStyle = c.TEXT_MUTED;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Drag vector tip to set Ex/Ey', cx, cy + maxR + 35);
      }

      // 3D propagation view - right half
      const start3D = midX + 50;
      const end3D = w - 50;
      const len3D = end3D - start3D;
      const cy3D = h / 2;
      ctx.strokeStyle = c.AXIS;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start3D, cy3D);
      ctx.lineTo(end3D, cy3D);
      ctx.stroke();
      ctx.fillText('Propagation (z)', end3D + 10, cy3D);

      const points = 150;
      const k = 0.1;
      const depthScale = 0.5;

      // Combined 3D wave (purple)
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.strokeStyle = c.POWER;
      for (let i = 0; i < points; i++) {
        const z = (i / points) * len3D;
        const ph = t - z * k;
        const wX = ex * Math.cos(ph);
        const wY = ey * Math.cos(ph + rad);
        const px = start3D + z - wX * depthScale * 0.5;
        const py = cy3D - wY * scale - wX * depthScale * 0.5;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Ey component projection (blue)
      ctx.beginPath();
      ctx.strokeStyle = `${c.B_FIELD}50`;
      for (let i = 0; i < points; i++) {
        const z = (i / points) * len3D;
        const ph = t - z * k;
        const wY = ey * Math.cos(ph + rad);
        const px = start3D + z;
        const py = cy3D - wY * scale;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Ex component projection (red)
      ctx.beginPath();
      ctx.strokeStyle = `${c.E_FIELD}50`;
      for (let i = 0; i < points; i++) {
        const z = (i / points) * len3D;
        const ph = t - z * k;
        const wX = ex * Math.cos(ph);
        const px = start3D + z - wX * depthScale * 0.5;
        const py = cy3D - wX * depthScale * 0.5;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [ex, ey, phaseDelta, isPlaying, c, isDarkMode, prepareFrame, canvasRef]);

  // Vector drag handlers
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [canvasRef]);

  const handleVectorMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    const { x: cx, y: cy, scale } = lissajousCenter.current;
    const t = timeRef.current;
    const rad = (phaseDelta * Math.PI) / 180;
    const tipX = cx + ex * Math.cos(t) * scale;
    const tipY = cy - ey * Math.cos(t + rad) * scale;
    if (Math.hypot(x - tipX, y - tipY) < 20) {
      draggingVector.current = true;
    }
  }, [ex, ey, phaseDelta, getCanvasPos]);

  const handleVectorMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingVector.current) return;
    const { x, y } = getCanvasPos(e);
    const { x: cx, y: cy, scale } = lissajousCenter.current;
    const t = timeRef.current;
    const rad = (phaseDelta * Math.PI) / 180;

    // Mouse position in field units
    const mouseFieldX = (x - cx) / scale;
    const mouseFieldY = -(y - cy) / scale;

    // Solve for amplitudes: valX = ex*cos(t), valY = ey*cos(t+rad)
    const cosT = Math.cos(t);
    const cosTRad = Math.cos(t + rad);

    if (Math.abs(cosT) > 0.1) {
      const newEx = Math.round(Math.max(0, Math.min(100, Math.abs(mouseFieldX / cosT))));
      setEx(newEx);
    }
    if (Math.abs(cosTRad) > 0.1) {
      const newEy = Math.round(Math.max(0, Math.min(100, Math.abs(mouseFieldY / cosTRad))));
      setEy(newEy);
    }
  }, [phaseDelta, getCanvasPos]);

  const handleVectorMouseUp = useCallback(() => {
    draggingVector.current = false;
  }, []);

  // Polarization type detection
  let type = 'Elliptical';
  if (Math.abs(phaseDelta) % 180 === 0) type = 'Linear';
  else if (Math.abs(Math.abs(phaseDelta) - 90) < 5 && Math.abs(ex - ey) < 5) type = 'Circular';

  // Compute ellipticity parameters
  const deltaRad = phaseDelta * Math.PI / 180;
  // ψ (orientation), χ (ellipticity), AR (axial ratio) — pure, unit-tested helpers in ./physics
  const psi = orientationPsi(ex, ey, phaseDelta);
  const chi = ellipticityChi(ex, ey, phaseDelta);
  const ar = axialRatio(ex, ey, phaseDelta);
  // Stokes parameters (normalized)
  const S0 = ex * ex + ey * ey;
  const S1 = ex * ex - ey * ey;
  const S2 = 2 * ex * ey * Math.cos(deltaRad);
  const S3 = 2 * ex * ey * Math.sin(deltaRad);
  // Handedness
  const handedness = Math.abs(phaseDelta) < 1 || Math.abs(Math.abs(phaseDelta) - 180) < 1
    ? '' : (phaseDelta > 0 ? 'Right' : 'Left');

  // Equations
  const equations: Equation[] = [
    { label: 'Net Vector', math: '\\vec{E}(z,t) = E_x \\hat{x} + E_y \\hat{y}', color: 'text-purple-600' },
    { label: 'x-Comp', math: `E_x = ${ex} \\cos(\\omega t - kz)` },
    { label: 'y-Comp', math: `E_y = ${ey} \\cos(\\omega t - kz + ${phaseDelta}^\\circ)` },
    { label: 'State', math: `\\text{${handedness ? handedness + '-' : ''}${type}}`, color: 'font-bold' },
  ];
  if (type === 'Circular') {
    equations.push({ label: 'Condition', math: '|E_x| = |E_y|, \\delta = \\pm 90^\\circ', color: 'text-emerald-600' });
  } else if (type === 'Linear') {
    equations.push({ label: 'Condition', math: `\\delta = n\\pi, \\text{Slope} = ${linearSlope(ex, ey, phaseDelta).toFixed(2)}` });
  }
  // Always show ellipticity parameters
  equations.push(
    { label: 'Orientation', math: `\\psi = ${psi.toFixed(1)}^\\circ` },
    { label: 'Ellipticity', math: `\\chi = ${chi.toFixed(1)}^\\circ,\\quad \\text{AR} = ${ar === Infinity ? '\\infty' : ar.toFixed(2)}` },
    { label: 'Stokes', math: `[S_0,S_1,S_2,S_3] = [${S0},\\,${S1},\\,${S2.toFixed(0)},\\,${S3.toFixed(0)}]` },
  );

  const TOC = [
    { id: 'polarization-state-sim', label: 'Polarization Simulation' },
    { id: 'polarization-theory', label: 'Theory' },
    { id: 'polarization-challenge', label: 'Guided Challenge' },
  ];

  const bench = (
    <SectionAnchor id="polarization-state-sim" label="Polarization Simulation">
      <LabStation
        title="Polarization States"
        objective="Predict the polarization state first, then steer Ex, Ey, and their phase to trace linear, circular, and elliptical states."
      >
      <PredictionGate
        question="Two orthogonal E-field components of EQUAL amplitude are combined with a 90° phase difference. What polarization state results?"
        options={[
          { id: 'linear', label: 'Linear' },
          { id: 'circular', label: 'Circular' },
          { id: 'elliptical', label: 'Elliptical (axial ratio ≠ 1)' },
          { id: 'unpolarized', label: 'Unpolarized' },
        ]}
        getCorrectAnswer={() => 'circular'}
        explanation={<span>Equal amplitudes with δ = ±90° make the E-vector tip trace a circle (Ex²+Ey² = const) — circular polarization. δ = 0°/180° gives linear; unequal amplitudes give elliptical.</span>}
        onPredict={(correct) => markPredictionGate('polarization', correct)}
      >
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden h-[400px]">
            <canvas
              ref={canvasTouchRef}
              className="w-full h-full block"
              role="img"
              aria-label="Polarization simulation showing Lissajous pattern and 3D wave propagation"
              onMouseDown={handleVectorMouseDown}
              onMouseMove={handleVectorMouseMove}
              onMouseUp={handleVectorMouseUp}
              onMouseLeave={handleVectorMouseUp}
              style={{ cursor: 'crosshair' }}
            />
            <div className="absolute top-4 left-4 flex gap-4 pointer-events-none">
              <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Head-On View</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{type} Polarization</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 p-3 rounded border border-slate-200 dark:border-slate-700 shadow-sm text-xs pointer-events-none">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Legend</h5>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0 border-b-2 border-red-600 border-dashed"></div>
                  <span className="text-slate-600 dark:text-slate-400">Ex</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0 border-b-2 border-blue-600 border-dashed"></div>
                  <span className="text-slate-600 dark:text-slate-400">Ey</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-purple-600 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">Net E-Field</span>
                </div>
              </div>
            </div>
          </div>
        <ControlPanel title="Polarization Controls">
          <div className="mb-6 border-b border-slate-100 dark:border-slate-700 pb-6">
            <Slider label="Horizontal Amp (Ex)" value={ex} min={0} max={100} step={1} unit=" (arb.)" onChange={setEx} color="bg-red-600" />
            <Slider label="Vertical Amp (Ey)" value={ey} min={0} max={100} step={1} unit=" (arb.)" onChange={setEy} color="bg-blue-600" />
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500">
              <Layers size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Phase Relationship</span>
            </div>
            <Slider
              label="Phase Difference (δ)"
              value={phaseDelta}
              min={-180}
              max={180}
              step={15}
              unit="°"
              onChange={setPhaseDelta}
              color="bg-purple-600"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 px-1 -mt-2">
              <button
                type="button"
                className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setPhaseDelta(0)}
              >
                Linear (0°)
              </button>
              <button
                type="button"
                className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => { setPhaseDelta(90); setEx(50); setEy(50); }}
              >
                Circular (90°)
              </button>
              <button
                type="button"
                className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setPhaseDelta(180)}
              >
                Linear (180°)
              </button>
            </div>
          </div>
          <PlayControls
            isPlaying={isPlaying}
            onToggle={() => setIsPlaying(!isPlaying)}
            onReset={() => {
              timeRef.current = 0;
              setPhaseDelta(90);
              setEx(50);
              setEy(50);
            }}
          />
          <HintBox>For Circular polarization, magnitudes must be equal (Ex = Ey) and phase difference must be ±90°.</HintBox>
        </ControlPanel>
        </div>
      </PredictionGate>
      </LabStation>
    </SectionAnchor>
  );

  const theory = (
    <div className="space-y-6">
      {/* Plausibility callout (ILO-8): sanity-check how special circular polarization is */}
      <PlausibilityCallout>
        Circular polarization is a knife-edge condition, not a default: it needs the two
        components equal (Ex = Ey) <em>and</em> their phase difference at exactly ±90°. A GPS
        L1 carrier (1575 MHz) is right-hand circular, its field vector completing one full turn
        every{' '}
        <MathWrapper formula="1/f = 1/(1575\times10^{6}\ \text{Hz}) \approx 0.64\ \text{ns}" />;
        {' '}real receivers tolerate only a few degrees of phase error and a small amplitude
        mismatch before the ellipse becomes obvious. So if you set Ex twice Ey and still expect
        a circle, expect a fat ellipse instead — the State readout should already say so.
      </PlausibilityCallout>

      {/* Check: linear as superposition of two circular waves */}
      <ConceptCheck data={toConceptCheck(Q_LINEAR)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* Check: circular polarization phase condition */}
      <ConceptCheck data={toConceptCheck(Q_CIRCULAR)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── Theory ── */}
      <SectionAnchor id="polarization-theory" label="Theory">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/polarizing-filter.jpg`}
            alt="Effect of a polarizing filter on reflected light from water"
            caption="Polarizing filter in action: reflected light from water is partially polarized, and a filter can block it to reduce glare."
            attribution="Angus MacRae, CC BY 2.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Polarizer_Comparison_(4489206505).jpg"
          />
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/circular-polarization-rh.gif`}
            alt="Animation of a right-hand circularly polarized electromagnetic wave"
            caption="Right-hand circular polarization: the electric-field vector rotates as the wave advances, tracing a helix in space."
            attribution="Dave3457, Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Circular.Polarization.Circularly.Polarized.Light_Right.Handed.Animation.305x190.255Colors.gif"
          />
        </div>
        <EquationBox title="Instantaneous Field Equations" equations={equations} />
        <TheoryGuide>
          <p>
            <strong>Linear Polarization:</strong> Fields oscillate in a single plane (
            <MathWrapper formula="\delta = 0^\circ" />).
          </p>
          <p>
            <strong>Circular Polarization:</strong> Field vector rotates. Occurs when{' '}
            <MathWrapper formula="E_x = E_y" /> and phase shift is{' '}
            <MathWrapper formula="90^\circ" />.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Handedness convention:</strong> this simulation uses the optics convention
            (observer faces the incoming wave), so <MathWrapper formula="\delta = +90^\circ" /> is
            labeled right-circular, with Jones vector{' '}
            <MathWrapper formula="\tfrac{1}{\sqrt{2}}\,[1,\,-i]^{T}" /> for RCP. The IEEE/antenna
            convention used by Ulaby (and in the Antennas section coming up next) labels the
            opposite sense as right-hand circular, so compare the stated convention, not just the
            rotation direction.
          </p>
        </TheoryGuide>

        {/* Check: Jones vector for RCP (after the handedness/Stokes discussion) */}
        <ConceptCheck data={toConceptCheck(Q_JONES)} onComplete={onCheckComplete} onHint={onCheckHint} />
      </div>
      </SectionAnchor>
      <SectionAnchor id="polarization-challenge" label="Guided Challenge">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>
    </div>
  );

  return (
    <SectionLayout
      sectionId="polarization"
      hook="LCD screens work by rotating the polarization of light between two crossed polarizers. Without the physics in this section, there are no flat screens, no sunglasses, and no glare-reducing camera filters."
      toc={TOC}
    >
      <LabLayout leadWithBench theory={theory} bench={bench} />
    </SectionLayout>
  );
}
