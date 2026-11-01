'use strict';

// Guard: UnassignedAttachBleed (GHSA-w26g-rc43-q6cm, 2026-11-01). An
// assigned-only member (isNormalAssignedOnly, ...) writes only on the cards
// assigned to them. The attachment API asked only for board write access, so a
// member whose assignment was removed kept the card and attachment ids they
// had seen and, through REST, still uploaded a file to that card and
// soft-deleted its existing one. The DDP twins of those routes, and copy and
// move onto a target card, had the same shape. The ordinary card Delete
// (canEditCardOrLinkedCard) already applied the rule; now every API write does.
// Run: node tests/unassignedAttachBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const scope = require('../models/lib/boardCardScope');

function loadGuard() {
  const src = read('server/lib/assignedOnlyAttachments.js')
    .replace(/^import [^\n]*\n/gm, '').replace(/^const \{ isAssignedOnlyMember[^}]*\} = require[^\n]*\n/m, '')
    .replace(/^export /gm, '');
  const lib = { records: [] };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'ReactiveCache', 'isAssignedOnlyMember', 'assignedOnlyAllowsCard', 'require',
    `${src}\nexports.mayWriteCardAttachment = mayWriteCardAttachment;`)(
    lib, {}, scope.isAssignedOnlyMember, scope.assignedOnlyAllowsCard,
    () => ({ record: r => lib.records.push(r) }));
  return lib;
}

const board = {
  _id: 'B',
  members: [
    { userId: 'owner', isActive: true, isAdmin: true },
    { userId: 'member', isActive: true, isNormalAssignedOnly: true },
    { userId: 'normal', isActive: true },
  ],
};

test('the reported attack: after the assignment is removed, upload and delete are refused', () => {
  const { mayWriteCardAttachment, records } = loadGuard();
  const card = { _id: 'C', boardId: 'B', assignees: ['member'] };
  // While assigned, the member may add and delete files on the card.
  assert.equal(mayWriteCardAttachment(board, 'member', card, 'attachment-api:upload'), true);
  assert.equal(mayWriteCardAttachment(board, 'member', card, 'attachment-api:delete'), true);
  assert.equal(records.length, 0, 'ordinary use is never logged');
  // The owner removes the assignment; the member kept the ids.
  card.assignees = [];
  assert.equal(mayWriteCardAttachment(board, 'member', card, 'attachment-api:upload'), false);
  assert.equal(mayWriteCardAttachment(board, 'member', card, 'attachment-api:delete'), false);
  // Every refusal is an attempt, shown in Admin Panel -> Problems.
  assert.deepEqual(records.map(r => `${r.key}/${r.action}/${r.source}/${r.userId}`), [
    'authz.assigned-attachment-write/blocked/attachment-api:upload/member',
    'authz.assigned-attachment-write/blocked/attachment-api:delete/member',
  ]);
});

test('an assigned-only member changes no board-level file and no card of another board', () => {
  const { mayWriteCardAttachment } = loadGuard();
  assert.equal(mayWriteCardAttachment(board, 'member', null, 'attachment-api:delete'), false);
  assert.equal(mayWriteCardAttachment(board, 'member', { _id: 'X', boardId: 'other', assignees: ['member'] }, 'attachment-api:copy'), false);
});

test('negative: members who are not assigned-only keep their board write rights', () => {
  const { mayWriteCardAttachment, records } = loadGuard();
  const card = { _id: 'C', boardId: 'B', assignees: [] };
  for (const userId of ['owner', 'normal']) {
    assert.equal(mayWriteCardAttachment(board, userId, card, 'attachment-api:upload'), true);
    // A board background has no card; deleting it stays a board write.
    assert.equal(mayWriteCardAttachment(board, userId, null, 'attachment-api:delete'), true);
  }
  assert.equal(records.length, 0);
});

test('the catalog key names UnassignedAttachBleed and never disables', () => {
  assert.match(read('models/lib/securityCategories.js'),
    /'authz\.assigned-attachment-write':\s*\{ category: 'authz', bleed: 'UnassignedAttachBleed', severity: 'medium', cwe: 'CWE-863' \}/);
  const guard = read('server/lib/assignedOnlyAttachments.js');
  assert.match(guard, /try \{\n\s+require\('\/server\/lib\/securityLog'\)\.record\(\{\n\s+key: 'authz\.assigned-attachment-write'[\s\S]*?\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
});

// The shape, anywhere in the attachment API: a handler that adds or deletes an
// attachment after asking only userHasBoardWriteAccess. Each handler - REST
// route or DDP method - that writes (upload, copy, move, delete) must also ask
// mayWriteCardAttachment, and with its own source name.
test('negative: every attachment API write also asks the card, REST and DDP alike', () => {
  const expected = {
    'server/routes/attachmentApi.js': ['upload', 'copy', 'move', 'delete'].map(a => `attachment-api:${a}`),
    'server/attachmentApi.js': ['upload', 'copy', 'move', 'delete'].map(a => `attachment-method:${a}`),
  };
  for (const [file, sources] of Object.entries(expected)) {
    const src = read(file);
    const calls = [...src.matchAll(/mayWriteCardAttachment\([^)]*'([^']+)'\)/g)].map(m => m[1]);
    assert.deepEqual(calls.sort(), sources.slice().sort(), `${file}: each write handler asks the card once`);
    // Each handler that reaches a write after board write access: split the
    // file at handler starts and require the card guard wherever a write is.
    const handlers = src.split(/\n\s*(?:WebApp\.handlers\.use\(|async 'api\.)/).slice(1);
    for (const handler of handlers) {
      const writes = /softDeleteAttachment\(|addAttachmentFromStream\(|writeAsync\(|Attachments\.(?:insertAsync|updateAsync)\(|\.copyAttachment|meta\.cardId'?: targetCardId/.test(handler);
      const cardWrite = writes && /userHasBoardWriteAccess\(/.test(handler) && /cardId/.test(handler);
      if (!cardWrite) continue;
      const name = handler.slice(0, 60).split('\n')[0];
      assert.ok(/mayWriteCardAttachment\(|checkCardUploadTarget\(/.test(handler),
        `${file}: ${name} writes a card attachment after board write access alone`);
    }
  }
  // checkCardUploadTarget is shared by the JSON and the raw REST upload.
  const target = read('server/routes/attachmentApi.js');
  const fn = target.slice(target.indexOf('async function checkCardUploadTarget'), target.indexOf('async function apiUploadStorage'));
  assert.match(fn, /userHasBoardWriteAccess\(board, userId\)[\s\S]*mayWriteCardAttachment\(board, userId, card, 'attachment-api:upload'\)/);
});
