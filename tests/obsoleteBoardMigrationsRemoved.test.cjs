'use strict';

// Guard for #6521: the per-swimlane-lists-era board migrations must stay removed.
//
// comprehensiveBoardMigration / fixMissingListsMigration / restoreLostCards /
// restoreAllArchived converted today's board-wide SHARED lists (swimlaneId '')
// back into per-swimlane DUPLICATE columns and created "Lost Cards" / "Restored
// Items" columns, moving real cards into them (treating cards on archived lists as
// "orphaned" and shared-swimlane cards as "lost"). They had no callers left, so a
// reporter upgrading to 10.33 saw a spurious "Restored Items" column full of cards
// that looked empty. This test fails if any of them (or their import, or their
// admin-callable Meteor methods) come back, and checks the legitimate replacements
// stayed.
//
// Run: node tests/obsoleteBoardMigrationsRemoved.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('obsoleteBoardMigrationsRemoved:');

const REMOVED = [
  'server/migrations/comprehensiveBoardMigration.js',
  'server/migrations/fixMissingListsMigration.js',
  'server/migrations/restoreLostCards.js',
  'server/migrations/restoreAllArchived.js',
];

test('the four obsolete migration files are gone', () => {
  for (const f of REMOVED) {
    assert.ok(!exists(f), `${f} must not exist`);
  }
});

test('server/imports.js no longer imports them', () => {
  const imports = read('server/imports.js');
  for (const f of REMOVED) {
    const spec = f.replace(/^server/, '/server').replace(/\.js$/, '');
    assert.ok(!imports.includes(`import '${spec}'`), `must not import ${spec}`);
  }
});

test('no code registers their admin-callable Meteor methods anymore', () => {
  // A brittle-but-cheap sweep: none of these method names should appear as a
  // Meteor.methods key or a Meteor.call target anywhere in the loaded tree.
  const NEEDLES = [
    "'comprehensiveBoardMigration.execute'",
    "'restoreLostCards.execute'",
    "'fixMissingLists",
    "'restoreAllArchived.execute'",
  ];
  const dirs = ['server', 'client', 'imports', 'models'];
  const hits = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|jade)$/.test(entry.name)) continue;
      const txt = read(rel);
      for (const n of NEEDLES) if (txt.includes(n)) hits.push(`${rel}: ${n}`);
    }
  };
  dirs.forEach(walk);
  assert.deepStrictEqual(hits, [], `obsolete migration methods must be gone:\n${hits.join('\n')}`);
});

test('the "Restored Items" / "Lost Cards" column-creating code is gone', () => {
  // The literal i18n keys the removed migration used to name its columns must no
  // longer be referenced by any code (the translation strings may linger harmlessly).
  const dirs = ['server', 'client'];
  const hits = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|jade)$/.test(entry.name)) continue;
      const txt = read(rel);
      if (/lost-cards-list|lostCardsSwimlane/.test(txt)) hits.push(rel);
    }
  };
  dirs.forEach(walk);
  assert.deepStrictEqual(hits, [], `no code should create a Lost Cards / Restored Items column:\n${hits.join('\n')}`);
});

test('the legitimate replacements are still in place', () => {
  // The startup schema step that UNDOES the per-swimlane-lists damage...
  assert.ok(read('server/lib/schemaUpgradeSteps.js').includes("name: 'merge-per-swimlane-lists'"),
    'merge-per-swimlane-lists schema step must remain');
  // ...and the board-open self-heal that fixes genuinely missing swimlaneId / orphans.
  assert.ok(exists('server/lib/repairBoardData.js'), 'repairBoardData must remain');
  // The schema upgrade runner (which runs merge-per-swimlane-lists) stays wired.
  assert.ok(read('server/imports.js').includes("import '/server/startupSchemaUpgrade'"),
    'startupSchemaUpgrade must still be imported');
  assert.ok(read('server/startupSchemaUpgrade.js').includes('schemaUpgradeSteps'),
    'startupSchemaUpgrade must run schemaUpgradeSteps');
});

console.log(`\n${passed} tests passed`);
