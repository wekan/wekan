const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const cardDetails = fs.readFileSync('client/components/cards/cardDetails.js', 'utf8');
const labels = fs.readFileSync('client/components/cards/labels.js', 'utf8');
const cards = fs.readFileSync('models/cards.js', 'utf8');
const ldap = fs.readFileSync('packages/wekan-ldap/server/sync.js', 'utf8');
const ldapClient = fs.readFileSync('packages/wekan-ldap/server/ldap.js', 'utf8');

test('card list chooser includes board-wide lists in every swimlane', () => {
  const helper = cardDetails.slice(
    cardDetails.indexOf('  currentSwimlaneListsSorted() {'),
    cardDetails.indexOf('  isCurrentListId(', cardDetails.indexOf('  currentSwimlaneListsSorted() {')),
  );
  assert.match(helper, /selector\.swimlaneId = \{ \$in: \[swimlaneId, null, ''\] \}/);
  assert.doesNotMatch(helper, /getDefaultSwimline/);
});

test('label picker retains a visible-board fallback', () => {
  assert.match(labels, /const getCardLabelBoard = card =>[\s\S]*getRealBoard\?\.\(\) \|\| card\?\.board\?\.\(\) \|\| Utils\.getCurrentBoard\(\)/);
  assert.match(cards, /return ReactiveCache\.getBoard\(card\.boardId\) \|\| this\.board\(\)/);
});

test('adding a label to a linked card uses the popup card and source board', () => {
  assert.match(labels, /const card = templateInstance\.data;[\s\S]*await card\.toggleLabel\(labelId\)/);
  assert.match(labels, /defaultColor\(\)[\s\S]*getCardLabelBoard\(Template\.currentData\(\)\)/);
  assert.match(labels, /submit \.create-label[\s\S]*getCardLabelBoard\(templateInstance\.data\)/);
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

test('LDAP restricted searches always request the configured display name', () => {
  const helper = ldapClient.slice(
    ldapClient.indexOf('  getUserAttributes() {'),
    ldapClient.indexOf('  async searchAll(', ldapClient.indexOf('  getUserAttributes() {')),
  );
  const search = ldapClient.slice(
    ldapClient.indexOf('  async searchUsers('),
    ldapClient.indexOf('  async getUserById(', ldapClient.indexOf('  async searchUsers(')),
  );

  assert.match(helper, /'LDAP_FULLNAME_FIELD'/);
  assert.match(helper, /matchAll\(\/#\{\(\[\^}\]\+\)\}\//);
  assert.match(helper, /item\.toLowerCase\(\) === field\.toLowerCase\(\)/);
  assert.match(search, /const attributes = this\.getUserAttributes\(\)/);
  assert.doesNotMatch(search, /User_Attributes\.split\(','\)/);
});
