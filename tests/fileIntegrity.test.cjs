'use strict';

// Filesystem storage integrity, crashes and downtime
// (design: docs/Security/Remediation/WeKan.md §13).
//
// WeKan's attachments and avatars are files under WRITABLE_PATH, and nothing
// checked that they are still the files WeKan stored. A daily, CPU-gated, paced
// scan now records name, size, modification time and md5/sha256/sha512 per file,
// signs that record with ed25519, and re-checks it.
//
// The finding an admin is warned about is a change WITH NO RECORD SAYING WHY -
// files change when people use WeKan, and those changes are accounted for. So
// most of this suite is about NOT crying wolf: an ordinary edit, a first sight
// of a file, a busy machine, a run that ran out of time.
//
// Run: node tests/fileIntegrity.test.cjs

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const {
  DIGESTS,
  FINDINGS,
  PACING,
  manifestLine,
  compareEntry,
  classifyChange,
  nextStep,
  isDue,
} = require('../models/lib/fileIntegrity');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const digestsOf = text => {
  const out = {};
  DIGESTS.forEach(name => {
    out[name] = crypto.createHash(name).update(text).digest('hex');
  });
  return out;
};

const entry = (text, over = {}) => ({
  path: '/data/files/attachments/a1.png',
  size: Buffer.byteLength(text),
  mtimeMs: 1_700_000_000_000,
  digests: digestsOf(text),
  ...over,
});

// ------------------------------------------------- all three hashes, checked

test('all three digests are kept, and md5 is never the only one', () => {
  assert.deepStrictEqual(DIGESTS, ['md5', 'sha256', 'sha512']);
  assert.ok(DIGESTS.length >= 3, 'md5 alone is not collision resistant');
});

test('an unchanged file produces no finding at all', () => {
  const before = entry('the original bytes');
  assert.deepStrictEqual(compareEntry(before, { ...before }), []);
});

test('THE POINT: replaced contents are caught by every digest', () => {
  const before = entry('the original bytes');
  const after = entry('something else entirely');
  const findings = compareEntry(before, after);
  const kinds = findings.map(f => f.finding);
  assert.ok(kinds.includes(FINDINGS.CONTENT), 'the content change is reported');
  assert.strictEqual(findings.find(f => f.finding === FINDINGS.CONTENT).severity, 'high');
});

test('a file kept the SAME SIZE but changed is still caught', () => {
  // The case a size check alone misses, which is why digests are the primary
  // test and size is a secondary note.
  const before = entry('aaaa');
  const after = entry('bbbb');
  assert.strictEqual(before.size, after.size);
  assert.ok(compareEntry(before, after).some(f => f.finding === FINDINGS.CONTENT));
});

test('digests DISAGREEING is worse than digests changing', () => {
  // Two digests over the same bytes cannot disagree. If they do, the bytes were
  // not read the same way twice - or somebody updated one hash and not the rest.
  const before = entry('the original bytes');
  const after = entry('the original bytes');
  after.digests.sha256 = crypto.createHash('sha256').update('tampered').digest('hex');
  const findings = compareEntry(before, after);
  const disagree = findings.find(f => f.finding === FINDINGS.DIGEST_DISAGREE);
  assert.ok(disagree, 'a partial digest change is its own finding');
  assert.strictEqual(disagree.severity, 'critical');
});

test('a missing file, and a file WeKan never stored', () => {
  const before = entry('x');
  assert.strictEqual(compareEntry(before, null)[0].finding, FINDINGS.MISSING);
  assert.strictEqual(compareEntry(null, before)[0].finding, FINDINGS.UNTRACKED);
  // An untracked file is a low note: a leftover, a backup copy, an operator's
  // scratch file. It is not evidence of anything on its own.
  assert.strictEqual(compareEntry(null, before)[0].severity, 'low');
});

