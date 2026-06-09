import { useState, useRef, useEffect } from 'react';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';
import { COLORS, COLORS_DARK } from '@em/constants/physics';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { EquationBox } from '@em/components/common/EquationBox';
import { HintBox } from '@em/components/common/HintBox';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { TheoryGuide } from '@em/components/common/TheoryGuide';
import { Link } from 'react-router-dom';
import { FigureImage } from '@shared/components/common/FigureImage';
import { ArrowRight } from 'lucide-react';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import type { Challenge, QuizQuestion } from '@em/types/index';

const MU_0 = 4 * Math.PI * 1e-7;

/** Core material presets with relative permeability. */
const CORE_MATERIALS = [
  { label: 'Air', muR: 1 },
  { label: 'Iron', muR: 5000 },
  { label: 'Ferrite', muR: 1000 },
] as const;

// ── Inline ConceptCheck content (verified; ported from constants/quizContent.ts) ──
const Q_RELUCTANCE: QuizQuestion = {
  question: 'In a magnetic circuit, what is reluctance analogous to in an electric circuit?',
  options: ['Voltage', 'Current', 'Resistance', 'Capacitance'],
  correctIndex: 2,
  explanation:
    'Reluctance ℛ = l/(μA) is the magnetic analog of resistance R = l/(σA). Just as resistance opposes current flow, reluctance opposes magnetic flux.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Reluctance opposes the flow of magnetic flux, just as ___ opposes the flow of electric current.' },
    { tier: 2, label: 'Procedural hint', content: "Compare the formulas: ℛ = l/(μA) and R = l/(σA). Same structure — length divided by (material property × area). What's the electric circuit quantity R?" },
    { tier: 3, label: 'Show worked step', content: "Magnetic circuit Ohm's law: Φ = MMF/ℛ ↔ Electric: I = V/R. Reluctance ℛ plays the same role as resistance R — option C." },
  ],
};

const Q_AIR_GAP: QuizQuestion = {
  question: 'What happens to the inductance of a toroid when an air gap is introduced?',
  options: ['Inductance increases', 'Inductance decreases', 'Inductance stays the same', 'Inductance becomes zero'],
  correctIndex: 1,
  explanation:
    'An air gap has much higher reluctance than iron (μ_air ≪ μ_iron), so total reluctance increases and inductance L = N²/ℛ decreases.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: 'Air has a much lower permeability than iron. Adding an air gap means the flux has to cross a less permeable material. How does that affect the total reluctance?' },
    { tier: 2, label: 'Procedural hint', content: 'Total reluctance = ℛ_iron + ℛ_gap. Since μ_air ≪ μ_iron, the gap adds significant reluctance. Inductance L = N²/ℛ_total. If ℛ increases, what happens to L?' },
    { tier: 3, label: 'Show worked step', content: 'ℛ_gap = l_gap/(μ₀A) ≫ ℛ_iron for even small gaps. ℛ_total increases → L = N²/ℛ_total decreases — option B.' },
  ],
};

const Q_TRANSFORMER: QuizQuestion = {
  question: 'For an ideal transformer with N₁ = 100 and N₂ = 500 turns, if V₁ = 12 V, what is V₂?',
  options: ['2.4 V', '12 V', '60 V', '600 V'],
  correctIndex: 2,
  explanation:
    'For an ideal transformer, V₂/V₁ = N₂/N₁ = 500/100 = 5. Therefore V₂ = 5 × 12 V = 60 V.',
  hints: [
    { tier: 1, label: 'Conceptual hint', content: "An ideal transformer's voltage ratio equals its turns ratio. More turns on the secondary means higher or lower voltage?" },
    { tier: 2, label: 'Procedural hint', content: 'V₂/V₁ = N₂/N₁. Plug in N₁ = 100, N₂ = 500, V₁ = 12 V and solve for V₂.' },
    { tier: 3, label: 'Show worked step', content: 'V₂ = V₁ × (N₂/N₁) = 12 × (500/100) = 12 × 5 = 60 V — option C.' },
  ],
};

