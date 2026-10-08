'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'imports/i18n/data');
const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json'), 'utf8'));
const literals = {
  asana: ['data', 'GET /tasks'],
  openproject: ['GET /api/v3/work_packages'],
  taskwarrior: ['task export', 'project', 'priority', 'annotations', 'depends'],
  focalboard: ['.boardarchive', 'board.jsonl'],
  orgmode: ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
  todotxt: ['todo.txt', '+project', '@context', 'due:', 't:'],
  kanboard: ['columns', 'tasks', 'title', 'description', 'column_name', 'swimlane_name', 'date_due', 'owner', 'tags'],
  deck: ['stacks', 'cards'],
  zenkit: ['title', 'stages', 'items'],
  jira: ['GET /rest/api/2/search', 'issues', 'automationRules'],
};
// Surrounding typography is language-specific; identifier spelling and case are not.
function containsLiteral(text, literal) {
  const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, 'u').test(text);
}
assert.equal(containsLiteral('„cards“', 'cards'), true);
assert.equal(containsLiteral('「cards」', 'cards'), true);
assert.equal(containsLiteral('« cards »', 'cards'), true);
for (const bad of ['cardz', 'CardS', 'mycards', 'cards_name']) {
  assert.equal(containsLiteral(bad, 'cards'), false, bad);
}
assert.equal(containsLiteral('GET /rest/api/2/lukaotem', 'GET /rest/api/2/search'), false);
// Names inside prose may have grammatical prefixes/suffixes. todo.txt and
// its marked fields remain exact substrings, without requiring English spacing.
function containsFormatLiteral(format, text, literal) {
  return format === 'todotxt' ? text.includes(literal) : containsLiteral(text, literal);
}
assert.equal(containsFormatLiteral('todotxt', 'faira retodo.txt', 'todo.txt'), true);
assert.equal(containsFormatLiteral('todotxt', '+projectと@context', '@context'), true);
assert.equal(containsFormatLiteral('todotxt', '@kaen', '@context'), false);
assert.equal(containsLiteral('وpriority', 'priority'), true);
assert.equal(containsLiteral('GET /tasks에서', 'GET /tasks'), true);
const failures = [];
for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.i18n.json'))) {
  const locale = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    for (const value of values) {
      assert.ok(containsFormatLiteral(format, source[key], value), `source: ${key}: ${value}`);
      if (!containsFormatLiteral(format, locale[key], value)) failures.push(`${file}: ${key}: ${value}`);
    }
  }
}
assert.deepEqual(failures, [], failures.join('\n'));
console.log('Import instruction literals: all locale paths preserve ten formats; localized quotes accepted');
