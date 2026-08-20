const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const cardDetails = fs.readFileSync('client/components/cards/cardDetails.js', 'utf8');
const labels = fs.readFileSync('client/components/cards/labels.js', 'utf8');
const cards = fs.readFileSync('models/cards.js', 'utf8');
const ldap = fs.readFileSync('packages/wekan-ldap/server/sync.js', 'utf8');

test('card list chooser includes board-wide lists in every swimlane', () => {
  const helper = cardDetails.slice(
    cardDetails.indexOf('  currentSwimlaneListsSorted() {'),
    cardDetails.indexOf('  isCurrentListId(', cardDetails.indexOf('  currentSwimlaneListsSorted() {')),
  );
  assert.match(helper, /selector\.swimlaneId = \{ \$in: \[swimlaneId, null, ''\] \}/);
  assert.doesNotMatch(helper, /getDefaultSwimline/);
});

test('label picker retains a visible-board fallback', () => {
  assert.match(labels, /getRealBoard\?\.\(\) \|\| card\?\.board\?\.\(\) \|\| Utils\.getCurrentBoard\(\)/);
  assert.match(cards, /return ReactiveCache\.getBoard\(card\.boardId\) \|\| this\.board\(\)/);
});

test('move activity tolerates a list or swimlane cache miss', () => {
  assert.match(cards, /listName: list \? list\.title : ''/);
  assert.match(cards, /swimlaneName: swimlane \? swimlane\.title : ''/);
});

test('LDAP full names are normalized to text', () => {
  const helper = ldap.slice(ldap.indexOf('export function getLdapFullname'), ldap.indexOf('export function getLdapUserUniqueID'));
  assert.match(helper, /Array\.isArray\(value\) \? value\[0\] : value/);
  assert.match(helper, /Buffer\.isBuffer\(scalar\) \? scalar\.toString\('utf8'\) : String\(scalar\)/);
});
