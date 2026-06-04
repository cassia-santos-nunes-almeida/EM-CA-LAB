import type { ConceptCheckData } from '@shared/components/common/ConceptCheck';
import type { QuizQuestion } from '@em/types/index';

/**
 * Adapts a verified M1 `QuizQuestion` into the canonical section-model
 * `ConceptCheckData` (multiple-choice variant). Every option carries the
 * question's single verified `explanation` — mirroring the original M1
 * ConceptCheck behaviour (one explanation shown after answering) — so no new,
 * unverified per-distractor physics is introduced during the migration. The
 * tiered hints are flattened to `string[]` (label dropped, content kept in
 * tier order), per docs/m1-section-migration-spec.md §1.2 and §4.
 */
export function toConceptCheck(q: QuizQuestion): ConceptCheckData {
  return {
    mode: 'multiple-choice',
    question: q.question,
    options: q.options.map((text, i) => ({
      text,
      correct: i === q.correctIndex,
      explanation: q.explanation,
    })),
    hints: q.hints ? q.hints.map((h) => h.content) : undefined,
  };
}
