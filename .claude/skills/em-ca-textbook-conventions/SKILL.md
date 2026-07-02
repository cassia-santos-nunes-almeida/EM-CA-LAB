---
name: em-ca-textbook-conventions
description: >
  Use when generating or reviewing electromagnetism or circuit analysis
  teaching content that needs consistent notation across a Nilsson /
  Ulaby / Ida textbook set. Triggers: lecture notes, exam problems,
  STACK questions, worked examples, React educational modules, circuit
  schematics, solution manuals, or Faraday-law / Ampere-law derivations
  that connect fields to circuits. Also triggers on "use course
  notation", "match the textbook", "check the symbols", "fix the
  conventions", "align with Nilsson/Ulaby/Ida", "notation check", or
  any reference to Nilsson, Ulaby, or Ida by name. Enforces canonical
  notation across the three textbooks (Nilsson for circuits, Ulaby for
  applied EM, Ida as secondary EM reference) and resolves the known
  conflicts: A vs S for area, lambda vs Lambda vs N-Phi for flux
  linkage, phi for phase angle vs azimuthal angle, energy symbol w vs
  W vs E, and circuit vs field phasor typography.
  The three-textbook set is configurable — replace the reference files
  in references/ if your course uses different primary sources.
---

# EM and Circuit Analysis Textbook Conventions

Enforce consistent notation across electromagnetism and circuit
analysis teaching materials when a course uses a three-textbook set
with overlapping but non-identical conventions. The canonical set
shipped here is:

- **Nilsson and Riedel, Electric Circuits (11e)** -- primary for circuit
  analysis and Laplace.
- **Ulaby, Fundamentals of Applied Electromagnetics (7e)** -- primary for
  electromagnetics.
- **Ida, Engineering Electromagnetics (4e)** -- secondary EM reference.

This skill does not pick the "correct" book in the abstract. It picks the
convention students are most likely to see in their assigned reading for a
given topic, and enforces it consistently in course materials.

## Decision tree: which convention applies?

Claude identifies the topic first, then applies the matching book's
convention. The split is deterministic:

| Topic | Primary book | Notation source |
|---|---|---|
| Circuit elements (R, L, C), KVL, KCL | Nilsson | [passive-sign-convention.md](references/passive-sign-convention.md), [variable-naming.md](references/variable-naming.md) |
| Node voltage, mesh current, Thevenin, Norton | Nilsson | [variable-naming.md](references/variable-naming.md) |
| Sinusoidal steady state, phasors in circuits | Nilsson | [phasor-conventions.md](references/phasor-conventions.md) |
| Laplace transform, s-domain circuits | Nilsson | [laplace-conventions.md](references/laplace-conventions.md) |
| Vectors, coordinate systems, operators | Ulaby (Ida agrees) | [coordinate-systems.md](references/coordinate-systems.md), [vector-notation.md](references/vector-notation.md) |
| Electrostatics (E, D, V, charge, capacitance from fields) | Ulaby | [vector-notation.md](references/vector-notation.md) |
| Magnetostatics (B, H, magnetic flux, magnetic materials) | Ulaby | [vector-notation.md](references/vector-notation.md) |
| Faraday's law, time-varying fields | Ulaby | [phasor-conventions.md](references/phasor-conventions.md) |
| Magnetic circuits (reluctance, mmf) | Nilsson Ch 6 Practical Perspective + Ida Ch 9 | [variable-naming.md](references/variable-naming.md) |

For mixed topics, the book whose domain dominates the content controls. A
worked example where an electromagnetic configuration feeds an electric
circuit uses Ulaby notation for the field calculation and Nilsson notation
for the downstream circuit solution, with an explicit connecting equation
where the two meet.

## Hard rules (never violated)

These apply to all outputs regardless of topic:

1. **Passive sign convention** for every circuit element. Reference current
   arrow points into the reference-positive terminal; write v and i with
   matching algebraic signs accordingly. No exceptions. See
   [passive-sign-convention.md](references/passive-sign-convention.md).

2. **Cosine reference for phasors.** All sinusoidal sources are written as
   `v(t) = Vm cos(omega t + phi)` before phasor conversion. Never introduce
   a sine-reference phasor mid-derivation.

3. **Inductor and capacitor defining equations** follow Nilsson:
   `v = L di/dt` and `i = C dv/dt`, valid when reference directions obey
   the passive sign convention. If the current reference opposes the
   voltage-drop direction, include the minus sign explicitly.

4. **Vector notation:** bold for vectors (`E`), italic non-bold for scalars
   (`E`), bold with circumflex for unit vectors (`x-hat`, `phi-hat`).
   Phasors are domain-split: tilde above the letter for **field** phasors
   (Ulaby, e.g. `E-tilde`, LaTeX `\tilde{\mathbf{E}}`); bold uppercase
   (LaTeX `\mathbf{V}`) or underlined (`\underline{V}`) for **circuit**
   phasors (Nilsson). Nilsson's printed text is bold-italic; in LaTeX,
   `\mathbf{V}` is the practical substitute and is what
   [phasor-conventions.md](references/phasor-conventions.md) prescribes
   for STACK and LaTeX output. See also
   [vector-notation.md](references/vector-notation.md).

