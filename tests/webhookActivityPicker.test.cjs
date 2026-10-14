'use strict';

// #2026 / #1377: a webhook activity picker in the UI.
// Run: node tests/webhookActivityPicker.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { groupDescriptions, pickerState, activitiesFor } = require('../models/lib/webhookActivityPicker.js');
const { webhookActivitySelection } = require('../models/lib/editCardWebhook.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Positive: the picked groups are exactly what the activity hook selects on.
const comments = activitiesFor({ groups: ['comments'] });
assert.deepEqual(comments, ['act-addComment', 'act-editComment', 'act-deleteComment']);
assert.ok(webhookActivitySelection('act-addComment').some(d => comments.includes(d)), 'a comment reaches a comments webhook');
assert.ok(!webhookActivitySelection('act-moveCard').some(d => comments.includes(d)), 'a move does not');
assert.deepEqual(pickerState(comments), { all: false, groups: ['comments'] }, 'the form shows what was stored');
assert.deepEqual(pickerState(['all']), { all: true, groups: [] });
assert.deepEqual(pickerState(undefined), { all: true, groups: [] }, 'the default is every activity');
console.log('  ok - picked groups select exactly their activities');

// Negative: nothing picked, or all, is every activity; unknown groups ignored.
assert.deepEqual(activitiesFor({}), ['all'], 'a webhook never silently gets nothing');
assert.deepEqual(activitiesFor({ all: true, groups: ['comments'] }), ['all']);
assert.deepEqual(activitiesFor({ groups: ['nope'] }), ['all']);
assert.deepEqual(groupDescriptions('nope'), []);
assert.deepEqual(pickerState(['act-addComment']).groups, [], 'a partly picked group is not shown as picked');
console.log('  ok - nothing or everything is "all"; unknown groups ignored');

const jade = read('client/components/sidebar/sidebar.jade');
assert.match(jade, /\.webhook-activity-picker[\s\S]{0,200}a\.flex\.js-toggle-webhook-activity-all/);
assert.match(jade, /each webhookActivityGroups\s*\n\s*a\.flex\.js-toggle-webhook-activity-group\(data-group=key\)/);
assert.match(read('client/components/sidebar/sidebar.js'), /\.\.\.\(pickedActivities \? \{ activities: pickedActivities \} : \{\}\),/);
console.log('  ok - the webhook form saves the picked activities');
console.log('\nwebhookActivityPicker: all tests passed');
