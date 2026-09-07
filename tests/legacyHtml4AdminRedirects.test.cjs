'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'imports/lib/legacyHtml4.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server/legacyHtml4.js'), 'utf8');
const router = fs.readFileSync(path.join(root, 'config/router.js'), 'utf8');

assert.match(server, /legacyAdminCanonicalPath/);
assert.match(server, /path === '\/setting' \|\| path === '\/information'/);
assert.match(server, /path === '\/translation'/);
assert.match(server, /Object\.values\(ADMIN_PAGES\)/);
assert.match(server, /Object\.hasOwn\(config\.panes, slug\)/);
assert.match(server, /res\.statusCode = 303/);
assert.match(server, /res\.setHeader\('Location', canonicalAdminPath\)/);
assert.match(renderer, /\^\\\/attachments\\\//);
assert.doesNotMatch(renderer, /cdn\|cfs\|attachments\|avatars/);
for (const oldPath of ['/setting', '/information', '/translation']) {
  assert.ok(router.includes(`FlowRouter.route('${oldPath}'`));
}

console.log('legacyHtml4AdminRedirects: canonical old Admin URLs passed');
