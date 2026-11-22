'use strict';

// The ? of every feature place - docs/Features/General/Help-Button.md.
//
// One help point per place: a ? button that opens a big popup titled "How it
// works", with "What is it?" and "How it works?" and a translated text under
// each. The texts come from the docs, but they are plain prose - the links stay
// in the English docs in the repository - and every place reaches its help
// through models/lib/featureHelp.js.
//
// Run: node tests/featureHelp.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const help = require(path.join(ROOT, 'models/lib/featureHelp.js'));
const DATA = path.join(ROOT, 'imports/i18n/data');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Every .jade under client/, skipping the bundler's output.
function jadeFiles(dir = path.join(ROOT, 'client'), out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_build' || entry.name === 'node_modules') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) jadeFiles(abs, out);
    else if (entry.name.endsWith('.jade')) out.push(abs);
  }
  return out;
}
const JADE = jadeFiles().map(file => ({ file, text: fs.readFileSync(file, 'utf8') }));
const literalCalls = [];
for (const { file, text } of JADE) {
  for (const m of text.matchAll(/\+featureHelp\(id='([^']*)'\)/g)) {
    literalCalls.push({ file: path.relative(ROOT, file), id: m[1] });
  }
}

const LINK_LIKE = /http|www\.|\]\(|<a|\.md|\/docs\/|`/i;
const PLACEHOLDER = /__[A-Za-z0-9_-]+__|%(?:\d+\$)?[sd]/;

// ── the data ──

test('the three shared keys exist in English with the agreed words', () => {
  assert.strictEqual(en['what-it-is'], 'What is it?');
  assert.strictEqual(en['how-it-works'], 'How it works?');
  assert.strictEqual(en['featureHelpPopup-title'], 'How it works');
});

test('every help has both texts in English, and its docs page exists', () => {
  assert.ok(help.FEATURE_IDS.length >= 100, 'one help per feature place');
  for (const id of help.FEATURE_IDS) {
    const h = help.featureHelp(id);
    assert.strictEqual(h.whatKey, `help-${id}-what-it-is-description`);
    assert.strictEqual(h.howKey, `help-${id}-how-it-works-description`);
    for (const key of [h.whatKey, h.howKey]) {
      assert.ok(typeof en[key] === 'string' && en[key].trim().length > 40, `${key} in en.i18n.json`);
      assert.ok(en[key].length <= 600, `${key} is short enough for a popup`);
    }
    assert.ok(/^docs\/Features\/.+\.md$/.test(h.docs), `${id} names a docs page`);
    assert.ok(fs.existsSync(path.join(ROOT, h.docs)), `${id}: ${h.docs} exists`);
  }
});

test('the keys are in en in the module\'s order, after the shared three', () => {
  const keys = Object.keys(en);
  const at = keys.indexOf('what-it-is');
  const want = ['what-it-is', 'how-it-works', 'featureHelpPopup-title'];
  for (const id of help.FEATURE_IDS) want.push(help.whatKey(id), help.howKey(id));
  assert.deepStrictEqual(keys.slice(at, at + want.length), want);
});

test('no text has a link, an address, a file name, Markdown or a placeholder - in any language', () => {
  const keys = Object.keys(en).filter(k => /^help-.+-(what-it-is|how-it-works)-description$/.test(k));
  assert.strictEqual(keys.length, help.FEATURE_IDS.length * 2);
  for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.i18n.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    for (const key of [...keys, 'what-it-is', 'how-it-works', 'featureHelpPopup-title']) {
      const v = j[key];
      if (v === undefined) continue;
      assert.ok(!LINK_LIKE.test(v), `${file} ${key} has no link: ${v}`);
      assert.ok(!PLACEHOLDER.test(v), `${file} ${key} has no placeholder`);
      assert.ok(!/[<>]|\*\*/.test(v), `${file} ${key} is plain text`);
    }
  }
});

test('the link check itself catches what it must (negative)', () => {
  for (const bad of ['See https://wekan.fi', 'www.example.com', 'read [this](x)', '<a href=x>',
    'in Help-Button.md', 'under /docs/Features', 'run `x`']) {
    assert.ok(LINK_LIKE.test(bad), bad);
  }
  assert.ok(PLACEHOLDER.test('on __board__') && PLACEHOLDER.test('%s cards'));
  assert.ok(!LINK_LIKE.test('Open Board Settings / Card and tick what to show.'));
});

test('the shared keys are translated in every language that is not English', () => {
  for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.i18n.json'))) {
    const code = file.replace('.i18n.json', '');
    const j = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    for (const key of ['what-it-is', 'how-it-works', 'featureHelpPopup-title']) {
      assert.ok(typeof j[key] === 'string' && j[key].trim(), `${code} has ${key}`);
      if (code !== 'en' && !/^en[-_]/.test(code)) {
        assert.notStrictEqual(j[key], en[key], `${code} ${key} is translated`);
      }
    }
  }
});

test('every locale has every help key, in en\'s order', () => {
  const want = Object.keys(en).filter(k => k === 'what-it-is' || k === 'how-it-works'
    || k === 'featureHelpPopup-title' || /^help-.+-description$/.test(k));
  for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.i18n.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    const have = Object.keys(j).filter(k => want.includes(k));
    assert.deepStrictEqual(have, want, `${file}`);
  }
});

// ── the places ──

test('every literal +featureHelp(id=...) names a known help', () => {
  assert.ok(literalCalls.length >= 3);
  for (const { file, id } of literalCalls) {
    assert.ok(help.hasFeature(id), `${file}: unknown help ${id}`);
  }
});

test('an unknown id has no help, and every lookup refuses junk (negative)', () => {
  assert.strictEqual(help.hasFeature('no-such-feature'), false);
  assert.strictEqual(help.featureHelp('no-such-feature'), null);
  assert.strictEqual(help.featureHelp('constructor'), null);
  assert.strictEqual(help.featureHelp(undefined), null);
  assert.strictEqual(help.boardViewHelpId('board-view-nope'), null);
  assert.strictEqual(help.boardViewHelpId('toString'), null);
  assert.strictEqual(help.popupHelpId('noSuchPopup'), null);
  assert.strictEqual(help.cardSectionHelpId('vote'), null, 'Vote has no docs page yet');
  assert.strictEqual(help.sidebarViewHelpId('home'), null);
  assert.strictEqual(help.paneHelpId('setting', 'nope'), null);
  assert.strictEqual(help.paneHelpId('nope', 'version-setting'), null);
});

test('every help is reached: by a literal call or by one of the place maps', () => {
  const reached = help.mappedIds();
  for (const { id } of literalCalls) reached.add(id);
  for (const id of help.FEATURE_IDS) assert.ok(reached.has(id), `${id} is shown somewhere`);
  for (const id of reached) assert.ok(help.hasFeature(id), `${id} is a known help`);
});

test('every Board View has a help', () => {
  const { BOARD_VIEWS } = require(path.join(ROOT, 'models/lib/boardViewSettings.js'));
  for (const { view } of BOARD_VIEWS) {
    assert.ok(help.hasFeature(help.boardViewHelpId(view)), `${view} has a help`);
  }
});

test('every popup with a help is a template that exists', () => {
  const all = JADE.map(j => j.text).join('\n');
  for (const name of Object.keys(help.POPUP_HELP)) {
    assert.ok(new RegExp(`template\\(name=["']${name}["']\\)`).test(all), `${name} exists`);
  }
  assert.ok(!('featureHelpPopup' in help.POPUP_HELP), 'the help popup has no ? of its own');
});

