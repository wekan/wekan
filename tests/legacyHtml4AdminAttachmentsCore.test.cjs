'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const jade = read('client/components/settings/attachments.js');

assert.ok(page.includes('ADMIN_ATTACHMENT_PANES'));
for (const slug of ['backup', 'move', 'default-save-storage', 'limits', 'gridfs',
  'filesystem', 's3', 'azure', 'gcs', 'database-migration']) assert.ok(page.includes(slug));

assert.ok(page.includes("default-save-storage|limits"));
assert.ok(page.includes('getAttachmentStorageSettings.call({ userId })'));
assert.ok(page.includes("legacyOperation: 'set-default-attachment-storage'"));
assert.ok(page.includes("legacyOperation: 'save-attachment-transfer-limits'"));
assert.ok(page.includes('attachmentLimitInputs(settings, translate)'));

assert.ok(route.includes("path === '/admin/attachments/default-save-storage'"));
assert.ok(route.includes("path === '/admin/attachments/limits'"));
assert.ok(route.includes('setDefaultAttachmentStorage.call'));
assert.ok(route.includes('updateAttachmentStorageSettings.call'));
assert.ok(route.includes("tripCanary('authz.legacy-html4-admin-attachments'"));
assert.ok(route.includes('Object.values(LIMIT_MODES).includes(mode)'));

assert.ok(jade.includes("require('/models/lib/attachmentTransferLimits')"));
assert.ok(!jade.includes('const LIMIT_UNIT_FACTORS ='));
assert.ok(!jade.includes('function normalizeLimitSettings('));

console.log('legacyHtml4AdminAttachmentsCore: 2 panes share guarded settings operations');
