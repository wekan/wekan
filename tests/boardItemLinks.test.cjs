// A swimlane, a list and a card can each be linked, and following the link
// lands on the thing it names.
//
// A card has had an address since there has been a card route. A swimlane and a
// list had none, and `List.absoluteUrl()` answered with the URL of whichever
// CARD the cache returned first for that list - so "link to this list" went to
// a card, and to nothing at all when the list was empty.
//
// docs/Features/Page/Board-Item-Links.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  SWIMLANE_SEGMENT, LIST_SEGMENT,
  SWIMLANE_ROUTE_PATH, LIST_ROUTE_PATH,
  buildSwimlaneRelativeUrl, buildListRelativeUrl,
} = require('../models/lib/boardItemUrl');
const {
  REVEAL_KINDS, REVEAL_TARGETS, REVEAL_SESSION_KEYS, revealElementId,
} = require('../models/lib/revealBoardItem');

const router = read('config/router.js');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// The router's own path compiler, copied out, so the guard checks what actually
// matches rather than what the string looks like.
function pathToRegExp(pathDef) {
  const keys = [];
  const pattern = pathDef.replace(/(\/)?:(\w+)(?:\(([^)]+)\)|([+*?]))?/g,
    (_, slash, name, custom, modifier) => {
      keys.push(name);
      const capture = custom || (modifier === '*' ? '.*' : modifier === '+' ? '.+' : '[^/]+');
      if (slash && (modifier === '?' || modifier === '*')) return `(?:/(${capture}))?`;
      if (!slash && (modifier === '?' || modifier === '*')) return `(?:(${capture}))?`;
      return `${slash || ''}(${capture})`;
    });
  return { regexp: new RegExp(`^${pattern.replace(/\/+$/, '')}\\/?$`), keys };
}

console.log('boardItemLinks:');

test('a swimlane and a list each have an address of their own', () => {
  const board = { _id: 'b1', slug: 'my-board' };
  assert.strictEqual(buildSwimlaneRelativeUrl({ _id: 's1', boardId: 'b1' }, board),
    '/b/b1/my-board/swimlane/s1');
  assert.strictEqual(buildListRelativeUrl({ _id: 'l1', boardId: 'b1' }, board),
    '/b/b1/my-board/list/l1');

  // No board: the id is on the item itself and the slug is only there to be
  // read, so the link still works - the same fallback the card URL uses.
  assert.strictEqual(buildListRelativeUrl({ _id: 'l1', boardId: 'b1' }, null),
    '/b/b1/board/list/l1');

  // A thenable is an UNRESOLVED promise - `board()` is async on the server -
  // and reading _id off one is exactly what emitted `/b/undefined/board/...`
  // in issue #6427. It falls back rather than interpolating the promise.
  assert.strictEqual(
    buildListRelativeUrl({ _id: 'l1', boardId: 'b1' }, Promise.resolve({ _id: 'x', slug: 'y' })),
    '/b/b1/board/list/l1');

  // Nothing to link: undefined, not a URL that resolves to nowhere.
  assert.strictEqual(buildListRelativeUrl(null, board), undefined);
  assert.strictEqual(buildListRelativeUrl({ _id: 'l1' }, null), undefined);
  assert.strictEqual(buildSwimlaneRelativeUrl({ boardId: 'b1' }, board), undefined);
});

test('and no address can be read as the wrong kind of thing', () => {
  // FIVE segments against the card route's four is the whole reason these can
  // coexist with `/b/:boardId/:slug/:cardId`. If either ever loses a segment,
  // a link to a list becomes a link to a card called "list".
  const card = pathToRegExp('/b/:boardId/:slug/:cardId');
  const swimlane = pathToRegExp(SWIMLANE_ROUTE_PATH);
  const list = pathToRegExp(LIST_ROUTE_PATH);
  const urls = {
    swimlane: '/b/b1/my-board/swimlane/s1',
    list: '/b/b1/my-board/list/l1',
    card: '/b/b1/my-board/c1',
  };
  const matchers = { swimlane, list, card };
  for (const [kind, url] of Object.entries(urls)) {
    for (const [name, matcher] of Object.entries(matchers)) {
      assert.strictEqual(matcher.regexp.test(url), kind === name,
        `${url} must match the ${kind} route and only that one (${name} disagreed)`);
    }
  }
  // The captured id is the item's, not part of the path.
  assert.strictEqual(swimlane.regexp.exec(urls.swimlane)[3], 's1');
  assert.strictEqual(list.regexp.exec(urls.list)[3], 'l1');
});

