'use strict';

// Every theme paints the WHOLE board tile in All Boards, and a LIGHT theme is
// readable on what it painted - in the overview and in the header bar.
// Run: node tests/boardTileTheme.test.cjs
//
// Reported with a screenshot: a board on the clearpink theme was a pink
// rectangle floating inside a grey tile, while the flat-coloured board beside
// it filled its tile edge to edge.
//
// Two lists said what a tile is coloured with. boardColors.css painted
// `.board-list .board-color-<name> a` - the LINK inside the tile, which sits
// inside `.board-list-item`'s 24px/18px padding, so it can never reach the
// tile's edges - and boardsList.css carried a hand-copied list of seventeen
// flat `background-color` lines on the tile itself, which is what made the flat
// themes look right. The five colour SLIDE themes added later were never copied
// into that list, so their tiles kept the #999 default and only the inset link
// showed the slide; clearblue was in it, flattened to a single hex, so it did
// not show its slide either; and cleandark and cleanlight were in neither list.
//
// There is one list now: each theme paints `.board-list li.board-color-<name>`
// where it paints its header bar, and the copy is gone. What this test pins is
// that the list stays complete - a new theme cannot be added in a header rule
// alone and leave its boards grey in the overview.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const colors = read('client/components/boards/boardColors.css');
const list = read('client/components/boards/boardsList.css');
const accents = read('models/lib/themeAccents.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardTileTheme:');

// The themes are the ones the accent map names - the same list the rest of the
// app themes from, so this cannot drift into its own idea of what a theme is.
const THEMES = Array.from(
  accents.slice(accents.indexOf('const THEME_ACCENTS = {'), accents.indexOf('};'))
    .matchAll(/^\s{2}([a-z0-9]+):/gm),
).map(m => m[1]);

function selectorNamesSurface(surface) {
  const names = new Set();
  for (const rule of colors.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const selector = rule[1];
    if (!selector.includes(surface)) continue;
    for (const match of selector.matchAll(/\.board-color-([a-z0-9]+)/g)) {
      names.add(match[1]);
    }
  }
  return names;
}

test('the accent map is where the theme names come from', () => {
  assert.ok(THEMES.length > 20, `expected every theme, found ${THEMES.length}`);
  assert.ok(THEMES.includes('clearpink') && THEMES.includes('cleanlight'),
    'including the ones that were missing');
});

test('every theme paints the tile itself', () => {
  const painted = selectorNamesSurface('.board-list li');
  for (const theme of THEMES) {
    assert.ok(painted.has(theme),
      `${theme} does not colour .board-list li.board-color-${theme}`);
  }
});

test('and none of them paints the link inside it instead (negative)', () => {
  // The link is inside `.board-list-item`'s padding: a background on it stops
  // 8px short on each side and 24px short at the top, which is the pink
  // rectangle in the report.
  assert.ok(!/^\.board-list \.board-color-[a-z0-9]+ a/m.test(colors),
    'no theme colours the tile through its link any more');
  const item = list.slice(list.indexOf('.board-list .board-list-item {'));
  assert.ok(/padding: 24px 8px 18px 8px/.test(item.slice(0, item.indexOf('}'))),
    'which is the padding that made it visible');
});

