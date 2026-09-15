const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const routes = new Map();
let setting;
const source = fs.readFileSync(path.join(__dirname, '../server/routes/customHeadAssets.js'), 'utf8')
  .replace(/^import .*;\n/gm, '');

vm.runInNewContext(source, {
  WebApp: { handlers: { use: (route, handler) => routes.set(route, handler) } },
  Meteor: { absolutePath: path.join(__dirname, '..') },
  Settings: { findOneAsync: async () => setting },
  fs,
  path,
  console,
});

async function request(route, method = 'GET') {
  const response = { status: null, headers: null, body: null, passed: false };
  const res = {
    writeHead(status, headers) { response.status = status; response.headers = headers; },
    end(body) { response.body = body; },
  };
  await routes.get(route)({ method }, res, () => { response.passed = true; });
  return response;
}

(async () => {
  const configured = '[{"relation":["delegate_permission/common.handle_all_urls"]}]';
  setting = { customAssetLinksEnabled: true, customAssetLinksContent: configured };
  for (const route of ['/.well-known/assetlinks.json', '/well-known/assetlinks.json']) {
    const response = await request(route);
    assert.equal(response.status, 200);
    assert.equal(response.body, configured);
    assert.match(response.headers['Content-Type'], /^application\/json/);
  }

  setting.customAssetLinksEnabled = false;
  const disabled = await request('/well-known/assetlinks.json');
  assert.equal(disabled.status, 200);
  assert.notEqual(disabled.body, configured);

  setting.customAssetLinksEnabled = true;
  assert.equal((await request('/well-known/assetlinks.json', 'POST')).passed, true);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
