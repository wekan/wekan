'use strict';

// A .jade file is not picked up by being on disk. Every one of them has to be
// imported from a `client/features/*.js` list, and a template that is not
// imported is "No such template: <name>" the moment something renders it -
// which is how `headerBarControls.jade` shipped: the file existed, both header
// bars included `+headerSearchButton`, and All Boards threw on render.
//
// Two things are checked, both of which have gone wrong:
//   * every .jade under client/components is imported somewhere;
//   * every `+template` used in one of them resolves to a template that some
//     imported .jade actually defines.
//
// Run: node tests/templateRegistration.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walk(dir, ext, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, ext, out);
    else if (entry.name.endsWith(ext)) out.push(rel);
  }
  return out;
}

const jadeFiles = walk('client/components', '.jade');
// The import lists: client/features/*.js plus the few top-level client files.
const importSources = [
  ...walk('client/features', '.js'),
  ...fs.readdirSync(path.join(ROOT, 'client'))
    .filter(f => f.endsWith('.js'))
    .map(f => `client/${f}`),
];
const allImports = importSources.map(read).join('\n');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('templateRegistration:');

test('every .jade under client/components is imported', () => {
  const missing = jadeFiles.filter(f => !allImports.includes(`'/${f}'`));
  assert.deepStrictEqual(missing, [],
    `these compile to nothing and their templates do not exist at runtime: ${missing.join(', ')}`);
});

test('and every +template it includes is defined by one of them', () => {
  // Only templates DEFINED in this repo's jade are resolvable this way; a
  // `+something` that is not defined anywhere is the runtime error.
  const defined = new Set();
  for (const f of jadeFiles) {
    for (const m of read(f).matchAll(/^\s*template\(name=["'](\w+)["']\)/gm)) defined.add(m[1]);
  }
  // Not from a .jade in this repo: `+Template.dynamic` is Blaze's own, and
  // these three come from packages (useraccounts, wekan-markdown).
  const external = new Set(['Template', 'atForm', 'markdown', 'mentions', 'fullcalendar']);

  // A dangling include that is NOT this change's, recorded rather than hidden.
  // `client/components/cards/subtasks.jade` includes `+subtaskDeleteDialog`,
  // which no template defines - it would throw the moment it rendered. It never
  // does: the branch is `if toggleDeleteDialog.get`, and that ReactiveVar is
  // initialised to false in subtasks.js and never set to true by anything. So
  // it is unreachable dead markup around a template that was never written,
  // left here with its reason so whoever picks up subtask deletion sees it.
  // The LINE is pinned on purpose - it is what stops this exemption covering a
  // new dangling include in the same file - so it moves when the file does: it
  // was line 8 until the template's own <h3> came out, the card's section
  // header drawing that title now.
  const KNOWN_DANGLING = new Set(['client/components/cards/subtasks.jade:7: +subtaskDeleteDialog']);

  const unresolved = [];
  for (const f of jadeFiles) {
    read(f).split('\n').forEach((line, i) => {
      // `+name` or `+name(args)`, at the start of a jade line.
      const m = /^\s*\+([A-Za-z_$][\w$]*)/.exec(line);
      if (!m || external.has(m[1]) || defined.has(m[1])) return;
      const where = `${f}:${i + 1}: +${m[1]}`;
      if (!KNOWN_DANGLING.has(where)) unresolved.push(where);
    });
  }
  assert.deepStrictEqual(unresolved, [],
    `no .jade in client/components defines these: ${unresolved.join(', ')}`);

  // And the known one must still be exactly where it is said to be, so the
  // exemption cannot quietly cover a NEW dangling include in that file.
  for (const known of KNOWN_DANGLING) {
    const [file, lineNo, what] = [known.split(':')[0], Number(known.split(':')[1]), known.split(': ')[1]];
    const line = read(file).split('\n')[lineNo - 1];
    assert.ok(line && line.trim().startsWith(what),
      `the known dangling include moved: ${known} is now "${line && line.trim()}"`);
  }
});

test('the shared header controls are gone, with the bars they were for', () => {
  // headerBarControls.jade held one Search button and one Multi-Selection
  // button, written for the board's second header bar and All Boards'. Both
  // bars are gone: All Boards keeps those two as sidebar rows, and the board's
  // are icons in the first header bar. A template shared by nobody is not
  // shared, it is indirection.
  assert.ok(!fs.existsSync(path.join(ROOT, 'client/components/boards/headerBarControls.jade')),
    'the file must be gone');
  assert.ok(!allImports.includes('headerBarControls'), 'and nothing may import it');
  const boardJade = read('client/components/boards/boardHeader.jade');
  assert.ok(/js-open-search-view/.test(boardJade), 'the board draws Search itself');
  assert.ok(/js-multiselection-activate/.test(boardJade), 'and Multi-Selection');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\ntemplateRegistration: ${passed} tests passed`);
