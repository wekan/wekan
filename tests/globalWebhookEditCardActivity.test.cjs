'use strict';

// Plain-Node source-pattern regression test (no Meteor) for #4912 ("Global
// Webhook act-editCard?" — a request to make the global webhook fire when a
// card is edited, e.g. title/description/due-date changes).
//
// This is already implemented: server/models/cards.js logs an Activities
// entry for title (`a-changedTitle`, #3619), description (`a-changedDescription`,
// #5482) and the timing fields (`a-${dueAt|startAt|endAt|receivedAt}`) whenever
// they change, and server/models/activities.js's Activities.after.insert hook
// turns every such activityType into `act-${activityType}` and dispatches it to
// any enabled integration whose boardId is the card's own board OR the special
// Integrations.Const.GLOBAL_WEBHOOK_ID, filtered by `activities: { $in: [description, 'all'] }`.
// So editing a card's title/description/due date already reaches a globally
// configured webhook today, under those activity names.
//
// Run: node tests/globalWebhookEditCardActivity.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const cardsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'cards.js'),
  'utf8',
);
const activitiesSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'activities.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: cards.js logs an activity for each edit that #4912 asked about --

test('#4912: title changes log activityType a-changedTitle', () => {
  assert.match(cardsSrc, /activityType:\s*'a-changedTitle'/);
});

test('#4912: description changes log activityType a-changedDescription', () => {
  assert.match(cardsSrc, /activityType:\s*'a-changedDescription'/);
});

test('#4912: due/start/end/received date changes log activityType a-${action}', () => {
  assert.match(cardsSrc, /const timingaction = \[\s*'receivedAt',\s*'dueAt',\s*'startAt',\s*'endAt',?\s*\];/);
  assert.match(cardsSrc, /const activityType = `a-\$\{action\}`;/);
});

// --- POSITIVE: activities.js dispatches every logged activity to the global
// webhook (not just per-board integrations) ---------------------------------

test('#4912: outgoing-webhook dispatch is keyed off act-${activityType}, covering every activityType above', () => {
  assert.match(activitiesSrc, /const description = `act-\$\{activity\.activityType\}`;/);
});

test('#4912: integrations are looked up on the card\'s board AND the global webhook id', () => {
  assert.match(
    activitiesSrc,
    /const integrationBoardIds = board\s*\?\s*\[board\._id, Integrations\.Const\.GLOBAL_WEBHOOK_ID\]\s*:\s*\[Integrations\.Const\.GLOBAL_WEBHOOK_ID\];/,
  );
});

test('#4912: integrations are filtered by activities including this description or "all"', () => {
  assert.match(activitiesSrc, /activities:\s*\{\s*\$in:\s*\[description, 'all'\]\s*\}/);
});

test('#4912: matching integrations call the outgoingWebhooks Meteor method', () => {
  assert.match(activitiesSrc, /Meteor\.call\('outgoingWebhooks', integration, description, params,/);
});

console.log('\n' + passed + ' passed');
