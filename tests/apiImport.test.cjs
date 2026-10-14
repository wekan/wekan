'use strict';

// Import from a service's API (decided 2026-10-14): the shared part - the
// catalog and its credential check, the server methods' gate, the request
// through the SSRF guard, the import page's form and the wiring of the six
// services. Each service's own client and parser are tested in
// tests/<key>ApiImport.test.cjs; releases/live-tests/<key>-import.mjs run them
// against the real services from build.sh / build.bat.
// Run: node tests/apiImport.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { API_IMPORT_SERVICES, MAX_FIELD_LENGTH, apiImportService, cleanApiImportCredentials } = require('../models/lib/apiImportServices.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const KEYS = ['planka', 'mstodo', 'kanbanflow', 'basecamp', 'googletasks', 'googlekeep'];
const PARSERS = { planka: 'parsePlankaApi', mstodo: 'parseMicrosoftTodoApi', kanbanflow: 'parseKanbanflowApi',
  basecamp: 'parseBasecampApi', googletasks: 'parseGoogleTasksApi', googlekeep: 'parseGoogleKeepApi' };

(async () => {
  assert.deepEqual(API_IMPORT_SERVICES.map(s => s.key), KEYS);
  // The credentials a call may carry.
  assert.deepEqual(cleanApiImportCredentials('planka', { url: ' https://planka.example.org/ ', username: ' me ', password: ' p w ' }),
    { url: 'https://planka.example.org', username: 'me', password: ' p w ' }, 'a secret is kept exactly, the rest trimmed');
  assert.deepEqual(cleanApiImportCredentials('basecamp', { account: '123', token: 't' }), { account: '123', token: 't' });
  // Negative: an unknown service or field, a missing one, a non-string, too long, a bad address.
  for (const [key, input, why] of [
    ['trello', { token: 't' }, /Unknown import service/],
    ['mstodo', null, /required/],
    ['mstodo', ['t'], /required/],
    ['mstodo', {}, /token is required/],
    ['mstodo', { token: 't', url: 'https://x' }, /Unexpected credential field url/],
    ['mstodo', { token: 42 }, /not valid/],
    ['mstodo', { token: 'x'.repeat(MAX_FIELD_LENGTH + 1) }, /not valid/],
    ['planka', { url: 'file:///etc/passwd', username: 'u', password: 'p' }, /url is not valid/],
    ['planka', { url: 'https://user:pw@planka.example.org', username: 'u', password: 'p' }, /url is not valid/],
    ['planka', { url: 'not a url', username: 'u', password: 'p' }, /url is not valid/],
  ]) assert.throws(() => cleanApiImportCredentials(key, input), why, `${key} ${JSON.stringify(input)}`);
  assert.equal(apiImportService('nope'), null);
  console.log('  ok - the catalog and its credential check');

  // The server: login, the import switch, no Sandstorm, rate limited, nothing stored.
  const server = read('server/apiImport.js');
  assert.match(server, /if \(!userId\) throw new Meteor\.Error\('error-notAuthorized'\);/);
  assert.match(server, /await assertImportEnabled\(\);/, 'the Admin Panel switch that disables import also disables this');
  assert.match(server, /Meteor\.settings\?\.public\?\.sandstorm\) throw/);
  assert.match(server, /cleanApiImportCredentials\(service, credentials\)/);
  assert.match(server, /DDPRateLimiter\.addRule\(\{ type: 'method', name: name => \['apiImportList', 'apiImportFetch'\]\.includes\(name\)/);
  for (const key of KEYS) assert.match(server, new RegExp(`import \\* as ${key} from '/models/lib/apiImport/${key}';`));
  // Negative: credentials never written anywhere or logged.
  assert.doesNotMatch(server, /insertAsync|updateAsync|upsertAsync|console\.(log|warn|error)/);
  assert.match(read('server/imports.js'), /^import '\/server\/apiImport';$/m);
  const request = read('server/lib/apiImportRequest.js');
  assert.match(request, /fetchSafe\(url, \{/);
  assert.match(request, /maxRedirects: 0, maxResponseBytes: MAX_RESPONSE_BYTES/);
  assert.match(request, /redirect: 'error'/, 'an allowed private host is still fetched without redirects');
  assert.match(request, /API_IMPORT_ALLOWED_PRIVATE_HOSTS/);
  // Negative: an error says only the origin and the status, never the answer.
  assert.doesNotMatch(request, /await response\.text\(\)/);
  console.log('  ok - the server methods: gated, rate limited, through the SSRF guard');

  // The wiring of every service.
  const sources = read('models/lib/importSources.js');
  const shape = read('models/lib/importSourceShape.js');
  const parsers = read('models/lib/externalParsers.js');
  const importJs = read('models/import.js');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of KEYS) {
    assert.match(sources, new RegExp(`\\{ key: '${key}', name: '[^']+', \\.\\.\\.JSON_SOURCE, api: true \\}`), key);
    assert.match(shape, new RegExp(`case '${key}'`), key);
    assert.match(parsers, new RegExp(`  ${key}: ${PARSERS[key]},`), key);
    assert.match(importJs, new RegExp(`      case '${key}':`), key);
    assert.ok(fs.existsSync(path.join(ROOT, `models/lib/apiImport/${key}.js`)), `${key} client`);
    assert.ok(fs.existsSync(path.join(ROOT, `tests/${key}ApiImport.test.cjs`)), `${key} test`);
    assert.ok(fs.existsSync(path.join(ROOT, `releases/live-tests/${key}-import.mjs`)), `${key} live test`);
    assert.equal(typeof en[`import-board-instruction-${key}`], 'string', `${key} instruction`);
  }
  assert.match(importJs, /creator = new KanboardCreator\(data, importSource\);/);
  // The page: the form, and secrets cleared once used.
  const page = read('client/components/import/import.js');
  assert.match(read('client/components/import/import.jade'), /if apiImport\s*\n\s*\+apiImportFetch\(service=apiImport\)/);
  assert.match(page, /tpl\.\$\('\.js-api-import-field\[type="password"\]'\)\.val\(''\);/);
  assert.match(read('client/components/import/import.jade'), /type="password" autocomplete="off"/);
  for (const key of ['api-import-desc', 'api-import-list', 'api-import-fetch', 'api-import-fetched', 'api-import-failed', 'api-import-token']) {
    assert.equal(typeof en[key], 'string', key);
  }
  console.log('  ok - six services wired: source, shape, parser, import, client, test, live test, instruction');

  // A shape the fetch does not return is refused before any parser runs.
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  validateImportSourceShape('planka', { planka: { item: { id: '1' }, included: {} } });
  validateImportSourceShape('mstodo', { lists: [] });
  validateImportSourceShape('kanbanflow', { board: {}, tasks: [] });
  validateImportSourceShape('basecamp', { project: {}, cardTables: [] });
  validateImportSourceShape('googlekeep', { notes: [] });
  for (const [key, value] of [['planka', {}], ['mstodo', { value: [] }], ['kanbanflow', { tasks: [] }], ['basecamp', { project: {} }],
    ['googletasks', []], ['googlekeep', { items: [] }]]) {
    assert.throws(() => validateImportSourceShape(key, value), /Invalid/, key);
  }
  console.log('  ok - the import refuses a shape no fetch returns');

  console.log('\napiImport: all tests passed');
})().catch(error => { console.error(error); process.exit(1); });