test('the colour is not copied into a second list (negative)', () => {
  // The stale copy is what broke this. If a hex for a theme comes back to
  // boardsList.css, the two lists can disagree again.
  assert.ok(!/\.board-list \.board-color-[a-z0-9]+ \{/.test(list),
    'boardsList.css does not restate a theme colour');
  assert.ok(/The board colour of a tile is painted by the THEME/.test(list),
    'and it says where the colour comes from instead');
});

test('a slide theme really is a slide on the tile', () => {
  // The point of the report: clearpink is a gradient, and a gradient that only
  // covers the inner link is not the theme.
  for (const theme of ['clearblue', 'cleargreen', 'clearorange', 'clearpink',
    'clearpurple', 'clearred']) {
    const at = colors.search(new RegExp(`^\\.board-list li\\.board-color-${theme}(,| \\{)`, 'm'));
    assert.ok(at > 0, `${theme} has a tile rule`);
    const rule = colors.slice(at, colors.indexOf('}', at));
    assert.ok(/linear-gradient\(180deg/.test(rule), `${theme}'s tile carries its slide`);
  }
});

test('a themed tile that has to override the tile text keeps it readable', () => {
  // #f6f6f6 on Clean Light's #F1F1F3 is a title nobody can read, so that theme
  // states the text colour too - in the light-tile block the next test pins.
  const at = colors.indexOf('.board-list li.board-color-cleanlight .board-list-item,');
  assert.ok(at > 0, 'Clean Light sets the tile text colour');
  assert.ok(/color: rgba\(10, 10, 20, 0\.85\)/.test(colors.slice(at, colors.indexOf('}', at))),
    'to the same colour its header bar uses');
});

test('the per-user "All Boards" theming still wins over the tile colour', () => {
  // Member Settings / Change color / All Boards paints every tile in the
  // theme's own accent. It is a more specific selector than a theme's, and it
  // sets both halves of the background, so a slide cannot show through it.
  const at = list.indexOf('body.has-theme-board-tiles .board-list > li.js-board {');
  assert.ok(at > 0, 'the override is still there');
  const rule = list.slice(at, list.indexOf('}', at));
  assert.ok(/background: var\(--theme-accent-fill, var\(--theme-accent/.test(rule),
    'it paints the tile with the theme\'s fill - the slide itself on a slide theme');
  assert.ok(!/background-color:/.test(rule),
    'with the shorthand, so a slide theme\'s own gradient on the tile is replaced '
    + 'rather than left on top of the accent');
});

test('a light tile writes its title in a colour that shows on it', () => {
  // Apple Glass Pastel's tile is a pastel wash from #f6f7fb and the tile's title
  // is #f6f6f6: white on near-white, so the board's name and description were
  // not there at all - only the tile's shape said a board was.
  // The colour on the tile does not reach them, because `.board-list
  // .board-list-item` sets a colour on the CHILD and there is nothing left to
  // inherit; each child has to be named.
  for (const [theme, color] of [
    ['appleglasspastel', '#111827'],
    ['cleanlight', 'rgba(10, 10, 20, 0.85)'],
  ]) {
    for (const part of ['.board-list-item', '.board-list-item-name', '.board-list-item-desc']) {
      const selector = `.board-list li.board-color-${theme} ${part},`;
      assert.ok(colors.includes(selector), `${theme} does not set ${part}`);
    }
    const at = colors.indexOf(`.board-list li.board-color-${theme} .board-list-item,`);
    const rule = colors.slice(at, colors.indexOf('}', at));
    assert.ok(rule.includes(color), `${theme} writes its text in ${color}`);
  }
});

test('the light themes are listed in one place, so a third cannot be missed', () => {
  const at = colors.indexOf("/* THE LIGHT TILES' TEXT.");
  assert.ok(at > 0, 'the block says what it is for');
  const block = colors.slice(at, colors.indexOf('.board-list li.board-color-appleglasspastel .board-list-card-count'));
  assert.ok(/EVERY light-tiled theme belongs in this one block/.test(block),
    'and says that a new light theme goes here');
  // The pill and the star sit on the same tile and are the same problem.
  assert.ok(/\.board-list li\.board-color-appleglasspastel \.board-list-card-count/.test(colors),
    'the card-count pill is darkened too');
  assert.ok(/\.board-list li\.board-color-cleanlight \.is-not-star-active/.test(colors),
    'and the unstarred star, which is white by default');
});

test("Clean Light's top bar is ONE shade, icons included", () => {
  // header.css paints every icon in the bar white by id
  // (`#header-quick-access i.fa`). The buttons inside a `ul li` escaped that
  // through a more specific `color: inherit` and took the theme's text colour;
  // the house and the bell are in no `ul li` and stayed white on #F1F1F3. And
  // the labels themselves were 0.5 while the two id-painted icons, once fixed,
  // would be 0.85 - two darknesses in one bar.
  const header = read('client/components/main/header.css');
  const bell = read('client/components/notifications/notifications.css');
  assert.ok(/#header-quick-access i\.fa \{\s*color: #fff/.test(header),
    'the icons are still white by default');
  assert.ok(/#notifications \.notifications-drawer-toggle \{[^}]*color: #f2f2f2/.test(bell),
    'and so is the bell');

  const SHADE = 'rgba(10, 10, 20, 0.85)';
  for (const selector of [
    '.board-color-cleanlight#header-quick-access i.fa,',
    '.board-color-cleanlight#header-quick-access .home-icon .header-home-link,',
    '.board-color-cleanlight#header-quick-access #notifications .notifications-drawer-toggle {',
  ]) {
    assert.ok(colors.includes(selector), `Clean Light does not recolour: ${selector}`);
  }
  const at = colors.indexOf('.board-color-cleanlight#header i.fa,');
  assert.ok(colors.slice(at, colors.indexOf('}', at)).includes(SHADE),
    'every icon in the bar is that one shade');

  const li = colors.indexOf('.board-color-cleanlight#header ul li,');
  assert.ok(colors.slice(li, colors.indexOf('}', li)).includes(`color: ${SHADE} !important`),
    'and so is the label beside it, which was 0.5');
  const hover = colors.indexOf('.board-color-cleanlight#header ul li:hover,');
  assert.ok(colors.slice(hover, colors.indexOf('}', hover)).includes(SHADE),
    'hovering does not change the shade either');
});

test('the dividers between the bar\'s groups are visible on it too', () => {
  // The seam that separates the page's controls from your own account is a
  // white hairline in both bars, so on #F1F1F3 there was nothing there.
  const header = read('client/components/main/header.css');
  assert.ok(/#header-quick-access \.separator \{[^}]*background: rgba\(255, 255, 255, 0\.4\)/.test(header),
    'the first bar draws it as a white background');
  assert.ok(/#header #header-main-bar \.separator \{[^}]*border-inline-start: 1px solid rgba\(255,255,255,0\.3\)/.test(header),
    'and the second as a white border, so both need answering');

  const first = colors.indexOf('.board-color-cleanlight#header-quick-access .separator {');
  assert.ok(first > 0, 'Clean Light recolours the first bar\'s divider');
  assert.ok(/background: rgba\(10, 10, 20, 0\.3\)/.test(colors.slice(first, colors.indexOf('}', first))),
    'in ink');
  const second = colors.indexOf('.board-color-cleanlight#header #header-main-bar .separator {');
  assert.ok(second > 0, "and the second bar's");
  assert.ok(/border-inline-start-color: rgba\(10, 10, 20, 0\.3\)/.test(colors.slice(second, colors.indexOf('}', second))),
    'as a border colour, because that is how that one is drawn');
});

test('hovering an icon darkens it, instead of fading it away', () => {
  // `#header-quick-access i.fa:hover` goes to #ccc: brighter than white text on
  // a dark bar, and on #F1F1F3 a house fading towards the bar it sits on.
  const header = read('client/components/main/header.css');
  assert.ok(/#header-quick-access i\.fa:hover \{\s*color: #ccc/.test(header),
    'the default hover lightens');
  const at = colors.indexOf('.board-color-cleanlight#header i.fa:hover,');
  assert.ok(at > 0, 'Clean Light answers it');
  const rule = colors.slice(at, colors.indexOf('}', at));
  assert.ok(/color: rgba\(10, 10, 20, 1\)/.test(rule), 'with full black');
  assert.ok(rule.includes('.home-icon .header-home-link:hover i.fa'),
    'including the house, whose icon sits inside a link with a colour of its own');
});

test('the starred group keeps its outline on it', () => {
  // Caret, count and star are held together by a white outline, which on
  // #F1F1F3 left the three sitting loose. The phone/desktop toggle beside it
  // draws its own outline in #000 and so was right already - this is the same
  // outline, in the same ink as the rest of this theme.
  const header = read('client/components/main/header.css');
  const group = header.indexOf('#header-quick-access .header-star-group {');
  assert.ok(/border: 1px solid rgba\(255, 255, 255, 0\.7\)/.test(
    header.slice(group, header.indexOf('}', group))), 'it is white by default');
  assert.ok(/#header-quick-access \.mobile-mode-toggle \.board-header-btn \{[^}]*border: 1px solid #000/.test(header),
    'and the toggle beside it is not, which is the look to match');

  const at = colors.indexOf('.board-color-cleanlight#header-quick-access .header-star-group {');
  assert.ok(at > 0, 'Clean Light recolours it');
  assert.ok(/border-color: rgba\(10, 10, 20, 0\.7\)/.test(colors.slice(at, colors.indexOf('}', at))),
    'to the same 0.7, in ink');
});

test('a divider keeps a divider\'s weight, not the text\'s (negative)', () => {
  // 0.3, the same alpha the dark themes give it - not the 0.85 the labels and
  // icons use. A hairline as dark as the text beside it stops reading as a seam
  // and becomes a stroke.
  const at = colors.indexOf('.board-color-cleanlight#header-quick-access .separator {');
  assert.ok(!colors.slice(at, colors.indexOf('}', at)).includes('0.85'),
    'the divider is not text-dark');
});

test('the current entry is still told apart, now that nothing is paler', () => {
  // It used to be the dark one among pale ones. That difference is gone, so it
  // is the full-black heavier one instead.
  const at = colors.indexOf('.board-color-cleanlight#header ul li.current,');
  const rule = colors.slice(at, colors.indexOf('}', at));
  assert.ok(/color: rgba\(10, 10, 20, 1\) !important/.test(rule), 'full black');
  assert.ok(/font-weight: 500/.test(rule), 'and heavier');
});

test('an unread bell keeps its white glyph on the red circle (negative)', () => {
  // `.alert` gives the toggle a red background, and dark ink on red is the
  // opposite fix - so the recolour excludes it rather than covering everything.
  const bell = read('client/components/notifications/notifications.css');
  const at = bell.indexOf('#notifications .notifications-drawer-toggle.alert');
  assert.ok(/background-color: #eb4646/.test(bell.slice(at, bell.indexOf('}', at))),
    'an unread bell is on red');
  assert.ok(colors.includes('.board-color-cleanlight#header-quick-access #notifications .notifications-drawer-toggle.alert i.fa'),
    'and Clean Light puts the glyph back to white on it');
  const at2 = colors.indexOf('.board-color-cleanlight#header #notifications .notifications-drawer-toggle.alert,');
  assert.ok(/color: #fff/.test(colors.slice(at2, colors.indexOf('}', at2))), 'white');
});

test('no theme pins a popup width (negative)', () => {
  // Modern set `width: 260px` on every popup's content, so on that theme the
  // Change Color picker's swatches ran down the popup one per row - and the
  // same would have happened to Export board and the two Show-on popups, which
  // ask for width by name. A theme decides what a popup LOOKS like; how wide it
  // is belongs to the popup.
  // Comments stripped first: the rule below explains what it used to carry, and
  // a guard that reads its own explanation as the fault is a guard that can
  // never pass.
  const declarations = colors.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const line of declarations.split('\n')) {
    if (!/\.pop-over .*\.content \{/.test(line)) continue;
    const body = declarations.slice(declarations.indexOf(line));
    // A FIXED width is the fault. A relative one (moderndark's phone rule is
    // `calc(100% - 20px)`) still lets the popup be as wide as the popup asked
    // to be.
    assert.ok(!/width:\s*\d+px/.test(body.slice(0, body.indexOf('}'))),
      `a theme pins a popup width: ${line.trim()}`);
  }
  const popup = read('client/components/main/popup.css');
  assert.ok(/width: min\(90vw, 720px\) !important/.test(popup),
    'the popups that want width still say so themselves');
});

test('no theme hides a popup header (negative)', () => {
  // Dark hid it outright, and the header is not decoration: it carries the
  // popup's TITLE, the back arrow into the previous popup and the X. On that
  // theme "Change Color" was an untitled panel you could only leave with Escape
  // or a click outside.
  const declarations = colors.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const line of declarations.split('\n')) {
    if (!/\.pop-over ?>? ?\.header ?\{/.test(line.replace(/\s+/g, ' '))) continue;
    const body = declarations.slice(declarations.indexOf(line));
    assert.ok(!/display:\s*none/.test(body.slice(0, body.indexOf('}'))),
      `a theme hides a popup header: ${line.trim()}`);
  }
  const popup = read('client/components/main/popup.css');
  const at = popup.indexOf('.pop-over .header {');
  assert.ok(/height: 41px/.test(popup.slice(at, popup.indexOf('}', at))),
    'and the header every theme now shows is the shared one');
});

console.log(`\nboardTileTheme: ${passed} tests passed`);
