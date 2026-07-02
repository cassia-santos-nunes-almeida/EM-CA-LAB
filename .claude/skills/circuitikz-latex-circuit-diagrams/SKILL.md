---
name: circuitikz-circuit-diagrams
description: >
  Generate professional circuit diagrams and physical/geometric schematics
  from natural language using CircuiTikZ and TikZ (LaTeX). Use whenever the
  user asks to draw, create, render, or produce a circuit, schematic, or
  diagram — RLC circuits, voltage/current dividers, Thevenin/Norton,
  op-amps, transformers, magnetic circuits, reluctance models, toroid
  cross-sections, switch topologies, filters, s-domain circuits, or any
  electrical/magnetic diagram. Also for TikZ physical drawings like
  magnetic core cross-sections or flux diagrams. Trigger on "draw a
  circuit", "create a schematic", "render this circuit", "CircuiTikZ",
  "LaTeX circuit", or any circuit topology the user wants visualized.
  Enforces: american voltages (+/- in source circles), sources drawn
  top-to-bottom with + on top, ground by default, centered single-component
  branches, mandatory PNG visual-verification before delivery. If a
  notation-conventions skill is installed, load it first so labels match
  the student's textbook.
---

# CircuiTikZ LaTeX Circuit Diagrams

Generate professional circuit diagrams from natural language descriptions using CircuiTikZ (LaTeX) for schematics and TikZ for physical/geometric diagrams (magnetic core cross-sections, flux lines, etc.).

**Target version:** CircuiTikZ v1.8.5 (2026-02-04). All components used are backward-compatible to v1.0+. Check with `\pgfcircversion` if unsure.

## Workflow

### Step 0 — Load notation conventions (if available)

If a course-specific or project-specific notation-conventions skill is
installed (one that pins variable names, sign conventions, and symbol
choices to particular textbooks or style guides), read its SKILL.md
first. The notation choices feed directly into Step 2 (label planning)
and Step 3 (label generation in the .tex file).

If no such skill is available, use the defaults in this skill's Layout
Conventions section.

### Step 1 — Parse the circuit description

Identify components, values, topology, and any switching actions.

### Step 2 — Determine layout

Plan coordinate grid. Vertical source on the left (positive terminal on top) is the default. Sources render with `+` and `-` signs inside the circle (`american voltages` is the default, see Voltage Direction Options below). Check `references/circuit-patterns.md` for reusable topologies.

Before writing any `.tex`, plan label positions explicitly to prevent overlap. See the **Overlap Prevention** section below.

### Step 3 — Generate the .tex file

Create the LaTeX source in `/home/claude/`. Use the conventions below and consult `references/circuitikz-guide.md` for component syntax.

### Step 4 — Compile to SVG and PNG

```bash
SKILL_DIR=/mnt/skills/user/circuitikz-circuit-diagrams
python "$SKILL_DIR/scripts/render_circuitikz.py" diagram.tex
```

The render script produces both `diagram.svg` (final deliverable) and `diagram.png` (for visual verification in Step 4b). If compiling manually:

```bash
cd /home/claude
pdflatex -interaction=nonstopmode -halt-on-error diagram.tex
pdf2svg diagram.pdf diagram.svg
pdftoppm -r 200 -png diagram.pdf diagram  # produces diagram-1.png
```

### Step 4b — Visual verification (mandatory)

Use the `view` tool on the generated PNG. **First, a qualitative pass:** step back and look at the whole image. Does it look like something you would put in a lecture slide? If any region looks crowded, squished, or cramped, fix it even if no single overlap check below fails. For multi-component series branches, also check that components are **evenly distributed vertically** — if one component's span is visibly different from its neighbors, rebalance the spans before re-rendering. A diagram can pass every overlap bullet and still read as "too tight" or "top-heavy" — trust your eye.

Then run the overlap checks:

