'use strict';

// Jira List Sync from a Sandstorm grain (2026-10-15): Jira signs in only with
// an Authorization header, which the bridge proxy takes for the grant, so the
// grant keeps the sign-in instead - Sandstorm's HTTP driver stores Basic or
// Bearer credentials the member enters in the Powerbox and adds them to every
// request. tests/sandstormSyncEgress.test.mjs covers the root and the
// descriptor; this pins the server and the page around them.
// Run: node tests/sandstormJiraGrant.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const egressServer = read('server/sandstormEgress.js');
assert.match(egressServer, /const \{ root, authentication \} = api\.syncApiRoot\(source\.type, source\.url\);/);
assert.match(egressServer, /apiSessionDescriptor\(root, \{ authentication \}\)/, 'the Powerbox is asked for Basic sign-in');
// Negative: Jira is no longer refused for its header.
assert.doesNotMatch(egressServer, /jira-basic-auth|Jira signs in with an Authorization header, which a Sandstorm grain cannot send/);
assert.doesNotMatch(read('imports/sandstorm/egress.mjs'), /jira-basic-auth/);
console.log('  ok - a Jira list asks the Powerbox for a grant that keeps the sign-in');

// The fetcher sends no Authorization in a grain (the proxy owns it), and a
// Jira source in a grain needs no token of WeKan's own: a marker says so.
const fetchSrc = read('server/lib/listSyncFetch.js');
assert.match(fetchSrc, /const headers = inGrain\(\) \? \{ Accept: 'application\/json' \} : \{ Authorization: `Basic \$\{auth\}`, Accept: 'application\/json' \};/);
const methods = read('server/methods/listSync.js');
assert.match(methods, /source\.type === 'jira' && Meteor\.settings\?\.public\?\.sandstorm\) \{[\s\S]{0,200}credential = \{ token: SANDSTORM_GRANT_HOLDS_SIGN_IN, username: '', sourceKey \};/);
// Negative: only Jira, only in a grain - GitLab sends its token in the query,
// so a marker would reach GitLab.
assert.doesNotMatch(methods, /source\.type !== 'jira' && Meteor\.settings\?\.public\?\.sandstorm/);
console.log('  ok - no Authorization sent from a grain, and no WeKan token needed for Jira there');

// The page tells the member what to enter in the Powerbox.
assert.match(read('client/components/lists/listHeader.jade'), /if isCurrentSyncType 'jira'\n\s*p\.quiet \{\{_ 'sandstorm-sync-jira-hint'\}\}/);
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
assert.match(en['sandstorm-sync-jira-hint'], /https:\/\/EMAIL:API-TOKEN@your-site\.atlassian\.net/);
assert.match(en['sandstorm-sync-jira-hint'], /%40/);
assert.match(read('docs/Platforms/FOSS/Container/Sandstorm/Powerbox-External-APIs.md'), /\| Jira \| Cloud and Server: the grant keeps the sign-in/);
console.log('  ok - the List Sync popup and the docs say how');

console.log('\nsandstormJiraGrant: all tests passed');