test('the modification time is checked, and moving BACKWARDS is worse', () => {
  const before = entry('same bytes');
  const forward = { ...before, mtimeMs: before.mtimeMs + 60_000 };
  const backward = { ...before, mtimeMs: before.mtimeMs - 60_000 };

  const f = compareEntry(before, forward).find(x => x.finding === FINDINGS.MTIME);
  assert.strictEqual(f.severity, 'low', 'a copy or a restore moves it forward');

  const b = compareEntry(before, backward).find(x => x.finding === FINDINGS.MTIME);
  assert.strictEqual(b.severity, 'medium', 'nothing moves a timestamp backwards by accident');
  assert.ok(/BACKWARDS/.test(b.detail));
});

// --------------------------------------------------------- the ed25519 half

test('ed25519 signs the record, so the RECORD cannot be quietly rewritten', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const original = entry('the original bytes');
  const line = manifestLine(original);
  const signature = crypto.sign(null, Buffer.from(line), privateKey);

  assert.strictEqual(crypto.verify(null, Buffer.from(line), publicKey, signature), true);

  // An attacker who replaces the file AND updates the stored hashes to match
  // still cannot produce a signature for the new record.
  const forged = entry('replaced bytes');
  assert.strictEqual(
    crypto.verify(null, Buffer.from(manifestLine(forged)), publicKey, signature),
    false,
  );
});

test('an invalid signature is a critical finding on its own', () => {
  const before = entry('x');
  const findings = compareEntry(before, { ...before }, { signatureValid: false });
  assert.strictEqual(findings[0].finding, FINDINGS.SIGNATURE);
  assert.strictEqual(findings[0].severity, 'critical');
});

test('the signed line is canonical: same input, same bytes, every time', () => {
  const a = entry('x');
  // Key order must not matter - it is built field by field, not from JSON.
  const b = { digests: a.digests, mtimeMs: a.mtimeMs, size: a.size, path: a.path };
  assert.strictEqual(manifestLine(a), manifestLine(b));
  assert.ok(manifestLine(a).includes('md5='));
  assert.ok(manifestLine(a).includes('sha512='));
  assert.ok(!manifestLine(a).includes('{'), 'not JSON, whose escaping is not guaranteed stable');
});

test('negative: a missing field does not change the line\'s SHAPE', () => {
  const line = manifestLine({});
  assert.strictEqual(line.split('\n').length, 3 + DIGESTS.length);
  assert.doesNotThrow(() => manifestLine(null));
  assert.doesNotThrow(() => manifestLine(undefined));
});

// -------------------------------------------- explained vs not explained

test('THE WARNING: a change WeKan has no record of is the finding', () => {
  const findings = compareEntry(entry('a'), entry('b'));
  const verdict = classifyChange(findings, false);
  assert.strictEqual(verdict.explained, false);
  assert.ok(/no record saying why/.test(verdict.summary));
  assert.strictEqual(verdict.severity, 'high');
});

test('negative: a change WeKan DID record is not a warning', () => {
  // Somebody replaced an attachment through WeKan. The file changed, and that
  // is exactly what should have happened.
  const verdict = classifyChange(compareEntry(entry('a'), entry('b')), true);
  assert.strictEqual(verdict.explained, true);
  assert.strictEqual(verdict.severity, 'info');
});

test('negative: an unchanged file is never a warning', () => {
  assert.deepStrictEqual(classifyChange([], false),
    { explained: true, severity: 'info', summary: 'unchanged' });
  assert.strictEqual(classifyChange(null, false).explained, true);
});

test('a rewritten RECORD is never explained away by an ordinary edit', () => {
  const findings = compareEntry(entry('a'), entry('a'), { signatureValid: false });
  const verdict = classifyChange(findings, true);
  assert.strictEqual(verdict.explained, false,
    'WeKan does not rewrite a baseline without re-signing it');
  assert.strictEqual(verdict.severity, 'critical');
});

test('an unexplained change is at least medium, even when each part is minor', () => {
  const before = entry('same');
  const after = { ...before, mtimeMs: before.mtimeMs + 1000 };
  const verdict = classifyChange(compareEntry(before, after), false);
  assert.strictEqual(verdict.severity, 'medium',
    'the point is that nobody knows why it happened');
});

// ---------------------------------------------------------------- the pacing

