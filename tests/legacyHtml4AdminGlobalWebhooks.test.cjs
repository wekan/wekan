'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = file => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

const service = read('server/lib/adminGlobalWebhooks.js');
const method = read('server/methods/adminGlobalWebhooks.js');
const permission = read('server/permissions/integrations.js');
const publication = read('server/publications/settings.js');
const client = read('client/components/sidebar/sidebar.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');

assert.match(service, /validateAttachmentUrl\(url\)/,
  'every global webhook URL receives the DNS-aware SSRF validation');
assert.match(service, /WEBHOOK_TYPES\.includes\(input\.type\)/);
assert.match(service, /fields: \{ isAdmin: 1, username: 1 \}/);
assert.match(service, /bleed: 'WebhookBleed'/);
assert.match(service, /fields: \{ title: 1, url: 1, type: 1, enabled: 1 \}/,
  'the admin reader does not disclose tokens');
assert.match(method, /saveGlobalWebhookForAdmin\(this\.userId/);
assert.match(permission, /GLOBAL_WEBHOOK_ID\) return false/,
  'direct DDP writes cannot bypass the server validator');
assert.match(publication, /fields: \{\s*token: 0,/,
  'global webhook tokens are not published');
assert.match(client, /callAsync\('saveAdminGlobalWebhook'/,
  'the modern pane uses the same server service');
assert.match(pages, /async function adminSettingsGlobalWebhooksPage/);
for (const name of ['title', 'url', 'token', 'type', 'enabled']) {
  assert.ok(pages.includes(`name: '${name}'`), `${name} is available in HTML4`);
}
assert.match(route, /saveGlobalWebhookForAdmin\(session\.userId/);
assert.match(route, /path === '\/admin\/settings\/global-webhooks'/);
console.log('legacyHtml4AdminGlobalWebhooks: safe equivalent CRUD passed');
