'use strict';

// Regression coverage for #4755 (Due Dates for Checklist Items).
//
// A checklist item never had a due date of its own - only the card it
// belongs to did. This pins the pieces that give an individual item its own
// (optional) due date, mirroring how a card's own dueAt/getDue/setDue/unsetDue
// already work (models/cards.js), without adding member-assignment (the issue
// asks for due dates ONLY).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const read = relPath => fs.readFileSync(path.join(repoRoot, relPath), 'utf8');

// --- 1. Schema: ChecklistItems has an optional Date `dueAt`, matching the
// exact shape of Cards' own `dueAt` field. ---
const checklistItemsSrc = read('models/checklistItems.js');

const dueAtFieldMatch = checklistItemsSrc.match(
  /dueAt:\s*\{[^}]*\}/s,
);
assert.ok(dueAtFieldMatch, 'checklistItems.js schema must declare a dueAt field');
const dueAtField = dueAtFieldMatch[0];
assert.match(dueAtField, /type:\s*Date/, 'dueAt must be type Date');
assert.match(dueAtField, /optional:\s*true/, 'dueAt must be optional, like Card.dueAt');
// Negative: it must not silently gain a defaultValue (isFinished has one on
// purpose - a due date deliberately never does, same as Cards' dueAt).
assert.doesNotMatch(dueAtField, /defaultValue/, 'dueAt must not have a defaultValue');

// --- 2. Model: getDue/setDue/unsetDue exist on ChecklistItems.helpers, named
// exactly like Cards' own due-date methods (models/cards.js). ---
assert.match(
  checklistItemsSrc,
  /getDue\(\)\s*\{\s*return this\.dueAt;\s*\}/,
  'ChecklistItems must have a getDue() reading this.dueAt',
);
assert.match(
  checklistItemsSrc,
  /async setDue\(dueAt\)\s*\{\s*return await ChecklistItems\.updateAsync\(this\._id,\s*\{\s*\$set:\s*\{\s*dueAt\s*\}\s*\}\);\s*\}/,
  'ChecklistItems must have a setDue(dueAt) that $set-s dueAt',
);
assert.match(
  checklistItemsSrc,
  /async unsetDue\(\)\s*\{\s*return await ChecklistItems\.updateAsync\(this\._id,\s*\{\s*\$unset:\s*\{\s*dueAt:\s*''\s*\}\s*\}\);\s*\}/,
  'ChecklistItems must have an unsetDue() that $unset-s dueAt',
);

// Negative: no member-assignment field/method was added alongside it - the
// issue asks for due dates ONLY, not assignment.
assert.doesNotMatch(
  dueAtFieldMatch.input.slice(dueAtFieldMatch.index, dueAtFieldMatch.index + 400),
  /assignee|memberId|members:/i,
  'no member-assignment field should ride along with dueAt',
);
assert.doesNotMatch(
  checklistItemsSrc,
  /assignChecklistItemMember|setChecklistItemAssignee/,
  'no member-assignment method should be added for this issue',
);

// --- 3. Client: the badge/popup templates and their wiring exist. ---
const checklistsJade = read('client/components/cards/checklists.jade');
assert.match(
  checklistsJade,
  /template\(name="checklistItemDueDate"\)/,
  'checklists.jade must define a checklistItemDueDate badge template',
);
assert.match(
  checklistsJade,
  /template\(name="editChecklistItemDueDatePopup"\)/,
  'checklists.jade must define the editChecklistItemDueDatePopup form',
);
// The badge reuses dateBadgeBody (the same markup cardDueDate/minicardDueDate
// use), and the popup reuses editDateForm (the same markup every other date
// popup uses) - no separate date-picker library/component was introduced.
assert.match(
  checklistsJade,
  /checklistItemDueDate[\s\S]{0,200}\+dateBadgeBody\(/,
  'checklistItemDueDate must reuse the shared dateBadgeBody markup',
);
assert.match(
  checklistsJade,
  /editChecklistItemDueDatePopup[\s\S]{0,200}\+editDateForm\(/,
  'editChecklistItemDueDatePopup must reuse the shared editDateForm markup',
);
// The item row wires the badge (or an add-date trigger) into
// checklistItemDetail.
assert.match(
  checklistsJade,
  /checklistItemDetail'[\s\S]*?\+checklistItemDueDate\(item=item/,
  'checklistItemDetail must render the item due-date badge',
);
assert.match(
  checklistsJade,
  /js-checklist-item-due-date/,
  'checklistItemDetail must offer a way to add a due date to an item',
);

const checklistsJs = read('client/components/cards/checklists.js');
assert.match(
  checklistsJs,
  /Template\.editChecklistItemDueDatePopup\.onCreated/,
  'checklists.js must set up the editChecklistItemDueDatePopup datePicker state',
);
assert.match(
  checklistsJs,
  /storeDate\(date, currentItem\)\s*\{\s*return currentItem\.setDue\(date\);\s*\}/,
  'the popup must save through item.setDue, not a card method',
);
assert.match(
  checklistsJs,
  /deleteDate\(currentItem\)\s*\{\s*return currentItem\.unsetDue\(\);\s*\}/,
  'the popup must clear through item.unsetDue, not a card method',
);
// It must NOT reuse setupDatePicker() from /client/lib/datepicker - that
// helper resolves its `card` via getCurrentCardFromContext(), which would
// find the surrounding CARD (not the checklist item) when opened from inside
// an already-open card detail dialog, and silently save the due date on the
// wrong document.
const popupBlockMatch = checklistsJs.match(
  /Template\.editChecklistItemDueDatePopup\.onCreated\(function[\s\S]*?\n\}\);/,
);
assert.ok(popupBlockMatch, 'editChecklistItemDueDatePopup.onCreated block must exist');
assert.doesNotMatch(
  popupBlockMatch[0],
  /setupDatePicker\(/,
  'must not reuse the card-specific setupDatePicker helper',
);

// --- 4. Overdue styling: the item badge reuses the card's own overdue
// decision function (dueDateClass) rather than duplicating the thresholds. ---
assert.match(
  checklistsJs,
  /import\s*\{\s*dueDateClass\s*\}\s*from\s*'\/client\/lib\/dueDateColor'/,
  'checklists.js must import the shared dueDateClass overdue/due-soon decision',
);
assert.match(
  checklistsJs,
  /Template\.checklistItemDueDate\.helpers\(\{[\s\S]*?classes\(\)\s*\{[\s\S]*?dueDateClass\(/,
  'the item due-date badge classes() must be computed by dueDateClass',
);

// --- 5. i18n: no new translation key was added for this - the popup title
// and badge title/label text reuse the card's own existing due-date keys. ---
assert.match(
  checklistsJs,
  /titleKey:\s*'editCardDueDatePopup-title'/,
  'the popup must reuse the existing editCardDueDatePopup-title translation',
);
assert.match(
  checklistsJs,
  /TAPi18n\.__\('card-due-on'\)/,
  'the badge title must reuse the existing card-due-on translation',
);
const enI18n = JSON.parse(read('imports/i18n/data/en.i18n.json'));
assert.ok(
  Object.prototype.hasOwnProperty.call(enI18n, 'card-due-on'),
  'card-due-on must still exist in en.i18n.json',
);
assert.ok(
  Object.prototype.hasOwnProperty.call(enI18n, 'editCardDueDatePopup-title'),
  'editCardDueDatePopup-title must still exist in en.i18n.json',
);

console.log('checklistItemDueDate.test.cjs OK');
