# CircuiTikZ Component Reference

Tested against CircuiTikZ v1.8.5 (2026-02-04). American style conventions.

---

## Package Setup

```latex
\usepackage[american voltages, american currents]{circuitikz}
```

**Voltage direction options (pick one — default for this skill is `american voltages`):**
- `american voltages` -- `+` and `-` signs inside the source circle. **Default.** Traditional American textbook.
- `RPvoltages` -- Rising Potential. Arrow points in direction of rising potential, batteries and current sources fixed. Use if explicitly requested.
- `EFvoltages` -- Electric Field. Arrow in direction of electric field, batteries fixed.
- `european voltages` -- Uses arrows (traditional European). Use if explicitly requested.

**Other key options:**
- `american currents` / `european currents` -- current source style
- `american` -- shorthand for all American styles (resistors, inductors, ports, voltages, currents)
- `european` -- shorthand for all European styles
- `siunitx` -- integrates with siunitx package so `l=$10\,\si{\ohm}$` renders correctly
- `smartlabels` -- labels rotate along the bipole (useful for diagonal components)

---

## Resistive Bipoles

| Component | Syntax | Notes |
|-----------|--------|-------|
| Resistor (zigzag) | `to[R, l=$R$]` | American style default |
| Resistor (box/European) | `to[R, european]` | Or set globally |
| Inductor | `to[L, l=$L$]` | American coil symbol |
| Capacitor | `to[C, l=$C$]` | Two parallel lines |
| Polar capacitor | `to[eC, l=$C$]` | Electrolytic, curved plate |
| Variable resistor | `to[vR, l=$R$]` | Arrow through resistor |
| Potentiometer | `to[pR, l=$R$]` | Three-terminal |
| Fuse | `to[fuse, l=$F$]` | |
| Generic bipole | `to[generic]` | Rectangular box |
| Short circuit | `to[short]` | Wire connection |
| Open circuit | `to[open, v^=$v$]` | Gap (useful for voltage labels) |

---

## Sources

| Component | Syntax | Notes |
|-----------|--------|-------|
| DC voltage | `to[V, v=$V_s$]` | Circle with +/- |
| AC voltage | `to[sinusoidal voltage source, v=$V_s$]` | Circle with sine wave |
| Sinusoidal current | `to[sinusoidal current source, l=$I_s$]` | Circle with sine wave |
| DC current | `to[I, l=$I_s$]` | Circle with arrow |
| Battery (single cell) | `to[battery1, v=$9\,\text{V}$]` | Thin lines |
| Battery (multi-cell) | `to[battery, v=$9\,\text{V}$]` | Stacked cells |
| Controlled voltage | `to[cV, v=$\alpha v_x$]` | Diamond shape (dependent source) |
| Controlled current | `to[cI, l=$\beta i_x$]` | Diamond shape (dependent source) |
| Controlled sinusoidal V | `to[controlled sinusoidal voltage source]` | Diamond with sine |
| Noise voltage source | `to[noise voltage source]` | Gray-filled circle |

---

## Switches

| Component | Syntax | Meaning at t=0 |
|-----------|--------|----------------|
| Opening switch | `to[opening switch]` | Was closed, now opens |
| Closing switch | `to[closing switch]` | Was open, now closes |
| Normal open | `to[nos]` | Open contact |
| Normal closed | `to[ncs]` | Closed contact |

**Convention:** The element name describes the *action*, not the state before t=0.

Multi-line switch label:
```latex
to[opening switch, l={\shortstack{$t{=}0$\\(opens)}}]
```

---

## Labels and Annotations

### Component Labels

| Syntax | Position |
|--------|----------|
| `l=$R$` | Default side (above/right for horizontal, right for vertical) |
| `l_=$R$` | Opposite side |

### Voltage Labels

| Syntax | Polarity |
|--------|----------|
| `v=$v_C$` | + at start node, - at end node |
| `v^=$v_C$` | Reversed: + at end, - at start |
| `v_=$v_C$` | Opposite side placement |

### Current Arrows

| Syntax | Direction |
|--------|-----------|
| `i=$i$` | Along component, default direction |
| `i>=$i$` | Explicit rightward/downward |
| `i<=$i$` | Explicit leftward/upward |
| `i>^=$i$` | Arrow with label on opposite side |

---

## Wires and Connections