- Current arrows crossing into component labels (the classic `I_L(s)` + inductor `s` collision)
- Voltage polarity markers (`+`/`-`) clipping into nearby wires or labels
- Adjacent component labels touching each other
- Node labels (`A`, `B`, ...) sitting on top of wires or components
- Text clipped at the SVG border (indicates `border=10pt` too small)

If any overlap is found, **do not deliver**. Adjust coordinates or label sides (see Overlap Prevention section), re-render, and re-inspect. Only proceed to Step 5 when the PNG is visually clean.

### Step 5 — Deliver to user

```bash
cp /home/claude/diagram.svg /mnt/user-data/outputs/diagram.svg
```

Then call `present_files` with the output path. **This step is mandatory** — without it, the user never receives the file.

Optionally also deliver the `.tex` source so the user can edit it later.

## Input Format

Users can describe circuits in natural language:
- "Draw a series RLC circuit with R=100 ohm, L=10mH, C=1uF powered by 12V DC"
- "Create a parallel RLC with a switch that opens at t=0"
- "Show a toroidal core with N turns and an air gap"

## .tex File Structure

```latex
\documentclass[border=10pt]{standalone}
\usepackage[american voltages, american currents]{circuitikz}
\usepackage{amsmath}
\renewcommand{\familydefault}{\sfdefault}  % sans-serif

\begin{document}
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  % Circuit drawing commands here
\end{circuitikz}
\end{document}
```

`american voltages` renders sources with `+` and `-` signs inside the circle — the default style for this skill. Only switch to `RPvoltages`, `EFvoltages`, or `european voltages` if the user explicitly asks.

For physical/geometric diagrams (toroid cross-sections, C-cores), use `\usepackage{tikz}` instead.

## Layout Conventions

- **Vertical layout preferred**: Power source on left (vertical, positive terminal on top), components arranged vertically on right side
- **Sans-serif fonts**: `\sffamily` throughout, `\renewcommand{\familydefault}{\sfdefault}`
- **Voltage direction**: `american voltages` by default — sources render with `+` and `-` signs inside the circle. Switch to `RPvoltages` or `european voltages` only on explicit request. See Voltage Direction Options section.
- **Ground by default**: Connect a ground symbol (`node[ground]{}`) to the bottom rail of every circuit unless the user explicitly says to omit it or the topology is clearly groundless (e.g., isolated floating two-port, transformer secondary, differential pair). Place at the reference node — typically the bottom of the voltage source or the shared return rail. When in doubt, add the ground; do not ask.
- **Center components in their branch by default**: When a branch has a single component spanning between two rails, center the component with equal wire stubs above and below (or left and right for horizontal branches). Use the pattern `start -- stub_top to[component] stub_bottom -- end`. Exception: when a component is conceptually tied to one end (e.g., a base resistor at a transistor base, a coupling capacitor at a port), leave it anchored there. When in doubt, center.
- **Line width**: `line width=0.8pt`
- **Border**: `\documentclass[border=10pt]{standalone}` — without border, labels get clipped at SVG edges
- **Explicit markings**: Current arrows and voltage polarity markings on every circuit
- **High-contrast**: Black lines on white background
- **Adequate spacing**: Leave at least 2 coordinate units between parallel vertical branches so labels don't overlap
- **Minimum component span**: Any component carrying both a value label (`l=`) and a voltage annotation (`v=`) needs at least **1.5 coordinate units** of span. Below that, the `+`/`-` polarity markers collide with the label and the component name. If a branch is shorter than 1.5 units, either extend it or move one annotation to an adjacent wire.
- **Current arrow placement**: Putting `i>^=` directly on a short component places the arrow label in the narrow gap between the top wire and the component body, where it looks cramped even when no single element overlaps. Preferred pattern: put the current arrow on an adjacent `short` wire (horizontal top wire is usually best) using `to[short, i^=$i(t)$]`. Only place the arrow on the component itself when the component span is ≥2 units and no other annotation competes for the label side.
- **Even vertical distribution in a series branch**: When multiple components (R, L, C, or any combination) sit in a single vertical branch between the top and bottom rails, give **every component the same vertical span**. Uneven spans — e.g. R and L at 1.5 units each but C at 2.5 units — create a visibly top-heavy or bottom-heavy branch even though no individual component looks wrong. Pick a single span value (2 units works well for components carrying both `l=` and `v=`) and divide the rail height into equal slots.

