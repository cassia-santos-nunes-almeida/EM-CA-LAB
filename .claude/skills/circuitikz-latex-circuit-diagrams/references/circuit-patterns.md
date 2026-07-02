# Circuit Patterns — Reusable CircuiTikZ Templates

Tested against CircuiTikZ v1.8.5 (2026-02-04). All patterns follow the project conventions in SKILL.md: `american voltages` (+/− in source circle), sources drawn top-to-bottom so + is on top, ground at the reference node by default, single-component branches centered with wire stubs.

---

## 1. Series RLC (DC source, switch at t=0)

Classic second-order transient. Switch opens at t=0 (was closed for t<0).

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,4) to[V, v_=$V_s$] (0,0);
  \draw (0,4) to[opening switch, l={\shortstack{$t{=}0$\\(opens)}}] (3,4)
        to[R, l=$R$, i=$i(t)$] (6,4)
        to[L, l=$L$, v=$v_L$] (6,2)
        to[C, l=$C$, v=$v_C$] (6,0) -- (0,0);
  \draw (0,0) node[ground]{};
  \fill (0,0) circle (2pt);
  \fill (0,4) circle (2pt);
\end{circuitikz}
```

---

## 2. Parallel RLC (Current source)

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,0) to[I, l=$I_s$, i=$i_s$] (0,3);
  \draw (0,3) -- (6,3);
  \draw (0,0) -- (6,0);
  \draw (2,3) -- (2,2.25) to[R, l=$R$, i>^=$i_R$] (2,0.75) -- (2,0);
  \draw (4,3) -- (4,2.25) to[L, l=$L$, i>^=$i_L$] (4,0.75) -- (4,0);
  \draw (6,3) -- (6,2.25) to[C, l=$C$, i>^=$i_C$, v=$v(t)$] (6,0.75) -- (6,0);
  \draw (0,0) node[ground]{};
  \fill (0,0) circle (2pt); \fill (0,3) circle (2pt);
  \fill (2,0) circle (2pt); \fill (2,3) circle (2pt);
  \fill (4,0) circle (2pt); \fill (4,3) circle (2pt);
  \fill (6,0) circle (2pt); \fill (6,3) circle (2pt);
\end{circuitikz}
```

---

## 3. First-Order RC (DC source, switch closes at t=0)

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,3) to[V, v_=$V_s$] (0,0);
  \draw (0,3) to[closing switch, l={\shortstack{$t{=}0$\\(closes)}}] (3,3);
  \draw (3,3) -- (3,2.25) to[R, l=$R$, i=$i(t)$] (3,0.75) -- (3,0);
  \draw (3,0) -- (0,0);
  \draw (3,3) -- (6,3);
  \draw (6,3) -- (6,2.25) to[C, l=$C$, v=$v_C(t)$] (6,0.75) -- (6,0);
  \draw (6,0) -- (3,0);
  \draw (0,0) node[ground]{};
  \fill (3,3) circle (2pt);
  \fill (3,0) circle (2pt);
\end{circuitikz}
```

---

## 4. First-Order RL (DC source, switch opens at t=0)

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,3) to[V, v_=$V_s$] (0,0);
  \draw (0,3) to[opening switch, l={\shortstack{$t{=}0$\\(opens)}}] (3,3);
  \draw (3,3) -- (3,2.25) to[R, l=$R$, i=$i(t)$] (3,0.75) -- (3,0);
  \draw (3,0) -- (0,0);
  \draw (3,3) -- (6,3);
  \draw (6,3) -- (6,2.25) to[L, l=$L$, v=$v_L(t)$] (6,0.75) -- (6,0);
  \draw (6,0) -- (3,0);
  \draw (0,0) node[ground]{};
  \fill (3,3) circle (2pt);
  \fill (3,0) circle (2pt);
\end{circuitikz}
```

---

## 5. Voltage Divider

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,4) to[V, v_=$V_s$] (0,0);
  \draw (0,4) to[R, l=$R_1$, i=$i$] (3,4);
  \draw (3,4) -- (3,2.75) to[R, l=$R_2$, v=$v_o$] (3,1.25) -- (3,0);
  \draw (3,0) -- (0,0);
  \draw (3,4) -- (5,4);
  \draw (3,0) -- (5,0);
  \draw (5,4) to[open, v^=$v_o$] (5,0);
  \draw (0,0) node[ground]{};
  \fill (3,4) circle (2pt);
  \fill (3,0) circle (2pt);
\end{circuitikz}
```

---

## 6. Current Divider

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,0) to[I, l=$I_s$, i=$i_s$] (0,3) -- (4,3);
  \draw (0,0) -- (4,0);
  \draw (2,3) -- (2,2.25) to[R, l=$R_1$, i>^=$i_1$] (2,0.75) -- (2,0);
  \draw (4,3) -- (4,2.25) to[R, l=$R_2$, i>^=$i_2$] (4,0.75) -- (4,0);
  \draw (0,0) node[ground]{};
  \fill (2,3) circle (2pt); \fill (2,0) circle (2pt);
  \fill (4,3) circle (2pt); \fill (4,0) circle (2pt);
\end{circuitikz}
```

