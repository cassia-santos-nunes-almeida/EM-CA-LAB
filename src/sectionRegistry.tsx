import { lazy, type ComponentType } from 'react';

// The ONE place the presentation layer reaches into the domain folders. Code
// stays grouped by domain (@circuits/@em/@transmission); this registry maps each
// curriculum section id to its lazy-loaded component. It lives at src/ root (not
// in shared/) precisely because shared/ must never import a domain. A route
// integrity test asserts these keys are exactly ALL_SECTIONS.

// Retry a dynamic import once on failure (handles a stale service-worker cache).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch(() => {
      const reloaded = sessionStorage.getItem('chunk-reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem('chunk-reload');
      return importFn();
    }),
  );
}

export const SECTION_LOADERS: Record<string, ComponentType> = {
  // ── Part 1 · Circuit Analysis, Laplace & Transients (circuits) ──────────
  'component-physics': lazyRetry(() => import('@circuits/components/modules/ComponentPhysics').then((m) => ({ default: m.ComponentPhysics }))),
  'circuit-analysis': lazyRetry(() => import('@circuits/components/modules/TimeDomain').then((m) => ({ default: m.TimeDomain }))),
  'nodal-mesh-analysis': lazyRetry(() => import('@circuits/components/modules/NodalMesh').then((m) => ({ default: m.NodalMesh }))),
  'circuit-theorems': lazyRetry(() => import('@circuits/components/modules/CircuitTheorems').then((m) => ({ default: m.CircuitTheorems }))),
  'switched-circuits': lazyRetry(() => import('@circuits/components/modules/SwitchedCircuits').then((m) => ({ default: m.SwitchedCircuits }))),
  'laplace-theory': lazyRetry(() => import('@circuits/components/modules/LaplaceTheory').then((m) => ({ default: m.LaplaceTheory }))),
  'partial-fractions': lazyRetry(() => import('@circuits/components/modules/PartialFractions').then((m) => ({ default: m.PartialFractions }))),
  's-domain': lazyRetry(() => import('@circuits/components/modules/SDomainAnalysis').then((m) => ({ default: m.SDomainAnalysis }))),
  'interactive-lab': lazyRetry(() => import('@circuits/components/modules/InteractiveLab').then((m) => ({ default: m.InteractiveLab }))),

  // ── Parts 2–4 · Electromagnetism (em) ───────────────────────────────────
  'math-vectors': lazyRetry(() => import('@em/sections/math-vectors').then((m) => ({ default: m.MathVectorsSection }))),
  coulomb: lazyRetry(() => import('@em/sections/coulomb').then((m) => ({ default: m.CoulombSection }))),
  'math-integrals': lazyRetry(() => import('@em/sections/math-integrals').then((m) => ({ default: m.MathIntegralsSection }))),
  gauss: lazyRetry(() => import('@em/sections/gauss').then((m) => ({ default: m.GaussSection }))),
  ampere: lazyRetry(() => import('@em/sections/ampere').then((m) => ({ default: m.AmpereSection }))),
  lorentz: lazyRetry(() => import('@em/sections/lorentz').then((m) => ({ default: m.LorentzSection }))),
  faraday: lazyRetry(() => import('@em/sections/faraday').then((m) => ({ default: m.FaradaySection }))),
  lenz: lazyRetry(() => import('@em/sections/lenz').then((m) => ({ default: m.LenzSection }))),
  'magnetic-circuits': lazyRetry(() => import('@em/sections/magnetic-circuits').then((m) => ({ default: m.MagneticCircuitsSection }))),
  maxwell: lazyRetry(() => import('@em/sections/maxwell').then((m) => ({ default: m.MaxwellSection }))),
  'em-wave': lazyRetry(() => import('@em/sections/em-wave').then((m) => ({ default: m.EMWaveSection }))),
  polarization: lazyRetry(() => import('@em/sections/polarization').then((m) => ({ default: m.PolarizationSection }))),

  // ── Parts 3–5 · Transmission lines & devices (transmission) ─────────────
  transformers: lazyRetry(() => import('@transmission/components/modules/Transformers').then((m) => ({ default: m.Transformers }))),
  'math-phasors': lazyRetry(() => import('@transmission/components/modules/PhasorAlgebra').then((m) => ({ default: m.PhasorAlgebra }))),
  'lumped-distributed': lazyRetry(() => import('@transmission/components/modules/LumpedDistributed').then((m) => ({ default: m.LumpedDistributed }))),
  'transmission-lines': lazyRetry(() => import('@transmission/components/modules/TransmissionLines').then((m) => ({ default: m.TransmissionLines }))),
  'line-impedance': lazyRetry(() => import('@transmission/components/modules/LineImpedance').then((m) => ({ default: m.LineImpedance }))),
  transients: lazyRetry(() => import('@transmission/components/modules/Transients').then((m) => ({ default: m.Transients }))),
  antennas: lazyRetry(() => import('@transmission/components/modules/Antennas').then((m) => ({ default: m.Antennas }))),
};
