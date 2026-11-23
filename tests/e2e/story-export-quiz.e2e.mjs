// Save as Storyline (.story): fill-in questions, flashcards, scenarios and a
// result slide. Checks the package against the forms taken from real
// Storyline files, then opens it again to see the quiz still works.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { check, eq, finish, launch, editorPage } from './harness.mjs';

const JSZip = createRequire(import.meta.url)('jszip');
const browser = await launch();
const ed = await editorPage(browser);

const slide = (id, name, blocks = []) => ({ id, name, width: 1280, height: 720, triggers: [], layers: [{ id: 'l_' + id, name: 'Base layer', visibleByDefault: true, blocks }] });
const q = (id, type, props) => ({ id, type, name: 'Question', x: 140, y: 120, w: 1000, h: 520, props: { feedbackCorrect: 'Yes.', feedbackIncorrect: 'No.', ...props } });
const project = {
  id: 'p', title: 'Quiz export', variables: [], completion: { mode: 'allSlides', autoScore: true, passingScore: 60 },
  slides: [
    slide('s1', 'Pick', [q('q1', 'multipleChoice', { question: 'Red planet?', choices: [{ id: 'c1', text: 'Mars' }, { id: 'c2', text: 'Venus' }], correctChoiceIds: ['c1'], allowMultiple: false })]),
    slide('s2', 'Fill', [q('q2', 'fillBlank', { question: 'Rust is iron ___.', correctAnswers: ['oxide', 'Oxide'], caseSensitive: false, fontSize: 20 })]),
    slide('s3', 'Cards', [{ id: 'f1', type: 'flashcards', name: 'Cards', x: 100, y: 140, w: 1080, h: 420, props: { columns: 2, cards: [{ id: 'a', front: 'Phishing', back: 'A fake message' }, { id: 'b', front: 'Vishing', back: 'A scam call' }] } }]),
    slide('s4', 'Scenario', [{ id: 'sc1', type: 'scenario', name: 'Scenario', x: 140, y: 120, w: 1000, h: 500, props: { passages: [
      { id: 'p1', speaker: 'Caller', text: 'Tell me your password.', choices: [{ id: 'a', label: 'Refuse', targetId: 'p2' }] },
      { id: 'p2', text: 'Good call.', choices: [{ id: 'b', label: 'Continue', targetId: '' }] }] } }]),
    slide('s6', 'Widgets', [
      { id: 'ck1', type: 'checklist', name: 'Checklist', x: 60, y: 60, w: 520, h: 300, props: { title: 'Before you click', items: [{ id: 'a', text: 'Check the sender' }, { id: 'b', text: 'Hover over the link' }] } },
      { id: 'te1', type: 'textEntry', name: 'Notes field', x: 60, y: 420, w: 520, h: 60, props: { placeholder: 'Your notes', fontSize: 18, multiline: false } },
      { id: 'lg1', type: 'labeledGraphic', name: 'Inbox', x: 640, y: 60, w: 580, h: 560, props: { src: '', fit: 'cover', markers: [{ id: 'm1', x: 20, y: 30, title: 'Sender', body: 'Look at the address.' }, { id: 'm2', x: 70, y: 60, title: 'Link', body: 'Hover before you click.' }] } }]),
    slide('s5', 'Results', [
      { id: 'r1', type: 'results', name: 'Results', x: 240, y: 140, w: 800, h: 420, props: { heading: 'Quiz results', passMessage: 'You passed.', failMessage: 'Not yet.', noScoreMessage: '', showPassMark: true, fontSize: 40, align: 'center' } },
      { id: 'v1', type: 'varDisplay', name: 'Score tile', x: 1040, y: 40, w: 200, h: 100, props: { reference: 'Score', label: 'Score', suffix: '%' } }])
  ]
};
await ed.evaluate((p) => window.__forgeStore.getState().setProject(p), project);
await ed.waitForTimeout(300);
await ed.getByRole('button', { name: /^File/ }).click();
const [dl] = await Promise.all([ed.waitForEvent('download'), ed.locator('.menu-item', { hasText: 'Save as Storyline' }).click()]);
const path = await dl.path();
await ed.waitForSelector('.story-report');
check('every block had a Storyline form', /Everything in the project/.test(await ed.locator('.story-report').innerText()), await ed.locator('.story-report').innerText());
await ed.locator('.story-report .btn-accent').click();

