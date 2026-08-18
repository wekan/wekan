const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const cards = read('models/cards.js');
const details = read('client/components/cards/cardDetails.js');
const customFields = read('client/components/cards/cardCustomFields.js');
const permission = read('server/lib/linkedCardPermission.js');
const cardPermission = read('server/permissions/cards.js');

function methodBody(name) {
  let start = cards.lastIndexOf(`  ${name}(`);
  if (start === -1) start = cards.lastIndexOf(`  async ${name}(`);
  assert.notStrictEqual(start, -1, `${name} exists`);
  const end = cards.indexOf('\n  },', start);
  return cards.slice(start, end);
}

test('every linked-card content mutator writes the source id', () => {
  const contentMutators = [
    'addDependency', 'setDependencyProps', 'removeDependency', 'setColor',
    'assignMember', 'assignAssignee', 'assignRequester', 'assignAssigner',
    'unassignMember', 'unassignAssignee', 'unassignRequester',
    'unassignAssigner', 'assignCustomField', 'unassignCustomField',
    'toggleShowActivities', 'toggleShowChecklistAtMinicard',
    'toggleHideFinishedChecklist', 'setCustomField', 'setCover', 'unsetCover',
    'setOvertime', 'setSpentTime', 'unsetSpentTime', 'setParentId',
    'setVoteQuestion', 'unsetVote', 'setVoteEnd', 'unsetVoteEnd', 'setVote',
    'setPokerQuestion', 'setPokerEstimation', 'unsetPokerEstimation',
    'unsetPoker', 'setPokerEnd', 'unsetPokerEnd', 'setPoker', 'replayPoker',
  ];
  for (const name of contentMutators) {
    assert.match(methodBody(name), /getRealId\(\)/, `${name} targets source`);
  }

  // Placement belongs to the linked representation on the current board.
  assert.match(methodBody('archive'), /Cards\.updateAsync\(this\._id/);
  assert.match(methodBody('move'), /Cards\.updateAsync\(this\._id/);
});

test('opened-card method calls send the source id', () => {
  assert.doesNotMatch(
    details,
    /Meteor\.call\('cards\.(?:vote|pokerVote|setVote|unsetVote|setPoker|unsetPoker)[^\n]*card\._id/,
  );
  assert.match(details, /Meteor\.call\('cards\.vote', card\.getRealId\(\)/);
  assert.match(customFields,
    /setCardCustomFieldAssigned', card\.getRealId\(\)/);
  assert.match(customFields,
    /setCardCustomFieldCheckbox', tpl\.card\.getRealId\(\)/);
  assert.match(details, /Meteor\.call\('watch', 'card', currentCard\.getRealId\(\)/);
  assert.match(details, /Cards\.update\(currentCard\.getRealId\(\), \{ \$set: \{ showListOnMinicard/);
});

test('current-board write access is delegated only through a real live link', () => {
  assert.match(permission, /linkedId: card\._id/);
  assert.match(permission, /type: 'cardType-linkedCard'/);
  assert.match(permission, /archived: \{ \$ne: true \}/);
  assert.match(permission, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  assert.match(permission, /canUserSeeBoard\(userId, card\.boardId\)/);
  assert.match(permission, /if \(!userId \|\| !card\) return false/);
  assert.match(cardPermission,
    /canEditCardOrLinkedCard\(userId, doc, board\)/);
});
