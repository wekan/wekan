'use strict';

// A narrow WINDOW gets the narrow-window layout - not only an explicit mobile mode.
//
// The phone/desktop toggle writes an explicit choice, and `Utils.isMiniScreen()`
// returns it as-is: a phone whose user picked DESKTOP mode is not a mini screen and
// its body has no `.mobile-mode`. Every fix written for `.mobile-mode` or gated on
// `isMiniScreen` therefore did nothing there, while the viewport was still 375px.
// Three of them were visible at once on such a phone:
//
//   * "Create board" opened 160px in with its right half off the screen, because
//     the popup geometry laid it out for a 380px box while the CSS made it the
//     full width of the window - and left the inline `left` in place;
//   * the board bar's hamburger was pushed to a third row of its own;
//   * the quick-access bar was wider than the screen, so the avatar was cut off.
//
// Run: node tests/narrowWindowLayout.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const offsetSrc = read('client/lib/popupOffset.js');
const popupCss = read('client/components/main/popup.css');
const boardCss = read('client/components/boards/boardHeader.css');
const headerCss = read('client/components/main/header.css');

// A replay of the popup geometry's first decision.
const MOBILE_POPUP_MAX_WIDTH = 800;
function isSheet({ viewportWidth, isMiniScreen }) {
  return isMiniScreen || viewportWidth <= MOBILE_POPUP_MAX_WIDTH;
}

console.log('narrowWindowLayout:');

test('a popup on a narrow window is a sheet at 0,0 - mobile mode or not', () => {
  // The case from the screenshot: an iPhone whose user chose desktop mode.
  assert.ok(isSheet({ viewportWidth: 375, isMiniScreen: false }),
    'a 375px window is a sheet even when the user is in desktop mode');
  assert.ok(isSheet({ viewportWidth: 375, isMiniScreen: true }));
  assert.ok(isSheet({ viewportWidth: 800, isMiniScreen: false }), 'the boundary is inclusive');
  assert.ok(!isSheet({ viewportWidth: 801, isMiniScreen: false }),
    'a real window still opens the popup at its button');
});

test('the geometry says so before it computes anything else', () => {
  const at = offsetSrc.indexOf('if (isMiniScreen || viewportWidth <= MOBILE_POPUP_MAX_WIDTH)');
  assert.ok(at !== -1, 'the width check must be there');
  assert.ok(at < offsetSrc.indexOf('const popupWidth'),
    'and before the popup-width math, which assumes a floating box');
  assert.ok(/const MOBILE_POPUP_MAX_WIDTH = 800;/.test(offsetSrc),
    'the width is named, so it can be kept in step with the media query');
  assert.ok(/export \{ computePopupOffset, MOBILE_POPUP_MAX_WIDTH \}/.test(offsetSrc));
});

test('and the CSS pins the sheet, so the inline left cannot move it', () => {
  const at = popupCss.indexOf('@media screen and (max-width: 800px) {');
  assert.ok(at !== -1);
  const block = popupCss.slice(at, popupCss.indexOf('.pop-over .header', at));
  for (const decl of ['position: fixed !important;', 'top: 0 !important;',
    'inset-inline-start: 0 !important;', 'max-width: 100vw !important;']) {
    assert.ok(block.includes(decl), `the sheet must declare ${decl}`);
  }
  // `!important` matters: Popup._getOffset writes left/top as inline styles.
  assert.ok(/style="left:\{\{offset\.left\}\}px; top:\{\{offset\.top\}\}px;/
    .test(read('client/components/main/popup.tpl.jade')),
    'the inline style this overrides');
});

test('the board bar puts its hamburger in the corner by width too', () => {
  const at = boardCss.indexOf('/* The same three rules by WIDTH, not by mobile mode.');
  assert.ok(at !== -1, 'the width-based copy of the mobile-mode rules must be there');
  const block = boardCss.slice(at, boardCss.indexOf('\n}\n', boardCss.indexOf('sidebar-toggle', at)));
  assert.ok(/@media screen and \(max-width: 800px\)/.test(block));
  assert.ok(/body\.board-view #header #header-main-bar \{[\s\S]*?padding-inline-end: 44px;/.test(block),
    'the bar reserves the hamburger width');
  assert.ok(/\.board-header-sidebar-toggle \{[\s\S]*?position: absolute;/.test(block),
    'and the hamburger leaves the flow, instead of wrapping to a row of its own');
  // The mobile-mode originals stay - both paths have to agree.
  assert.ok(/body\.board-view\.mobile-mode #header #header-main-bar \.board-header-sidebar-toggle \{/
    .test(boardCss));
});

test('the drag-handle toggle is one button on one line', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const rule = /\.js-toggle-desktop-drag-handles \{([\s\S]*?)\}/.exec(block);
  assert.ok(rule, 'the toggle must be sized in the phone block');
  assert.ok(/white-space: nowrap !important;/.test(rule[1]),
    'its arrows and its check/ban are one button, not two lines');
  assert.ok(/display: inline-flex !important;/.test(rule[1]));
});

