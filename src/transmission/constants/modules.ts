export const MODULE_URLS = {
  module1: import.meta.env.VITE_MODULE1_URL || 'https://em-ac-lab-module1.vercel.app',
  module2: import.meta.env.VITE_MODULE2_URL || 'https://em-ac-lab-module2.vercel.app',
  module3: import.meta.env.VITE_MODULE3_URL || 'https://em-ac-lab-module3.vercel.app',
} as const;

export interface ModuleSection {
  /** Stable id — matches the progress-store section id used by markVisited */
  id: string;
  /** Router path */
  path: string;
  /** Display label */
  label: string;
}

/** Ordered course sections, used for prev/next module navigation. */
export const MODULE_SECTIONS: ModuleSection[] = [
  { id: 'overview', path: '/', label: 'Overview' },
  { id: 'transformers', path: '/transformers', label: 'Transformers' },
  { id: 'lumped-distributed', path: '/lumped-distributed', label: 'Lumped to Distributed' },
  { id: 'transmission-lines', path: '/transmission-lines', label: 'Transmission Lines' },
  { id: 'transients', path: '/transients', label: 'Transients' },
  { id: 'antennas', path: '/antennas', label: 'Antennas' },
];

/** Returns the previous/next section relative to the given section id (null at the ends). */
export function getAdjacentModules(currentId: string): {
  prev: ModuleSection | null;
  next: ModuleSection | null;
} {
  const index = MODULE_SECTIONS.findIndex((m) => m.id === currentId);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? MODULE_SECTIONS[index - 1] : null,
    next: index < MODULE_SECTIONS.length - 1 ? MODULE_SECTIONS[index + 1] : null,
  };
}
