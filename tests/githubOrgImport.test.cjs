'use strict';

// Guard: the GitHub organization import - every repository as its own board
// in Board View / Version Control (server/githubOrgImport.js,
// models/lib/githubOrgImport.js).
// Run: node tests/githubOrgImport.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const o = require('../models/lib/githubOrgImport.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('the owner from a name or a GitHub address', () => {
  assert.strictEqual(o.ownerFrom('https://github.com/wekan'), 'wekan');
  assert.strictEqual(o.ownerFrom('github.com/wekan/'), 'wekan');
  assert.strictEqual(o.ownerFrom(' wekan '), 'wekan');
  // negative: not a GitHub login, another site, a path
  for (const bad of ['', '-wekan', 'we kan', 'https://evil.example/wekan', 'github.com/wekan/wekan', 'x'.repeat(40), '../etc']) {
    assert.strictEqual(o.ownerFrom(bad), null, bad);
  }
});

test('options: issues always, known parts only, repository names checked', () => {
  assert.deepStrictEqual(o.cleanOrgImport({ owner: 'wekan', parts: ['wiki', 'nope'] }).parts, ['issues', 'wiki']);
  assert.deepStrictEqual(o.cleanOrgImport({ owner: 'wekan' }).parts, o.DEFAULT_PARTS);
  assert.ok(!o.DEFAULT_PARTS.includes('releaseFiles'), 'release files are large: chosen, not default');
  assert.deepStrictEqual(o.cleanOrgImport({ owner: 'wekan', repos: ['wekan', '../x', 'a b'] }).repos, ['wekan']);
  assert.throws(() => o.cleanOrgImport({ owner: '' }), /owner-invalid/);
  assert.throws(() => o.cleanOrgImport({ owner: 'wekan', repos: ['../x'] }), /no-repos/);
});

test('repositories: forks left out unless chosen, other owners never', () => {
  const list = [
    { name: 'wekan', owner: { login: 'wekan' }, has_wiki: true },
    { name: 'fork', owner: { login: 'wekan' }, fork: true },
    { name: 'old', owner: { login: 'wekan' }, archived: true },
    { name: 'theirs', owner: { login: 'someone-else' } },
    { name: '../bad', owner: { login: 'wekan' } },
  ];
  assert.deepStrictEqual(o.selectRepos(list, o.cleanOrgImport({ owner: 'wekan' })).map(r => r.name), ['old', 'wekan']);
  assert.deepStrictEqual(o.selectRepos(list, o.cleanOrgImport({ owner: 'WeKan', includeForks: true })).map(r => r.name), ['fork', 'old', 'wekan']);
  assert.deepStrictEqual(o.selectRepos(list, o.cleanOrgImport({ owner: 'wekan', repos: ['FORK'] })).map(r => r.name), ['fork']);
});

test('releases as cards', () => {
  const [r] = o.releaseCards([{ tag_name: 'v1.0', name: 'First', body: 'Notes', published_at: '2026-01-01T00:00:00Z', prerelease: true,
    html_url: 'https://github.com/o/r/releases/tag/v1.0', assets: [{ name: 'a.zip', browser_download_url: 'https://github.com/o/r/releases/download/v1.0/a.zip', size: 5 }, { name: 'x', browser_download_url: 'ftp://x' }] }]);
  assert.strictEqual(r.title, 'v1.0 First (pre-release)');
  assert.match(r.description, /^Notes\n\nSource: https:\/\/github\.com\/o\/r\/releases\/tag\/v1\.0$/);
  assert.deepStrictEqual(r.assets.map(a => a.name), ['a.zip']);
});

const server = read('server/githubOrgImport.js');
const wiki = read('server/lib/githubWiki.js');

test('it imports through importBoard, as the person who started it', () => {
  assert.match(server, /Meteor\.callAsync\('importBoard', raw, \{\}, 'github', null\)/);
  assert.match(server, /DDP\._CurrentMethodInvocation\.withValue\(\{ userId, isSimulation: false/);
  assert.match(server, /if \(!board \|\| !board\.hasAdmin\(userId\)\) throw/);
  assert.match(server, /await assertImportEnabled\(\);/);
});

test('negative: the token is never stored', () => {
  assert.doesNotMatch(server, /insertAsync\(\{[^}]*token/);
  assert.match(server, /const tokens = new Map\(\); \/\/ jobId -> token, never persisted/);
  assert.match(read('models/githubImportJobs.js'), /deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\)/);
});

test('negative: every outbound request goes through the SSRF guard', () => {
  assert.doesNotMatch(server + wiki, /\bfetch\(|require\('isomorphic-git\/http/);
  assert.match(wiki, /fetchSafe\(url, \{/);
  assert.match(wiki, /if \(new URL\(url\)\.origin !== origin\) throw/);
  assert.match(server, /fetchImportedAttachment\(asset\.url\)/);
});

test('the boards open in Version Control; wiki history is dated history', () => {
  assert.match(server, /defaultBoardViewModifier\(board, VCS_VIEW, 'private'\)/);
  assert.match(wiki, /prepareCardFieldHistory\(\{[\s\S]*?createdAt: new Date\(edit\.at\), fields: SYNC_FIELDS/);
  assert.match(wiki, /persistSyncFieldHistory\(\{ history: ChangeHistory, plan/);
  assert.match(wiki, /fs\.promises\.rm\(dir, \{ recursive: true, force: true \}\)/);
});

test('UI: the GitHub import page has the organization block', () => {
  assert.match(read('client/components/import/import.jade'), /if isGithubImport\n\s+hr\n\s+\+importGithubOrg/);
  assert.match(read('client/components/import/import.js'), /Meteor\.call\('githubOrgStartImport', input/);
});

console.log(`# ${passed} passed`);