test('the bar gives back the width the avatar needs', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const toggle = /\.mobile-mode-toggle \.board-header-btn \{([\s\S]*?)\}/.exec(block);
  assert.ok(toggle, 'the mode toggle must be trimmed');
  const pad = /padding:\s*(\d+)px (\d+)px/.exec(toggle[1]);
  assert.ok(pad && Number(pad[2]) <= 10,
    `21px each side of two icons was the widest item after the zoom pill, found ${pad && pad[2]}px`);
  const logo = /#header-quick-access img,([\s\S]*?)\}/.exec(block);
  assert.ok(logo && /max-width: 64px !important;/.test(logo[1]), 'and the logo is capped');
  // The `.iphone-device` fallback sets 84px with one class more, so it must be
  // named explicitly or it wins outright.
  assert.ok(/\.iphone-device #header-quick-access img,/.test(block),
    'the iphone-device variant must be named, or the cap never applies there');
});

test('the bell and the avatar sit the same way in both modes', () => {
  // With the free space of the row shared around the bell - an auto margin on
  // each side - it lands midway between the zoom pill and the avatar, and the
  // avatar keeps a small fixed gap to the edge instead of being flung against it.
  // Same rule for both modes, because it is chosen by WIDTH.
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const bell = /#header-quick-access #notifications,([\s\S]*?)\{([\s\S]*?)\}/.exec(block);
  assert.ok(bell, 'the bell must be placed here');
  assert.ok(/margin-inline-start: auto !important;/.test(bell[2])
    && /margin-inline-end: auto !important;/.test(bell[2]),
    'an auto margin on EACH side is what centres it');
  const avatar = /#header-quick-access #header-user-bar,([\s\S]*?)\{([\s\S]*?)\}/.exec(block);
  assert.ok(avatar, 'and the avatar');
  assert.ok(/margin-inline-start: 0 !important;/.test(avatar[2]),
    'no second auto margin - two of them would split the row and separate the pair');
  assert.ok(/margin-inline-end: 12px !important;/.test(avatar[2]),
    'a small gap to the right edge');
  // The `.iphone-device` fallback sets these with `!important` and two classes,
  // so both of its variants have to be named or the placement never applies
  // there - which is the phone in the screenshots.
  for (const sel of ['.iphone-device body:not(.board-view) #header-quick-access #notifications',
    '.iphone-device body:not(.board-view) #header-quick-access #header-user-bar']) {
    assert.ok(block.includes(sel), `${sel} must be named`);
  }
});

