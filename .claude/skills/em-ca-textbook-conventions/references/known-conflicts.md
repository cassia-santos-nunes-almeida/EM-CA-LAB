# Known conflicts between the three textbooks

This file documents where Nilsson, Ulaby, and Ida disagree, and the
course's resolution. When a student opens the "other" book and sees a
different symbol, they should be able to come back to course materials
and understand why.

## 1. Cross-sectional area: A or S

| Book | Symbol | Context |
|---|---|---|
| Nilsson | (not heavily used) | `A` in resistance formula |
| Ulaby | `A` in resistance (Ch 4) | `S` in surface integrals (Ch 4-5) |
| Ida | "cross section" in prose | `ds` for surface element, no single symbol |

**Course resolution:** context-split.

- `A` for conductor cross-sections and resistance formulas.
- `S` for flux-integration surfaces: `Phi = integral_S B . dS`.

This matches Ulaby's own practice and avoids confusion with magnetic
vector potential `A` in magnetostatics. Within a single derivation where
both appear, rename one (e.g., `A_c` for conductor cross-section when
`A` is already in use for vector potential).

## 2. Flux linkage: lambda, Lambda, or N Phi

| Book | Symbol | Defining relation |
|---|---|---|
| Nilsson Ch 6 | `lambda(t)` | `v = d lambda / dt` (Faraday form) |
| Ulaby Ch 5 | `Lambda` (capital) | `Lambda = N Phi`, `L = Lambda / I` |
| Ida Ch 9 | no dedicated symbol | writes `L = N Phi / I` directly |

**Course resolution:** domain-split.

- `lambda(t)` in circuit-analysis contexts where Faraday's law is
  expressed as `v = d lambda / dt`. Students see this in Nilsson Ch 6.
- `Lambda = N Phi` in magnetostatics derivations where the flux linkage
  is a bookkeeping device to pass from field to lumped inductance.
  Students see this in Ulaby Ch 5.
- The Ida style (`L = N Phi / I` without a dedicated symbol) is
  acceptable in short derivations where introducing `lambda` or `Lambda`
  would add a symbol for one equation only.

Do not mix styles within a single document.

## 3. Spherical radial coordinate: R or r

| Book | Symbol |
|---|---|
| Nilsson | n/a (no 3D fields) |
| Ulaby | `R` |
| Ida | `R` |

**Course resolution:** `R` always. Ulaby and Ida agree. Avoid physics-
textbook style that reuses `r` for both cylindrical and spherical radius.

## 4. Sinusoidal reference: cosine or sine

| Book | Reference |
|---|---|
| Nilsson | cosine |
| Ulaby | cosine |
| Ida | (mostly covers static and transient; limited phasor content) |

**Course resolution:** cosine always. No conflict in practice.

## 5. Phasor typography: bold, uppercase, or tilde

| Book | Phasor notation |
|---|---|
| Nilsson | bold-italic uppercase, `V` (ambiguous with DC constant) |
| Ulaby | tilde over letter, `V-tilde` or `E-tilde` |
| Ida | minimal phasor use |

**Course resolution:** domain-split.

- In **circuits** (Nilsson topic), use bold-italic uppercase or
  `\underline{V}` for phasors. Distinguish from DC constants by context
  or by an explicit subscript `Vphasor` or `V_rms` when needed.
- In **fields** (Ulaby topic), use tilde: `E-tilde`. LaTeX
  `\tilde{\mathbf{E}}`.

The split matches what students read in the assigned chapters.

## 6. Passive sign convention scope

| Book | Scope |
|---|---|
| Nilsson | enforced throughout the text |
| Ulaby | not discussed explicitly; circuits use passive sign implicitly |
| Ida | not discussed explicitly |

**Course resolution:** Nilsson's rule applies to **all** circuit content
in the course, without exception. See
[passive-sign-convention.md](passive-sign-convention.md).

## 7. Frequency vs flux symbol f

| Book | `f` means |
|---|---|
| Nilsson circuits | frequency in Hz |
| Ulaby fields | Phi for magnetic flux |
| Ida | `Phi` for flux, `f` sometimes for frequency |

**Course resolution:** `f` is frequency (Hz). `Phi` (capital) or
`phi` (lowercase) is flux, not `f`. When the text extraction in a PDF
renders `Phi` as `f`, mentally substitute back.

## 8. Phase angle phi vs azimuthal angle phi

Both are `phi`, in both kinds of textbooks.

**Course resolution:** context disambiguates. If a problem combines
circuits and fields (e.g., a transmission line phase-angle calculation),
rename one: `phi_v` for voltage phase angle, `phi` for azimuthal angle.
Declare the rename at first use.

## 9. Energy symbol E vs w

| Book | Energy symbol |
|---|---|
| Nilsson | `w` (to avoid clash with electric field) |
| Ulaby | `W` for total energy, `w` for energy density |
| Ida | `W` for energy, `w` for density |

**Course resolution:** `w` for time-varying energy and energy density;
`W` for total stored energy at a given instant. Never `E` for energy in
course materials, because `E` is reserved for electric field.

---

## Meta-rule for future conflicts

When a new collision is discovered (a symbol used for two different
quantities across the three books):

1. Identify which book the student reads for the topic at hand (use the
   decision table in SKILL.md).
2. Use that book's convention.
3. If the same symbol is used for two different quantities within a
   single derivation, rename one with a subscript or prime. Declare the
   rename explicitly at first use.
4. Add the new conflict and its resolution to this file.