test('the scan does not run while the machine is busy', () => {
  const step = nextStep({ cpuPercent: 85, elapsedMs: 0, fileSize: 1000 });
  assert.strictEqual(step.action, 'stop');
  assert.ok(/CPU at 85%/.test(step.reason));
});

test('...and it does run when the machine is idle', () => {
  const step = nextStep({ cpuPercent: 5, elapsedMs: 0, fileSize: 1000 });
  assert.strictEqual(step.action, 'pause');
});

test('there is a pause between files, and a bigger one for a bigger file', () => {
  const small = nextStep({ cpuPercent: 5, elapsedMs: 0, fileSize: 1024 });
  const large = nextStep({ cpuPercent: 5, elapsedMs: 0, fileSize: 100 * 1024 * 1024 });
  assert.ok(small.pauseMs >= PACING.pauseMsPerFile, 'never a tight read loop');
  assert.ok(large.pauseMs > small.pauseMs, 'a directory of large files is not a sustained read');
});

test('a run that has used its time stops and continues another day', () => {
  const step = nextStep({ cpuPercent: 5, elapsedMs: PACING.maxRunMs + 1, fileSize: 1 });
  assert.strictEqual(step.action, 'stop');
  assert.ok(/continuing next time/.test(step.reason));
});

test('it runs once a day, not on every restart', () => {
  const day = PACING.intervalMs;
  assert.strictEqual(isDue(0, Date.now()), true, 'a server that never ran one runs it');
  assert.strictEqual(isDue(1000, 1000 + day), true);
  assert.strictEqual(isDue(1000, 1000 + day - 1), false);
  assert.strictEqual(isDue(1000, 1000 + 60_000), false, 'not on a restart loop');
});

test('negative: junk pacing input never turns into "go as fast as you can"', () => {
  assert.strictEqual(nextStep({}).action, 'pause', 'an unreadable CPU figure still paces');
  assert.ok(nextStep({}).pauseMs >= PACING.pauseMsPerFile);
  assert.strictEqual(isDue(null, null), false, 'an unreadable clock does not start a scan');
  assert.strictEqual(isDue('x', 'y'), false);
});

test('the shipped pacing is conservative', () => {
  assert.ok(PACING.maxCpuPercent <= 80);
  assert.ok(PACING.pauseMsPerFile >= 10);
  assert.ok(PACING.maxRunMs <= 60 * 60 * 1000, 'a scan may not run for an hour');
  assert.strictEqual(PACING.intervalMs, 24 * 60 * 60 * 1000, 'once a day, as specified');
});

// ------------------------------------------------- crashes and downtime

test('a clean stop is not a problem, and is not reported as one', () => {
  const { classifyPreviousRun } = requireUptimeHelper();
  const now = Date.now();
  const verdict = classifyPreviousRun({ at: new Date(now - 60_000), cleanShutdown: true }, now);
  assert.strictEqual(verdict.kind, 'clean');
});

test('a first run is not a problem either', () => {
  const { classifyPreviousRun } = requireUptimeHelper();
  assert.strictEqual(classifyPreviousRun(null, Date.now()).kind, 'first-run');
  assert.strictEqual(classifyPreviousRun({}, Date.now()).kind, 'first-run');
});

test('THE CRASH: a long gap with no clean-shutdown mark', () => {
  const { classifyPreviousRun } = requireUptimeHelper();
  const now = Date.now();
  const verdict = classifyPreviousRun({ at: new Date(now - 45 * 60_000) }, now);
  assert.strictEqual(verdict.kind, 'crash');
  assert.ok(/WITHOUT SHUTTING DOWN CLEANLY/.test(verdict.detail));
  assert.ok(/45 minute/.test(verdict.detail), 'and says how long it was down');
});

test('negative: a quick restart is a note, not an alarm', () => {
  // The shutdown hook may simply not have run. Calling every deploy a crash is
  // how a Problems page gets ignored.
  const { classifyPreviousRun } = requireUptimeHelper();
  const now = Date.now();
  assert.strictEqual(classifyPreviousRun({ at: new Date(now - 30_000) }, now).kind, 'restart');
});