test('the board bar: buttons after the title, hamburger in the corner', () => {
  const at = boardCss.indexOf('/* The same rules by WIDTH, not by mobile mode');
  assert.ok(at !== -1, 'the width-based board-bar rules must be there');
  const block = boardCss.slice(at, boardCss.indexOf('\n}\n', boardCss.indexOf(
    'sidebar-toggle', boardCss.indexOf('position: absolute', at))));
  assert.ok(/\.board-header-btns-group,[\s\S]*?\.board-header-btns:not\(\.board-header-sidebar-toggle\) \{[\s\S]*?display: contents;/.test(block),
    'the groups are display:contents, so the buttons start beside the title '
    + 'instead of dropping below it as one block');
  assert.ok(/:not\(\.board-header-sidebar-toggle\)/.test(block),
    'except the hamburger, whose box is positioned - display:contents would remove it');
  assert.ok(/#header #header-main-bar:has\(\.board-header-sidebar-toggle\) \{[\s\S]*?padding-inline-end: 44px;/.test(block),
    'the bar reserves the hamburger width when there IS a hamburger');
  assert.ok(/\.board-header-sidebar-toggle \{[\s\S]*?position: absolute;[\s\S]*?top: 7px;/.test(block),
    'and the hamburger sits in the top right corner');
  // body.board-view is written in 67 rules and set by no code, so scoping to it
  // is scoping to nothing.
  assert.ok(!/body\.board-view #header #header-main-bar:has|body\.board-view[^\n]*display: contents/.test(block),
    'these rules must not hang off body.board-view, which nothing ever adds');
});

test('the mode toggle shows which mode is on', () => {
  const at = headerCss.indexOf('/* Which mode is ON, at a glance.');
  assert.ok(at !== -1, 'the rules must be there');
  const block = headerCss.slice(at, at + 2000);
  assert.ok(/i\.mobile-icon,\s*\n[^\n]*i\.desktop-icon \{[\s\S]*?opacity: 0\.35 !important;/.test(block),
    'the side that is off is faded - black vs #666 was no difference at all');
  assert.ok(/background: var\(--theme-accent, #2980b9\) !important;/.test(block),
    'and the side that is on is a filled chip in the active theme');
  assert.ok(/\.mobile-active i\.mobile-icon \.fa,/.test(block)
    && /color: #fff !important;/.test(block),
    'the glyph inside that chip is white - it is the INNER i.fa that draws it');
});

test('the bell and the avatar are centred in the row', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const rules = [...block.matchAll(/#header-quick-access #(?:notifications|header-user-bar),([\s\S]*?)\{([\s\S]*?)\}/g)];
  assert.strictEqual(rules.length, 2, 'both must be placed here');
  for (const [, , body] of rules) {
    assert.ok(/margin-block: 0 !important;/.test(body),
      'a bottom margin in a centred row lifts the item by half of it - which is '
      + 'why the avatar sat higher than the bell beside it');
  }
});

test('an initials avatar centres its initials in the circle', () => {
  const jade = read('client/components/users/userAvatar.jade');
  const texts = [...jade.matchAll(/text\(x="50%" y="([^"]+)"[^)]*dominant-baseline="([^"]+)"[^)]*font-size="(\d+)"\)/g)];
  assert.ok(texts.length >= 3, `expected the user, org and team avatars, found ${texts.length}`);
  for (const [, y, baseline, size] of texts) {
    assert.strictEqual(y, '50%', 'y="11" of a 15-unit viewBox is 73% down, not the middle');
    assert.strictEqual(baseline, 'central');
    assert.ok(Number(size) <= 12,
      `font-size ${size} in a 15-unit viewBox is taller than the box it is drawn in`);
  }
});

test('the avatar lines up with the bell, and sits inside the bar', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const avatar = /\.header-user-bar-avatar,([\s\S]*?)\{([\s\S]*?)\}/.exec(block);
  assert.ok(avatar, 'the avatar wrapper must be placed here');
  assert.ok(/top: 0 !important;/.test(avatar[2]),
    '`top: -5px` from the desktop bar floated it above the bell beside it');
  const bar = /#header-quick-access #header-user-bar,([\s\S]*?)\{([\s\S]*?)padding: 0 !important;/.exec(block);
  assert.ok(bar, '10px of padding each side is 20px of a 375px bar, spent on nothing');
  // The chips behind the toggle icons cost width in the same row.
  const chip = /i\.mobile-icon,\s*\n[^\n]*i\.desktop-icon \{([\s\S]*?)\}/.exec(block);
  assert.ok(chip && /padding: 2px 4px !important;/.test(chip[1]),
    'the mode-toggle chips are trimmed too');
});

test('a phone rule for the page wrapper does not hit the header bar', () => {
  // header.jade puts `wrapper` on #header-main-bar on every page that is not a
  // board, so a bare `.wrapper` rule lands on the second header bar as well -
  // which is how "My Boards" ended up centred in it.
  const boardsCss = read('client/components/boards/boardsList.css');
  const phone = boardsCss.slice(boardsCss.indexOf('/* Fix multiple scrollbars issue on mobile */'),
    boardsCss.indexOf('/* Fix multiple scrollbars issue on mobile */') + 9000);
  for (const m of phone.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = m[1].split(',').map(x => x.trim().split('\n').pop().trim());
    assert.ok(!sels.includes('.wrapper'),
      'scope it to `#content .wrapper` - the header bar carries that class too');
  }
  assert.ok(/#content \.wrapper \{/.test(phone), 'and the scoped rule must be there');
});

console.log(`\n${passed} tests passed`);
