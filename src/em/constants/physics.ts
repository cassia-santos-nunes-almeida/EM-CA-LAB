import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BookOpen,
  Orbit,
  CircleDot,
  Move,
  Zap,
  Magnet,
  Radio,
  Layers,
  Home,
  Cpu,
} from 'lucide-react';

/** Canvas drawing color palette */
export const COLORS = {
  E_FIELD: '#dc2626',
  B_FIELD: '#2563eb',
  CURRENT: '#d97706',
  POWER: '#9333ea',
  TEXT_MAIN: '#1e293b',
  TEXT_MUTED: '#94a3b8',
  AXIS: '#475569',
  GRID: '#e2e8f0',
} as const;

/** Dark mode canvas colors */
export const COLORS_DARK = {
  E_FIELD: '#ef4444',
  B_FIELD: '#60a5fa',
  CURRENT: '#fbbf24',
  POWER: '#a78bfa',
  TEXT_MAIN: '#f1f5f9',
  TEXT_MUTED: '#64748b',
  AXIS: '#94a3b8',
  GRID: '#334155',
} as const;

export type ColorKey = keyof typeof COLORS;

/** EM Wave view modes */
export const WaveViewMode = {
  VIEW_2D: 'EM Wave 2D',
  VIEW_3D: 'EM Wave 3D',
  VIEW_VI: 'AC Phasors',
  VIEW_PHASOR_SYNC: 'Phasor Sync',
} as const;

export type WaveViewModeType = (typeof WaveViewMode)[keyof typeof WaveViewMode];

/** Module definition used for routing, sidebar, and navigation */
export interface ModuleDefinition {
  id: string;
  path: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  track?: 'electrostatics' | 'magnetostatics' | 'induction' | 'capstone';
}

export const MODULES: ModuleDefinition[] = [
  {
    id: 'overview',
    path: '/',
    label: 'Overview',
    shortLabel: 'Overview',
    icon: Home,
    description: 'Introduction to Electromagnetics & AC Circuit Analysis',
  },
  // ── Electrostatics ────────────────────────────────────────────────
  {
    id: 'coulomb',
    path: '/coulomb',
    label: "Coulomb's Law",
    shortLabel: 'Coulomb',
    icon: CircleDot,
    description: 'Electrostatic force between point charges',
    track: 'electrostatics',
  },
  {
    id: 'gauss',
    path: '/gauss',
    label: "Gauss's Law",
    shortLabel: 'Gauss',
    icon: Orbit,
    description: 'Electric flux and closed surface integrals',
    track: 'electrostatics',
  },
  // ── Magnetostatics ────────────────────────────────────────────────
  {
    id: 'ampere',
    path: '/ampere',
    label: "Ampère's Law",
    shortLabel: 'Ampère',
    icon: Activity,
    description: 'Magnetic fields from steady currents',
    track: 'magnetostatics',
  },
  {
    id: 'lorentz',
    path: '/lorentz',
    label: 'Lorentz Force',
    shortLabel: 'Lorentz',
    icon: Move,
    description: 'Force on charged particles in EM fields',
    track: 'magnetostatics',
  },
  // ── Induction & Waves ─────────────────────────────────────────────
  {
    id: 'faraday',
    path: '/faraday',
    label: "Faraday's Law",
    shortLabel: 'Faraday',
    icon: Zap,
    description: 'Electromagnetic induction and changing flux',
    track: 'induction',
  },
  {
    id: 'lenz',
    path: '/lenz',
    label: "Lenz's Law",
    shortLabel: 'Lenz',
    icon: Magnet,
    description: 'Direction of induced EMF opposes change',
    track: 'induction',
  },
  {
    id: 'em-wave',
    path: '/em-wave',
    label: 'EM Waves',
    shortLabel: 'EM Wave',
    icon: Radio,
    description: 'Electromagnetic wave propagation and AC phasors',
    track: 'induction',
  },
  {
    id: 'polarization',
    path: '/polarization',
    label: 'Polarization',
    shortLabel: 'Polarization',
    icon: Layers,
    description: 'Linear, circular, and elliptical polarization states',
    track: 'induction',
  },
  // ── Capstone ──────────────────────────────────────────────────────
  {
    id: 'maxwell',
    path: '/maxwell',
    label: "Maxwell's Equations",
    shortLabel: 'Maxwell',
    icon: BookOpen,
    description: "The four fundamental laws unifying electricity and magnetism",
    track: 'capstone',
  },
  {
    id: 'magnetic-circuits',
    path: '/magnetic-circuits',
    label: 'Magnetic Circuits',
    shortLabel: 'Mag Circuits',
    icon: Cpu,
    description: 'From fields to devices — flux, reluctance, and inductance',
    track: 'capstone',
  },
];

/** Learning track metadata for the overview flowchart */
export const LEARNING_TRACKS = [
  {
    id: 'electrostatics',
    label: 'Electrostatics',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    accentColor: '#dc2626',
    modules: ['coulomb', 'gauss'],
  },
  {
    id: 'magnetostatics',
    label: 'Magnetostatics',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    accentColor: '#2563eb',
    modules: ['ampere', 'lorentz'],
  },
  {
    id: 'induction',
    label: 'Induction & Waves',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    accentColor: '#d97706',
    modules: ['faraday', 'lenz', 'em-wave', 'polarization'],
  },
];

/** Get adjacent modules for ModuleNavigation */
export function getAdjacentModules(currentId: string) {
  const idx = MODULES.findIndex((m) => m.id === currentId);
  return {
    prev: idx > 0 ? MODULES[idx - 1] : null,
    next: idx < MODULES.length - 1 ? MODULES[idx + 1] : null,
  };
}
