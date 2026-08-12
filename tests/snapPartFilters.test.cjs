'use strict';

// Guard: a part that names paths in `stage:` / `prime:` must produce them on
// EVERY architecture it is built for.
// Run: node tests/snapPartFilters.test.cjs
//
// This is the v10.80 snap failure, and it took four releases to read correctly
// because the job's own error message guessed at it. All four Launchpad
// architectures - armhf, s390x, ppc64el, riscv64, three attempts each - died on
// one deterministic line in the build log:
//
//   Staging mongo42
//   Failed to copy '/build/.../parts/mongo42/install/mongo42':
//     no such file or directory.
//   Build failed
//
// `mongo42` downloads MongoDB 4.2 so an old database can be migrated, and
// MongoDB publishes 4.2 for amd64 and arm64 only - so on every other
// architecture the part printed "nothing to migrate from there; skipping" and
// exited 0 having created nothing. Its comment calls it "OPTIONAL BY DESIGN".
// It was not optional: `stage: [mongo42]` and `prime: [mongo42]` name that path
// explicitly, and snapcraft does not skip a filter whose path is missing - it
// ends the build. So an optional migration helper took the whole snap down on
// the four architectures that have NO native runner and can only be built there.
//
// The part creates its directory before anything can decide to skip now, so the
// filters always have something to copy and "no MongoDB 4.2 here" stays a
// missing BINARY rather than a failed build.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const yaml = (() => {
  try { return require('js-yaml'); } catch { return null; }
})();

const repoRoot = path.resolve(__dirname, '..');
const raw = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The parts, read without a YAML library so this suite needs no dependency:
// a part is a key at four spaces under `parts:`, and its body runs to the next.
function parts() {
  const at = raw.indexOf('\nparts:\n');
  assert.notStrictEqual(at, -1, 'snapcraft.yaml has no parts:');
  const body = raw.slice(at + 1);
  const out = {};
  const re = /^ {4}([a-z0-9][a-z0-9._-]*):$/gm;
  const starts = [];
  let m;
  while ((m = re.exec(body)) !== null) starts.push({ name: m[1], at: m.index });
  for (let i = 0; i < starts.length; i += 1) {
    const end = i + 1 < starts.length ? starts[i + 1].at : body.length;
    out[starts[i].name] = body.slice(starts[i].at, end);
  }
  return out;
}

const allParts = parts();

test('the parts of snapcraft.yaml are found', () => {
  assert.ok(Object.keys(allParts).length >= 3,
    `expected several parts, found ${Object.keys(allParts).join(', ') || 'none'}`);
  for (const name of ['mongo50', 'mongo42', 'wekan']) {
    assert.ok(allParts[name], `snapcraft.yaml has no ${name} part`);
  }
});

test('snapcraft.yaml is valid YAML and its filters read the same as the text', () => {
  if (!yaml) return; // js-yaml is optional here; the text scan above is the guard
  const doc = yaml.load(raw);
  assert.deepStrictEqual(doc.parts.mongo42.stage, ['mongo42']);
  assert.deepStrictEqual(doc.parts.mongo42.prime, ['mongo42']);
  assert.deepStrictEqual(doc.parts.mongo50.stage, ['mongo50']);
  assert.deepStrictEqual(doc.parts.mongo50.prime, ['mongo50']);
});

test('mongo42 creates its staged directory BEFORE it can decide to skip', () => {
  // Comment lines dropped: the part now EXPLAINS the `exit 0` at length above the
  // code, and prose about a line must not be mistaken for the line.
  const part = allParts.mongo42
    .split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  const mkdir = part.indexOf('mkdir -p "$dest/bin" "$dest/lib"');
  const skip = part.indexOf('exit 0');
  assert.notStrictEqual(mkdir, -1, 'mongo42 must create $SNAPCRAFT_PART_INSTALL/mongo42');
  assert.notStrictEqual(skip, -1, 'mongo42 must still skip on an unsupported architecture');
  assert.ok(mkdir < skip,
    'the directory has to exist before the unsupported-architecture `exit 0`, or ' +
    '`stage: [mongo42]` has nothing to copy and snapcraft ENDS THE BUILD - which ' +
    'is what failed every Launchpad architecture in v10.80');
  const dest = part.indexOf('dest="$SNAPCRAFT_PART_INSTALL/mongo42"');
  assert.ok(dest !== -1 && dest < skip, '$dest must be set before the skip too');
});

