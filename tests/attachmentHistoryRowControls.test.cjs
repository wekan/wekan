'use strict';

// History.md §12.2: an attachment row in the card history has the card's own
// controls - preview (the attachmentViewer slideshow), download, and Restore
// while deleted - and NEVER cover or background. Plus the wiring that makes
// the row exist and restorable: the history hooks, the applier, the i18n key.
// Run: node tests/attachmentHistoryRowControls.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('attachmentHistoryRowControls:');

// Comments stripped: the template's own comment names the classes it must
// not contain, which is the point of the comment and not a match.
const jade = read('client/components/history/historyTable.jade').replace(/^\s*\/\/-.*$/gm, '');
const js = read('client/components/history/historyTable.js').replace(/^\s*\/\/.*$/gm, '');
const gallery = read('client/components/cards/attachments.jade');

// ---- the row's controls --------------------------------------------------------

test('the row previews with the SAME viewer the card uses (openAttachmentSlideshow, no new template)', () => {
  assert.ok(/a\.js-history-attachment-preview\(data-attachment-id="\{\{row\.attachment\._id\}\}" title="\{\{_ 'preview'\}\}"\)/.test(jade));
  assert.ok(/import \{ openAttachmentSlideshow \} from '\/client\/components\/cards\/attachments';/.test(js));
  assert.ok(/'click \.js-history-attachment-preview'[\s\S]*openAttachmentSlideshow\(attachmentId, ids\)/.test(js));
  assert.ok(!/template\(name="attachmentViewer"\)/.test(jade), 'negative: no second viewer template');
  assert.ok(/template\(name="attachmentViewer"\)/.test(gallery), 'the one viewer lives with the gallery');
});