## Voltage Direction Options

The package supports four voltage direction conventions. **Default for this skill: `american voltages`** (sources show `+` and `-` inside the circle). Only switch if the user explicitly asks.

| Option | Meaning | When to use |
|--------|---------|-------------|
| `american voltages` | `+` and `-` signs inside source circle | **Default.** Traditional American textbook style. |
| `RPvoltages` | Rising Potential — arrow in direction of rising potential, batteries fixed | Passive sign convention. Use if explicitly requested. |
| `EFvoltages` | Electric Field — arrow in direction of electric field, batteries fixed | Alternative to RP, follows E-field convention. |
| `european voltages` | Uses arrows | Traditional European style. Use if explicitly requested. |

Avoid the no-option default (`nooldvoltagedirection`) — it can produce wrong battery polarity.

```latex
\usepackage[american voltages, american currents]{circuitikz}
```

### Source polarity gotcha

With `american voltages`, the `+` sign sits at the **start** of the `to[]` direction and the `-` at the **end**. This matters for vertical sources:

```latex
% WRONG — + ends up at the BOTTOM (layout convention wants + on top)
\draw (0,0) to[V, v=$V_s$] (0,4);

% CORRECT — draw top-to-bottom so + is on top
\draw (0,4) to[V, v_=$V_s$] (0,0);
```

Use `v_=` (underscore) on top-to-bottom vertical sources so the voltage label sits on the left (outside the circuit), not the right (where it would collide with internal wiring).

**Do not reach for `invert` to fix polarity.** The `invert` keyword flips the source's + and − relative to the `to[]` path, so it interacts with drawing direction in confusing ways. If you draw a branch top-to-bottom, `to[V, invert]` puts `+` at the bottom, which is the opposite of our convention. Following the top-to-bottom rule above gives `+` on top **without** `invert` and **without** any special keyword — use `invert` only when you explicitly need `+` at the far end of the `to[]` path (rare case: a source deliberately wired in reverse polarity, labeled as such in the circuit). For normal sources, just get the drawing direction right.

Always verify polarity in the Step 4b PNG check — this bug is easy to miss in code review but obvious once rendered.

## Overlap Prevention

Text, arrows, polarity markers, and component bodies collide easily when coordinates are chosen carelessly. Apply these rules **while writing the `.tex`**, not as an afterthought.

### Spacing rules

- Minimum **2 coordinate units** between parallel vertical branches.
- Increase to **2.5–3 units** when a branch carries both a voltage label AND a current arrow, or when two adjacent branches both carry labels on their facing sides.
- Minimum **3 units** for any branch-length segment that contains two or more components stacked vertically with labels.
- Leave at least **0.5 units** between a component's end and the nearest junction dot or node label.
- **Double-labeled bipoles need length**: a single component that carries both a component label (e.g., `sL`, `R_1`) AND a current label (`i_=$i(t)$`) needs **at least 2 coordinate units** of length so the two labels don't overlap each other. 1.5 units is the cramped floor; 2 is clean. Worked example: an inductor with both `sL` (s-domain impedance) on one side and `I_L(s)` (current) on the other should span 2 units vertically or horizontally.

### Label-side rules (the main collision cause)

Every bipole has two label sides. The default side (`l=`, `v=`, `i=`) is above/right for horizontal components and right for vertical. The underscore form (`l_=`, `v_=`, `i_=`) flips to the opposite side.

- **If a branch has both a component label and a current arrow**, put them on opposite sides: `to[L, l=$L$, i_=$i_L(s)$]` (label right, arrow left) or the reverse. The `I_L(s)` + inductor collision in the reference example was caused by putting label and arrow on the same side.
- **If two adjacent parallel branches both have right-side labels**, flip the left branch to `l_=` so labels face outward, not toward each other.
- **Voltage polarity on sources** (`american voltages` draws `+`/`-` inside the circle) — keep at least 1 unit of wire between the source and any other labeled element so the internal markers have clearance.

