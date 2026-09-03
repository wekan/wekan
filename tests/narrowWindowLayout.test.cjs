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

test('the board bar handles its hamburger by WIDTH, not only by mobile mode', () => {
  // The rules used to pin the hamburger to the top-right corner and reserve
  // 44px of end padding for it. That put it beside the TITLE with the row of
  // icons below it; it is the last button at the end of its row now - in the
  // flow, pushed there by an auto start margin - which reads as what it is.
  // What must not come back is the width having NO rules at all: those existed
  // only under `.mobile-mode`, a class the desktop browser never has, so a
  // narrow window kept the desktop bar.
  const at = boardCss.indexOf('/* The same rules by WIDTH, not by mobile mode');
  assert.ok(at !== -1, 'the width-based copy of the mobile-mode rules must be there');
  const block = boardCss.slice(at);
  assert.ok(/@media screen and \(max-width: 800px\)/.test(block));
  const toggle = /#header #header-main-bar \.board-header-sidebar-toggle \{([^}]*)\}/.exec(block);
  assert.ok(toggle, 'the hamburger is placed by width');
  assert.ok(/margin-inline-start: auto;/.test(toggle[1]),
    'it is pushed to the end of whichever row it lands on');
  assert.ok(/position: static;/.test(toggle[1]),
    'and it stays in the flow, so it can never cover a button');
  assert.ok(/\.board-header-btns:not\(\.board-header-sidebar-toggle\) \{[\s\S]*?display: contents;/.test(block),
    'the other button groups are flex items of the bar, so they wrap one by one');
  // The mobile-mode originals stay - both paths have to place it.
  assert.ok(/body\.board-view\.mobile-mode #header #header-main-bar \.board-header-sidebar-toggle \{/
    .test(boardCss));
});

test('the drag-handle toggle is one button on one line', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  // The toggle has TWO rules in this block - one that sizes it like the other
  // buttons and one that keeps it on a single line - so the declarations are
  // looked for across all of them, not in whichever one comes first.
  const bodies = [...block.matchAll(/js-toggle-desktop-drag-handles[^{}]*\{([^}]*)\}/g)]
    .map(m => m[1]);
  assert.ok(bodies.length, 'the toggle must be sized in the phone block');
  const all = bodies.join('\n');
  assert.ok(/white-space: nowrap !important;/.test(all),
    'its arrows and its check/ban are one button, not two lines');
  assert.ok(/display: inline-flex !important;/.test(all));
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

test('the bell and the avatar pack from the start like everything else', () => {
  // These used to be PLACED: the free space of the row was shared around the
  // bell by an auto margin on each side, so it landed midway across, and the
  // avatar kept a fixed gap to the far edge.
  //
  // That is gone. The bar packs from the start and wraps forward at every
  // width - left to right in a left-to-right language, right to left in a
  // right-to-left one, which flexbox does by itself. An item pushed to the far
  // end or centred in the leftover space puts a hole in the middle of the row,
  // and which items land on which side of the hole changes with the window.
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const bell = /#header-quick-access #notifications,([\s\S]*?)\{([\s\S]*?)\}/.exec(block);
  assert.ok(bell, 'the bell must be placed here');
  assert.ok(!/margin-inline-start: auto/.test(bell[2])
    && !/margin-inline-end: auto/.test(bell[2]),
    'nothing centres the bell any more');
  assert.ok(/margin-inline: 0 !important;/.test(bell[2]), 'it packs with the rest');
  const avatar = /#header-quick-access #header-user-bar,([\s\S]*?)\{([\s\S]*?)\}/.exec(block);
  assert.ok(avatar, 'and the avatar');
  assert.ok(/margin-inline-start: 0 !important;/.test(avatar[2]),
    'which is not pushed either');
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
  // The WHOLE media query, brace-matched. It used to be sliced up to the rule that
  // followed `position: absolute` in it - and the hamburger is `position: static`
  // now (it is the last button in the flow, not pinned to the corner), so that
  // landmark was gone and the slice ran from the start of the file.
  const mediaAt = boardCss.indexOf('@media', at);
  assert.notStrictEqual(mediaAt, -1, 'the width rules live in a media query');
  let depth = 0;
  let end = mediaAt;
  for (; end < boardCss.length; end += 1) {
    if (boardCss[end] === '{') depth += 1;
    if (boardCss[end] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  const block = boardCss.slice(at, end + 1);
  // In header.css, for the same file-order reason as the metrics below: the
  // `display: flex` for these groups lives in that file and would otherwise win.
  const hdr = headerCss.slice(headerCss.indexOf('/* The button GROUPS are `display: contents`'));
  assert.ok(hdr, 'the groups must be made contents in the file that wins');
  assert.ok(/\.board-header-btns-group,[\s\S]*?\.board-header-btns:not\(\.board-header-sidebar-toggle\) \{[\s\S]*?display: contents !important;/.test(hdr),
    'the groups are display:contents, so the buttons start beside the title '
    + 'instead of dropping below it as one block');
  assert.ok(/:not\(\.board-header-sidebar-toggle\)/.test(hdr),
    'except the hamburger, whose box is positioned - display:contents would remove it');
  assert.ok(/\.board-header-sidebar-toggle \{[\s\S]*?position: static;[\s\S]*?margin-inline-start: auto;/.test(block),
    'the hamburger is the LAST button, at the right of the last row - in the flow, '
    + 'so it never covers one of the buttons it follows');
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
  assert.ok(/\.mobile-active i\.mobile-icon,/.test(block)
    && /\.desktop-active i\.desktop-icon,/.test(block)
    && /opacity: 1 !important;[\s\S]*?color: #fff !important;/.test(block),
    'the selected Mobile or Desktop icon is explicitly white');
  assert.ok(/\.mobile-active i\.mobile-icon \.fa,/.test(block)
    && /\.desktop-active i\.desktop-icon \.fa,/.test(block)
    && /color: #fff !important;/.test(block),
    'the inner Font Awesome glyph is also explicitly white');
});

test('the drag-handle toggle is not a board button in disguise', () => {
  // `.mobile-mode .board-header-btn` gives every one of those buttons 9px/21px of
  // padding, and the toggle in the TOP bar carries that class - 42px of a 375px
  // row for one icon, which is what pushed the avatar off the edge in mobile mode
  // while desktop mode fitted.
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const rule = /#header-quick-access \.js-toggle-desktop-drag-handles \{([\s\S]*?)\}/.exec(block);
  assert.ok(rule, 'the toggle must be sized in the phone block');
  const pad = /padding:\s*(\d+)px (\d+)px !important/.exec(rule[1]);
  assert.ok(pad && Number(pad[2]) <= 8, `${pad && pad[2]}px of side padding is too much here`);
  assert.ok(/min-width: 0 !important;/.test(rule[1]), 'and no 44px floor from the board bar');
});

test('the board layout follows the MODE, not the window width', () => {
  // A phone whose user chose desktop mode asked for the desktop board.
  const listCss = read('client/components/lists/list.css');
  const stacked = /(\s*)(body\.mobile-mode )?\.list \{[^{}]*display: block !important;/.exec(listCss);
  assert.ok(stacked, 'the stacking rule must exist');
  assert.ok(stacked[2], 'one list per row is the MOBILE MODE layout, not a width');
  const boardBody = read('client/components/boards/boardBody.css');
  assert.ok(/body\.mobile-mode \.board-wrapper \.board-canvas \.swimlane \{[\s\S]*?display: block !important;/.test(boardBody),
    'a swimlane laid out as a BLOCK stacks its lists - that is the phone board');
  assert.ok(/body:not\(\.mobile-mode\) \.board-wrapper \.board-canvas \.swimlane \{[\s\S]*?flex-direction: row !important;/.test(boardBody),
    'and desktop mode keeps the lists side by side, so the add-list form sits at '
    + 'the end of the row - right in LTR, left in RTL, by direction not by side');
  assert.ok(/body:not\(\.mobile-mode\) \.board-wrapper,[\s\S]*?overflow-x: auto !important;/.test(boardBody),
    'with the sideways scroll a desktop board needs');
  const minicard = read('client/components/cards/minicard.css');
  const coarse = minicard.slice(minicard.indexOf('@media (pointer: coarse) {'));
  const handle = /\.minicard \.handle \{([\s\S]*?)\}/.exec(coarse);
  assert.ok(handle, 'the thumb-sized handle must exist');
  assert.ok(/body\.mobile-mode \.minicard \.handle \{/.test(coarse),
    'the full-height thumb column belongs to mobile mode; desktop mode keeps the '
    + 'compact handle in the corner, under the menu button');
});

test('the bell and the avatar are centred in the row', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  // The two PLACEMENT rules - one for the bell, one for the avatar. Each names its
  // `.iphone-device` / `.wrapper ~` variants, and the avatar has a second rule
  // further down that only zeroes its padding, so "every rule mentioning the id"
  // is three, not two. Pick the ones that place the item, by what they declare.
  const rules = [...block.matchAll(/#header-quick-access #(notifications|header-user-bar),[^{]*\{([^}]*)\}/g)]
    .filter(([, , body]) => /margin-block: 0 !important;/.test(body));
  assert.strictEqual(rules.length, 2, 'both must be placed here');
  assert.deepStrictEqual(rules.map(([, id]) => id).sort(),
    ['header-user-bar', 'notifications'], 'one for the bell, one for the avatar');
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

test('eleven board buttons fit two rows on a phone, and stay tappable', () => {
  // Sized in header.css, not boardHeader.css: Meteor loads components/boards/
  // before components/main/, so at equal specificity that file wins and the
  // `margin: 0 6px` there would beat anything written in this one.
  const at = headerCss.indexOf("/* The board bar's buttons, sized HERE");
  assert.ok(at !== -1, 'the metrics must be in the file that wins');
  const block = headerCss.slice(at);
  const btn = /#header #header-main-bar \.board-header-btn \{([\s\S]*?)\}/.exec(block);
  assert.ok(btn, 'the phone metrics for a board button must be there');
  // `margin: 0 2px` - the first value carries no unit, so match both forms.
  const margin = /margin:\s*\d+(?:px)?\s+(\d+)px/.exec(btn[1]);
  const min = /min-width:\s*(\d+)px/.exec(btn[1]);
  assert.ok(margin && min, 'both the side margin and the target size are set');
  const each = Number(min[1]) + 2 * Number(margin[1]);
  const perRow = Math.floor(375 / each);
  assert.ok(Math.ceil(11 / perRow) <= 2,
    `${each}px each fits ${perRow} per row: 11 icons take ${Math.ceil(11 / perRow)} rows`);
  assert.ok(Number(min[1]) >= 44, `a touch target must stay >= 44px, found ${min[1]}`);
  const icon = /#header #header-main-bar \.board-header-btn i\.fa \{([\s\S]*?)\}/.exec(block);
  // `margin: 0` with or without `!important` - the phone block carries the flag on
  // these declarations because the desktop rule they override is more specific.
  assert.ok(icon && /margin:\s*0\s*(!important)?;/.test(icon[1]),
    'the icon inside carried 10px of its own margin - the button box is the target now');
});

console.log(`\n${passed} tests passed`);
