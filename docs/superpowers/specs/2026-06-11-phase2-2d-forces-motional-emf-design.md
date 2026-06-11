# Unit "2D" design — Forces on Conductors & Motional EMF · extends `ampere` (2.3), `lorentz` (2.4), `faraday` (3.1)

**Date:** 2026-06-11 · **Status:** design complete, implementation NOT started
**Parent:** `2026-06-10-phase-2-roadmap.md` — **roadmap unit 2C** (ILO 6, + ILO 2 polish)
**Provenance:** recon of `src/em/sections/{ampere,lorentz,faraday,lenz}/index.tsx` (linear `SectionLayout` pages, no tabs; one sim + one blocking gate + 3 CCs each), the em CC pipeline (`QuizQuestion` → `toConceptCheck`, ONE shared explanation + 3-tier hints — per-option explanations are NOT supported in em, unlike transmission's YourTurnPanel), `PredictionGate` (blocking default verified: `allowSkip = false`), `progressStore.isModuleComplete`, `curriculum.test.ts` expectedChecks pins, `e2e/sim-paint.spec.ts` generic gate-walker. Every number below hand-derived in this doc, most by two independent routes. House style matched to the approved 2A design (`2026-06-10-phase-2a-line-impedance-design.md`) and the sibling unit doc (`2026-06-11-phase2-2c-mutual-inductance-design.md`).

> **⚠ Label note (binding for traceability):** the work order called this "unit 2D (forces-motional-emf)". In the roadmap, **2C is "Forces on conductors & motional EMF" (ILO 6)** and **2D is "Mutual inductance" (ILO 5)**. The parenthetical content is the scope, so this document designs the roadmap's **2C**. The sibling doc (`…-2c-mutual-inductance-design.md`) carries the mirrored note and a binding NON-goal that the two units never bleed into one PR. Cross-reference both labels in the PR description.

---

## 1. Pedagogical goal & the exact ILO gap closed

**Goal:** give ILO 6 its quantitative half. After this unit a student can (a) compute the force on a current-carrying conductor from **F = IL×B** and *derive* that law from the force on individual drifting charges, (b) compute the force between parallel wires and connect it to the classical definition of the ampere, (c) compute a motional EMF ε = Blv two independent ways (Lorentz force on the rod's charges; Faraday flux through the growing loop) and **close the Lenz energy loop numerically** — mechanical power in equals electrical power out, exactly. The ILO 2 polish rider: the Lorentz force finally appears in its complete form **F = q(E + v×B)**, with a velocity-selector ConceptCheck.

**Roadmap quote (unit 2C, verbatim):**

> The quantitative half of ILO 6 is absent: **F = IL×B** appears only as a quiz distractor; no parallel-wires force (the classical ampere definition); no motional EMF (Blv rod-on-rails — the canonical example that unifies the whole ILO: moving conductor → EMF → current → opposing force, closing the Lenz energy loop). Also: Lorentz force only ever stated in magnetic form — add **F = q(E + v×B)** + a velocity-selector ConceptCheck.
> Homes: lorentz (F=q(E+v×B), F=BIl derivation + motor/loudspeaker example), ampere (parallel wires), faraday (rod-on-rails, interactive or worked). Effort: medium.

**Priority rationale (roadmap sequencing §, verbatim):** step 3 of the recommended order — "**2C forces/motional EMF** + **2D mutual inductance** (completes ILOs 5/6, the Part-2/3 physics debt)" — after 2A line theory, before 2F/2G. ILO 6 ("EMF induction & forces on conductors") is graded **partial**: the *induction* half is solid (faraday/lenz sims), the *forces-on-conductors* half is this unit.

---

## 2. Decision: extend the three named sections — NO new section

**Ruling: extend `ampere` (2.3), `lorentz` (2.4), `faraday` (3.1).** Evidence:

1. The roadmap names the homes explicitly ("Homes: lorentz …, ampere …, faraday …"). Effort class "medium" spread across three pages ≈ one theory block + one CC (+ one gate on two of them) per page — nowhere near a section anywhere.
2. The em pages are **linear** (`SectionLayout`, no tabs): every addition is a pure insertion at a visible seam, and — unlike the tabbed transmission pages — **no lifted gate state is needed** (no remount on tab switch; `PredictionGate`'s internal state lives as long as the page).
3. Zero wiring cost: **no `curriculum.ts` edit, no `sectionRegistry.tsx` edit, no renumbering, no count-test churn** (`curriculum.test.ts` counts, `getSectionNumber.test.ts`, `routeIntegrity` all untouched). No interaction with 2A (Part 5) or the mutual-inductance unit (Transformers 3.4) — different files, any merge order.
4. The unifying rod-on-rails calculation *belongs* in faraday: it is the missing bridge between the section's own sim (flux changed by changing B) and Lenz's drag (next section, 3.2) — inserting it right before the spine hands over to `lenz` is the pedagogical seam.

**The spine-order seam (one judged call):** Part-2 order is ampere (2.3) → lorentz (2.4), but the parallel-wires force (homed in ampere) *uses* F = BIl, which is *derived* in lorentz. Ruling: ampere **states** the companion fact "a field exerts a force on a current, F = BIl" with an honest forward reference ("derived from the force on each moving charge in Section `{getSectionNumber('lorentz')}`"), and lorentz pays the debt with the drift-velocity derivation. This is the textbook order too (Ulaby/Ida both state wire force alongside Ampère's law and derive it with the Lorentz force). The alternative — moving parallel wires into lorentz — was rejected: it contradicts the roadmap's explicit homing and would orphan the ampere-definition payoff from the only section that owns B = μ₀I/(2πr).

**Conventions (binding — three contexts coexist in these files, get them right):**
- `<MathWrapper formula="…" />` and any other **JSX attribute literal** → **single backslash** exactly as written below.
- `EquationBox` `math:` values and any LaTeX inside **JS string literals** (`.ts`/`.tsx` object fields) → **double backslash** (verified existing pattern: `math: '\\vec{F} = q(\\vec{v} \\times \\vec{B})'`).
- `QuizQuestion` strings (question/options/explanation/hints), `PredictionGate` option `label`s → **plain unicode, never LaTeX** (μ₀, ×, 10⁻⁷, ε — verified house pattern in all em sections).
- New `PredictionGate`s: **write no `allowSkip` prop** — blocking is the default (verified `allowSkip = false` in `PredictionGate.tsx`).
- No hardcoded section numbers in prose — `{getSectionNumber('…')}` interpolation only (add the `@shared/constants/curriculum` import to each section file; currently only `SectionLayout` imports it).
- New CCs are `QuizQuestion` consts wired through `toConceptCheck`, `onComplete={onCheckComplete}` `onHint={onCheckHint}` — the existing per-section helpers.

**expectedChecks ruling: keep 3 (no curriculum edit).** Each home gains a 4th CC, but the `expectedChecks` target stays 3 because: (a) it is a completion *threshold*, not a census (curriculum comment: "authored with a fixed target (3)"); (b) bumping to 4 would retroactively un-complete persisted progress for anyone who finished at 3 (`isModuleComplete` re-evaluates stored counts against the live curriculum); (c) `curriculum.test.ts` line 101 pins only gauss/maxwell at 3 — untouched either way. Record this in the PR description so the owner can overrule cheaply.

---

## 3. Content outline — `ampere` (2.3): the force between parallel wires

**Placement:** between the `Q_FIELD` ConceptCheck and the `Q_SOLENOID` ConceptCheck (so B = μ₀I/(2πr) is fresh; the solenoid thread resumes after). Pure insertion.

### 3A. Lead-in (2 sentences, ungated)

> The marker you dragged measures what the wire's current *creates*. Flip the question: what does a magnetic field *do back* to a current? A field exerts a sideways force on every current-carrying conductor — `F = BIl` for a straight wire of length `l` at right angles to the field (each moving charge inside feels the Lorentz force; the per-charge derivation is Section `{getSectionNumber('lorentz')}`). Put a *second* wire next to the first, and each sits in the other's field…

### 3B. PredictionGate (blocking, static reveal — no sim inside; flyback-card precedent from the sibling unit)

```jsx
<PredictionGate
  question="Two parallel wires carry current in the SAME direction. What do they do to each other?"
  options={[
    { id: 'repel',   label: 'Repel — like the two like-signed charge streams they are' },
    { id: 'attract', label: 'Attract' },
    { id: 'none',    label: 'Nothing — each field circles its own wire and misses the other' },
    { id: 'twist',   label: 'Twist — the force points along the wires' },
  ]}
  getCorrectAnswer={() => 'attract'}
  explanation={
    <span>
      Wire 2 sits in wire 1's circular field <MathWrapper formula="B_1 = \mu_0 I_1 / (2\pi d)" />. Apply{' '}
      <MathWrapper formula="\vec{F} = I_2\,\vec{L} \times \vec{B}_1" />: the force points straight at wire 1.
      The like-charges analogy is exactly the trap — parallel like <em>currents</em> attract; flip one
      current and they repel.
    </span>
  }
  onPredict={(correct) => markPredictionGate('ampere', correct)}
>
  {/* reveal: §3C card + §3D worked example + §3E CC — all gated, so the CC can't leak the answer */}
</PredictionGate>
```

### 3C. Reveal card "LIKE CURRENTS ATTRACT" (amber-accent card, mono uppercase kicker — house style)

Boxed formula (block):

`\frac{F}{l} = \frac{\mu_0 I_1 I_2}{2\pi d}` *(JSX attribute → single backslash; derivation in one line above it: F = B₁I₂l with B₁ = μ₀I₁/(2πd))*

> **The classical ampere.** Set `I_1 = I_2 = 1\,\text{A}` and `d = 1\,\text{m}`:
> `\frac{F}{l} = \frac{4\pi\times10^{-7}}{2\pi} = 2\times10^{-7}\ \text{N/m}`
> For 71 years (1948–2019) this *was* the definition of the ampere: the current producing exactly 2×10⁻⁷ N per metre between ideal parallel wires a metre apart. (Since the 2019 SI revision the ampere is defined by fixing the elementary charge e, and μ₀ became a measured quantity — but to nine digits it is still 4π×10⁻⁷.)

*Hand audit:* μ₀/(2π) = (4π×10⁻⁷)/(2π) = 2×10⁻⁷ ✓ (the π cancels exactly; this is why the number is clean).

### 3D. Worked example "Short-circuit forces on a busbar pair" (inline card, `border-l-2` step pattern; inside the gate)

*Setup:* two switchgear busbars run parallel, `d = 10\,\text{cm}` apart. A fault drives `I = 10\,\text{kA}` through both (same direction).

- **Step 1:** `\frac{F}{l} = \frac{\mu_0 I^2}{2\pi d} = 2\times10^{-7}\,\frac{(10^4)^2}{0.1}`
  *Audit route A:* I₁I₂/d = 10⁸/0.1 = 10⁹; × 2×10⁻⁷ = **200 N/m** ✓.
  *Audit route B (full constants):* numerator 4π×10⁻⁷ × 10⁸ = 4π×10 = 125.664; denominator 2π×0.1 = 0.628319; 125.664/0.628319 = 200.0 ✓.
- **Step 2 — Does this make sense? (2E plausibility rider):** 200 N/m ≈ **20 kgf hanging off every metre** (200/9.81 = 20.4), appearing in milliseconds, attractive — slamming the bars *toward each other*. This is why switchgear busbars are mechanically braced for fault current, not just sized for heat. An answer of 0.002 N/m (exponent slip) should fail your sniff test instantly: nobody would brace for that.

### 3E. ConceptCheck CC-A (new `Q_PARALLEL` const; the section's 4th CC; inside the gate, after §3D)

- **question:** `'Two parallel wires 10 cm apart each carry 100 A in the same direction. The magnetic force per metre of wire between them is:'`
- **options:** `['0.02 N/m, attractive', '0.02 N/m, repulsive', '0.13 N/m, attractive', '2×10⁻⁷ N/m, attractive']`, **correctIndex: 0**
- **explanation:** `'F/l = μ₀I₁I₂/(2πd) = 2×10⁻⁷ × (100 × 100)/0.1 = 0.02 N/m, and same-direction currents attract — each wire sits in the other\'s circular field, and F = IL×B points toward the neighbour. 0.13 N/m is what you get if you drop the 2π; 2×10⁻⁷ N/m is the 1 A / 1 m definition pair, unscaled.'`
- **hints:** tier 1 `'Each wire sits in the other\'s field B = μ₀I/(2πr) — the formula from the marker tooltip. A field then exerts F = BIl on a current.'`; tier 2 `'F/l = μ₀I₁I₂/(2πd), and μ₀/(2π) = 2×10⁻⁷ exactly. Direction: apply F = IL×B to wire 2 in wire 1\'s field.'`; tier 3 `'F/l = 2×10⁻⁷ × 10⁴/0.1 = 2×10⁻⁷ × 10⁵ = 0.02 N/m, pointing toward the other wire (attraction) — option A.'`

*Number audits:* 2×10⁻⁷ × (100·100)/0.1 = 2×10⁻⁷ × 10⁵ = 2×10⁻² = **0.02 N/m** ✓. Dropped-2π distractor: μ₀I₁I₂/d = 4π×10⁻⁷×10⁴/0.1 = 1.2566×10⁻²/0.1 = 0.1257 ≈ **0.13 N/m** ✓ (and 0.02 × 2π = 0.1257 ✓ cross-check).

---

## 4. Content outline — `lorentz` (2.4): the complete force + from particles to wires

**Placement:** all insertions after the existing `Q_FORCE_DIR` ConceptCheck, before `TheoryGuide`. Plus two `EquationBox` row edits. No new gate (nothing interactive is added; the existing sim gate stays).

### 4A. EquationBox edit (JS string literals → DOUBLE backslash)

Prepend one row and relabel one:

```ts
{ label: 'Full force', math: '\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})', color: 'text-indigo-600 dark:text-indigo-400' },
{ label: 'Magnetic part', math: '\\vec{F} = q(\\vec{v} \\times \\vec{B})', color: 'text-amber-600 dark:text-amber-400' },  // was label: 'Force'
{ label: 'On a wire', math: '\\vec{F} = I\\,\\vec{L} \\times \\vec{B}', color: 'text-emerald-600 dark:text-emerald-400' },  // NEW, after 'Radius'
```

### 4B. Theory block "The complete Lorentz force" (h-level card, ungated)

> The sim above lives entirely in the magnetic term — and so has every formula in Part 2 so far. The full law has two halves:

`\vec{F} = q\vec{E} + q\,\vec{v} \times \vec{B}` *(block, boxed — first complete statement in the app)*

> They behave **nothing alike**. The electric half pushes along `\vec{E}` whether the charge moves or not, and **does work** — it is the only half that can change a particle's speed. The magnetic half needs motion, always pushes at right angles to it, and **never does work** (`\vec{F}\cdot\vec{v} = 0` — you watched the sim's speed stay constant for exactly this reason). Accelerators exploit the division of labour: E-fields to speed particles up, B-fields to steer them around the ring.
>
> **The crossed-field trick:** arrange `\vec{E} \perp \vec{B}` so the two forces oppose. For one special speed they cancel exactly:
> `qE = qvB \;\Longrightarrow\; v = \frac{E}{B}`
> Notice what dropped out: **q and m both**. Any particle — proton, electron, ion, either sign — flies straight through if and only if its speed is E/B. That is a **velocity selector**: the front door of every mass spectrometer, delivering a single-speed beam so that the magnetic stage afterwards can sort by mass alone (`r = mv/qB`, the radius you measured above).

### 4C. ConceptCheck CC-L (new `Q_SELECTOR` const; the section's 4th CC)

- **question:** `'A velocity selector has crossed fields E = 1.0×10⁵ V/m and B = 0.5 T, arranged so the electric and magnetic forces on a moving charge oppose. Which particles pass through undeflected?'`
- **options:** `['Those with v = 2.0×10⁵ m/s — regardless of charge or mass', 'Only positive charges with v = 2.0×10⁵ m/s — negative ones deflect the other way', 'Those with v = 5.0×10⁴ m/s', 'Lighter particles, at any speed']`, **correctIndex: 0**
- **explanation:** `'Undeflected means zero net force: qE = qvB, so v = E/B = (1.0×10⁵)/(0.5) = 2.0×10⁵ m/s. The charge cancels — flipping its sign flips BOTH forces, so the balance survives — and mass never enters at all. (5.0×10⁴ is E×B; the selector divides.) This q- and m-blindness is the whole point: it hands the mass spectrometer a single-speed beam.'`
- **hints:** tier 1 `'Straight-line passage = zero net force. Set the two force magnitudes equal.'`; tier 2 `'qE = qvB. Solve for v and watch what cancels.'`; tier 3 `'v = E/B = 1.0×10⁵ / 0.5 = 2.0×10⁵ m/s, for either charge sign and any mass — option A.'`

*Number audits:* v = E/B = 1.0×10⁵/0.5 = **2.0×10⁵ m/s** ✓. Distractor E×B = 1.0×10⁵ × 0.5 = **5.0×10⁴** ✓ (consistent wrong-operation value).

### 4D. Theory block "From particles to wires: F = BIl" (pays the debt §3A forward-referenced)

> A wire is just a pipe of drifting charges, so the magnetic force on it is bookkeeping. Take a straight segment: length `l`, cross-section `A`, carrier density `n` per m³, each carrier with charge `q` drifting at `v_d`:
>
> - Carriers in the segment: `nAl`
> - Force on each: `qv_dB` (field ⊥ wire)
> - Total: `F = (nAl)(qv_dB) = (nAqv_d)(lB)`
>
> But `nAqv_d` **is the current** `I` — the same regrouping that defines it. So:

`F = BIl \qquad\text{(} \perp \text{ case)} \qquad\qquad \vec{F} = I\,\vec{L} \times \vec{B} \qquad\text{(general)}` *(block, boxed)*

> The microscopic drift speed (sub-millimetre per second in copper) and the carrier count both vanish into `I` — the force cares only about the *current*, which is why a wire carrying 10 A feels the same force whether it is copper, aluminium, or a salt solution. Section `{getSectionNumber('ampere')}` already used this to weigh two wires against each other; here is where it comes from.

**Worked example — "Why a loudspeaker works" (inline `border-l-2` step card):**

*Setup:* a voice coil sits in the radial field of a ring magnet, `B = 1.0\,\text{T}` everywhere in the gap. The coil: `N = 100` turns of diameter `25\,\text{mm}`, driven at `I = 0.50\,\text{A}`.

- **Step 1 — wire length in the field:** `l = N \cdot \pi D = 100 \times \pi \times 0.025 = 2.5\pi \approx 7.85\,\text{m}`.
  *Audit:* 100 × 0.025 = 2.5; × π = 7.853982 ✓ — nearly eight metres of wire hiding in a palm-sized coil.
- **Step 2 — force:** `F = BIl = 1.0 \times 0.50 \times 7.85 = 3.93\,\text{N} \approx 3.9\,\text{N}`.
  *Audit:* 0.50 × 7.853982 = 3.926991 ✓. The *radial* field geometry is the clever part: every point of every circular turn crosses B at right angles, so the whole 7.85 m contributes — and the force is axial (in/out), exactly the direction a cone must move.
- **Step 3 — Does this make sense? (2E rider):** the moving mass (coil + cone) is ~10 g, so `a = F/m = 3.93/0.010 \approx 393\,\text{m/s}^2` — about **40 g**.
  *Audit:* 3.927/0.010 = 392.7; /9.81 = 40.03 ✓. Sounds violent, but a cone reproducing 20 kHz reverses direction 40 000 times a second — huge accelerations over micrometre excursions are precisely the job. A DC motor is the same `F = I\vec{L}\times\vec{B}` on each rotor conductor, with the force turned into torque by the lever arm of the rotor radius (that one sentence is the full motor treatment here — see NON-goals).

---

## 5. Content outline — `faraday` (3.1): motional EMF, the rod on rails

**Placement:** all insertions after the existing `Q_LENZ_SIGN` ConceptCheck, before `TheoryGuide`. The section keeps its sim and gate untouched; this is the "worked, not interactive" build (ruling below). New file: one static SVG figure component.

### 5A. Build ruling: worked + static figure, NOT a new interactive sim

The roadmap explicitly allows "interactive or worked". Worked wins because: (1) the section already owns a canvas sim behind a blocking gate — a second interactive bench means a second canvas, rAF loop, dark-mode surface, e2e paint expectations, and a gate-UX decision, for a calculation whose entire point is that *the student can do it by hand*; (2) the energy-loop payoff is a four-number identity (1.6 W = 1.6 W = 1.6 W), which a readout would assert but a hand calculation *proves*; (3) an interactive rod is the natural Phase-3 upgrade and loses nothing by waiting. The figure is presentational (zero controls) → **gate-exempt**, same class as `FigureImage` (record the rationale in a code comment, 2A §7.2 precedent).

### 5B. Theory block "Motional EMF: the rod on rails" (ungated; figure + two derivations)

**`RodOnRailsFigure`** (NEW `src/em/sections/faraday/RodOnRailsFigure.tsx`): static inline SVG, `role="img"`, `aria-label="Conducting rod sliding right on two rails, closing a circuit through a resistor, in a magnetic field into the page"`. Elements: two horizontal rails closed at the left by a resistor zigzag; vertical rod at the right with drag handle styling *omitted* (it does not move); ⊗ grid for B into the page; green `v` arrow pointing right off the rod; loop arrows showing induced current **counter-clockwise** (up the rod, left along the top rail, down through R); orange `F_opp` arrow on the rod pointing left; dimension labels `l` (rod length) and `x` (loop width). Slate/dark-mode classes via Tailwind `fill-slate-…` / `dark:` tokens, matching `FigureImage` card chrome.

**Derivation 1 — the Lorentz view** (cross-ref: "the force you met in Section `{getSectionNumber('lorentz')}`"):

> Drag a conducting rod of length `l` rightward at speed `v` through a field `\vec{B}` (into the page). Every free charge *inside the rod* is carried along at `v`, so each feels `\vec{F} = q\vec{v}\times\vec{B}` — magnitude `qvB`, directed **along the rod** (check it: `\hat{x}\times(-\hat{z}) = +\hat{y}`, up the rod for positive charge). The magnetic force acts like a battery's chemistry: it pumps charge along the rod. Work per unit charge from end to end:

`\mathcal{E} = \frac{W}{q} = \frac{qvB \cdot l}{q} = Blv` *(block, boxed)*

**Derivation 2 — the Faraday view:**

> Same answer, no force argument. The loop's area is `l \cdot x`, so `\Phi = Blx`, and

`|\mathcal{E}| = \left|\frac{d\Phi}{dt}\right| = Bl\frac{dx}{dt} = Blv` *(block)*

> Two different pieces of physics, one number — that agreement is not luck. In this section's sim *you changed B with the loop fixed*; the rod *changes the area with B fixed*. Faraday's law `\mathcal{E} = -N\,d\Phi_B/dt` covers both, and the Lorentz force is the machinery behind the moving-conductor case. This is the generator: every spinning turbine coil in the grid is rods sweeping through field.

### 5C. New EquationBox "Motional EMF (rod on rails)" (`math:` strings → DOUBLE backslash)

```ts
{ label: 'EMF', math: '\\mathcal{E} = Blv' },
{ label: 'Current', math: 'I = Blv/R' },
{ label: 'Drag force', math: 'F = BIl = B^2l^2v/R' },
{ label: 'Energy audit', math: 'P_{mech} = Fv = \\mathcal{E}I = P_{elec}' },
```

### 5D. PredictionGate (blocking; gates the worked-numbers card — which would otherwise leak the answer)

```jsx
<PredictionGate
  question="You pull the rod at a steady 2.0 m/s against the magnetic drag. How does the mechanical power your hand delivers compare with the electrical power dissipated in the resistor?"
  options={[
    { id: 'more',  label: 'More — some power is lost to the magnetic field' },
    { id: 'equal', label: 'Exactly equal' },
    { id: 'less',  label: 'Less — the field contributes energy too' },
    { id: 'zero',  label: 'Zero — constant speed needs no power' },
  ]}
  getCorrectAnswer={() => 'equal'}
  explanation={
    <span>
      Equal — and not approximately. <MathWrapper formula="P_{mech} = Fv = (BIl)v = (Blv)I = \mathcal{E}I = P_{elec}" />:
      the identity is algebra, not coincidence. The field brokers the transaction and keeps nothing — a static
      magnetic field can do no work. ("Zero" is the subtle trap: constant speed means zero <em>net</em> force,
      but the drag F = BIl is real, so your hand pushes — and pushing at speed v is power.)
    </span>
  }
  onPredict={(correct) => markPredictionGate('faraday', correct)}
>
  {/* reveal: §5E worked card + §5F energy-loop card */}
</PredictionGate>
```

### 5E. Worked example "Run the whole loop, by hand" (inside the gate; `border-l-2` step card)

*Setup:* `B = 0.5\,\text{T}` into the page, rod length `l = 0.4\,\text{m}`, pulled at `v = 2.0\,\text{m/s}`; total loop resistance `R = 0.1\,\Omega`.

- **Step 1 — EMF:** `\mathcal{E} = Blv = 0.5 \times 0.4 \times 2.0 = 0.40\,\text{V}`.
  *Audit:* 0.5 × 0.4 = 0.20; × 2.0 = **0.40 V** ✓.
- **Step 2 — current:** `I = \mathcal{E}/R = 0.40/0.10 = 4.0\,\text{A}`. Direction: flux into the page is *growing*, so the induced current opposes it → **counter-clockwise** (up the rod) — Lenz, exactly as drawn in the figure.
- **Step 3 — the drag appears:** that 4.0 A now flows *across* the field, so the rod itself feels the wire force from Section `{getSectionNumber('lorentz')}`: `F = BIl = 0.5 \times 4.0 \times 0.4 = 0.80\,\text{N}`, and `I\vec{L}\times\vec{B}` points **left — against the pull**. Lenz's law has become a measurable force.
  *Audit:* 0.5 × 4.0 = 2.0; × 0.4 = **0.80 N** ✓. Closed-form cross-check: `F = B^2l^2v/R` = 0.25 × 0.16 × 2.0/0.1: 0.25 × 0.16 = 0.04; × 2.0 = 0.08; /0.1 = **0.80 N** ✓ identical.
- **Step 4 — the books balance (the gate's promise):**
  `P_{mech} = Fv = 0.80 \times 2.0 = 1.6\,\text{W}`
  `P_{elec} = \mathcal{E}I = 0.40 \times 4.0 = 1.6\,\text{W}`
  `P_{heat} = I^2R = (4.0)^2 \times 0.1 = 1.6\,\text{W}`
  Three independent routes, one number. *Audits:* 0.8 × 2 = 1.60 ✓; 0.4 × 4 = 1.60 ✓; 16 × 0.1 = 1.60 ✓.

### 5F. Reveal card "THE ENERGY LOOP CLOSES" (amber-accent, mono kicker; inside the gate, after §5E)

> Moving conductor → EMF (`Blv`) → current (`Blv/R`) → opposing force (`B^2l^2v/R`) → and the work done against that force comes back out, joule for joule, as heat in the resistor. **This single loop is ILO 6 in one diagram**: it is why Lenz's law *must* oppose (aid the motion and the loop manufactures free energy), why generators get harder to crank when you draw current from them, and why a magnetic brake needs no brake pads. Next section (`{getSectionNumber('lenz')}`) you will *feel* this drag in the magnet-and-coil sim — now you can also compute it.

### 5G. ConceptCheck CC-F (new `Q_MOTIONAL` const; the section's 4th CC; after the gate)

- **question:** `'An aircraft with a 60 m wingspan flies at 250 m/s through the vertical component of Earth\'s magnetic field, B = 5×10⁻⁵ T. What is the motional EMF between its wingtips?'`
- **options:** `['0.75 V', '0.75 mV', '75 V', 'Zero — there is no closed circuit, so no EMF']`, **correctIndex: 0**
- **explanation:** `'The wings are a flying rod: ε = Blv = 5×10⁻⁵ × 60 × 250 = 0.75 V. An EMF needs no closed circuit — the wingtips simply sit 0.75 V apart, like a battery nobody has connected (it is current that needs the loop). And you could never harvest it: any return wire flies through the same field and develops the same EMF, cancelling around the loop.'`
- **hints:** tier 1 `'The wingspan is the rod, the airspeed is v. Which formula from this block applies?'`; tier 2 `'ε = Blv = 5×10⁻⁵ × 60 × 250. Carry the exponent carefully.'`; tier 3 `'5×10⁻⁵ × 60 = 3×10⁻³; × 250 = 0.75 V — option A. Open-circuit EMF exists without current.'`

*Number audit:* 5×10⁻⁵ × 60 = 3.0×10⁻³; × 250 = **0.75 V** ✓ (and the distractors are exponent slips of the same product: 0.75 mV = ×10⁻³, 75 V = ×10²).

**Direction/consistency audit for the whole rod setup (recorded so review can re-check):** B = −ẑ (into page), rod velocity +x̂. Charge in rod: F = qv×B = qv(x̂×(−ẑ)) = +qvB ŷ (x̂×ẑ = −ŷ) → positive charge pushed UP the rod → conventional current up the rod, i.e. counter-clockwise with the circuit closing leftward ✓. Force on rod: F = I l×B with l = +ŷ l: ŷ×(−ẑ)B = −x̂ B → force −x̂, opposing the +x̂ motion ✓. Flux check: area growing, flux into page increasing, induced current CCW creates out-of-page flux inside the loop, opposing ✓. All three views agree.

---

## 6. Implementation map

| File | Action |
|---|---|
| `src/em/sections/ampere/index.tsx` | EDIT: §3A lead-in, §3B gate + §3C/§3D/§3E gated content, new `Q_PARALLEL` const, `getSectionNumber` import |
| `src/em/sections/lorentz/index.tsx` | EDIT: §4A EquationBox rows, §4B/§4D theory blocks, §4C `Q_SELECTOR` const + CC, `getSectionNumber` import |
| `src/em/sections/faraday/index.tsx` | EDIT: §5B–§5G blocks, new `Q_MOTIONAL` const, figure import, `getSectionNumber` import |
| `src/em/sections/faraday/RodOnRailsFigure.tsx` | **NEW** static SVG figure (§5B), `role="img"` + aria-label, gate-exempt comment |
| `src/em/sections/__tests__/forcesMotionalEmf.test.tsx` | **NEW** page test (§7) |
| `src/em/sections/__tests__/sections.test.tsx` | **EDIT (one line):** the AmpereSection gate test (line 101) uses singular `screen.getByText('Predict First')`, which **throws on multiple matches** once the second ampere gate renders → change to `expect(screen.getAllByText('Predict First')).toHaveLength(2)` (house precedent: `NodalMesh.page.test.tsx` / `CircuitTheorems.page.test.tsx` use exactly this pattern for multi-gate pages). All other assertions are safe: smoke tests check only "Why This Matters" (one `SectionLayout` instance each), and faraday/lorentz have no `Predict First` assertion in this file — verified |
| Canvas sims (lorentz Boris loop, faraday induction, ampere field) | **ZERO changes** |
| `curriculum.ts`, `sectionRegistry.tsx`, count tests, `getSectionNumber.test.ts`, `routeIntegrity`, `e2e/sim-paint.spec.ts` | **ZERO changes** (extend-not-add; the generic e2e gate-walker answers the 2 new gates automatically; `EXPECT_CANVAS` still satisfied by the untouched sims) |

**Components reused:** `PredictionGate` (×2, blocking default, static-reveal pattern per the sibling unit's flyback precedent), `ConceptCheck` via `QuizQuestion` + `toConceptCheck` (×3), `EquationBox` (1 edited + 1 new), `MathWrapper` throughout, existing amber-card / `border-l-2` worked-step house patterns. **Not used:** `WorkedSteps` (still circuits-domain; em must not import circuits — same ruling as the sibling doc; do NOT take a dependency on 2A's hoist), `Tabs`/`LabLayout`/`LabStation`/`GuidedChallenge` (no new bench; existing CHALLENGEs are sim-scripts and the sims are untouched — no edits), `YourTurnPanel` (transmission/circuits pattern; em's CC pipeline is the house pattern here).

**Estimated test additions:** 1 new file, ~9 `it()` blocks (~25 assertions); suite grows by ~9 tests, 0 skips.

---

## 7. Test plan — NEW `forcesMotionalEmf.test.tsx`

Clone the `sections.test.tsx` boilerplate (katex mock returning raw latex in a span, `MemoryRouter` helper; canvas `getContext`/rAF already shimmed by the suite setup). Assertions:

1. **Ampere gate blocks:** render `AmpereSection` → new gate question `/same direction/i` visible; reveal kicker `/LIKE CURRENTS ATTRACT/i` **absent**; no `/skip/i` control anywhere (pins blocking default).
2. **Ampere two gates coexist:** the original sim-gate question `/distance r from a long straight wire/i` still renders alongside the new one (regression pin).
3. **Ampere gate passes:** click "Attract" (the §3B option label, verbatim) then Continue → kicker `/LIKE CURRENTS ATTRACT/i`, `/classical.*ampere/i` (definition note), and busbar text `/200 N\/m|busbar/i` present.
4. **Ampere CC-A:** (after passing the gate) question `/100 A in the same direction/i` renders; clicking `'0.02 N/m, attractive'` shows the explanation (`/2×10⁻⁷/`).
5. **Lorentz full force:** heading `/complete Lorentz force/i` renders; velocity-selector text `/velocity selector/i` present; EquationBox shows the new row (assert stable raw-latex substring `q(\vec{E} + \vec{v} \times \vec{B})` under the katex mock).
6. **Lorentz CC-L:** question `/crossed fields/i` renders; clicking `'Those with v = 2.0×10⁵ m/s — regardless of charge or mass'` shows explanation `/E\/B/`.
7. **Lorentz wire force:** `/From particles to wires/i` heading + `/loudspeaker|voice coil/i` worked example present (and `/7.85|3.9 N/` pins the numbers as rendered strings).
8. **Faraday motional block + figure:** `/Motional EMF/i` heading renders; `getByRole('img', { name: /rod sliding/i })` finds the SVG figure; gate question `/mechanical power/i` visible; `/ENERGY LOOP CLOSES/i` **absent** before passing.
9. **Faraday gate passes + numbers pinned:** click "Exactly equal" + Continue → `/ENERGY LOOP CLOSES/i` present and the worked card shows the literal strings `0.40`, `4.0`, `0.80`, `1.6` (pins the hand-derived chain against silent edits); CC-F `/wingspan/i` renders and the correct option `'0.75 V'` reveals its explanation.

(`progressStore` increments are covered by `progressStore.test.ts`; `markPredictionGate('ampere'|'faraday', …)` wiring follows the existing in-file pattern — do not duplicate store tests.)

---

## 8. Explicit NON-goals (scope fence)

- **No new course section** — zero curriculum/registry/numbering/count-test churn (§2).
- **No edits to `Transformers.tsx`/mutual inductance** — that is the sibling unit (roadmap 2D / work-order "2C"); the two units must not share a PR (mirrored fence in the sibling doc).
- **No canvas-sim changes**: no E-field term added to the lorentz Boris integrator (the velocity selector lives on paper + CC; a crossed-field sim mode is Phase-3 polish), no interactive rod-on-rails bench (§5A ruling — the worked build is deliberate), no changes to the ampere or faraday render loops.
- **No SI-unit retrofit of the lorentz/faraday sims** ("arb. units" readouts) — that is roadmap **2E item 3**, a separate rider; do not let it hitchhike here.
- **No full DC-motor/torque treatment** (μ = NIA, τ = m×B, commutation) — one bridging sentence in §4D only; motors-as-systems are beyond the gap.
- **No Hall-effect block** — the natural neighbour of the drift-velocity derivation, but not the audited gap; resist.
- **No homopolar/Faraday-disc generator, no eddy-current quantification** — the existing eddy FigureImage caption already covers the qualitative story.
- **No `expectedChecks` bump** (ruling §2) and **no GuidedChallenge/TheoryGuide edits** (the CHALLENGEs script the sims; the sims are untouched).
- **No new vendored images** — the one new figure is code (SVG), not an asset hunt.

---

## 9. Verification gates (implementer MUST run, in order)

1. `npx tsc -b` clean; `npx vite build` clean.
2. `npx eslint .` — 0 errors (jsx-a11y hard-enforced: the new SVG must carry `role="img"` + `aria-label`; gates/CCs are existing accessible primitives).
3. **Full suite: `npm test -- --no-file-parallelism`** (binding on the owner's 4-core box — default forks OOM). Expect: all existing tests green with exactly ONE deliberate existing-test edit — the `sections.test.tsx` ampere gate assertion flips to `getAllByText('Predict First')` + `toHaveLength(2)` (see §6; the singular `getByText` would throw on the page's second gate) — plus the new `forcesMotionalEmf.test.tsx` green, 0 skips.
4. **Independent number audit (per-batch entry gate):** a second pair of eyes re-derives every value against §3–§5 before review approval: 2×10⁻⁷ N/m · 200 N/m (two routes) · 20.4 kgf/m · 0.02 N/m + 0.13 N/m distractor · v = 2.0×10⁵ m/s + 5.0×10⁴ distractor · l = 7.85 m · F = 3.93 N · a ≈ 393 m/s² ≈ 40 g · ε = 0.40 V · I = 4.0 A · F = 0.80 N (two routes) · P = 1.6 W (three routes) · 0.75 V — plus the three-view direction audit at the end of §5.
5. **e2e paint net:** `sim-paint.spec.ts` for routes `ampere`, `lorentz`, `faraday` still green — the generic walker must clear the two new gates (if it loops, the gate markup diverged from the `div.border-dashed` + "Predict First" contract: fix the page, not the spec), and the untouched sims keep `EXPECT_CANVAS` satisfied.
6. **Playwright screenshot harness** (PR #9 harness, Phase-2 entry gate): re-shoot `/ampere`, `/lorentz`, `/faraday` at both viewports; owner visual walk: dark mode on the two reveal cards, the new EquationBox rows, and the SVG figure; keyboard-only pass of both new gates; mobile stacking of the worked-step cards.
7. Ship via branch + PR (GitHub REST API; classifier blocks direct-main pushes). **Sequencing (binding):** branch from `main` **after the in-flight `wave0/debt-and-tabs` branch merges** — it touches `src/em/sections/ampere/index.tsx` (verified in the branch diff vs origin/main) and would collide. No file overlap with 2A (`line-impedance`, Part 5) or the mutual-inductance unit (`Transformers.tsx`) — any merge order with those.
