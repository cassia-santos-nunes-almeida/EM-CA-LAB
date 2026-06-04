export const MODULE_URLS = {
  module1: import.meta.env.VITE_MODULE1_URL || 'https://em-ac-lab-module1.vercel.app',
  module2: import.meta.env.VITE_MODULE2_URL || 'https://em-ac-lab-module2.vercel.app',
  module3: import.meta.env.VITE_MODULE3_URL || 'https://em-ac-lab-module3.vercel.app',
} as const;
