'use strict';

// The shared left menu — docs/Features/Page/Left-Menu.md.
//
// This is the COMBINED suite for that design: the pure helpers, the template, the
// side it appears on (and its mirroring under a right-to-left language), the
// theming, and the layout it shares with the table page. Files under test are the
// ones listed in the Related files table of the design doc.
//
// Every Admin Panel page has the same menu beside its content, and the markup was
// retyped 44 times across seven templates — with, in two of those pages, one
// click handler per entry instead of one per menu.
//
// Run: node tests/leftMenu.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const libSrc = read('models/lib/leftMenu.js');
const jade = read('client/components/settings/leftMenu.jade');
const css = read('client/components/settings/settingBody.css');
const tableCss = read('client/components/settings/tablePage.css');
const doc = read('docs/Features/Page/Left-Menu.md');

const lib = {};
new Function('exports', libSrc.replace(/export function/g, 'function') +
  '\nexports.buildMenuItems = buildMenuItems;\nexports.activeCount = activeCount;' +
  '\nexports.leftMenuData = leftMenuData;\nexports.paneTitle = paneTitle;')(lib);

console.log('leftMenu:');

// ── pure helpers ────────────────────────────────────────────────────────────

test('buildMenuItems marks exactly one entry active', () => {
  const items = lib.buildMenuItems([
    { id: 'a', icon: 'fa-key', labelKey: 'registration' },
    { id: 'b', icon: 'fa-envelope', labelKey: 'email' },
    { id: 'c', icon: 'fa-users', labelKey: 'accounts' },
  ], 'b');
  assert.strictEqual(items.length, 3);
  assert.strictEqual(lib.activeCount(items), 1,
    'a menu must never highlight two rows - that is what per-entry isXActive ' +
    'helpers drift into');
  assert.strictEqual(items[1].active, true);
  assert.strictEqual(items[0].active, false);
});

test('an unknown or missing active id highlights nothing (negative)', () => {
  const items = [{ id: 'a', labelKey: 'x' }, { id: 'b', labelKey: 'y' }];
  assert.strictEqual(lib.activeCount(lib.buildMenuItems(items, 'nope')), 0);
  assert.strictEqual(lib.activeCount(lib.buildMenuItems(items, undefined)), 0);
  assert.strictEqual(lib.activeCount(lib.buildMenuItems(items, '')), 0);
});

test('a numeric id still matches the active id', () => {
  const items = lib.buildMenuItems([{ id: 1, labelKey: 'x' }], '1');
  assert.strictEqual(items[0].active, true, 'compared as strings');
});

test('conditional entries and separators are handled', () => {
  // A page builds its list with holes (the E-mail entry is absent on Sandstorm).
  const items = lib.buildMenuItems([
    { id: 'a', labelKey: 'x' },
    null,
    { separator: true },
    { id: 'b', labelKey: 'y' },
  ], 'b');
  assert.strictEqual(items.length, 3, 'the null hole is dropped, not rendered');
  assert.deepStrictEqual(items[1], { separator: true });
  assert.strictEqual(items[2].active, true);
});

test('buildMenuItems survives junk input (negative)', () => {
  assert.deepStrictEqual(lib.buildMenuItems(null, 'a'), []);
  assert.deepStrictEqual(lib.buildMenuItems(undefined, undefined), []);
  assert.strictEqual(lib.activeCount(null), 0);
  // An entry with no id/icon/label renders as empty strings, not "undefined".
  const [item] = lib.buildMenuItems([{}], '');
  assert.deepStrictEqual(
    { id: item.id, icon: item.icon, labelKey: item.labelKey }, { id: '', icon: '', labelKey: '' });
});

test('the page keeps its own handler class alongside the shared one', () => {
  const [item] = lib.buildMenuItems([{ id: 'a', labelKey: 'x' }], 'a', 'js-setting-menu');
  assert.strictEqual(item.jsClass, 'js-setting-menu');
  // Per-entry override wins, so a page can keep one odd entry on its own handler.
  const [own] = lib.buildMenuItems([{ id: 'a', labelKey: 'x', jsClass: 'js-other' }], 'a', 'js-setting-menu');
  assert.strictEqual(own.jsClass, 'js-other');
});

// ── the template ────────────────────────────────────────────────────────────

test('the template renders the menu once, from the item list', () => {
  assert.ok(/template\(name="leftMenu"\)/.test(jade));
  assert.ok(/\.side-menu/.test(jade) && /each items/.test(jade),
    'one .side-menu, driven by the items');
  assert.ok(/js-left-menu-item/.test(jade),
    'every entry carries the shared handler class');
  assert.ok(/data-id="\{\{id\}\}"/.test(jade), 'the id is what a handler reads');
  assert.ok(/\{\{_ labelKey\}\}/.test(jade), 'labels are i18n keys, not literals');
  assert.ok(/if separator/.test(jade), 'group separators are supported');
});

test('the template pins no physical side', () => {
  // The side comes from the document direction and logical CSS. A physical side
  // in the markup is how you get a right-hand menu whose contents still read
  // left. (The class name js-left-menu-item is a NAME, not a placement.)
  const markup = jade.replace(/^\s*\/\/-.*$/gm, '');
  assert.ok(!/style=/.test(markup), 'no inline styles to hide a side in');
  assert.ok(!/(padding|margin|border)-(left|right)|text-align:\s*(left|right)|float:/.test(markup),
    'no physical side properties in the markup');
});

// ── side and mirroring ──────────────────────────────────────────────────────

test('the menu mirrors under a right-to-left language', () => {
  const menu = css.slice(css.indexOf('.side-menu {'), css.indexOf('.content-body .main-body {'));
  // Physical properties do not flip; logical ones do.
  assert.ok(!/padding-left|padding-right|margin-left|margin-right/.test(menu),
    'use padding-inline-* / margin-inline-*, never the physical side');
  assert.ok(/padding-inline-start/.test(menu),
    'the entry indent must follow the reading direction');
  assert.ok(/margin-inline-end/.test(menu),
    'the gap after the icon must follow the reading direction');
  // An inset shadow offset sideways is physical too - it shaded the wrong inner
  // edge once the menu mirrored to the right.
  assert.ok(!/box-shadow: inset -/.test(menu),
    'an inset shadow must not be offset on the X axis');
});

test('a long menu scrolls inside the panel instead of spilling out of it', () => {
  // Admin Panel / Problems is the longest menu: 15 entries. The panel is a flex item
  // stretched to the row height, so its background, border and rounded corners stop at
  // the bottom of the page - and with the default `overflow: visible` the entries kept
  // rendering past that edge, on the page's grey with no panel behind them.
  const panel = /\.side-menu \{([^}]*)\}/.exec(css);
  assert.ok(panel, 'the panel must be styled');
  assert.ok(/overflow-y:\s*auto/.test(panel[1]),
    'a menu taller than the page must scroll inside its own panel');
  assert.ok(/min-height:\s*0/.test(panel[1]),
    'without min-height:0 a flex item will not shrink below its content, and the '
    + 'overflow never engages');
  // The panel keeps its own background, so whatever is visible always sits on it.
  assert.ok(/background-color:/.test(panel[1]), 'the panel still has its background');
});

test('the design doc states which side, both ways', () => {
  assert.ok(/left-to-right/i.test(doc) && /right-to-left/i.test(doc),
    'both directions must be described');
  assert.ok(/mirror/i.test(doc), 'and that the panel mirrors');
  assert.ok(/dir=rtl/.test(doc), 'naming the mechanism');
});

// ── theme ───────────────────────────────────────────────────────────────────

