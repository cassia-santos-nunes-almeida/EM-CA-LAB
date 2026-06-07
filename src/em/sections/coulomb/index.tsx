import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { Plus, Trash2, MousePointer2 } from 'lucide-react';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { EquationBox } from '@em/components/common/EquationBox';
import { HintBox } from '@em/components/common/HintBox';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { PhysicsChart } from '@em/components/common/PhysicsChart';
import { FigureImage } from '@shared/components/common/FigureImage';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import type { Challenge, Charge, QuizQuestion } from '@em/types/index';

const K_COULOMB = 8.988e9;

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_INVERSE_SQUARE: QuizQuestion = {
  question:
    'Two point charges of +2 μC and −2 μC are separated by 0.1 m. If the separation is doubled to 0.2 m, how does the magnitude of the Coulomb force change?',
  options: ['It is halved', 'It is quartered', 'It remains the same', 'It is doubled'],
  correctIndex: 1,
  explanation:
    "Coulomb's law F = kq₁q₂/r² follows an inverse-square relationship. Doubling the distance means F_new = F/(2²) = F/4, so the force is reduced to one quarter.",
  hints: [
    { tier: 1, label: 'Conceptual hint', content: "Coulomb's law has an inverse-square dependence on distance. What does \"inverse-square\" mean when you double the distance?" },
    { tier: 2, label: 'Procedural hint', content: 'F = kq₁q₂/r². If r → 2r, then r² → 4r². How does this affect F?' },
    { tier: 3, label: 'Show worked step', content: 'F_new = kq₁q₂/(2r)² = kq₁q₂/(4r²) = F/4. The force is reduced to one quarter — option B.' },
  ],
};

const Q_SUPERPOSITION: QuizQuestion = {
  question:
    'Three identical positive charges are placed at the vertices of an equilateral triangle. What is the direction of the net force on each charge?',
  options: [
    'Toward the centre of the triangle',
    'Along one side of the triangle',
    'Directly away from the centre of the triangle',
    'Tangent to the circumscribed circle',
  ],
  correctIndex: 2,
  explanation:
    'By the superposition principle, each charge is repelled by the other two. The symmetry of the equilateral triangle ensures the two repulsive force vectors add to give a resultant pointing radially outward from the centre.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Like charges repel. Consider the symmetry — if two equal forces push a charge from two symmetric directions, where does the resultant point?' },
    { tier: 2, label: 'Procedural hint', content: "Each charge feels two equal repulsive forces from the other two charges. The two force vectors make equal angles with the line from the charge to the triangle's centre. Use vector addition." },
    { tier: 3, label: 'Show worked step', content: 'At vertex A, forces from B and C are equal in magnitude and symmetric about the line from A to the centre. Their vector sum points along that line, away from the centre (since both forces are repulsive) — option C.' },
  ],
};

const Q_FIELD_LINES: QuizQuestion = {
  question: 'Electric field lines from a positive point charge:',
  options: [
    'Form closed loops around the charge',
    'Point radially inward toward the charge',
    'Point radially outward from the charge',
    'Are parallel straight lines',
  ],
  correctIndex: 2,
  explanation:
    'By convention, electric field lines originate on positive charges and terminate on negative charges. For an isolated positive point charge the field is spherically symmetric and points radially outward.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Electric field lines show the direction a positive test charge would move. Would a positive test charge be attracted to or repelled from a positive source charge?' },
    { tier: 2, label: 'Procedural hint', content: 'By convention, field lines start on positive charges and end on negative charges. For an isolated positive charge, the lines must go outward since there\'s no negative charge to terminate on nearby.' },
    { tier: 3, label: 'Show worked step', content: 'E = kQ/r² r̂ for a positive charge Q. The unit vector r̂ points radially outward from Q, so E points radially outward everywhere. Field lines radiate outward — option C.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Superposition Explorer`,
  description: `Build a symmetric configuration of point charges by dragging and tuning them, then use the live |E| crosshair readout and the orange force vectors to see how individual fields add as vectors (superposition) and how the inverse-square law shapes the result.`,
  instructions: [
    `Set up two equal positive charges: drag the two existing charges so they sit level with each other (same height), one on the left and one on the right with a gap between them, then use each charge's q slider in the Charge Configuration panel to set both to the same positive value, e.g. q = +4 μC (turn on Show Grid to keep them symmetric).`,
    `Hover the mouse at the midpoint exactly between the two charges and read the |E| crosshair tooltip. Note that the horizontal contributions from the two equal charges cancel, so |E| at that symmetry point is small or zero — this is vector superposition in action.`,
    `Click Add Charge to drop a third charge (it appears at the centre as +2 μC); drag it directly above the midpoint and use its q slider to make it negative, e.g. q = -4 μC. Hover at the original midpoint again and watch how |E| now grows and points toward the negative charge.`,
    `Watch the orange force vector (F) drawn on each charge: confirm each charge's force is the vector sum of the pushes/pulls from the other two, and that like charges repel while opposite charges attract.`,
    `Drag the negative charge slowly closer to the midpoint and watch the |E| readout and the orange F arrows grow steeply — this rapid growth is the inverse-square (1/r²) dependence of Coulomb's law.`,
    `Vary the magnitude of one charge with its q slider (from a small value up toward +10 or -10 μC) and observe that the field and force scale linearly with that charge while still falling off as 1/r² with distance; conclude how superposition plus the inverse-square law together set the net field.`,
  ],
  hint: `Two equal charges placed symmetrically about a point create equal-and-opposite contributions along the line joining them, so those components cancel at the midpoint — only the un-cancelled (here, vertical) contribution survives.`,
};

