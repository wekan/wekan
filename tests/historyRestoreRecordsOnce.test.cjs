'use strict';

// Guard: a restore leaves ONE row, not two.
// Run: node tests/historyRestoreRecordsOnce.test.cjs
//
// Found by opening the app and restoring a card title. It worked - the title
// went back - and History then showed TWO rows for it: the `restored` row the
// restore writes on purpose, and an `edited` row above it that nobody made,
// describing the same write.
//
// The cause is a deliberate design decision working exactly as intended.
// History.md §8.2 says a restore re-applies content through the SAME setters an
// ordinary edit uses, so validation, collection hooks and Activities all still
// run - `.direct`, which would skip them, is not used. The field-diffing
// `after.update` hook is one of those hooks, so it sees the restore's own write
// and records it.
//
// The fix is to switch off RECORDING, and only recording, for the duration of
// the applier. This pins that it stays switched off, and - more importantly -
// that it is scoped per async context rather than being a module-level boolean:
// a plain flag set during one user's restore would swallow another user's edit
// that happened to land inside the same window, which is a data-loss bug that
// only appears under concurrency and would never be seen in testing.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { AsyncLocalStorage } = require('node:async_hooks');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const scope = read('server/lib/historyRecordingScope.js');
const hooks = read('server/models/changeHistoryHooks.js');
const server = read('server/models/changeHistory.js');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

// The scoping tests are genuinely asynchronous - that is the whole point of
// them - so they are collected and awaited at the end. Running one through the
// synchronous helper above would count it as passed the moment it started, and
// a failed assertion inside it would surface as an unhandled rejection instead
// of a failing run.
const asyncResults = [];
const asyncTest = (name, run) => {
  asyncResults.push(Promise.resolve().then(run).then(() => {
    passed++;
    if (process.env.VERBOSE) console.log(`  ok - ${name}`);
  }));
};

// ---- the wiring ---------------------------------------------------------------

test('the applier runs with recording suppressed', () => {
  assert.match(server, /import \{ withoutRecording \} from '\/server\/lib\/historyRecordingScope'/);
  assert.match(server, /withoutRecording\(\(\) => applier\(row, content\)\)/,
    'the suppression must wrap the applier, which is what does the writing');
});

test('and every recording path asks before writing', () => {
  assert.match(hooks, /import \{ isRecordingSuppressed \} from '\/server\/lib\/historyRecordingScope'/);
  for (const fn of ['recordUpdate', 'recordLifecycle']) {
    const body = new RegExp(`async function ${fn}\\([^)]*\\) \\{([\\s\\S]*?)\\n\\}`).exec(hooks);
    assert.ok(body, `${fn} must exist`);
    assert.match(body[1], /isRecordingSuppressed\(\)/,
      `${fn} records history and must honour the suppression`);
  }
});

// A restore that used .direct would skip Activities too, which is the thing
// History.md §8.2 rules out. Suppressing the recording is not a licence to start
// skipping the hooks.
test('the restore still writes through the normal setters (negative)', () => {
  const appliers = server.slice(server.indexOf('// ---- appliers'),
    server.indexOf('// ---- the read method'));
  assert.doesNotMatch(appliers, /\.direct\./,
    'History.md §8.2: a restore runs the same hooks, validation and Activities ' +
    'an ordinary edit does');
});

// ---- the scoping, which is the part that matters under load -------------------

test('suppression is per async context, not a module-level flag', () => {
  assert.match(scope, /AsyncLocalStorage/,
    'a shared boolean would swallow a concurrent edit by another user');
  assert.doesNotMatch(scope, /^let \w+ = (?:true|false);/m,
    'no module-level mutable flag');
});

// The behaviour itself, run for real: the same primitive the module uses, with
// two overlapping async operations. This is the failure a boolean would produce.
asyncTest('a concurrent write outside the scope is still recorded', async () => {
  const storage = new AsyncLocalStorage();
  const suppressed = () => storage.getStore() === true;
  const seen = [];

  const record = label => { if (!suppressed()) seen.push(label); };

  const restore = storage.run(true, async () => {
    await new Promise(r => setTimeout(r, 20));
    record('the restore\'s own write');       // must NOT be recorded
    return 'done';
  });
  const otherUser = (async () => {
    await new Promise(r => setTimeout(r, 10));  // lands INSIDE the restore
    record('another user\'s edit');            // must be recorded
  })();

  await Promise.all([restore, otherUser]);
  assert.deepEqual(seen, ["another user's edit"],
    'the restore\'s write is suppressed and the concurrent edit is not');
});

asyncTest('the scope survives an await inside the applier', async () => {
  const storage = new AsyncLocalStorage();
  const inside = await storage.run(true, async () => {
    await new Promise(r => setTimeout(r, 5));
    await new Promise(r => setImmediate(r));
    return storage.getStore();
  });
  assert.equal(inside, true,
    'an applier awaits a findOne and then an update; the scope must cover both');
  assert.equal(storage.getStore(), undefined, 'and must not leak out of it');
});

Promise.all(asyncResults).then(() => {
  console.log(`historyRestoreRecordsOnce: ${passed} tests passed`);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