test('the row downloads with the same link markup the gallery uses', () => {
  assert.ok(/a\.js-download\(href="\{\{link\}\}\?download=true", download="\{\{downloadFilename name\}\}"/.test(gallery));
  assert.ok(/a\.js-download\(href="\{\{row\.attachment\.link\}\}\?download=true" download="\{\{downloadFilename row\.attachment\.name\}\}" title="\{\{_ 'download'\}\}"\)/.test(jade));
  assert.ok(/'click \.js-download'\(event\) \{\s*\n\s*event\.stopPropagation\(\);/.test(js), 'the #101 router guard, as in the gallery');
});

test('the row offers Restore only while the attachment is deleted, through changeHistory.restore', () => {
  assert.ok(/if row\.attachment\.isDeleted\s*\n\s*a\.js-history-attachment-restore\(data-id="\{\{row\._id\}\}" title="\{\{_ 'restore'\}\}"\)/.test(jade));
  assert.ok(/'click \.js-history-attachment-restore'[\s\S]*Meteor\.call\('changeHistory\.restore', \[id\]/.test(js));
  assert.ok(/isDeleted: historyRowOffersRestore\(row, attachment\)/.test(js), 'the pure decision decides it');
  assert.ok(/button\.js-history-restore\.primary/.test(jade), 'the generic selection + Restore is still there');
});

test('negative: a history row NEVER offers cover or background', () => {
  for (const cls of ['js-add-cover', 'js-remove-cover', 'js-add-background-image', 'js-remove-background-image', 'attachmentActions']) {
    assert.ok(!jade.includes(cls), `historyTable.jade must not contain ${cls}`);
    assert.ok(!js.includes(cls), `historyTable.js must not contain ${cls}`);
  }
  // The card's own actions popup keeps them - that is the only place.
  assert.ok(/js-add-cover/.test(gallery) && /js-add-background-image/.test(gallery));
});

test('the controls use existing i18n keys only', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['preview', 'download', 'restore', 'history-change-removed', 'history-change-restored', 'attachments']) {
    assert.ok(typeof en[key] === 'string' && en[key], `en has ${key}`);
  }
  const keysUsed = [...jade.matchAll(/\{\{_ '([^']+)'\}\}/g)].map(m => m[1]);
  for (const key of keysUsed) assert.ok(en[key], `historyTable.jade uses an existing key: ${key}`);
});

test('the summary shows the filename a lifecycle row carries', () => {
  assert.ok(/if \(typeof content\.name === 'string' && content\.name\) return content\.name;/.test(js));
  assert.ok(js.indexOf("content.name === 'string'") < js.indexOf('content.deleted !== undefined'),
    'the filename wins over the generic Removed/Restored word');
});

// ---- server wiring ---------------------------------------------------------------

test('changeHistory.restore dispatches attachment rows to applyAttachmentContent', () => {
  const server = read('server/models/changeHistory.js');
  assert.ok(/attachment: applyAttachmentContent,/.test(server));
  assert.ok(/attachment: Attachments\.collection,/.test(server), 'currentContentOf can read the document back');
  const applier = server.slice(server.indexOf('async function applyAttachmentContent('), server.indexOf('const APPLIERS = {'));
  assert.ok(/attachmentContentAction\(content\)/.test(applier));
  assert.ok(/await restoreAttachment\(\{ userId: row\.restoredByUserId \|\| row\.userId, attachment \}\)/.test(applier));
  assert.ok(/await softDeleteAttachment\(\{ userId: row\.userId, attachment \}\)/.test(applier), 'a redo of a delete is the same soft delete');
  assert.ok(!/coverId|setCover/.test(applier), 'negative: the applier never touches the cover');
});

test('the soft delete and restore skip their own history row inside a restore (recorded once)', () => {
  const server = read('server/attachmentSoftDelete.js');
  assert.equal((server.match(/if \(!isRecordingSuppressed\(\)\) await ChangeHistory\.record\(plan\.historyRow\);/g) || []).length, 2);
});

test('the hooks record an upload and a rename, located by meta.cardId, and no remove', () => {
  const hooks = read('server/models/changeHistoryHooks.js');
  assert.ok(/case 'attachment': \{[\s\S]*meta\.cardId \? await Cards\.findOneAsync\(meta\.cardId\)/.test(hooks));
  assert.ok(/\[Attachments\.collection, 'attachment'\],/.test(hooks), 'a rename is diffed like any field edit');
  assert.ok(/Attachments\.collection\.after\.insert\(async \(userId, doc\) => \{[\s\S]*recordLifecycle\('attachment', uploader, doc, 'added'\)/.test(hooks));
  assert.ok(!/Attachments\.collection\.after\.remove/.test(hooks), 'negative: nothing removes an attachment, so nothing records one');
  const groups = read('models/lib/changeHistoryGroups.js');
  assert.ok(/const ATTACHMENT_FIELDS = \{\s*\n\s*name: 'attachments',\s*\n\s*\};/.test(groups));
  assert.ok(/attachment: ATTACHMENT_FIELDS,/.test(groups));
  const block = groups.slice(groups.indexOf('const ATTACHMENT_FIELDS = {'), groups.indexOf('};', groups.indexOf('const ATTACHMENT_FIELDS = {')));
  assert.ok(!/deletedAt|deletedBy|deleteBatchId/.test(block),
    'negative: the delete is not ALSO recorded as three field edits');
});

test('the soft-delete method checks the same card edit right the upload allow rule does', () => {
  const server = read('server/attachmentSoftDelete.js');
  assert.ok(/canEditCardOrLinkedCard\(userId, card\)/.test(server));
  assert.ok(/allowIsBoardMemberWithWriteAccess\(userId, board\)/.test(server), 'a board background: write access on the board');
  for (const method of ["'attachments.softDelete'", "'attachments.restore'"]) {
    const body = server.slice(server.indexOf(`async ${method}(attachmentId)`));
    assert.ok(/if \(!this\.userId\) \{/.test(body), `${method} requires a login`);
    assert.ok(/canSoftDeleteAttachment\(this\.userId, attachment\)/.test(body), `${method} checks the right`);
  }
});

// ---- the one new i18n key ------------------------------------------------------------

test('the delete confirmation says it is restorable, with one key present in every locale at the same position', () => {
  assert.ok(/p \{\{_ "attachment-soft-delete-pop"\}\}/.test(gallery));
  const dir = path.join(ROOT, 'imports/i18n/data');
  const en = read('imports/i18n/data/en.i18n.json').split('\n');
  const at = en.findIndex(l => l.startsWith('  "attachment-soft-delete-pop":'));
  assert.ok(at > 0 && en[at - 1].startsWith('  "attachment-delete-pop":'), 'right after attachment-delete-pop in en');
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const lines = read(`imports/i18n/data/${file}`).split('\n');
    const i = lines.findIndex(l => l.startsWith('  "attachment-soft-delete-pop":'));
    assert.ok(i > 0, `${file} has the key`);
    assert.ok(lines[i - 1].startsWith('  "attachment-delete-pop":'), `${file} has it at the same position`);
  }
});

console.log(`\nattachmentHistoryRowControls: ${passed} tests passed`);