const zip = await JSZip.loadAsync(readFileSync(path));
const text = (n) => zip.file(n).async('string');
const story = await text('story/story.xml');
const names = ['slide.xml', 'slide2.xml', 'slide3.xml', 'slide4.xml', 'slide5.xml', 'slide6.xml'];
const [pick, fill, cards, scen, widgets, res] = await Promise.all(names.map((n) => text(`story/slides/${n}`)));
const gOf = (xml) => /<sld g="([^"]+)"/.exec(xml)[1];
check('no template token is left in the file', !/@@\w+@@/.test(story + pick + fill + cards + scen + widgets + res));

// Fill in the blank
const entryG = /<textEntry g="([^"]+)"/.exec(fill)?.[1];
const entryVar = /createVarG="([^"]+)"/.exec(fill)?.[1];
check('fill-in is a freeform text-entry question pointing at its field', !!entryG && fill.includes(`<freeTextEntryIntr`) && fill.includes(`textEntryG="${entryG}"`));
eq('accepted answers are bare words', [.../<intrFreeChoice [^>]*>(?:(?!<\/intrFreeChoice>).)*<text>([^<]*)<\/text>/gs.exec(fill) ? fill.matchAll(/<text>([^<&]+)<\/text><localizedText \/><\/intrFreeChoice>/g) : []].map((m) => m[1]), ['oxide', 'Oxide']);
check('the field writes to a text variable that exists', !!entryVar && new RegExp(`<var g="${entryVar}"[^>]*dataType="text"`).test(story));
check('the fill-in slide is a question slide with feedback layers', /layoutType="Quiz Questions"/.test(fill) && (fill.match(/<feedBackLayer /g) ?? []).length === 2);

// Flashcards
check('each card is a shape whose back is its Selected state', (cards.match(/<state [^>]*name="Selected"/g) ?? []).length === 2 && cards.includes('A fake message') && cards.includes('Phishing'));

// Scenario
const scenLayers = [...scen.matchAll(/<sldLayer g="([^"]+)"[^>]*name="([^"]*)"/g)];
eq('a scenario has a layer per passage', scenLayers.map((m) => m[2]), ['Passage 1: Caller', 'Passage 2']);
check('the first passage shows when the slide starts', new RegExp(`event="OnStart" action="showSubSlide"(?:(?!</trig>).)*showG="${scenLayers[0]?.[1]}"`, 's').test(scen));
check('a choice shows the passage it leads to, and an ending moves on', scen.includes(`showG="${scenLayers[1]?.[1]}"`) && /name="Choice: Continue"(?:(?!<\/roundRect>).)*action="jumpToSlide" actSubType="next"/s.test(scen));

