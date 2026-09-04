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