### Complex labels get their own `\node`

When a label contains fractions, multi-line math, or more than ~10 characters, don't use `l=`. Place an explicit `\node` with `xshift`/`yshift`:

```latex
\draw (3,2) to[L] (3,0);
\node[right, xshift=8pt] at (3,1) {$i_L(s)$};
\draw[->, >=stealth] (3.3,1.2) -- (3.3,0.8);  % explicit current arrow, positioned to clear the label
```

This gives full control over placement and eliminates the key-value parser's auto-positioning.

### Node labels (A, B, v_o, ...)

When labeling a circuit node on a wire, use `above`, `below`, `above right`, etc. with explicit offset, and check the node isn't sitting on another wire:

```latex
\node[above, yshift=3pt] at (3,3) {A};  % clears the horizontal wire at y=3
```

### Checklist before rendering

Mentally walk the circuit once before compiling:

1. List every label in the diagram (component labels, voltage labels, current arrows, node labels, source polarity).
2. For each pair of labels within 1.5 units of each other, verify they're on opposite sides or have explicit `xshift`/`yshift`.
3. Confirm `border=10pt` gives enough margin for outermost labels.

Step 4b (the PNG visual check) catches what this pass misses, but prevention is faster than iteration.

## Key CircuiTikZ Components

### Passive components

| Component | Syntax |
|-----------|--------|
| Resistor | `to[R, l=$R$]` |
| Inductor | `to[L, l=$L$]` |
| Capacitor | `to[C, l=$C$]` |
| Polar Capacitor | `to[eC, l=$C$]` |
| Fuse | `to[fuse, l=$F$]` |
| Short circuit | `to[short]` |
| Open circuit | `to[open, v^=$v(t)$]` |

### Sources

| Component | Syntax |
|-----------|--------|
| DC Voltage source | `to[V, v=$V_s$]` |
| AC Voltage source | `to[sinusoidal voltage source, v=$V_s$]` |
| Current source | `to[I, l=$I_s$]` |
| Battery (single cell) | `to[battery1, v=$9V$]` |
| Battery (multi-cell) | `to[battery, v=$9V$]` |
| Controlled voltage (diamond) | `to[cV, v=$\alpha v_x$]` |
| Controlled current (diamond) | `to[cI, l=$\beta i_x$]` |

### Switches

| Component | Syntax |
|-----------|--------|
| SPST switch (opening) | `to[opening switch, l=$t{=}0$]` |
| SPST switch (closing) | `to[closing switch, l=$t{=}0$]` |
| Normal open | `to[nos]` |
| Normal closed | `to[ncs]` |

### Grounds and power supplies (node-style)

| Component | Syntax | Notes |
|-----------|--------|-------|
| Ground | `node[ground]{}` | Standard ground symbol |
| Reference ground | `node[rground]{}` | Triangle ground |
| Signal ground | `node[sground]{}` | Fillable |
| European ground | `node[eground]{}` | Three horizontal lines |
| Chassis ground | `node[cground]{}` | Chassis/frame |
| VCC/VDD | `node[vcc]{VCC}` | Power supply up arrow |
| VEE/VSS | `node[vee]{VEE}` | Power supply down arrow |

### Diodes

| Component | Syntax |
|-----------|--------|
| Diode | `to[D, l=$D$]` |
| Zener diode | `to[zD]` |
| LED | `to[leD]` |
| Photodiode | `to[pD]` |
| Schottky diode | `to[sD]` |
| TVS diode | `to[tvsD]` |
| Thyristor | `to[Ty]` |
| Triac | `to[Tr]` |

Use `full diode` / `empty diode` / `stroke diode` for explicit fill styles, or set globally with `fulldiode`, `emptydiode`, `strokediode` package options.

### Transistors (node-style)