// Checklist, text entry and labelled graphic
check('a checklist row ticks through its Selected state', (widgets.match(/<state [^>]*name="Selected"/g) ?? []).length === 2 && widgets.includes('[x]   Check the sender') && widgets.includes('Before you click'));
const noteVar = /<textEntry [^>]*name="Notes field"[^>]*createVarG="([^"]+)"/.exec(widgets)?.[1] ?? /<textEntry [^>]*createVarG="([^"]+)"/.exec(widgets)?.[1];
check('a text entry block is a Storyline field with its own text variable', !!noteVar && new RegExp(`<var g="${noteVar}"[^>]*dataType="text"`).test(story) && widgets.includes('Your notes'));
const pins = [...widgets.matchAll(/<sldLayer g="([^"]+)"[^>]*name="([^"]*)"/g)];
eq('a labelled graphic has a layer per marker', pins.map((m) => m[2]), ['Sender', 'Link']);
check('each marker shows its own card', pins.every((m) => widgets.includes(`showG="${m[1]}"`)) && widgets.includes('Hover before you click.'));
check('nothing in the project was left as an outlined box', !(pick + fill + cards + scen + widgets + res).includes('not converted'));

// Result slide and its quiz
const quiz = /<quiz g="([^"]+)"[^>]*passScore="(\d+)"[^>]*resultSldG="([^"]+)"/.exec(story);
check('the story has one quiz with the course pass mark, pointing at the result slide', !!quiz && quiz[2] === '60' && quiz[3] === gOf(res), quiz ? quiz.slice(1).join(' ') : 'no quiz');
eq('the quiz lists the question slides in order', [...(/<questionIdLst>(.*?)<\/questionIdLst>/.exec(story)?.[1] ?? '').matchAll(/<item>([^<]+)<\/item>/g)].map((m) => m[1]), [gOf(pick), gOf(fill)]);
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const partId = (g) => { const p = g.split('-'); let v = BigInt('0x' + p[0]) | (BigInt('0x' + p[1]) << 32n) | (BigInt('0x' + p[2]) << 48n); let o = ''; while (v > 0n) { o = B62[Number(v % 62n)] + o; v /= 62n; } return o; };
check('the four score variables are named from the quiz id', !!quiz && ['PercentScore', 'Score', 'PassScore', 'PassPercent'].every((prop) => story.includes(`propPath="_player.${partId(quiz[1])}.$${prop}"`)));
check('the result slide is a Quiz Review slide with the result object', /layoutType="Quiz Review"/.test(res) && res.includes(`<rsltsIntr`) && !!quiz && res.includes(`quizG="${quiz[1]}"`));
const okLayer = /<success trigG="([^"]+)" g="([^"]+)"/.exec(res);
check('Success and Failure layers are shown by the score against the pass mark', !!okLayer && res.includes(`<sldLayer g="${okLayer[2]}"`) && res.includes(`<trig g="${okLayer[1]}"`) && /op="gte"[^>]*dataType="var"/.test(res) && /op="lt"[^>]*dataType="var"/.test(res));
check('the quiz is submitted when the result slide starts', /<submitQuizTrig [^>]*>(?:(?!<\/submitQuizTrig>).)*enumName="SubmitQuizSL"/s.test(res) && res.includes(`data="" g="${gOf(res)}"`));
check('score text reads the quiz variables, with no stand-in Score variable', res.includes('%Quiz1.ScorePercent%') && res.includes('%Quiz1.PassPercent%') && !/<var [^>]*name="Score"/.test(story));
check('text margins are whole numbers', !/<textMargin [^>]*"-?\d+\.\d/.test(pick + fill + cards + scen + widgets + res));

// Round trip
await ed.locator('input[aria-label="Storyline file"]').setInputFiles({ name: 'Quiz export.story', mimeType: 'application/octet-stream', buffer: readFileSync(path) });
await ed.waitForSelector('.story-report'); await ed.locator('.story-report .btn-accent').click();
const back = await ed.evaluate(() => {
  const p = window.__forgeStore.getState().project;
  const types = (i) => p.slides[i].layers[0].blocks.map((b) => b.type);
  const fb = p.slides[1].layers[0].blocks.find((b) => b.type === 'fillBlank');
  return { slides: p.slides.map((s) => s.name), fill: fb?.props.correctAnswers ?? null, types1: types(1), completion: p.completion,
    resText: p.slides[5].layers[0].blocks.filter((b) => b.type === 'text').map((b) => b.props.html).join(' '),
    conds: p.slides[5].triggers.filter((t) => t.actions[0]?.type === 'showLayer').map((t) => [t.conditions[0]?.score, t.conditions[0]?.operator, t.conditions[0]?.value]) };
});
eq('slides survive the round trip', back.slides, project.slides.map((s) => s.name));
eq('the fill-in comes back as a fill-in block with its answers', back.fill, ['oxide', 'Oxide']);
eq('the pass mark comes back', back.completion, { mode: 'allSlides', autoScore: true, passingScore: 60 });
check('the result slide comes back with live score text', back.resText.includes('%Score%') && back.resText.includes('%PassPercent%'), back.resText);
eq('and its layers still follow the score', back.conds, [[true, 'gte', 60], [true, 'lt', 60]]);

await browser.close();
finish();