// ------------------------------------------------------------- the wiring

test('the baseline is never published, and clients cannot write it', () => {
  const src = read('models/fileIntegrity.js');
  // It is a map of every file on the server, and the key document is a PRIVATE
  // KEY. Neither belongs on a client, admin or not.
  assert.ok(!/Meteor\.publish/.test(src), 'nothing publishes the baseline');
  assert.ok(/FileIntegrity\.deny\(/.test(src) && /IntegrityKeys\.deny\(/.test(src));
  assert.ok((src.match(/insert: \(\) => true/g) || []).length === 2, 'both collections deny writes');
});

test('the scan reads each file ONCE for all three digests', () => {
  const src = read('server/lib/fileIntegrityScan.js');
  assert.ok(/DIGESTS\.forEach\(name => hashes\[name\]\.update\(chunk\)\)/.test(src),
    'three passes would be three times the disk read for the same bytes');
  assert.ok(/createReadStream/.test(src), 'streamed, not read into memory');
});

test('a first sight of a file records a baseline instead of warning', () => {
  const src = read('server/lib/fileIntegrityScan.js');
  assert.ok(/if \(!baseline\) \{[\s\S]{0,400}?storeBaseline/.test(src),
    'a new instance must not report every file it has');
});

test('an EXPLAINED change is re-baselined; an unexplained one is not', () => {
  const src = read('server/lib/fileIntegrityScan.js');
  assert.ok(/if \(verdict\.explained\) await storeBaseline/.test(src),
    'so it is reported once, not every day');
  assert.ok(/left, so it keeps showing/.test(src) || /deliberately left/.test(src),
    'and an unexplained one keeps showing until somebody looks');
});

test('a run that stopped early does not report the rest as missing', () => {
  const src = read('server/lib/fileIntegrityScan.js');
  assert.ok(/if \(!stoppedEarly\) \{/.test(src),
    'it has not looked everywhere, and saying otherwise would be a lie');
});

test('an operator-supplied key is never written to the database', () => {
  const src = read('server/lib/fileIntegrityScan.js');
  const branch = src.match(/const supplied = process\.env\.WEKAN_INTEGRITY_PRIVATE_KEY;[\s\S]*?\n  \}/)[0];
  assert.ok(!/upsertAsync/.test(branch), 'a supplied key must not be stored');
  // A malformed supplied key must NOT silently fall back to a generated one:
  // that looks like it is working while checking nothing the operator meant.
  assert.ok(/could not be read as a private key/.test(branch));
  assert.ok(/return null;/.test(branch));
});

test('the integrity stream is registered everywhere it has to be', () => {
  assert.ok(/'integrity'\]/.test(read('models/eventLog.js')), 'the stream list');
  assert.ok(/report-integrity/.test(read('client/components/settings/adminProblems.js')), 'the menu');
  assert.ok(/isPane 'report-integrity'/.test(read('client/components/settings/adminProblems.jade')), 'the pane');
  assert.ok(require('../imports/i18n/data/en.i18n.json').integrityReportTitle, 'a label');
  const imports = read('server/imports.js');
  assert.ok(/fileIntegrityScan/.test(imports) && /uptimeWatch/.test(imports),
    'and both modules are actually loaded, or none of this runs');
});

function requireUptimeHelper() {
  // uptimeWatch.js is an ES module full of Meteor imports; its decision function
  // is self-contained, so the guard evaluates that one function out of the
  // source - which also fails if it is renamed or reshaped.
  const src = read('server/lib/uptimeWatch.js');
  const consts = [
    src.match(/const HEARTBEAT_MS = [^;]+;/)[0],
    src.match(/const DOWNTIME_THRESHOLD_MS = [^;]+;/)[0],
  ].join('\n');
  const fn = src.match(/export function classifyPreviousRun\(previous, nowMs\) \{[\s\S]*?\n\}/)[0]
    .replace('export function', 'function');
  // eslint-disable-next-line no-new-func
  return new Function(`${consts}\n${fn}\nreturn { classifyPreviousRun };`)();
}

console.log(`\n${passed} tests passed`);
