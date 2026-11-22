'use strict';
// An import STARTED outside a method context: every .zip that became a new board
// (POST /api/import/zip?newBoard=1 - All Boards / Import, and "Import many
// boards") answered 500, "Meteor.userId can only be invoked inside a method,
// publication, or WebApp endpoint". trackImport() runs execute() at once, so
// wrapping only the AWAIT of its promise in DDP._CurrentMethodInvocation.withValue
// came too late: the creator had already asked Meteor.userId() for the people
// the file names (membersMode=me) and for every row with no author. The Trello
// API import job had the same shape with no context at all.
//
// The fix starts trackImport INSIDE the context. This pins it for every caller:
// a trackImport() outside a Meteor method (models/import.js) has to be called
// from within a withValue / runAsUser callback.
// tests/playwright/specs/gitea-backup-wekan-import.e2e.js imports a .zip as a new
// board through the route itself.
// Run: node tests/importZipUserContext.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '_build', '.build', '.tools', '.meteor', 'tests', 'packages']);

function files(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith('_build')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

// Inside a method: Meteor gives the context, nothing to wrap.
const IN_METHODS = new Set(['models/import.js']);
// The definition, which hands the call on to its library: not a caller.
const DEFINITION = new Set(['server/importRuns.js']);

const callers = [];
for (const file of [...files(path.join(root, 'server')), ...files(path.join(root, 'models'))]) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  const re = /\btrackImport\(\{/g;
  let m;
  while ((m = re.exec(text))) {
    if (/function\s+trackImport\s*\($/.test(text.slice(Math.max(0, m.index - 20), m.index + 12))) continue;
    if (DEFINITION.has(rel)) continue;
    callers.push(rel);
    if (IN_METHODS.has(rel)) continue;
    // The statement the call is part of: back to the previous `;` or `{` line end.
    const before = text.slice(Math.max(0, m.index - 400), m.index);
    const statement = before.slice(Math.max(before.lastIndexOf(';\n'), before.lastIndexOf('{\n')) + 1);
    assert.ok(/(?:withValue|runAsUser)\([\s\S]*=>\s*(?:require\([^)]*\)\.)?$/.test(statement.trim()),
      `${rel}: trackImport() is started outside a user context - wrap the CALL (not its promise) in `
      + `DDP._CurrentMethodInvocation.withValue or runAsUser:\n${statement.trim()}`);
  }
}
assert.ok(callers.includes('models/importZip.js'), 'the .zip import is one of the callers');
assert.ok(callers.includes('server/trelloApiImport.js'), 'the Trello API import is one of the callers');

// Negative: the old shape - a tracked import made first, its promise awaited in
// the context afterwards - is nowhere.
for (const file of [...files(path.join(root, 'server')), ...files(path.join(root, 'models'))]) {
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(!/withValue\([\s\S]{0,200}?=>\s*tracked\.promise/.test(text),
    `${path.relative(root, file)}: awaits an import's promise in a context it was not started in`);
}
console.log(`importZipUserContext: ${callers.length} trackImport callers, each started in a user context`);
