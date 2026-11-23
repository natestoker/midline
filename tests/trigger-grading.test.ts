// Questions graded by triggers (a Storyline freeform question after import),
// the reset-quiz action, and the "Quiz score" trigger condition.
import { Runtime } from '../src/engine/runtime';
import { gradedBlockIds, slideQuestionId } from '../src/engine/scoring';

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : `\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`);
};

const slide = (id: string, triggers: any[], blocks: any[] = [], extraLayers: any[] = []) => ({
  id, name: id, width: 1280, height: 720, triggers,
  layers: [{ id: `l_${id}`, name: 'Base layer', visibleByDefault: true, blocks }, ...extraLayers]
});
const btn = (id: string) => ({ id, type: 'button', x: 0, y: 0, w: 100, h: 40, props: { label: id, variant: 'solid', fontSize: 16 } });
const click = (blockId: string, actions: any[], conditions: any[] = []) => ({ id: `t_${blockId}_${actions[0].type}`, event: 'onClick', sourceBlockId: blockId, conditions, actions });

const project: any = {
  id: 'p', title: 'Grading', variables: [], completion: { mode: 'allSlides', autoScore: true, passingScore: 50 },
  slides: [
    slide('s1', [click('right1', [{ type: 'markCorrect' }]), click('wrong1', [{ type: 'markIncorrect' }])], [btn('right1'), btn('wrong1')]),
    slide('s2', [click('right2', [{ type: 'markCorrect' }]), click('wrong2', [{ type: 'markIncorrect' }])], [btn('right2'), btn('wrong2')]),
    slide('s3', [
      click('show', [{ type: 'showLayer', layerId: 'pass' }], [{ variableId: '', score: true, operator: 'gte', value: 50 }]),
      click('show', [{ type: 'showLayer', layerId: 'fail' }], [{ variableId: '', score: true, operator: 'lt', value: 50 }]),
      click('again', [{ type: 'resetQuiz' }])
    ].map((t, i) => ({ ...t, id: `r${i}` })), [btn('show'), btn('again')], [
      { id: 'pass', name: 'Pass', visibleByDefault: false, blocks: [] },
      { id: 'fail', name: 'Fail', visibleByDefault: false, blocks: [] }])
  ]
};

eq('a slide graded by its triggers counts as one question', gradedBlockIds(project), [slideQuestionId('s1'), slideQuestionId('s2')]);

const rt = new Runtime(project);
eq('no score before anything is answered', rt.resolveReference('Score'), '0');
rt.clickBlock('right1');
eq('one of two right is 50 percent', rt.resolveReference('Score'), '50');
rt.enterSlide('s2');
rt.clickBlock('wrong2');
eq('a wrong answer leaves it at 50', rt.resolveReference('Score'), '50');
rt.clickBlock('right2');
eq('answering again, correctly, makes it 100', rt.resolveReference('Score'), '100');
eq('the pass mark is readable in text', rt.resolveReference('PassPercent'), '50');
eq('points follow the answers: 10 each, 20 in all, 10 to pass', [rt.resolveReference('ScorePoints'), rt.resolveReference('MaxPoints'), rt.resolveReference('PassPoints')], ['20', '20', '10']);

rt.enterSlide('s3');
rt.clickBlock('show');
eq('the score condition shows the pass layer only', [rt.isLayerVisible('pass'), rt.isLayerVisible('fail')], [true, false]);
rt.clickBlock('again');
eq('reset quiz clears the score', rt.resolveReference('Score'), '0');
rt.clickBlock('show');
rt.enterSlide('s3');
rt.clickBlock('show');
eq('and after a reset the fail layer is the one that shows', [rt.isLayerVisible('pass'), rt.isLayerVisible('fail')], [false, true]);

console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
process.exit(fails ? 1 : 0);
