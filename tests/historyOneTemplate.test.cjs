'use strict';

// Guard: there is exactly ONE History view, and every menu opens it.
// Run: node tests/historyOneTemplate.test.cjs
//
// docs/Features/Reports/History/History.md §7a: "Every non-card-group surface is
// the same historyTable with a different changeHistory.page scope; there is ONE
// implementation, parametrised by scope ... Concretely, adding History to a new
// menu = (1) a menu item that opens historyPopup with a scope, (2) nothing
// else."
//
// That sentence is a rule about maintenance, not about tidiness. Six copies of a
// table drift: one gets RTL and the others do not, one gets the search fixed and
// the others keep the bug, one keeps loading the whole log because nobody
// remembered to page it. This test is what keeps the second copy from ever being
// written — a new History surface has to reuse the template or fail here.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const jade = read('client/components/history/historyTable.jade');
const js = read('client/components/history/historyTable.js');
const feature = read('client/features/history.js');
const clientImports = read('client/imports.js');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

/* Every .jade under client/, so a second History table anywhere is found. */
function jadeFiles(dir = path.join(ROOT, 'client'), out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jadeFiles(full, out);
    else if (entry.name.endsWith('.jade')) out.push(full);
  }
  return out;
}

// ---- one template ------------------------------------------------------------

test('the history table is defined exactly once, in one file', () => {
  const defining = [];
  for (const file of jadeFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/^template\(name="(\w*[Hh]istory\w*)"\)/gm)) {
      defining.push([path.relative(ROOT, file), m[1]]);
    }
  }
  const names = defining.map(d => d[1]).sort();
  assert.deepEqual(names, ['historyPopup', 'historyTable'],
    `expected only historyTable and its popup wrapper, found: ${JSON.stringify(defining)}`);
  for (const [file] of defining) {
    assert.equal(file, 'client/components/history/historyTable.jade',
      'both live in the one History component file');
  }
});

