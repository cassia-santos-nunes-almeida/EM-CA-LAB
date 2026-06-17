/**
 * Static rod-on-rails figure for the motional-EMF theory block in Faraday 3.1.
 *
 * Gate-exempt by design ruling (unit-2D spec §5A): the figure is purely
 * presentational — zero controls, zero state — the same class as the vendored
 * `FigureImage` assets, so it renders OUTSIDE the section's PredictionGates.
 *
 * Geometry encoded here (audited in the spec, §5 direction audit):
 * B into the page (⊗), rod sliding right at v → induced current
 * counter-clockwise (up the rod, left along the top rail, down through R)
 * and a drag force on the rod pointing left, against the pull.
 */

// Dark-mode-aware stroke/fill class constants (house pattern: SwitchedRCSim).
const RAIL_STROKE = 'stroke-slate-500 dark:stroke-slate-400';
const ROD_STROKE = 'stroke-engineering-blue-600 dark:stroke-engineering-blue-400';
const LABEL_TEXT = 'fill-slate-600 dark:fill-slate-300';
const DIM_STROKE = 'stroke-slate-400 dark:stroke-slate-500';
const DIM_TEXT = 'fill-slate-500 dark:fill-slate-400';
const FIELD_TEXT = 'fill-indigo-500 dark:fill-indigo-400';
const V_FILL = 'fill-emerald-600 dark:fill-emerald-400';
const V_STROKE = 'stroke-emerald-600 dark:stroke-emerald-400';
const F_FILL = 'fill-orange-600 dark:fill-orange-400';
const F_STROKE = 'stroke-orange-600 dark:stroke-orange-400';
const I_FILL = 'fill-amber-600 dark:fill-amber-400';

/** ⊗ grid positions for the field region (rails span y 60–190). */
const FIELD_XS = [110, 160, 210, 260, 360, 410];
const FIELD_YS = [85, 125, 165];

export function RodOnRailsFigure() {
  return (
    <figure className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <svg
        viewBox="0 0 480 250"
        className="w-full h-auto"
        role="img"
        aria-label="Conducting rod sliding right on two rails, closing a circuit through a resistor, in a magnetic field into the page"
      >
        {/* B-field into the page: ⊗ grid + label */}
        <text x={430} y={34} textAnchor="end" fontSize={12} className={FIELD_TEXT}>
          B ⊗ (into page)
        </text>
        {FIELD_YS.map((y) =>
          FIELD_XS.map((x) => (
            <text
              key={`${x}-${y}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontFamily="ui-monospace, monospace"
              opacity={0.75}
              className={FIELD_TEXT}
            >
              ⊗
            </text>
          ))
        )}

        {/* Rails */}
        <line x1={70} y1={60} x2={430} y2={60} strokeWidth={2} className={RAIL_STROKE} />
        <line x1={70} y1={190} x2={430} y2={190} strokeWidth={2} className={RAIL_STROKE} />

        {/* Left closure through the resistor (vertical zigzag) */}
        <line x1={70} y1={60} x2={70} y2={95} strokeWidth={2} className={RAIL_STROKE} />
        <polyline
          points="70,95 78,101 62,113 78,125 62,137 78,149 70,155"
          fill="none"
          strokeWidth={2}
          className={RAIL_STROKE}
        />
        <line x1={70} y1={155} x2={70} y2={190} strokeWidth={2} className={RAIL_STROKE} />
        <text x={46} y={129} fontSize={14} fontStyle="italic" className={LABEL_TEXT}>
          R
        </text>

        {/* The sliding rod (static drawing — it does not move) */}
        <line
          x1={310}
          y1={52}
          x2={310}
          y2={198}
          strokeWidth={6}
          strokeLinecap="round"
          className={ROD_STROKE}
        />

        {/* Velocity arrow: rod pulled right at v */}
        <line x1={322} y1={100} x2={368} y2={100} strokeWidth={2.5} className={V_STROKE} />
        <polygon points="368,94 380,100 368,106" className={V_FILL} />
        <text x={374} y={88} fontSize={14} fontStyle="italic" className={V_FILL}>
          v
        </text>

        {/* Opposing (drag) force on the rod: F_opp points left, against the pull */}
        <line x1={298} y1={145} x2={252} y2={145} strokeWidth={2.5} className={F_STROKE} />
        <polygon points="252,139 240,145 252,151" className={F_FILL} />
        <text x={244} y={132} fontSize={14} fontStyle="italic" className={F_FILL}>
          F
          <tspan dy={4} fontSize={10}>
            opp
          </tspan>
        </text>

        {/* Induced current, counter-clockwise: up the rod → left along the top
            rail → down through R → right along the bottom rail */}
        <polygon points="304,175 310,161 316,175" className={I_FILL} />
        <polygon points="196,54 182,60 196,66" className={I_FILL} />
        <polygon points="64,74 76,74 70,88" className={I_FILL} />
        <polygon points="184,184 198,190 184,196" className={I_FILL} />
        <text x={200} y={50} fontSize={13} fontStyle="italic" className={I_FILL}>
          I
        </text>

        {/* Dimension l: rod length */}
        <line x1={448} y1={68} x2={448} y2={182} strokeWidth={1} className={DIM_STROKE} />
        <polygon points="444,68 448,60 452,68" className={DIM_TEXT} />
        <polygon points="444,182 448,190 452,182" className={DIM_TEXT} />
        <text x={458} y={129} fontSize={13} fontStyle="italic" className={DIM_TEXT}>
          l
        </text>

        {/* Dimension x: loop width (grows as the rod slides) */}
        <line
          x1={70}
          y1={198}
          x2={70}
          y2={215}
          strokeWidth={1}
          strokeDasharray="2 2"
          className={DIM_STROKE}
        />
        <line
          x1={310}
          y1={202}
          x2={310}
          y2={215}
          strokeWidth={1}
          strokeDasharray="2 2"
          className={DIM_STROKE}
        />
        <line x1={78} y1={215} x2={302} y2={215} strokeWidth={1} className={DIM_STROKE} />
        <polygon points="78,211 70,215 78,219" className={DIM_TEXT} />
        <polygon points="302,211 310,215 302,219" className={DIM_TEXT} />
        <text x={190} y={232} textAnchor="middle" fontSize={13} fontStyle="italic" className={DIM_TEXT}>
          x
        </text>
      </svg>
      <figcaption className="px-4 py-3">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          The rod on rails: sliding right at v through B (into the page), the rod drives a
          counter-clockwise current I through R — and feels a drag force opposing the pull.
        </p>
      </figcaption>
    </figure>
  );
}
