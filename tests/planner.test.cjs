#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const {
  normalizePlannerRange,
  normalizeFocusBlock,
  normalizeCardSlot,
  cardIsPlannerRelevant,
  startsWithinDay,
} = require('../models/lib/plannerWork');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('planner accepts only 1, 3, and 7 day ranges', () => {
  assert.equal(normalizePlannerRange(1), 1);
  assert.equal(normalizePlannerRange('7'), 7);
  assert.equal(normalizePlannerRange(30), 3);
});

test('focus blocks validate title/start and clamp duration', () => {
  const start = new Date('2026-08-18T09:00:00.000Z');
  assert.deepEqual(normalizeFocusBlock({
    title: ' Deep work ',
    startsAt: start,
    durationMinutes: 999,
  }), {
    value: { title: 'Deep work', startsAt: start, durationMinutes: 480 },
  });
  assert.equal(normalizeFocusBlock({ title: '', startsAt: start }).error,
    'planner-focus-title-required');
});

test('card slots validate dates without accepting malformed values', () => {
  assert.equal(normalizeCardSlot('not-a-date', 60).error, 'planner-invalid-start');
  assert.equal(
    normalizeCardSlot(new Date('2026-08-18T09:00:00.000Z'), 5).value.durationMinutes,
    15,
  );
});

test('planner relevance is due or assigned to the current user', () => {
  assert.equal(cardIsPlannerRelevant({ assignees: ['u1'] }, 'u1'), true);
  assert.equal(cardIsPlannerRelevant({ dueAt: new Date(), assignees: [] }, 'u1'), true);
  assert.equal(cardIsPlannerRelevant({ assignees: ['u2'] }, 'u1'), false);
});

test('focus blocks are grouped by local day', () => {
  assert.equal(
    startsWithinDay(
      new Date(2026, 7, 17, 13, 0),
      new Date(2026, 7, 17, 0, 0),
    ),
    true,
  );
  assert.equal(
    startsWithinDay(
      new Date(2026, 7, 18, 0, 0),
      new Date(2026, 7, 17, 0, 0),
    ),
    false,
  );
});

test('server, publication, route, and UI keep Planner personal and permission scoped', () => {
  const server = read('server/planner.js');
  const publication = read('server/publications/cards.js');
  const router = read('config/router.js');
  const client = read('client/components/main/planner.js');
  const template = read('client/components/main/planner.jade');
  const styles = read('client/components/main/planner.css');
  const users = read('models/users.js');
  assert.match(server, /board\.isVisibleBy\(\{ _id: userId \}\)/);
  assert.match(server, /profile\.plannerFocusBlocks/);
  assert.match(server, /profile\.plannerCardSlots/);
  assert.doesNotMatch(server, /Cards\.(direct\.)?update/);
  assert.match(publication, /Meteor\.publish\('planner'/);
  assert.match(publication, /isAssignedOnlyMember\(board, userId\)/);
  assert.match(router, /FlowRouter\.route\('\/planner'/);
  assert.match(client, /planner\.assignCardSlot/);
  assert.match(client, /js-planner-schedule-next/);
  assert.match(template, /data-start=slot\.startISO/);
  assert.match(template, /js-planner-schedule-next/);
  assert.match(styles, /#content > \.planner-page\.wrapper\s*\{[\s\S]*?height:\s*auto/);
  assert.match(styles, /#content > \.planner-page\.wrapper\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(client, /plannerCardSlots\?\.\[cardId\] \|\| null/);
  assert.match(client, /plannerFocusBlocks \|\| \[\]/);
  assert.match(
    users,
    /'profile\.plannerCardSlots':\s*\{[\s\S]*?optional:\s*true/,
  );
  assert.match(
    users,
    /'profile\.plannerFocusBlocks':\s*\{[\s\S]*?optional:\s*true/,
  );
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  not ok - ${name}`);
    console.error(error.stack || error);
  }
}
console.log(`\nplanner: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
