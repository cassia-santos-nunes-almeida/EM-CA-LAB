# Phasor conventions

Sources: Nilsson Ch 9 (circuits), Ulaby Sec 1-7 (fields). The two agree on
the cosine reference, which is what the course uses.

## Cosine reference (both books)

Every sinusoidal time-domain signal is written with cosine before
conversion:

`v(t) = Vm cos(omega t + phi)`

Never introduce a sine form mid-derivation. If a problem is stated with
`sin`, convert to cosine first using `sin(x) = cos(x - pi/2)` before
extracting the phasor.

## Phasor definition

### Nilsson (circuits)

Phasor transform: `P{Vm cos(omega t + phi)} = Vm e^(j phi)`, written as a
complex number.

Notation in circuits: the phasor of `v(t)` is denoted `V` (bold-italic or
uppercase in Nilsson). In STACK and LaTeX, prefer `\mathbf{V}` or
`\underline{V}` to distinguish the phasor from the DC constant.

Time-domain recovery: `v(t) = Re[V e^(j omega t)]`.

### Ulaby (fields)

Phasor notation: a tilde over the letter. `E-tilde` is the phasor of
`E(t)`. Same mathematical relation:

`E(t) = Re[E-tilde e^(j omega t)]`

In LaTeX: `\tilde{\mathbf{E}}`. In STACK and plain-text contexts, write
`Etilde` or `E_tilde` as a variable name.

## RMS value

`Vrms = Vm / sqrt(2)`

For a generic sinusoid only. For non-sinusoidal signals, use the definition
`Vrms = sqrt((1/T) integral_0^T v^2 dt)`.

Nilsson uses `Vrms` and `Irms` as explicit subscripted variables; do not
write plain `V` for an RMS value unless the context is unmistakable and
declared.

## Phasor element impedances

Under the cosine-reference phasor transform:

| Element | Impedance Z | Admittance Y |
|---|---|---|
| Resistor | `R` | `1/R` |
| Inductor | `j omega L` | `1 / (j omega L)` |
| Capacitor | `1 / (j omega C)` | `j omega C` |

These follow directly from the defining equations under the passive sign
convention.

## Complex power

`S = V I*` (complex power, in VA)

where `V` and `I` are RMS phasors and `*` is complex conjugate.

- Real part: average power `P` in W.
- Imaginary part: reactive power `Q` in VAR.
- Magnitude: apparent power `|S|` in VA.
- Power factor: `pf = cos(theta_v - theta_i) = P / |S|`.

Nilsson Ch 10 uses this exact form. Match it in course content.

## Angle units

- Prefer **degrees** in STACK answers when the student enters a numerical
  angle (students find radians harder to type and easier to misread).
- Keep **radians** in symbolic derivations and in field-theory content
  (Ulaby uses radians throughout).
- Never mix degrees and radians within a single equation. If the problem
  demands both, convert explicitly and state the conversion.

## Common mistakes to prevent

1. **Sine-form phasors** imported from other sources. Always convert to
   cosine first.
2. **Peak vs RMS ambiguity.** State which you are using in every worked
   example and STACK question. Power calculations almost always want RMS.
3. **Missing `j omega` on an inductor** in a hand-drawn or sketched
   s-domain circuit when the student meant the phasor domain. The phasor
   impedance of an inductor is `j omega L`, not `s L`. The two coincide
   only at `s = j omega`.
4. **Applying phasors to non-sinusoidal signals.** Phasors require a single
   frequency. For multi-frequency or transient signals, use Laplace or
   Fourier.