| Component | Syntax | Anchors |
|-----------|--------|---------|
| NPN BJT | `node[npn](Q){Q}` | B (base), C (collector), E (emitter) |
| PNP BJT | `node[pnp](Q){}` | B, C, E |
| N-channel MOSFET | `node[nmos](Q){Q}` | G (gate), D (drain), S (source) |
| P-channel MOSFET | `node[pmos](Q){}` | G, D, S |
| N-IGBT | `node[nigbt](Q){Q}` | G, D (collector), S (emitter) |
| P-IGBT | `node[pigbt](Q){}` | G, D, S |

### Op-amps (node-style)

| Component | Syntax | Anchors |
|-----------|--------|---------|
| Op-amp | `node[op amp](A){}` | + (non-inv), - (inv), out, up, down |

Op-amp example with power rails:

```latex
\node[op amp](A) at (0,0) {};
\draw (A.up) -- ++(0,0.3) node[vcc]{\SI{+10}{V}};
\draw (A.down) -- ++(0,-0.3) node[vee]{\SI{-10}{V}};
```

### Instruments

| Component | Syntax |
|-----------|--------|
| Voltmeter | `to[voltmeter]` or `to[vmeter]` |
| Ammeter | `to[ammeter]` or `to[ameter]` |
| Ohmmeter | `to[ohmmeter]` or `to[ometer]` |

### Labels and arrows

| Annotation | Syntax |
|-----------|--------|
| Voltage label | `v=$v_C$` or `v^=$v_o(t)$` |
| Current arrow | `i>^=$\Phi$` |
| Junction dot | `\fill (x,y) circle (2pt);` |

## Switch Conventions

- **Element name = action at t=0**: `opening switch` = was closed, now opening (breaking contact). `closing switch` = was open, now closing (making contact). Don't confuse the element name with the state *before* t=0.
- **Name every switch**: Label with `\textit{SW1}`, `\textit{SW2}`, etc. using a `\node` below the switch element.
- **Label the action**: Show `t{=}0` and `(opens)` or `(closes)` above each switch.
- Use `\shortstack` for multi-line switch labels.

## Complex Math Labels (Important)

CircuiTikZ's `l=` parameter doesn't handle `\dfrac` well — causes "Extra \endgroup" errors. For labels with fractions, use separate `\node` elements:

```latex
\draw (6,4) to[R] (6,2);
\node[right, xshift=6pt] at (6,3) {$\mathcal{R} = \dfrac{\ell}{\mu_r \mu_0 A}$};
```

## Equals Signs Inside Labels (Common Gotcha)

If a label value contains `=`, CircuiTikZ's key-value parser breaks. **Wrap the entire value in braces**:

```latex
% WRONG — parser sees two = signs and chokes
to[V, v=$\mathcal{F} = NI$]

% CORRECT — braces protect the content
to[V, v={$\mathcal{F} = NI$}]
```

This applies to `l=`, `v=`, and `i=` parameters. Safe rule: if the label contains `=`, always brace it.

## Multi-line Labels

Use `\shortstack` for multi-line component labels:

```latex
to[opening switch, l={\shortstack{$t{=}0$\\(opens)}}]
```

## Label Positioning

- `l=$R$` — label above/right (default position)
- `l_=$R$` — label below/left (opposite side)
- `v=$v_C$` — voltage label (+ at start, - at end)
- `v^=$v_C$` — voltage label (reversed polarity)
- `i=$i$` — current arrow along component
- `i>^=$\Phi$` — current arrow with explicit direction

## Physical/Geometric Diagrams (TikZ)

For non-circuit diagrams (toroid cross-sections, C-cores):

```latex
\documentclass[border=10pt]{standalone}
\usepackage{tikz}
\usepackage{amsmath}
\renewcommand{\familydefault}{\sfdefault}

\begin{document}
\begin{tikzpicture}[every node/.style={font=\sffamily}, >=stealth]
  \fill[gray!40, draw=black] ...  % Core material
  \draw[->, red!70!black, thick] ...  % Flux arrows
\end{tikzpicture}
\end{document}
```

