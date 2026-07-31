'use strict';

// The top header: one colour, the page's own name, and one hamburger.
//
// Three things it was not:
//   * the two bars were two shades of the theme, so the header read as two
//     headers stacked;
//   * the first bar said "All Boards" on every page, whatever page it was - the
//     one bar that is always on screen named a place you were not;
//   * the sidebar hamburger was at the end of the SECOND bar, which is the bar
//     whose contents are moving into the sidebar it opens.
//
// Run: node tests/headerBars.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/main/header.jade');
const js = read('client/components/main/header.js');
const colors = read('client/components/boards/boardColors.css');

const { PAGE_TITLE_KEYS, pageTitleKey, headerTitle } = require('../models/lib/pageTitles');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('headerBars:');

test('both bars are the same colour, in every theme', () => {
  // The PROPERTY, not the spelling: what colour does each bar end up? Most
  // themes get there by naming the quick-access bar in the selector list the
  // main bar already has - one hex to keep right rather than two - but a couple
  // say it their own way, and that is fine as long as the answer matches.
  const bg = which => {
    const out = {};
    for (const rule of colors.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const [, selector, body] = rule;
      const decl = /background(?:-color)?:\s*(#[0-9a-fA-F]+)/.exec(body);
      if (!decl) continue;
      for (const m of selector.matchAll(new RegExp(`\\.board-color-([\\w-]+)${which}(?![-\\w])`, 'g'))) {
        if (out[m[1]] === undefined) out[m[1]] = decl[1].toLowerCase();
      }
    }
    return out;
  };
  const main = bg('#header');
  const quick = bg('#header-quick-access');
  const themes = Object.keys(main);
  assert.ok(themes.length >= 15, `expected every theme, found ${themes.length}`);
  for (const t of themes) {
    assert.strictEqual(quick[t], main[t],
      `${t}: the two bars must be one colour`);
  }
  // The unthemed default, too.
  const header = read('client/components/main/header.css');
  const mainDefault = /^#header \{[^}]*background: (#[0-9a-f]+);/m.exec(header);
  const quickDefault = /^#header-quick-access \{[\s\S]*?background: (#[0-9a-f]+);/m.exec(header);
  assert.ok(mainDefault && quickDefault, 'both bars must declare a background');
  assert.strictEqual(quickDefault[1], mainDefault[1], 'and it must be the same one');
});

test('the first bar names the page, not "All Boards"', () => {
  // The house is still the link home; the text beside it is where you ARE.
  assert.ok(/a\(href="\{\{pathFor 'home'\}\}" title="\{\{_ 'all-boards'\}\}"\)/.test(jade),
    'the home link keeps its name as a tooltip');
  assert.ok(/span\.header-page-title/.test(jade), 'and the title has its own element');
  const home = jade.slice(jade.indexOf('span.home-icon.allBoards'), jade.indexOf('// Logo'));
  assert.ok(!/\|\s*\{\{_ 'all-boards'\}\}/.test(home),
    'the literal "All Boards" label must be gone');
});

test('a board title is printed as TEXT, a page title through the translator', () => {
  // A board called "settings" is not the Admin Panel: user text must never go
  // through {{_ }}, and a translation key must.
  assert.ok(/if headerTitleKey\n\s+\| \{\{_ headerTitleKey\}\}/.test(jade),
    'a page title is translated');
  assert.ok(/else\n\s+= headerTitleText/.test(jade), 'a board title is not');
  assert.ok(/headerTitleKey\(\) \{/.test(js) && /headerTitleText\(\) \{/.test(js),
    'both helpers must exist');
});

test('and the title rule itself is pure, so it can be tested', () => {
  // A board wins wherever there is one.
  assert.deepStrictEqual(headerTitle('board', 'My Board'), { title: 'My Board' });
  assert.deepStrictEqual(headerTitle('home', ''), { key: 'all-boards' });
  // The Admin Panel carries a second segment - it is four pages under one
  // name, and the name alone does not say which one you opened.
  assert.deepStrictEqual(headerTitle('setting', null),
    { key: 'admin-panel', subKey: 'settings' });
  assert.deepStrictEqual(headerTitle('archive', undefined), { key: 'archived-boards' });
  // A blank board title is not a title.
  assert.deepStrictEqual(headerTitle('home', '   '), { key: 'all-boards' });
  // A route nobody mapped shows nothing rather than the wrong thing.
  assert.deepStrictEqual(headerTitle('nonsense', null), {});
  assert.strictEqual(pageTitleKey('nonsense'), null);

  // Every key must be a real translation key.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const [route, key] of Object.entries(PAGE_TITLE_KEYS)) {
    assert.ok(key in en, `${route} -> ${key} is not a translation key`);
  }
  // And every route named here must be a route that exists.
  const router = read('config/router.js');
  for (const route of Object.keys(PAGE_TITLE_KEYS)) {
    assert.ok(router.includes(`name: '${route}'`), `${route} is not a route`);
  }
});

test('the hamburger is in the first bar, right of the username', () => {
  const bar = jade.slice(0, jade.indexOf('#header.nodragscroll'));
  const user = bar.indexOf('+headerUserBar');
  const burger = bar.indexOf('js-toggle-page-sidebar');
  assert.notStrictEqual(user, -1, 'the user bar must be in the first bar');
  assert.notStrictEqual(burger, -1, 'and so must the hamburger');
  assert.ok(user < burger, 'the hamburger comes after the username');
  assert.ok(/\.board-header-btns\.header-sidebar-toggle\n\s+\.separator\n\s+a\.board-header-btn\.js-toggle-page-sidebar/.test(bar),
    'divider then hamburger, as the board header had them');
});

test('and it opens whichever sidebar the page has', () => {
  const at = js.indexOf("'click .js-toggle-page-sidebar'");
  assert.notStrictEqual(at, -1, 'the hamburger must be handled');
  const body = js.slice(at, at + 500);
  assert.ok(/getSidebarInstance\(\)/.test(body), "a board toggles the board's own");
  assert.ok(/toggleAllBoardsSidebar\(\)/.test(body), 'every other page the shared one');
  assert.ok(/Utils\.getCurrentBoardId\(\)/.test(body), 'and it is the board that decides');
});

test('the Admin Panel tabs are icons, in the first bar, left of the bell', () => {
  // They were a row of LABELLED buttons in a second header bar of their own.
  // They are navigation between the panel's four pages rather than controls of
  // one, so they did not belong in a right sidebar with a page's controls -
  // they belong where you can always see which of the four you are on.
  const tabs = read('client/components/settings/settingHeader.jade');
  assert.ok(/template\(name="adminPanelTabs"\)/.test(tabs), 'the tabs are their own template');
  assert.ok(!/template\(name="settingHeaderBar"\)/.test(tabs), 'and the old bar is gone');
  assert.ok(!/settingHeaderBar/.test(read('config/router.js')), 'with no route naming it');

  // Icon only, named by a tooltip: the first bar is one row shared with the
  // logo, the starred boards and the user menu.
  const block = tabs.slice(tabs.indexOf('template(name="adminPanelTabs")'));
  const buttons = [...block.matchAll(/^\s+a\.board-header-btn\.[\w-]+\(([^)]*)\)$/gm)];
  assert.strictEqual(buttons.length, 4, `four tabs, found ${buttons.length}`);
  for (const b of buttons) {
    assert.ok(/title="\{\{_ '[\w-]+'\}\}"/.test(b[1]), 'each is named by a translated tooltip');
    assert.ok(/href="\{\{pathFor '[\w-]+'\}\}"/.test(b[1]), 'and links by route name');
  }
  assert.ok(!/span \{\{_ '(settings|people|attachments|problems)'\}\}/.test(block),
    'and carries no visible label');

  // Before the bell, in the first bar.
  const header = read('client/components/main/header.jade');
  const tabsAt = header.indexOf('+adminPanelTabs');
  const bellAt = header.indexOf('+notifications');
  assert.notStrictEqual(tabsAt, -1, 'the first bar renders them');
  assert.ok(tabsAt < bellAt, 'to the LEFT of the notification bell');
  assert.ok(tabsAt < header.indexOf('#header.nodragscroll'), 'in the FIRST bar');
  assert.ok(/if isAdminPanel\n\s+\+adminPanelTabs/.test(header),
    'and only in the Admin Panel');

  // ...which is its four routes, from the one place that lists them.
  const { ADMIN_PANEL_ROUTES } = require('../models/lib/adminUrls');
  assert.deepStrictEqual(ADMIN_PANEL_ROUTES,
    ['setting', 'people', 'admin-reports', 'attachments']);
  const { PAGE_TITLE_KEYS } = require('../models/lib/pageTitles');
  for (const route of ADMIN_PANEL_ROUTES) {
    assert.strictEqual(PAGE_TITLE_KEYS[route], 'admin-panel',
      `${route}: the first bar must say "Admin Panel" there`);
  }
});

test('the view menus are in the first bar, whichever page has one', () => {
  // A view menu says what you are looking AT, so it belongs beside the page's
  // name in the bar that is always on screen - not in a second bar (where the
  // board's was) and not behind a panel you have to open (where All Boards'
  // was for one step).
  assert.ok(/if isBoardPage\n\s+\+boardViewMenu/.test(jade), "a board's view menu");
  assert.ok(/else if isAllBoardsPage\n\s+\+allBoardsViewMenu/.test(jade), "and All Boards'");
  // One or the other, never both: they are alternatives, not a pair.
  assert.ok(jade.indexOf('+boardViewMenu') < jade.indexOf('+allBoardsViewMenu'),
    'the board branch comes first');
  // In the FIRST bar, and before the bell like the Admin Panel tabs.
  assert.ok(jade.indexOf('+boardViewMenu') < jade.indexOf('#header.nodragscroll'),
    'in the first bar');
  assert.ok(jade.indexOf('+boardViewMenu') < jade.indexOf('+notifications'),
    'left of the notification bell');

  // Each is its own template, with its handler on it - a Blaze event map only
  // sees events inside its OWN template.
  const boardJade = read('client/components/boards/boardHeader.jade');
  assert.ok(/template\(name="boardViewMenu"\)/.test(boardJade), 'the board menu is a template');
  assert.ok(/unless currentBoard\.isTemplatesBoard/.test(
    boardJade.slice(boardJade.indexOf('template(name="boardViewMenu")'))),
    'and still not offered on a templates board');
  assert.ok(/Template\.boardViewMenu\.events/.test(read('client/components/boards/boardHeader.js')),
    'handled where it is drawn');
  assert.ok(/Template\.allBoardsViewMenu\.events/.test(read('client/components/boards/boardsList.js')),
    'and so is the All Boards one');

  // Neither is left in the place it came from.
  assert.ok(!/js-toggle-board-view/.test(
    boardJade.slice(0, boardJade.indexOf('template(name="boardViewMenu")'))),
    "the board's second bar must not still draw it");
  assert.ok(!/js-open-all-boards-view/.test(read('client/components/boards/allBoardsSidebar.jade')),
    'and the All Boards sidebar must not still have it as a row');
});

test('starred boards are a dropdown, not a row of links', () => {
  // The bar listed every starred board inline. That is the widest thing in it
  // and it grows with the number of boards you star, so the bar could not stay
  // one row. It is one button now, and the names are in the popup it opens.
  assert.ok(/a\.board-header-btn\.js-open-starred-boards/.test(jade), 'one button');
  const btn = jade.slice(jade.indexOf('js-open-starred-boards'));
  const head = btn.slice(0, btn.indexOf('\n\n'));
  // Laid out like the view menu beside it: the caret FIRST, then what the
  // button is about.
  assert.ok(head.indexOf('fa-caret-down') < head.indexOf('fa-star'),
    'the caret is to the left of the star');
  assert.ok(/title="\{\{_ 'starred-boards'\}\}"/.test(head), 'named by a tooltip');

  // The names are in a popup, shaped like the view menu's.
  assert.ok(/template\(name="starredBoardsPopup"\)/.test(jade), 'the popup exists');
  const popup = jade.slice(jade.indexOf('template(name="starredBoardsPopup")'));
  assert.ok(/ul\.pop-over-list/.test(popup), 'a pop-over list, like boardChangeViewPopup');
  assert.ok(/each currentUser\.starredBoards/.test(popup), 'listing the starred boards');
  assert.ok(/pathFor 'board' id=_id slug=slug/.test(popup), 'each one a link to it');
  assert.ok(/fa-check/.test(popup), 'with a check on the one you are looking at');
  assert.ok(/else\n\s+li\.no-items-message/.test(popup), 'and something to say when none are');
  assert.ok(/'click \.js-open-starred-boards': Popup\.open\('starredBoards'\)/.test(js),
    'and the button opens it');

  // The inline list is gone from the bar - except on a phone INSIDE a list,
  // where it shows that board's LISTS, which is a different thing.
  const lists = jade.slice(jade.indexOf('if isMiniScreen'), jade.indexOf('#header-new-board-icon'));
  assert.ok(/each currentBoard\.lists/.test(lists), 'the phone list switcher stays');
  assert.ok(!/each currentUser\.starredBoards/.test(
    jade.slice(0, jade.indexOf('template(name="starredBoardsPopup")'))),
    'but no starred board is listed inline any more');

  // Full width on a phone comes from the popup system, not from anything here.
  const popupCss = read('client/components/main/popup.css');
  assert.ok(/body\.mobile-mode \.pop-over \{[^}]*width: 100vw/.test(popupCss),
    'body.mobile-mode makes every pop-over full width');
});

test('the header imports no page module, whatever it needs from one', () => {
  // The header is rendered by the layout, so it loads very early. Importing a
  // page's own module pulls that module into the header's graph and runs it
  // BEFORE its .jade has registered - `Template.import.onCreated` was
  // `undefined.onCreated`, a TypeError at module load, and a module that throws
  // aborts every module after it. That is how `connectionMethod` and the rest
  // went missing at the same time, from one bad import.
  const bad = [...js.matchAll(/import[^;]*from '(\/client\/components\/[^']+)'/g)]
    .map(m => m[1]);
  assert.deepStrictEqual(bad, [],
    'the header must not import a page module: ' + bad.join(', '));

  // What it needs from three pages - their own names - comes from a module that
  // registers no template and touches no DOM, so it is safe to load early.
  assert.ok(/from '\/client\/lib\/pageTitleSources'/.test(js),
    'the custom titles come from a side-effect-free module');
  // On the CODE: the module's comment explains the bug by naming
  // `Template.import.onCreated`, and a guard that greps the whole file reads
  // its own explanation.
  const sources = read('client/lib/pageTitleSources.js');
  const code = sources.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/Template\./.test(code), 'which registers no template');
  for (const fn of ['supportPageTitle', 'accessibilityPageTitle', 'importPageTitle']) {
    assert.ok(new RegExp(`export function ${fn}\\(`).test(sources), `${fn} lives there`);
  }
  // ...and the pages use that same one rather than each defining its own.
  for (const page of ['client/components/main/support.js',
    'client/components/main/accessibility.js']) {
    assert.ok(/from '\/client\/lib\/pageTitleSources'/.test(read(page)),
      `${page} must share it`);
    assert.ok(!/export function \w+PageTitle/.test(read(page)),
      `${page} must not define a second copy`);
  }
});

