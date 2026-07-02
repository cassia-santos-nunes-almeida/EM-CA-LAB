# Vector notation typography

Source: Ulaby Sec 1-2 (notation summary), Ida Ch 1.2.

## Three typographic classes

| Class | Example | Rendering |
|---|---|---|
| Scalar | `E` (magnitude of electric field), `R` (resistance) | italic non-bold |
| Vector | `E` (electric field), `B` (magnetic flux density) | bold roman (non-italic) |
| Unit vector | `x-hat`, `phi-hat`, `R-hat` | bold roman with circumflex |
| Phasor | `E-tilde(t)` phasor of `E(t)` | tilde over the letter |

Handwriting (for board work and feedback on student written work):

- Vector: arrow over the letter, `E-vec`, or underline `underline(E)`.
- Unit vector: circumflex (hat) over the letter, `x-hat`.
- Phasor: tilde over the letter, `E-tilde`.

## LaTeX rendering

For course materials using LaTeX:

| Class | LaTeX |
|---|---|
| Scalar | plain `E` or `$E$` (italic by default in math mode) |
| Vector | `\mathbf{E}` |
| Unit vector | `\hat{\mathbf{x}}` |
| Phasor of vector | `\tilde{\mathbf{E}}` |
| Phasor of scalar | `\tilde{V}` |

In physics packages: `\vec{E}` is acceptable for handwritten-style
arrow-over-letter, but `\mathbf{E}` is the course default because it
matches Ulaby's print style.

## STACK and plain-text rendering

STACK Maxima does not render LaTeX for variable names. Use these
conventions inside Maxima code and PRT feedback strings:

| Class | STACK/Maxima name |
|---|---|
| Scalar | `E`, `R`, `V` |
| Vector component | `Ex`, `Ey`, `Ez` or `E_x`, `E_y`, `E_z` |
| Unit vector | `xhat`, `phihat`, `Rhat` (no underscores, no backslashes) |
| Phasor | `Etilde`, `Vtilde` or `Ep`, `Vp` (p for "phasor") |
| Phase angle | `phi`, `theta` (spell Greek letters out) |

For student-facing rendering, wrap these in LaTeX using the STACK
`\({...}\)` or `{@expr@}` mechanism. Keep variable names ASCII inside
Maxima.

## Component notation

For a vector in Cartesian form, Ulaby and Ida both write:

`E = x-hat E_x + y-hat E_y + z-hat E_z`

with the unit vector **first** (left-multiplied) and the scalar component
second. This ordering is conventional in field theory and should be used
in all course materials for consistency. Some circuits textbooks reverse
the order; do not mix conventions.

## Magnitude

The magnitude of a vector is written as the same letter in scalar
(non-bold) font: `E = |E|` where the left `E` is scalar and the right `E`
is the vector (inside the magnitude bars). This is Ulaby Eq. 1.1:

`E = x-hat E`

where the left `E` is the vector and `E` on the right is the scalar
magnitude.

## Dot and cross products

- Dot product: `A . B` (or `A \cdot B` in LaTeX). Result is scalar.
- Cross product: `A x B` (or `A \times B` in LaTeX). Result is vector.

Do not use `*` for either. Do not use `A B` (juxtaposition) to mean dot
product in any course material.

## Common mistakes to prevent

1. **Mixing vector and scalar** as if they were interchangeable. `E = B`
   is meaningless unless both sides are vectors. `|E| = |B|` is a valid
   scalar equation.
2. **Omitting the hat on unit vectors.** `E = x E_x + ...` is wrong;
   needs `x-hat`.
3. **Italicizing vectors in LaTeX.** `$\mathit{E}$` for a vector is wrong;
   use `\mathbf{E}`.
4. **Using arrow notation in one place and bold in another** within the
   same document. Pick one style per document.
