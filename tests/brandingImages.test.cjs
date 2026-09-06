const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(name) {
  return fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
}

test('branding images are localized through SSRF-safe bounded GIF storage', () => {
  const code = source('server/brandingImages.js');
  assert.match(code, /fetchSafe\(value, \{ maxRedirects: 3 \}\)/);
  assert.match(code, /boundedStreamBuffer\(response\.body \|\| response, MAX_UPLOAD_BYTES\)/);
  assert.match(code, /convertImageBufferToGif\(input\)/);
  assert.match(code, /getDefaultStorage/);
  assert.match(code, /versionName: 'original'/);
  assert.match(code, /\[field\]: value.*\$set: \{ \[field\]: url \}/s);
  assert.match(code, /new Mongo\.Collection\('brandingImageImports'\)/);
  assert.match(code, /\{ \$set: \{ \[field\]: '' \} \}/);
});

test('branding upload is authorized and cannot restore arbitrary image URLs', () => {
  const code = source('server/brandingImages.js');
  const settings = source('server/models/settings.js');
  const tenant = source('server/methods/tenant.js');
  assert.match(code, /user\?\.isAdmin !== true/);
  assert.match(code, /tenantAdmin\.canManageOrg\(user, orgId\)/);
  assert.match(code, /base64\.length > Math\.ceil\(MAX_UPLOAD_BYTES/);
  const restFields = settings.slice(settings.indexOf('const REST_SETTINGS_FIELDS'));
  assert.doesNotMatch(restFields, /'customLoginLogoImageUrl'/);
  assert.doesNotMatch(restFields, /'customTopLeftCornerLogoImageUrl'/);
  assert.match(tenant, /imageFields\.has\(field\)/);
});

test('Admin branding forms expose image upload controls but no image URL inputs', () => {
  const globalForm = source('client/components/settings/settingBody.jade');
  const orgForm = source('client/components/settings/peopleBody.jade');
  assert.match(globalForm, /custom-login-logo-image-upload\(type="file" accept="image\/\*"\)/);
  assert.match(orgForm, /orgCustomLoginLogoImageUpload\(type="file" accept="image\/\*"\)/);
  assert.doesNotMatch(globalForm, /custom-login-logo-image-url\(type="text"/);
  assert.doesNotMatch(orgForm, /orgCustomLoginLogoImageUrl\(type="text"/);
});

test('branding GIF responses are immutable and MIME-sniffing is disabled', () => {
  const code = source('server/brandingImages.js');
  assert.match(code, /'Content-Type': 'image\/gif'/);
  assert.match(code, /'X-Content-Type-Options': 'nosniff'/);
  assert.match(code, /max-age=31536000, immutable/);
  assert.match(code, /'meta\.systemAsset': 'branding-image'/);
});

test('legacy external board backgrounds become authorized local GIF attachments', () => {
  const server = source('server/brandingImages.js');
  const boardModel = source('models/boards.js');
  const popup = source('client/components/sidebar/sidebar.jade');
  assert.match(server, /Boards\.find\(\{ backgroundImageURL: \/\^https\?:/);
  assert.match(server, /storeBoardBackgroundGif/);
  assert.match(server, /meta: \{[\s\S]*boardId[\s\S]*source: 'board-background'/);
  assert.match(server, /backgroundImageId: stored\.id, backgroundImageURL: stored\.url/);
  assert.doesNotMatch(popup, /js-board-background-image-url/);
  assert.match(boardModel, /!\/\^\\\/cdn\\\/storage\\\/attachments/);
  assert.match(server, /async uploadBoardBackgroundImage\(boardId, base64\)/);
  assert.match(server, /storeBoardBackgroundGif\(input, boardId, 'admin-upload'\)/);
  assert.doesNotMatch(source('models/wekanCreator.js'),
    /boardToCreate\.backgroundImageURL = boardToImport\.backgroundImageURL/);
  assert.doesNotMatch(source('models/trelloCreator.js'),
    /boardToCreate\.backgroundImageURL = bgImage/);
});
