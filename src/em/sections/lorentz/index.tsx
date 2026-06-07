import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { Move } from 'lucide-react';
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
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import type { Challenge, QuizQuestion } from '@em/types/index';

interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
}

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_CIRCULAR: QuizQuestion = {
  question:
    'A proton moves with velocity v perpendicular to a uniform magnetic field B. The resulting Lorentz force causes the proton to:',
  options: ['Accelerate in a straight line', 'Decelerate and stop', 'Move in a circular path', 'Spiral outward indefinitely'],
  correctIndex: 2,
  explanation:
    'The magnetic force F = qv×B is always perpendicular to the velocity, so it changes the direction but not the speed. This centripetal force results in uniform circular motion with radius r = mv/(qB).',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'The magnetic force is always perpendicular to the velocity. What kind of motion results from a constant-magnitude force that is always perpendicular to the direction of travel?' },
    { tier: 2, label: 'Procedural hint', content: 'F = qv×B is perpendicular to v, so it does no work (F·v = 0). Speed stays constant, but direction changes continuously. This is the definition of what type of motion?' },
    { tier: 3, label: 'Show worked step', content: 'Since |F| = qvB = constant and F ⊥ v always, the force acts as a centripetal force: qvB = mv²/r → r = mv/(qB). The proton moves in a circle — option C.' },
  ],
};

const Q_RADIUS: QuizQuestion = {
  question:
    "The cyclotron radius of a charged particle in a magnetic field is r = mv/(qB). If the particle's speed is doubled while B remains constant, the radius:",
  options: ['Is halved', 'Stays the same', 'Is doubled', 'Is quadrupled'],
  correctIndex: 2,
  explanation:
    'Since r = mv/(qB), the radius is directly proportional to v. Doubling the speed doubles the cyclotron radius while the period of revolution remains the same (for non-relativistic speeds).',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Look at the formula r = mv/(qB). How does r depend on v — linearly, quadratically, or inversely?' },
    { tier: 2, label: 'Procedural hint', content: 'r = mv/(qB). Since m, q, and B are all constant, r is directly proportional to v. If v doubles, what happens to r?' },
    { tier: 3, label: 'Show worked step', content: 'r_new = m(2v)/(qB) = 2·mv/(qB) = 2r. The radius doubles — option C.' },
  ],
};

