'use strict';

// FloppyBleed (Hall of Fame icon label BackupFileBleed) - Luke Hebenstreit,
// fixed in WeKan v8.25 (2026-01-28, commit a419d831a "Fix FileBleed of
// FloppyBleed"), https://wekan.fi/hall-of-fame/floppybleed/
//
// A user-supplied attachment NAME reached the filesystem as part of a path,
// so "../../x" wrote or read outside the storage directory. The fix strips
// directories from the name in onBeforeUpload, builds every on-disk name
// through sanitizeFilename (models/lib/filenameSanitizer.js), and refuses
// client updates of `versions.*.path`.
//
// SIBLINGS found while writing this test (2026-10-27), the same shape:
//   - server/lib/schemaUpgradeSteps.js healOne() joined `doc.name` into its
//     candidate paths unsanitized. A record named "../../../etc/passwd" with
//     no version path - which a board member can insert over DDP, and which is
//     precisely what the fs-path-heal step heals - found a file OUTSIDE the
//     storage directory on the next upgrade boot, copied it in and pointed the
//     attachment at it: an arbitrary file read. Only the basename is used now.
//   - server/attachmentBulkMove.js took the "extension" after the last dot of a
//     legacy record's name into the on-disk path, so "a./../../x" was a
//     traversal. The extension is reduced to [a-z0-9] now.
// Neither runs with a user context (a boot-time step and an admin migration),
// so there is no attempt to attribute in Admin Panel / Problems; the refusal is
// that the path cannot leave the directory.
//
// Run: node tests/floppyBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const { sanitizeFilename } = require('../models/lib/filenameSanitizer');

const pending = [];
const test = (name, fn) => pending.push([name, fn]);

test('sanitizeFilename keeps a name inside its directory (the v8.25 fix)', () => {
  for (const evil of ['../../etc/passwd', '..\\..\\boot.ini', '/abs/path/x.png', 'a/../../b.txt', '..', '.', '\0x']) {
    const safe = sanitizeFilename(evil);
    assert.ok(!/[\\/]/.test(safe), `${JSON.stringify(evil)} -> ${safe}`);
    assert.notStrictEqual(safe, '..');
    const joined = path.join('/store', `id-original-${safe}`);
    assert.strictEqual(path.dirname(joined), '/store', `${evil} stays in /store`);
  }
  assert.strictEqual(sanitizeFilename('report.pdf'), 'report.pdf', 'an ordinary name is unchanged');
});

test('every strategy builds on-disk names through sanitizeFilename', () => {
  const src = read('models/lib/fileStoreStrategy.js');
  assert.match(src, /getNewPath\(storagePath, name\) \{[\s\S]*?const safeName = sanitizeFilename\(name\);/);
  // No path.join of an unsanitized fileObj.name / name anywhere in the module.
  assert.doesNotMatch(src, /path\.join\([^)]*\bfileObj\.name\b/);
});

test('onBeforeUpload strips directories from the uploaded name', () => {
  const src = read('models/attachments.js');
  const hook = src.slice(src.indexOf('onBeforeUpload(file) {'));
  assert.match(hook, /file\.name\.split\(\/\[\\\\\/\]\/\)\.pop\(\)/);
});

// healOne, run for real against a temp directory and a one-method db.
async function healWith(name) {
  const src = read('server/lib/schemaUpgradeSteps.js');
  const start = src.indexOf('async function healOne(');
  const body = src.slice(start, src.indexOf('\n}\n', start) + 2);
  const healOne = new Function('fs', 'path', `${body}\nreturn healOne;`)(fs, path);

  const tmpRoot = path.join(root, '.tools', 'tmp');
  fs.mkdirSync(tmpRoot, { recursive: true });
  const work = fs.mkdtempSync(path.join(tmpRoot, 'floppyBleed-'));
  try {
    const writable = path.join(work, 'w');
    const attachments = path.join(writable, 'files', 'attachments');
    fs.mkdirSync(attachments, { recursive: true });
    fs.writeFileSync(path.join(writable, 'secret.txt'), 'outside the storage directory');
    const updates = [];
    const db = { collection: () => ({ updateOne: async (q, u) => updates.push(u) }) };
    const ctx = {
      paths: { attachments, avatars: path.join(writable, 'files', 'avatars'), writablePath: writable },
      log: () => {},
    };
    const healed = await healOne(db, ctx, {
      coll: 'attachments',
      doc: { _id: 'A1', name },
      versionName: 'original',
      version: { size: 1 },
    });
    return { healed, updates, copied: fs.readdirSync(attachments) };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

test('negative: the upgrade heal never reaches outside storage through a name', async () => {
  // "A1-original-.." is popped by the first "..", the next two leave
  // files/attachments: the unfixed join resolved to <writable>/secret.txt.
  for (const name of ['../../secret.txt', '..\\..\\secret.txt', '../../../w/secret.txt']) {
    const r = await healWith(name);
    assert.strictEqual(r.healed, false, `${name} must not be healed from outside storage`);
    assert.deepStrictEqual(r.updates, []);
    assert.deepStrictEqual(r.copied, []);
  }
});

test('the bulk move keeps a legacy extension to extension characters', () => {
  const src = read('server/attachmentBulkMove.js');
  const line = src.split('\n').find(l => /const ext = dot >= 0 \? name\.slice\(dot \+ 1\)/.test(l));
  assert.ok(line, 'extension line found');
  const ext = new Function('name', 'dot', `${line.trim()}\nreturn ext;`);
  for (const name of ['a./../../x', 'b.png/../../../etc/passwd', 'c.\\..\\..\\y']) {
    const e = ext(name, name.lastIndexOf('.'));
    assert.ok(/^[a-z0-9]*$/.test(e), `${name} -> ${e}`);
    assert.strictEqual(path.dirname(path.join('/store', `id.${e}`)), '/store');
  }
  assert.strictEqual(ext('photo.JPG', 5), 'jpg', 'an ordinary extension is kept');
});

test('negative: no server or model file joins a raw name into a path', () => {
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (['node_modules', '_build', '.build', '.tools', 'tests', '.meteor'].includes(entry.name)) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!rel.endsWith('.js')) continue;
      read(rel).split('\n').forEach((l, i) => {
        // `${...name}` or `+ x.name` inside path.join/resolve, unless sanitized
        // on that line or the name is a directory entry read from disk.
        if (!/path\.(join|resolve)\(/.test(l)) return;
        if (!/\$\{[^}]*\bname\}|\+\s*\w+\.name\b|,\s*\w+\.name\s*[,)]/.test(l)) return;
        if (/sanitizeFilename|basename|\bentry\.name|\be\.name|\bdirent\.name/.test(l)) return;
        offenders.push(`${rel}:${i + 1}`);
      });
    }
  };
  for (const dir of ['models', 'server']) walk(dir);
  // healOne's `name` is now a basename (above); its join lines are allowed by
  // that test, the sanitizing line is what this one checks.
  const allowed = new Set(['server/lib/schemaUpgradeSteps.js', 'server/sandstormEmail.js']);
  const rest = offenders.filter(o => !allowed.has(o.split(':')[0]));
  assert.deepStrictEqual(rest, [], rest.join(', '));
  assert.match(read('server/lib/schemaUpgradeSteps.js'),
    /const name = path\.basename\(String\(doc\.name \|\| id\)\.replace\(\/\\\\\/g, '\/'\)\) \|\| id;/);
});

(async () => {
  let passed = 0;
  for (const [name, fn] of pending) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nfloppyBleed: ${passed} tests passed`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
