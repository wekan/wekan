'use strict';

// Guard: Board Settings / Bots - external runners a board admin hands cards
// to, with no rights in WeKan of their own (models/lib/botRuns.js,
// server/bots.js, client/components/rules/rulesBots.*).
// Run: node tests/botRuns.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const r = require('../models/lib/botRuns.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('what a runner reports is cleaned and bounded', () => {
  const c = r.cleanRunUpdate({ status: 'awaiting_input', text: 'x'.repeat(5000), tool: 'Bash', question: 'Which?',
    options: [{ value: 'a', label: 'Option A' }, 'b', { nope: 1 }], tokens: '120', costUsd: 0.5, evil: true });
  assert.strictEqual(c.update.status, 'awaiting_input');
  assert.strictEqual(c.event.text.length, 4000);
  assert.deepStrictEqual(c.update.options, [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'b' }]);
  assert.deepStrictEqual([c.update.tokens, c.update.costUsd], [120, 0.5]);
  assert.ok(!('evil' in c.update));
  assert.match(r.cleanRunUpdate({ status: 'hacked' }).error, /status/);
  assert.match(r.cleanRunUpdate({ costUsd: -1 }).error, /costUsd/);
  assert.match(r.cleanRunUpdate({ options: 'a' }).error, /options/);
});

test('a question is cleared when the run moves on; a finished run stays finished', () => {
  const run = { _id: 'r1', status: 'awaiting_input', question: 'Q', options: [{ value: 'a' }], events: [] };
  const next = r.applyRunUpdate(run, r.cleanRunUpdate({ status: 'running', tool: 'Edit' }), new Date('2026-10-14T10:00:00Z')).run;
  assert.deepStrictEqual([next.status, next.question, next.options, next.events.length], ['running', null, [], 1]);
  const done = r.applyRunUpdate(next, r.cleanRunUpdate({ status: 'done' })).run;
  assert.ok(done.finishedAt);
  // negative: a finished run can not be revived by a late report
  assert.match(r.applyRunUpdate(done, r.cleanRunUpdate({ status: 'running' })).error, /done/);
  let many = run;
  for (let i = 0; i < 80; i += 1) many = r.applyRunUpdate(many, r.cleanRunUpdate({ text: `e${i}` })).run;
  assert.strictEqual(many.events.length, r.MAX_EVENTS);
});

test('the dispatch carries the card and where to report - nothing else of the board', () => {
  const body = r.dispatchBody({ run: { _id: 'r1' }, bot: { _id: 'i1', title: 'Coder' },
    board: { _id: 'B', title: 'Dev', key: 'DEV', slug: 'dev', labels: [{ _id: 'L', name: 'bug' }], members: [{ userId: 'secret' }] },
    card: { _id: 'C', cardNumber: 7, title: 'Fix', description: 'd', labelIds: ['L'] }, list: { _id: 'LI', title: 'Todo' },
    comments: [{ _id: 'c1', text: 'hi' }], baseUrl: 'https://wekan.example' });
  assert.strictEqual(body.report, 'https://wekan.example/api/boards/B/cards/C/bot-runs/r1');
  assert.deepStrictEqual(body.card.labels, ['bug']);
  assert.doesNotMatch(JSON.stringify(body), /secret|token|password/i, 'no member list, no credential');
});

const server = read('server/bots.js');

test('a bot has no rights of its own', () => {
  // WeKan only SENDS to it, through the outgoing-webhook queue (SSRF guard, signing).
  assert.match(server, /require\('\/server\/notifications\/webhookQueue'\)\.webhookOutbox/);
  assert.doesNotMatch(server, /\bfetch\(|fetchSafe/);
  // Its report needs the same board write access as every REST card write.
  assert.match(server, /await Authentication\.checkBoardWriteAccess\(req\.userId, boardId\);\s*const run = await BotRuns\.findOneAsync\(\{ _id: runId, boardId, cardId \}\);/);
  // Its own run only: the run must be on that board and card.
  assert.match(server, /BotRuns\.updateAsync\(\{ _id: runId, boardId, cardId \}/);
  // Handing over and answering are board admins'; a comment is the person's own.
  assert.match(server, /if \(!this\.userId \|\| !allowIsBoardAdmin\(this\.userId, board\)\) throw new Meteor\.Error\('not-authorized'\);\s*return dispatchToBot/);
  assert.match(server, /if \(!card \|\| !\(await canCommentInList\(userId, board, card\.listId\)\)\) throw/);
  // A bot of another board can never be handed a card.
  assert.match(server, /Integrations\.findOneAsync\(\{ _id: integrationId, boardId: card\.boardId \}\)/);
  assert.match(server, /if \(!this\.userId \|\| !allowIsBoardAdmin\(this\.userId, board\)\) return this\.ready\(\);/);
});

test('negative: a bot gets dispatches only, never board activity or reminders', () => {
  const activities = read('server/models/activities.js');
  const at = activities.indexOf('export async function activityWebhookIntegrations');
  const body = activities.slice(at, at + 1600);
  assert.strictEqual((body.match(/bot: \{ \$ne: true \}/g) || []).length, 2, 'both selections leave bots out');
  assert.strictEqual(r.BOT_ACTIVITY, 'bot-dispatch');
  assert.match(read('client/components/rules/rulesBots.js'), /activities: \[runs\.BOT_ACTIVITY\], bot: true/);
});

test('UI: Board Settings / Bots below Workflow, on the admin-only Rules page; drag and drop moves the card', () => {
  const sidebar = read('client/components/sidebar/sidebar.jade');
  assert.ok(sidebar.indexOf('js-open-rules-workflow-view') < sidebar.indexOf('js-open-rules-bots-view'));
  assert.ok(sidebar.indexOf('js-open-rules-bots-view') < sidebar.indexOf('js-open-rules-blocks-view'));
  assert.match(read('client/components/rules/rulesMain.jade'), /else if isBotsView\n\s+\+rulesBots/);
  assert.match(read('client/components/rules/rulesBots.js'), /await card\.move\(card\.boardId, card\.swimlaneId, listId,/);
  assert.match(read('server/rulesHelper.js'), /if \(action\.actionType === 'dispatchBot' && action\.integrationId\)/);
  // negative: Bots is not a board view anybody - or the public - could open
  assert.doesNotMatch(read('models/lib/boardViewSettings.js'), /bots/i);
});

console.log(`# ${passed} passed`);