const Q_FORCE_DIR: QuizQuestion = {
  question:
    'A negative charge moves in the +x direction through a magnetic field pointing in the +z direction. What is the direction of the magnetic force on the charge?',
  options: ['+y direction', '−y direction', '+z direction', '−x direction'],
  correctIndex: 0,
  explanation:
    'Using F = qv×B: v×B = x̂×ẑ = −ŷ for the cross-product. For a negative charge, q < 0, so F = q(−ŷ) = +ŷ. The force is in the +y direction.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'First find the direction of v×B using the right-hand rule, then remember to flip the direction because the charge is negative.' },
    { tier: 2, label: 'Procedural hint', content: 'v = v x̂, B = B ẑ. Compute x̂ × ẑ using the cyclic rule (x̂ × ŷ = ẑ, ŷ × ẑ = x̂, ẑ × x̂ = ŷ). Then apply the negative sign for q < 0.' },
    { tier: 3, label: 'Show worked step', content: 'x̂ × ẑ = −(ẑ × x̂) = −ŷ. So v×B = vB(−ŷ). For negative charge: F = qv×B = (−|q|)(vB)(−ŷ) = |q|vB(+ŷ). The force is in the +y direction — option A.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Cyclotron Radius Investigation`,
  description: `Send a charged particle circling in a uniform magnetic field and discover how the cyclotron radius depends on speed, field strength, mass, and charge — verifying r = mv / (|q|B) using the simulation's live readouts and on-screen vectors.`,
  instructions: [
    `Set the 'Velocity v' slider to a clear positive value (e.g. 50) and the 'B-field' slider positive (the canvas label should read 'External B: Into Page'), then click 'Respawn' so the particle launches into a steady circular orbit. Hover the mouse over the canvas (without dragging) to reveal the readout box and note the |v| and r_c (cyclotron radius) values.`,
    `Without changing anything else, drag the 'Velocity v' slider to roughly double its value and click 'Respawn'. Hover again and confirm r_c grows in proportion to |v| — doubling the speed roughly doubles the radius.`,
    `Return 'Velocity v' to its original value and Respawn. Now increase the magnitude of the 'B-field' slider (push it further from 0). Hover and confirm r_c shrinks: a stronger field tightens the orbit (r_c is inversely proportional to B).`,
    `Raise the 'Mass m' slider toward 5 and Respawn. Hover to see r_c expand — heavier particles are harder to deflect — matching the m in r = mv / (|q|B). Cross-check your numbers against the live 'Computed r' line in the Lorentz Force equation box.`,
    `Watch the green 'v' arrow and the 'F' force arrow on the particle: confirm F is always perpendicular to v (it points toward the orbit centre), so the magnetic force does no work and the speed stays constant — only the direction turns.`,
    `Flip the 'Charge q' slider to a negative value and Respawn; observe that the orbit circulates the opposite way (the canvas readout still shows the same r_c, since r depends on |q|). Conclude how velocity, field, mass, and charge each shape the cyclotron orbit.`,
  ],
  hint: `The hover readout's r_c and the equation box's 'Computed r' both follow r = mv / (|q|B): radius rises with speed and mass, falls with field strength, and the sign of the charge only flips the direction of circulation, not the size of the circle.`,
};

export function LorentzSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const col = isDarkMode ? COLORS_DARK : COLORS;

  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('lorentz');
  const onCheckHint = () => incrementHints('lorentz');

  const [velocity, setVelocity] = useState(50);
  const [bField, setBField] = useState(50);
  const [charge, setCharge] = useState(1);
  const [mass, setMass] = useState(2);
  const [dragMode, setDragMode] = useState<'none' | 'particle' | 'velocity'>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasTouch(canvasRef);
  const physicsRef = useRef<ParticleState | null>(null);
  const animationRef = useRef(0);
  const hoverPos = useRef<{ x: number; y: number } | null>(null);

  const handleReset = useCallback(() => {
    if (canvasRef.current) {
      physicsRef.current = {
        x: velocity >= 0 ? 50 : canvasRef.current.width - 50,
        y: canvasRef.current.height / 2,
        vx: velocity * 2.5,
        vy: 0,
        trail: [],
      };
    }
  }, [velocity]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    const p = physicsRef.current;
    if (!pt || !p) return;
    const particleRadius = 6 + mass * 1.5;
    // Velocity arrow tip position (same scale as drawVec: *0.3)
    const vTipX = p.x + p.vx * 0.3;
    const vTipY = p.y + p.vy * 0.3;
    const distToVTip = Math.hypot(pt.x - vTipX, pt.y - vTipY);
    const distToParticle = Math.hypot(pt.x - p.x, pt.y - p.y);
    // Prioritize velocity arrow if close to its tip
    if (distToVTip < 15 && Math.hypot(p.vx, p.vy) > 10) {
      setDragMode('velocity');
    } else if (distToParticle < particleRadius + 10) {
      setDragMode('particle');
    }
  }, [getCanvasPoint, mass]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    hoverPos.current = pt;
    if (dragMode === 'none') return;
    const p = physicsRef.current;
    if (!pt || !p) return;
    if (dragMode === 'particle') {
      p.x = pt.x;
      p.y = pt.y;
      p.trail = [];
    } else if (dragMode === 'velocity') {
      p.vx = (pt.x - p.x) / 0.3;
      p.vy = (pt.y - p.y) / 0.3;
    }
  }, [dragMode, getCanvasPoint]);

  const handleMouseUp = useCallback(() => setDragMode('none'), []);
  const handleMouseLeaveLorentz = useCallback(() => {
    setDragMode('none');
    hoverPos.current = null;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const p = physicsRef.current;
    if (!p) return;
    const step = 5;
    if (e.key === 'ArrowLeft') { e.preventDefault(); p.x -= step; }
    else if (e.key === 'ArrowRight') { e.preventDefault(); p.x += step; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); p.y -= step; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); p.y += step; }
  }, []);

  useEffect(() => {
    if (!physicsRef.current) handleReset();
  }, [handleReset]);

  const drawVec = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    label: string
  ) => {
    const mag = Math.hypot(vx, vy);
    if (mag < 4) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + vx, y + vy);
    ctx.stroke();
    const angle = Math.atan2(vy, vx),
      headLen = 8;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(x + vx, y + vy);
    ctx.lineTo(x + vx - headLen * Math.cos(angle - Math.PI / 6), y + vy - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x + vx - headLen * Math.cos(angle + Math.PI / 6), y + vy - headLen * Math.sin(angle + Math.PI / 6));
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(label, x + vx + 8, y + vy + 8);
  };

  useEffect(() => {
    const loop = () => {
      const cvs = canvasRef.current;
      if (cvs && physicsRef.current) {
        const ctx = cvs.getContext('2d')!;
        cvs.width = cvs.parentElement!.clientWidth;
        cvs.height = cvs.parentElement!.clientHeight;
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        if (isDarkMode) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, cvs.width, cvs.height);
        }

        // B-field symbols
        const symbol = bField > 0 ? '⊗' : bField < 0 ? '⊙' : '·';
        ctx.fillStyle = col.B_FIELD;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(Math.abs(bField) / 30, 0.3);
        for (let x = 25; x < cvs.width; x += 50)
          for (let y = 25; y < cvs.height; y += 50) ctx.fillText(symbol, x, y);
        ctx.globalAlpha = 1;

        ctx.textAlign = 'right';
        ctx.fillStyle = col.B_FIELD;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(
          `External B: ${bField > 0 ? 'Into Page' : bField < 0 ? 'Out of Page' : 'Off'}`,
          cvs.width - 20,
          30
        );

        // Boris integrator — symplectic, conserves energy exactly for B-only fields
        // Reference: Birdsall & Langdon, "Plasma Physics via Computer Simulation"
        const p = physicsRef.current;
        const dt = 0.016;
        const Bz = bField / 20; // effective B-field (z-component, into screen when positive)
        const qOverM = charge / mass;

        // Skip physics when dragging the particle
        if (dragMode !== 'particle') {
          // t-vector: t = (q*B*dt) / (2*m), only z-component for uniform B along z
          const t = qOverM * Bz * dt * 0.5;
          const s = (2 * t) / (1 + t * t);

          // v⁻ = v^n (no E-field, so no half-acceleration step)
          const vmx = p.vx;
          const vmy = p.vy;

          // v' = v⁻ + (v⁻ × t̂)  where t̂ = (0,0,t)
          // (vx, vy, 0) × (0, 0, t) = (vy*t, -vx*t, 0)
          const vpx = vmx + vmy * t;
          const vpy = vmy - vmx * t;

          // v⁺ = v⁻ + (v' × ŝ)  where ŝ = (0,0,s)
          // (vpx, vpy, 0) × (0, 0, s) = (vpy*s, -vpx*s, 0)
          p.vx = vmx + vpy * s;
          p.vy = vmy - vpx * s;

          // Position update
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }

        if (Math.random() > 0.5) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 150) p.trail.shift();
        }

        // Trail
        ctx.beginPath();
        ctx.strokeStyle = charge > 0 ? '#fca5a5' : '#93c5fd';
        ctx.lineWidth = 2;
        p.trail.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();

        // Particle
        ctx.beginPath();
        ctx.fillStyle = charge > 0 ? col.E_FIELD : col.B_FIELD;
        ctx.arc(p.x, p.y, 6 + mass * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(charge > 0 ? `+${charge}` : `${charge}`, p.x, p.y + 1);

        // Vectors
        drawVec(ctx, p.x, p.y, p.vx * 0.3, p.vy * 0.3, '#10b981', 'v');
        const Fx = charge * p.vy * (bField / 20);
        const Fy = charge * -p.vx * (bField / 20);
        drawVec(ctx, p.x, p.y, Fx * 0.4, Fy * 0.4, col.CURRENT, 'F');

        // Velocity arrow handle (draggable dot at tip)
        const vTipX = p.x + p.vx * 0.3;
        const vTipY = p.y + p.vy * 0.3;
        if (Math.hypot(p.vx, p.vy) > 10) {
          ctx.beginPath();
          ctx.fillStyle = dragMode === 'velocity' ? '#10b981' : '#10b98180';
          ctx.arc(vTipX, vTipY, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Drag hints
        ctx.fillStyle = col.TEXT_MUTED;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Drag particle to move · Drag arrow tip to aim', 10, cvs.height - 10);

        // Hover readout: show speed, |F|, cyclotron radius
        if (hoverPos.current && dragMode === 'none') {
          const speed = Math.hypot(p.vx, p.vy);
          const Beff = Math.abs(bField / 20);
          const Fmag = Math.abs(charge) * speed * Beff;
          const rCyc = Beff > 0.01 && charge !== 0
            ? (mass * speed / (Math.abs(charge) * Beff)).toFixed(1)
            : '∞';

          const lines = [
            `|v| = ${speed.toFixed(1)}`,
            `|F| = ${Fmag.toFixed(1)}`,
            `r_c = ${rCyc}`,
          ];

          ctx.font = '10px monospace';
          const tw = 110;
          const th = 46;
          const tx = 10, ty = cvs.height - 65;
          ctx.fillStyle = isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.roundRect(tx, ty, tw, th, 4);
          ctx.fill();
          ctx.strokeStyle = isDarkMode ? '#475569' : '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          lines.forEach((line, i) => {
            ctx.fillText(line, tx + 6, ty + 4 + i * 14);
          });
        }
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationRef.current);
  }, [velocity, bField, charge, mass, isDarkMode, col, dragMode]);

  return (
    <SectionLayout
      sectionId="lorentz"
      hook="Particle accelerators like CERN steer proton beams using magnetic fields. A proton travelling at 99.9999991% of the speed of light is bent into a circle by this force — the same one you're about to calculate."
    >
      {/* ── Predict-first gate around the simulation ── */}
      <PredictionGate
        question="A positive charge moves to the right in a magnetic field pointing out of the screen. Which direction is the magnetic force?"
        options={[
          { id: 'up', label: 'Up' },
          { id: 'down', label: 'Down' },
          { id: 'left', label: 'Left' },
          { id: 'right', label: 'Right' },
        ]}
        getCorrectAnswer={() => 'down'}
        explanation={
          <span>
            F = q(<MathWrapper formula="\vec{v} \times \vec{B}" />). With <MathWrapper formula="\vec{v} = \hat{x}" /> (right)
            and <MathWrapper formula="\vec{B} = \hat{z}" /> (out of screen), the cross product{' '}
            <MathWrapper formula="\hat{x} \times \hat{z} = -\hat{y}" />. For a positive charge the force points in the
            −y direction (down).
          </span>
        }
        onPredict={(correct) => markPredictionGate('lorentz', correct)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex-grow min-h-[400px] outline-none"
              role="button"
              aria-label="Lorentz force simulation. Use the arrow keys to move the charged particle."
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ cursor: dragMode !== 'none' ? 'grabbing' : 'default' }}
                role="img"
                aria-label="Lorentz force simulation showing charged particle trajectory in magnetic field"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeaveLorentz}
              />
            </div>
          </div>
          <ControlPanel title="Particle Controls">
            <Slider label={`Charge q = ${charge} (arb. units)`} value={charge} min={-5} max={5} onChange={setCharge} color="bg-red-600" />
            <Slider label={`Mass m = ${mass} (arb. units)`} value={mass} min={0.5} max={5} step={0.5} onChange={setMass} color="bg-slate-500" />
            <Slider label={`Velocity v = ${velocity} (arb.)`} value={velocity} min={-100} max={100} onChange={setVelocity} color="bg-emerald-600" />
            <Slider label={`B-field = ${(bField / 20).toFixed(1)} (arb.)`} value={bField} min={-100} max={100} onChange={setBField} color="bg-blue-600" />
            <button
              onClick={handleReset}
              className="w-full mt-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200 flex justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Move size={16} /> Respawn
            </button>
            <HintBox>
              Increase the Mass (<MathWrapper formula="m" />) to see the radius expand. Heavier particles are
              harder to deflect!
            </HintBox>
          </ControlPanel>
        </div>
      </PredictionGate>

      {/* Check: circular motion (after observing the v × B trajectory) */}
      <ConceptCheck data={toConceptCheck(Q_CIRCULAR)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── Theory ── */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/cyclotron-patent.png`}
            alt="Lawrence's original cyclotron patent diagram"
            caption="Lawrence's cyclotron patent: charged particles spiral outward as the Lorentz force bends their path into circles."
            attribution="Ernest O. Lawrence, Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Cyclotron_patent.png"
          />
          <FigureImage
            src={`${import.meta.env.BASE_URL}figures/aurora-borealis.jpg`}
            alt="Aurora borealis (Northern Lights)"
            caption="Aurora borealis: solar wind particles spiral along Earth's magnetic field due to the Lorentz force, exciting atmospheric gases."
            attribution="Sr. Airman Joshua Strang, U.S. Air Force — Public Domain — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg"
          />
        </div>
        <EquationBox
          title="Lorentz Force"
          equations={[
            { label: 'Force', math: '\\vec{F} = q(\\vec{v} \\times \\vec{B})', color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Radius', math: 'r = \\frac{mv}{|q|B}', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Computed r', math: charge !== 0 && bField !== 0
              ? `r = \\frac{${mass} \\times ${Math.abs(velocity)}}{${Math.abs(charge)} \\times ${Math.abs(bField / 20).toFixed(1)}} = ${(mass * Math.abs(velocity) / (Math.abs(charge) * Math.abs(bField / 20 || 1))).toFixed(1)} \\text{ (arb.)}`
              : '\\text{—}' },
          ]}
        />

        {/* Check: cyclotron radius dependence on speed (after the radius equation) */}
        <ConceptCheck data={toConceptCheck(Q_RADIUS)} onComplete={onCheckComplete} onHint={onCheckHint} />

        {/* Check: force direction from v × B */}
        <ConceptCheck data={toConceptCheck(Q_FORCE_DIR)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <TheoryGuide>
          <p>
            <strong>Right Hand Rule:</strong> Force is perpendicular to both velocity and B-field.
          </p>
          <p>
            <strong>Cyclotron Radius:</strong> <MathWrapper formula="r = mv / qB" />. Faster/heavier particles
            orbit wider. Stronger fields tighten the orbit.
          </p>
        </TheoryGuide>
      </div>
      <GuidedChallenge challenge={CHALLENGE} />
    </SectionLayout>
  );
}
