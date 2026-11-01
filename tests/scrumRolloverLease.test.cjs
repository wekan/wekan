'use strict';
// A large sprint's background rollover (server/scrum.js claimRollover) and a
// large batch's background undo or redo (server/lib/scrumBatchJobs.js claim)
// run on ONE server at a time: each step first takes or renews a one-minute
// lease on the sprint or the job, and another server's live lease leaves the
// job to that server. Before this, every server that found the job after a
// restart resumed it, two wrote alike, and the loser's compare-and-set
// conflict showed in the Scrum view as a failure.
//
// The claim functions are evaluated FROM THEIR SOURCE against an in-memory
// document with a small matcher for the operators they use ($or, $exists,
// $lt, dotted paths, $set), so the filter that decides is the one tested -
// no database, no Meteor. The full-app Mocha test
// (server/lib/tests/scrumSnapshotRows.tests.js) covers the same through
// MongoDB; this one runs in the node suites in milliseconds.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

// --- a matcher for exactly the operators the claim filters use ------------
const at = (doc, dotted) => dotted.split('.').reduce((v, k) => (v == null ? undefined : v[k]), doc);
function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === '$or') return cond.some(clause => matches(doc, clause));
    const value = at(doc, key);
    if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      return Object.entries(cond).every(([op, arg]) => {
        if (op === '$exists') return (value !== undefined) === arg;
        if (op === '$lt') return value !== undefined && value < arg;
        throw new Error(`matcher: unsupported operator ${op}`);
      });
    }
    return value === cond;
  });
}
function fakeCollection(doc) {
  return { rawCollection: () => ({ async updateOne(filter, update) {
    if (!doc.current || !matches(doc.current, filter)) return { matchedCount: 0 };
    for (const [op, fields] of Object.entries(update)) {
      if (op !== '$set') throw new Error(`fake: unsupported update ${op}`);
      for (const [k, v] of Object.entries(fields)) {
        if (k.includes('.')) throw new Error('fake: dotted $set not expected in a claim');
        doc.current[k] = v;
      }
    }
    return { matchedCount: 1 };
  } }) };
}

// Build the real claim function from its source text.
function claimFrom(file, fnName, collectionName, leaseConst, serverId) {
  const src = read(file);
  const m = src.match(new RegExp(`async function ${fnName}\\((\\w+)\\) \\{\\n([\\s\\S]*?)\\n\\}`));
  assert.ok(m, `${file} defines async function ${fnName}`);
  const lease = src.match(new RegExp(`const ${leaseConst} = (\\d+);`));
  assert.ok(lease, `${file} defines ${leaseConst}`);
  const doc = { current: null };
  const fn = new Function(collectionName, 'SERVER_ID', leaseConst, `return async function (${m[1]}) {\n${m[2]}\n};`)(
    fakeCollection(doc), serverId, Number(lease[1]));
  return { claim: fn, doc, leaseMs: Number(lease[1]) };
}

const CLAIMS = [
  { name: 'sprint rollover', file: 'server/scrum.js', fn: 'claimRollover', coll: 'ScrumSprints', ms: 'ROLLOVER_LEASE_MS', field: 'rolloverLease' },
  { name: 'undo/redo batch job', file: 'server/lib/scrumBatchJobs.js', fn: 'claim', coll: 'ScrumBatchJobs', ms: 'LEASE_MS', field: 'lease' },
];

for (const c of CLAIMS) {
  test(`${c.name}: a free, own or expired lease is taken and runs for about a minute`, async () => {
    const { claim, doc, leaseMs } = claimFrom(c.file, c.fn, c.coll, c.ms, 'this-server');
    assert.equal(leaseMs, 60000, 'one minute: a server that went away loses it soon');
    // No lease yet.
    doc.current = { _id: 'x' };
    const before = Date.now();
    assert.equal(await claim('x'), true);
    assert.equal(doc.current[c.field].owner, 'this-server');
    const until = doc.current[c.field].until.getTime();
    assert.ok(until >= before + leaseMs && until <= Date.now() + leaseMs, 'until = now + lease');
    // Its own lease is renewed.
    doc.current[c.field].until = new Date(Date.now() + 5);
    assert.equal(await claim('x'), true);
    assert.ok(doc.current[c.field].until.getTime() >= Date.now() + leaseMs - 1000, 'renewed');
    // Another server's lease that ran out is taken over.
    doc.current[c.field] = { owner: 'another-server', until: new Date(Date.now() - 1000) };
    assert.equal(await claim('x'), true);
    assert.equal(doc.current[c.field].owner, 'this-server');
  });

  test(`NEGATIVE: ${c.name}: another server's live lease leaves the job to it, untouched`, async () => {
    const { claim, doc } = claimFrom(c.file, c.fn, c.coll, c.ms, 'this-server');
    const foreign = { owner: 'another-server', until: new Date(Date.now() + 60000) };
    doc.current = { _id: 'x', [c.field]: { ...foreign } };
    assert.equal(await claim('x'), false);
    assert.deepEqual(doc.current[c.field], foreign, 'the other server keeps its lease');
    // And a document that is gone is not claimed.
    doc.current = null;
    assert.equal(await claim('x'), false);
  });
}

