# Passive sign convention

Source: Nilsson and Riedel, Electric Circuits 11e, Section 1.5 and 1.6.
This is a hard rule for all circuit content in the course.

## Statement

> Whenever the reference direction for the current in an element is in
> the direction of the reference voltage drop across the element, use a
> positive sign in any expression that relates the voltage to the current.
> Otherwise, use a negative sign.
>
> -- Nilsson and Riedel, Eq. following Table 1.4

## Mechanical rule for drawing and labeling

1. Choose an arbitrary reference polarity for the voltage (pick which
   terminal is the `+` terminal and which is the `-`).
2. Draw the current arrow so that it **enters the `+` terminal**.
3. Write the element equation with a positive sign.

If for some reason the current arrow must enter the `-` terminal (e.g.,
to match a defined branch direction in a larger circuit), write the
element equation with a minus sign. Do not silently change the sign in
later steps.

## Element equations under the passive sign convention

With current `i` entering the `+` terminal of `v`:

| Element | Equation | Inverse form |
|---|---|---|
| Resistor | `v = R i` | `i = v / R` |
| Inductor | `v = L di/dt` | `i(t) = (1/L) integral v dt + i(t0)` |
| Capacitor | `i = C dv/dt` | `v(t) = (1/C) integral i dt + v(t0)` |

If the current reference is reversed (arrow enters the `-` terminal), each
of these gets a minus sign on the right-hand side. Keep the minus sign
throughout the derivation; do not absorb it into the variable.

## Power

With the passive sign convention:

`p = v i`

If `p > 0`, the element is **absorbing** power (sink).
If `p < 0`, the element is **delivering** power (source).

## Why this matters for course materials

Students in BL30A0350 routinely get sign errors in their STACK questions
and exam problems because different textbooks and different YouTube
tutorials swap the convention freely. The course chooses Nilsson's
convention and sticks to it in every worked example, every schematic, and
every STACK question. When generating content:

- Draw current arrows entering the `+` terminal unless a specific
  pedagogical point requires otherwise.
- Use `p = v i` (no minus). If the element turns out to deliver power, let
  `p` come out negative.
- In CircuiTikZ, use American source symbols with `+` on top and draw the
  current arrow entering the top terminal of passive elements.

## Labeling node voltages on parallel branches

When two or more elements share the same pair of nodes (parallel branches
between a top rail and a bottom rail), the voltage across all of them is
the same single node voltage. Do not duplicate the voltage label on each
element. Instead:

1. Draw a **free-standing voltage arrow** between the two rails, in the
   open space between the source and the first parallel branch (or in any
   gap between branches). This arrow is not attached to any component.
2. Place the `+` marker at the top end of the arrow and the `-` marker at
   the bottom end, matching the polarity that makes the parallel branch
   currents agree with the passive sign convention.
3. Label the arrow with the node voltage symbol, e.g. `v(t)` for
   time-varying or `V` for DC.
4. Do not also write `v=$v(t)$` on any of the parallel components.
   Pick one place to label the voltage; the arrow is that place.

This avoids three common bugs in student-facing diagrams:

- **Triple-labeling** the same voltage on R, L, and C in a parallel RLC
  bank, which suggests three different voltages to a beginner.
- **Polarity ambiguity** when one component's `v=` label points up and
  another's points down purely because of how `to[]` was drawn.
- **Label collision** with component symbols, especially the capacitor's
  `+`/`-` plates, which carry their own polarity meaning.

CircuiTikZ pattern for the free-standing voltage arrow:

```latex
\draw[-latex, line width=0.6pt] (x, y_bottom+0.3) -- (x, y_top-0.3);
\node[right, font=\sffamily] at (x, (y_top+y_bottom)/2) {$v(t)$};
\node[right, font=\sffamily\small] at (x, y_bottom+0.5) {$-$};
\node[right, font=\sffamily\small] at (x, y_top-0.5) {$+$};
```

The arrow points from `-` to `+` (rising potential). Pick `x` so the arrow
sits in dead space, not crossing any wire or component. Branch currents on
each parallel element point downward (into the `+` terminal at the top
rail), consistent with the passive sign convention.

The same rule applies to series sub-circuits where one component's voltage
defines the node-voltage reference for downstream analysis: label it once
on the component, and refer to it by name elsewhere instead of repeating
the polarity arrow.

## Common trap in mutual inductance

For coupled coils with mutual inductance `M`, the self-induced voltage
follows the passive sign convention on the element itself. The
**mutually induced** voltage sign depends on the dot convention of the
coupling, not on the passive sign convention. Nilsson Ch 6.4 gives the
full rule; the short version:

- If both currents enter dotted terminals, the mutual term is `+M di/dt`.
- If one current enters a dotted terminal and the other leaves one, the
  mutual term is `-M di/dt`.

Always label the dots explicitly in diagrams. Never omit them when
mutual inductance is in play.