test('the second bar renders only where a page still has one', () => {
  // Most pages have none now - their title is in the bar above and their
  // controls are in a sidebar - and `#header` is a coloured block with a height
  // of its own, so without a check it painted a tall empty strip under the first
  // bar on every one of them.
  assert.ok(/if headerBar\n\s+#header\.nodragscroll/.test(jade),
    'the second bar is behind a check for one');
  const css = read('client/components/main/header.css');
  assert.ok(/^#header \{[^}]*background:/m.test(css),
    'and it is a coloured block, which is why an empty one shows');
});

test('and the controls that moved into the first bar are styled for it', () => {
  // Every rule that styles a `.board-header-btn` was scoped to
  // `#header-main-bar` - the SECOND bar. The view menu, the starred-boards
  // dropdown, the Admin Panel tabs and the hamburger are in the FIRST bar, so
  // they had no padding, no height and no line-height: cramped bare glyphs.
  const css = read('client/components/main/header.css');
  const at = css.indexOf('#header-quick-access .board-header-btn {');
  assert.notStrictEqual(at, -1, 'the first bar must style its buttons');
  const rule = css.slice(at, css.indexOf('}', at));
  for (const prop of ['padding:', 'height:', 'line-height:', 'align-items:']) {
    assert.ok(rule.includes(prop), `${prop} must be given`);
  }
  assert.ok(/#header-quick-access \.separator \{/.test(css),
    'and the divider before the hamburger');
});