---

## 7. Op-Amp Inverting Amplifier

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,0) node[left]{$v_{in}$}
        to[R, l=$R_1$, o-] (3,0)
        -- (3,0) node[op amp, anchor=-](OA){}
        (OA.out) node[right]{$v_{out}$};
  \draw (3,0) -- ++(0,1.5) to[R, l=$R_f$] (OA.out |- 0,1.5) -- (OA.out);
  \draw (OA.+) -- ++(0,-0.5) node[ground]{};
\end{circuitikz}
```

**Note:** Op-amp patterns need careful anchor management. Test-compile before extending. Ground at the `+` input is the standard reference for inverting amplifiers.

---

## 8. Mutual Inductance / Ideal Transformer

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  % Primary with ground
  \draw (0,3) to[V, v_=$V_1$] (0,0);
  \draw (0,3) to[R, l=$R_1$, i=$i_1$] (3,3)
        to[L, l=$L_1$] (3,0) -- (0,0);
  % Coupling dots
  \node at (3.3,2.7) {$\bullet$};
  \node at (4.7,2.7) {$\bullet$};
  % Core lines
  \draw[thick] (3.8,0.3) -- (3.8,2.9);
  \draw[thick] (4.2,0.3) -- (4.2,2.9);
  % Secondary (floating — transformer secondary is groundless by convention)
  \draw (5,3) to[L, l=$L_2$] (5,0);
  \draw (5,3) to[short, i=$i_2$] (7,3) to[R, l=$R_L$, v=$v_o$] (7,0) -- (5,0);
  \draw (0,0) node[ground]{};
  \node at (4,3.5) {$M$};
\end{circuitikz}
```

**Note:** Transformer secondaries are typically groundless (isolation is the point). Ground the primary only, unless the schematic explicitly shows a secondary reference.

---

## 9. Magnetic Circuit (Reluctance Model)

Uses the circuit analogy: MMF source, reluctance elements, flux "current."

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,3) to[V, v_={$\mathcal{F} = NI$}] (0,0);
  \draw (0,3) -- (3,3);
  \draw (3,3) -- (3,2.25) to[R, i>^=$\Phi$] (3,0.75) -- (3,0);
  \draw (3,0) -- (0,0);
  \node[right, xshift=6pt] at (3,1.5) {$\mathcal{R}_{\text{core}} = \dfrac{\ell}{\mu_r \mu_0 A}$};
  \draw (3,3) -- (6,3);
  \draw (6,3) -- (6,2.25) to[R] (6,0.75) -- (6,0);
  \draw (6,0) -- (3,0);
  \node[right, xshift=6pt] at (6,1.5) {$\mathcal{R}_{\text{gap}} = \dfrac{g}{\mu_0 A}$};
  \draw (0,0) node[ground]{};
  \fill (3,3) circle (2pt);
  \fill (3,0) circle (2pt);
\end{circuitikz}
```

**Note:** Uses the `\dfrac`-in-a-`\node` workaround documented in SKILL.md.

---

## 10. Thevenin / Norton Equivalent

### Thevenin

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,3) to[V, v_=$V_{Th}$] (0,0);
  \draw (0,3) to[R, l=$R_{Th}$, i=$i$] (3,3) -- (4,3);
  \draw (0,0) -- (4,0);
  \draw (4,3) to[open, v^=$v_{ab}$] (4,0);
  \draw (0,0) node[ground]{};
  \node[right] at (4,3) {$a$};
  \node[right] at (4,0) {$b$};
\end{circuitikz}
```

### Norton

```latex
\begin{circuitikz}[line width=0.8pt, every node/.style={font=\sffamily}]
  \draw (0,0) to[I, l=$I_N$, i=$i_N$] (0,3) -- (4,3);
  \draw (0,0) -- (4,0);
  \draw (2,3) -- (2,2.25) to[R, l=$R_N$] (2,0.75) -- (2,0);
  \draw (4,3) to[open, v^=$v_{ab}$] (4,0);
  \draw (0,0) node[ground]{};
  \fill (2,3) circle (2pt); \fill (2,0) circle (2pt);
  \node[right] at (4,3) {$a$};
  \node[right] at (4,0) {$b$};
\end{circuitikz}
```

---

## Tips for Extending Patterns

- **Adding ground:** `\draw (x,y) node[ground]{};` at the reference node. Default behavior — every pattern above has one unless the topology is groundless (e.g., transformer secondary).
- **Centering a component:** use `start -- stub_top to[component] stub_bottom -- end` with stub lengths chosen so the component sits mid-branch.
- **Source polarity:** draw vertical voltage sources from top coordinate to bottom coordinate with `v_=` so `+` is on top and the label sits on the outside (left) of the circuit.
- **Adding labels to wires:** `\draw (a) to[short, i=$i$] (b);`
- **Controlled sources:** `to[cV, v=$\alpha v_x$]` (voltage), `to[cI, l=$\beta i_x$]` (current). Diamond shape is rendered automatically.
- **Three-phase:** repeat single-phase patterns with x-offset; label phases A, B, C. Ground only the system neutral.