test('the selected entry looks like the selected tab in the bar above', () => {
  // Filled with the theme colour, label and icon white - the same treatment
  // settingHeader.css gives `.setting-header-btn.active`. Before this the entry kept
  // the panel grey on white, which is easy to miss.
  const fill = /\.side-menu ul li\.active,\s*[^{]*li\.active:hover \{([^}]*)\}/.exec(css);
  assert.ok(fill, 'the selected entry must be filled');
  assert.ok(/background: var\(--theme-accent, #[0-9a-f]{6}\)/.test(fill[1]),
    'a per-user accent fills it, falling back to the WeKan header blue so the menu ' +
    'matches the bar when no colour is chosen');
  // :hover must be in that same selector list. `li:hover` sets white at the SAME
  // specificity and comes later, so without it the fill vanishes under the pointer.
  assert.ok(/li\.active:hover/.test(css),
    'hovering the selected entry must not wash it back to white');
  // Label AND icon go white together. Comments are stripped first: the rule explains
  // in prose why it is not `inherit`, which a naive text search would trip over.
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const text = /\.side-menu ul li\.active > a,\s*[^{]*li\.active > a i \{([^}]*)\}/.exec(code);
  assert.ok(text, 'label and icon must be coloured together');
  assert.ok(/color: #fff/.test(text[1]), 'white on the filled background');
  assert.ok(!/inherit/.test(text[1]),
    'inheriting the panel grey is what made the selected entry invisible');
});

test('the design doc explains the theming', () => {
  assert.ok(/## Theme/.test(doc));
  assert.ok(/--theme-accent/.test(doc) && /Change color/.test(doc),
    'name the per-user override and where it is set');
  assert.ok(/inherit/.test(doc), 'and the fallback that keeps the default look');
});

// ── layout shared with the table page ───────────────────────────────────────

test('narrow windows stack the menu above the content', () => {
  const at = tableCss.indexOf('@media screen and (max-width: 800px)');
  assert.ok(at > 0, 'the stacking rule lives with the table page and covers both');
  const block = tableCss.slice(at);
  assert.ok(/\.side-menu \{[^}]*width:\s*100%/.test(block));
  assert.ok(/\.content-body \{\s*flex-wrap:\s*wrap/.test(block));
});

// ── collapse ────────────────────────────────────────────────────────────────

test('the menu folds away, the same way a list does', () => {
  // xet7: "At top of left menu should be collapse caret. It should work same
  // way like List collapse, so that it collapses left menu."
  const jade = read('client/components/settings/leftMenu.jade');
  assert.ok(/template\(name="leftMenuCollapse"\)/.test(jade), 'there is a caret template');
  const tpl = jade.slice(jade.indexOf('template(name="leftMenuCollapse")'));
  // Down while open, right while folded - exactly what a list's caret does.
  const listJade = read('client/components/lists/listHeader.jade');
  const listCaret = listJade.slice(listJade.indexOf('a.list-collapse-indicator'),
    listJade.indexOf('a.list-collapse-indicator') + 300);
  for (const [what, src] of [['the list', listCaret], ['the left menu', tpl]]) {
    assert.ok(/fa-caret-right/.test(src) && /fa-caret-down/.test(src),
      `${what} draws both carets`);
    assert.ok(src.indexOf('fa-caret-right') < src.indexOf('fa-caret-down'),
      `${what}: collapsed is the RIGHT caret, open is the down one`);
  }
  // ...and the same two words in the tooltip, which already exist. They are
  // built in the helper now, because beside a pane title the label carries the
  // pane's name as well - see the folded test below.
  const js = read('client/components/settings/leftMenu.js');
  assert.ok(/'uncollapse' : 'collapse'/.test(js),
    'named by the same two translations a list uses');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en.collapse && en.uncollapse, 'which are translated');
  assert.ok(/title="\{\{collapseLabel\}\}"/.test(tpl), 'shown as a tooltip');
  assert.ok(/aria-label="\{\{collapseLabel\}\}"/.test(tpl), 'and named for a screen reader');

  // ONE template on BOTH pages, so the two menus cannot end up with two
  // different carets.
  const boards = read('client/components/boards/boardsList.jade');
  assert.ok(/\+leftMenuCollapse/.test(jade) && /\+leftMenuCollapse/.test(boards),
    'both menus draw it');
  // At the TOP of the menu: before the rows, which is where it was asked for.
  for (const [what, src, panel] of [
    ['the Admin Panel', jade, '.side-menu('],
    ['All Boards', boards, '.boards-left-menu'],
  ]) {
    const at = src.indexOf(panel);
    assert.notStrictEqual(at, -1, `${what} draws its menu`);
    const after = src.slice(at);
    assert.ok(after.indexOf('+leftMenuCollapse') < after.indexOf('ul'),
      `${what}: the caret is above the rows`);
  }
  // The element that takes the `collapsed` class differs by page, and that is
  // deliberate - see the folding test below for why the grid takes it on All
  // Boards. What must hold on both is that SOMETHING says when it is folded.
  for (const [what, src, marked] of [
    ['the Admin Panel', jade, '.side-menu('],
    ['All Boards', boards, '.boards-layout('],
  ]) {
    const at = src.indexOf(marked);
    assert.notStrictEqual(at, -1, `${what} marks the folded state`);
    assert.ok(/isLeftMenuCollapsed/.test(src.slice(at, at + 200)),
      `${what}: on the element whose layout changes`);
  }
});

test('the caret can be reached without a mouse', () => {
  // An anchor with no href is not focusable and answers no key by itself, so
  // the menu could otherwise be folded away with a mouse and only with a mouse.
  const jade = read('client/components/settings/leftMenu.jade');
  const tpl = jade.slice(jade.indexOf('template(name="leftMenuCollapse")'));
  assert.ok(/tabindex="0"/.test(tpl), 'it takes keyboard focus');
  assert.ok(/role="button"/.test(tpl), 'and says it is a control, not a link');
  const js = read('client/components/settings/leftMenu.js');
  assert.ok(/'keydown \.js-collapse-left-menu'/.test(js), 'Enter and Space work');
  assert.ok(/evt\.key === 'Enter'/.test(js) && /evt\.key === ' '/.test(js),
    '...which is what role="button" promises');
  const css = read('client/components/settings/settingBody.css');
  assert.ok(/\.left-menu-collapse-indicator:focus-visible \{/.test(css),
    'and the focus is visible');
});

test('the caret that folds it is actually in the bundle', () => {
  // The bug this pins: the caret rendered on both pages and clicking it did
  // NOTHING. leftMenu.jade only DRAWS it - the click handler that folds the
  // menu and the `isLeftMenuCollapsed` helper that says whether it is folded
  // live in leftMenu.js, and package.json sets meteor.mainModule, so a file
  // nobody imports is not in the bundle at all. An unregistered helper is
  // undefined, so the panel never took the `collapsed` class either: a caret
  // with no handler and a menu that could not fold.
  // Same class of bug as the missing adminProblems.css import beside it.
  const feature = read('client/features/settings.js');
  assert.ok(/import '\/client\/components\/settings\/leftMenu\.jade'/.test(feature),
    'the template is loaded');
  assert.ok(/import '\/client\/components\/settings\/leftMenu\.js'/.test(feature),
    'and so is the code behind it, or the caret does nothing');
});

test('the fold is remembered, per user and per browser', () => {
  const utils = read('client/lib/utils.js');
  const fn = utils.slice(utils.indexOf('  getLeftMenuCollapseState() {'),
    utils.indexOf('  getSwimlaneCollapseState('));
  // A Session value, so the fold is instant and survives a re-render without a
  // round trip - the same shape the list collapse above it uses.
  assert.ok(/Session\.get\(LEFT_MENU_COLLAPSED_KEY\)/.test(fn), 'held in a Session value');
  assert.ok(/Session\.set\(LEFT_MENU_COLLAPSED_KEY/.test(fn), 'set before anything is stored');
  const setAt = fn.indexOf('Session.set(LEFT_MENU_COLLAPSED_KEY');
  const callAt = fn.indexOf("Meteor.call('setLeftMenuCollapsed'");
  assert.ok(setAt !== -1 && callAt !== -1 && setAt < callAt,
    'so the menu folds at once rather than after the server answers');

  // Signed in: the user's profile. Signed out: the cookie, the same mechanism
  // the public list and swimlane collapse states use - a public board has this
  // menu too.
  assert.ok(/user\.isLeftMenuCollapsed\(\)/.test(fn), "a user's own setting");
  assert.ok(/Users\.getPublicLeftMenuCollapsed/.test(fn), '...and a cookie when there is none');
  assert.ok(/Users\.setPublicLeftMenuCollapsed/.test(fn), 'written the same way');
  const models = read('models/users.js');
  assert.ok(/Users\.getPublicLeftMenuCollapsed = /.test(models)
    && /Users\.setPublicLeftMenuCollapsed = /.test(models), 'and the cookie pair exists');
  assert.ok(/readCookieMap\('wekan-left-menu-collapsed'\)/.test(models),
    'through the same cookie helpers the other public collapse states use');
  assert.ok(/'profile\.leftMenuCollapsed'/.test(models), 'the profile field is declared');
  assert.ok(/isLeftMenuCollapsed\(\) \{/.test(models), 'and read by a model method');

  // The server method checks its argument before anything else.
  const server = read('server/models/users.js');
  const method = server.slice(server.indexOf('  async setLeftMenuCollapsed(collapsed) {'));
  const body = method.slice(0, method.indexOf('\n  },'));
  assert.ok(/check\(collapsed, Boolean\)/.test(body), 'checked');
  const checkAt = body.indexOf('check(collapsed, Boolean)');
  const returnAt = body.search(/\breturn\b/);
  assert.ok(returnAt === -1 || checkAt < returnAt, 'and nothing returns first');
  assert.ok(/Users\.updateAsync\(this\.userId/.test(body), 'a user folds only their own menu');
});

test('folded, there is no column left at all', () => {
  // xet7: "when left menu is collapsed, there should not be caret to right at
  // small column at left. instead, there should not be a column at all".
  // A strip is still a column: it holds grey, it holds a target that has to be
  // aimed at, and it keeps the page from starting at the window edge.
  const boardsCss = read('client/components/boards/boardsList.css');
  const adminCss = read('client/components/settings/settingBody.css');

  // All Boards is a GRID, and `display: none` takes the element out of the grid
  // but leaves the TRACK it was placed in - so the boards would have sat in the
  // `auto` column with an empty 1fr one beside them. The grid drops to one
  // column, which is why the class is on the grid and not on the menu.
  const grid = boardsCss.slice(boardsCss.indexOf('.boards-layout.collapsed {'));
  const gridRule = grid.slice(0, grid.indexOf('}'));
  assert.ok(/grid-template-columns: 1fr !important;/.test(gridRule),
    'All Boards drops to a single column');
  // `!important`, because the phone rules set both tracks with one of their own:
  // without it a phone would be the one screen still holding an empty column.
  const phone = boardsCss.match(/\.boards-layout \{\n[^}]*grid-template-columns:[^;]*!important/);
  assert.ok(phone, 'the phone rules it has to beat are still there');
  assert.ok(/\.boards-layout\.collapsed > \.boards-left-menu \{\n  display: none;/.test(boardsCss),
    '...and the menu itself is not drawn');
  assert.ok(/grid-template-columns: auto 1fr/.test(boardsCss),
    'open, the track is the menu\'s own width');
  assert.ok(/\.boards-left-menu \{\n(?:[^}]*\n)?  width: var\(--wekan-left-menu-width\);/
    .test(boardsCss), 'which is why the width is on the menu, not on the track');

  // The Admin Panel is a FLEX row, where a hidden item closes the row up by
  // itself, so its own menu takes the class and simply goes.
  const side = adminCss.slice(
    adminCss.indexOf('.setting-content .content-body .side-menu.collapsed {'));
  assert.ok(/^\.setting-content \.content-body \.side-menu\.collapsed \{\n  display: none;\n\}/
    .test(side), 'the Admin Panel menu is not drawn either');

  // Nothing may be left behind pretending to be a folded menu.
  for (const [what, css] of [['All Boards', boardsCss], ['the Admin Panel', adminCss]]) {
    assert.ok(!/collapsed > \*:not\(\.left-menu-collapse-indicator\)/.test(css),
      `${what} keeps no strip holding only the caret`);
    assert.ok(!/\.collapsed \{\n  width: auto;/.test(css),
      `${what} does not merely narrow`);
  }
});

test('folded, the way back is the caret on the pane title', () => {
  // xet7: "caret should be at left side of right page title. when caret+title
  // area is clicked, it shows back left menu."
  const jade = read('client/components/settings/leftMenu.jade');
  const tpl = jade.slice(jade.indexOf('template(name="paneTitle")'),
    jade.indexOf('template(name="leftMenuCollapse")'));
  assert.ok(/if isLeftMenuCollapsed/.test(tpl), 'the heading knows the menu is folded');
  assert.ok(/\+leftMenuCollapse\(paneTitleKey=titleKey paneLabel=label\)/.test(tpl),
    'and hands the caret its own title, so caret and title are ONE target');
  // The caret is FIRST: at the inline start of the title, not after it.
  const caret = read('client/components/settings/leftMenu.jade');
  const collapse = caret.slice(caret.indexOf('template(name="leftMenuCollapse")'));
  assert.ok(collapse.indexOf('fa-caret-right') < collapse.indexOf('left-menu-collapse-title'),
    'the caret comes before the title text');
  // Drawn even for a pane with no title: paneTitle() returns {} when nothing is
  // active, and a folded menu with nothing to unfold it is a menu you have lost.
  const foldedFirst = tpl.indexOf('if isLeftMenuCollapsed');
  const titleFirst = tpl.indexOf('else if titleKey');
  assert.ok(foldedFirst !== -1 && titleFirst !== -1 && foldedFirst < titleFirst,
    'the folded branch is tested BEFORE there is a title to show');

  // Both pages draw that heading, so both have the way back.
  for (const page of [
    'client/components/boards/boardsList.jade',
    'client/components/settings/settingBody.jade',
    'client/components/settings/peopleBody.jade',
    'client/components/settings/attachments.jade',
    'client/components/settings/adminProblems.jade',
  ]) {
    assert.ok(/\+paneTitle\(/.test(read(page)), `${page} draws the pane title`);
  }

  // It reads as the heading it is, with a caret in front - not as a control
  // parked beside one.
  const css = read('client/components/settings/settingBody.css');
  const rule = css.slice(css.indexOf('.admin-pane-title-folded > .left-menu-collapse-indicator {'));
  assert.ok(/font: inherit/.test(rule.slice(0, 300)), 'it keeps the heading font');
  assert.ok(/padding: 0/.test(rule.slice(0, 300)),
    'and starts on the line every other pane title starts on');

  // The action is announced with the pane's name, because an aria-label
  // REPLACES the text inside the element - the bare word would silence the
  // heading.
  const js = read('client/components/settings/leftMenu.js');
  assert.ok(/collapseLabel\(\) \{/.test(js), 'one label for the tooltip and the screen reader');
  assert.ok(/paneTitleKey \? TAPi18n\.__\(data\.paneTitleKey\) : data\.paneLabel/.test(js),
    'which includes the pane it belongs to');
});

// ── dragging its width ──────────────────────────────────────────────────────

test('the menu is resized by dragging its inner edge, like the right sidebar', () => {
  // xet7: "it should be possible to change width of left menu by dragging from
  // right edge, same way that it is possible to change width of right sidebar
  // by dragging from left edge."
  const jade = read('client/components/settings/leftMenu.jade');
  assert.ok(/template\(name="leftMenuResize"\)/.test(jade), 'there is a grip');
  const tpl = jade.slice(jade.indexOf('template(name="leftMenuResize")'));
  assert.ok(/\.left-menu-resize-handle\.js-left-menu-resize/.test(tpl),
    'with the class the drag handler listens on');
  // The board pages drag-scroll on mousedown; without this the drag would pan
  // the page instead of resizing. The right sidebar's grip carries it too.
  assert.ok(/\.nodragscroll/.test(tpl), 'and it does not drag-scroll the page');
  const sidebar = read('client/components/sidebar/sidebar.jade');
  assert.ok(/\.sidebar-resize-handle\.js-sidebar-resize-handle\.nodragscroll/.test(sidebar),
    'which is what the right sidebar does');

  // Drawn on BOTH pages - and for the Admin Panel from inside the shared menu
  // template, so a new pane cannot draw the menu and forget the grip.
  const menuTpl = jade.slice(jade.indexOf('template(name="leftMenu")'),
    jade.indexOf('template(name="leftMenuResize")'));
  assert.ok(/\+leftMenuResize/.test(menuTpl), 'the Admin Panel menu brings its own');
  assert.ok(/\+leftMenuResize/.test(read('client/components/boards/boardsList.jade')),
    'and All Boards draws it beside its own menu');

  const css = read('client/components/settings/settingBody.css');
  const rule = css.slice(css.indexOf('.left-menu-resize-handle {'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.ok(/position: absolute;/.test(body),
    'absolutely positioned, so it is neither a flex item nor a grid item');
  assert.ok(/cursor: col-resize;/.test(body), 'and says what it does');
  // On the INNER edge, by a LOGICAL property: under a right-to-left language the
  // row mirrors, the menu is on the right, and the grip has to mirror with it
  // rather than needing a second rule kept in step.
  assert.ok(/inset-inline-start: calc\(var\(--wekan-left-menu-width\) - 3px\);/.test(body),
    'on the menu\'s inner edge, mirrored under RTL by the property itself');
  assert.ok(!/\bleft:|\bright:/.test(body), 'no physical side, which would not mirror');

  // It has to be positioned against something that does not scroll, or it
  // scrolls away with the entries.
  assert.ok(/\.setting-content \.content-body \{\n(?:[^}]*\n)?  position: relative;/.test(css),
    'the Admin Panel row is the containing block');
  const boardsCss = read('client/components/boards/boardsList.css');
  assert.ok(/\.boards-layout \{\n(?:[^}]*\n)?  position: relative;/.test(boardsCss),
    'and the All Boards grid is');

  // Nothing to drag when there is no edge: folded, or on a phone where the menu
  // is full width above the content.
  assert.ok(/\.boards-layout\.collapsed > \.left-menu-resize-handle,?/.test(css)
    || /\.side-menu\.collapsed ~ \.left-menu-resize-handle/.test(css),
    'folded, the grip goes with the menu');
  const phoneAt = css.indexOf('@media screen and (max-width: 800px) {\n  .left-menu-resize-handle');
  assert.notStrictEqual(phoneAt, -1, 'and a phone has no grip at all');

  // The same page-wide cursor and no-select the right sidebar's drag uses.
  assert.ok(/body\.left-menu-resizing-active \{/.test(css), 'the drag owns the cursor');
  assert.ok(/user-select: none;/.test(css.slice(css.indexOf('body.left-menu-resizing-active'))),
    '...and stops the drag selecting every label it passes over');
});

test('the drag direction mirrors under a right-to-left language', () => {
  const js = read('client/components/settings/leftMenu.js');
  // The menu is at the logical inline START, so its grip is on the inline END:
  // dragging away from that start widens it. RTL mirrors the whole row, so the
  // same widening drag goes the other way - exactly as the right sidebar does
  // it, with the sign flipped by the same test.
  assert.ok(/isRtlLayout\(\) \? -1 : 1/.test(js), 'the delta flips under RTL');
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.ok(/isRtl\(\) \? -1 : 1/.test(sidebar), 'which is how the right sidebar does it');
  assert.ok(/getAttribute\('dir'\) \|\| document\.dir\) === 'rtl'/.test(js),
    'read from the document direction, not guessed at');
});

test('the width is saved per user, and in a cookie when there is no user', () => {
  // xet7: "width of left menu should be saved to per-user profile. for non
  // logged in users, to cookies."
  const utils = read('client/lib/utils.js');
  const get = utils.slice(utils.indexOf('  getLeftMenuWidth() {'),
    utils.indexOf('  setLeftMenuWidth(width) {'));
  const set = utils.slice(utils.indexOf('  setLeftMenuWidth(width) {'),
    utils.indexOf('  getSwimlaneCollapseState('));
  assert.ok(/Session\.get\(LEFT_MENU_WIDTH_KEY\)/.test(get), 'a Session value first');
  assert.ok(/user\.getLeftMenuWidth\(\)/.test(get), "then the user's own profile");
  assert.ok(/Users\.getPublicLeftMenuWidth/.test(get), '...and a cookie when there is none');
  // The Session must NOT cache "no width": the user document is not there on the
  // first render, and a cached undefined would make the key look set, so the
  // profile arriving a moment later would never be picked up.
  assert.ok(/if \(typeof stored === 'number'\) \{\n      Session\.setDefault/.test(get),
    'and only a real width is remembered in the Session');

  const setAt = set.indexOf('Session.set(LEFT_MENU_WIDTH_KEY');
  const callAt = set.indexOf("Meteor.call('setLeftMenuWidth'");
  assert.ok(setAt !== -1 && callAt !== -1 && setAt < callAt,
    'so the menu resizes at once rather than after the server answers');
  assert.ok(/Users\.setPublicLeftMenuWidth/.test(set), 'and the cookie is the signed-out half');

  const models = read('models/users.js');
  assert.ok(/readCookieMap\('wekan-left-menu-width'\)/.test(models),
    'through the same cookie helpers the fold uses');
  assert.ok(/'profile\.leftMenuWidth': \{/.test(models), 'the profile field is declared');
  assert.ok(/type: Number/.test(models.slice(models.indexOf("'profile.leftMenuWidth'"),
    models.indexOf("'profile.leftMenuWidth'") + 500)), '...as a number');
  assert.ok(/getLeftMenuWidth\(\) \{/.test(models), 'and read by a model method');

  // The server clamps: a method is reachable without the drag that clamps.
  const server = read('server/models/users.js');
  const method = server.slice(server.indexOf('  async setLeftMenuWidth(width) {'));
  const mBody = method.slice(0, method.indexOf('\n  },'));
  assert.ok(/check\(width, Number\)/.test(mBody), 'checked');
  assert.ok(/Number\.isFinite\(width\)/.test(mBody),
    'and NaN is refused - it passes check(width, Number) and would store a width no page recovers from');
  assert.ok(/Math\.min\(Math\.max\(width, 120\), 1200\)/.test(mBody), 'and clamped');
  assert.ok(/Users\.updateAsync\(this\.userId/.test(mBody), 'a user resizes only their own menu');
});

test('one width, one number, read by everything that needs it', () => {
  // The menu is a different element on each page and the All Boards grid track
  // has to follow it too, so the width is a custom property on <html> rather
  // than an inline width on one element.
  const js = read('client/components/settings/leftMenu.js');
  assert.ok(/'--wekan-left-menu-width'/.test(js), 'set as a custom property');
  assert.ok(/root\.style\.removeProperty\(LEFT_MENU_WIDTH_PROPERTY\)/.test(js),
    'and removed when nobody has dragged it, so the stylesheet default is the only default');
  assert.ok(/Tracker\.autorun/.test(js),
    'reapplied when the user document arrives, or a saved width never reaches a rendered page');
  assert.ok(/window\.addEventListener\('resize'/.test(js),
    'and reclamped against the window it is shown in');

  const admin = read('client/components/settings/settingBody.css');
  assert.ok(/:root \{\n  --wekan-left-menu-width: 260px;\n\}/.test(admin),
    'the default is a number in the stylesheet');
  assert.ok(/\.side-menu \{\n(?:[^}]*\n)?  width: var\(--wekan-left-menu-width\);/.test(admin),
    'the Admin Panel menu reads it');
  assert.ok(/width: var\(--wekan-left-menu-width\);/
    .test(read('client/components/boards/boardsList.css')), 'and so does the All Boards one');

  // A breakpoint that wants a different DEFAULT overrides the variable, never
  // the width: a rule naming `.side-menu` would beat the dragged width - which
  // arrives as an inline property on <html> - at exactly that one screen size.
  const layouts = read('client/components/main/layouts.css');
  assert.ok(!/\.side-menu \{\s*\n\s*width: \d+px;/.test(layouts),
    'no breakpoint sets the menu width directly');
  assert.ok((layouts.match(/--wekan-left-menu-width: \d+px;/g) || []).length >= 2,
    'they set the default instead');
});

// ── the doc ─────────────────────────────────────────────────────────────────

test('the related-files table lists files that exist', () => {
  assert.ok(doc.includes('| File Path | File Type | Description |'),
    'the related-files table must have those three columns');
  const paths = [...doc.matchAll(/\| `([a-z][\w./-]+\.(?:jade|css|js|cjs))` \|/g)].map(m => m[1]);
  assert.ok(paths.length >= 10, `expected the full file list, found ${paths.length}`);
  for (const rel of paths) {
    assert.ok(fs.existsSync(path.join(root, rel)), `related file missing: ${rel}`);
  }
  assert.strictEqual(new Set(paths).size, paths.length, 'no file listed twice');
});

test('the two page designs cross-link', () => {
  assert.ok(/\[Table\]\(Table\.md\)/.test(doc),
    'Left-Menu.md must link to Table.md - the two compose on the same page');
  assert.ok(fs.existsSync(path.join(root, 'docs/Features/Page/Table.md')));
});

// ── the template and the pages must agree on the data shape ─────────────────

test('what the pages pass is what the template iterates', () => {
  // The whole Admin Panel lost its left menu to this. leftMenu.jade iterates
  // `each items`, and every page handed it the bare ARRAY from buildMenuItems - so
  // Spacebars looked `items` up ON the array, found nothing, and rendered an empty
  // panel on Settings, People, Features, Attachments, Version and Problems alike.
  // Nothing failed: the template was fine, the helper was fine, only the seam between
  // them was wrong. Neither half can be checked alone, so check the seam.
  const iterated = /^\s*each (\w+)\s*$/m.exec(jade);
  assert.ok(iterated, 'the template must iterate a named variable');
  const key = iterated[1];
  const context = lib.leftMenuData([{ id: 'a', labelKey: 'x' }], 'a');
  assert.ok(!Array.isArray(context),
    'a bare array cannot carry a named property for the template to iterate');
  assert.ok(Array.isArray(context[key]),
    `the template iterates \`${key}\`, so the data context must have a \`${key}\` array`);
  assert.strictEqual(context[key].length, 1, 'and it must hold the built entries');
});

test('every page builds its context through that one helper', () => {
  // Six pages, one shape. Calling buildMenuItems directly returns the array again and
  // silently empties that page's menu, so no page may do it.
  const pages = ['settingBody', 'peopleBody', 'attachments', 'adminProblems'];
  for (const page of pages) {
    const src = read(`client/components/settings/${page}.js`);
    const helper = /menuItems\(\) \{[\s\S]*?\n  \},/.exec(src);
    assert.ok(helper, `${page}: must have a menuItems helper`);
    assert.ok(/leftMenuData\(/.test(helper[0]),
      `${page}: must build its context with leftMenuData`);
    assert.ok(!/return buildMenuItems\(/.test(helper[0]),
      `${page}: returning the bare array renders an empty menu`);
  }
});

// ── pages converted to the shared menu ──────────────────────────────────────

test('Admin Panel / Problems renders the shared menu from data', () => {
  const jade = read('client/components/settings/adminProblems.jade');
  // Strip line comments: the collapsed handlers are DESCRIBED in a comment there.
  const js = read('client/components/settings/adminProblems.js').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(/\+leftMenu\(menuItems\)/.test(jade), 'renders the shared menu');
  assert.ok(!/\.side-menu/.test(jade), 'no hand-written .side-menu markup left');
  assert.ok(/PROBLEMS_MENU = \[/.test(js), 'its entries are a data list');
  assert.ok(/leftMenuData\(PROBLEMS_MENU/.test(js), 'built by the shared helper');
  // Twelve identical per-entry handlers collapsed to one on the shared class.
  assert.strictEqual((js.match(/'click a\.js-report-/g) || []).length, 0,
    'the per-entry handlers must be gone');
  assert.strictEqual((js.match(/'click \.js-left-menu-item'/g) || []).length, 1,
    'exactly one menu handler');
  // The active row is rendered from activeReport, so the hand DOM toggling that
  // used to fight a re-render must be gone.
  assert.ok(!/side-menu li\.active'\)\.removeClass/.test(js),
    'no manual active-class toggling');
});

test('the shared menu reproduces each page icon shape', () => {
  // Same styling after conversion: an empty span.emoji-icon (Settings,
  // Features), a coloured wrapper (People / Locked users), or a bare icon.
  assert.ok(/if iconWrapCls/.test(jade) && /if emoji/.test(jade),
    'all three icon shapes must be supported');
  const [plain] = lib.buildMenuItems([{ id: 'a', icon: 'fa-list', labelKey: 'x' }], 'a');
  assert.strictEqual(plain.emoji, false);
  assert.strictEqual(plain.iconWrapCls, '');
  const [emoji] = lib.buildMenuItems([{ id: 'b', icon: 'fa-key', labelKey: 'y', emoji: true }], 'b');
  assert.strictEqual(emoji.emoji, true);
  const [red] = lib.buildMenuItems([{ id: 'c', icon: 'fa-lock', labelKey: 'z', iconWrapCls: 'text-red' }], 'c');
  assert.strictEqual(red.iconWrapCls, 'text-red');
});

test('Settings renders the shared menu too', () => {
  // The menu builders take the current user now: multitenancy option D gives an
  // Organization's own admin a shorter menu (docs/Design/Multitenancy/Multitenancy.md).
  const pages = [
    ['settingBody', 'settingsMenu(', 'js-setting-menu'],
  ];
  for (const [file, list, jsClass] of pages) {
    const pageJade = read(`client/components/settings/${file}.jade`);
    const pageJs = read(`client/components/settings/${file}.js`);
    assert.ok(/\+leftMenu\(menuItems\)/.test(pageJade), `${file}: renders the shared menu`);
    assert.ok(!/\.side-menu/.test(pageJade), `${file}: no hand-written menu markup left`);
    assert.ok(pageJs.includes(`leftMenuData(${list}`), `${file}: built by the shared helper`);
    assert.ok(pageJs.includes(jsClass), `${file}: keeps its own handler class`);
  }
});

test('the Sandstorm exception moved to People with the E-mail pane', () => {
  // Login and E-mail are People panes now, so the entry that is dropped on a
  // Sandstorm deployment lives with them.
  const people = read('client/components/settings/peopleBody.js');
  assert.ok(/isSandstorm \? null :/.test(people),
    'the e-mail entry is still absent on Sandstorm - a dropped null, not empty markup');
  assert.ok(/function peopleMenu\(/.test(people),
    'so the menu is built by a function, which can read Meteor.settings at call time '
    + '(it takes the user now, to drop the tabs a tenant admin may not open)');
  const settings = read('client/components/settings/settingBody.js');
  assert.ok(!/isSandstorm/.test(settings),
    'and Settings no longer needs the check - its conditional entry left');
});

test('Settings still maps every pane it can open to one active id', () => {
  const js = read('client/components/settings/settingBody.js');
  assert.ok(/function activeSettingId/.test(js),
    'the per-pane vars are mapped to ONE active id');
  // Every pane the menu can open must be mapped, or that entry never highlights.
  // No registration-setting/email-setting: those two moved to Admin Panel / People.
  for (const id of ['tableVisibilityMode-setting',
    'announcement-setting', 'accessibility-setting',
    'layout-setting', 'webhook-setting']) {
    assert.ok(js.includes(`'${id}'`), `${id} must be in both the menu and the id map`);
  }
  for (const gone of ['registration-setting', 'email-setting']) {
    assert.ok(!js.includes(`'${gone}'`), `${gone} moved to People and must not linger here`);
  }
});

test('Admin Panel / People renders the shared menu from data', () => {
  const pageJade = read('client/components/settings/peopleBody.jade');
  const pageJs = read('client/components/settings/peopleBody.js').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(/\+leftMenu\(menuItems\)/.test(pageJade), 'renders the shared menu');
  assert.ok(!/\.side-menu/.test(pageJade), 'no hand-written menu markup left');
  // A function rather than a bare array since the E-mail entry it gained is dropped
  // on Sandstorm, which has to be read at call time.
  assert.ok(/function peopleMenu\(user\)/.test(pageJs) && /leftMenuData\(peopleMenu\(/.test(pageJs),
    'its entries are data, built by the shared helper - and take the user, since an '
    + 'Organization\'s own admin gets a shorter menu (multitenancy option D)');
  // Seven near-identical handlers collapsed to one.
  for (const old of ['js-org-menu', 'js-team-menu', 'js-people-menu',
    'js-locked-users-menu', 'js-roles-menu', 'js-templates-menu', 'js-domains-menu']) {
    assert.ok(!pageJs.includes(old), `${old} must be gone`);
  }
  assert.strictEqual((pageJs.match(/'click \.js-left-menu-item'/g) || []).length, 1,
    'exactly one menu handler');
  // The per-pane extras must survive the collapse.
  for (const extra of ['refreshOrgsCount', 'refreshTeamsCount', 'refreshUsersCount']) {
    assert.ok(pageJs.includes(extra), `${extra} must still run on its pane`);
  }
  // Active row from state, not from a hand-toggled class. The page opens on the
  // FIRST entry of the menu this user actually has: Login for the site admin, as
  // before - and Organizations for an Organization's own admin, who has no Login
  // pane (multitenancy option D). One helper decides both, so the open pane and the
  // highlighted row can never disagree.
  assert.ok(/function firstPeoplePaneId\(user\)/.test(pageJs),
    'the first pane of the user\'s own menu');
  assert.ok(/activeMenuId = new ReactiveVar\('registration-setting'\)/.test(pageJs),
    'the open pane is state, and starts on the first entry in the menu');
  assert.ok(/registrationSetting = new ReactiveVar\(true\)/.test(pageJs),
    'and that pane is the one whose var starts true');
  assert.ok(/orgSetting = new ReactiveVar\(false\)/.test(pageJs),
    'the pane that used to open first must no longer also start true');
  // An Organization's own admin has no Login pane, so their page opens elsewhere -
  // decided in an autorun once the user is known, never at onCreated, where the user
  // document has often not arrived yet.
  assert.ok(/this\.openPaneDecided = false;/.test(pageJs)
    && /const openPaneId = firstPeoplePaneId\(user\);/.test(pageJs),
    'the open pane is corrected once, when the user is actually known');
  assert.ok(!/side-menu li\.active'\)\.removeClass/.test(pageJs),
    'no manual active-class toggling');
  assert.ok(/iconWrapCls: 'text-red'/.test(pageJs),
    'Locked users keeps its red lock');
});

test('EVERY Admin Panel page renders the shared menu', () => {
  // The design is only worth having if nothing is left outside it.
  // Translation and Version moved INTO Settings as panes, so neither has a menu of
  // its own any more - they are entries in the Settings menu.
  const pages = ['settingBody', 'peopleBody', 'attachments', 'adminProblems'];
  for (const page of pages) {
    const pageJade = read(`client/components/settings/${page}.jade`);
    assert.ok(/\+leftMenu\(menuItems\)/.test(pageJade), `${page}: renders the shared menu`);
    assert.ok(!/\.side-menu/.test(pageJade), `${page}: no hand-written menu markup left`);
  }
});

test('the Attachments Sandstorm pane is commented out, code and all', () => {
  // It only had content inside a grain - the MongoDB 3 -> FerretDB migration
  // report and a button that DELETED the raw MongoDB 3 files. Compacting the
  // database frees that space too, so the pane is commented out rather than
  // deleted: no menu entry, no template, no helpers, no state, no handler, and
  // nothing of it runs. The grain migration itself is untouched.
  const js = read('client/components/settings/attachments.js');
  const pageJade = read('client/components/settings/attachments.jade');
  const liveJs = js.replace(/^\s*\/\/.*$/gm, '');
  const liveJade = pageJade.replace(/^\s*\/\/-.*$/gm, '');
  assert.ok(/\/\/ \{ id: 'sandstorm', icon: 'fa-hdd-o', label: 'Sandstorm'/.test(js),
    'the menu entry is kept as a comment');
  assert.ok(!/sandstorm/i.test(liveJs),
    'no live line of the page mentions Sandstorm any more');
  assert.ok(!/sandstorm/i.test(liveJade),
    'and its pane is commented out of the template');
  // Everything else on the page keeps working: the storages, their stats, the
  // database migration and Backup.
  for (const kept of ['isBackupActive', 'isDatabaseMigrationActive', 'isGridFsActive',
    'isFilesystemActive', 'isS3Active', 'isMoveActive']) {
    assert.ok(liveJs.includes(kept) && liveJade.includes(kept),
      `${kept} must still be live`);
  }
  // The literal-label path the entry used is still supported by the design, for
  // the next proper noun that needs it.
  assert.ok(/if labelKey[\s\S]*\{\{_ labelKey\}\}[\s\S]*else[\s\S]*\{\{label\}\}/.test(jade),
    'the template falls back to a literal label');
  const [lit] = lib.buildMenuItems([{ id: 's', label: 'Sandstorm' }], 's');
  assert.strictEqual(lit.label, 'Sandstorm');
  assert.strictEqual(lit.labelKey, '');
});

test('no pane repeats the title the section already rendered', () => {
  // The heading comes from the menu entry now, so a pane that also prints its own
  // name shows the same word twice - every Attachments pane did (`h3 Backup` under
  // a title reading "Backup"). A heading that says something the label does not -
  // Limits' "Attachment And API File Size Limits", Locked users' "Brute Force
  // Protection Settings" - is not a repeat, and stays.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const pages = ['settingBody', 'peopleBody', 'attachments', 'adminProblems',
    'informationBody', 'translationBody'];
  // Every menu label rendered anywhere in the Admin Panel.
  const labels = new Set();
  for (const page of ['settingBody', 'peopleBody', 'attachments', 'adminProblems']) {
    const src = read(`client/components/settings/${page}.js`);
    for (const m of src.matchAll(/labelKey: '([\w-]+)'/g)) labels.add(m[1]);
    for (const m of src.matchAll(/label: '([^']+)'/g)) labels.add(m[1]);
  }
  for (const page of pages) {
    const pageJade = read(`client/components/settings/${page}.jade`);
    for (const m of pageJade.matchAll(/^\s*h[1-3] (?:\{\{_ '([\w-]+)'\}\}|(\S.*))$/gm)) {
      const [, key, literal] = m;
      if (key) {
        assert.ok(!labels.has(key),
          `${page}: a heading of {{_ '${key}'}} repeats the menu label above it`);
      } else if (literal) {
        const text = literal.trim();
        assert.ok(!labels.has(text) && !Object.entries(en).some(
          ([k, v]) => labels.has(k) && v === text),
          `${page}: a heading of "${text}" repeats the menu label above it`);
      }
    }
  }
});

test('a heading names a group and cannot be clicked or selected', () => {
  const [heading] = lib.buildMenuItems([{ heading: true, labelKey: 'reports' }], 'reports');
  assert.strictEqual(heading.heading, true);
  assert.strictEqual(heading.labelKey, 'reports');
  // No id, no icon, no handler class - so there is nothing to click, and the page's
  // click handler has no data-id to read even if something reached it.
  assert.strictEqual(heading.id, undefined);
  assert.strictEqual(heading.jsClass, undefined);
  // And it can never be the active row, or a group name could become a pane title.
  assert.strictEqual(heading.active, undefined);
  assert.deepStrictEqual(lib.paneTitle([{ heading: true, labelKey: 'reports' }], 'reports'), {});
  assert.strictEqual(lib.activeCount(lib.buildMenuItems(
    [{ heading: true, labelKey: 'reports' }, { id: 'a', labelKey: 'x' }], 'a')), 1);
  // The template renders it as text in an <li>, with no anchor.
  const block = /else if heading\n([\s\S]*?)\n        else\n/.exec(jade);
  assert.ok(block, 'the template must have a heading branch');
  assert.ok(/li\.left-menu-heading/.test(block[1]), 'as its own row class');
  // The MARKUP, without the jade comments: the comment above this branch explains
  // that a heading has "nothing for the page's click handler to read a data-id
  // from", and a guard that reads comments as markup fails on its own reason.
  const markup = block[1].replace(/^\s*\/\/-.*$/gm, '');
  assert.ok(!/(^|\s)a[.(]/.test(markup) && !/data-id/.test(markup),
    'a heading must not render an anchor or a data-id');
  // ...and it does not light up under the pointer like a row you can open.
  assert.ok(/li\.left-menu-heading:hover \{[^}]*background:\s*transparent/.test(css)
    || /li\.left-menu-separator:hover,\s*\n[^{]*li\.left-menu-heading:hover \{[^}]*background:\s*transparent/.test(css),
    'the heading must opt out of the entry hover highlight');
});

test('the first entry of a menu is the pane that opens', () => {
  // Settings opens on Version, Attachments on Backup: the row at the top of the
  // menu and the pane on the right must be the same one, or the page opens with a
  // pane nobody chose while the menu highlights a different row.
  const firstId = (src, fn) => {
    // `function peopleMenu(user)` - a builder may take the current user, to drop
    // the panes a tenant admin may not open.
    const found = new RegExp(`function ${fn}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`).exec(src);
    assert.ok(found, `${fn} must exist`);
    const menu = found[0];
    return /id: '([\w-]+)'/.exec(menu)[1];
  };
  const attachments = read('client/components/settings/attachments.js');
  assert.strictEqual(firstId(attachments, 'attachmentsMenu'), 'backup',
    'Backup must be the first Attachments entry');
  assert.ok(/this\.activeSection = new ReactiveVar\('backup'\)/.test(attachments),
    'and the section the page opens on');
  const settings = read('client/components/settings/settingBody.js');
  assert.strictEqual(firstId(settings, 'settingsMenu'), 'version-setting',
    'Version must be the first Settings entry');
});

test('Translation is a Settings pane, not a page of its own', () => {
  const js = read('client/components/settings/settingBody.js');
  const jadeSrc = read('client/components/settings/settingBody.jade');
  assert.ok(/id: 'translation-setting'/.test(js), 'it is an entry in the Settings menu');
  assert.ok(/\+translationSettings/.test(jadeSrc), 'and Settings renders the pane');
  // The old top-level tab and its helper are gone.
  const header = read('client/components/settings/settingHeader.jade');
  assert.ok(!/pathFor 'translation'/.test(header), 'the Admin Panel tab must be gone');
  assert.ok(!/isTranslationActive/.test(read('client/components/settings/settingHeader.js')));
  // The pane carries the state that feeds its table - a child template cannot
  // see a parent page that no longer renders it.
  const body = read('client/components/settings/translationBody.js');
  assert.ok(/Template\.translationSettings\.onCreated/.test(body));
  assert.ok(!/Template\.translation\./.test(body), 'the old page template must be gone');
  // The URL still resolves, redirecting rather than rendering a dead template.
  const router = read('config/router.js');
  assert.ok(!/content: 'translation'/.test(router), 'it must not render the old template');
  // `redirect(...)` inside triggersEnter, which is FlowRouter's own way to send
  // a route somewhere else; a `FlowRouter.go` in a trigger re-enters the router
  // instead of replacing the navigation.
  //
  // It used to redirect to /setting and hand the pane over in a Session value.
  // Every pane HAS a URL now, so it redirects to that pane's own address -
  // /admin/settings/translation - and a bookmark lands somewhere it can stay.
  assert.ok(/redirect\(adminPath\('settings', 'translation-setting'\)\)/.test(router),
    'a bookmark must land on the Translation pane, by its own URL');
  const { adminPath } = require('../models/lib/adminUrls');
  assert.strictEqual(adminPath('settings', 'translation-setting'),
    '/admin/settings/translation', 'which is what that URL is');
});

// ── the pane title: every Admin Panel pane has one, and they are identical ──

test('paneTitle returns the ACTIVE entry label, in either of its two forms', () => {
  const menu = [
    { id: 'a', labelKey: 'people' },
    { id: 'b', labelKey: 'teams' },
    { id: 'c', label: 'Sandstorm' },
  ];
  assert.deepStrictEqual(lib.paneTitle(menu, 'b'), { titleKey: 'teams', label: '' });
  // A literal label (a proper noun) comes back as a label, not as an i18n key.
  assert.deepStrictEqual(lib.paneTitle(menu, 'c'), { titleKey: '', label: 'Sandstorm' });
});

test('paneTitle gives nothing rather than an empty heading (negative)', () => {
  // No selection, an id that is not in the menu, junk: a page renders NO title
  // rather than an empty <h1> with a stray margin under it.
  assert.deepStrictEqual(lib.paneTitle([{ id: 'a', labelKey: 'x' }], 'nope'), {});
  assert.deepStrictEqual(lib.paneTitle([], 'a'), {});
  assert.deepStrictEqual(lib.paneTitle(null, undefined), {});
  // A separator can never become a title.
  assert.deepStrictEqual(lib.paneTitle([{ separator: true }], ''), {});
});

test('the title template renders the active label, and only when there is one', () => {
  const at = jade.indexOf('template(name="paneTitle")');
  assert.ok(at > 0, 'the shared title template must exist beside the menu');
  const tpl = jade.slice(at);
  assert.ok(/if titleKey/.test(tpl) && /else if label/.test(tpl),
    'both forms of an entry label must render');
  assert.ok(/h1\.admin-pane-title/.test(tpl), 'one class, so every pane title matches');
  // Three branches now, not two: the folded one comes first and carries the
  // caret that brings the menu back, and it is drawn even with no title at all.
  assert.strictEqual((tpl.match(/h1\./g) || []).length, 3,
    'the heading exists once per branch and nowhere else');
  assert.strictEqual((tpl.match(/h1\.admin-pane-title/g) || []).length, 3,
    'and every branch is the same heading');
});

test('EVERY Admin Panel page renders the shared pane title', () => {
  // The point of deriving it from the menu: no pane can end up without a heading,
  // or with one of its own size. Before this only the table pages had a title.
  const pages = ['settingBody', 'peopleBody', 'attachments', 'adminProblems'];
  for (const page of pages) {
    const pageJade = read(`client/components/settings/${page}.jade`);
    const pageJs = read(`client/components/settings/${page}.js`);
    assert.ok(/\+paneTitle\(paneTitleData\)/.test(pageJade),
      `${page}: must render +paneTitle(paneTitleData) inside .main-body`);
    // ...as the FIRST thing in the pane, above whatever is showing.
    const body = pageJade.indexOf('.main-body');
    assert.ok(pageJade.indexOf('+paneTitle(paneTitleData)') > body,
      `${page}: the title belongs inside .main-body`);
    // Blaze resolves a name against the CURRENT template, so the helper has to be
    // registered on the template that renders it - not on an enclosing one.
    assert.ok(/paneTitleData\(\) \{[\s\S]*?paneTitle\(/.test(pageJs),
      `${page}: paneTitleData must call the shared paneTitle helper`);
    assert.ok(/import \{[^}]*paneTitle[^}]*\} from '\/models\/lib\/leftMenu'/.test(pageJs),
      `${page}: paneTitle must be IMPORTED - an undeclared name throws inside the `
      + 'helper at render time, and Blaze answers that by rendering nothing');
  }
});

test('the pane title has ONE size, shared with the table page', () => {
  const rule = /\.admin-pane-title \{([^}]*)\}/.exec(css);
  assert.ok(rule, '.admin-pane-title must be styled in the shared admin stylesheet');
  assert.ok(/font-size:/.test(rule[1]) && /font-weight:/.test(rule[1]),
    'size and weight are what make every pane title match');
  assert.ok(/color:\s*inherit/.test(rule[1]),
    'it must inherit its colour so it stays readable on a dark theme');
  // The shared table page uses the same class on its own title, so a table pane
  // and a form pane look the same.
  const tableJade = read('client/components/settings/tablePage.jade');
  assert.ok(/h1\.table-page-title\.admin-pane-title/.test(tableJade),
    'the table page title must carry the shared class too');
});

test('a table page inside the Admin Panel does not print the title twice', () => {
  // The section renders the heading for every pane, so a table page there must
  // pass no titleKey - and the template must render one only if it is given.
  const tableJade = read('client/components/settings/tablePage.jade');
  assert.ok(/if titleKey\n\s+h1\./.test(tableJade),
    'the table page title is conditional, not unconditional markup');
  for (const [file, panes] of [
    ['peopleBody', ["titleKey: 'people'", "titleKey: 'teams'", "titleKey: 'organizations'", 'titleKey: "domains"']],
    ['adminProblems', ['titleKey: spec.titleKey', 'title: TAPi18n.__(eventStreamTitleKey']],
    ['translationBody', ["titleKey: 'translation'"]],
  ]) {
    const src = read(`client/components/settings/${file}.js`);
    for (const gone of panes) {
      assert.ok(!src.includes(gone),
        `${file}: ${gone} would print the pane heading a second time`);
    }
  }
});

test('the doc explains where a pane title comes from', () => {
  const at = doc.indexOf('## The pane title');
  assert.ok(at > 0, 'the design doc must have a pane-title section');
  const section = doc.slice(at, doc.indexOf('## Entries'));
  assert.ok(/paneTitle\(items, activeId\)/.test(section), 'it must name the helper');
  assert.ok(/admin-pane-title/.test(section), 'and the one class that sizes it');
  assert.ok(/Table\.md/.test(section), 'and link to the table page that shares it');
  assert.ok(/no.*titleKey/i.test(section),
    'and say why a table page inside the Admin Panel passes no title');
});

test('Version is the FIRST Settings pane, and has no page of its own', () => {
  const js = read('client/components/settings/settingBody.js');
  const jadeSrc = read('client/components/settings/settingBody.jade');
  // First entry in the menu, and the pane that opens with the page: Admin Panel
  // opens on Settings, so this is what an admin sees first.
  const menu = /function settingsMenu\(user\) \{[\s\S]*?\n\}/.exec(js)[0];
  const ids = [...menu.matchAll(/id: '([\w-]+)'/g)].map(m => m[1]);
  assert.strictEqual(ids[0], 'version-setting', 'Version must be the first entry');
  // …and the pane that is open when the page loads.
  assert.ok(/this\.versionSetting = new ReactiveVar\(true\)/.test(js),
    'and the pane that is open when the page loads');
  assert.ok(/this\.tableVisibilityModeSetting = new ReactiveVar\(false\)/.test(js),
    'so Visibility does not open by default');
  // Multitenancy option D added one caller who has no Version pane - an
  // Organization's own admin - and that is decided in an AUTORUN, not here: at
  // onCreated the user document has often not arrived, so reading it made "is this
  // the site admin?" false for everyone for a moment and the page opened on
  // Visibility for the site admin too.
  assert.ok(/this\.openPaneDecided = false;/.test(js) && /if \(!user \|\| this\.openPaneDecided\) return;/.test(js),
    'the open pane is corrected once, when the user is actually known');
  assert.ok(/if \(!tenantAdmin\.isSiteAdmin\(user\)\) \{[\s\S]*?this\.versionSetting\.set\(false\);/.test(js),
    'and only for an admin who has no Version pane');
  assert.ok(/\+statistics/.test(jadeSrc), 'Settings renders the statistics pane');
  // The old page, its tab and its menu are gone; the URL redirects.
  const info = read('client/components/settings/informationBody.jade');
  assert.ok(!/template\(name='information'\)/.test(info), 'the page template is gone');
  assert.ok(!/\+leftMenu/.test(info), 'and with it the one-entry menu');
  assert.ok(/template\(name='statistics'\)/.test(info), 'the pane itself stays');
  const header = read('client/components/settings/settingHeader.jade');
  assert.ok(!/pathFor 'information'/.test(header), 'the Admin Panel tab must be gone');
  assert.ok(!/isInformationActive/.test(read('client/components/settings/settingHeader.js')));
  const router = read('config/router.js');
  assert.ok(!/content: 'information'/.test(router), 'it must not render the old template');
  const route = router.slice(router.indexOf("FlowRouter.route('/information'"));
  // `redirect(...)` in triggersEnter - FlowRouter's own way to send a route
  // elsewhere; a `FlowRouter.go` inside a trigger re-enters the router instead
  // of replacing the navigation. Same as /translation above, and like it, it
  // redirects to the pane's OWN URL now rather than handing the pane over in a
  // Session value.
  assert.ok(/redirect\(adminPath\('settings', 'version-setting'\)\)/.test(route.slice(0, 400)),
    'a bookmarked /information must land on the Version pane, by its own URL');
  const { adminPath } = require('../models/lib/adminUrls');
  assert.strictEqual(adminPath('settings', 'version-setting'),
    '/admin/settings/version',
    'which names the pane rather than leaving the first one implicit');
});

console.log(`\nleftMenu: ${passed} tests passed`);
