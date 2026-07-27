'use strict';

// docs/Databases is one directory per database, and each directory says what is
// in it.
//
// It used to be one flat list where the database was a filename prefix -
// MongoDB-Driver-System.md, mongodb-avx-qemu.md, MongoDB_OpLog_Enablement.md,
// FerretDB2-PostgreSQL.md, ToroDB-PostgreSQL/ - three spellings of "MongoDB" among
// them. A reader looking for "how do I run WeKan on PostgreSQL" had to read the
// prefixes to find out which files were even about their database.
//
// So: a directory per database, the prefix dropped from the filenames inside it,
// and a README.md in every one of them - README.md is what GitHub shows when the
// directory itself is opened, which is why a link to a directory must point at the
// directory and NOT at its README.md.
//
// Run: node tests/docsDatabases.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB = path.join(ROOT, 'docs', 'Databases');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

console.log('docsDatabases:');

test('one directory per database, and the expected files in them', () => {
  const dirs = ['Migrations', 'MongoDB', 'FerretDB', 'FerretDB/1', 'FerretDB/2',
    'ToroDB', 'ToroDB/PostgreSQL'];
  for (const d of dirs) {
    assert.ok(fs.existsSync(path.join(DB, d)) && fs.statSync(path.join(DB, d)).isDirectory(),
      `docs/Databases/${d} must be a directory`);
  }
  // The MongoDB files, by their names WITHOUT the redundant prefix.
  for (const f of ['Driver-System.md', 'Oplog-Configuration.md', 'OpLog-Enablement.md',
    'Compatibility-Guide.md', 'Version-Management.md', 'avx-qemu.md', 'raspi4-qemu.md']) {
    assert.ok(fs.existsSync(path.join(DB, 'MongoDB', f)), `docs/Databases/MongoDB/${f}`);
  }
  assert.ok(fs.existsSync(path.join(DB, 'FerretDB', '2', 'PostgreSQL.md')));
  assert.ok(fs.existsSync(path.join(DB, 'ToroDB', 'PostgreSQL', 'docker-compose.yml')));
  // Nothing left loose at the top: only the index.
  const top = fs.readdirSync(DB).filter(n => fs.statSync(path.join(DB, n)).isFile());
  assert.deepStrictEqual(top, ['README.md'],
    'the only file directly in docs/Databases is its README.md');
});

test('every directory has a README.md, which is what a reader opens first', () => {
  const dirs = ['.', 'Migrations', 'MongoDB', 'FerretDB', 'FerretDB/1', 'FerretDB/2',
    'ToroDB', 'ToroDB/PostgreSQL'];
  for (const d of dirs) {
    const readme = path.join(DB, d, 'README.md');
    assert.ok(fs.existsSync(readme), `docs/Databases/${d}/README.md must exist`);
    const src = fs.readFileSync(readme, 'utf8');
    assert.ok(src.length > 200, `docs/Databases/${d}/README.md must describe the directory`);
  }
});

test('a link to a directory points at the directory, not at its README.md', () => {
  const offenders = [];
  for (const f of walk(DB).filter(f => f.endsWith('.md'))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
      if (/(^|\/)README\.md$/.test(m[1]) && !m[1].startsWith('http')) {
        offenders.push(`${path.relative(ROOT, f)}: ${m[1]}`);
      }
    }
  }
  assert.deepStrictEqual(offenders, [],
    'README.md is what is read by default, so link the directory itself');
});

test('every relative link in docs/Databases resolves', () => {
  // The reorganisation moved files a level deeper; a "../" that was right before
  // is wrong now, and a broken doc link is invisible until somebody clicks it.
  const broken = [];
  for (const f of walk(DB).filter(f => f.endsWith('.md'))) {
    const dir = path.dirname(f);
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/\[[^\]]*\]\(([^)#]+)(#[^)]*)?\)/g)) {
      const t = m[1].trim();
      if (/^(https?:|mailto:|<)/.test(t)) continue;
      if (!fs.existsSync(path.resolve(dir, t))) {
        broken.push(`${path.relative(ROOT, f)}: ${t}`);
      }
    }
  }
  assert.deepStrictEqual(broken, []);
});

test('nothing else in the repo still links to the old flat paths', () => {
  const old = ['Databases/FerretDB2-PostgreSQL', 'Databases/ToroDB-PostgreSQL',
    'Databases/MongoDB-Driver-System', 'Databases/MongoDB-Oplog-Configuration',
    'Databases/MongoDB_OpLog_Enablement', 'Databases/MongoDB-Compatibility-Guide',
    'Databases/MongoDB-Version-Management', 'Databases/mongodb-avx-qemu',
    'Databases/mongodb-raspi4-qemu', 'Databases/PostgreSQL.md'];
  const files = [...walk(path.join(ROOT, 'docs')),
    ...fs.readdirSync(ROOT).filter(n => /\.(md|yml|sh|bat)$/.test(n)).map(n => path.join(ROOT, n))];
  const offenders = [];
  for (const f of files) {
    // CHANGELOG.md records what the paths WERE; it is history, not a link to follow.
    if (path.basename(f) === 'CHANGELOG.md') continue;
    const src = fs.readFileSync(f, 'utf8');
    for (const o of old) if (src.includes(o)) offenders.push(`${path.relative(ROOT, f)}: ${o}`);
  }
  assert.deepStrictEqual(offenders, []);
});

console.log(`\n${passed} tests passed`);