| Element | Syntax |
|---------|--------|
| Plain wire | `to[short]` or `--` |
| Wire with current | `to[short, i=$i$]` |
| Open circuit | `to[open, v^=$v$]` |
| Short circuit | `to[short]` |
| Junction dot | `\fill (x,y) circle (2pt);` |

---

## Grounds and Power Supplies (node-style)

Place with `\draw (x,y) node[type]{label};` or at the end of a path.

| Component | Syntax | Notes |
|-----------|--------|-------|
| Ground (standard) | `node[ground]{}` | Three horizontal lines |
| Reference ground | `node[rground]{}` | Triangle |
| Signal ground | `node[sground]{}` | Fillable triangle |
| Tailless ground | `node[tlground]{}` | Single line |
| European ground | `node[eground]{}` | Declining lines |
| Chassis ground | `node[cground]{}` | Chassis/frame symbol |
| Noiseless ground | `node[nground]{}` | |
| Protective ground | `node[pground]{}` | Circle with lines |
| VCC/VDD | `node[vcc]{VCC}` | Upward arrow |
| VEE/VSS | `node[vee]{VEE}` | Downward arrow |

Example -- op-amp with power rails:

```latex
\draw (A.up) -- ++(0,0.3) node[vcc]{$+10\,\text{V}$};
\draw (A.down) -- ++(0,-0.3) node[vee]{$-10\,\text{V}$};
\draw (output) -- ++(0,-1) node[ground]{};
```

---

## Diodes

Three fill styles: `empty` (default, fillable), `full` (solid), `stroke` (line through).
Set globally with `fulldiode`, `emptydiode`, or `strokediode` package option.

| Component | Syntax | Aliases |
|-----------|--------|---------|
| Diode | `to[D, l=$D$]` | `empty diode` |
| Schottky diode | `to[sD]` | `empty Schottky diode` |
| Zener diode | `to[zD]` | `empty Zener diode` |
| LED | `to[leD]` | `empty led` |
| Photodiode | `to[pD]` | `empty photodiode` |
| TVS diode | `to[tvsD]` | `empty TVS diode` |
| Varicap | `to[VCo]` | `empty varcap` |
| Full diode | `to[D*]` | Solid fill |
| Full Zener | `to[zD*]` | Solid fill |
| Full LED | `to[leD*]` | Solid fill |

### Thyristors (tripole-like diodes)

| Component | Syntax | Anchors |
|-----------|--------|---------|
| Thyristor | `to[Ty]` | anode, cathode, gate |
| Triac | `to[Tr]` | anode, cathode, gate |
| PUT | `to[PUT]` | anode, cathode, gate |

---

## Transistors (node-style)

Place with `\node[type](name){label} at (x,y) {};` then connect anchors.

### BJTs

| Component | Syntax | Anchors |
|-----------|--------|---------|
| NPN | `node[npn](Q1){Q}` | B (base), C (collector), E (emitter) |
| PNP | `node[pnp](Q1){}` | B, C, E |
| NPN with body diode | `node[npn, bodydiode](Q1){}` | B, C, E, body C in/out, body E in/out |
| Photo NPN | `node[npn, photo](Q1){}` | B, C, E |

### FETs

| Component | Syntax | Anchors |
|-----------|--------|---------|
| N-MOSFET | `node[nmos](M1){Q}` | G (gate), D (drain), S (source) |
| P-MOSFET | `node[pmos](M1){}` | G, D, S |
| N-MOSFET depletion | `node[nmosd](M1){}` | G, D, S |
| P-MOSFET depletion | `node[pmosd](M1){}` | G, D, S |
| HEMT | `node[hemt](M1){}` | G, D, S |

### IGBTs

| Component | Syntax | Anchors |
|-----------|--------|---------|
| N-IGBT | `node[nigbt](Q1){Q}` | G, D (collector), S (emitter) |
| P-IGBT | `node[pigbt](Q1){}` | G, D, S |

### Transistor connection example

```latex
\node[npn](Q1) at (3,2) {$Q_1$};
\draw (Q1.B) -- ++(-1,0) node[left]{$v_{in}$};
\draw (Q1.C) -- ++(0,1) node[vcc]{VCC};
\draw (Q1.E) -- ++(0,-1) node[ground]{};
```

---

## Op-amps (node-style)

