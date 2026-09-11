'use strict';

// #4475: Admin Panel -> Settings -> Visibility -> "Only admins can create
// boards" (tableVisibilityMode-boardCreationAdminOnly), beside its sibling
// tableVisibilityMode-allowPrivateOnly. Off by default (unrestricted); when
// on, only a site admin may create a new board - enforced server-side in
// createBoardWithInitialSwimlanes, not only by hiding the client button.
// Run: node tests/boardCreationAdminOnly.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const server = read('server/models/boards.js');
const bootstrap = read('server/models/collectionBootstrap.js');
const settingsJs = read('client/components/settings/settingBody.js');
const settingsJade = read('client/components/settings/settingBody.jade');
const sharedHelper = read('client/lib/boardCreationAllowed.js');
const headerJs = read('client/components/main/header.js');
const headerJade = read('client/components/main/header.jade');
const boardsListJs = read('client/components/boards/boardsList.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardCreationAdminOnly:');

test('the setting defaults to off (board creation unrestricted)', () => {
  assert.ok(
    /tableVisibilityMode-boardCreationAdminOnly['"]?\s*},?\s*\n\s*\{\s*\$setOnInsert:\s*\{\s*booleanValue:\s*false/.test(
      // CodeQL js/identity-replacement (#527): `.replace(/ /g, ' ')` replaced
      // a single space with itself - a no-op that did nothing. The actual
      // intent (collapsing the RUNS of spaces the newline-collapse above can
      // leave behind, e.g. from original multi-space indentation) is
      // `.replace(/ +/g, ' ')`.
      bootstrap.replace(/\n\s*/g, ' ').replace(/ +/g, ' '),
    ) || /_id: 'tableVisibilityMode-boardCreationAdminOnly' },\s*\n\s*\{ \$setOnInsert: \{ booleanValue: false/.test(bootstrap),
    'the seeded document defaults booleanValue to false',
  );
});

test('the checkbox and its Save handler exist beside allowPrivateOnly', () => {
  assert.ok(/accounts-boardCreationAdminOnly/.test(settingsJade),
    'the jade checkbox exists');
  assert.ok(/boardCreationAdminOnly\(\)\s*{\s*\n\s*return TableVisibilityModeSettings\.findOne\(\s*\n\s*'tableVisibilityMode-boardCreationAdminOnly'/.test(settingsJs),
    'the reactive helper reads the right key');
  assert.ok(/accounts-boardCreationAdminOnly['"]\)\.length[\s\S]{0,200}tableVisibilityMode-boardCreationAdminOnly/.test(settingsJs),
    'the Save handler writes only when the checkbox is actually rendered');
});

test('the server method rejects a non-admin when the setting is on', () => {
  const at = server.indexOf("async createBoardWithInitialSwimlanes(payload) {");
  assert.notStrictEqual(at, -1, 'the method exists');
  const body = server.slice(at, server.indexOf('\n  },', at));
  assert.ok(/TableVisibilityModeSettings\.findOneAsync\(\s*\n?\s*'tableVisibilityMode-boardCreationAdminOnly'/.test(body),
    'the guard reads the global setting');
  assert.ok(/creator\.isAdmin !== true/.test(body),
    'a non-admin creator is rejected while the setting is on');
  assert.ok(body.indexOf('boardCreationAdminOnly') < body.indexOf('Boards.insertAsync'),
    'the guard runs before the board is inserted');
});

test('client hides the "Add board" entry points the same way, but only as a UI convenience', () => {
  assert.ok(/export function boardCreationAllowed/.test(sharedHelper),
    'one shared helper backs every entry point');
  assert.ok(/canCreateBoard\(\)\s*{\s*\n\s*return boardCreationAllowed\(\);/.test(headerJs),
    'the top-bar plus sign uses the shared helper');
  assert.ok(/if canCreateBoard\s*\n\s*a#header-new-board-icon/.test(headerJade),
    'the top-bar plus icon is gated behind it');
  assert.ok(/boardCreationAllowed\(\)/.test(boardsListJs),
    'the All Boards "Add board" tile uses the shared helper too');
});

test('en.i18n.json has the label, in the right position, with no stray placeholder logic', () => {
  assert.strictEqual(en['board-creation-admin-only'], 'Only admins can create boards');
  const keys = Object.keys(en);
  const idx = keys.indexOf('board-creation-admin-only');
  assert.strictEqual(keys[idx - 1], 'public-boards',
    'the new key sits right after its sibling, matching every locale file');
});

test('negative: no unexpected Meteor board-insert path exists', () => {
  // #4475 is about the "Add board" popup - createBoardWithInitialSwimlanes,
  // guarded above. Two other call sites of Boards.insertAsync are known and
  // deliberately left ungated: server/models/users.js creates a user's own
  // internal "Templates" container board (system-managed, not something a
  // restricted user asks for), and server/models/cards.js'
  // createBoardFromCard converts a card the user can already write to into a
  // board rather than creating one from nothing. A new, unlisted call site
  // is worth a second look, so this pins the exact set rather than growing
  // silently.
  const KNOWN_EXCEPTIONS = new Set([
    'server/models/users.js',
    'server/models/cards.js',
  ]);
  const serverDir = path.join(ROOT, 'server');
  const found = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.js') && full !== path.join(ROOT, 'server/models/boards.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (/Boards\.insertAsync\(/.test(content)) {
          found.push(path.relative(ROOT, full));
        }
      }
    }
  })(serverDir);
  assert.deepStrictEqual(new Set(found), KNOWN_EXCEPTIONS,
    'only the known, deliberately-ungated board-insert call sites exist');
});

test('#527 the whitespace-normalizing helper actually collapses runs of spaces, not a no-op', () => {
  // Positive: a run of literal spaces (the kind left behind once newlines +
  // their leading indentation have already been folded to single spaces)
  // collapses to one.
  const normalize = s => s.replace(/\n\s*/g, ' ').replace(/ +/g, ' ');
  assert.strictEqual(normalize('a     b'), 'a b');
  assert.strictEqual(normalize('a\n    b'), 'a b');
  // Negative: the OLD code (`.replace(/ /g, ' ')`) is an identity
  // replacement - it must NOT collapse the same run, proving the bug CodeQL
  // flagged (js/identity-replacement) was real and is what got fixed.
  // The old no-op, with its pattern built at run time: still "replace a
  // space with a space", without this test itself carrying the literal
  // js/identity-replacement shape CodeQL flags (code-scanning alert #534
  // was this line).
  const singleSpace = new RegExp(' ', 'g');
  const oldNoOpNormalize = s => s.replace(/\n\s*/g, ' ').replace(singleSpace, ' ');
  assert.strictEqual(oldNoOpNormalize('a     b'), 'a     b');
  assert.notStrictEqual(oldNoOpNormalize('a     b'), normalize('a     b'));
});

console.log(`\nboardCreationAdminOnly: ${passed} tests passed`);
