'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('checklist writes bind route, linked source and every denormalized parent', () => {
  const source = read('server/lib/accessibleChecklistOperations.js');
  assert.match(source, /editableCard\(userId, input\?\.cardId, routeBoardId\)/);
  assert.match(source, /routeCard\.type !== 'cardType-linkedCard'/);
  assert.match(source, /canEditCardOrLinkedCard\(userId, contentCard\)/);
  assert.match(source, /_id: String\(input\?\.checklistId \|\| ''\),[\s\S]*?cardId: context\.contentCard\._id,[\s\S]*?boardId: context\.contentCard\.boardId/);
  assert.match(source, /_id: String\(input\?\.itemId \|\| ''\), checklistId: context\.checklist\._id,[\s\S]*?cardId: context\.contentCard\._id, boardId: context\.contentCard\.boardId/);
});

test('checklist text and insertion work are bounded and ordered on the server', () => {
  const source = read('server/lib/accessibleChecklistOperations.js');
  assert.match(source, /MAX_CHECKLIST_TEXT_LENGTH = 1000/);
  assert.match(source, /if \(!text\) throw new Meteor\.Error\('checklist-title-required'\)/);
  assert.match(source, /limit: 10000/);
  assert.match(source, /computeSortForIndex\(siblings, position\)/);
});

test('checklist deletion removes bound children before their parent', () => {
  const source = read('server/lib/accessibleChecklistOperations.js');
  const body = source.match(/async function removeAccessibleChecklist[\s\S]*?\n\}/)?.[0] || '';
  const children = body.indexOf('ChecklistItems.removeAsync');
  const parent = body.indexOf('Checklists.removeAsync');
  assert.ok(children >= 0 && parent > children);
  assert.match(body, /checklistId: checklist\._id, cardId: checklist\.cardId/);
});

test('copy and cross-card move authorize both ends and repair every parent field', () => {
  const source = read('server/lib/accessibleChecklistOperations.js');
  assert.match(source, /checklistDestination\(userId, input\)/);
  assert.match(source, /boardId: input\?\.targetBoardId,[\s\S]*?cardId: input\?\.targetCardId/);
  assert.match(source, /copyAccessibleChecklist[\s\S]*?ChecklistItems\.find\(\{ checklistId: checklist\._id, cardId: checklist\.cardId,[\s\S]*?boardId: checklist\.boardId/);
  assert.match(source, /moveAccessibleChecklistToCard[\s\S]*?cardId: target\._id,[\s\S]*?boardId: target\.boardId/);
  assert.match(source, /Activities\.find\(\{ checklistId: checklist\._id \}/);
  assert.match(source, /Checklists\.direct\.updateAsync\(\{ _id: checklist\._id, cardId: checklist\.cardId,[\s\S]*?boardId: checklist\.boardId/);
});

test('HTML5 and cookieless HTML4 use the same authenticated checklist methods', () => {
  const client = read('client/components/cards/checklists.js');
  const html4 = read('server/legacyHtml4.js');
  for (const operation of [
    'createAccessibleChecklist', 'updateAccessibleChecklistTitle',
    'removeAccessibleChecklist', 'createAccessibleChecklistItem',
    'updateAccessibleChecklistItemTitle', 'toggleAccessibleChecklistItem',
    'removeAccessibleChecklistItem', 'toggleAccessibleChecklistSetting',
    'copyAccessibleChecklist', 'moveAccessibleChecklistToCard',
  ]) {
    assert.ok(client.includes(`'${operation}'`), `HTML5 calls ${operation}`);
    assert.ok(html4.includes(`${operation}(session.userId`), `HTML4 calls ${operation}`);
  }
  assert.doesNotMatch(client, /(?:Checklists|ChecklistItems)\.(?:insert|remove)\(/);
});
