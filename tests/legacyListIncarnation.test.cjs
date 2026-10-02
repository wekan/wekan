'use strict';
// Lists created before list lifetimes get an incarnation when their Sync
// settings are next saved, and in no other way (maintainer decision
// 2026-10-02). A migration or any other writer that set one would leave the
// list's stored credential unmatched until somebody saved the settings again.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');

const config = fs.readFileSync(path.join(ROOT, 'server/lib/listSyncConfiguration.js'), 'utf8');
// Positive: the save assigns the lifetime in the same list update that selects
// the credential, and the staged credential carries it.
assert.match(config, /list\.syncCredentialIncarnation === undefined \? \{ syncCredentialIncarnation: incarnation \}/);
assert.match(config, /\$set: \{ syncSource: source, syncRevision: revision, \.\.\.repair, \.\.\.lifetime \}/);
assert.match(config, /\$set: \{ syncRevision: revision, \.\.\.repair, \.\.\.lifetime \}, \$unset/);
assert.match(config, /listId: list\._id, sourceKey: credential\.sourceKey, generation,\n\s+incarnation,/);

// Negative, tree-wide: nothing else writes the field on an existing list.
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (['node_modules', 'tests', '_build', '.build'].includes(entry.name)) return [];
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : full.endsWith('.js') ? [full] : [];
});
const writers = [];
for (const dir of ['server', 'models', 'client', 'imports']) {
  for (const file of walk(path.join(ROOT, dir))) {
    const src = fs.readFileSync(file, 'utf8');
    if (/\$set:\s*\{[^}]*syncCredentialIncarnation\s*:/.test(src) ||
        /['"]syncCredentialIncarnation['"]\s*\]\s*=/.test(src)) writers.push(path.relative(ROOT, file));
  }
}
assert.deepEqual(writers, [], `only the settings save may assign a list incarnation: ${writers.join(', ')}`);
// The field stays server-only: clients cannot write it.
assert.match(fs.readFileSync(path.join(ROOT, 'models/lists.js'), 'utf8'),
  /field === 'syncCredentialIncarnation' \|\| field\.startsWith\('syncCredentialIncarnation\.'\)/);
console.log('legacyListIncarnation: ok');
