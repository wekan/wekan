'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const cards = fs.readFileSync(
  path.join(root, 'server/publications/cards.js'),
  'utf8',
);

assert.match(
  cards,
  /import \{ MATCH_NOTHING, selectorIsInjection \} from '\/server\/lib\/selectorGuard';/,
  'global search must use the shared NoSQL execution guard',
);

const buildSelectorBranch = cards.match(
  /if \(queryParams\.selector\) \{[\s\S]*?\n  \} else \{/,
);
assert.ok(buildSelectorBranch, 'the client-selector branch must remain identifiable');
assert.match(
  buildSelectorBranch[0],
  /selectorIsInjection\(queryParams\.selector, 'globalSearch'\)/,
  'an executable client selector must be rejected',
);
assert.match(
  buildSelectorBranch[0],
  /\$and: \[[\s\S]*queryParams\.selector[\s\S]*boardId:[\s\S]*Boards\.userBoardIds/,
  'a benign client selector must be conjoined with the caller board scope',
);
assert.doesNotMatch(
  buildSelectorBranch[0],
  /selector = queryParams\.selector;/,
  'the publication must never adopt a client selector verbatim',
);

const findCards = cards.match(
  /async function findCards\(sessionId, query, userId\) \{[\s\S]*?ReactiveCache\.getCards\(databaseSelector/,
);
assert.ok(findCards, 'the shared initial and pagination query path must exist');
assert.match(
  findCards[0],
  /selectorIsInjection\([\s\S]*?query\.selector,[\s\S]*?'globalSearch\.pagination'/,
  'stored selectors must be checked again before pagination executes them',
);
assert.match(
  findCards[0],
  /\$and: \[storedSelector, \{ boardId: \{ \$in: authorizedBoardIds \} \}]/,
  'stored selectors from older releases must be constrained to current access',
);
assert.ok(
  findCards[0].indexOf('selectorIsInjection(query.selector') <
    findCards[0].indexOf('ReactiveCache.getCards(databaseSelector'),
  'the guard must run before the database query',
);
assert.match(
  cards,
  /selector: SessionData\.pickle\(storedSelector\)/,
  'an injected legacy selector must be replaced before it is stored again',
);

console.log('globalSearchSelectorAuthorization: 10 assertions passed');