test('every step claims before it works, and a retried close says the rollover runs elsewhere', () => {
  const scrum = stripComments(read('server/scrum.js'));
  const run = scrum.match(/async function runRollover\(sprintId\) \{([\s\S]*?)\n\}/);
  assert.ok(run, 'runRollover exists');
  const body = run[1];
  assert.match(body, /^\s*if \(!await claimRollover\(sprintId\)\) return;/, 'claims before clearing the error');
  const loop = body.slice(body.indexOf('for (;;)'));
  assert.ok(loop.indexOf('if (!await claimRollover(sprintId)) return;') > -1, 'renews on every step');
  assert.ok(loop.indexOf('if (!await claimRollover(sprintId)) return;') < loop.indexOf('rolloverStep('),
    'the lease is taken before the step writes');
  assert.match(scrum, /if \(!await claimRollover\(closed\._id\)\) throw new Meteor\.Error\('scrum-rollover-running'/,
    'the inline close refuses while another server runs it');
  const jobs = stripComments(read('server/lib/scrumBatchJobs.js'));
  const loopJobs = jobs.match(/async function run\(boardId\) \{([\s\S]*?)\n\}/)[1];
  assert.ok(loopJobs.indexOf('!await claim(boardId)') > -1 && loopJobs.indexOf('!await claim(boardId)') < loopJobs.indexOf('stepper('),
    'the undo/redo job claims before every step');
});

test('the lease is not History content, not sent to the browser, and removed when the rollover finishes', () => {
  const { historyDocument } = require('../models/lib/scrumHistory');
  const sprint = { _id: 's', boardId: 'b', name: 'Sprint 1', rolloverPending: true,
    rolloverLease: { owner: 'srv', until: new Date() } };
  const recorded = historyDocument('scrum-sprint', sprint);
  assert.equal(recorded.name, 'Sprint 1', 'content is kept');
  assert.equal('rolloverLease' in recorded, false, 'NEGATIVE: an undo never restores a lease');
  const scrum = stripComments(read('server/scrum.js'));
  assert.match(scrum, /delete sprint\.rolloverLease;/, 'getScrumBoardData drops it before sending');
  assert.match(scrum, /\$unset: \{ rolloverPending: '', rolloverTotal: '', rolloverDone: '', rolloverError: '', rolloverLease: '' \}/,
    'the finished rollover releases its lease');
  // The batch job's progress sent to the browser picks fields, so `lease` cannot leak.
  assert.match(scrum, /ScrumBatchJobs\.findOneAsync\(boardId, \{ fields: \{ direction: 1, done: 1, total: 1, state: 1, error: 1 \} \}\)/);
});

test('NEGATIVE: nothing else in the tree writes a Scrum lease without the claim filter', () => {
  // The shape of the fault: a $set of the lease with no "free, own or expired"
  // condition grabs a live lease from another server. Each lease field is set
  // in exactly one place, its claim function.
  // The application's own source; generated bundles (_build*, .build) hold a
  // second copy of every file and are not source.
  const skip = new Set(['node_modules', 'tests']);
  const files = [];
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(c?js|mjs)$/.test(e.name)) files.push(p);
    }
  }
  for (const dir of ['server', 'models', 'imports', 'client', 'config', 'packages']) walk(path.join(root, dir));
  const setters = { rolloverLease: [], lease: [] };
  for (const file of files) {
    const src = stripComments(fs.readFileSync(file, 'utf8'));
    if (/\$set: \{[^}]*\brolloverLease\b/.test(src) || /'rolloverLease\.[a-z]+'\s*:/.test(src.replace(/\$or: \[[^\]]*\]/g, ''))) {
      setters.rolloverLease.push(path.relative(root, file));
    }
    if (/ScrumBatchJobs[\s\S]{0,200}\$set: \{ lease\b/.test(src) || (src.includes('ScrumBatchJobs') && /\$set: \{[^}]*'lease\./.test(src))) {
      setters.lease.push(path.relative(root, file));
    }
  }
  assert.deepEqual(setters.rolloverLease, ['server/scrum.js']);
  assert.deepEqual(setters.lease, ['server/lib/scrumBatchJobs.js']);
  for (const c of CLAIMS) {
    const src = stripComments(read(c.file));
    const sets = src.match(new RegExp(`\\$set: \\{ ${c.field}: \\{`, 'g')) || [];
    assert.equal(sets.length, 1, `${c.file} sets ${c.field} once, in ${c.fn}`);
    const fn = src.match(new RegExp(`async function ${c.fn}\\(\\w+\\) \\{[\\s\\S]*?\\n\\}`))[0];
    assert.ok(fn.includes(`$set: { ${c.field}: {`), `that one place is ${c.fn}`);
    assert.ok(fn.includes(`{ ${c.field}: { $exists: false } }`) && fn.includes(`{ '${c.field}.until': { $lt: now } }`),
      `${c.fn} only takes a free or expired lease`);
  }
});
