# Core Symbolic Computation Reference

## Symbol Creation

```python
from sympy import symbols, Symbol, Function

# Multiple symbols
x, y, z = symbols('x y z')
a, b, c = symbols('a b c', real=True, positive=True)
n, m = symbols('n m', integer=True)

# Function symbols (for ODEs)
f = Function('f')
```

## Substitution and Evaluation

```python
expr = x**2 + 2*x + 1

# Substitute values
expr.subs(x, 3)              # 16
expr.subs({x: 2, y: 3})      # multiple substitutions

# Numerical evaluation
from sympy import pi, sqrt
sqrt(8).evalf()               # 2.82842712474619
pi.evalf(50)                  # 50 digits of precision

# Evaluate with substitution
expr.evalf(subs={x: 1.5})
```

## Simplification

```python
from sympy import (simplify, expand, factor, collect, cancel,
                   trigsimp, expand_trig, powsimp, logcombine,
                   expand_log, apart, together)

# General
simplify(sin(x)**2 + cos(x)**2)       # 1

# Polynomials
expand((x + 1)**3)                     # x**3 + 3*x**2 + 3*x + 1
factor(x**3 - x**2 + x - 1)           # (x - 1)*(x**2 + 1)
collect(a*x**2 + b*x**2 + c*x, x)     # (a + b)*x**2 + c*x

# Fractions
cancel((x**2 + 2*x + 1)/(x**2 + x))  # (x + 1)/x
apart(1/(x**2 - 1))                   # partial fractions
together(1/x + 1/y)                   # (x + y)/(x*y)

# Trigonometric
trigsimp(sin(x)**2 + cos(x)**2)        # 1
trigsimp(sin(x)/cos(x))               # tan(x)
expand_trig(sin(x + y))               # sin(x)*cos(y) + sin(y)*cos(x)

# Powers and logarithms
powsimp(x**a * x**b)                  # x**(a + b)
expand_log(log(x*y), force=True)      # log(x) + log(y)
logcombine(log(x) + log(y), force=True)  # log(x*y)
```

## Calculus

### Derivatives

```python
from sympy import diff, Derivative

diff(x**3, x)                   # 3*x**2
diff(x**4, x, 3)                # 24*x (third derivative)
diff(x**2*y**3, x, y)           # 6*x*y**2 (mixed partial)

# Unevaluated (for display/LaTeX)
d = Derivative(f(x), x)
d.doit()                        # evaluates
```

### Integrals

```python
from sympy import integrate, Integral, oo

# Indefinite (no constant of integration added)
integrate(x**2, x)                          # x**3/3
integrate(exp(x)*sin(x), x)                # exp(x)*sin(x)/2 - exp(x)*cos(x)/2

# Definite
integrate(x**2, (x, 0, 1))                 # 1/3
integrate(exp(-x), (x, 0, oo))             # 1

# Multiple
integrate(x*y, (x, 0, 1), (y, 0, 1))      # 1/4

# Unevaluated (for display/LaTeX)
I = Integral(x**2, (x, 0, 1))
I.doit()                                    # 1/3
```

### Limits

```python
from sympy import limit, oo

limit(sin(x)/x, x, 0)           # 1
limit(1/x, x, oo)               # 0
limit(1/x, x, 0, '+')           # oo
limit(1/x, x, 0, '-')           # -oo

# Use limit() at singularities, not subs()
limit((x**2 - 1)/(x - 1), x, 1)  # 2
```

### Series Expansion

```python
from sympy import series

series(sin(x), x, 0, 6)         # x - x**3/6 + x**5/120 + O(x**6)
series(exp(x), x, 0, 4)         # 1 + x + x**2/2 + x**3/6 + O(x**4)

# Remove O() term
series(exp(x), x, 0, 4).removeO()  # 1 + x + x**2/2 + x**3/6
```

## Equation Solving

### Algebraic Equations

```python
from sympy import solve, solveset, Eq, S

# solveset (primary — returns sets)
solveset(x**2 - 4, x)                   # {-2, 2}
solveset(x**2 + 1, x, domain=S.Reals)   # EmptySet
solveset(Eq(x**2, 4), x)                # {-2, 2}

# solve (legacy but flexible — returns lists)
solve(x**2 - 4, x)                      # [-2, 2]
solve(exp(x) - 3, x)                    # [log(3)]

# Polynomial roots with multiplicities
from sympy import roots
roots(x**3 - 6*x**2 + 9*x, x)          # {0: 1, 3: 2}
```

### Systems of Equations

```python
from sympy import linsolve, nonlinsolve

# Linear systems
linsolve([x + y - 2, x - y], x, y)          # {(1, 1)}

# From matrix form (augmented matrix)
from sympy import Matrix
linsolve(Matrix([[1, 1, 2], [1, -1, 0]]), x, y)

# Nonlinear systems
nonlinsolve([x**2 + y - 2, x + y**2 - 3], x, y)
```

### Differential Equations

```python
from sympy import Function, dsolve, Derivative, Eq

f = Function('f')

# First order: f' = f
dsolve(Derivative(f(x), x) - f(x), f(x))
# Eq(f(x), C1*exp(x))

# With initial conditions
dsolve(Derivative(f(x), x) - f(x), f(x), ics={f(0): 1})
# Eq(f(x), exp(x))

# Second order: f'' + f = 0
dsolve(Derivative(f(x), x, 2) + f(x), f(x))
# Eq(f(x), C1*sin(x) + C2*cos(x))

# Second order with ICs
dsolve(Derivative(f(x), x, 2) + f(x), f(x),
       ics={f(0): 1, f(x).diff(x).subs(x, 0): 0})
# Eq(f(x), cos(x))
```

### Numerical Root-Finding

```python
from sympy import nsolve, cos

# When no closed-form solution exists
nsolve(cos(x) - x, x, 1)        # 0.739085133215161
```

## Special Constants and Functions

```python
from sympy import (pi, E, I, oo, zoo, nan,
                   sin, cos, tan, asin, acos, atan, atan2,
                   sinh, cosh, tanh,
                   exp, log, sqrt, Abs,
                   gamma, beta, erf, besselj, bessely,
                   legendre, hermite, chebyshevt,
                   Heaviside, DiracDelta,
                   Rational, Integer, S)
```

## Common Assumptions Reference

```python
x = symbols('x', real=True)        # x is real
x = symbols('x', positive=True)    # x > 0
x = symbols('x', negative=True)    # x < 0
x = symbols('x', integer=True)     # x is integer
x = symbols('x', rational=True)    # x is rational
x = symbols('x', even=True)        # x is even integer
x = symbols('x', odd=True)         # x is odd integer
x = symbols('x', complex=True)     # x is complex (default)
x = symbols('x', finite=True)      # x is not oo/-oo

# Effect on simplification:
x = symbols('x', positive=True)
sqrt(x**2)    # x  (not Abs(x))
```