export function CoulombSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const col = isDarkMode ? COLORS_DARK : COLORS;

  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('coulomb');
  const onCheckHint = () => incrementHints('coulomb');

  const [charges, setCharges] = useState<Charge[]>([
    { id: 1, x: 0.35, y: 0.5, q: 4 },
    { id: 2, x: 0.65, y: 0.5, q: -4 },
  ]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasTouch(canvasRef);
  const animationRef = useRef(0);
  const hoverPos = useRef<{ x: number; y: number } | null>(null);

  const getNetField = useCallback(
    (x: number, y: number, excludeId: number | null, width: number, height: number) => {
      let Ex = 0,
        Ey = 0;
      charges.forEach((charge) => {
        if (charge.id === excludeId) return;
        const cx = charge.x * width,
          cy = charge.y * height;
        const dx = x - cx,
          dy = y - cy;
        const rSq = dx * dx + dy * dy;
        if (rSq < 100) return;
        const r = Math.sqrt(rSq);
        const E_mag = charge.q / rSq;
        Ex += E_mag * (dx / r);
        Ey += E_mag * (dy / r);
      });
      return { Ex, Ey };
    },
    [charges]
  );

  const drawFieldLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      startQ: number,
      width: number,
      height: number
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = startQ > 0 ? `${col.E_FIELD}50` : `${col.B_FIELD}50`;
      ctx.lineWidth = 1.5;
      ctx.moveTo(startX, startY);
      let cx = startX,
        cy = startY,
        active = true,
        steps = 0;
      const direction = startQ > 0 ? 1 : -1;
      const arrowLocs: { x: number; y: number; angle: number }[] = [];

      while (active && steps < 600) {
        steps++;
        const { Ex, Ey } = getNetField(cx, cy, null, width, height);
        const mag = Math.hypot(Ex, Ey);
        if (mag === 0) break;
        const stepLen = 5;
        const dx = (Ex / mag) * stepLen * direction;
        const dy = (Ey / mag) * stepLen * direction;
        cx += dx;
        cy += dy;
        ctx.lineTo(cx, cy);

        if (steps % 20 === 0) {
          arrowLocs.push({ x: cx, y: cy, angle: Math.atan2(dy, dx) });
        }

        if (cx < 0 || cx > width || cy < 0 || cy > height) active = false;
        for (const c of charges) {
          const cPx = c.x * width,
            cPy = c.y * height;
          if (Math.hypot(cx - cPx, cy - cPy) < 15) {
            active = false;
            ctx.lineTo(cPx - (cPx - cx) * 0.5, cPy - (cPy - cy) * 0.5);
          }
        }
      }
      ctx.stroke();

      ctx.fillStyle = startQ > 0 ? `${col.E_FIELD}90` : `${col.B_FIELD}90`;
      for (const loc of arrowLocs) {
        ctx.save();
        ctx.translate(loc.x, loc.y);
        ctx.rotate(loc.angle);
        ctx.beginPath();
        ctx.moveTo(-4, -3);
        ctx.lineTo(4, 0);
        ctx.lineTo(-4, 3);
        ctx.fill();
        ctx.restore();
      }
    },
    [charges, getNetField, col]
  );

  const drawArrow = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      vx: number,
      vy: number,
      color: string,
      label: string
    ) => {
      const mag = Math.hypot(vx, vy);
      // Log-scale arrow length to faithfully show 1/r² without clipping at large forces
      const maxLen = 150;
      const logMag = mag > 1 ? Math.min(maxLen, 30 * Math.log10(mag) + 20) : mag;
      const scale = mag > 0 ? logMag / mag : 0;
      const dx = vx * scale,
        dy = vy * scale;
      ctx.beginPath();
      ctx.strokeStyle = color;
      // Thicker arrows for stronger forces
      ctx.lineWidth = Math.min(6, 2 + logMag / 50);
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
      const angle = Math.atan2(dy, dx),
        headLen = 10;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + dx - headLen * Math.cos(angle - Math.PI / 6), y + dy - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x + dx - headLen * Math.cos(angle + Math.PI / 6), y + dy - headLen * Math.sin(angle + Math.PI / 6));
      ctx.fill();
      if (mag > 20) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(label, x + dx + 15 * Math.cos(angle), y + dy + 15 * Math.sin(angle));
      }
    },
    []
  );

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (isDarkMode) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      if (showGrid) {
        ctx.strokeStyle = col.GRID;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 40) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }

      charges.forEach((charge) => {
        const cx = charge.x * width,
          cy = charge.y * height;
        if (Math.abs(charge.q) > 0) {
          const count = Math.abs(charge.q) * 3;
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            drawFieldLine(ctx, cx + Math.cos(angle) * 20, cy + Math.sin(angle) * 20, charge.q, width, height);
          }
        }
      });

      // Scale: 1 grid square (40px) = 0.1 m
      const SCALE_M_PER_PX = 0.1 / 40; // metres per pixel
      // K_COULOMB defined at module level

      // Scale reference label
      ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('1 square = 0.1 m  |  Charges in μC', 8, height - 8);

      charges.forEach((charge) => {
        const cx = charge.x * width,
          cy = charge.y * height;
        const { Ex, Ey } = getNetField(cx, cy, charge.id, width, height);
        const forceX = Ex * charge.q * 5000,
          forceY = Ey * charge.q * 5000;

        // Compute physical force magnitude for display
        let forceLabel = 'F';
        const otherCharges = charges.filter((c) => c.id !== charge.id);
        if (otherCharges.length === 1) {
          const other = otherCharges[0];
          const distPx = Math.hypot((charge.x - other.x) * width, (charge.y - other.y) * height);
          const distM = distPx * SCALE_M_PER_PX;
          const q1 = Math.abs(charge.q * 1e-6); // convert μC to C
          const q2 = Math.abs(other.q * 1e-6);
          if (distM > 0.001) {
            const Fphys = K_COULOMB * q1 * q2 / (distM * distM);
            forceLabel = Fphys >= 1 ? `F=${Fphys.toFixed(1)} N` : `F=${(Fphys * 1e3).toFixed(1)} mN`;
          }
        }
        if (Math.hypot(forceX, forceY) > 5) drawArrow(ctx, cx, cy, forceX, forceY, '#ea580c', forceLabel);

        ctx.beginPath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = charge.q > 0 ? col.E_FIELD : charge.q < 0 ? col.B_FIELD : '#94a3b8';
        ctx.fillStyle = charge.q > 0 ? col.E_FIELD : charge.q < 0 ? col.B_FIELD : '#94a3b8';
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${charge.q > 0 ? '+' : ''}${charge.q}μC`, cx, cy);

        if (draggingId === charge.id) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 2;
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Hover tooltip: show E-field magnitude at mouse position
      if (hoverPos.current && draggingId === null) {
        const hx = hoverPos.current.x;
        const hy = hoverPos.current.y;
        // Check if mouse is far enough from any charge
        const nearCharge = charges.some(ch => {
          const cpx = ch.x * width, cpy = ch.y * height;
          return Math.hypot(hx - cpx, hy - cpy) < 25;
        });
        if (!nearCharge) {
          const { Ex: hEx, Ey: hEy } = getNetField(hx, hy, null, width, height);
          const hMag = Math.hypot(hEx, hEy);
          if (hMag > 0.0001) {
            // Convert to physical units: field in canvas units → approximate real units
            // Scale: 1 px = SCALE_M_PER_PX metres, field ~ kq/r² in canvas px units
            // Physical E = K_COULOMB * q(C) / r(m)². Our getNetField returns q(μC-number)/px².
            // So physical E = K_COULOMB * hMag * 1e-6 / (SCALE_M_PER_PX)²
            const physE = K_COULOMB * hMag * 1e-6 / (SCALE_M_PER_PX * SCALE_M_PER_PX);
            const eStr = physE >= 1e6
              ? `${(physE / 1e6).toFixed(1)} MV/m`
              : physE >= 1e3
                ? `${(physE / 1e3).toFixed(1)} kV/m`
                : `${physE.toFixed(1)} V/m`;

            // Draw small crosshair
            ctx.strokeStyle = isDarkMode ? '#94a3b8' : '#475569';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hx - 6, hy);
            ctx.lineTo(hx + 6, hy);
            ctx.moveTo(hx, hy - 6);
            ctx.lineTo(hx, hy + 6);
            ctx.stroke();

            // Tooltip box
            const tooltipText = `|E| = ${eStr}`;
            ctx.font = '11px sans-serif';
            const tw = ctx.measureText(tooltipText).width + 12;
            const th = 22;
            const tx = Math.min(hx + 12, width - tw - 4);
            const ty = Math.max(hy - 28, 4);
            ctx.fillStyle = isDarkMode ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)';
            ctx.beginPath();
            ctx.roundRect(tx, ty, tw, th, 4);
            ctx.fill();
            ctx.strokeStyle = isDarkMode ? '#475569' : '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(tooltipText, tx + 6, ty + th / 2);
          }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [charges, draggingId, showGrid, isDarkMode, col, getNetField, drawFieldLine, drawArrow]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clicked = charges.find(
      (c) =>
        Math.hypot(e.clientX - rect.left - c.x * canvas.width, e.clientY - rect.top - c.y * canvas.height) < 30
    );
    if (clicked) setDraggingId(clicked.id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    hoverPos.current = { x: px, y: py };
    if (draggingId === null) return;
    const newX = (e.clientX - rect.left) / canvas.width;
    const newY = (e.clientY - rect.top) / canvas.height;
    setCharges((prev) =>
      prev.map((c) =>
        c.id === draggingId
          ? { ...c, x: Math.max(0.05, Math.min(0.95, newX)), y: Math.max(0.05, Math.min(0.95, newY)) }
          : c
      )
    );
  };

  const handleMouseLeaveCoulomb = () => {
    setDraggingId(null);
    hoverPos.current = null;
  };

  // Keyboard: arrow keys nudge the first charge (or last selected)
  const selectedChargeRef = useRef(charges[0]?.id ?? null);
  useEffect(() => {
    if (draggingId !== null) selectedChargeRef.current = draggingId;
  }, [draggingId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const id = selectedChargeRef.current;
    if (!id) return;
    const step = 0.015;
    const delta = { x: 0, y: 0 };
    if (e.key === 'ArrowLeft') delta.x = -step;
    else if (e.key === 'ArrowRight') delta.x = step;
    else if (e.key === 'ArrowUp') delta.y = -step;
    else if (e.key === 'ArrowDown') delta.y = step;
    else return;
    e.preventDefault();
    setCharges(prev => prev.map(c =>
      c.id === id
        ? { ...c, x: Math.max(0.05, Math.min(0.95, c.x + delta.x)), y: Math.max(0.05, Math.min(0.95, c.y + delta.y)) }
        : c
    ));
  }, []);

  return (
    <SectionLayout
      sectionId="coulomb"
      hook="The force between charges on a DNA strand is strong enough to hold the molecule together yet weak enough for enzymes to unzip it. The same inverse-square law governs both."
    >
      {/* ── Interactive simulation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div
            role="button"
            aria-label="Charge simulation area. Focus and use arrow keys to nudge the selected charge."
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex-grow min-h-[400px] cursor-crosshair outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              role="img"
              aria-label="Coulomb's law simulation with draggable charges showing electric field lines and force vectors"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setDraggingId(null)}
              onMouseLeave={handleMouseLeaveCoulomb}
            />
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-800/90 p-2 rounded backdrop-blur text-xs border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none flex items-center gap-2">
              <MousePointer2 size={14} className="text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Drag charges</span>
            </div>
          </div>
        </div>
        <ControlPanel title="Charge Configuration">
          {charges.map((charge, i) => (
            <div key={charge.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Charge {i + 1}
                </span>
                <button
                  onClick={() => setCharges((p) => p.filter((c) => c.id !== charge.id))}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  disabled={charges.length <= 1}
                  aria-label={`Remove charge ${i + 1}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                type="range"
                min={-10}
                max={10}
                value={charge.q}
                onChange={(e) =>
                  setCharges((p) =>
                    p.map((c) => (c.id === charge.id ? { ...c, q: parseFloat(e.target.value) } : c))
                  )
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-600"
                style={{
                  accentColor: charge.q > 0 ? col.E_FIELD : charge.q < 0 ? col.B_FIELD : '#94a3b8',
                }}
                aria-label={`Charge ${i + 1} value`}
              />
              <div className="text-center text-xs font-mono mt-1 text-slate-500 dark:text-slate-400">
                q = {charge.q > 0 ? '+' : ''}
                {charge.q} &mu;C
              </div>
            </div>
          ))}
          {charges.length < 4 && (
            <button
              onClick={() =>
                setCharges([
                  ...charges,
                  { id: Math.max(0, ...charges.map((c) => c.id)) + 1, x: 0.5, y: 0.5, q: 2 },
                ])
              }
              className="w-full py-2 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 text-engineering-blue-700 dark:text-engineering-blue-400 border border-engineering-blue-200 dark:border-engineering-blue-800 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mb-4"
            >
              <Plus size={16} /> Add Charge
            </button>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded text-engineering-blue-600"
            />{' '}
            Show Grid
          </label>
          <HintBox>
            Drag charges close to each other. Notice how the Force vector (F) grows rapidly (
            <MathWrapper formula="1/r^2" />
            )!
          </HintBox>
        </ControlPanel>
      </div>

      {/* Check: field-line direction (right after the field-line visualization) */}
      <ConceptCheck data={toConceptCheck(Q_FIELD_LINES)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── Theory ── */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/coulomb-torsion-balance.png`}
            alt="Coulomb's torsion balance used to measure electrostatic force"
            caption="Coulomb's torsion balance (1785): the instrument that first quantified the inverse-square law for electric charges."
            attribution="Charles-Augustin de Coulomb, Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Bcoulomb.png"
          />
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/van-de-graaff-generator.jpg`}
            alt="Van de Graaff generator producing visible electric sparks"
            caption="A Van de Graaff generator: accumulated charge creates electric fields strong enough to ionize air."
            attribution="Biswarup Ganguly, CC BY 3.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Van_de_Graaff_Generator_-_Science_City_-_Calcutta_1997_444.JPG"
          />
        </div>
        <FigureImage
          className="mb-6"
          src={`${import.meta.env.BASE_URL}figures/electric-field-lines-charge.gif`}
          alt="Animation of the electric field lines of a point charge"
          caption="The electric field lines of a point charge — radial, with line density indicating field strength and the inverse-square fall-off."
          attribution="Estebanillo, CC0 Public Domain — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Líneas_de_campo_eléctrico.gif"
        />
        <EquationBox
          title="Superposition Principle"
          equations={[
            {
              label: 'Net Field',
              math: '\\vec{E}_{net} = \\sum k \\frac{q_i}{r_i^2} \\hat{r}_i',
              color: 'text-indigo-600 dark:text-indigo-400',
            },
            { label: 'Force', math: '\\vec{F}_{net} \\text{ on } q = q \\vec{E}_{other}' },
          ]}
        />

        {/* Check: superposition (after the superposition principle) */}
        <ConceptCheck data={toConceptCheck(Q_SUPERPOSITION)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {charges.length >= 2 && (() => {
          const q1 = Math.abs(charges[0].q * 1e-6);
          const q2 = Math.abs(charges[1].q * 1e-6);
          const forceData = Array.from({ length: 40 }, (_, i) => {
            const r = 0.02 + i * 0.012;
            return { r: r.toFixed(2), F: +(K_COULOMB * q1 * q2 / (r * r)).toExponential(2) };
          });
          return (
            <PhysicsChart
              title="Coulomb Force vs Distance"
              data={forceData}
              xKey="r"
              xLabel="Distance (m)"
              yLabel="Force (N)"
              lines={[{ dataKey: 'F', color: '#dc2626', name: 'F (N)' }]}
            />
          );
        })()}

        {/* Check: inverse-square force law (after the force-vs-distance demo) */}
        <ConceptCheck data={toConceptCheck(Q_INVERSE_SQUARE)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <TheoryGuide>
          <p>
            <strong>Coulomb's Law:</strong> Force between charges is proportional to magnitude product,
            inversely proportional to distance squared:{' '}
            <MathWrapper formula="F = k \frac{q_1 q_2}{r^2}" />.
          </p>
          <p>
            <strong>Field Lines:</strong> Originate from (+) and terminate on (-). Density represents
            field strength.
          </p>
        </TheoryGuide>
      </div>
      <GuidedChallenge challenge={CHALLENGE} />
    </SectionLayout>
  );
}
