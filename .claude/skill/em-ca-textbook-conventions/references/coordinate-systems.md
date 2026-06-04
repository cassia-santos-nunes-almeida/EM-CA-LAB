# Coordinate systems

Sources: Ulaby Ch 3, Ida Ch 1. They agree. The course uses their shared
convention.

## The three systems

### Cartesian (rectangular)

Coordinates: `(x, y, z)`
Unit vectors: `x-hat, y-hat, z-hat`
Right-handed: `x-hat cross y-hat = z-hat`

Differential elements:
- Length: `dl = x-hat dx + y-hat dy + z-hat dz`
- Surface (z-const): `dS = z-hat dx dy`
- Volume: `dV = dx dy dz`

### Cylindrical

Coordinates: `(r, phi, z)`
- `r`: radial distance from z axis, `r >= 0`
- `phi`: azimuthal angle from x axis, `0 <= phi < 2 pi`
- `z`: height above xy plane

Unit vectors: `r-hat, phi-hat, z-hat`
Right-handed: `r-hat cross phi-hat = z-hat`

Differential elements:
- Length: `dl = r-hat dr + phi-hat r dphi + z-hat dz`
- Surface (r-const cylinder): `dS = r-hat r dphi dz`
- Volume: `dV = r dr dphi dz`

**Important:** The unit vectors `r-hat` and `phi-hat` depend on position
(they rotate with phi). Do not pull them out of integrals that span phi.

### Spherical

Coordinates: `(R, theta, phi)`
- `R`: radial distance from origin, `R >= 0`
- `theta`: polar angle from z axis, `0 <= theta <= pi`
- `phi`: azimuthal angle from x axis, `0 <= phi < 2 pi`

Unit vectors: `R-hat, theta-hat, phi-hat`
Right-handed: `R-hat cross theta-hat = phi-hat`

Differential elements:
- Length: `dl = R-hat dR + theta-hat R dtheta + phi-hat R sin(theta) dphi`
- Surface (R-const sphere): `dS = R-hat R^2 sin(theta) dtheta dphi`
- Volume: `dV = R^2 sin(theta) dR dtheta dphi`

## Hard rule: spherical R, not r

Both Ulaby and Ida use **capital R** for spherical radial coordinate and
**lowercase r** for cylindrical radial coordinate. This is the course
convention. Never use lowercase `r` for spherical radius, even in crowded
equations.

This convention eliminates the ambiguity that appears in some physics
texts where `r` is used for both.

## Operators

Full gradient, divergence, curl, and Laplacian expressions in all three
systems are on the Ulaby formula sheet (`ulaby_constants_and_formulas.pdf`,
page 2). Reproduce from there when needed.

Key reminders when writing them:
- **Cylindrical divergence** has a `1/r d/dr (r A_r)` term, not a plain
  `d A_r / dr`.
- **Spherical divergence** has a `1/R^2 d/dR (R^2 A_R)` term.
- **Spherical curl** has a `1/(R sin theta)` factor outside.

## Transformation between systems

When transforming unit vectors, use the dot-product method:
`A_x = A . x-hat = (A_r r-hat + A_phi phi-hat + A_z z-hat) . x-hat`

The transformation matrix for cylindrical to Cartesian is:
```
[A_x]   [cos phi  -sin phi  0] [A_r  ]
[A_y] = [sin phi   cos phi  0] [A_phi]
[A_z]   [0         0        1] [A_z  ]
```

When transforming a vector field defined at multiple points, transform
**component by component at each point**. Do not transform once and apply
globally; the rotation depends on `phi` (or `theta`, `phi` for spherical).

## Choosing a system

Pick the system that matches the geometry's symmetry:

| Geometry | Preferred system |
|---|---|
| Infinite straight wire | Cylindrical |
| Coaxial cable | Cylindrical |
| Rectangular waveguide | Cartesian |
| Point charge | Spherical |
| Sphere, dipole | Spherical |
| Solenoid on z axis | Cylindrical |
| Toroid | Cylindrical with shifted origin, or local cylindrical |

Using the "wrong" system is not an error, just more algebra. Match the
symmetry and most boundary surfaces collapse to constant-coordinate
surfaces.
