'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const publications = fs.readFileSync(path.join(root, 'server/publications/boards.js'), 'utf8');
const client = fs.readFileSync(path.join(root, 'client/components/boards/boardsList.js'), 'utf8');

function block(from, to) {
  const start = publications.indexOf(from);
  return publications.slice(start, publications.indexOf(to, start));
}

test('plural boards publishes projected board documents without list/card children', () => {
  const plural = block("publishComposite('boards'", "Meteor.publish('boardTemplates'");
  assert.match(plural, /type: 'board'/);
  assert.match(plural, /fields: BOARD_LIST_FIELDS/);
  assert.doesNotMatch(plural, /children\s*:/);
  assert.doesNotMatch(plural, /getLists|getCards/);
});

test('All Boards publishes relationships, not every public board on the instance', () => {
  const plural = block("publishComposite('boards'", "Meteor.publish('boardTemplates'");
  assert.match(plural, /includePublic: false/);
  assert.match(plural, /clauses\.length === 1 \? clauses\[0\] : \{ \$or: clauses \}/);
  assert.doesNotMatch(plural, /\$or: boardVisibilitySelectors/);

  const singular = block("Meteor.publish('board'", 'const visibleLinkedCardIds');
  assert.doesNotMatch(singular, /includePublic: false/);
});

test('the projection retains appearance, access, ordering and sharing fields', () => {
  const fields = block('const BOARD_LIST_FIELDS', "publishComposite('boards'");
  for (const field of [
    'title', 'slug', 'color', 'backgroundImageURL', 'description', 'type',
    'permission', 'members', 'orgs', 'teams', 'domains', 'sort',
  ]) assert.match(fields, new RegExp(`\\b${field}: 1`), `${field} is projected`);
});

test('template containers have a separate live subscription only in Templates', () => {
  const templates = block("Meteor.publish('boardTemplates'", '// ─────────────────');
  assert.match(templates, /type: 'template-container'/);
  assert.match(templates, /boardVisibilitySelectors/);
  assert.match(templates, /true,\s*\);/, 'the template cursor remains live');
  assert.match(
    client,
    /if \(this\.selectedMenu\.get\(\) !== 'templates' && !this\.boardSearchVar\.get\(\)\) return;\s*this\.subscribe\('boardTemplates'\)/,
  );
});
