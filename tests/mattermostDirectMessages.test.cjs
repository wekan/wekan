'use strict';

// #1297: a webhook option to also send a Mattermost direct message to each
// member and assignee of the card.
// Run: node tests/mattermostDirectMessages.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MAX_MESSAGES, directMessageUsernames, directMessageBodies } = require('../models/lib/mattermostDirectMessages.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const names = { u1: 'alice', u2: 'bob', u3: 'carol', u4: 'bad name!' };
const usernameOf = id => names[id];

// Positive.
assert.deepEqual(directMessageUsernames({ members: ['u1', 'u2'], assignees: ['u2', 'u3'], actorId: 'x', usernameOf }),
  ['alice', 'bob', 'carol'], 'members and assignees, once each');
const body = JSON.stringify({ text: 'alice moved card "X"', username: 'WeKan' });
assert.deepEqual(directMessageBodies(body, ['bob']).map(b => JSON.parse(b)),
  [{ text: 'alice moved card "X"', username: 'WeKan', channel: '@bob' }], 'the webhook\'s own message, to @bob');
console.log('  ok - each member and assignee gets the message as @username');

// Negative.
assert.deepEqual(directMessageUsernames({ members: ['u1', 'u2'], actorId: 'u1', usernameOf }), ['bob'], 'never the actor');
assert.deepEqual(directMessageUsernames({ members: ['u4', 'nobody', null], usernameOf }), [], 'invalid or unknown names skipped');
assert.equal(directMessageUsernames({ members: Array.from({ length: 80 }, (_, i) => `m${i}`), usernameOf: id => id }).length, MAX_MESSAGES);
assert.deepEqual(directMessageBodies('not json', ['bob']), []);
assert.deepEqual(directMessageBodies('[1,2]', ['bob']), []);
assert.deepEqual(directMessageBodies(body, []), []);
console.log('  ok - not the actor, no bad names, bounded, no message without a body');

// Server: off unless ticked, one-way only, through webhookFetch, best effort.
const out = read('server/notifications/outgoing.js');
assert.match(out, /if \(!is2way && storedIntegration\.mattermostDirectMessages === true && typeof params\.cardId === 'string'\) \{\s*sendMattermostDirectMessages\(storedIntegration, prepared, params\)\.catch\(\(\) => \{\}\);/);
const fn = out.slice(out.indexOf('async function sendMattermostDirectMessages('), out.indexOf('Meteor.methods({'));
assert.match(fn, /if \(!card \|\| \(card\.boardId !== integration\.boardId && integration\.boardId !== Integrations\.Const\.GLOBAL_WEBHOOK_ID\)\) return;/,
  'a board webhook only for its own board\'s cards');
assert.match(fn, /await webhookFetch\(prepared\.url,/);
assert.doesNotMatch(fn, /(^|[^A-Za-z])fetch\(/);
assert.match(read('models/integrations.js'), /mattermostDirectMessages: \{[\s\S]{0,300}type: Boolean,\s*optional: true,/);
const jade = read('client/components/sidebar/sidebar.jade');
assert.match(jade, /a\.flex\.js-toggle-webhook-mattermost-dm\(title="\{\{_ 'webhook-mattermost-dm-desc'\}\}"\)\s*\n\s*\.materialCheckBox\(class="\{\{#if mattermostDirectMessages\}\}is-checked\{\{\/if\}\}"\)/);
assert.match(read('client/components/sidebar/sidebar.js'), /mattermostDirectMessages: dmToggle\.find\(MCB\)\.hasClass\(CKCLS\)/);
console.log('  ok - off unless ticked, one-way webhooks, sent through the SSRF guard');

console.log('\nmattermostDirectMessages: all tests passed');
