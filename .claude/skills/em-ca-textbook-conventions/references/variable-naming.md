# Variable naming

Canonical symbols for course materials, sourced from the primary book for
each topic.

## Circuits (Nilsson and Riedel, Electric Circuits 11e)

| Quantity | Symbol | Unit | Notes |
|---|---|---|---|
| Voltage (instantaneous) | `v`, `v(t)` | V | lowercase for time-varying |
| Voltage (DC or constant) | `V` | V | uppercase for constants |
| Current (instantaneous) | `i`, `i(t)` | A | |
| Current (DC) | `I` | A | |
| Resistance | `R` | Ohm | |
| Conductance | `G` | S | `G = 1/R` |
| Inductance | `L` | H | |
| Capacitance | `C` | F | |
| Charge | `q`, `q(t)` | C | |
| Power | `p`, `p(t)` | W | instantaneous; `P` for average |
| Energy | `w`, `w(t)` | J | Nilsson uses `w`, not `E`, to avoid clash with electric field |
| Impedance | `Z` | Ohm | complex; phasor domain |
| Admittance | `Y` | S | `Y = 1/Z` |
| Flux linkage | `lambda`, `lambda(t)` | Wb-turns | Faraday-form circuit derivations only |
| Mutual inductance | `M` | H | always between pairs of inductors |
| Angular frequency | `omega` | rad/s | |
| Frequency | `f` | Hz | Nilsson uses lowercase `f`. Not to be confused with flux |
| Phase angle | `phi`, `theta` | rad or deg | |
| Time constant | `tau` | s | |
| Laplace variable | `s` | 1/s | complex frequency |
| Transfer function | `H(s)` | -- | |
| RMS value | `Vrms`, `Irms` | V, A | from `Vm / sqrt(2)` |
| Maximum amplitude | `Vm`, `Im` | V, A | peak value of sinusoid |

### Passive sign convention reminders

With current reference `i` entering the + terminal:
- `v = L di/dt` for an inductor
- `i = C dv/dt` for a capacitor
- `v = R i` for a resistor
- `p = v i` (positive means absorbing power)

## Electromagnetics (Ulaby, Fundamentals of Applied Electromagnetics 7e)

| Quantity | Symbol | Unit |
|---|---|---|
| Electric field intensity | `E` (bold) | V/m |
| Electric flux density | `D` (bold) | C/m^2 |
| Magnetic field intensity | `H` (bold) | A/m |
| Magnetic flux density | `B` (bold) | T |
| Electric potential | `V` | V |
| Magnetic vector potential | `A` (bold) | Wb/m |
| Magnetic flux | `Phi` | Wb |
| Flux linkage (static) | `Lambda` | Wb |
| Permittivity | `epsilon` | F/m |
| Permittivity of free space | `epsilon_0` | 8.854e-12 F/m |
| Permeability | `mu` | H/m |
| Permeability of free space | `mu_0` | 4 pi e-7 H/m |
| Conductivity | `sigma` | S/m |
| Volume charge density | `rho_v` | C/m^3 |
| Surface charge density | `rho_s` | C/m^2 |
| Line charge density | `rho_l` | C/m |
| Volume current density | `J` (bold) | A/m^2 |
| Surface current density | `Js` (bold) | A/m |
| Surface of integration | `S` | m^2 |
| Conductor cross-section | `A` | m^2 |
| Wavelength | `lambda` | m | in EM, lambda is wavelength, not flux linkage. Context disambiguates. |
| Intrinsic impedance | `eta` | Ohm |
| Propagation constant | `gamma` | 1/m |

### Vector and phasor typography

- Bold roman for vectors: `E`, `B`, `H`, `J`
- Italic non-bold for scalars: `E`, `R`, `V`
- Bold roman with circumflex for unit vectors: `x-hat`, `phi-hat`, `R-hat`
- Tilde over a letter for phasors: `E-tilde` is the phasor of `E(t)`

## Magnetic circuits

Used in Nilsson Ch 6 Practical Perspective and Ida Ch 9. Follows Ida's
notation since Ida treats magnetic circuits as a full topic.

| Quantity | Symbol | Unit |
|---|---|---|
| Magnetomotive force (mmf) | `F` or `F_m` | A-turns |
| Reluctance | `R_m` or `Re` | A-turns/Wb = 1/H |
| Magnetic flux | `Phi` | Wb |
| Permeance | `P_m` | H |

Use `R_m` (not plain `R`) for reluctance when resistance is also present
in the derivation. When drawing a magnetic circuit diagram in
CircuiTikZ/TikZ, label branches with `R_m` explicitly.

## Conflict notes

The collisions students run into:

- **`lambda`** is flux linkage in Nilsson Ch 6 and wavelength in Ulaby
  Ch 7 onward. Context always disambiguates.
- **`A`** is conductor cross-section area in circuits/resistance contexts
  and magnetic vector potential in field contexts. Never use both in the
  same equation.
- **`phi`** is phase angle in circuits and azimuthal angle in fields.
  Never use both in the same equation.
- **`E`** is energy only in physics contexts; in EM it is electric field
  and in circuits it is energy (though Nilsson uses `w` to avoid the
  clash). Prefer `w` for energy in course materials.

See [known-conflicts.md](known-conflicts.md) for resolution rules when
these collide within a single derivation.