| Component | Syntax | Anchors |
|-----------|--------|---------|
| Op-amp | `node[op amp](A){}` | + (non-inv), - (inv), out, up, down |

Scale with `scale=0.6` in `\begin{circuitikz}` options and add `transform shape`.

```latex
\begin{circuitikz}[baseline=(vo.center), scale=0.6, transform shape]
  \node[op amp](A) at (0,0) {};
  \draw (A.+) -- ++(-0.5,0) node[left]{$v_+$};
  \draw (A.-) -- ++(-0.5,0) node[left]{$v_-$};
  \draw (A.out) -- ++(0.5,0) node[right](vo){$v_o$};
\end{circuitikz}
```

---

## Instruments

| Component | Syntax | Notes |
|-----------|--------|-------|
| Voltmeter (legacy) | `to[voltmeter]` | Circle with V |
| Ammeter (legacy) | `to[ammeter]` | Circle with A |
| Ohmmeter (legacy) | `to[ohmmeter]` | Circle with omega |
| Round meter (new) | `to[rmeter, t=V]` | Configurable symbol |
| Round meter + arrow | `to[rmeterwa, t=A]` | With direction arrow |
| Square meter | `to[smeter, t=V]` | Square instrument |

New style (recommended):

```latex
\tikzset{vmeter/.style={rmeterwa, t=V}}
\tikzset{ameter/.style={rmeterwa, t=A}}
```

---

## Complex Labels Workaround

CircuiTikZ's `l=` chokes on `\dfrac`. Use a separate `\node`:

```latex
\draw (6,4) to[R] (6,2);
\node[right, xshift=6pt] at (6,3) {$\mathcal{R} = \dfrac{\ell}{\mu_r \mu_0 A}$};
```

This also works for any multi-line or complex math that breaks inside `l=`.

## Equals Signs Inside Labels

If a label value contains `=`, the key-value parser breaks. **Wrap in braces**:

```latex
% WRONG
to[V, v=$V = IR$]

% CORRECT
to[V, v={$V = IR$}]
```

Applies to `l=`, `v=`, `i=` parameters. Rule: if the label has `=`, brace it.

---

## Coordinate and Layout Tips

1. **Grid-based:** Use integer or half-integer coordinates for alignment.
2. **Vertical source:** Place voltage source on the left, positive terminal on top.
3. **Adequate spacing:** Leave at least 2 units between parallel vertical branches so labels don't overlap.
4. **Named coordinates:** Use `coordinate(name)` for reuse:
   ```latex
   \draw (0,3) to[R, l=$R$] (3,3) coordinate(A);
   \draw (A) to[L, l=$L$] (A |- 0,0);
   ```
5. **Relative positioning:** `++(dx,dy)` moves from current position, `+(dx,dy)` is relative but doesn't update position.

---

## Color and Style

```latex
% Colored component
\draw[red] (0,0) to[R, l=$R$, color=red] (3,0);

% Thick wire
\draw[line width=1.5pt] (0,0) -- (3,0);

% Dashed wire
\draw[dashed] (0,0) -- (3,0);

% Annotation arrow
\draw[->, thick, blue] (2,1) -- (2,2) node[above]{$\vec{B}$};
```

---

## Units in Labels

Use `\,` thin space before unit text:

```latex
l=$R = 100\,\Omega$
l=$C = 10\,\mu\text{F}$
l=$L = 5\,\text{mH}$
v=$V_s = 12\,\text{V}$
```

---

## Version Notes

- **v1.8.5 (2026-02-04):** Current version. Experimental automatic advanced voltages/currents/flows.
- **v1.2.0+:** Voltage arrows, symbols, and label positions recalculated. Minor label adjustments may be needed for older documents.
- **v1.0+:** `RPvoltages` and `EFvoltages` options available. This skill defaults to `american voltages` for source `+`/`-` markers.
- **v0.9.4+:** Styling of circuits concept introduced. Use `\ctikzset{}` for component-level customization.
- **v0.9.0+:** Voltage direction rationalized. Legacy `american voltages` and `european voltages` kept for backward compatibility.

**Version rollback:** If you need an older version, use LaTeX kernel rollback:

```latex
\usepackage[]{circuitikz}[=v0.8.3]  % or v0.4, v0.6, etc.
```

If you encounter unknown component errors, check `\pgfcircversion` in your TeX installation.
