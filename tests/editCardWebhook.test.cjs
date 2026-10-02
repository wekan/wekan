'use strict';
// #4912: `act-editCard` is an opt-in alternative to the per-field edit events,
// decided on 2026-10-02. One delivery per webhook per activity, always.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  EDIT_CARD_EVENT, webhookActivitySelection, webhookDescriptionFor, webhookParamsFor,
} = require('../models/lib/editCardWebhook');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const hook = activities => ({ activities });

// Positive: a webhook that names act-editCard gets it for title and
// description edits, with the field that changed.
assert.equal(webhookDescriptionFor(hook([EDIT_CARD_EVENT]), 'act-a-changedTitle'), EDIT_CARD_EVENT);
assert.equal(webhookDescriptionFor(hook([EDIT_CARD_EVENT, 'act-createCard']), 'act-a-changedDescription'), EDIT_CARD_EVENT);
assert.deepEqual(webhookParamsFor({ cardId: 'c' }, 'act-a-changedTitle', EDIT_CARD_EVENT), { cardId: 'c', field: 'title' });
assert.deepEqual(webhookParamsFor({ cardId: 'c' }, 'act-a-changedDescription', EDIT_CARD_EVENT),
  { cardId: 'c', field: 'description' });
assert.deepEqual(webhookActivitySelection('act-a-changedTitle'), ['act-a-changedTitle', 'all', EDIT_CARD_EVENT]);

// Negative: nothing changes for a webhook that did not opt in, and an
// existing receiver never gets the edit twice.
assert.equal(webhookDescriptionFor(hook(['all']), 'act-a-changedTitle'), 'act-a-changedTitle');
assert.equal(webhookDescriptionFor(hook(['act-a-changedTitle']), 'act-a-changedTitle'), 'act-a-changedTitle');
assert.equal(webhookDescriptionFor(hook(['all', EDIT_CARD_EVENT]), 'act-a-changedTitle'), 'act-a-changedTitle');
assert.equal(webhookDescriptionFor(hook(['act-a-changedTitle', EDIT_CARD_EVENT]), 'act-a-changedTitle'),
  'act-a-changedTitle');
assert.equal(webhookDescriptionFor(hook(undefined), 'act-a-changedTitle'), 'act-a-changedTitle');
// Other activities never become act-editCard and never select its subscribers.
assert.equal(webhookDescriptionFor(hook([EDIT_CARD_EVENT]), 'act-moveCard'), 'act-moveCard');
assert.deepEqual(webhookActivitySelection('act-moveCard'), ['act-moveCard', 'all']);
const params = { cardId: 'c' };
assert.equal(webhookParamsFor(params, 'act-a-changedTitle', 'act-a-changedTitle'), params);

// Negative, tree-wide: every place that selects or renders activity webhooks
// uses the shared choice, so no path can deliver the per-field event to an
// opted-in webhook, or select webhooks without the opt-in.
const activities = read('server/models/activities.js');
assert.ok(!/activities:\s*\{\s*\$in:\s*\[description,\s*'all'\]/.test(activities),
  'webhook selection must go through webhookActivitySelection');
assert.match(activities, /Meteor\.call\('outgoingWebhooks', integration, delivered, deliveredParams/);
const prepare = read('server/notifications/prepareWebhooks.js');
assert.match(prepare, /webhookDescriptionFor\(integration, context\.description\)/);
assert.ok(!/description:\s*context\.description/.test(prepare), 'the stored plan renders the per-webhook event');
for (const dir of ['server', 'models']) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? (e.name === 'tests' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
  for (const file of walk(path.join(ROOT, dir)).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(file, 'utf8');
    if (/activityWebhookIntegrations\(/.test(src) && !/export async function activityWebhookIntegrations/.test(src)) {
      assert.match(src, /webhookDescriptionFor/, `${path.relative(ROOT, file)} selects webhooks without the act-editCard choice`);
    }
  }
}

// The one-way payload names the field; the event has English text.
assert.match(read('server/notifications/outgoing.js'), /description === 'act-editCard'.*value\.field = params\.field/);
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
assert.match(en['act-editCard'], /__card__/);
console.log('editCardWebhook: ok');
