---
name: sympy
description: >
  Use when: symbolic computation, exact algebra, calculus, solving equations
  symbolically, generating LaTeX from math, deriving formulas step by step,
  working with matrices symbolically, physics calculations, converting
  symbolic expressions to numerical code.
  Trigger: "SymPy", "symbolic", "derive", "exact solution", "LaTeX output",
  "step by step", "symbolic math", "phasor", "transfer function",
  "worked example", "exact fractions".
---

# SymPy — Symbolic Mathematics

Generate Python scripts using SymPy for exact symbolic computation. SymPy produces exact results (`sqrt(2)`, not `1.414...`), derives step-by-step solutions, and generates publication-ready LaTeX output.

## When to Use SymPy vs Numerical Tools

| Need | Tool |
|------|------|
| Exact algebraic solution | SymPy |
| Step-by-step derivation | SymPy |
| LaTeX-formatted output | SymPy |
| Verify a formula symbolically | SymPy |
| Process large datasets | NumPy/MATLAB |
| Numerical simulation (ODE, PDE) | MATLAB/SciPy |
| Plotting | Matplotlib (with SymPy's `lambdify`) |

## Workflow

### 1. Define symbols with assumptions

Always declare symbols before use. Assumptions enable better simplification:

```python
from sympy import symbols, Symbol
x, y, z = symbols('x y z')

# With physical constraints
omega = symbols('omega', real=True, positive=True)
n = symbols('n', integer=True)
R, L, C = symbols('R L C', positive=True)
```

Common assumptions: `real`, `positive`, `negative`, `integer`, `rational`, `even`, `odd`, `complex`

### 2. Use exact arithmetic

```python
from sympy import Rational, S, pi, sqrt, oo

# Correct — exact
half = Rational(1, 2)
expr = S(1)/3 * x

# Avoid — introduces floating-point
expr = 0.5 * x    # creates Float(0.5), not Rational(1,2)
```

### 3. Build and manipulate expressions

```python
from sympy import simplify, expand, factor, cancel, collect, trigsimp

simplify(sin(x)**2 + cos(x)**2)  # 1
expand((x + 1)**3)               # x**3 + 3*x**2 + 3*x + 1
factor(x**2 - 1)                 # (x - 1)*(x + 1)
trigsimp(sin(x)/cos(x))          # tan(x)
collect(a*x**2 + b*x**2, x)     # (a + b)*x**2
cancel((x**2 - 1)/(x - 1))      # x + 1
```

### 4. Solve, verify, output

```python
from sympy import solve, solveset, latex, pprint

# Solve
solutions = solve(x**2 - 5*x + 6, x)  # [2, 3]

# Verify
for sol in solutions:
    assert expr.subs(x, sol) == 0

# Output as LaTeX
print(latex(expr))

# Pretty-print to terminal
pprint(expr)
```

### 5. Convert to numerical function when needed

```python
from sympy import lambdify
import numpy as np

f = lambdify(x, expr, 'numpy')
x_vals = np.linspace(0, 10, 1000)
y_vals = f(x_vals)
```

## Patterns

### Solve and verify

```python
from sympy import symbols, solve, simplify

x = symbols('x')
equation = x**2 - 5*x + 6
solutions = solve(equation, x)  # [2, 3]

for sol in solutions:
    assert simplify(equation.subs(x, sol)) == 0
```

### Symbolic-to-numeric pipeline

```python
from sympy import symbols, diff, lambdify, sin
import numpy as np

x = symbols('x')
expr = sin(x**2)
derivative = diff(expr, x)       # 2*x*cos(x**2)
f = lambdify(x, derivative, 'numpy')
result = f(np.linspace(0, 5, 100))
```

### Generate LaTeX documentation

```python
from sympy import symbols, Integral, latex

x = symbols('x')
integral = Integral(x**2, (x, 0, 1))
result = integral.doit()

print(f"${latex(integral)} = {latex(result)}$")
# $\int\limits_{0}^{1} x^{2}\, dx = \frac{1}{3}$
```

### Step-by-step worked example

```python
from sympy import symbols, Eq, solve, diff, latex

x = symbols('x')
f = x**3 - 3*x + 2

# Step 1: Find critical points
f_prime = diff(f, x)
critical = solve(f_prime, x)

# Step 2: Classify using second derivative
f_double_prime = diff(f, x, 2)
for pt in critical:
    val = f_double_prime.subs(x, pt)
    nature = "minimum" if val > 0 else "maximum" if val < 0 else "inflection"
    print(f"x = {pt}: f''({pt}) = {val} -> {nature}")

# Step 3: Output LaTeX
print(f"f(x) = {latex(f)}")
print(f"f'(x) = {latex(f_prime)}")
```

### Differential equation solving

```python
from sympy import symbols, Function, dsolve, Derivative, Eq

x = symbols('x')
f = Function('f')

# Solve ODE: f'' + f = 0
ode = Eq(Derivative(f(x), x, 2) + f(x), 0)
solution = dsolve(ode, f(x))
# f(x) = C1*sin(x) + C2*cos(x)

# With initial conditions
solution_ics = dsolve(ode, f(x), ics={f(0): 1, f(x).diff(x).subs(x, 0): 0})
# f(x) = cos(x)
```

### Vector analysis

```python
from sympy.physics.vector import ReferenceFrame, dot, cross

N = ReferenceFrame('N')
v1 = 3*N.x + 4*N.y + 5*N.z
v2 = 1*N.x + 2*N.y + 3*N.z

d = dot(v1, v2)            # scalar product
c = cross(v1, v2)          # vector product
mag = v1.magnitude()       # |v1|
unit = v1.normalize()      # v1 / |v1|
```

### Unit conversion

```python
from sympy.physics.units import meter, kilogram, second, newton, convert_to

force = 10 * kilogram * meter / second**2
force_N = convert_to(force, newton)
```

## Solver Selection Guide

| Problem type | Function | Example |
|-------------|----------|---------|
| Algebraic equation | `solveset(eq, x)` | `solveset(x**2 - 4, x)` |
| System (linear) | `linsolve(eqs, vars)` | `linsolve([x+y-2, x-y], x, y)` |
| System (nonlinear) | `nonlinsolve(eqs, vars)` | `nonlinsolve([x**2+y-2, x+y**2-3], x, y)` |
| ODE | `dsolve(ode, f(x))` | `dsolve(f(x).diff(x) - f(x), f(x))` |
| General / transcendental | `solve(eq, x)` | `solve(exp(x) - 3, x)` |
| Numerical root | `nsolve(eq, x, guess)` | `nsolve(cos(x) - x, x, 1)` |

## Simplification Strategy

SymPy has multiple simplification functions. Use the right one:

| Function | Best for |
|----------|----------|
| `simplify()` | General (tries multiple methods, slower) |
| `expand()` | Multiply out products and powers |
| `factor()` | Factor polynomials |
| `collect(expr, x)` | Group terms by variable |
| `cancel()` | Cancel common factors in fractions |
| `trigsimp()` | Trig identities |
| `powsimp()` | Combine powers: `x**a * x**b -> x**(a+b)` |
| `expand_trig()` | Expand `sin(a+b)` to `sin(a)cos(b) + ...` |
| `logcombine()` | Combine `log(a) + log(b)` to `log(a*b)` |

If `simplify()` doesn't work, try the specific function. Adding assumptions to symbols (`positive=True`, `real=True`) often helps.

## Common Mistakes to Avoid

1. **Using Python floats instead of exact values** — `0.5 * x` creates `Float(0.5)`, not `Rational(1,2)`. Use `Rational(1,2)` or `S(1)/2`.

2. **Using `subs()` at singularities** — use `limit()` instead. `(sin(x)/x).subs(x, 0)` gives `nan`; `limit(sin(x)/x, x, 0)` gives `1`.

3. **Using `subs()` + `evalf()` in loops** — slow. Use `lambdify()` to create a fast numerical function once, then call it.

4. **Forgetting to define symbols** — `NameError: name 'x' is not defined`. Always start with `symbols()`.

5. **Expecting `integrate()` to add `+ C`** — SymPy returns indefinite integrals without the constant. Add it manually if needed.

6. **Using `parse_expr()` on untrusted input** — this can execute arbitrary Python. Never use it with user-supplied strings in production code.

## Reference Files

| File | Contents |
|------|----------|
| `references/core-symbolic.md` | Symbols, algebra, calculus, equation solving, simplification |
| `references/linear-algebra.md` | Matrices, eigenvalues, decompositions, symbolic linear systems |
| `references/output-codegen.md` | LaTeX generation, lambdify, code generation, printing |
