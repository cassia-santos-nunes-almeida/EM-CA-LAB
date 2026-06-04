// Throwaway: repoint every ModuleNavigation consumer to the shared,
// curriculum-driven CourseNavigation. Handles both call shapes
// (`<ModuleNavigation/>` and `<ModuleNavigation currentModuleId=...>`).
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '..', 'src');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  // Skip the component definitions themselves (they're being deleted).
  if (/export function ModuleNavigation/.test(text)) continue;
  let out = text
    .replace(
      /import \{ ModuleNavigation \} from '@(?:circuits|em|transmission)\/components\/common\/ModuleNavigation';/g,
      "import { CourseNavigation } from '@shared/components/common/CourseNavigation';",
    )
    .replace(/<ModuleNavigation currentModuleId=/g, '<CourseNavigation currentSectionId=')
    .replace(/<ModuleNavigation \/>/g, '<CourseNavigation />');
  if (out !== text) {
    fs.writeFileSync(file, out);
    changed++;
    console.log('  rewrote', path.relative(SRC, file));
  }
}
console.log(`Repointed ${changed} files to CourseNavigation.`);