const CHALLENGE: Challenge = {
  title: `Air-Gap Inductance Explorer`,
  description: `Use the toroid simulation to discover how a small air gap reluctance dominates the magnetic circuit, slashing inductance L and flux density B even though the gap is a tiny fraction of the flux path.`,
  instructions: [
    `Click the 'Iron' core button (the readout should show μᵣ = 5,000), set 'Turns N' to 200 and 'Current I (A)' to 1, and drag the 'Air Gap' slider to 0%. Read the on-canvas L = ... value and write it down as your baseline inductance.`,
    `Slowly drag the 'Air Gap' slider up to about 5% and watch the L readout. Notice how steeply L falls for such a small gap, and that a second readout 'H_gap' now appears alongside 'H_core' once the gap opens.`,
    `With the gap held near 5%, compare the 'H_core' and 'H_gap' readouts: H_gap should be far larger than H_core. Conclude that almost all the magnetomotive force (MMF = NI) is being 'dropped' across the thin gap, because ℛ_gap = l_gap/(μ₀A) dwarfs ℛ_core.`,
    `Now click the 'Ferrite' core button (μᵣ = 1,000) and repeat the gap sweep from 0% to 5%. Compare how much L drops for ferrite versus iron and conclude which core's inductance is more sensitive to the same gap percentage.`,
    `Return to 'Iron', set the gap back to 0%, and read the baseline L. Then nudge the 'Air Gap' slider up step by step until the L readout reaches roughly half of that baseline. Note the gap percentage where this happens and compare it to your prediction.`,
    `For contrast, click the 'Air' core button (μᵣ = 1) with the gap at 0% and watch B and L collapse. Conclude that the iron/ferrite core is what makes the flux Φ = BA (and thus L = N²/ℛ) large in the first place.`,
  ],
  hint: `Total reluctance adds in series: ℛ_total = ℛ_core + ℛ_gap. Because μ₀ is thousands of times smaller than μ of iron/ferrite, even a 1-2% gap can add more reluctance than the entire core path — and L = N²/ℛ_total falls with it.`,
};