test('and the router registers them from the same constants the URLs use', () => {
  // The route and the link cannot disagree about the path if there is only one
  // copy of it.
  assert.ok(router.includes('FlowRouter.route(SWIMLANE_ROUTE_PATH, {'),
    'the swimlane route takes its path from the module');
  assert.ok(router.includes('FlowRouter.route(LIST_ROUTE_PATH, {'),
    'and so does the list route');
  assert.ok(/import \{ SWIMLANE_ROUTE_PATH, LIST_ROUTE_PATH \} from '\/models\/lib\/boardItemUrl'/
    .test(router), 'imported, not re-typed');
  assert.ok(SWIMLANE_ROUTE_PATH.includes(`/${SWIMLANE_SEGMENT}/`));
  assert.ok(LIST_ROUTE_PATH.includes(`/${LIST_SEGMENT}/`));
});

test('a list links to itself, not to a card that happens to be in it', () => {
  const lists = read('models/lists.js');
  const at = lists.indexOf('originRelativeUrl(board) {');
  assert.notStrictEqual(at, -1, 'a list builds its own URL');
  const body = lists.slice(at, lists.indexOf('\n  },', at));
  assert.ok(/buildListRelativeUrl\(this, board \|\| this\.board\(\)\)/.test(body),
    'from the list, not from a card');
  // The old shape, which is what made the link wrong: it asked the cache for
  // ANY card of this list and handed back that card's URL.
  assert.ok(!/ReactiveCache\.getCard\(\{ listId: this\._id \}\)/.test(lists),
    'no card lookup is left in the URL helpers');
  // And a swimlane has the same pair.
  const swimlanes = read('models/swimlanes.js');
  assert.ok(/buildSwimlaneRelativeUrl\(this, board \|\| this\.board\(\)\)/.test(swimlanes),
    'a swimlane builds its own too');
  for (const src of [lists, swimlanes]) {
    assert.ok(/Meteor\.absoluteUrl\(relativeUrl\.replace\(\/\^\\\/\/, ''\)\)/.test(src),
      'absoluteUrl is built from the relative path, which works on the server too');
  }
});

test('following one of these links reveals what it named', () => {
  // The route cannot scroll: it runs before the board has rendered, and on a
  // board that is already open it runs without re-creating anything. So it
  // NAMES what to reveal and the board body reveals it.
  for (const kind of REVEAL_KINDS) {
    const { sessionKey } = REVEAL_TARGETS[kind];
    assert.ok(router.includes(`Session.set('${sessionKey}', params.${kind}Id)`),
      `the ${kind} route names what to reveal`);
  }
  // ...and every OTHER board route clears it. A reveal is about the address you
  // just followed; without this, opening a card after a list link would scroll
  // the board away from the card it had just opened.
  for (const marker of ["name: 'card',", "name: 'board',"]) {
    const at = router.indexOf(marker);
    assert.notStrictEqual(at, -1, `${marker} must be a route`);
    const body = router.slice(at, router.indexOf('\n});', at));
    for (const key of REVEAL_SESSION_KEYS) {
      assert.ok(body.includes(`Session.set('${key}', null)`),
        `${marker} must clear ${key}, or a stale reveal fires on the next board`);
    }
  }
});