- **Flux arrows**: `red!70!black` color for magnetic flux
- **Core material**: `gray!40` fill for ferromagnetic cores

## Compilation

```bash
SKILL_DIR=/mnt/skills/user/circuitikz-circuit-diagrams

# Single file
python "$SKILL_DIR/scripts/render_circuitikz.py" diagram.tex [output.svg]

# Batch (all .tex in a directory)
python "$SKILL_DIR/scripts/render_circuitikz.py" --all directory/
```

**System dependencies:** `texlive-latex-base`, `texlive-pictures`, `texlive-latex-recommended`, `texlive-latex-extra`, `pdf2svg`

Install on Debian/Ubuntu:
```bash
apt-get install -y texlive-latex-base texlive-pictures texlive-latex-recommended texlive-latex-extra pdf2svg
```

## Output and Delivery

- **Format**: SVG (compiled from PDF via pdf2svg)
- **Working directory**: `/home/claude/` for .tex and intermediate files
- **Output directory**: Copy final `.svg` (and optionally `.tex`) to `/mnt/user-data/outputs/`
- **Present to user**: Always call `present_files` with the output path(s)

## Diagram Types

| Type | Tool | Notes |
|------|------|-------|
| Circuit schematics | CircuiTikZ (`.tex`) | Use circuit-patterns.md templates |
| Magnetic core cross-sections | TikZ (`.tex`) | Use `\usepackage{tikz}` instead of circuitikz |
| Physical/geometric drawings | TikZ (`.tex`) | Toroid windings, field lines, etc. |
| Flowcharts / decision trees | TikZ (`.tex`) | Rounded rectangles, diamonds, arrows |

## Multi-Switch Topologies

When a circuit has multiple switches (e.g., 4-switch source-free RLC):

**Diagram rules:**
- **Name every switch** (SW1, SW2, ...) with an italic `\textit{}` label below each switch element.
- **Label the action** above each switch: `t{=}0` `(opens)` or `(closes)`.
- Use CircuiTikZ's native `opening switch` / `closing switch` elements.
- **Leave enough horizontal space** between adjacent vertical components so polarity/voltage labels don't overlap.

**Design pattern (4-switch source-free RLC):**
- SW1, SW4 closed at `t < 0` → connect energy sources to L and C for DC charging.
- SW2, SW3 open at `t < 0` → isolate the middle RLC section.
- At `t = 0`, all switches change state → sources disconnect, forming a source-free parallel RLC.

## Tips for Clean Layouts

1. **Coordinate-based drawing**: Plan layout on paper first, use explicit (x,y) coordinates.
2. **Consistent spacing**: Use integer or half-integer coordinates for alignment.
3. **Junction dots**: Always add `\fill (x,y) circle (2pt)` at parallel branch junctions.
4. **Node labels**: Use `\node[position]` for complex labels instead of `l=` parameter.
5. **Overlap prevention**: See the Overlap Prevention section for spacing minimums and label-side rules.
6. **Centering pattern**: For a branch between rails at `y_top` and `y_bot`, center a 1.5-unit component like this:
   ```latex
   % Branch from y=5 down to y=0, component centered at y=2.5
   \draw (x, 5) -- (x, 3.25) to[R, l=$R$] (x, 1.75) -- (x, 0);
   ```
   Pick stub lengths so `(y_top - stub_top - y_bot - stub_bot) = component_length`. Half-integer coordinates keep everything aligned.
7. **Always verify visually**: Step 4b (view the PNG) is mandatory, not optional.

## Reference Files

- `references/circuitikz-guide.md` — Component syntax, labels, semiconductors, styling
- `references/circuit-patterns.md` — 10 reusable topology templates (series/parallel RLC, dividers, Thevenin/Norton, transformers, magnetic circuits)
- `scripts/render_circuitikz.py` — Compilation script (.tex to .svg) with auto-install and batch mode
- `templates/circuitikz_template.tex` — Starter template for new diagrams