test('the bar wraps rather than clipping, and its end group hugs the end', () => {
  const css = read('client/components/main/header.css');
  // The bar itself: no rule on it may stop the wrap or clip what wrapped.
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = rule[1].split(',').map(x => x.trim()).filter(Boolean);
    if (!sels.some(x => /#header-quick-access$/.test(x))) continue;
    // On the DECLARATIONS, not the comments: the rules that replaced these
    // explain themselves by naming `nowrap` and `overflow: hidden`, and a guard
    // that greps the whole body reads its own explanation. This is the fifth
    // time that has bitten in this session.
    const body = rule[2].replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/flex-wrap:\s*nowrap/.test(body),
      `${sels.join(', ')} forces one row - the buttons that do not fit vanish`);
    assert.ok(!/overflow:\s*hidden/.test(body),
      `${sels.join(', ')} clips what the wrap put on the second row`);
    assert.ok(!/(^|[\s;])height:\s*\d/.test(body),
      `${sels.join(', ')} pins a height - a content box cannot hold two rows`);
  }

  // The end group: right in LTR, left in RTL, from ONE logical property.
  const at = css.indexOf('#header-quick-access .header-quick-access-end {');
  assert.notStrictEqual(at, -1, 'the end group must be styled');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(/margin-inline-start:\s*auto/.test(rule),
    'pushed to the end with a LOGICAL margin, so RTL mirrors by itself');
  assert.ok(!/margin-left/.test(rule), 'never a physical one - it would not mirror');
  assert.ok(/flex-wrap:\s*wrap/.test(rule), 'and it wraps with the bar');

  // It really does start after the drag-handles toggle.
  const dragAt = jade.indexOf('js-toggle-desktop-drag-handles');
  const endAt = jade.indexOf('.header-quick-access-end');
  assert.ok(dragAt !== -1 && endAt > dragAt,
    'the group starts after the drag-handles toggle');
  for (const after of ['js-open-starred-boards', '+notifications', '+headerUserBar']) {
    assert.ok(jade.indexOf(after) > endAt, `${after} is inside it`);
  }
});