test('and it looks for the element the templates actually draw', () => {
  assert.strictEqual(revealElementId('swimlane', 's1'), 'swimlane-s1');
  assert.strictEqual(revealElementId('list', 'l1'), 'js-list-l1');
  // Junk reveals nothing rather than searching for `list-undefined`.
  for (const bad of [null, undefined, '', 7, {}]) {
    assert.strictEqual(revealElementId('list', bad), null);
  }
  assert.strictEqual(revealElementId('nonsense', 'x'), null);

  // The ids are NOT this module's invention: they are what the markup carries.
  // A name derived from another name is wrong the moment the two spellings
  // differ, and it fails silently - nothing is found, nothing is reported.
  assert.ok(read('client/components/swimlanes/swimlanes.jade')
    .includes('id="swimlane-{{_id}}"'), 'a swimlane really is id="swimlane-<id>"');
  assert.ok(read('client/components/lists/list.jade')
    .includes('id="js-list-{{_id}}"'), 'a list really is id="js-list-<id>"');
});

test('and the reveal gives up rather than spinning, and cleans up after itself', () => {
  const src = read('client/lib/revealBoardItem.js');
  // A board renders in more than one pass and its lists arrive with their
  // subscriptions, so one look on the next tick finds nothing on a cold load.
  assert.ok(/setInterval\(attempt, RETRY_MS\)/.test(src), 'it retries');
  assert.ok(/Date\.now\(\) - started > GIVE_UP_MS/.test(src),
    'and gives up: a link to an archived list names an element that will never exist');
  // One-shot: cleared when acted on AND when given up on, or the board would
  // re-scroll on every later render.
  assert.strictEqual((src.match(/Session\.set\(sessionKey, null\)/g) || []).length, 2,
    'cleared on both paths');
  // Cleared BEFORE scrolling: scrollIntoView can re-enter this autorun through
  // the reactive read, and clearing first makes the second pass a no-op.
  assert.ok(src.indexOf('Session.set(sessionKey, null);') < src.indexOf('scrollIntoView(element);'),
    'cleared before the scroll, not after');
  // The watcher owns a computation and an interval; neither stops on its own.
  const body = read('client/components/boards/boardBody.js');
  assert.ok(/this\.boardItemReveals = watchBoardItemReveals\(\)/.test(body), 'started on render');
  assert.ok(/this\.boardItemReveals\.stop\(\)/.test(body), 'and stopped on destroy');
});

test('all three are copied the same way, from the same kind of menu', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['copy-link-to-clipboard'], 'Copy link to clipboard');

  const places = [
    ['client/components/swimlanes/swimlaneHeader.jade', 'client/components/swimlanes/swimlaneHeader.js',
      'swimlaneActionPopup', 'js-copy-swimlane-link'],
    ['client/components/lists/listHeader.jade', 'client/components/lists/listHeader.js',
      'listActionPopup', 'js-copy-list-link'],
    ['client/components/cards/cardDetails.jade', 'client/components/cards/cardDetails.js',
      'cardDetailsActionsPopup', 'js-copy-card-link'],
  ];
  for (const [jadeFile, jsFile, template, cls] of places) {
    const jade = read(jadeFile);
    const at = jade.indexOf(`template(name="${template}")`);
    assert.notStrictEqual(at, -1, `${template} must exist`);
    const popup = jade.slice(at, jade.indexOf('\ntemplate(', at + 1));
    assert.ok(popup.includes(cls), `${template} draws ${cls}`);
    // Named, not only an icon - which is what the card's header button was, and
    // a tooltip is the one place a name cannot be read without hovering.
    assert.ok(popup.includes("{{_ 'copy-link-to-clipboard'}}"),
      `${template} shows the name beside the icon`);
    assert.ok(/i\.fa\.fa-link/.test(popup), `${template} shows the link icon`);
    // FIRST: it is what the menu is opened for most often, and it is the only
    // row a read-only member can use.
    const rowAt = popup.indexOf(cls);
    for (const later of ['js-add-swimlane', 'js-add-card', 'js-toggle-watch-card']) {
      const otherAt = popup.indexOf(later);
      if (otherAt !== -1) assert.ok(rowAt < otherAt, `${template}: ${cls} comes first`);
    }
    // ...and it is handled. A copy with markup and no map does nothing at all.
    const js = read(jsFile);
    const handlerAt = js.indexOf(`'click .${cls}'`);
    assert.notStrictEqual(handlerAt, -1, `${jsFile} handles ${cls}`);
    const handler = js.slice(handlerAt, js.indexOf('\n  },', handlerAt));
    assert.ok(/absoluteUrl\(\)/.test(handler),
      `${cls} copies the ABSOLUTE url - a relative path is only a link inside this page`);
    assert.ok(/Utils\.copyTextToClipboard/.test(handler), `${cls} copies it`);
    assert.ok(/copied-tooltip/.test(handler), `${cls} says it did`);
  }
});

