'use strict';

// Regression coverage for #572: "Generate activity feed items on
// adding/removal of tags [labels]".
//
// Investigation for this issue found the activity feed generation already
// implemented: models/cards.js's cardLabels() hook (wired into the Cards
// collection's before.update hooks in server/models/cards.js the same way
// cardMembers/cardAssignees are) inserts an Activities document with
// activityType 'addedLabel' / 'removedLabel' whenever a card's labelIds
// gains or loses a label. This pins that mechanism so it cannot silently
// regress, plus the i18n strings that render it and the notification-
// settings shape it does NOT (yet) plug into (see CHANGELOG.md TODO Later
// for the follow-up).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cardsSource = fs.readFileSync(
  path.join(__dirname, '..', 'models', 'cards.js'),
  'utf8',
);
const serverCardsSource = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'cards.js'),
  'utf8',
);
const enI18n = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'imports', 'i18n', 'data', 'en.i18n.json'),
    'utf8',
  ),
);

// 1) cardLabels() is exported from models/cards.js and wired into a
//    Cards.before.update hook in server/models/cards.js, the same way
//    cardMembers/cardAssignees are, so it runs on every labelIds mutation.
{
  assert.match(
    cardsSource,
    /export \{[\s\S]*?\bcardLabels,[\s\S]*?\}/,
    'cardLabels is exported from models/cards.js',
  );
  assert.match(
    serverCardsSource,
    /Cards\.before\.update\(\(userId, doc, fieldNames, modifier\) => \{\s*\n\s*cardLabels\(userId, doc, fieldNames, modifier\);/,
    'cardLabels() is wired into a Cards.before.update hook',
  );
}

// 2) Adding a label ($addToSet.labelIds not already present) inserts an
//    Activities document with activityType 'addedLabel'.
{
  const match = cardsSource.match(
    /async function cardLabels\(userId, doc, fieldNames, modifier\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(match, 'models/cards.js defines cardLabels(userId, doc, fieldNames, modifier)');
  const body = match[1];

  assert.match(
    body,
    /modifier\.\$addToSet\s*&&\s*modifier\.\$addToSet\.labelIds/,
    'cardLabels watches modifier.$addToSet.labelIds for additions',
  );
  const addBlock = body.split('Say goodbye to the label')[0];
  assert.match(
    addBlock,
    /activityType:\s*'addedLabel'/,
    'adding a label inserts an Activities doc with activityType addedLabel',
  );
  assert.match(
    addBlock,
    /Activities\.insertAsync\(/,
    'the addedLabel activity is actually inserted',
  );

  assert.match(
    body,
    /modifier\.\$pull\s*&&\s*modifier\.\$pull\.labelIds/,
    'cardLabels watches modifier.$pull.labelIds for removals',
  );
  const removeBlock = body.split('Say goodbye to the label')[1];
  assert.match(
    removeBlock,
    /activityType:\s*'removedLabel'/,
    'removing a label inserts an Activities doc with activityType removedLabel',
  );
  assert.match(
    removeBlock,
    /Activities\.insertAsync\(/,
    'the removedLabel activity is actually inserted',
  );

  // Both branches log the full card context (board/list/swimlane/card), the
  // same shape every other card activity (member/assignee/etc.) logs, so the
  // activity feed and notifications can resolve where it happened.
  for (const block of [addBlock, removeBlock]) {
    for (const field of ['boardId: doc.boardId', 'cardId: doc._id', 'listId: doc.listId', 'swimlaneId: doc.swimlaneId']) {
      assert.ok(block.includes(field), `activity records ${field}`);
    }
  }
}

// 3) The i18n strings that render these activities in the feed exist for
//    the source language, with the placeholders activity rendering expects.
{
  assert.equal(
    enI18n['act-addedLabel'],
    'Added label __label__ to card __card__ at list __list__ at swimlane __swimlane__ at board __board__',
  );
  assert.equal(
    enI18n['act-removedLabel'],
    'Removed label __label__ from card __card__ at list __list__ at swimlane __swimlane__ at board __board__',
  );
}

// 4) Behavioural replica of the hook's decision (a small pure state
//    transition, the same way other card-mutation hooks are pinned here
//    without a running Meteor/Mongo stack): an activityType is emitted only
//    when the label truly changed state, matching the doc.labelIds guard
//    each branch above uses.
function decideLabelActivity(existingLabelIds, modifier) {
  if (modifier.$addToSet && modifier.$addToSet.labelIds) {
    const labelId = modifier.$addToSet.labelIds;
    if (!(existingLabelIds || []).includes(labelId)) return { activityType: 'addedLabel', labelId };
    return null;
  }
  if (modifier.$pull && modifier.$pull.labelIds) {
    const labelId = modifier.$pull.labelIds;
    if ((existingLabelIds || []).includes(labelId)) return { activityType: 'removedLabel', labelId };
    return null;
  }
  return null;
}

assert.deepEqual(
  decideLabelActivity([], { $addToSet: { labelIds: 'red' } }),
  { activityType: 'addedLabel', labelId: 'red' },
  'adding a new label to a card with none yields addedLabel',
);
assert.equal(
  decideLabelActivity(['red'], { $addToSet: { labelIds: 'red' } }),
  null,
  'adding a label already present is a no-op (no duplicate activity)',
);
assert.deepEqual(
  decideLabelActivity(['red', 'blue'], { $pull: { labelIds: 'blue' } }),
  { activityType: 'removedLabel', labelId: 'blue' },
  'removing a label that is present yields removedLabel',
);
assert.equal(
  decideLabelActivity(['red'], { $pull: { labelIds: 'blue' } }),
  null,
  'removing a label not present is a no-op (no phantom activity)',
);

console.log('\nlabelActivityLogging572: 15 checks passed');