test('and the view menus are icons, named by a tooltip', () => {
  const boardJade = read('client/components/boards/boardHeader.jade');
  const menu = boardJade.slice(boardJade.indexOf('template(name="boardViewMenu")'));
  assert.ok(/title="\{\{boardViewName\}\}"/.test(menu), 'the board menu is named by a tooltip');
  assert.ok(!/^\s+span$/m.test(menu.slice(0, menu.indexOf('\ntemplate(') + 1 || undefined)),
    'and carries no visible label');
  // The tooltip names the view that is ON, through real translation keys.
  const boardJs = read('client/components/boards/boardHeader.js');
  const at = boardJs.indexOf('boardViewName() {');
  assert.notStrictEqual(at, -1, 'the helper must exist');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const keys = (boardJs.slice(at, at + 700).match(/: '[a-z0-9-]+'/g) || [])
    .map(x => x.slice(3, -1));
  assert.ok(keys.length >= 6, 'one name per view');
  for (const k of keys) assert.ok(k in en, `${k} is not a translation key`);

  // All Boards the same.
  const allJade = read('client/components/boards/boardsList.jade');
  const allMenu = allJade.slice(allJade.indexOf('template(name="allBoardsViewMenu")'));
  assert.ok(/title="\{\{#if isAllBoardsView 'table'\}\}/.test(allMenu),
    'the All Boards menu names the current view in its tooltip');
  assert.ok(!/span \{\{_/.test(allMenu), 'and carries no visible label');
});

test('and a sidebar button is never drawn under the close button', () => {
  // .sidebar-xmark is position:absolute, so it takes no height and the row it
  // sits in collapses to its padding. A board's row also holds the
  // keyboard-shortcut buttons; these two sidebars have only the close button.
  const css = read('client/components/boards/boardsList.css');
  const at = css.indexOf('.all-boards-sidebar .sidebar-actions,');
  assert.notStrictEqual(at, -1, 'both sidebars must reserve its height');
  assert.ok(/\.page-sidebar \.sidebar-actions/.test(css.slice(at, at + 120)),
    'the shared page sidebar too');
  assert.ok(/min-height:\s*45px/.test(css.slice(at, css.indexOf('}', at))),
    'as tall as the close button is');
  const sidebarCss = read('client/components/sidebar/sidebar.css');
  assert.ok(/\.sidebar-xmark \{[^}]*position:\s*absolute/.test(sidebarCss),
    'which is why it is needed');
});

test('and the page you are on is marked, not only hoverable', () => {
  const css = read('client/components/main/header.css');
  const alpha = sel => {
    const at = css.indexOf(sel);
    assert.notStrictEqual(at, -1, `${sel} must be styled in the first bar`);
    const m = css.slice(at, css.indexOf('}', at))
      .match(/background:\s*rgba\(0,\s*0,\s*0,\s*([\d.]+)\)/);
    assert.ok(m, `${sel} must set a background`);
    return Number(m[1]);
  };
  const hover = alpha('#header-quick-access .board-header-btn:hover {');
  const active = alpha('#header-quick-access .board-header-btn.active,');
  assert.ok(active > hover,
    'the current page is DARKER than a hover, or hovering its neighbour looks the same as being on it');
  // ...and it wins when you hover the tab you are already on.
  assert.ok(css.includes('#header-quick-access .board-header-btn.active:hover'),
    'the mark survives hovering the button that carries it');

  // The class is really emitted, by every tab, from the route.
  const js = read('client/components/settings/settingHeader.js');
  const jade = read('client/components/settings/settingHeader.jade');
  const tabs = jade.slice(jade.indexOf('template(name="adminPanelTabs")'));
  for (const helper of ['isSettingsActive', 'isPeopleActive', 'isAttachmentsActive', 'isProblemsActive']) {
    assert.ok(tabs.includes(helper), `the tab markup must ask for ${helper}`);
    const at = js.indexOf(`${helper}() {`);
    assert.notStrictEqual(at, -1, `${helper} must exist`);
    const body = js.slice(at, js.indexOf('},', at));
    assert.ok(/getRouteName\(\)/.test(body) && /'active'/.test(body),
      `${helper} marks the tab from the route it is on`);
  }
});

test('and the Admin Panel says WHICH of its four pages is open', () => {
  const { headerTitle, PAGE_TITLE_SUBKEYS } = require('../models/lib/pageTitles');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const jade = read('client/components/settings/settingHeader.jade');
  const tabs = jade.slice(jade.indexOf('template(name="adminPanelTabs")'));

  for (const [route, sub] of Object.entries(PAGE_TITLE_SUBKEYS)) {
    const t = headerTitle(route);
    assert.strictEqual(t.key, 'admin-panel', `${route} is an Admin Panel page`);
    assert.strictEqual(t.subKey, sub, `${route} names its own page`);
    assert.ok(sub in en, `${sub} is not a translation key`);
    // The title and the tab marked active have to agree, so they use the SAME
    // key: two spellings of one page name would drift apart.
    assert.ok(tabs.includes(`title="{{_ '${sub}'}}"`),
      `the ${route} tab's tooltip uses the same key the title does`);
  }

  // A page whose name is the whole answer gets no slash.
  assert.strictEqual(headerTitle('home').subKey, undefined, 'All Boards has no second segment');
  // ...and neither does a board: its own title IS the name.
  assert.strictEqual(headerTitle('setting', 'A Board').subKey, undefined,
    'a title beats the key, so there is nothing to put after a slash');

  const h = read('client/components/main/header.jade');
  const at = h.indexOf('span.header-page-title');
  const block = h.slice(at, at + 900);
  assert.ok(/each headerTitleTrail/.test(block), 'the bar draws the path');
  assert.ok(/\/ \{\{_ key\}\}/.test(block), 'each translated segment after a slash');
  assert.ok(read('client/components/main/header.js').includes('headerTitleTrail()'),
    'and the helper exists');
});

test('and a divider separates the page from you', () => {
  // Everything before the bell belongs to the PAGE - its controls, its view
  // menu, the panel's tabs; everything after belongs to YOU - help, your
  // account, the sidebar toggle. Without it the run of icons reads as one list
  // of unrelated things.
  const at = jade.indexOf('+notifications');
  assert.notStrictEqual(at, -1, 'the bell must be in this bar');
  const after = jade.slice(at, jade.indexOf('+headerUserBar'));
  assert.ok(/\n\s+\.separator\n/.test(after), 'a divider follows the bell');
  // The bar styles its own dividers - the second bar drew them its own way.
  const css = read('client/components/main/header.css');
  assert.ok(css.includes('#header-quick-access .separator {'),
    'and this bar styles it');
});

test('and All Boards says WHICH list of boards, and which workspace', () => {
  const {
    ALL_BOARDS_SECTIONS, ALL_BOARDS_SECTION_TITLE_KEYS,
    sectionTitleKey, workspaceNamePath, SECTION_WORKSPACES,
  } = require('../models/lib/allBoardsUrls');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const menu = read('client/components/boards/boardsList.jade');

  for (const section of ALL_BOARDS_SECTIONS) {
    const key = sectionTitleKey(section);
    assert.strictEqual(key, ALL_BOARDS_SECTION_TITLE_KEYS[section]);
    assert.ok(key in en, `${key} is not a translation key`);
    // The LEFT MENU's own key, so the title and the row highlighted beside it
    // say the same words.
    assert.ok(menu.includes(`{{_ '${key}'}}`),
      `${section}: the left menu must label its row with the same key`);
  }
  // No section is left unnamed, and an unknown one titles the default rather
  // than nothing - a URL is typed.
  assert.strictEqual(sectionTitleKey('nonsense'), ALL_BOARDS_SECTION_TITLE_KEYS.starred);
  assert.strictEqual(sectionTitleKey(), ALL_BOARDS_SECTION_TITLE_KEYS.starred);

  // A workspace is named by NAME, down the tree the URL walks.
  const slugify = n => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tree = [{ id: 'e', name: 'Engineering', children: [{ id: 'b', name: 'Backend' }] }];
  assert.deepStrictEqual(
    workspaceNamePath(tree, ['engineering', 'backend'], slugify), ['Engineering', 'Backend']);
  // A stale link titles the part of the trail that is still real...
  assert.deepStrictEqual(workspaceNamePath(tree, ['engineering', 'gone'], slugify), ['Engineering']);
  // ...and one that names nothing titles just the section.
  assert.deepStrictEqual(workspaceNamePath(tree, ['nope'], slugify), []);
  assert.deepStrictEqual(workspaceNamePath(null, ['x'], slugify), []);

  // The header walks it, from the URL and the user document - never from the
  // All Boards page, which is a different Blaze instance.
  const js = read('client/components/main/header.js');
  const at = js.indexOf('headerTitleTrail() {');
  assert.notStrictEqual(at, -1);
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/sectionTitleKey\(section\)/.test(body), 'the section is named');
  assert.ok(/section !== SECTION_WORKSPACES/.test(body),
    'and only Workspaces has a trail below it');
  assert.ok(/profile\.boardWorkspacesTree/.test(body),
    'the tree comes from the user document, where the page reads it too');
  assert.ok(/workspaceNamePath\(tree, splitWorkspacePath\(params\.path\), getSlug\)/.test(body),
    'walked with the same slugifier the URL was built with');
  // A workspace name is what a person typed: it must NOT go through {{_ }}.
  assert.ok(/trail\.push\(\{ title: name \}\)/.test(body),
    'a workspace name is text, not a translation key - a workspace called '
    + '"starred" is not the Starred section');
  // ...and a board has no path: its own title is the whole name.
  assert.ok(/if \(Utils\.getCurrentBoardId\(\)\) return \[\];/.test(body),
    'a board title is the whole name of that page');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nheaderBars: ${passed} tests passed`);
