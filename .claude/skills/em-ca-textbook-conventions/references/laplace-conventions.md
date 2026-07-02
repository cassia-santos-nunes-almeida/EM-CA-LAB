# Laplace transform conventions

Source: Nilsson and Riedel, Electric Circuits 11e, Ch 12-13.

## Definition (one-sided Laplace)

`F(s) = L{f(t)} = integral_{0^-}^{infinity} f(t) e^(-s t) dt`

The course uses the **unilateral (one-sided) Laplace transform** with
lower limit `0^-`. This matters for circuits with impulsive inputs at
`t = 0` because the `0^-` lower limit captures the impulse; the `0^+`
limit loses it.

Write `0^-` explicitly as the lower limit when the distinction matters
(e.g., initial-value problems with step or impulse sources). For routine
transforms of continuous functions, the distinction is invisible.

## Notation

- Time-domain function: lowercase, `f(t)`, `v(t)`, `i(t)`.
- Frequency-domain (Laplace) function: uppercase, `F(s)`, `V(s)`, `I(s)`.
- The Laplace operator: script `L{.}` or plain `L{.}` in ASCII contexts.
- Complex frequency variable: `s = sigma + j omega`.

## s-domain element models (under passive sign convention)

| Element | s-domain impedance | Initial-condition source |
|---|---|---|
| Resistor | `R` | none |
| Inductor | `s L` | series voltage source `L i(0^-)` in direction of current |
| Capacitor | `1/(s C)` | series voltage source `v(0^-)/s` in direction of voltage |

Alternative parallel-source forms (Norton equivalents) exist. Nilsson
prefers the series-source form for initial conditions; match that choice
in course materials for consistency.

## Initial and final value theorems

- Initial value: `f(0^+) = lim_{s to infinity} s F(s)`
- Final value: `lim_{t to infinity} f(t) = lim_{s to 0} s F(s)`, **valid
  only if** all poles of `s F(s)` are in the open left half-plane (or at
  the origin for constant final values).

When stating the final-value theorem in course materials, include the
pole-location caveat. Students routinely apply it to expressions with
right-half-plane or `j omega`-axis poles and get wrong answers.

## Transfer function

`H(s) = Y(s) / X(s)` with all independent sources set to zero and all
initial conditions set to zero.

- Poles are the roots of the denominator (characteristic equation roots).
- Zeros are the roots of the numerator.
- Plot in the s-plane with `sigma` horizontal, `j omega` vertical. Mark
  poles with `x`, zeros with `o`.

Steady-state sinusoidal response from transfer function:
`H(j omega) = H(s) |_{s = j omega}`

The magnitude gives the amplitude ratio and the angle gives the phase
shift.

## Partial fraction expansion

Nilsson distinguishes three cases:

1. **Distinct real poles:** direct cover-up.
2. **Repeated real poles:** differentiate the cover-up result for higher-
   order residues.
3. **Complex conjugate poles:** expand the pair together and convert to a
   damped cosine form using the identity
   `K1 / (s - a - j b) + K1* / (s - a + j b) -> 2 |K1| e^(a t) cos(b t + angle K1)`.

When building STACK questions, prefer distinct real poles for
introductory problems and introduce complex poles only after students
have seen the expansion explicitly.

## Common mistakes to prevent

1. **Forgetting initial-condition sources** when transforming a circuit
   with non-zero initial inductor current or capacitor voltage.
2. **Using `0^+` as the lower limit** and losing impulse contributions.
3. **Writing `s L` for a phasor impedance** (should be `j omega L`) or
   `j omega L` for a Laplace impedance (should be `s L`). They are
   different domains.
4. **Applying the final-value theorem to a marginally stable or
   unstable system.** Always check pole locations first.
5. **Mixing transform and inverse transform in one expression** without
   naming which domain the variables live in.
