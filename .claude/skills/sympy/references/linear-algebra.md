# Matrices and Linear Algebra Reference

## Matrix Creation

```python
from sympy import Matrix, eye, zeros, ones, diag, symbols

# From rows
M = Matrix([[1, 2], [3, 4]])

# Vectors
v = Matrix([1, 2, 3])              # column vector
v = Matrix([[1, 2, 3]])            # row vector

# Special matrices
I = eye(3)                          # 3x3 identity
Z = zeros(2, 3)                     # 2x3 zeros
O = ones(3, 2)                      # 3x2 ones
D = diag(1, 2, 3)                   # diagonal

# Symbolic entries
a, b, c, d = symbols('a b c d')
M = Matrix([[a, b], [c, d]])
```

## Access and Shape

```python
M = Matrix([[1, 2, 3], [4, 5, 6]])

M.shape          # (2, 3)
M.rows           # 2
M.cols           # 3

M[0, 0]          # 1 (zero-indexed)
M[1, 2]          # 6
M.row(0)         # Matrix([[1, 2, 3]])
M.col(1)         # Matrix([[2], [5]])
M[0:2, 0:2]      # top-left 2x2 submatrix
```

## Arithmetic

```python
A = Matrix([[1, 2], [3, 4]])
B = Matrix([[5, 6], [7, 8]])

C = A + B                           # addition
C = A - B                           # subtraction
C = 2 * A                           # scalar multiplication
C = A * B                           # matrix multiplication
C = A.multiply_elementwise(B)       # Hadamard product
C = A**2                            # A * A
```

## Transpose, Inverse, Determinant

```python
M.T                     # transpose
M.conjugate()           # complex conjugate
M.H                     # conjugate transpose (Hermitian)

M.det()                 # determinant
M.inv()                 # inverse (same as M**-1)
M.is_invertible()       # check invertibility

M.trace()               # sum of diagonal
```

## Solving Linear Systems

```python
# Ax = b
A = Matrix([[1, 2], [3, 4]])
b = Matrix([5, 6])
x = A.solve(b)

# Least squares (overdetermined)
x = A.solve_least_squares(b)

# Using linsolve
from sympy import linsolve, symbols
x, y = symbols('x y')
linsolve([x + y - 2, x - y], x, y)        # {(1, 1)}
linsolve((A, b), x, y)                     # matrix form
```

## Row Echelon Form and Rank

```python
M = Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

rref_M, pivots = M.rref()    # reduced row echelon form + pivot columns
M.rank()                      # 2
```

## Nullspace, Column Space, Row Space

```python
null = M.nullspace()          # basis for nullspace (kernel)
col = M.columnspace()         # basis for column space (range)
row = M.rowspace()            # basis for row space
```

## Eigenvalues and Eigenvectors

```python
M = Matrix([[1, 2], [2, 1]])

# Eigenvalues with multiplicities
M.eigenvals()                 # {3: 1, -1: 1}

# Eigenvectors
M.eigenvects()                # [(eigenval, mult, [eigenvectors]), ...]

# Diagonalization: M = P*D*P^-1
M.is_diagonalizable()
P, D = M.diagonalize()

# Characteristic polynomial
from sympy import symbols
lam = symbols('lambda')
M.charpoly(lam)

# Jordan normal form (non-diagonalizable)
P, J = M.jordan_form()
```

## Matrix Decompositions

```python
# LU decomposition
L, U, perm = M.LUdecomposition()

# QR decomposition
Q, R = M.QRdecomposition()

# Cholesky (symmetric positive definite)
L = M.cholesky()              # M = L*L.T

# SVD
U, S, V = M.singular_value_decomposition()
```

## Gram-Schmidt Orthogonalization

```python
vectors = [Matrix([1, 2, 3]), Matrix([4, 5, 6])]
ortho = Matrix.orthogonalize(*vectors)
ortho_norm = Matrix.orthogonalize(*vectors, normalize=True)
```

## Matrix Functions

```python
from sympy import exp, sin, cos

M = Matrix([[0, 1], [-1, 0]])

exp(M)                          # matrix exponential
```

## Sparse Matrices

```python
from sympy import SparseMatrix

# Only stores nonzero entries
S = SparseMatrix(1000, 1000, {(0, 0): 1, (100, 100): 2})
S = SparseMatrix(M)            # convert from dense
```

## Useful Patterns

### Change of basis

```python
# P: columns are new basis vectors
P = Matrix([[1, 1], [1, -1]])
P_inv = P.inv()

v = Matrix([3, 4])
v_new_basis = P_inv * v
```

### Projection matrix

```python
# Project onto column space of A
A = Matrix([[1, 0], [0, 1], [1, 1]])
P = A * (A.T * A).inv() * A.T
```

### Symbolic determinant

```python
a, b, c, d = symbols('a b c d')
M = Matrix([[a, b], [c, d]])
M.det()                         # a*d - b*c
M.inv()                         # symbolic inverse
```
