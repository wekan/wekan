'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'imports/i18n/data');
const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json'), 'utf8'));
const literals = {
  kanboard: ['columns', 'tasks', 'title', 'description', 'column_name', 'swimlane_name', 'date_due', 'owner', 'tags'],
  deck: ['stacks', 'cards'],
  zenkit: ['title', 'stages', 'items'],
  jira: ['GET /rest/api/2/search', 'issues', 'automationRules'],
};
// Surrounding typography is language-specific; identifier spelling and case are not.
function containsLiteral(text, literal) {
  const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'u').test(text);
}
assert.equal(containsLiteral('„cards“', 'cards'), true);
assert.equal(containsLiteral('「cards」', 'cards'), true);
assert.equal(containsLiteral('« cards »', 'cards'), true);
for (const bad of ['cardz', 'CardS', 'mycards', 'cards_name']) {
  assert.equal(containsLiteral(bad, 'cards'), false, bad);
}
assert.equal(containsLiteral('GET /rest/api/2/lukaotem', 'GET /rest/api/2/search'), false);
const failures = [];
for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.i18n.json'))) {
  const locale = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    for (const value of values) {
      assert.ok(containsLiteral(source[key], value), `source: ${key}: ${value}`);
      if (!containsLiteral(locale[key], value)) failures.push(`${file}: ${key}: ${value}`);
    }
  }
}
assert.deepEqual(failures, [], failures.join('\n'));
console.log('Import instruction literals: all locale paths preserve four formats; localized quotes accepted');
