'use strict';

// Guard: ZipBombBleed (2026-10-02). Imports read entries of an uploaded zip.
// The Trello zip import checked sizes from `entry.vars.uncompressedSize`, a
// field unzipper's directory entries do not have, so every check saw 0 and a
// small archive inflated without limit in memory - any logged-in user could
// exhaust the server. models/importZip.js read wekan.json with no cap at all.
// Entries are now read through readZipEntryBounded, which counts the bytes
// that actually inflate.
// Run: node tests/zipBombBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { declaredZipEntrySize, readZipEntryBounded } = require('../server/lib/boundedZipEntry');

async function bomb(bytes) {
  const { ZipArchive } = require(path.join(ROOT, 'node_modules', 'archiver'));
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'zipbomb-'));
  const file = path.join(dir, 'bomb.zip');
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    const zip = new ZipArchive({ zlib: { level: 9 } });
    out.on('close', resolve); zip.on('error', reject);
    zip.pipe(out);
    zip.append(Buffer.alloc(bytes, 0x7b), { name: 'wekan.json' });
    zip.finalize();
  });
  return { file, dir };
}

test('the reported shape: the declared size lives on the entry, not entry.vars', async () => {
  const { file, dir } = await bomb(8 * 1024 * 1024);
  try {
    const unzipper = require(path.join(ROOT, 'node_modules', 'unzipper'));
    const [entry] = (await unzipper.Open.file(file)).files;
    assert.equal(entry.path, 'wekan.json', 'GHSA-rmcq-68x2-3g5j native import document');
    assert.equal(entry.vars, undefined, 'the old check read a field that is not there');
    assert.equal(declaredZipEntrySize(entry), 8 * 1024 * 1024);
    assert.ok(fs.statSync(file).size < 64 * 1024, 'a small archive');
    // The bounded read refuses it past the limit - by what inflates, not by
    // what the archive claims.
    await assert.rejects(readZipEntryBounded(entry, 1024 * 1024), /zip-entry-too-large/);
    // A forged central-directory size cannot bypass the actual byte counter.
    entry.uncompressedSize = 1;
    await assert.rejects(readZipEntryBounded(entry, 1024 * 1024), /zip-entry-too-large/);
    const budget = { remaining: 4 * 1024 * 1024 };
    await assert.rejects(readZipEntryBounded(entry, 64 * 1024 * 1024, budget), /zip-too-large/);
    // Within the limit it reads the whole entry (negative).
    assert.equal((await readZipEntryBounded(entry, 16 * 1024 * 1024)).length, 8 * 1024 * 1024);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('both imports read entries only through the bounded reader', () => {
  const trello = read('server/routes/importTrelloZip.js');
  assert.match(trello, /const declared = declaredZipEntrySize\(entry\);/);
  assert.equal((trello.match(/readZipEntryBounded\(/g) || []).length, 2);
  assert.match(read('models/importZip.js'), /readZipEntryBounded\(documentEntry, MAX_IMPORT_DOCUMENT_BYTES\)/);
});

test('negative: no server code inflates a zip entry whole, or trusts entry.vars', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'tests' || e.name.startsWith('_build') || e.name === 'node_modules') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  const offenders = ['server', 'models'].flatMap(walk).filter(file => file !== 'server/lib/boundedZipEntry.js').filter(file => {
    const src = read(file);
    return /\bentry\.buffer\(\)|\.entry\.buffer\(\)|Entry\.buffer\(\)|entry\.vars\b/.test(src);
  });
  assert.deepEqual(offenders, []);
});
