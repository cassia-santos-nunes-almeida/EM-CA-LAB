import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { EquationBox } from '@em/components/common/EquationBox';
import { HintBox } from '@em/components/common/HintBox';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { FigureImage } from '@shared/components/common/FigureImage';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import type { Challenge, QuizQuestion } from '@em/types/index';

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_RHR: QuizQuestion = {
  question:
    'When using the right-hand grip rule for a straight current-carrying wire, the thumb points in the direction of:',
  options: ['The magnetic field', 'The electric field', 'The conventional current', 'The force on the wire'],
  correctIndex: 2,
  explanation:
    'In the right-hand grip rule, the thumb is aligned with the direction of conventional current flow, and the curled fingers indicate the direction of the circular magnetic field lines around the wire.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'The right-hand grip rule has two parts: one for the straight quantity (thumb) and one for the circular quantity (fingers). Which physical quantity goes in circles around the wire?' },
    { tier: 2, label: 'Procedural hint', content: 'The magnetic field forms circles around the wire (curled fingers), while the current flows straight through the wire (thumb). So the thumb represents…' },
    { tier: 3, label: 'Show worked step', content: 'Thumb = straight direction = conventional current. Curled fingers = circular direction = magnetic field lines. The thumb points in the direction of conventional current — option C.' },
  ],
};

const Q_FIELD: QuizQuestion = {
  question:
    'A long straight wire carries current I. At a perpendicular distance r from the wire, the magnitude of the magnetic field is:',
  options: ['B = μ₀I / (4πr²)', 'B = μ₀I / (2πr)', 'B = μ₀I / (2r²)', 'B = μ₀Ir / (2π)'],
  correctIndex: 1,
  explanation:
    "Applying Ampère's law with a circular Amperian loop of radius r around the wire gives ∮B·dl = B(2πr) = μ₀I, so B = μ₀I/(2πr).",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: "Use Ampère's law with a circular loop centred on the wire. The magnetic field is tangential and constant on this loop." },
    { tier: 2, label: 'Procedural hint', content: "Ampère's law: ∮B·dl = μ₀I_enc. For a circular loop of radius r, B is constant and parallel to dl, so the integral becomes B × (circumference). What is the circumference?" },
    { tier: 3, label: 'Show worked step', content: '∮B·dl = B(2πr) = μ₀I. Solving: B = μ₀I/(2πr) — option B.' },
  ],
};