test('every card section with a help is drawn by cardSectionHeader', () => {
  const sections = new Set();
  for (const { text } of JADE) {
    for (const m of text.matchAll(/\+cardSectionHeader\([^)]*section="([^"]+)"/g)) sections.add(m[1]);
  }
  for (const section of Object.keys(help.CARD_SECTION_HELP)) {
    assert.ok(sections.has(section), `${section} is a card section`);
  }
});

test('every Admin Panel pane id with a help is an entry of that page\'s menu', () => {
  const menus = {
    setting: read('client/components/settings/settingBody.js'),
    people: read('client/components/settings/peopleBody.js'),
    attachments: read('client/components/settings/attachments.js'),
    problems: read('client/components/settings/adminProblems.js'),
  };
  for (const [route, panes] of Object.entries(help.PANE_HELP)) {
    for (const pane of Object.keys(panes)) {
      assert.ok(menus[route].includes(`'${pane}'`), `${route}: ${pane} is a menu entry`);
      assert.ok(help.hasFeature(help.paneHelpId(route, pane)));
    }
  }
  assert.strictEqual(help.paneHelpId('cloud-admin-home', 'domains'), 'admin-cloud');
  assert.strictEqual(help.paneHelpId('home', 'starred'), 'all-boards');
});

test('the shared headers draw the ? of whatever is open in them', () => {
  assert.ok(/span\.header-title= title\n(?:\s*\/\/-.*\n(?:\s{6,}.*\n)*)?\s*\+featureHelp\(id=popupHelp\)/
    .test(read('client/components/main/popup.tpl.jade')), 'popup title bar');
  assert.ok(/\+featureHelp\(id=boardViewHelp\)/.test(read('client/components/boards/boardHeader.jade')));
  assert.ok(/\+featureHelp\(id=sidebarHelp\)/.test(read('client/components/sidebar/sidebar.jade')));
  assert.ok(/\+featureHelp\(id=sectionHelp\)/.test(read('client/components/cards/cardDetails.jade')));
  const pane = read('client/components/settings/leftMenu.jade');
  assert.strictEqual((pane.match(/\+featureHelp\(id=paneHelp\)/g) || []).length, 3,
    'every branch of the pane title');
});

