'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/accessibleAttachmentOperations.js');
const html4 = read('server/legacyHtml4.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const html5 = read('client/components/cards/attachments.js');
const oldMethods = read('models/attachments.server.js');

test('one attachment boundary resolves exact content and optional route scopes', () => {
  assert.match(service, /Attachments\.collection\.findOneAsync\(\{\s*_id:/);
  assert.match(service, /attachment\.meta\.cardId, boardId: attachment\.meta\.boardId/);
  assert.match(service, /canEditCardOrLinkedCard\(userId, contentCard\)/);
  assert.match(service, /_id: routeCardId, boardId: routeBoardId, deletedAt: null/);
  assert.match(service, /routeCard\.linkedId !== contentCard\._id/);
  assert.match(service, /routeCard\._id !== contentCard\._id \|\| routeCard\.boardId !== contentCard\.boardId/);
  assert.match(service, /tripCanary\('attachment\.cross-scope'/);
});

test('rename, cover and delete preserve filename, type and exact-record invariants', () => {
  assert.match(service, /filenameLooksLikeExploit\(proposed\)/);
  assert.match(service, /sanitizeUploadFileName\(proposed, attachmentKind\(attachment\)\.type/);
  assert.match(service, /enabled && !attachmentKind\(attachment\)\.isImage/);
  assert.match(service, /boardId: contentCard\.boardId, coverId: attachment\._id/);
  assert.match(service, /'meta\.cardId': contentCard\._id/);
  assert.match(service, /'meta\.boardId': contentCard\.boardId/);
});

test('HTML5 and HTML4 both invoke the common attachment operations', () => {
  for (const operation of ['renameAccessibleAttachment', 'removeAccessibleAttachment',
    'setAccessibleAttachmentCover']) assert.match(html4, new RegExp(operation));
  for (const method of ['renameAttachment', 'removeAttachment', 'setAttachmentCover']) {
    assert.match(html5, new RegExp(`Meteor\\.callAsync\\('${method}'`));
  }
  assert.doesNotMatch(html5, /Attachments\.removeAsync/);
  assert.doesNotMatch(oldMethods, /async renameAttachment\(/);
  assert.doesNotMatch(oldMethods, /allowIsBoardMember\(currentUserId, board\)/);
});

test('HTML4 renders route-bound rename, image cover and confirmed delete controls', () => {
  assert.match(pages, /boardId: card\.boardId, cardId: card\._id, attachmentId: attachment\._id/);
  assert.match(pages, /id: `attachment-name-\$\{attachment\._id\}`/);
  assert.match(pages, /legacyOperation: 'rename-attachment'/);
  assert.match(pages, /canWrite && kind\.isImage/);
  assert.match(pages, /legacyOperation: 'set-attachment-cover'/);
  assert.match(pages, /confirmAttachmentDelete === attachment\._id/);
  assert.match(pages, /legacyOperation: 'confirm-delete-attachment'/);
  assert.match(pages, /legacyOperation: 'delete-attachment'/);
});
