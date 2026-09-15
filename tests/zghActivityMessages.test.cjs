'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');
const activityTemplate = fs.readFileSync(
  path.join(root, 'client/components/activities/activities.jade'), 'utf8');
const keys = [
  'act-activity-notify', 'activity-created', 'activity-excluded',
  'activity-moved', 'activity-on', 'activity-removed',
  'activity-sent', 'activity-editComment', 'show-activities',
];

for (const key of keys) {
  assert.match(zgh[key], /[\u2d30-\u2d7f]/u, `${key}: native Tifinagh`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]|\b(?:commentaire|modifié)\b/iu,
    `${key}: Arabic/French seed removed`);
  assert.deepEqual(zgh[key].match(/%s/g) || [], en[key].match(/%s/g) || [],
    `${key}: exact format-token count retained`);
}
assert.equal(zgh['activity-created'].split(' ')[0],
  zgh['activity-customfield-created'].split(' ')[0]);
assert.equal(zgh['activity-excluded'], zgh['activity-removed']);
assert.equal(zgh['activity-moved'].split(' ')[0],
  zgh['act-moveCardToOtherBoard'].split(' ')[0]);
assert.ok(zgh['activity-editComment'].includes(zgh['activity-deleteComment'].split(' ')[1]));
assert.ok(zgh['show-activities'].endsWith(zgh.activities));

// The English "sent" key is used only for a restored card in this UI.
assert.match(activityTemplate,
  /activityType 'restoredCard'[\s\S]*?activityMessage 'activity-sent'/);
assert.equal(zgh['activity-sent'].split(' ')[0], zgh['act-restoredCard'].split(' ')[0]);
assert.match(activityTemplate,
  /activityType 'removeBoardMember'[\s\S]*?activityMessage 'activity-excluded'/);
assert.match(activityTemplate,
  /activityType 'addComment'[\s\S]*?activityMessage 'activity-on'/);
console.log('zghActivityMessages: production activity meaning, native terms and tokens verified');
