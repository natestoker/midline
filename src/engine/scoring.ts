import type { Block, Project } from '../schema/types';

// Scoring helpers shared by the runtime and the Publish dialog.
//
// "Graded" blocks are the ones that have a single right/wrong outcome and
// report it through runtime.reportInteraction. Scenario is left out on
// purpose: it reports on reaching an ending, not on a correct answer.

export const GRADED_BLOCK_TYPES = [
  'multipleChoice', 'fillBlank', 'dragDrop', 'sequence', 'matching'
] as const;

export const DEFAULT_PASSING_SCORE = 80;

// The id a trigger-graded slide reports its answer under.
export const slideQuestionId = (slideId: string) => `q_${slideId}`;

function walk(blocks: Block[]): Block[] {
  return blocks.flatMap((b) =>
    b.type === 'group' ? [b, ...walk((b.props as { blocks: Block[] }).blocks)] : [b]
  );
}

export function gradedBlockIds(project: Project, onlySlides?: Set<string>): string[] {
  const ids: string[] = [];
  for (const slide of project.slides) {
    if (onlySlides && !onlySlides.has(slide.id)) continue;
    for (const layer of slide.layers) {
      for (const b of walk(layer.blocks)) {
        if ((GRADED_BLOCK_TYPES as readonly string[]).includes(b.type)) ids.push(b.id);
      }
    }
    // A slide graded by its own triggers counts as one question.
    if (slide.triggers.some((t) => t.enabled !== false && t.actions.some((a) => a.type === 'markCorrect' || a.type === 'markIncorrect'))) {
      ids.push(slideQuestionId(slide.id));
    }
  }
  return ids;
}

export function passingScoreOf(project: Project): number {
  const n = project.completion?.passingScore;
  return typeof n === 'number' && isFinite(n) ? Math.max(0, Math.min(100, n)) : DEFAULT_PASSING_SCORE;
}

// True when finishing the course depends on the score.
export function completionNeedsPass(project: Project): boolean {
  const m = project.completion?.mode;
  return m === 'passed' || m === 'viewedAndPassed';
}