test('and copying a link is not gated on being able to edit', () => {
  // Copying an address is reading. Somebody who may only read the board can
  // still tell a colleague which list they mean, so the row sits ABOVE the
  // permission checks that guard everything else in these menus.
  for (const [file, template, cls, guard] of [
    ['client/components/swimlanes/swimlaneHeader.jade', 'swimlaneActionPopup',
      'js-copy-swimlane-link', 'currentUser.isCommentOnly'],
    ['client/components/lists/listHeader.jade', 'listActionPopup',
      'js-copy-list-link', 'currentUser.isReadOnly'],
  ]) {
    const jade = read(file);
    const popup = jade.slice(jade.indexOf(`template(name="${template}")`));
    const rowAt = popup.indexOf(cls);
    const guardAt = popup.indexOf(guard);
    assert.notStrictEqual(guardAt, -1, `${template} still guards its editing rows`);
    assert.ok(rowAt < guardAt,
      `${template}: the copy row must come before "${guard}", or a read-only member cannot use it`);
  }
});

test('and the card header no longer carries a copy button of its own', () => {
  // It was an icon named only by a tooltip. It is in the menu now, with its
  // name, beside the swimlane's and the list's.
  const jade = read('client/components/cards/cardDetails.jade');
  const header = jade.slice(0, jade.indexOf('template(name="'));
  for (const gone of ['js-copy-link', 'card-copy-button', 'card-copy-mobile-button']) {
    assert.ok(!header.includes(gone), `${gone} must be gone from the card header`);
  }
  // ...and its handler with it: a handler for markup that no longer exists is
  // dead code that reads as a working feature.
  assert.ok(!/'click \.js-copy-link'/.test(read('client/components/cards/cardDetails.js')),
    'the old header handler is gone too');
  // The "Copied" the removed button used is gone as well - nothing in the
  // header can copy any more, so it could never be shown.
  assert.ok(!header.includes('copied-tooltip'),
    'and the tooltip that only that button used');
});

test('the name is translated, not left in English everywhere', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json')
    && !fs.lstatSync(path.join(dir, f)).isSymbolicLink());
  let translated = 0;
  const missing = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (!('copy-link-to-clipboard' in data)) { missing.push(f); continue; }
    const lang = f.replace('.i18n.json', '');
    if (lang === 'en' || lang.startsWith('en-') || lang.startsWith('en_')) continue;
    if (data['copy-link-to-clipboard'] !== 'Copy link to clipboard') translated++;
  }
  assert.deepStrictEqual(missing, [], 'every language file must have the key');
  // Most of them are really translated. The ones that are not are languages
  // whose existing copy-strings are already in the WRONG language - Romanian
  // holding Italian, Esperanto holding Spanish - where deriving from them would
  // only spread the error, so they keep the English placeholder honestly.
  assert.ok(translated > 100, `only ${translated} languages are translated`);
});

test('and the key sits in the same place in every file', () => {
  // The files are `key -> string` in ONE order, matching en.i18n.json. A key
  // appended at the end of some files and inserted in others makes every later
  // diff unreadable.
  const dir = path.join(ROOT, 'imports/i18n/data');
  const en = Object.keys(JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json'), 'utf8')));
  const index = en.indexOf('copy-link-to-clipboard');
  assert.ok(index > 0, 'the key is in en.i18n.json');
  assert.strictEqual(en[index - 1], 'copy-card-link-to-clipboard', 'right after the card one');
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.i18n.json')
    && !fs.lstatSync(path.join(dir, x)).isSymbolicLink())) {
    const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    assert.strictEqual(keys.indexOf('copy-link-to-clipboard'), index,
      `${f}: the key is at a different position than in en.i18n.json`);
  }
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nboardItemLinks: ${passed} tests passed`);
