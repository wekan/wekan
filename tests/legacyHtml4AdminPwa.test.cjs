'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = relative => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');

(async () => {
  const validation = await import('../server/lib/customHeadValidation.js');
  assert.strictEqual(validation.sanitizeCustomHeadTags(
    '<meta name="theme-color" content="#fff">', 'meta'),
  '<meta name="theme-color" content="#fff">');
  assert.strictEqual(validation.sanitizeCustomHeadTags(
    '<link rel="icon" href="/icon.png">', 'link'),
  '<link rel="icon" href="/icon.png">');
  for (const dangerous of [
    ['<script>alert(1)</script>', 'meta'],
    ['<meta name="x" onclick="alert(1)">', 'meta'],
    ['<link rel="icon" href="javascript:alert(1)">', 'link'],
    ['plain text', 'meta'],
  ]) assert.throws(() => validation.sanitizeCustomHeadTags(...dangerous));
  assert.strictEqual(validation.normalizePwaJson('{"name":"Wekan"}', 'object'),
    '{\n  "name": "Wekan"\n}');
  assert.strictEqual(validation.normalizePwaJson('[{"relation":[]}]', 'array'),
    '[\n  {\n    "relation": []\n  }\n]');
  assert.throws(() => validation.normalizePwaJson('{} trailing', 'object'));
  assert.throws(() => validation.normalizePwaJson('[]', 'object'));
  assert.throws(() => validation.normalizePwaJson('{}', 'array'));

  const service = read('server/lib/adminPwaSettings.js');
  const methods = read('server/methods/adminPwaSettings.js');
  const pages = read('server/lib/legacyHtml4Pages.js');
  const route = read('server/legacyHtml4.js');
  const client = read('client/components/settings/settingBody.js');
  const jade = read('client/components/settings/settingBody.jade');
  const render = read('server/lib/customHeadRender.js');
  const assets = read('server/routes/customHeadAssets.js');
  const permission = read('server/permissions/settings.js');
  assert.match(service, /fields: \{ isAdmin: 1, username: 1 \}/);
  assert.match(service, /PWA_TOGGLE_FIELDS\.includes\(field\)/);
  assert.match(service, /sanitizeCustomHeadTags\(metaTags, 'meta'\)/);
  assert.match(service, /normalizePwaJson\(manifest, 'object'\)/);
  assert.match(service, /normalizePwaJson\(content, 'array'\)/);
  assert.match(service, /bleed: 'SettingsBleed'/);
  assert.match(methods, /setPwaToggleForAdmin\(this\.userId/);
  assert.match(render, /customHeadMarkup\(setting\)/,
    'both boilerplates use the common checked markup builder');
  assert.match(route, /customHeadMarkup\(setting\)/,
    'the Legacy HTML4 document receives the same checked head tags');
  assert.match(assets, /normalizePwaJson\(setting\.customManifestContent, 'object'\)/,
    'stored manifests are validated again when served');
  assert.match(assets, /normalizePwaJson\(setting\.customAssetLinksContent, 'array'\)/,
    'stored asset links are validated again when served');
  assert.match(assets, /'X-Content-Type-Options': 'nosniff'/);
  assert.match(permission, /GUARDED_PWA_FIELDS/);
  assert.match(permission, /Settings\.deny/,
    'direct DDP updates cannot bypass PWA validation');

  const clientBody = client.slice(client.indexOf("'click a.js-toggle-custom-head'"),
    client.indexOf('// Event handlers for attachment settings'));
  for (const method of ['setAdminPwaToggle', 'setAdminPwaHeadContent',
    'setAdminPwaAssetLinks']) assert.ok(clientBody.includes(method));
  assert.doesNotMatch(clientBody, /Settings\.update/,
    'the Jade PWA pane has no direct Settings write');
  assert.doesNotMatch(client.slice(0, client.indexOf('const LIMIT_UNIT_FACTORS')),
    /substring\(0, endPos\)|replace\(\/,/,
    'invalid trailing JSON is not silently repaired');

  const at = pages.indexOf('async function adminSettingsPwaPage');
  assert.ok(at >= 0, 'the dedicated HTML4 PWA controller exists');
  const body = pages.slice(at, at + 6000);
  for (const key of ['custom-head-tags-enabled', 'custom-head-meta-tags',
    'custom-head-link-tags', 'custom-manifest-enabled',
    'custom-head-manifest-content', 'custom-assetlinks-enabled',
    'custom-assetlinks-content']) {
    assert.ok(body.includes(`'${key}'`), `${key} renders in HTML4`);
    assert.ok(jade.includes(`'${key}'`), `${key} renders in HTML5`);
  }
  assert.match(body, /uiTextareaGroupForm\(/);
  assert.match(route, /setPwaHeadContentForAdmin\(/);
  assert.match(route, /setPwaAssetLinksForAdmin\(/);
  console.log('legacyHtml4AdminPwa: safe shared PWA settings passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
