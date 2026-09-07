'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = file => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

const service = read('server/lib/adminVisibilitySettings.js');
const theme = read('server/lib/adminThemeSettings.js');
const methods = read('server/methods/adminVisibilitySettings.js');
const settingsPermission = read('server/permissions/settings.js');
const visibilityPermission = read('server/permissions/tableVisibilityModeSettings.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const client = read('client/components/settings/settingBody.js');
const branding = read('server/brandingImages.js');
const multipart = read('server/lib/legacyHtml4Multipart.js');

for (const group of ['allBoards', 'urls', 'product', 'logos']) {
  assert.ok(service.includes(`${group}: Object.freeze`), `${group} has a fixed allowlist`);
}
assert.match(service, /ALLOWED_WAIT_SPINNERS\.includes\(value\)/);
assert.match(service, /url\.protocol === 'http:' \|\| url\.protocol === 'https:'/);
assert.ok(service.includes('/^[1-9]\\d{0,3}$/.test(height)'));
assert.match(service, /bleed: 'SettingsBleed'/);
assert.match(methods, /saveVisibilitySettingsForAdmin\(this\.userId/);
assert.match(settingsPermission, /GUARDED_VISIBILITY_SETTINGS_FIELDS/);
assert.match(settingsPermission, /source: 'Settings DDP update'/);
assert.match(visibilityPermission, /TableVisibilityModeSettings\.deny/);
assert.match(visibilityPermission, /source: 'TableVisibilityModeSettings DDP update'/);
assert.doesNotMatch(client.slice(client.indexOf('function saveVisibilitySettings'),
  client.indexOf('Template.announcementSettings.onCreated')), /Settings\.update|TableVisibilityModeSettings\.update/);
assert.match(client, /saveAdminVisibilitySettings/);
assert.match(theme, /tenantAdmin\.themeTarget/);
assert.match(theme, /BOARD_COLORS\.includes\(color\)/);
assert.match(pages, /async function adminSettingsVisibilityPage/);
for (const operation of ['save-visibility-allboards', 'save-visibility-urls',
  'save-visibility-product', 'save-visibility-theme', 'save-visibility-logos',
  'upload-visibility-logo']) assert.ok(pages.includes(operation));
assert.match(route, /saveVisibilitySettingsForAdmin\(session\.userId/);
assert.match(route, /setAdminThemeForUser\(session\.userId/);
assert.match(route, /uploadBrandingImageForUser\(session\.userId/);
assert.match(branding, /convertImageBufferToGif\(input\)/);
assert.match(multipart, /requestPath === '\/admin\/settings\/visibility'/);
assert.match(multipart, /'brandingImage'/);
console.log('legacyHtml4AdminVisibility: equivalent guarded settings and uploads passed');