const Q_SOLENOID: QuizQuestion = {
  question:
    'Inside an ideal solenoid of n turns per unit length carrying current I, the magnetic field magnitude is:',
  options: ['B = μ₀nI', 'B = μ₀I / (2πn)', 'B = μ₀n²I', 'B = μ₀I / n'],
  correctIndex: 0,
  explanation:
    "Applying Ampère's law to a rectangular loop partly inside the solenoid yields B·l = μ₀(nl)I, giving B = μ₀nI. The field is uniform inside and nearly zero outside an ideal solenoid.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: "Apply Ampère's law to a rectangular loop with one side inside and one side outside the solenoid. The outside field is approximately zero." },
    { tier: 2, label: 'Procedural hint', content: 'For a rectangular Amperian loop of length l inside the solenoid: ∮B·dl = B·l (only the inside segment contributes). The enclosed current is I times the number of turns in length l, which is n·l.' },
    { tier: 3, label: 'Show worked step', content: '∮B·dl = B·l = μ₀·(n·l)·I. Cancel l: B = μ₀nI — option A.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Map the Magnetic Field`,
  description: `Use the current-carrying wire simulation to explore how the magnetic field around a straight wire depends on distance and current, and verify the relationship B = μ₀I/(2πr) directly from the on-screen readouts.`,
  instructions: [
    `Set the Current I (Amperes) slider to a positive value (e.g. around +50). Note the wire symbol shows the current going In and the dashed field rings appear circling it.`,
    `Drag the amber radius marker (or use the arrow keys to move it) close to the wire and read the tooltip's B and r values; then drag it outward so r roughly doubles and read B again — confirm B drops to about half each time r doubles, showing the 1/r dependence.`,
    `Compare the marker tooltip against the per-ring labels printed on the dashed field rings (r = ..cm, B = ..mT/μT) to cross-check that the field weakens with distance the same way at every radius.`,
    `While the field-line arrows animate, check the 'Rule of Thumb' box: with current In the field circulates Clockwise. Confirm this matches the right-hand grip rule (thumb along current In, fingers curl CW).`,
    `Holding the marker at a fixed radius, roughly double the Current I slider value and watch the tooltip's B reading — confirm B doubles when the current doubles, showing B is proportional to I.`,
    `Drag the Current I slider to a negative value so the wire reads Out: observe the field arrows reverse to Counter-Clockwise (the slider also turns red), confirming the field direction follows the sign/direction of the current.`,
  ],
  hint: `Watch the marker tooltip's B value: halving when r doubles confirms the 1/r law, doubling when I doubles confirms B is proportional to I, and the In/Out current label paired with CW/CCW circulation is the right-hand grip rule in action.`,
};

export function AmpereSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const col = isDarkMode ? COLORS_DARK : COLORS;

  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('ampere');
  const onCheckHint = () => incrementHints('ampere');

  const [current, setCurrent] = useState(50); // Amperes
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationRef = useRef(0);

  useCanvasTouch(canvasRef);

  // Draggable radius marker state
  const [markerRadius, setMarkerRadius] = useState(100); // px from center
  const [markerAngle, setMarkerAngle] = useState(-Math.PI / 4); // angle from center
  const draggingMarker = useRef(false);
  const canvasCenterRef = useRef({ x: 0, y: 0 });

  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(5, 0);
    ctx.lineTo(-5, 3);
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
      const cx = canvas.width / 2,
        cy = canvas.height / 2;
      canvasCenterRef.current = { x: cx, y: cy };
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isDarkMode) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      timeRef.current += 0.5 * (current / 50);

      // Wire cross-section
      ctx.fillStyle = col.GRID;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col.CURRENT;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Current symbol
      ctx.fillStyle = col.CURRENT;
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = current > 0 ? 'In' : current < 0 ? 'Out' : '0';
      ctx.fillText(current > 0 ? '⊗' : current < 0 ? '⊙' : '○', cx, cy + 2);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = col.TEXT_MAIN;
      ctx.fillText(`I = ${current} A (${label})`, cx, cy - 35);

      // Scale: 1 cm per 40px
      const SCALE_M_PER_PX = 0.01 / 40;
      const MU_0 = 4 * Math.PI * 1e-7; // T·m/A

      // B-field circles with arrows — line width ∝ 1/r to show field decay
      if (Math.abs(current) > 2) {
        const maxR = Math.min(canvas.width, canvas.height) / 2 - 20;
        const radii = [40, 70, 110, 160, 220].filter(r => r < maxR);

        for (const r of radii) {
          // Line opacity and width proportional to 1/r (B ∝ 1/r)
          const relStrength = 40 / r; // relative to closest ring
          ctx.beginPath();
          ctx.strokeStyle = col.B_FIELD;
          ctx.globalAlpha = 0.15 + 0.45 * relStrength;
          ctx.lineWidth = 1 + 2 * relStrength;
          ctx.setLineDash([5, 5]);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;

          // Show B-field magnitude at this radius
          const rMetres = r * SCALE_M_PER_PX;
          const Btesla = (MU_0 * Math.abs(current)) / (2 * Math.PI * rMetres);
          ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'left';
          const BLabel = Btesla >= 1e-3 ? `${(Btesla * 1e3).toFixed(1)} mT` : `${(Btesla * 1e6).toFixed(0)} μT`;
          ctx.fillText(`r=${(rMetres * 100).toFixed(1)}cm  B=${BLabel}`, cx + r + 5, cy + 4);

          // More arrows on inner rings (stronger field)
          const arrowCount = Math.max(3, Math.round(8 * relStrength));
          for (let j = 0; j < arrowCount; j++) {
            const angle = ((j / arrowCount) * Math.PI * 2 + timeRef.current * (60 / r)) * 0.1;
            const ax = cx + r * Math.cos(angle),
              ay = cy + r * Math.sin(angle);
            const tan = angle + Math.PI / 2 + (current < 0 ? Math.PI : 0);
            drawArrow(ctx, ax, ay, tan, col.B_FIELD);
          }
        }
      }

      // Draggable radius marker
      const mR = Math.max(30, markerRadius);
      const mX = cx + mR * Math.cos(markerAngle);
      const mY = cy + mR * Math.sin(markerAngle);

      // Dashed line from center to marker
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(mX, mY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Marker dot
      ctx.beginPath();
      ctx.arc(mX, mY, draggingMarker.current ? 9 : 7, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.globalAlpha = draggingMarker.current ? 0.7 : 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(mX, mY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      // B-field value at marker
      if (Math.abs(current) > 0 && mR > 25) {
        const rMetres = mR * SCALE_M_PER_PX;
        const Bval = (MU_0 * Math.abs(current)) / (2 * Math.PI * rMetres);
        const BStr = Bval >= 1e-3
          ? `${(Bval * 1e3).toFixed(2)} mT`
          : Bval >= 1e-6
            ? `${(Bval * 1e6).toFixed(1)} μT`
            : `${(Bval * 1e9).toFixed(0)} nT`;
        const rStr = `r = ${(rMetres * 100).toFixed(2)} cm`;

        // Tooltip
        ctx.font = 'bold 12px sans-serif';
        const line1 = `B = ${BStr}`;
        const line2 = rStr;
        const tw = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 16;
        const th = 38;
        const tx = mX + 14;
        const ty = mY - th / 2;
        ctx.fillStyle = isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, 6);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(line1, tx + 8, ty + 5);
        ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(line2, tx + 8, ty + 22);
      }

      // Drag hint
      if (!draggingMarker.current) {
        ctx.fillStyle = isDarkMode ? '#64748b' : '#94a3b8';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Drag marker to measure B', cx, cy + Math.min(canvas.width, canvas.height) / 2 - 15);
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [current, isDarkMode, col, markerRadius, markerAngle]);

  // Marker drag handlers
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const handleMarkerMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    const { x: cx, y: cy } = canvasCenterRef.current;
    const mX = cx + markerRadius * Math.cos(markerAngle);
    const mY = cy + markerRadius * Math.sin(markerAngle);
    if (Math.hypot(x - mX, y - mY) < 20) {
      draggingMarker.current = true;
    }
  }, [markerRadius, markerAngle, getCanvasPos]);

  const handleMarkerMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingMarker.current) return;
    const { x, y } = getCanvasPos(e);
    const { x: cx, y: cy } = canvasCenterRef.current;
    const dx = x - cx, dy = y - cy;
    const newR = Math.hypot(dx, dy);
    const newAngle = Math.atan2(dy, dx);
    setMarkerRadius(Math.max(30, Math.min(250, newR)));
    setMarkerAngle(newAngle);
  }, [getCanvasPos]);

  const handleMarkerMouseUp = useCallback(() => {
    draggingMarker.current = false;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = 5;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setMarkerRadius(r => Math.min(250, r + step));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setMarkerRadius(r => Math.max(30, r - step));
    }
  }, []);

  return (
    <SectionLayout
      sectionId="ampere"
      hook="MRI machines generate fields of 1.5–3 T using superconducting coils carrying hundreds of amperes through hundreds of turns. Ampère's law relates the enclosed current to the magnetic field you will calculate here."
    >
      {/* ── Interactive simulation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex-grow min-h-[400px] outline-none"
            role="slider"
            aria-label="Amperian loop radius"
            aria-valuemin={30}
            aria-valuemax={250}
            aria-valuenow={markerRadius}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              role="img"
              aria-label="Ampere's law simulation showing magnetic field around current-carrying conductor"
              onMouseDown={handleMarkerMouseDown}
              onMouseMove={handleMarkerMouseMove}
              onMouseUp={handleMarkerMouseUp}
              onMouseLeave={handleMarkerMouseUp}
              style={{ cursor: 'crosshair' }}
            />
            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 p-3 rounded border border-slate-200 dark:border-slate-700 text-xs max-w-[250px] shadow-sm">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Rule of Thumb</h5>
              <p className="text-slate-600 dark:text-slate-400">
                {current >= 0 ? (
                  <span>
                    Current <strong className="text-amber-600">IN</strong> → Field{' '}
                    <strong className="text-blue-600">CW</strong>
                  </span>
                ) : (
                  <span>
                    Current <strong className="text-amber-600">OUT</strong> → Field{' '}
                    <strong className="text-blue-600">CCW</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <ControlPanel title="Ampère's Law">
          <Slider label="Current I (Amperes)" value={current} min={-100} max={100} onChange={setCurrent} color={current >= 0 ? 'bg-amber-600' : 'bg-red-600'} />
          <HintBox>
            Reverse the current direction to see the field lines switch between Clockwise and Counter-Clockwise
            (Right-Hand Grip Rule).
          </HintBox>
        </ControlPanel>
      </div>

      {/* Check: right-hand grip rule (after observing field circulation in the sim) */}
      <ConceptCheck data={toConceptCheck(Q_RHR)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── Theory ── */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/solenoid-field.png`}
            alt="Magnetic field lines around and through a solenoid"
            caption="Magnetic field of a solenoid: Ampere's law gives B = μ₀nI inside, nearly uniform and parallel to the axis."
            attribution="Geek3, CC BY-SA 3.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Solenoid-1.png"
          />
          <FigureImage
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Electromagnet.svg/500px-Electromagnet.svg.png"
            alt="Diagram of an electromagnet with iron core and coil"
            caption="An electromagnet: current through coils creates a strong magnetic field in the iron core, demonstrating Ampere's law."
            attribution="Wikimedia Commons, Public Domain"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Electromagnet.svg"
          />
        </div>
        <EquationBox
          title="Ampère's Law"
          equations={[
            { label: 'Integral Form', math: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{enc}', color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Field at r', math: 'B = \\frac{\\mu_0 I}{2\\pi r}' },
          ]}
        />

        {/* Check: field of a straight wire (enclosed current → B = μ₀I/2πr) */}
        <ConceptCheck data={toConceptCheck(Q_FIELD)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {/* Check: solenoid field */}
        <ConceptCheck data={toConceptCheck(Q_SOLENOID)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <TheoryGuide>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Right-Hand Grip Rule:</strong> Point thumb in I direction. Fingers curl in B direction.
            </li>
            <li>
              <strong>Field Strength:</strong> B is proportional to Current (<MathWrapper formula="I" />) and
              inversely proportional to radius (<MathWrapper formula="r" />). Field strength drops as{' '}
              <MathWrapper formula="1/r" />.
            </li>
          </ul>
        </TheoryGuide>
      </div>
      <GuidedChallenge challenge={CHALLENGE} />
    </SectionLayout>
  );
}
