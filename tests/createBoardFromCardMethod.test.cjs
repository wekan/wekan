const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// #4495: create a brand-new board from an EXISTING card, and link that same
// card to it, in one step, from the card's own detail view - without first
// creating the board separately and then using the existing "Link to board"
// action (client/components/lists/listBody.js's Template.linkCardPopup,
// `.js-link-board`, tested by tests/linkCardPopup.test.js) to find it.
//
// These are source-reading tests (no Meteor/DB), mirroring the style of
// tests/createLinkedCardMethod.test.cjs: they pin the exact fields the new
// server method sets on the existing card, and prove those fields are BYTE-
// IDENTICAL in meaning to what the pre-existing "link to a whole board" flow
// sets (`type: 'cardType-linkedBoard'`, `linkedId: <boardId>`), by reading
// that flow's own source rather than guessing.

const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server/models/cards.js'), 'utf8');
const listBody = fs.readFileSync(
  path.join(root, 'client/components/lists/listBody.js'),
  'utf8',
);
const cardDetailsJs = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDetails.js'),
  'utf8',
);
const cardDetailsJade = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDetails.jade'),
  'utf8',
);
const en = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);

function slice(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  assert.ok(start !== -1, `marker not found: ${startMarker}`);
  const end = endMarker ? src.indexOf(endMarker, start) : src.length;
  return src.slice(start, end === -1 ? src.length : end);
}

// ----- the pre-existing "link to a whole board" fields, read from source ---

test('#4495 baseline: the existing "link to board" flow sets type cardType-linkedBoard + linkedId', () => {
  const method = slice(
    listBody,
    "async 'click .js-link-board'",
    'Template.searchElementPopup',
  );
  assert.match(method, /type:\s*'cardType-linkedBoard'/);
  assert.match(method, /linkedId:\s*impBoardId/);
});

// ----- the new server method sets the SAME two fields, nothing else --------

test('#4495: createBoardFromCard sets the same type/linkedId fields on the existing card', () => {
  const method = slice(
    server,
    'async createBoardFromCard(',
    '  // #6608:',
  );
  assert.match(method, /check\(cardId, String\)/);
  assert.match(method, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(method, /await Cards\.updateAsync\(cardId, \{/);
  assert.match(method, /type:\s*'cardType-linkedBoard'/);
  assert.match(method, /linkedId:\s*boardId/);
  // The card update must not touch anything else - it is a conversion of the
  // same card document, not a mutation of its content.
  const updateCall = slice(method, 'await Cards.updateAsync(cardId, {', '});');
  assert.doesNotMatch(updateCall, /title:/);
  assert.doesNotMatch(updateCall, /description:/);
});

test('#4495: createBoardFromCard refuses to convert a card that is already a link, or a template', () => {
  const method = slice(server, 'async createBoardFromCard(', '  // #6608:');
  for (const type of ['template-card', 'cardType-linkedCard', 'cardType-linkedBoard']) {
    assert.ok(method.includes(`card.type === '${type}'`));
  }
  assert.match(method, /throw new Meteor\.Error\('invalid-linked-card'\)/);
});

test('#4495: createBoardFromCard checks write access on the card\'s own board before creating anything', () => {
  const method = slice(server, 'async createBoardFromCard(', '  // #6608:');
  assert.match(method, /allowIsBoardMemberWithWriteAccess\(this\.userId, sourceBoard\)/);
  // The permission check happens before the board is created.
  const permissionIdx = method.indexOf('allowIsBoardMemberWithWriteAccess');
  const insertIdx = method.indexOf('Boards.insertAsync');
  assert.ok(permissionIdx < insertIdx, 'must check permission before creating the board');
});

test('#4495: createBoardFromCard creates a board + default swimlane the same way board creation normally does', () => {
  const method = slice(server, 'async createBoardFromCard(', '  // #6608:');
  assert.match(method, /await Boards\.insertAsync\(/);
  assert.match(method, /await Swimlanes\.insertAsync\(/);
  assert.match(method, /isAdmin:\s*true/);
});

test('#4495: the new board title defaults to the card title when no title is given', () => {
  const method = slice(server, 'async createBoardFromCard(', '  // #6608:');
  assert.match(method, /const boardTitle = \(title && title\.trim\(\)\) \|\| card\.title \|\| ''/);
});

// ----- client wiring: a NEW, separate action beside the existing ones ------

test('#4495: a new, separate hamburger action opens the create-board-from-card popup', () => {
  assert.match(
    cardDetailsJade,
    /a\.js-create-board-from-card[\s\S]{0,80}\{\{_ 'linkCardToNewBoard'\}\}/,
  );
  assert.match(
    cardDetailsJs,
    /'click \.js-create-board-from-card': Popup\.open\('createBoardFromCard'\)/,
  );
});

test('#4495 negative: the new action does not touch the existing "Link to board" (.js-link) popup wiring', () => {
  assert.match(listBody, /'click \.js-link': Popup\.open\('linkCard'\)/);
  assert.doesNotMatch(listBody, /createBoardFromCard/);
});

test('#4495: the popup calls the new method and defaults its title field to the card title', () => {
  const events = slice(
    cardDetailsJs,
    'Template.createBoardFromCardPopup.events',
    'Template.cardStartVotingPopup.onCreated',
  );
  assert.match(events, /Meteor\.call\('createBoardFromCard', card\._id, title/);

  const helpers = slice(
    cardDetailsJs,
    'Template.createBoardFromCardPopup.helpers',
    'Template.createBoardFromCardPopup.events',
  );
  assert.match(helpers, /cardTitle\(\)/);
});

// ----- i18n: the new key exists in English and is not the "not fixed" ------

test('#4495: the i18n key exists with a non-empty English string', () => {
  assert.strictEqual(typeof en.linkCardToNewBoard, 'string');
  assert.ok(en.linkCardToNewBoard.length > 0);
});