// ── the component ──

const tpl = read('client/components/main/featureHelp.jade');
const css = read('client/components/main/featureHelp.css');
const js = read('client/components/main/featureHelp.js');

test('the ? is a real, named button', () => {
  const btn = tpl.slice(tpl.indexOf('template(name="featureHelp")'), tpl.indexOf('template(name="featureHelpPopup")'));
  assert.ok(/button\.feature-help-btn/.test(btn) && /type="button"/.test(btn));
  assert.ok(/title="\{\{_ 'how-it-works'\}\}"/.test(btn), 'tooltip is how-it-works');
  assert.ok(/aria-label="\{\{_ 'how-it-works'\}\}"/.test(btn), 'and so is its name');
  assert.ok(/fa-question-circle/.test(btn));
});

test('the popup is titled How it works and shows the two headings and texts as text', () => {
  const pop = tpl.slice(tpl.indexOf('template(name="featureHelpPopup")'));
  assert.ok(/Popup\.open\('featureHelp'/.test(js), 'titled by the convention key featureHelpPopup-title');
  const order = ["h2.feature-help-heading {{_ 'what-it-is'}}", 'p.feature-help-text {{_ whatKey}}',
    "h2.feature-help-heading {{_ 'how-it-works'}}", 'p.feature-help-text {{_ howKey}}'];
  let at = -1;
  for (const line of order) {
    const next = pop.indexOf(line);
    assert.ok(next > at, `${line} in order`);
    at = next;
  }
  assert.ok(!/\{\{\{/.test(tpl) && !/!=/.test(tpl), 'never triple braces or unescaped output');
});

test('Escape and Back return the focus to the ? that opened the help', () => {
  assert.ok(/returnFocusSelector:/.test(js));
  const popup = read('client/lib/popup.js');
  assert.ok(/returnFocusSelector: openOptions\.returnFocusSelector/.test(popup));
  assert.ok(/left\.returnFocusSelector/.test(popup));
  // close() already focuses the opener, which for a ? outside a popup is the ? itself.
  assert.ok(/openerElement\.focus\(\)/.test(popup));
});

test('the ? keeps a 24px target, a focus ring and logical sides only', () => {
  assert.ok(/min-width: 28px/.test(css) && /min-height: 28px/.test(css));
  assert.ok(/\.feature-help-btn:focus-visible \{[^}]*outline: 2px solid/.test(css));
  assert.ok(!/\b(?:margin|padding)-(?:left|right)\b|(?:^|[\s;{])(?:left|right)\s*:/m.test(css),
    'no physical left/right, so right-to-left mirrors it');
  assert.ok(/inset-inline-end/.test(css) && /margin-inline-start: auto/.test(css));
});

test('the popup is wide on a desktop, in the CSS and in the offset maths alike', () => {
  assert.ok(/featureHelpPopup: 720/.test(read('client/lib/popupOffset.js')));
  const popupCss = read('client/components/main/popup.css');
  assert.ok(/\[data-popup='featureHelpPopup'\][^{]*\{[^}]*720px/.test(popupCss));
});

test('the component is registered with the app', () => {
  const main = read('client/features/main.js');
  assert.ok(main.includes("import '/client/components/main/featureHelp.jade';"));
  assert.ok(main.includes("import '/client/components/main/featureHelp.js';"));
  assert.ok(read('client/styles.js').includes("import '/client/components/main/featureHelp.css';"));
});

console.log(`featureHelp: ${passed} passed`);
