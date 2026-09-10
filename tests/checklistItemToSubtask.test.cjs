'use strict';
(async () => {

// Unit + negative tests for GitHub issue #2422: "Convert the checklist item
// to subtask by click, and keep the link between them".
//
// This is DISTINCT from two features that already exist and create a new
// card from a checklist item's text:
//  - convertChecklistItemToCardPopup (client/components/cards/cardDetails.js)
//    creates a plain, unlinked card via Cards.insert() - no parentId, no
//    reference stored anywhere.
//  - the #3294 drag-to-card gesture (models/lib/checklistItemToCard.js,
//    see tests/checklistItemToCard.test.cjs) also creates a plain, unlinked
//    card.
// Neither of those makes the new card a SUBTASK (parentId of the current
// card) or records any link back to the checklist item that spawned it.
//
// "Convert to subtask" (checklists.js's
// 'click .js-convert-checklist-item-to-subtask' handler) instead:
//  - creates the new card via the server-authoritative `addSubtaskCard`
//    Meteor method (server/models/cards.js) - the SAME mechanism
//    'submit .js-add-subtask' in subtasks.js uses for "Add a new subtask" -
//    so parentId is set to the current card exactly the way an ordinary
//    subtask's is;
//  - then stores the created subtask's _id on the checklist item's own
//    new `linkedCardId` field (models/checklistItems.js) via
//    item.setLinkedCardId(_id) - a one-way, set-once reference;
//  - never deletes or mutates the original checklist item's title/
//    isFinished/etc.
//
// Since models/checklistItems.js and server/models/cards.js pull in Meteor
// packages that don't load under plain node, these are source-guard tests
// (reading and pattern-matching the actual source), the same technique
// tests/checklistItemToCard.test.cjs already uses for its own source guard.
// Run: node tests/checklistItemToSubtask.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const checklistItemsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'models', 'checklistItems.js'),
  'utf8',
);
const checklistsClientSrc = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'cards', 'checklists.js'),
  'utf8',
);
const checklistsJadeSrc = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'cards', 'checklists.jade'),
  'utf8',
);
const cardsServerSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'cards.js'),
  'utf8',
);

// ── schema: linkedCardId is a new, OPTIONAL field ───────────────────────────

check('#2422: ChecklistItems schema declares an optional linkedCardId field', () => {
  assert.ok(
    /linkedCardId\s*:\s*\{[^}]*type\s*:\s*String[^}]*optional\s*:\s*true/s.test(checklistItemsSrc),
    'linkedCardId must be declared as an optional String field on ChecklistItems',
  );
});

check('#2422: ChecklistItems has a setLinkedCardId helper that only touches linkedCardId', () => {
  const m = checklistItemsSrc.match(/async setLinkedCardId\(cardId\)\s*\{([\s\S]*?)\n  \},/);
  assert.ok(m, 'setLinkedCardId helper must exist');
  assert.ok(/\$set:\s*\{\s*linkedCardId:\s*cardId\s*\}/.test(m[1]),
    'setLinkedCardId must $set only linkedCardId, and must not touch title/isFinished');
});

// ── client handler: creates a SUBTASK, not a plain card ─────────────────────

