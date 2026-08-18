const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server/models/cards.js'), 'utf8');
const client = fs.readFileSync(
  path.join(root, 'client/components/lists/listBody.js'),
  'utf8',
);

test('#6613: card-link confirmation awaits an acknowledged server method', () => {
  assert.match(client, /await Meteor\.callAsync\(\s*'createLinkedCard'/);
  assert.match(client, /Filter\.addException\(_id\);\s*Popup\.back\(\)/);
  assert.doesNotMatch(
    client.slice(client.indexOf("async 'click .js-done'"), client.indexOf("async 'click .js-link-board'")),
    /type:\s*'cardType-linkedCard'[\s\S]*Cards\.insert/,
  );
});

test('#6613 follow-up: link position survives asynchronous confirmation', () => {
  const created = client.slice(
    client.indexOf('Template.linkCardPopup.onCreated'),
    client.indexOf('Template.linkCardPopup.helpers'),
  );
  assert.match(created, /this\.position = Template\.currentData\(\)\?\.position/);
  assert.match(created, /if \(this\.position === 'top'\)/);
  assert.match(created, /else if \(this\.position === 'bottom'\)/);
  assert.doesNotMatch(
    created.slice(created.indexOf('this.getSortIndex')),
    /Template\.currentData\(/,
    'getSortIndex can run after await only when it no longer needs a Blaze view',
  );
});

test('#6613: the server validates every link coordinate before inserting', () => {
  const method = server.slice(
    server.indexOf('async createLinkedCard('),
    server.indexOf('// #6608:'),
  );
  for (const argument of ['sourceCardId', 'boardId', 'swimlaneId', 'listId']) {
    assert.match(method, new RegExp(`check\\(${argument}, String\\)`));
  }
  assert.match(method, /check\(sort, Number\)/);
  assert.match(method, /allowIsBoardMember\(this\.userId/);
  assert.match(method, /allowIsBoardMemberWithWriteAccess\(this\.userId/);
  assert.match(method, /destinationList\.boardId !== boardId/);
  assert.match(method, /destinationSwimlane\.boardId !== boardId/);
  assert.match(method, /await Cards\.insertAsync\(/);
});

test('#6613 negative: same-board, template, and link-pointer targets are refused', () => {
  const method = server.slice(
    server.indexOf('async createLinkedCard('),
    server.indexOf('// #6608:'),
  );
  assert.match(method, /sourceCard\.boardId === boardId/);
  assert.match(method, /sourceCard\.archived === true/);
  for (const type of ['template-card', 'cardType-linkedCard', 'cardType-linkedBoard']) {
    assert.ok(method.includes(`sourceCard.type === '${type}'`));
  }
  assert.match(method, /throw new Meteor\.Error\('invalid-linked-card'\)/);
});