// The popup wrapper must stay a wrapper. The moment it grows its own table, the
// duplication this test exists to prevent has already happened.
test('the popup only passes the scope through', () => {
  const popup = jade.slice(jade.indexOf('template(name="historyPopup")'));
  assert.match(popup, /\+historyTable\(/, 'it renders the one table');
  assert.doesNotMatch(popup, /table\.|each row|js-history-search/,
    'the popup must not grow a table of its own');
});

// ---- every scope reaches it the same way -------------------------------------

test('the table takes its scope from the data context, not from a copy per scope', () => {
  assert.match(jade, /\+historyTable\(scope=scope scopeId=scopeId group=group userId=userId\)/,
    'one call site, four parameters - that is the whole parametrisation');
  assert.match(js, /scope: context\.scope \|\| null/);
  assert.match(js, /scopeId: context\.scopeId \|\| null/);
  assert.match(js, /group: context\.group \|\| null/);
});

test('every menu that offers History opens the same popup', () => {
  const menus = [
    ['client/components/cards/cardDetails.js', 'card'],
    ['client/components/lists/listHeader.js', 'list'],
    ['client/components/swimlanes/swimlaneHeader.js', 'swimlane'],
  ];
  for (const [file, scope] of menus) {
    const text = read(file);
    assert.match(text, /Popup\.open\('history'/,
      `${file} must open the shared popup`);
    assert.match(text, new RegExp(`scope: '${scope}'`),
      `${file} must pass scope '${scope}'`);
    // The scope has to travel in the key the popup actually reads. A bare second
    // argument is OPTIONS, and would be silently ignored - the popup would open
    // on the menu's own data context and show the wrong history.
    assert.match(text, /dataContextIfCurrentDataIsUndefined: \{ scope:/,
      `${file}: the scope must reach the template, not sit in the options`);
  }
});

test('and each of those menus has a visible entry, not just a handler', () => {
  for (const [file, cls] of [
    ['client/components/cards/cardDetails.jade', 'js-card-history'],
    ['client/components/lists/listHeader.jade', 'js-list-history'],
    ['client/components/swimlanes/swimlaneHeader.jade', 'js-swimlane-history'],
  ]) {
    const text = read(file);
    assert.match(text, new RegExp(cls),
      `${file}: a handler with no menu item is unreachable`);
    assert.match(text, /fa-history/, `${file}: the entry should carry the History icon`);
  }
});

// ---- the parts that only work because there is one of them -------------------

test('state lives on the template instance, never on the data context', () => {
  assert.match(js, /new ReactiveDict\(\)/);
  assert.match(js, /instance\.state\.set\('search'/,
    '#6479: a re-render drops fields written onto a Blaze data context, and the ' +
    'symptom is a search box that clears itself as you type');
  assert.doesNotMatch(js, /this\.data\.(search|page|selected)\s*=/);
});

test('the table pages on the server rather than loading the whole log', () => {
  assert.match(js, /pageSize: PAGE_SIZE/);
  assert.match(js, /Meteor\.call\('changeHistory\.page'/);
  assert.doesNotMatch(js, /\.find\(\)\.fetch\(\)/,
    'History.md §6: only the current page is loaded');
});

test('RTL is handled once, here, rather than per surface', () => {
  assert.match(jade, /history-rtl/);
  assert.match(js, /isRtl\(\)/);
  const css = read('client/components/history/historyTable.css');
  assert.match(css, /\.history-rtl \{ flex-direction: row-reverse; \}/);
  assert.match(css, /border-inline-end|margin-inline-start|text-align: start/,
    'logical properties, so the columns follow the document direction');
});

// The label of every group comes from the word the card view already uses, which
// is why this landed without 197 new translation files.
test('group and column labels reuse words the app already has', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const used = [...jade.matchAll(/\{\{_ '([a-z-]+)'\}\}/g)].map(m => m[1]);
  for (const key of used) {
    assert.ok(en[key] !== undefined, `${key} is used by the template but not defined`);
  }
  const groupKeys = /const GROUP_KEYS = \{([\s\S]*?)\};/.exec(js);
  assert.ok(groupKeys, 'the group label map must exist');
  for (const m of groupKeys[1].matchAll(/: '([a-z-]+)'/g)) {
    assert.ok(en[m[1]] !== undefined,
      `group label '${m[1]}' must be a key the app already translates`);
  }
});

test('the four new change-type words exist and are translated everywhere', () => {
  const dir = path.join(ROOT, 'imports', 'i18n', 'data');
  const keys = ['history-change-removed', 'history-change-edited',
    'history-change-moved', 'history-change-restored'];
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of keys) assert.ok(en[key], `${key} must exist in English`);
  assert.ok(en.added, "'added' is reused for the fifth, rather than added again");

  let translated = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.i18n.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (keys.every(k => data[k] !== undefined)) translated++;
  }
  assert.ok(translated > 150,
    `the Action column is the one a reader must understand; found only ${translated} locales`);
});

// ---- the panel is actually usable ---------------------------------------------

// Found by opening it. The markup was right from the start - search input,
// disabled Restore, pagination - and the panel was still unusable, because a
// popup is 380px wide: the contributor pane took 129px of it, the search box was
// squeezed to 32px, and one row of a four-column table had to be scrolled
// sideways to be read. Nothing that reads the source could have said so.
test('History is a full-width panel, declared in BOTH places that decide width', () => {
  const css = read('client/components/main/popup.css');
  const offset = read('client/lib/popupOffset.js');

  const rule = css.slice(css.indexOf("data-popup='exportBoardPopup'"));
  assert.ok(rule.slice(0, 1400).includes("data-popup='historyPopup'"),
    'popup.css must give historyPopup the full-width panel rule');

  const list = offset.slice(offset.indexOf('const FULL_WIDTH_POPUPS'),
    offset.indexOf('const wide ='));
  assert.match(list, /'historyPopup'/,
    'popupOffset.js clamps a popup using its width; a panel missing from this ' +
    'list is placed as if it were 380px and opens most of the way off screen');
});

// The panel ends the same distance from the bottom of the window that it starts
// from the top. Measured in a browser at 1280x720: 10px on all four sides, a
// 700px panel, and the rows scrolling inside it rather than stretching it.
//
// Three separate rules are needed for that and each was found by measuring:
// a HEIGHT (without one the box was only as tall as its contents - a two-row
// table in the top eighth of the window); FIXED positioning (every other popup
// is absolute in document coordinates, which is right for a menu that should
// travel with its button, and wrong for a box sized from the viewport: opened
// on a page scrolled 53px down and scrolled back, it sat 63px low with 43px
// past the bottom); and NO margin (the base .pop-over adds `margin-top: 6px` as
// the gap between a menu and its button, which on a box of exactly 100vh - 20px
// pushed 6px past the bottom - 16px above against 4px below).
test('the panel leaves the same gap below it as above it', () => {
  const css = read('client/components/main/popup.css');
  // The selector appears in more than one rule - it is the last of the
  // full-width group as well - so take the block that actually sizes it.
  const blocks = [...css.matchAll(/\.pop-over\[data-popup='historyPopup'\] \{([^}]*)\}/g)]
    .map(m => m[1]);
  const rule = [blocks.find(b => /(?<!max-)height: calc\(100vh/.test(b))];
  assert.ok(rule[0], 'historyPopup must have its own sizing rule');

  // (?<!max-) on purpose: `max-height: calc(100vh - 20px)` matches a loose
  // pattern here and is exactly what this test exists to reject - a maximum
  // alone lets a short table stay short, which is the state being fixed.
  assert.match(rule[0], /(?<!max-)height: calc\(100vh - 20px\) !important/,
    'a maximum alone lets a short table stay short; state the height');
  assert.match(rule[0], /position: fixed !important/,
    'a box sized from the viewport must be positioned from the viewport');
  assert.match(rule[0], /top: 10px !important/);
  // Logical, not `left`: tests/rtl.test.js rejects physical offsets, and both
  // ends must be named so the inline `left:` the template writes is overridden
  // in RTL as well as LTR.
  assert.match(rule[0], /inset-inline-start: 10px !important/);
  assert.match(rule[0], /inset-inline-end: auto !important/);

  // Same gutter as the width, and as viewportPadding in popupOffset.js.
  const width = css.slice(css.indexOf("data-popup='exportBoardPopup'"));
  assert.match(width.slice(0, 1600), /width: calc\(100vw - 20px\)/,
    'the horizontal gutter is the same 10px each side');
});

test('and the pinned panels drop the margin meant for anchored menus', () => {
  const css = read('client/components/main/popup.css');
  const rule = /\.pop-over\[data-popup='historyPopup'\] \{\s*\n\s*margin-top: 0/.exec(css)
    || /margin-top: 0 !important;\n\s*margin-bottom: 0 !important;/.exec(css);
  assert.ok(rule, 'the margin must be zeroed for the viewport-pinned panels');
  const block = css.slice(css.indexOf('No `margin-top: 6px` on a panel'));
  for (const name of ['historyPopup', 'exportBoardPopup']) {
    assert.ok(block.slice(0, 1400).includes(`data-popup='${name}'`),
      `${name} is pinned to the gutter and must not carry the anchor margin`);
  }
});

// The height is only worth having if it reaches the rows.
test('the height reaches the table instead of becoming blank panel', () => {
  const popup = read('client/components/main/popup.css');
  const own = read('client/components/history/historyTable.css');
  assert.match(popup, /\.pop-over\[data-popup='historyPopup'\] \.content-wrapper[\s\S]{0,200}height: 100%/,
    'the wrappers between the shell and the template must pass the height down');
  assert.match(own, /\.history-table \{[^}]*height: 100%/);
  assert.match(own, /\.history-main \{[^}]*flex-direction: column/);
  assert.match(own, /\.history-scroll \{[\s\S]*?flex: 1 1 auto/,
    'the rows take what the controls leave');
  assert.doesNotMatch(own, /\.history-scroll \{[\s\S]*?max-height: 55vh/,
    'a fixed slice of the viewport inside a box already sized from it clips early');
});

// A <table> given `display: block` to make it scroll is no longer a table: the
// cells stop sharing column widths, so the header and the rows drift apart. The
// scroll belongs on a wrapper.
test('the rows scroll in a wrapper, and the table stays a table', () => {
  const css = read('client/components/history/historyTable.css');
  assert.match(jade, /\.history-scroll\n\s+table\.history-rows/,
    'the table must sit inside the scroll container');
  assert.match(css, /\.history-scroll \{[^}]*overflow: auto/,
    'the wrapper is what scrolls');
  const table = /\.history-rows \{([^}]*)\}/.exec(css);
  assert.ok(table, '.history-rows must be styled');
  assert.doesNotMatch(table[1], /display:\s*block/,
    'display:block breaks column alignment between thead and tbody');
});

// Also found only by opening it. WeKan hides every bare checkbox app-wide -
// forms.css: `[type="checkbox"]:not(:checked), [type="checkbox"]:checked {
// display: none }` - and draws `.materialCheckBox` divs instead. A real
// <input type="checkbox"> here rendered 0x0: the row was visible, could never
// be ticked, and Restore stayed disabled with no way to enable it.
test('the row selector is the checkbox WeKan actually draws', () => {
  assert.match(jade, /\.materialCheckBox\.js-history-select/,
    'use the app\'s own control, not an input the app hides');
  assert.doesNotMatch(jade, /input\.js-history-select/,
    'a bare checkbox is display:none everywhere in WeKan');
  assert.match(jade, /class="\{\{#if row\.isSelected\}\}is-checked\{\{\/if\}\}"/,
    'it is drawn from the selection state, which is where the truth lives');
  assert.match(js, /'click \.js-history-select'/,
    'a div has no change event and no checked property to read');
  assert.doesNotMatch(js, /currentTarget\.checked/,
    'there is no .checked on a div - reading it silently deselects everything');
});

// The whole table rendered one row of four empty cells because of this: with
// `{{#each row in rows}}` Blaze binds `row` as a NAME and leaves the data
// context alone, so a bare {{_id}} resolves against the OUTER context. Nothing
// errors; the cells are simply blank.
test('every field inside an each-in loop is reached through its loop variable', () => {
  const loops = [
    [/each row in rows([\s\S]*?)(?=\n {6}else\b)/, 'row'],
    [/each contributor in contributors([\s\S]*?)(?=\n {4}\.history-main)/, 'contributor'],
  ];
  for (const [pattern, name] of loops) {
    const body = pattern.exec(jade);
    assert.ok(body, `the ${name} loop must be found`);
    const bare = [...body[1].matchAll(/\{\{(?:#if |_ )?([a-zA-Z_][\w]*)\}\}/g)]
      .map(m => m[1])
      .filter(f => !['else'].includes(f));
    assert.deepEqual(bare, [],
      `these resolve against the outer context and render nothing: ` +
      `${bare.join(', ')} - write ${name}.<field>`);
  }
});

// ---- it is in the bundle ------------------------------------------------------

// package.json sets meteor.mainModule, so a file nothing imports is simply not
// there: an unimported .jade means the menu item opens nothing at all.
test('the template, its code and its styles are all imported', () => {
  for (const part of ['historyTable.jade', 'historyTable.js', 'historyTable.css']) {
    assert.match(feature, new RegExp(part.replace('.', '\\.')),
      `${part} must be imported or it is not in the bundle`);
  }
  assert.match(clientImports, /import '\/client\/features\/history';/,
    'and the feature module itself must be imported');
});

console.log(`historyOneTemplate: ${passed} tests passed`);
