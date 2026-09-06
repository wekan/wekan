'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CARD_ACTIVITY_DESCRIPTORS,
  cardActivityDescriptor,
} = require('../models/lib/cardActivityDescription');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('card activity descriptions preserve the Jade translation contracts', () => {
  assert.deepEqual(cardActivityDescriptor({ activityType: 'moveCard' }, {
    card: 'Card', oldList: 'Todo', list: 'Done',
  }), {
    key: 'activity-moved', args: ['Card', 'Todo', 'Done'], activityType: 'moveCard',
  });
  assert.deepEqual(cardActivityDescriptor({ activityType: 'checkedItem' }, {
    item: 'Review', checklist: 'Release', card: 'this card',
  }).args, ['Review', 'Release', 'this card']);
  assert.ok(Object.keys(CARD_ACTIVITY_DESCRIPTORS).length >= 30);
});

test('missing activity relations remain readable and cannot become markup', () => {
  const descriptor = cardActivityDescriptor({
    activityType: '<img src=x onerror=alert(1)>', value: '  unsafe\n value  ',
  });
  assert.equal(descriptor.key, '<img src=x onerror=alert(1)>');
  assert.deepEqual(descriptor.args, ['unsafe value']);
  // Rendering is through the shared table component, which escapes both the
  // fallback key and arguments. The descriptor itself deliberately returns
  // text, never HTML.
  assert.equal(typeof descriptor.activityType, 'string');
});

test('HTML5 accessibility and HTML4 visible history use one descriptor', () => {
  const client = read('client/components/activities/activities.js');
  const jade = read('client/components/activities/activities.jade');
  const page = read('server/lib/legacyHtml4Pages.js');
  const publication = read('server/publications/activities.js');
  assert.match(client, /cardActivityDescriptor\(activity/);
  assert.match(jade, /aria-label=activityDescription/);
  assert.match(page, /Activities\.find\(\{ cardId: contentCardId \}/);
  assert.match(page, /hideBoardActivitiesOnAllBoards !== true/);
  assert.match(page, /allowIsBoardAdmin\(userId, board\)/);
  assert.match(page, /activityBoardVisible/);
  assert.match(page, /sort: \{ createdAt: -1 \}, limit: 50/);
  assert.match(page, /cardActivityDescriptor\(activity/);
  assert.match(publication, /board\.isVisibleBy\(userForVisibility\)/);
});
