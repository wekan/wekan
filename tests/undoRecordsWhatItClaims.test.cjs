'use strict';

// Guard: a change that history claims to record is actually recorded.
// Run: node tests/undoRecordsWhatItClaims.test.cjs
//
// The undo stack fails silently. Nothing throws when a change is not recorded -
// the user presses Ctrl+Z, nothing happens, and there is no error anywhere to
// say why. That has already shipped twice:
//
//   #6478  every trackChange call site guarded on `typeof UserPositionHistory
//          !== 'undefined'` against a bare identifier that no file imported. It
//          is an ES-module default export, not a global, so the guard was always
//          false and NOTHING was ever recorded. Undo did nothing at all.
//
//   again  the fix was applied to the list path in server/models/lists.js and
//          not to the card path in models/cards.js, which kept the same dead
//          guard - so list moves became undoable and card moves, the commonest
//          drag on any board, silently did not. docs/Features/Login/Undo/Undo.md
//          said card moves "now actually runs" for months while they did not.
//
// Both are the same mistake, and it is invisible in review because the code
// LOOKS like it records. So this test does not ask whether the call is there; it
// asks whether the thing being called can possibly be defined.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Source scans look at CODE: the comments below quote the dead guard to explain
// it, and a scan that counted the explanation would fail on its own rationale.
const code = f => read(f)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

/* Every file that records history, found rather than listed. */
function recordingFiles() {
  const found = [];
  // '_build' and friends are BUILD OUTPUT: a bundled copy of the whole app, in
  // which every import has already been rewritten by the bundler. Scanning it
  // reports the bundle's own generated code as a source file that fails this
  // rule, which is both false and unfixable.
  const skip = new Set(['node_modules', '.git', '.claude', '.meteor', '.build',
    '_build', '_build-local-test', 'output', '.tools', 'log', 'dist',
    'coverage', 'docs', 'tests']);
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(full);
      else if (/\.js$/.test(entry.name)) {
        const rel = path.relative(ROOT, full);
        if (rel === 'models/userPositionHistory.js') continue; // it IS the collection
        if (code(rel).includes('trackChange(')) found.push(rel);
      }
    }
  })(ROOT);
  return found;
}

const FILES = recordingFiles();

test('the recording sites are the ones this test knows about', () => {
  assert.ok(FILES.length >= 2,
    `expected several trackChange call sites, found ${FILES.length}`);
  assert.ok(FILES.includes('models/cards.js'),
    'card moves must still be recorded somewhere');
  assert.ok(FILES.includes('server/models/lists.js'),
    'list moves must still be recorded somewhere');
});

// THE regression. A call site that never imports the collection is a call site
// that never runs - and it looks completely normal.
test('every file that calls trackChange can actually reach the collection', () => {
  const unreachable = [];
  for (const file of FILES) {
    const text = code(file);
    const imports = /import\s+UserPositionHistory\s+from\s+['"][^'"]*userPositionHistory['"]/.test(text);
    const requires = /require\(\s*['"][^'"]*userPositionHistory['"]\s*\)/.test(text);
    if (!imports && !requires) unreachable.push(file);
  }
  assert.deepEqual(unreachable, [],
    'these call trackChange on an identifier they never import, so the call ' +
    'never happens and undo silently does nothing');
});

// The shape of the original bug, pinned so it cannot come back in a new file:
// `typeof X !== 'undefined'` on a collection is never a check, it is an off
// switch, because a module export is not a global.
test('no recording site gates on an assumed global (negative)', () => {
  const gated = [];
  for (const file of FILES) {
    if (/typeof\s+UserPositionHistory\s*!==\s*['"]undefined['"]/.test(code(file))) {
      gated.push(file);
    }
  }
  assert.deepEqual(gated, [],
    'a module export is not a global; this guard is always false where the ' +
    'collection is not imported, and pointless where it is');
});

// Recording must never be able to break the thing it is recording.
// Structural rather than distance-based: the nearest `try {` before the call has
// to be nearer than the nearest `catch`, which stays true however much code is
// added between the two. A fixed character window did not - inserting one more
// recording call above pushed the `try` out of range and failed a file that was
// perfectly well guarded.
function insideTry(text, at) {
  const before = text.slice(0, at);
  return before.lastIndexOf('try {') > before.lastIndexOf('catch');
}

test('recording is best-effort, never fatal', () => {
  for (const file of FILES) {
    const text = code(file);
    for (const at of [...text.matchAll(/trackChange\(/g)].map(m => m.index)) {
      assert.ok(insideTry(text, at),
        `${file}: a trackChange that throws must not fail the move it records`);
    }
  }
});

// The same rule for the store that replaces it. ChangeHistory.record swallows
// its own errors, so a bare call is safe - what must never happen is a call
// whose FAILURE can propagate, which is why the helper is checked for the
// swallow rather than every call site for a try.
test('the universal history can never fail the change it records', () => {
  const model = read('models/changeHistory.js');
  const body = model.slice(model.indexOf('ChangeHistory.record = async function'));
  assert.match(body, /try \{/, 'record() must not let a bad row break a mutation');
  assert.match(body, /catch \(error\)/);
  assert.match(body, /return null;/, 'and it reports failure by returning nothing');
});

// What undo() can put back, and what is actually recorded, are two different
// lists. Where they differ, undo has dead cases: a user pressing Ctrl+Z after
// that kind of change gets nothing, with no way to tell why. This does not
// demand they match - swimlane/checklist recording is documented as follow-up -
// it demands the difference stay VISIBLE, so it is a known gap and not a
// surprise.
test('the gap between what undo handles and what is recorded is known', () => {
  const model = code('models/userPositionHistory.js');
  const handled = new Set(
    [...model.matchAll(/case '(swimlane|list|card|checklist|checklistItem)':/g)]
      .map(m => m[1]));
  const recorded = new Set();
  for (const file of FILES) {
    for (const m of code(file).matchAll(/entityType:\s*'(\w+)'/g)) recorded.add(m[1]);
  }
  for (const type of recorded) {
    assert.ok(handled.has(type),
      `${type} is recorded but undo() has no case for it, so undoing it does nothing`);
  }

  const notRecorded = [...handled].filter(t => !recorded.has(t)).sort();
  assert.deepEqual(notRecorded, ['checklist', 'checklistItem', 'swimlane'],
    'undo handles these but nothing records them (Undo.md §5, §10: follow-up). ' +
    'If a recording site was added, add the type here; if one was LOST, this is ' +
    'the regression it is here to catch.');
});

// The doc is the only place a reader learns what is undoable. It said card
// moves were recorded while they were not, which is how the gap survived.
test('the doc does not claim more than the code does', () => {
  const doc = read('docs/Features/Login/Undo/Undo.md');
  assert.match(doc, /Undo\.md|position/i);
  assert.doesNotMatch(doc, /already present \(now actually runs\)/,
    'that line claimed card moves were being recorded while the call site had ' +
    'no import and never ran');
});

console.log(`undoRecordsWhatItClaims: ${passed} tests passed`);