5. **Greek letter usage is fixed:** omega for angular frequency, phi for
   phase angle (circuits) and azimuthal angle (fields), theta for polar
   angle, epsilon for permittivity, mu for permeability, sigma for
   conductivity, rho for volume charge density. Do not substitute.
   **Exception — same symbol, two roles in one derivation:** if a
   derivation uses `phi` for both phase angle and azimuthal angle (e.g.
   a transmission-line problem with a radial/azimuthal field and a
   voltage phase), rename one per
   [known-conflicts.md](references/known-conflicts.md) §8 — `phi_v` for
   voltage phase, `phi` for azimuthal. Declare the rename at first use.
   The same meta-rule applies to any Greek letter that collides with
   itself in a cross-domain derivation.

## Resolving the known conflicts

See [known-conflicts.md](references/known-conflicts.md) for the full list
with page citations. The three conflicts Claude encounters most often:

### Cross-sectional area: A or S?

Context-dependent. Both letters are correct in their domain.

- **Use A** when the area is a conductor cross-section in a circuit or
  resistance context: `R = rho l / (sigma A)`, inductor winding
  cross-section, cable gauge, transformer core cross-section in a magnetic
  circuit. This matches Nilsson and the resistance formula in Ulaby Ch 4.
- **Use S** when the area is a surface of integration for a flux or field
  integral: `Phi = integral B . dS` over surface S, Gauss's law surface,
  Ampere's law surface. This matches Ulaby's surface integral notation
  throughout Ch 4 and Ch 5.

Never use both in the same equation for different things. If a derivation
crosses the boundary (e.g., computing inductance of a solenoid), pick one
and note the choice in a sentence.

**Collision with magnetic vector potential.** Ulaby and Ida both use bold
`A` for the magnetic vector potential. If a derivation uses `A` for both
vector potential and conductor cross-section, rename the cross-section
to `A_c` (or `A_cs`) and declare the rename at first use. See
[known-conflicts.md](references/known-conflicts.md) §1.

### Flux linkage: lambda, Lambda, or N Phi?

Domain-split. Use the one students read in the book covering that topic.

- **Circuits (Nilsson Ch 6 and 9):** lowercase `lambda`, time-varying. The
  defining relation is `v = d lambda / dt` (Faraday's law form in Nilsson
  Eq. 6.18). Use this when writing Faraday's-law-flavored circuit
  derivations and transformer equations in the time domain.
- **Magnetostatics (Ulaby Ch 5):** capital `Lambda`, static or slowly
  varying. The defining relation is `Lambda = N Phi` and `L = Lambda / I`
  (Ulaby Eq. 5.93 and 5.94). Use this when deriving inductance from field
  integrals.
- **Ida's N Phi without a dedicated symbol:** acceptable in derivations
  where introducing a new symbol would add noise. Write `L = N Phi / I`
  directly. Do not mix this style with the lambda/Lambda style in the same
  document.

### Spherical radius: R (not a textbook conflict — reminder only)

Ulaby and Ida agree: **R** for spherical radial coordinate, **r** for
cylindrical. This is not a conflict between the three textbooks, but it
is a frequent point of confusion when students have also seen physics
textbooks that reuse `r` for both. The rule here: do not use lowercase
`r` for a spherical radial coordinate even if the equation looks
crowded. See
[coordinate-systems.md](references/coordinate-systems.md).

## Workflow

When producing course content:

1. Identify the topic and look up the primary book in the decision table.
2. Read the relevant reference file for symbol choices.
3. Draft the content using only the chosen book's conventions.
4. Run the notation check:
   - All three hard rules satisfied?
   - No mixed conventions within a single equation or derivation?
   - Greek letters used per the fixed mapping?
   - Area symbol (A or S) matches the domain?
   - Flux linkage symbol (lambda, Lambda, or explicit N Phi) matches the
     domain, and only one style appears in the document?
5. If the content will be imported into STACK, verify Maxima variable
   names do not collide with the chosen notation (e.g., `A` is a reserved
   risk in some STACK templates, use `Axs` for area variables there).

## Integration with other skills

- `circuitikz-circuit-diagrams`: when generating schematics, apply the
  passive sign convention rule (sources top-to-bottom with + on top
  already matches this skill's rule 1). Use inductor symbol with explicit
  `v` and `i` labels following the reference directions in
  [passive-sign-convention.md](references/passive-sign-convention.md).
- `stack-xml-generator`: when generating STACK questions, use the symbols
  specified by the decision table for the topic. Pass the chosen symbols
  into Maxima as explicit variable names to avoid collisions.
- `eer-paper-writing`: research papers about this course's teaching use
  the same conventions so that figures and equations match student-facing
  materials.

## Hard constraints

1. **Never mix conventions within a single document section.** If you must
   switch (e.g., a paper section crosses circuits and fields), introduce
   the switch explicitly with a sentence naming the convention change.
2. **Never invent a hybrid symbol** (e.g., using `lambda` in a field
   context or `Lambda` in a circuits context) just because it "reads
   better". Use what the student sees in the assigned chapter.
3. **Never drop the passive sign convention** even in worked examples
   where the sign "works out anyway". The rule is pedagogical as much as
   mathematical.
4. **Never use bare italic for vectors** in LaTeX output. Bold or bold
   with hat, per rule 4.
