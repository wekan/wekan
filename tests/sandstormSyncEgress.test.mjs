// List sync from a Sandstorm grain (the Planned Sandstorm item): a board
// member approves the list's tracker API in the Powerbox, and the periodic job
// fetches through the bridge proxy with that grant. GitHub and Gitea read
// public repositories without a credential; GitLab takes its token as the
// private_token query parameter, since the bridge drops PRIVATE-TOKEN; Jira
// signs in only with an Authorization header and is refused with the reason.
// Run: node tests/sandstormSyncEgress.test.cjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const egress = await import(path.join(ROOT, 'imports/sandstorm/egress.mjs'));

async function fakeProxy(handler) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ method: req.method, url: req.url, headers: req.headers });
    req.resume();
    req.on('end', () => handler(req, res));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const env = { HTTP_PROXY: `http://127.0.0.1:${server.address().port}` };
  return { seen, env, close: () => new Promise(resolve => server.close(resolve)) };
}

test('each tracker is granted as the API root its requests are built under', () => {
  assert.deepEqual(egress.syncApiRoot('github', ''), { root: 'https://api.github.com', reason: null, authentication: null });
  assert.deepEqual(egress.syncApiRoot('gitlab', ''), { root: 'https://gitlab.com/api/v4', reason: null, authentication: null });
  assert.deepEqual(egress.syncApiRoot('gitlab', 'https://git.example.org/'), { root: 'https://git.example.org/api/v4', reason: null, authentication: null });
  assert.deepEqual(egress.syncApiRoot('gitea', 'https://gitea.example.org'), { root: 'https://gitea.example.org/api/v1', reason: null, authentication: null });
  assert.deepEqual(egress.syncApiRoot('forgejo', 'https://codeberg.org'), { root: 'https://codeberg.org/api/v1', reason: null, authentication: null });
});

// Jira signs in only with an Authorization header, which the bridge proxy
// takes for the grant: so its grant asks for Basic authentication, and
// Sandstorm's HTTP driver keeps the e-mail and API token the member enters in
// the Powerbox and adds them to every request (2026-10-15).
test('Jira is granted at its own address, asking the Powerbox for Basic authentication', async () => {
  assert.deepEqual(egress.syncApiRoot('jira', 'https://org.atlassian.net/'),
    { root: 'https://org.atlassian.net', reason: null, authentication: 'basic' });
  assert.deepEqual(egress.syncApiRoot('jira', 'https://jira.example.org/jira'),
    { root: 'https://jira.example.org/jira', reason: null, authentication: 'basic' });
  const bridge = await import('../imports/sandstorm/bridgeClient.mjs');
  const asked = bridge.parseApiSessionDescriptor(bridge.apiSessionDescriptor('https://org.atlassian.net', { authentication: 'basic' }));
  assert.deepEqual([asked.canonicalUrl, asked.authentication], ['https://org.atlassian.net', 'basic']);
  // Negative: the other trackers ask for no Basic sign-in.
  assert.equal(bridge.parseApiSessionDescriptor(bridge.apiSessionDescriptor('https://api.github.com')).authentication, null);
});

test('negative: what cannot be granted is refused with a reason', () => {
  // The credentials go into the Powerbox, never into the saved address.
  assert.equal(egress.syncApiRoot('jira', 'https://me:token@org.atlassian.net').root, null);
  assert.equal(egress.syncApiRoot('trello', '').reason, 'unknown-type');
  for (const url of ['ftp://git.example.org', 'https://user:pw@git.example.org', 'not a url']) {
    assert.equal(egress.syncApiRoot('gitlab', url).root, null, url);
  }
});

test('a grant is looked up by the roots a URL could be under, longest first', () => {
  assert.deepEqual(egress.grantRootCandidates('https://git.example.org/api/v4/projects/a%2Fb/issues?page=2'), [
    'https://git.example.org/api/v4/projects/a%2Fb/issues',
    'https://git.example.org/api/v4/projects/a%2Fb',
    'https://git.example.org/api/v4/projects',
    'https://git.example.org/api/v4',
    'https://git.example.org/api',
    'https://git.example.org',
  ]);
  assert.deepEqual(egress.grantRootCandidates('nonsense'), []);
});

test('a GitLab page goes to the bridge with the grant, the token in the query', async () => {
  const proxy = await fakeProxy((req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('[]'); });
  try {
    const grant = { cap: 'SYNCCAP', canonicalUrl: 'https://git.example.org/api/v4' };
    const url = 'https://git.example.org/api/v4/projects/a%2Fb/issues?per_page=100&private_token=T0K';
    const res = await egress.proxyFetch(url, { grant, headers: { 'PRIVATE-TOKEN': 'dropped-anyway' } }, { env: proxy.env });
    assert.equal(res.status, 200);
    const [req] = proxy.seen;
    assert.equal(req.url, 'http://git.example.org/projects/a%2Fb/issues?per_page=100&private_token=T0K');
    assert.equal(req.headers.authorization, 'Bearer SYNCCAP');
    // Negative: another tracker is not reachable with this grant.
    await assert.rejects(egress.proxyFetch('https://other.example.org/api/v4/x', { grant }, { env: proxy.env }), /not-granted/);
    assert.equal(proxy.seen.length, 1);
  } finally { await proxy.close(); }
});

test('the sync job uses the grant in a grain, and the SSRF guard everywhere else', () => {
  const fetchFile = read('server/lib/listSyncFetch.js');
  assert.match(fetchFile, /response = inGrain\(\) \? await syncFetch\(url,/);
  assert.match(fetchFile, /: operatorAllowedHost\(url\) \? await fetchOperatorHost\(url, headers\) : await fetchSafe\(url,/);
  // The GitLab token moves to the query only in a grain.
  // The issue and notes requests share one decision (the notes fetch of
  // "Comments, labels, state and files" was added beside the issue list), so
  // the guard pins that decision: the query only in a grain, the header only
  // outside one.
  assert.match(fetchFile, /const grain = inGrain\(\);\s*const query = grain && credential\.token \? `&private_token=\$\{encodeURIComponent\(credential\.token\)\}` : '';\s*const headers = grain \? \{\} : \{ 'PRIVATE-TOKEN': credential\.token \};/);
  assert.match(fetchFile, /\/notes\?per_page=100&sort=asc\$\{query\}`, headers\)/);
  const server = read('server/sandstormEgress.js');
  const body = server.slice(server.indexOf('export async function syncFetch('), server.indexOf('async function syncTarget('));
  assert.match(body, /findOneAsync\(syncGrantId\(root\)\)/, 'found by id, never by a search');
  assert.match(body, /throw new Meteor\.Error\('sandstorm-sync-not-granted'/, 'no grant: refused, not sent');
});

test('only a board member who may write grants a list\'s tracker', () => {
  const server = read('server/sandstormEgress.js');
  assert.match(server.slice(server.indexOf('async function syncTarget(')), /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  for (const name of ['sandstormSyncDescriptor', 'sandstormClaimSyncGrant', 'sandstormSyncGrantStatus']) {
    const at = server.indexOf(`async ${name}(`);
    const method = server.slice(at, server.indexOf('\n    },', at));
    assert.match(method, /await syncTarget\(this\.userId, listId\)/, name);
    assert.doesNotMatch(method, /return [^;]*\bcap\b/, name);
  }
  assert.match(read('client/components/lists/listHeader.jade'), /if isSandstorm\n\s+if syncSourceSaved[\s\S]*a\.button\.js-sandstorm-sync-grant/);
  assert.match(read('sandstorm.js'), /Meteor\.callAsync\('sandstormClaimSyncGrant', listId, response\.token\)/);
});
