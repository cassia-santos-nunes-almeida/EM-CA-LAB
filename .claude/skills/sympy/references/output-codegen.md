# Output and Code Generation Reference

## LaTeX Output

```python
from sympy import latex, symbols, Integral, Matrix, sin, sqrt, pi

x = symbols('x')

# Expression to LaTeX
latex(x**2 + 1)                     # 'x^{2} + 1'
latex(Integral(sin(x), (x, 0, pi))) # '\\int\\limits_{0}^{\\pi} \\sin{\\left(x \\right)}\\, dx'
latex(sqrt(x))                      # '\\sqrt{x}'

# Matrix to LaTeX
M = Matrix([[1, 2], [3, 4]])
latex(M)    # '\\left[\\begin{matrix}1 & 2\\\\3 & 4\\end{matrix}\\right]'

# Inline vs display mode
latex(x**2, mode='inline')          # '$x^{2}$'
latex(x**2, mode='equation')        # wraps in equation environment
```

## Pretty Printing

```python
from sympy import init_printing, pprint, pretty

# Enable pretty printing (terminal or notebook)
init_printing()

# Print to terminal with Unicode
pprint(Integral(sqrt(1/x), x))

# Get as string
s = pretty(expr)
```

## String Representations

```python
from sympy import srepr

expr = sin(x)**2

str(expr)         # 'sin(x)**2'
srepr(expr)       # "Pow(sin(Symbol('x')), Integer(2))"
                  # reconstructable with eval(), but avoid on untrusted input
```

## lambdify — Convert to Numerical Function

The primary way to bridge symbolic and numerical computation:

```python
from sympy import symbols, lambdify, sin, cos
import numpy as np

x, y = symbols('x y')
expr = sin(x) + cos(y)

# Single variable
f = lambdify(x, x**2, 'numpy')
f(np.array([1, 2, 3]))             # array([1, 4, 9])

# Multiple variables
f = lambdify((x, y), expr, 'numpy')
f(1.0, 2.0)                         # scalar evaluation
f(np.linspace(0, 5, 100), 0.0)      # array evaluation

# Multiple expressions (returns tuple)
f = lambdify(x, [x**2, x**3], 'numpy')

# Available backends
f = lambdify(x, expr, 'numpy')      # NumPy (fast, array-compatible)
f = lambdify(x, expr, 'math')       # Python math (scalar only)
f = lambdify(x, expr, 'mpmath')     # mpmath (arbitrary precision)
f = lambdify(x, expr, 'scipy')      # SciPy (special functions)
```

**Performance note:** Always use `lambdify` instead of `subs()` + `evalf()` in loops. `lambdify` creates a compiled function; `subs` does symbolic manipulation each time.

## C/Fortran Code Generation

```python
from sympy.utilities.codegen import codegen
from sympy import symbols

x, y = symbols('x y')
expr = x**2 + y**2

# Generate C code
[(c_name, c_code), (h_name, h_header)] = codegen(
    ('distance_squared', expr), 'C', header=False
)
print(c_code)

# Generate Fortran code
[(f_name, f_code), _] = codegen(
    ('my_func', expr), 'F95', header=False
)
```

## Code Printers

For fine-grained control over generated code:

```python
from sympy.printing.c import C99CodePrinter
from sympy.printing.fortran import FCodePrinter

c_code = C99CodePrinter().doprint(expr)
f_code = FCodePrinter().doprint(expr)
```

## Common Subexpression Elimination

Optimize generated code by extracting repeated subexpressions:

```python
from sympy import cse, sin, cos, symbols

x, y = symbols('x y')
expr = sin(x + y)**2 + cos(x + y)**2 + sin(x + y)

replacements, reduced = cse(expr)
# replacements: [(x0, sin(x + y)), (x1, cos(x + y))]
# reduced: [x0**2 + x1**2 + x0]

for var, subexpr in replacements:
    print(f"{var} = {subexpr}")
print(f"result = {reduced[0]}")
```

## Parsing Expressions from Strings

```python
from sympy.parsing.sympy_parser import parse_expr, standard_transformations

expr = parse_expr('x**2 + 2*x + 1')

# With implicit multiplication: '2x' -> 2*x
from sympy.parsing.sympy_parser import implicit_multiplication_application
transformations = standard_transformations + (implicit_multiplication_application,)
expr = parse_expr('2x', transformations=transformations)

# Parse LaTeX
from sympy.parsing.latex import parse_latex
expr = parse_latex(r'\frac{x^2}{y}')    # x**2/y
```

**Security warning:** `parse_expr` can execute arbitrary Python code. Never use it on untrusted or user-supplied strings.

## Exporting to Files

```python
from sympy import latex, symbols, sin

x = symbols('x')
expr = sin(x)**2

# LaTeX file
with open('output.tex', 'w') as f:
    f.write(f"\\begin{{equation}}\n{latex(expr)}\n\\end{{equation}}\n")

# Python function file
f_code = lambdify(x, expr, 'numpy')
# (use inspect.getsource(f_code) or write manually)
```

## Jupyter/Notebook Integration

```python
from sympy import init_printing

# Enable LaTeX rendering in Jupyter
init_printing(use_latex='mathjax')

# Display expressions (renders as formatted math)
from IPython.display import display
display(expr)
```
