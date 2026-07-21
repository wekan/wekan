'use strict';

// Guards for the WeKan text-data backup safety measure (#6492).
//
// Before FerretDB opens its SQLite files, every FerretDB launch path keeps a rotating
// backup of the TEXT-DATA database (wekan.sqlite*) in a "backup" subfolder of the same
// data dir, so a known copy is ready to restore if the live database is ever detected
// corrupt. Attachments and avatars live on the filesystem and are not copied.
//
// The CRITICAL safety property enforced here: the backup must only ever COPY from the
// live database — it must NEVER move or delete the live wekan.sqlite, and must never
// wipe the whole data dir. A backup that could destroy the data it protects is worse
// than none.
//
// Run: node tests/ferretdbTextDataBackup.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('ferretdbTextDataBackup:');

const SCRIPTS = [
  'snap-src/bin/ferretdb-control',
  'releases/ferretdb/start-wekan.sh',
  'releases/ferretdb/wekan-entrypoint.sh',
];

// The live database file (the top-level one, not a backup subfolder copy).
const LIVE_RE = /\$\{?(SQLITE_DIR|FERRETDB_SQLITE_DIR)\}?\/wekan\.sqlite/;

for (const rel of SCRIPTS) {
  const src = read(rel);
  const lines = src.split('\n');

  test(`${rel}: copies the live text-data db into a backup dir`, () => {
    // A cp of the live wekan.sqlite* into the backup subfolder ($_bk).
    assert.ok(
      /cp -f [^\n]*wekan\.sqlite\*[^\n]*_bk/.test(src),
      'must cp the live wekan.sqlite* into the backup dir',
    );
    // Backups live in a "backup" subfolder of the data dir.
    assert.ok(/backup/.test(src) && /_bk=/.test(src), 'must use a backup subfolder');
  });

  test(`${rel}: keeps a previous backup generation`, () => {
    assert.ok(/\/prev/.test(src), 'must keep a previous backup generation under backup/prev');
  });

  test(`${rel}: backup is guarded (WEKAN_SQLITE_BACKUP default on, file must exist)`, () => {
    assert.ok(/WEKAN_SQLITE_BACKUP:-true/.test(src), 'backup must default on and be overridable');
    assert.ok(
      /\[ -f "\$\{?(SQLITE_DIR|FERRETDB_SQLITE_DIR)\}?\/wekan\.sqlite" \]/.test(src),
      'backup must only run when the live database exists',
    );
  });

  test(`${rel}: NEGATIVE — the live text data is never moved or deleted`, () => {
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('#')) continue; // ignore comments

      // No rm/mv may target the LIVE wekan.sqlite (top-level data dir). Deleting or
      // moving the live database is exactly what a backup must never do.
      if (/\b(rm|mv)\b/.test(t)) {
        assert.ok(
          !LIVE_RE.test(t),
          `rm/mv must never target the live wekan.sqlite: ${t}`,
        );
        // And never wipe the whole data dir.
        assert.ok(
          !/rm\s+-[a-z]*r[a-z]*\s+["']?\$?\{?(SQLITE_DIR|FERRETDB_SQLITE_DIR)\}?["']?\s*$/.test(t),
          `rm must not remove the whole data dir: ${t}`,
        );
      }
    }
  });

  test(`${rel}: NEGATIVE — attachments/avatars are not copied into the backup`, () => {
    // Only wekan.sqlite* is backed up here; attachments/avatars stay on the filesystem.
    assert.ok(
      !/cp[^\n]*(attachments|avatars)[^\n]*backup/.test(src),
      'the text-data backup must not copy attachments/avatars',
    );
  });
}

console.log(`\n${passed} tests passed`);
