'use strict';

// A client must not be able to stop the server by subscribing badly.
//
// `Meteor.subscribe('board', null, false)` - which the app itself sent, from a
// popup that read `Session.get('currentBoard')` on a page that has no board -
// killed the server:
//
//   Match error: Expected string, got null
//     at Subscription.<anonymous> (server/publications/boards.js:481)
//   SyncedCron: Fatal error encountered (unhandledRejection)
//   => Exited with code: 1
//
// `check()` throws, and a throw inside an ASYNC publisher escapes as an unhandled
// promise rejection, which this app treats as fatal. So the arguments of these
// publishers are TESTED, not checked: a subscription that names no board is
// answered with nothing published, and the process stays up. Any client can send
// that subscription, so this is a denial of service, not only a bug.
//
// Run: node tests/publicationArgumentGuard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const boards = read('server/publications/boards.js');
const cardsWindow = read('server/publications/cardsWindow.js');

// A replay of the guard: does this pair of arguments publish nothing?
function publishesNothing(boardId, isArchived) {
  if (typeof boardId !== 'string' || !boardId) return true;
  if (typeof isArchived !== 'boolean') return true;
  return false;
}

console.log('publicationArgumentGuard:');

test('a subscription that names no board publishes nothing', () => {
  assert.strictEqual(publishesNothing(null, false), true, 'the crash from the report');
  assert.strictEqual(publishesNothing(undefined, false), true);
  assert.strictEqual(publishesNothing('', false), true, 'an empty select value');
  assert.strictEqual(publishesNothing(123, false), true);
  assert.strictEqual(publishesNothing({ $ne: null }, false), true,
    'a selector object is not a board id either');
  assert.strictEqual(publishesNothing('abc', null), true, 'nor a missing isArchived');
  // A real subscription still goes through.
  assert.strictEqual(publishesNothing('abc', false), false);
  assert.strictEqual(publishesNothing('abc', true), false);
});

test('the board publisher tests its arguments before anything else', () => {
  const at = boards.indexOf(
    "publishComposite('board', async function(boardId, isArchived, generation)",
  );
  assert.ok(at !== -1, 'the publisher must be there');
  // The publisher's OWN body, not a fixed-size window: the comment explaining why
  // check() cannot be the guard grew past 1400 characters, which put the first
  // real statement outside the slice and failed the "guard runs first" assertion
  // on a file where the guard does run first.
  const ends = ['\npublishComposite(', '\nMeteor.publish(', '\nMeteor.methods(']
    .map(t => boards.indexOf(t, at + 1))
    .filter(i => i !== -1);
  const head = boards.slice(at, ends.length ? Math.min(...ends) : undefined);
  assert.ok(/if \(!Match\.test\(boardId, String\) \|\| !boardId\) return;/.test(head),
    'a null or empty board id ends the subscription');
  assert.ok(/if \(!Match\.test\(isArchived, Boolean\)\) return;/.test(head));
  assert.ok(!/^\s*check\(boardId, String\);/m.test(head),
    'check() throws, and a throw here exits the process - it must not be the guard');
  // ...but the arguments must still be MARKED as checked: this app runs with
  // audit-argument-checks, which fails any publisher that returns without having
  // check()ed every argument ("Did not check() all arguments during publisher
  // 'board'"). Match.test does not count; check(x, Match.Any) does, and never
  // throws.
  assert.ok(/check\(boardId, Match\.Any\);/.test(head)
    && /check\(isArchived, Match\.Any\);/.test(head)
    && /check\(generation, Match\.Any\);/.test(head),
    'every argument must be check()ed with Match.Any, or the audit throws');
  assert.ok(head.indexOf('check(boardId, Match.Any)') < head.indexOf('Match.test(boardId'),
    'marked first, validated second');
  // The guard has to come before any work, or the work throws first.
  assert.ok(head.indexOf('Match.test(boardId') < head.indexOf('localizeBoardMemberAvatars'),
    'and it must run before the publisher does anything with the id');
});

test('the card-window publishers are guarded the same way', () => {
  const window = cardsWindow.slice(cardsWindow.indexOf("publishComposite('boardCardsWindow'"));
  assert.ok(/if \(!Match\.test\(boardId, String\) \|\| !boardId\) return;/.test(window.slice(0, 900)));
  assert.ok(/if \(!Match\.test\(cardSelector, Object\)\) return;/.test(window.slice(0, 900)),
    'a card selector from a client is an object or nothing at all');
  for (const arg of ['boardId', 'cardSelector', 'sort', 'limit']) {
    assert.ok(new RegExp(`check\\(${arg}, Match\\.Any\\);`).test(window.slice(0, 900)),
      `${arg} must be marked as checked for the audit`);
  }
  const mode = cardsWindow.slice(cardsWindow.indexOf("Meteor.publish('boardCardsLoadingMode'"));
  assert.ok(/check\(boardId, Match\.Any\);/.test(mode.slice(0, 500)));
  assert.ok(/if \(!Match\.test\(boardId, String\) \|\| !boardId\) return this\.ready\(\);/
    .test(mode.slice(0, 500)),
    'a plain publisher readies the subscription instead of returning a config');
});

test('the client does not send a subscription with no board id', () => {
  // The other half: the popup that started this read Session.get('currentBoard')
  // on a page that has no current board.
  const src = read('client/components/lists/listBody.js');
  const subs = [...src.matchAll(/^(.*)Meteor\.subscribe\('board', ([^,]+), false\)/gm)];
  assert.ok(subs.length >= 5, `expected the board subscriptions, found ${subs.length}`);
  for (const m of subs) {
    const [line, before, arg] = m;
    const context = src.slice(Math.max(0, m.index - 700), m.index);
    const guarded =
      /if \(/.test(before)                                 // guarded on the same line
      || context.includes(`if (${arg})`)                   // guarded just above
      // ...or the id comes from a board the code already refused to work without.
      || (arg === 'this.boardId'
        && (/if \(!this\.board\)[\s\S]*?return;/.test(context)
          || /if \(!boardId\)[\s\S]*?return;[\s\S]*?this\.boardId = boardId;/.test(context)));
    assert.ok(guarded, `an unguarded subscription with ${arg}`);
  }
});

console.log(`\n${passed} tests passed`);
