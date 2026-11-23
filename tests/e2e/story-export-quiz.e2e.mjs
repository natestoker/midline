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
      { id: 'lg1', type: 'labeledGraphic', name: 'Inbox', x: 640, y: 60, w: 580, h: 560, props: { src: '', fit: 'cover', markers: [{ id: 'm1', x: 20, y: 30, title: 'Sender', body: 'Look at the address.' }, { id: 'm2', x: 70, y: 60, title: 'Link', body: 'Hover before you click.' }] } },
      { id: 'sl1', type: 'slider', name: 'Confidence', x: 60, y: 520, w: 520, h: 90, props: { label: 'How sure are you?', min: 0, max: 10, step: 1, defaultValue: 5, showValue: true } },
      { id: 'tm1', type: 'timer', name: 'Countdown', x: 60, y: 620, w: 200, h: 70, props: { mode: 'countdown', seconds: 30, fontSize: 28, autoStart: true } },
      { id: 'cd1', type: 'code', name: 'Custom', x: 300, y: 620, w: 280, h: 70, props: { html: '<b id="x">hi</b>', css: 'b{color:#0a7}', js: 'document.getElementById("x").textContent = "ran";' } }]),
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
const report = await ed.locator('.story-report').innerText();
check('the only note is that three blocks became web objects', /web objects/.test(report) && !/outlined box/.test(report) && (await ed.locator('.story-report-list li').count()) === 1, report);
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
// Code, slider and timer: web objects
const webAssets = [...story.matchAll(/<media g="([^"]+)"[^>]*type="Unknown"/g)].map((m) => m[1]);
eq('slider, timer and code blocks each become a web object', [(widgets.match(/<web g=/g) ?? []).length, webAssets.length], [3, 3]);
check('every web object points at its own zipped page', webAssets.every((g) => widgets.includes(`assetG="${g}"`)));
const bins = Object.keys(zip.files).filter((n) => n.endsWith('.bin'));
const pages = await Promise.all(bins.map(async (n) => (await JSZip.loadAsync(await zip.file(n).async('uint8array'))).file('index.html').async('string')));
check('each zip holds one index.html', bins.length === 3 && pages.every((h) => h.startsWith('<!doctype html>')));
const sliderPage = pages.find((h) => h.includes('type="range"')) ?? '';
check('the slider writes its value to a Storyline number variable that exists', /sl\.set\("slider_sl1_value"/.test(sliderPage) && /<var [^>]*name="slider_sl1_value" dataType="num" val="5"/.test(story), sliderPage.slice(-200));
check('the timer sets its done variable at zero', pages.some((h) => h.includes('sl.set("timer_tm1_done", true)')) && /<var [^>]*name="timer_tm1_done" dataType="bool"/.test(story));
check('the code block page carries the author\'s code', pages.some((h) => h.includes('textContent = "ran"') && h.includes('b{color:#0a7}')));
const thumbRels = [...widgets.matchAll(/<embedRefThumb>([^<]+)<\/embedRefThumb>/g)].map((m) => m[1]);
const wRels = await text('story/slides/_rels/slide5.xml.rels');
check('each web object thumbnail is a picture the slide lists under that id', thumbRels.length === 3 && thumbRels.every((id) => new RegExp(`Target="/story/media/R\\w+\\.jpg" Id="${id}"`).test(wRels)));
check('content types cover bin', /Extension="bin" ContentType="application\/unknown"/.test(await text('[Content_Types].xml')));
check('nothing in the project was left as an outlined box', !(pick + fill + cards + scen + widgets + res).includes('not converted'));

// Result slide and its quiz
const quiz = /<quiz g="([^"]+)"[^>]*passScore="(\d+)"[^>]*resultSldG="([^"]+)"/.exec(story);
check('the story has one quiz with the course pass mark, pointing at the result slide', !!quiz && quiz[2] === '60' && quiz[3] === gOf(res), quiz ? quiz.slice(1).join(' ') : 'no quiz');
eq('the quiz lists the question slides in order', [...(/<questionIdLst>(.*?)<\/questionIdLst>/.exec(story)?.[1] ?? '').matchAll(/<item>([^<]+)<\/item>/g)].map((m) => m[1]), [gOf(pick), gOf(fill)]);
check('the course is tracked by that result slide', !!quiz && story.includes(`lmsResultSlideG="${quiz[3]}"`), /lmsResultSlideG="[^"]*"/.exec(story)?.[0]);
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

// Video: MP4 goes out the way Storyline stores it and comes back as a video block.
const mp4 = 'data:video/mp4;base64,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';
await ed.evaluate((src) => window.__forgeStore.getState().setProject({ id: 'p', title: 'Video', variables: [], slides: [{ id: 's1', name: 'Clip', width: 1280, height: 720, triggers: [], layers: [{ id: 'l1', name: 'Base layer', visibleByDefault: true, blocks: [{ id: 'v1', type: 'video', name: 'Clip', x: 100, y: 100, w: 640, h: 360, props: { src, controls: true, autoplay: true, loop: false, captionsVtt: 'WEBVTT\\n\\n00:00:00.100 --> 00:00:00.900\\nTest clip\\n' } }] }] }] }), mp4);
await ed.waitForTimeout(300);
await ed.getByRole('button', { name: /^File/ }).click();
const [vdl] = await Promise.all([ed.waitForEvent('download'), ed.locator('.menu-item', { hasText: 'Save as Storyline' }).click()]);
const vpath = await vdl.path();
await ed.waitForSelector('.story-report'); await ed.locator('.story-report .btn-accent').click();
const vz = await JSZip.loadAsync(readFileSync(vpath));
const vNames = Object.keys(vz.files);
const vStory = await vz.file('story/story.xml').async('string');
const vSlide = await vz.file('story/slides/slide.xml').async('string');
const mpeg = vNames.find((n) => n.endsWith('.mpeg'));
check('the MP4 is stored in a .mpeg file, with a caption file and a poster', !!mpeg && vNames.some((n) => n.endsWith('.vtt')) && vNames.filter((n) => /media\/.*\.png$/.test(n)).length === 1);
const vAsset = /<video g="([^"]+)"[^>]*type="Mp4"[^>]*hasClosedCaptions="true"/.exec(vStory)?.[1];
check('the video is listed in the story and the theme', !!vAsset && (await vz.file('story/theme/theme.xml').async('string')).includes(`<video g="${vAsset}"`));
check('the slide has a video object for it with a poster and controls', !!vAsset && vSlide.includes(`assetG="${vAsset}"`) && /thumbG="(?!00000000)/.test(vSlide) && vSlide.includes('showCtrls="true"') && /<movie dur="\d+" fps="30"><sz w="96" h="54" \/>/.test(vSlide), /<movie[^>]*>.{0,40}/.exec(vSlide)?.[0]);
check('content types cover mpeg', /Extension="mpeg" ContentType="video\/mpeg"/.test(await vz.file('[Content_Types].xml').async('string')));
await ed.locator('input[aria-label="Storyline file"]').setInputFiles({ name: 'Video.story', mimeType: 'application/octet-stream', buffer: readFileSync(vpath) });
await ed.waitForSelector('.story-report'); await ed.locator('.story-report .btn-accent').click();
const vBack = await ed.evaluate(() => { const b = window.__forgeStore.getState().project.slides[0].layers[0].blocks.find((x) => x.type === 'video'); return b ? { src: String(b.props.src).slice(0, 22), controls: b.props.controls, cc: b.props.captionsVtt ?? '' } : null; });
check('the video comes back as a video block with its captions', !!vBack && vBack.src === 'data:video/mp4;base64,' && vBack.controls === true && vBack.cc.includes('Test clip'), JSON.stringify(vBack));

// A quiz with no results block: Storyline can only report a score through a
// result slide, so one is added and the course is tracked by it.
const bare = {
  id: 'p2', title: 'Bare quiz', variables: [], completion: { mode: 'allSlides', autoScore: true, passingScore: 70 },
  slides: [
    slide('b1', 'Q1', [q('bq1', 'multipleChoice', { question: 'Red planet?', choices: [{ id: 'c1', text: 'Mars' }, { id: 'c2', text: 'Venus' }], correctChoiceIds: ['c1'], allowMultiple: false })]),
    slide('b2', 'Q2', [q('bq2', 'multipleChoice', { question: 'Largest planet?', choices: [{ id: 'c1', text: 'Jupiter' }, { id: 'c2', text: 'Mercury' }], correctChoiceIds: ['c1'], allowMultiple: false })]),
    slide('b3', 'Summary', [{ id: 'bt1', type: 'text', name: 'Line', x: 100, y: 100, w: 900, h: 80, props: { html: '<p>So far: %Score%% of %MaxPoints% points, pass at %PassPercent%%</p>', fontSize: 24 } }])
  ]
};
await ed.evaluate((p) => window.__forgeStore.getState().setProject(p), bare);
await ed.waitForTimeout(300);
await ed.getByRole('button', { name: /^File/ }).click();
const [bdl] = await Promise.all([ed.waitForEvent('download'), ed.locator('.menu-item', { hasText: 'Save as Storyline' }).click()]);
const bpath = await bdl.path();
await ed.waitForSelector('.story-report');
const bReport = await ed.locator('.story-report').innerText();
check('the report says a Results slide was added', /Results slide was added/.test(bReport), bReport);
await ed.locator('.story-report .btn-accent').click();
const bz = await JSZip.loadAsync(readFileSync(bpath));
const bStory = await bz.file('story/story.xml').async('string');
const bSlides = await Promise.all(['slide.xml', 'slide2.xml', 'slide3.xml', 'slide4.xml'].map((n) => bz.file(`story/slides/${n}`)?.async('string')));
check('a fourth slide was written and it is the result slide', !!bSlides[3] && /layoutType="Quiz Review"/.test(bSlides[3]) && bSlides[3].includes('<rsltsIntr'));
const bQuiz = /<quiz g="([^"]+)"[^>]*passScore="(\d+)"[^>]*resultSldG="([^"]+)"/.exec(bStory);
check('the quiz carries the pass mark and points at the added slide', !!bQuiz && bQuiz[2] === '70' && !!bSlides[3] && bQuiz[3] === gOf(bSlides[3]));
eq('both questions are in the quiz', [...(/<questionIdLst>(.*?)<\/questionIdLst>/.exec(bStory)?.[1] ?? '').matchAll(/<item>([^<]+)<\/item>/g)].map((m) => m[1]), [gOf(bSlides[0]), gOf(bSlides[1])]);
check('the course is tracked by the added result slide', !!bQuiz && bStory.includes(`lmsResultSlideG="${bQuiz[3]}"`));
check('the result slide shows the quiz score', !!bSlides[3] && bSlides[3].includes('%Quiz1.ScorePercent%'));
check('a score shown before the result slide reads the running Score variable', bSlides[2].includes('%Score%') && !bSlides[2].includes('Quiz1.ScorePercent') && /<var [^>]*name="Score" dataType="num"/.test(bStory));
check('the pass mark reads the quiz and total points are written out', bSlides[2].includes('%Quiz1.PassPercent%') && bSlides[2].includes('of 20 points'));
check('each question adds its share to the running score', bSlides[0].includes('dblVal="50"') && !/@@\w+@@/.test(bSlides.join('')));
check('the added slide is listed in the story', (bStory.match(/<sldId>/g) ?? bStory.match(/<sldId /g) ?? []).length === 4, String((bStory.match(/<sldId/g) ?? []).length));

await browser.close();
finish();