test('no path in mongo42 deletes the directory its stage filter names', () => {
  // The first fix covered the unsupported-architecture `exit 0`. It did NOT cover
  // the other two ways this part gives up - OpenSSL 1.1 unavailable, and the
  // staged mongod failing its smoke test - which both did `rm -rf "$dest"` and
  // exited 0, leaving `stage: mongo42` naming a path that is not there. On
  // amd64/arm64, where the binary IS downloaded, either of those would have ended
  // the whole snap build exactly as the unsupported arches did.
  const part = allParts.mongo42;
  assert.ok(!/rm -rf "\$dest"\s*$/m.test(part) && !/rm -rf "\$\{dest\}"\s*$/m.test(part),
    'a give-up path must remove the CONTENTS and keep the directory, so the ' +
    'filter has something to copy: rm -rf "${dest:?}"/*');
  const gives_up = (part.match(/rm -rf "\$\{dest:\?\}"\/\*/g) || []).length;
  assert.ok(gives_up >= 2,
    `both give-up paths (no OpenSSL 1.1, smoke test failed) must clear contents ` +
    `only; found ${gives_up}`);
});

test('mongo42 is still amd64/arm64 only - the fix is not "download it everywhere"', () => {
  const part = allParts.mongo42;
  assert.ok(/amd64\) MARCH=x86_64/.test(part) && /arm64\) MARCH=aarch64/.test(part),
    'the two architectures MongoDB publishes 4.2 for must stay the only two that ' +
    'download it');
  assert.ok(/nothing to migrate from there; skipping/.test(part),
    'and every other architecture must still skip, with a reason in the log');
});

test('every path a part stages or primes is one that part can produce', () => {
  // The general rule the mongo42 failure is one instance of. A filter entry that
  // is a literal path (no glob) must appear in the part's override-build as
  // something it creates - otherwise there is an architecture where it will not
  // be there, and the build ends rather than skipping.
  const problems = [];
  for (const [name, body] of Object.entries(allParts)) {
    for (const key of ['stage', 'prime']) {
      const m = body.match(new RegExp(`^ {8}${key}:\\n((?: {12}- .+\\n)+)`, 'm'));
      if (!m) continue;
      for (const line of m[1].trim().split('\n')) {
        const entry = line.replace(/^\s*-\s*/, '').trim();
        if (entry.startsWith('-') || entry.includes('*')) continue; // exclusions/globs
        const build = body.match(/override-build: \|\n([\s\S]*?)(?=\n {8}[a-z-]+:|\n {4}[a-z0-9-]+:|$)/);
        if (!build) continue;
        if (!build[1].includes(entry)) {
          problems.push(`${name}: ${key} names "${entry}", which its override-build never creates`);
        }
      }
    }
  }
  assert.deepStrictEqual(problems, [],
    'a stage:/prime: entry that the part does not always produce is not skipped - ' +
    'snapcraft fails the whole build on it:\n  ' + problems.join('\n  '));
});

test('the wekan part retries npm install, which is what the build farm drops', () => {
  const part = allParts.wekan;
  assert.ok(/for attempt in 1 2 3; do/.test(part),
    'npm install must be retried: on Launchpad every request goes through the ' +
    'build farm proxy and a single tarball can be cut mid-stream (ECONNRESET), ' +
    'which ended the riscv64 snap in v10.80 after half an hour of building');
  assert.ok(/npm install failed three times in a row/.test(part),
    'and after three tries it must fail loudly rather than retry forever');
});

test('the job error message points at the log instead of guessing', () => {
  const workflow = fs.readFileSync(
    path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');
  // ALL of them: the job prints more than one - the retry loop's diagnosis and
  // the "Job result" step's one-liner - and picking the first found the wrong one.
  const lines = workflow.split('\n').filter(l => l.includes('::error::snap-launchpad'));
  assert.ok(lines.length, 'the snap-launchpad failure must print a named ::error::');
  assert.ok(lines.some(l => /the Launchpad build log is printed above - read it first/.test(l)),
    'the log is printed by the step above and it names the failing part; the ' +
    'message must send the reader there. Got:\n  ' + lines.join('\n  '));
  assert.ok(!lines.some(l => /often an OOM in the Meteor npm install/.test(l)),
    'that guess was wrong for four releases while the log said "Failed to copy ' +
    '.../parts/mongo42/install/mongo42" every time');
});

console.log(`\n${passed} passed`);
