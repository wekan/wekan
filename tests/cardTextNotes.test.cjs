'use strict';

// GitHub issue #595 "Markdown textfile attachment": an attachable markdown
// text NOTE - separate from the card's own description - editable in a
// popup, so a card can carry several distinct text blocks instead of
// cramming everything into one description field.
//
// Run: node tests/cardTextNotes.test.cjs
//
// This suite is source-pattern based (no Meteor runtime available here), the
// same approach tests/checklistCollapse.test.cjs and siblings use:
//   1. the CardTextNotes model is scoped by cardId/boardId the same way
//      Checklists/CardComments are (positive test).
//   2. server permissions gate insert/update/remove on card-edit access, and
//      deny a cross-board move (mirrors the Checklists GHSA-gv8h-5p3p-6hx7
//      guard).
//   3. the client UI reuses the EXISTING `editor`/`viewer` markdown widget the
//      card description uses, rather than declaring a competing one
//      (negative test) - the actual scope-discipline requirement in the task.
//   4. creating/editing/deleting go through Meteor collection calls scoped to
//      a single note's _id / a single card's cardId, not a broader selector.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const model = read('models/cardTextNotes.js');
const permissions = read('server/permissions/cardTextNotes.js');
const jade = read('client/components/cards/cardTextNotes.jade');
const js = read('client/components/cards/cardTextNotes.js');
const cardDetailsJade = read('client/components/cards/cardDetails.jade');
const editorJade = read('client/components/main/editor.jade');
const featuresCards = read('client/features/cards.js');
const serverImports = read('server/imports.js');
const reactiveCache = read('imports/reactiveCache.js');

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('the model is a Mongo collection scoped by cardId and boardId', () => {
  assert.ok(/new Mongo\.Collection\('card_text_notes'\)/.test(model));
  assert.ok(/cardId:\s*\{/.test(model), 'has a cardId field');
  assert.ok(/boardId:\s*\{/.test(model), 'has a denormalized boardId field, like Checklists');
  assert.ok(/title:\s*\{/.test(model));
  assert.ok(/text:\s*\{/.test(model));
});

test('and it is wired into the reactive cache, the same way CardComments is', () => {
  assert.ok(/getCardTextNote\(/.test(reactiveCache));
  assert.ok(/getCardTextNotes\(/.test(reactiveCache));
  assert.ok(/require\('\/models\/cardTextNotes'\)/.test(reactiveCache));
});

test('and it is registered in server/imports.js and client/features/cards.js', () => {
  assert.ok(/permissions\/cardTextNotes/.test(serverImports));
  assert.ok(/cardTextNotes\.jade/.test(featuresCards));
  assert.ok(/cardTextNotes\.js/.test(featuresCards));
});

test('server permissions gate insert/update/remove on card-edit access', () => {
  assert.ok(/CardTextNotes\.allow\(/.test(permissions));
  assert.ok(/canEditCardOrLinkedCard/.test(permissions));
  ['insert', 'update', 'remove'].forEach(op => {
    assert.ok(new RegExp(`async ${op}\\(userId, doc\\)`).test(permissions),
      `has an allow.${op} rule`);
  });
});

test('and a cross-board move is denied, mirroring the Checklists guard (GHSA-gv8h-5p3p-6hx7)', () => {
  assert.ok(/CardTextNotes\.deny\(/.test(permissions));
  assert.ok(/denyCrossBoardMoveByCard/.test(permissions));
});

test('the card detail view opens a text-notes section', () => {
  assert.ok(/cardSectionHeader\(section="text-notes"/.test(cardDetailsJade));
  assert.ok(/\+cardTextNotes\(/.test(cardDetailsJade));
});

test('each note is rendered with a title and a markdown-rendered PREVIEW (not raw text)', () => {
  assert.ok(/\+viewer/.test(jade), 'the note preview uses the `viewer` template');
});

test('the edit popup reuses the SAME `editor` template the description uses - no new widget', () => {
  // Positive: the popup declares +editor, exactly like descriptionForm does.
  assert.ok(/template\(name="cardTextNoteEditPopup"\)/.test(jade));
  assert.ok(/\+editor\(/.test(jade), 'cardTextNoteEditPopup uses +editor');

  // Negative: nothing in the new files declares a competing markdown-editor
  // TEMPLATE (the thing that would duplicate editor.jade's job). Only the
  // *description form's own* templates (cardDescription.jade / descriptionForm)
  // and editor.jade itself are allowed to define `template(name="editor")` or
  // `template(name="viewer")` - and they must define them exactly once each,
  // anywhere in the client/components/cards + client/components/main trees.
  const jadeFiles = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.jade')) jadeFiles.push(full);
    }
  };
  walk(path.join(repoRoot, 'client/components/cards'));
  walk(path.join(repoRoot, 'client/components/main'));

  let editorDeclarations = 0;
  let viewerDeclarations = 0;
  for (const f of jadeFiles) {
    const content = fs.readFileSync(f, 'utf8');
    editorDeclarations += (content.match(/template\(name="editor"\)/g) || []).length;
    viewerDeclarations += (content.match(/template\(name="viewer"\)/g) || []).length;
  }
  assert.strictEqual(editorDeclarations, 1,
    'exactly one `editor` template is declared anywhere - editor.jade\'s - no duplicate was written for text notes');
  assert.strictEqual(viewerDeclarations, 1,
    'exactly one `viewer` template is declared anywhere - editor.jade\'s');
});

test('add/edit/delete go through Meteor calls scoped to one note or one card, not a broad selector', () => {
  assert.ok(/CardTextNotes\.insert\(\{/.test(js));
  assert.ok(/CardTextNotes\.update\(this\._id/.test(js));
  assert.ok(/CardTextNotes\.remove\(this\._id\)/.test(js));
  // Negative: no unscoped remove/update (e.g. CardTextNotes.remove({}) or a
  // selector without an _id/cardId) is present.
  assert.ok(!/CardTextNotes\.remove\(\{\}\)/.test(js));
});

test('helpers() scopes a card\'s notes by cardId, sorted by creation order', () => {
  assert.ok(/getCardTextNotes\(\s*\{\s*cardId:\s*this\._id\s*\}/.test(js));
  assert.ok(/createdAt:\s*1/.test(js));
});

for (const [name, fn] of tests) {
  try {
    fn();
    console.log('  ok -', name);
  } catch (e) {
    console.log('  FAIL -', name);
    console.log('   ', e.message);
    process.exitCode = 1;
  }
}
console.log(`cardTextNotes: ${tests.length} tests`);