export function MagneticCircuitsSection() {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const col = isDarkMode ? COLORS_DARK : COLORS;

  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const onCheckComplete = () => incrementConceptChecks('magnetic-circuits');
  const onCheckHint = () => incrementHints('magnetic-circuits');

  // Toroid simulation controls
  const [materialIndex, setMaterialIndex] = useState(1); // default: Iron
  const [turns, setTurns] = useState(200);
  const [current, setCurrent] = useState(1);
  const [gapPercent, setGapPercent] = useState(0); // 0 to 20

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(0);
  useCanvasTouch(canvasRef);

  const material = CORE_MATERIALS[materialIndex];
  const muR = material.muR;

  // Toroid geometry (physical)
  const meanRadius = 0.05; // 5 cm
  const coreArea = 0.001;  // 10 cm² = 0.001 m²
  const pathLength = 2 * Math.PI * meanRadius;
  const gapLength = (gapPercent / 100) * pathLength;
  const coreLength = pathLength - gapLength;

  // Reluctances
  const reluctanceCore = coreLength / (MU_0 * muR * coreArea);
  const reluctanceGap = gapLength > 0 ? gapLength / (MU_0 * coreArea) : 0;
  const reluctanceTotal = reluctanceCore + reluctanceGap;

  // Computed outputs
  const mmf = turns * current;
  const flux = mmf / reluctanceTotal;
  const B = flux / coreArea;
  // H differs by section: B = μ₀μᵣH_core = μ₀H_gap
  const hCore = B / (MU_0 * muR);
  const hGap = gapLength > 0 ? B / MU_0 : 0;
  const inductance = (turns * turns) / reluctanceTotal;

  const formatSI = (val: number, unit: string): string => {
    if (Math.abs(val) >= 1) return `${val.toFixed(3)} ${unit}`;
    if (Math.abs(val) >= 1e-3) return `${(val * 1e3).toFixed(2)} m${unit}`;
    if (Math.abs(val) >= 1e-6) return `${(val * 1e6).toFixed(2)} μ${unit}`;
    return `${(val * 1e9).toFixed(1)} n${unit}`;
  };

  // Ref for derived values consumed in the canvas draw loop
  const derivedRef = useRef({ B, hCore, hGap, gapLength, flux, inductance, col, muR, material });
  useEffect(() => {
    derivedRef.current = { B, hCore, hGap, gapLength, flux, inductance, col, muR, material };
  }, [B, hCore, hGap, gapLength, flux, inductance, col, muR, material]);

  // Canvas rendering — schedule unconditionally so the sim starts drawing as soon
  // as the canvas mounts (including after the PredictionGate reveals it).
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext('2d') : null;
      if (canvas && ctx) {
        if (canvas.parentElement) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
        const w = canvas.width, h = canvas.height;
        const d = derivedRef.current;
        ctx.clearRect(0, 0, w, h);
        if (isDarkMode) { ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h); }

        const cx = w / 2, cy = h / 2;
        const outerR = Math.min(w, h) * 0.35;
        const innerR = outerR * 0.65;
        const midR = (outerR + innerR) / 2;
        const coreWidth = outerR - innerR;

        // Gap angle in radians
        const gapAngleRad = (gapPercent / 100) * 2 * Math.PI;
        const gapStart = -gapAngleRad / 2;
        const gapEnd = gapAngleRad / 2;

        // Draw core (toroid cross-section as annular ring)
        ctx.beginPath();
        if (gapPercent > 0.5) {
          ctx.arc(cx, cy, outerR, gapEnd, 2 * Math.PI + gapStart);
          ctx.arc(cx, cy, innerR, 2 * Math.PI + gapStart, gapEnd, true);
        } else {
          ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
          ctx.arc(cx, cy, innerR, 2 * Math.PI, 0, true);
        }
        ctx.closePath();
        ctx.fillStyle = materialIndex === 0
          ? (isDarkMode ? '#1e293b' : '#f1f5f9')
          : materialIndex === 1
            ? (isDarkMode ? '#334155' : '#94a3b8')
            : (isDarkMode ? '#44403c' : '#a8a29e');
        ctx.fill();
        ctx.strokeStyle = d.col.TEXT_MAIN;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw gap lines
        if (gapPercent > 0.5) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          for (const angle of [gapStart, gapEnd]) {
            ctx.beginPath();
            ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
            ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
            ctx.stroke();
          }
          // Gap label
          ctx.fillStyle = '#f59e0b';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Gap', cx + (outerR + 15) * Math.cos(0), cy);
        }

        // Draw field lines inside core
        if (Math.abs(current) > 0.01) {
          const numLines = 5;
          const fieldAlpha = Math.min(1, Math.abs(d.B) / 0.5);
          ctx.globalAlpha = 0.3 + 0.5 * fieldAlpha;
          for (let i = 0; i < numLines; i++) {
            const r = innerR + ((i + 0.5) / numLines) * coreWidth;
            ctx.beginPath();
            ctx.strokeStyle = d.col.B_FIELD;
            ctx.lineWidth = 1 + fieldAlpha;
            ctx.setLineDash([4, 4]);
            if (gapPercent > 0.5) {
              ctx.arc(cx, cy, r, gapEnd + 0.05, 2 * Math.PI + gapStart - 0.05);
            } else {
              ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            }
            ctx.stroke();
          }
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;

          // Arrows on field lines to show direction
          const arrowR = midR;
          const arrowAngles = [Math.PI * 0.5, Math.PI, Math.PI * 1.5];
          for (const a of arrowAngles) {
            if (gapPercent > 0.5 && Math.abs(a) < gapAngleRad / 2 + 0.1) continue;
            const ax = cx + arrowR * Math.cos(a);
            const ay = cy + arrowR * Math.sin(a);
            const dir = current >= 0 ? a + Math.PI / 2 : a - Math.PI / 2;
            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(dir);
            ctx.fillStyle = d.col.B_FIELD;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-4, 4);
            ctx.fill();
            ctx.restore();
          }
        }

        // Draw coil turns (small marks on outer ring)
        const turnCount = Math.min(turns, 40); // visual limit
        ctx.strokeStyle = d.col.CURRENT;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < turnCount; i++) {
          const angle = gapEnd + 0.1 + (i / turnCount) * (2 * Math.PI - gapAngleRad - 0.2);
          const x1 = cx + (outerR - 2) * Math.cos(angle);
          const y1 = cy + (outerR - 2) * Math.sin(angle);
          const x2 = cx + (outerR + 8) * Math.cos(angle);
          const y2 = cy + (outerR + 8) * Math.sin(angle);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Labels
        ctx.fillStyle = d.col.TEXT_MAIN;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${d.material.label} core (μᵣ = ${d.muR.toLocaleString()})`, cx, cy - outerR - 20);

        // Output readouts
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        const readoutX = 15, readoutY = h - 110;
        const lines: { text: string; color: string }[] = [
          { text: `H_core = ${formatSI(d.hCore, 'A/m')}`, color: d.col.B_FIELD },
          ...(d.gapLength > 0 ? [{ text: `H_gap  = ${formatSI(d.hGap, 'A/m')}`, color: '#f59e0b' }] : []),
          { text: `B = ${formatSI(d.B, 'T')}`, color: d.col.B_FIELD },
          { text: `Φ = ${formatSI(d.flux, 'Wb')}`, color: isDarkMode ? '#94a3b8' : '#475569' },
          { text: `L = ${formatSI(d.inductance, 'H')}`, color: isDarkMode ? '#94a3b8' : '#475569' },
        ];
        ctx.fillStyle = isDarkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)';
        ctx.fillRect(readoutX - 5, readoutY - 14, 200, lines.length * 18 + 10);
        ctx.strokeStyle = isDarkMode ? '#334155' : '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(readoutX - 5, readoutY - 14, 200, lines.length * 18 + 10);
        lines.forEach((line, i) => {
          ctx.fillStyle = line.color;
          ctx.fillText(line.text, readoutX, readoutY + i * 18);
        });
      }

      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [current, turns, gapPercent, materialIndex, isDarkMode]);

  return (
    <SectionLayout
      sectionId="magnetic-circuits"
      hook="Every transformer, motor, and inductor in your electronics relies on magnetic circuits. The same Kirchhoff-style analysis you use for electric circuits applies — just with flux instead of current and MMF instead of voltage."
    >
      {/* ── Predict-first gate around the simulation ── */}
      <PredictionGate
        question="If you insert an air gap into an iron core toroid, does the inductance increase, decrease, or stay the same?"
        options={[
          { id: 'increase', label: 'Increases' },
          { id: 'decrease', label: 'Decreases' },
          { id: 'same', label: 'Stays the same' },
        ]}
        getCorrectAnswer={() => 'decrease'}
        explanation={
          <span>
            The air gap adds significant reluctance (<MathWrapper formula="\mathcal{R}_{gap} = l_{gap}/(\mu_0 A)" />) to the
            circuit. Since <MathWrapper formula="L = N^2/\mathcal{R}_{total}" /> and the total reluctance increases,
            inductance decreases. Even a small gap can dramatically reduce L.
          </span>
        }
        onPredict={(correct) => markPredictionGate('magnetic-circuits', correct)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex-grow min-h-[400px]">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                role="img"
                aria-label="Toroid magnetic circuit simulation showing flux lines and air gap"
              />
            </div>
          </div>
          <ControlPanel title="Toroid Parameters">
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Core Material</span>
              <div className="flex gap-2">
                {CORE_MATERIALS.map((m, i) => (
                  <button
                    key={m.label}
                    onClick={() => setMaterialIndex(i)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      materialIndex === i
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">μᵣ = {muR.toLocaleString()}</p>
            </div>
            <Slider label="Turns N" value={turns} min={10} max={500} onChange={setTurns} />
            <Slider label="Current I (A)" value={current} min={0} max={10} step={0.1} onChange={setCurrent} />
            <Slider label={`Air Gap (${gapPercent}%)`} value={gapPercent} min={0} max={20} onChange={setGapPercent} />
            <HintBox>
              Even a tiny air gap drastically reduces inductance because μ₀ ≪ μ_iron.
            </HintBox>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              <strong>Note:</strong> μᵣ = 5,000 (Iron) is a typical linearized value. Real iron is nonlinear — μᵣ varies from ~100 (near saturation) to ~10,000 (low flux density). This simulation neglects B-H curve nonlinearity and fringing at the air gap (flux is assumed confined to the core cross-section A).
            </p>
          </ControlPanel>
        </div>
      </PredictionGate>

      {/* Check: reluctance ~ resistance */}
      <ConceptCheck data={toConceptCheck(Q_RELUCTANCE)} onComplete={onCheckComplete} onHint={onCheckHint} />

      {/* ── Theory ── */}
      <div className="space-y-6">
        <FigureImage
          className="mb-6"
          src={`${import.meta.env.BASE_URL}figures/toroidal-transformer-ferrite.jpg`}
          alt="Toroidal transformer with copper windings on a ferrite core"
          caption="A toroidal transformer: the closed core confines nearly all magnetic flux, minimizing leakage."
          attribution="LoKiLeCh, CC BY-SA 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:IF_transformer.JPG"
        />
        {/* Subsection 1: Flux and Reluctance */}
        <EquationBox
          title="Magnetic Flux & Reluctance"
          equations={[
            { label: 'Flux density', math: 'B = \\mu H = \\mu_0 \\mu_r H' },
            { label: 'Reluctance', math: '\\mathcal{R} = \\frac{l}{\\mu A}', color: 'text-indigo-600 dark:text-indigo-400' },
            { label: "Hopkinson's Law", math: '\\text{MMF} = \\Phi \\cdot \\mathcal{R} \\quad (\\text{analog of } V = IR)' },
            { label: 'Inductance', math: 'L = \\frac{N^2}{\\mathcal{R}}' },
          ]}
        />

        {/* Check: air gap → inductance (L = N²/ℛ) */}
        <ConceptCheck data={toConceptCheck(Q_AIR_GAP)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <TheoryGuide>
          <ul className="list-disc pl-4 space-y-2">
            <li>
              <strong>Magnetic flux Φ</strong> is the total field through a cross-section: <MathWrapper formula="\Phi = BA" />.
              It is analogous to current in electric circuits.
            </li>
            <li>
              <strong>Field strength H</strong> is the magnetizing force: <MathWrapper formula="H = NI / l" />.
              It is analogous to voltage (EMF).
            </li>
            <li>
              <strong>Reluctance <MathWrapper formula="\mathcal{R}" /></strong> opposes flux just as resistance opposes current.
              For a uniform path: <MathWrapper formula="\mathcal{R} = l / (\mu A)" />.
            </li>
            <li>
              <strong>Hopkinson's law</strong> (<MathWrapper formula="\text{MMF} = \Phi \mathcal{R}" />) is the magnetic version of Ohm's law.
              Series reluctances add, just like series resistors.
            </li>
          </ul>
        </TheoryGuide>

        {/* Subsection 3: Mutual Inductance */}
        <EquationBox
          title="Mutual Inductance"
          equations={[
            { label: 'Coupling coefficient', math: 'k = \\frac{M}{\\sqrt{L_1 L_2}}, \\quad 0 \\le k \\le 1' },
            { label: 'Ideal transformer', math: '\\frac{V_2}{V_1} = \\frac{N_2}{N_1}', color: 'text-amber-600 dark:text-amber-400' },
          ]}
        />

        {/* Check: ideal transformer turns ratio (mutual inductance) */}
        <ConceptCheck data={toConceptCheck(Q_TRANSFORMER)} onComplete={onCheckComplete} onHint={onCheckHint} />

        <TheoryGuide>
          <ul className="list-disc pl-4 space-y-2">
            <li>
              Two coils sharing magnetic flux are <strong>mutually coupled</strong>.
              The coupling coefficient <MathWrapper formula="k" /> ranges from 0 (no coupling) to 1 (ideal, all flux shared).
            </li>
            <li>
              An <strong>ideal transformer</strong> has <MathWrapper formula="k = 1" /> and transforms voltage by the turns ratio: <MathWrapper formula="V_2/V_1 = N_2/N_1" />.
            </li>
            <li>
              <strong>Worked example:</strong> A transformer has <MathWrapper formula="N_1 = 100" /> and <MathWrapper formula="N_2 = 500" /> turns.
              If <MathWrapper formula="V_1 = 12\text{ V}" />, then <MathWrapper formula="V_2 = 12 \times 500/100 = 60\text{ V}" />.
            </li>
            <li className="text-xs text-slate-500 dark:text-slate-400 italic">
              Note: Full circuit treatment (reflected impedance, dot convention) is covered in the Transformers section, up next.
            </li>
          </ul>
        </TheoryGuide>

        {/* Subsection 4: Bridge back to Part 1 (circuits-first spine: the math came first) */}
        <div className="p-5 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20">
          <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
            Every inductor in Part 1 — every RL circuit, every RLC transient — has a physical origin in what you just learned.
            The <MathWrapper formula="L" /> in your circuit equations is the inductance of a real coil, determined by its geometry
            and core material. The math came first, in Part 1. The physics lives here.
          </p>
          <Link
            to="/component-physics"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Revisit Component Physics <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <GuidedChallenge challenge={CHALLENGE} />
    </SectionLayout>
  );
}