check('#2422: checklists.js wires "Convert to subtask" through addSubtaskCard (the same server method "Add a new subtask" uses), not Cards.insert', () => {
  const m = checklistsClientSrc.match(
    /'click \.js-convert-checklist-item-to-subtask'\s*\(event, tpl\)\s*\{([\s\S]*?)\n  \},/,
  );
  assert.ok(m, 'the js-convert-checklist-item-to-subtask handler must exist');
  const body = m[1];
  assert.ok(/Meteor\.callAsync\(\s*\n?\s*'addSubtaskCard'/.test(body),
    'must create the subtask via the addSubtaskCard method (parentId is set server-side there)');
  assert.ok(!/Cards\.insert\(/.test(body),
    'must NOT insert a plain card directly on the client (that is what convertChecklistItemToCardPopup / #3294 already do)');
});

check('#2422: the handler records the created subtask on the checklist item via setLinkedCardId', () => {
  const m = checklistsClientSrc.match(
    /'click \.js-convert-checklist-item-to-subtask'\s*\(event, tpl\)\s*\{([\s\S]*?)\n  \},/,
  );
  assert.ok(m);
  assert.ok(/item\.setLinkedCardId\(\s*_id\s*\)/.test(m[1]),
    'the new subtask\'s _id must be stored on the checklist item\'s linkedCardId');
});

check('#2422: "Convert to subtask" is a DISTINCT action from the existing "Convert to card" popup - both selectors are wired, neither replaces the other', () => {
  assert.ok(/'click \.js-convert-checklist-item-to-card':\s*Popup\.open\('convertChecklistItemToCard'\)/.test(checklistsClientSrc),
    'the pre-existing convert-to-card popup action must still be wired');
  assert.ok(/'click \.js-convert-checklist-item-to-subtask'/.test(checklistsClientSrc),
    'the new convert-to-subtask action must be wired alongside it');
});

check('#2422: server addSubtaskCard sets parentId to the current card - the same mechanism the new action reuses', () => {
  const m = cardsServerSrc.match(/async addSubtaskCard\(parentCardId, title[\s\S]*?\n  \},/);
  assert.ok(m, 'addSubtaskCard must exist');
  assert.ok(/parentId:\s*parentCardId/.test(m[0]),
    'addSubtaskCard must set parentId on the inserted card - this is what makes the result a SUBTASK, not a plain card');
});

// ── template: both actions present, plus the linked-subtask indicator ──────

check('#2422: checklists.jade offers "Convert to subtask" alongside the existing "Convert to card" action', () => {
  assert.ok(/js-convert-checklist-item-to-card/.test(checklistsJadeSrc));
  assert.ok(/js-convert-checklist-item-to-subtask/.test(checklistsJadeSrc));
});

check('#2422: checklists.jade renders a linked-subtask indicator gated on the linkedSubtask helper', () => {
  assert.ok(/if linkedSubtask/.test(checklistsJadeSrc));
  assert.ok(/js-checklist-item-linked-subtask/.test(checklistsJadeSrc));
});

check('#2422: the linkedSubtask helper resolves via item.getLinkedCard, i.e. is conditioned on linkedCardId', () => {
  const m = checklistsClientSrc.match(/linkedSubtask\(\)\s*\{([\s\S]*?)\n  \},/);
  assert.ok(m, 'checklistItemDetail must define a linkedSubtask helper');
  assert.ok(/item\.getLinkedCard/.test(m[1]));
});

// ── i18n: the new labels exist and are not left as English placeholders ────

check('#2422: en.i18n.json has the new labels', () => {
  const en = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'imports', 'i18n', 'data', 'en.i18n.json'), 'utf8',
  ));
  assert.strictEqual(en['convertChecklistItemToSubtask-title'], 'Convert to Subtask');
  assert.strictEqual(en['checklistItem-linked-subtask'], 'Linked subtask');
});

check('#2422: a sample of non-English locales carry a real (non-English) translation, not a placeholder', () => {
  const dataDir = path.join(__dirname, '..', 'imports', 'i18n', 'data');
  for (const code of ['fr', 'de', 'es', 'ru', 'ja', 'ar', 'zh-CN']) {
    const doc = JSON.parse(fs.readFileSync(path.join(dataDir, `${code}.i18n.json`), 'utf8'));
    assert.notStrictEqual(doc['convertChecklistItemToSubtask-title'], 'Convert to Subtask',
      `${code}: convertChecklistItemToSubtask-title must be translated, not left in English`);
    assert.notStrictEqual(doc['checklistItem-linked-subtask'], 'Linked subtask',
      `${code}: checklistItem-linked-subtask must be translated, not left in English`);
    assert.ok(doc['convertChecklistItemToSubtask-title'] && doc['convertChecklistItemToSubtask-title'].length > 0);
    assert.ok(doc['checklistItem-linked-subtask'] && doc['checklistItem-linked-subtask'].length > 0);
  }
});

// ── negative: the pre-existing "convert to card" action must NOT set
// parentId or linkedCardId - it must stay a plain, unlinked card exactly as
// before this change (regression guard distinguishing the two features) ────

check('(negative) #2422: the pre-existing convertChecklistItemToCardPopup does not set parentId or linkedCardId anywhere', () => {
  const cardDetailsSrc = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'cards', 'cardDetails.js'),
    'utf8',
  );
  const m = cardDetailsSrc.match(
    /Template\.convertChecklistItemToCardPopup\.onCreated\(function \(\) \{([\s\S]*?)\n\}\);/,
  );
  assert.ok(m, 'convertChecklistItemToCardPopup.onCreated must exist');
  assert.ok(!/parentId/.test(m[1]),
    'convertChecklistItemToCardPopup must stay a plain card creation - no parentId (that would make it a de-facto subtask, which is this issue\'s NEW distinct behavior)');
  assert.ok(!/setLinkedCardId/.test(m[1]),
    'convertChecklistItemToCardPopup must not record a linkedCardId - only the new "Convert to subtask" action does');
});

check('(negative) #2422: buildCardFromChecklistItem (the #3294 drag-to-card helper) still builds a plain card with no parentId/linkedCardId field', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'models', 'lib', 'checklistItemToCard.js'), 'utf8',
  );
  assert.ok(!/parentId/.test(src));
  assert.ok(!/linkedCardId/.test(src));
});

console.log(`\nchecklistItemToSubtask: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });
