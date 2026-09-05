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

// Find the ONE rule that has this selector and this declaration.
//
// `css.indexOf('<selector> {')` has matched the wrong rule three times while
// this file was written: a selector usually appears more than once - the
// ordinary styling, a phone override, the rule you meant - and the guard then
// asserts against whichever came first and fails on correct CSS. Naming a
// declaration as well identifies the rule the guard is actually about.
function ruleWith(css, selector, declaration) {
  // Comments are stripped from the WHOLE stylesheet first, not per rule. A
  // comment may contain braces - one here explains `a { color: inherit }` - and
  // a brace inside a comment breaks this naive rule-splitting for every rule
  // after it, so the rule being looked for was simply never seen.
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = [];
  for (const rule of code.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[1].split(',').some(x => x.trim() === selector)) continue;
    if (!rule[2].includes(declaration)) continue;
    found.push(rule[2]);
  }
  assert.strictEqual(found.length, 1,
    `expected exactly one \`${selector}\` rule declaring \`${declaration}\`, found ${found.length}`);
  return found[0];
}

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
  assert.ok(/a\.header-home-link\(href="\{\{pathFor 'home'\}\}" title="\{\{_ 'all-boards'\}\}"\)/
    .test(jade), 'the home link keeps its name as a tooltip');
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
    ['setting', 'people', 'problems', 'attachments']);
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
  // button is about - which is the COUNT. It carried a star too, and the board
  // star button sits right beside it, so the bar drew two stars in a row and
  // they read as one control drawn twice.
  assert.ok(!/fa-star/.test(head), 'no star on this button - its neighbour is the star');
  assert.ok(head.indexOf('fa-caret-down') < head.indexOf('board-star-counter'),
    'the caret is to the left of the count');
  // "Starred", not "Starred Boards": the dropdown lists bookmarks too now, and
  // a button named after one of the two kinds under it is a button that names
  // half of what it opens. docs/Features/Board/Starred.md
  assert.ok(/title="\{\{_ 'allboards.starred'\}\}"/.test(head), 'named by a tooltip');
  // The count is the button's only label now, so it is shown even at zero -
  // otherwise the button is a bare caret with nothing to say what it opens.
  const countHelper = js.slice(js.indexOf('starredBoardsCount() {'),
    js.indexOf('  isPageStarrable() {'));
  assert.ok(!/if \(!\w+\.length\) return ''/.test(countHelper),
    'the count is shown at zero too, not blanked');
  // Boards AND bookmarks: the dropdown lists both, so a count that left the
  // bookmarks out would say 2 above five rows.
  // docs/Features/Board/Starred.md
  assert.ok(/starredBoards \? .*starredBoards\(\)/.test(countHelper)
    && /starredPages \? .*starredPages\(\)/.test(countHelper),
    'and counts both kinds');
  assert.ok(/boards\.length \+ pages\.length/.test(countHelper), 'added together');

  // ...and the board's own star is the button immediately after it: how many
  // boards you have starred, and whether this is one of them, are a pair.
  const starAt = jade.indexOf('+boardStarButton');
  assert.notStrictEqual(starAt, -1, 'the board star is in this bar');
  assert.ok(jade.indexOf('js-open-starred-boards') < starAt, 'to the right of the dropdown');
  assert.ok(starAt < jade.indexOf('+boardHeaderButtons'),
    'and before the board\'s other controls, not among them');
  // It is a toggle that shows its STATE - hollow star when not starred, solid
  // when starred - and says the ACTION in its tooltip.
  const boardJade = read('client/components/boards/boardHeader.jade');
  const starTemplate = boardJade.slice(boardJade.indexOf('template(name="boardStarButton")'));
  const btnHead = starTemplate.slice(0, starTemplate.indexOf('\n\ntemplate('));
  assert.ok(/fa-star\{\{#unless isStarred\}\}-o\{\{\/unless\}\}/.test(btnHead),
    'hollow when not starred, solid when starred');
  assert.ok(/click-to-unstar/.test(btnHead) && /click-to-star/.test(btnHead),
    'and the tooltip says which way the click goes');
  // Its helpers and its click moved with its markup: a Blaze event map only
  // sees events inside its OWN template.
  const boardJs = read('client/components/boards/boardHeader.js');
  assert.ok(/Template\.boardStarButton\.events\(\{[\s\S]{0,200}'click \.js-star-board'/.test(boardJs),
    'the click is on the template that draws it');
  assert.ok(/Template\.boardStarButton\.helpers\(\{[\s\S]{0,400}isStarred\(\)/.test(boardJs),
    'and so are its helpers');

  // The names are in a popup, shaped like the view menu's.
  assert.ok(/template\(name="starredBoardsPopup"\)/.test(jade), 'the popup exists');
  const popup = jade.slice(jade.indexOf('template(name="starredBoardsPopup")'));
  assert.ok(/ul\.pop-over-list/.test(popup), 'a pop-over list, like boardChangeViewPopup');
  assert.ok(/each currentUser\.starredBoards/.test(popup), 'listing the starred boards');
  assert.ok(/pathFor 'board' id=_id slug=slug/.test(popup), 'each one a link to it');
  assert.ok(/fa-check/.test(popup), 'with a check on the one you are looking at');
  // ...then the BOOKMARKS, under their own heading, because they are a
  // different kind of destination and a flat list of both would leave the
  // reader working out which rows are boards.
  // docs/Features/Board/Starred.md
  assert.ok(/each currentUser\.starredPages/.test(popup), 'listing the bookmarks too');
  assert.ok(/\{\{_ 'starred-pages'\}\}/.test(popup), 'under their own heading');
  assert.ok(popup.indexOf('starredBoards') < popup.indexOf('starredPages'),
    'boards first, bookmarks under them');
  // The empty line now asks about BOTH - it used to hang off the boards `each`,
  // so it was drawn under a list of bookmarks.
  assert.ok(/unless hasAnyStarred\n[\s\S]{0,80}li\.no-items-message/.test(popup),
    'and something to say when there are none of either');
  assert.ok(/'click \.js-open-starred-boards': Popup\.open\('starredBoards', \{ titleKey: 'allboards.starred' \}\)/
    .test(js), 'and the button opens it, titled the same');
  // A title is what gives a pop-over its header, and the header is what carries
  // the close button - a titleless one renders `no-title` with nothing to shut
  // it but clicking away.
  const popupTpl = read('client/components/main/popup.tpl.jade');
  assert.ok(/class="\{\{#unless title\}\}no-title\{\{\/unless\}\}"/.test(popupTpl),
    'a titleless popup is drawn without its header');
  assert.ok(/a\.close-btn\.js-close-pop-over/.test(popupTpl),
    'and the header is where the close button lives');
  // The title reuses the key the app ALREADY has for that phrase. The
  // convention is `<popupName>-title`, which would be a second copy of one
  // phrase in all 147 language files - English in every one at first, so most
  // languages would show English for something already translated.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['starred-boards'], 'Starred Boards', 'the existing key');
  assert.ok(!('starredBoardsPopup-title' in en),
    'and no duplicate of it under the convention name');
  // Sort Boards is titled the same way, and for the same reason.
  const listJs = read('client/components/boards/boardsList.js');
  assert.ok(/Popup\.open\('boardsSort', \{ titleKey: 'sort-boards' \}\)/.test(listJs),
    'the Sort Boards popup is titled from the key that phrase already has');
  assert.ok(!('boardsSortPopup-title' in en),
    'and not from a duplicate under the convention name');
  assert.strictEqual(en['sort-boards'], 'Sort Boards');

  const popupJs = read('client/lib/popup.js');
  assert.ok(/open\(name, openOptions = \{\}\)/.test(popupJs), 'open takes the option');
  assert.ok(/_getTitle\(popupName, titleKey\)/.test(popupJs), 'and passes it through');
  assert.ok(/const translationKey = titleKey \|\| `\$\{popupName\}-title`/.test(popupJs),
    'an explicit key wins, and the convention still applies without one');

  // No inline list names remain in the bar. Mobile Mode switches a list in the
  // board itself; copying its names into this bar made the bar taller and
  // changed every other swimlane's layout when one list was selected.
  const beforeCreate = jade.slice(0, jade.indexOf('#header-new-board-icon'));
  assert.ok(!/each currentBoard\.lists/.test(beforeCreate),
    'the phone list switcher must not come back into the header');
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

  // The end group generates NO BOX. It was a flex box of its own, which made it
  // ONE item to the bar - so when the bar ran out of width the whole group went
  // to the second row together, every icon after the drag-handles toggle at
  // once, leaving the first row empty from halfway across while the second was
  // crowded. With `contents` its buttons are items of the BAR and wrap one at a
  // time, so the second row takes only what did not fit on the first.
  const at = css.indexOf('#header-quick-access .header-quick-access-end {');
  assert.notStrictEqual(at, -1, 'the end group must be styled');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(/display:\s*contents/.test(rule),
    'the group generates no box, so its buttons wrap individually');
  assert.ok(!/display:\s*flex/.test(rule),
    'a flex box of its own is ONE item to the bar, and wraps as one');
  assert.ok(!/margin-inline-start:\s*auto/.test(rule),
    'a box that is not generated cannot carry the push');

  // NOTHING is pushed to the far end, and nothing is centred: the bar packs
  // from the start and wraps forward - left to right in a left-to-right
  // language, right to left in a right-to-left one, which flexbox does by
  // itself because it follows the writing direction.
  //
  // The buttons after the drag-handles toggle used to be pushed by an `auto`
  // margin, so the bar had a gap in the middle and two clusters, and which
  // items landed in which cluster changed with the window width.
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = rule[1].replace(/\/\*[\s\S]*?\*\//g, '').split(',').map(x => x.trim());
    // Only rules that position something WITHIN the bar. A `justify-content`
    // inside a button centres that button's own icon, which is not alignment
    // of the bar's items.
    if (!sels.some(x => /^[.\w-]*\s*#header-quick-access(\s+[.#][\w-]+)?$/.test(x)
      || x.endsWith('.header-quick-access-end'))) continue;
    // ONE exception, and it is deliberate: the account group - the seam
    // divider, help, your account and the sidebar toggle - is aligned to the
    // end of the bar. Everything before it belongs to the page and reads in
    // source order from the start; these are not about the page at all.
    if (sels.some(x => x.endsWith('.header-account-group'))) continue;
    const body = rule[2].replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/margin(-inline)?(-start|-left|-right|-end)?:\s*auto/.test(body),
      `${sels.join(', ')} pushes items with an auto margin`);
    assert.ok(!/justify-content:\s*(flex-end|center|space-)/.test(body),
      `${sels.join(', ')} justifies the bar's items`);
  }

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

  // Each tab names itself beside its icon where the bar has room, from the same
  // key its tooltip uses - so a tab and its tooltip cannot say different things.
  // They lose the label below 1100px with every other one in this bar.
  for (const key of ['settings', 'people', 'attachments', 'problems']) {
    assert.ok(tabs.includes(`board-header-btn-label {{_ '${key}'}}`),
      `the ${key} tab carries its name`);
    assert.ok(tabs.includes(`title="{{_ '${key}'}}"`),
      `the ${key} tab's tooltip uses the same key`);
  }

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

  // The bar shows the ROOT; the path is in the title's TOOLTIP.
  const h = read('client/components/main/header.jade');
  const at = h.indexOf('span.header-page-title');
  const block = h.slice(at, at + 500);
  assert.ok(/title="\{\{headerTitleFullPath\}\}"/.test(block), 'the bar carries the path as a tooltip');
  assert.ok(!/each headerTitleTrail/.test(block), 'and no longer draws it inline');
  assert.ok(read('client/components/main/header.js').includes('headerTitleFullPath()'),
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
  const listJs = read('client/components/boards/boardsList.js');

  for (const section of ALL_BOARDS_SECTIONS) {
    const key = sectionTitleKey(section);
    assert.strictEqual(key, ALL_BOARDS_SECTION_TITLE_KEYS[section]);
    assert.ok(key in en, `${key} is not a translation key`);
    // The LEFT MENU's own key, so the title and the row highlighted beside it
    // say the same words. The four rows are one row drawn per section, so the
    // key is in the `meta` map that feeds the loop rather than in the markup.
    // Workspaces is the tree's own header in the markup; the other four are
    // rows of the loop, whose labels live in the map that feeds it.
    assert.ok(menu.includes(`{{_ '${key}'}}`) || listJs.includes(`labelKey: '${key}'`),
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
  // A plain function, not a helper: the tooltip needs it too, and a Blaze
  // helper cannot call a sibling helper - `this` there is the data context,
  // which is what made the first attempt at the tooltip return nothing.
  const js = read('client/components/main/header.js');
  const at = js.indexOf('function headerTitleTrailOf() {');
  assert.notStrictEqual(at, -1);
  const body = js.slice(at, js.indexOf('\n}', at));
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

test('and the two star buttons are drawn as one group', () => {
  // They are about the same thing - how many boards you have starred, and
  // whether this one is among them. Without an outline they read as two
  // unrelated icons that happen to be adjacent, which is exactly how the two
  // stars that used to be here read.
  const at = jade.indexOf('.header-star-group');
  assert.notStrictEqual(at, -1, 'the group exists');
  const group = jade.slice(at, jade.indexOf('\n        //-', at + 10));
  assert.ok(group.indexOf('js-open-starred-boards') < group.indexOf('+boardStarButton'),
    'the dropdown first, then this board\'s star');

  const css = read('client/components/main/header.css');
  const ruleAt = css.indexOf('#header-quick-access .header-star-group {');
  assert.notStrictEqual(ruleAt, -1, 'and is styled');
  const rule = css.slice(ruleAt, css.indexOf('}', ruleAt));
  assert.ok(/border-radius:\s*\dpx/.test(rule), 'rounded');
  assert.ok(/border:\s*0/.test(rule), 'without a white outline');
  // The buttons drop their own margins so the related controls stay adjacent.
  assert.ok(css.includes('#header-quick-access .header-star-group .board-header-btn {'),
    'the buttons inside are adjusted for it');
});

test('the Mobile / Desktop toggle has no white shell or black border', () => {
  const css = read('client/components/main/header.css');
  const at = css.indexOf('#header-quick-access .mobile-mode-toggle .board-header-btn {');
  assert.notStrictEqual(at, -1, 'the toggle is styled');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(/background:\s*transparent\s*!important/.test(rule),
    'its outer background is transparent');
  assert.ok(/border:\s*0\s*!important/.test(rule),
    'its outer border is removed');
});

test('the Add Board button area sits four pixels higher', () => {
  const css = read('client/components/main/header.css');
  assert.ok(/#header-quick-access #header-new-board-icon \{[^}]*flex-grow:\s*1;[^}]*margin:\s*2px 5px 0/.test(css),
    'its former 6px top margin is reduced by four pixels');
});

test('and a view menu says its view in words, not only in a tooltip', () => {
  // These were icon-only, named by a tooltip. Six view icons are six glyphs to
  // learn, and a tooltip is the one place a name cannot be read without
  // hovering - so xet7 asked for the name back beside the icon. The bar wraps
  // now, which is what makes the word affordable.
  const boardJade = read('client/components/boards/boardHeader.jade');
  const menu = boardJade.slice(boardJade.indexOf('template(name="boardViewMenu")'));
  const head = menu.slice(0, menu.indexOf('\n\ntemplate('));
  assert.ok(/span\.board-header-btn-label= boardViewName/.test(head),
    'the board view menu shows the name of the view that is on');
  assert.ok(/title="\{\{boardViewName\}\}"/.test(head), 'and keeps the tooltip');

  const allJade = read('client/components/boards/boardsList.jade');
  const allMenu = allJade.slice(allJade.indexOf('template(name="allBoardsViewMenu")'));
  const allHead = allMenu.slice(0, allMenu.indexOf('\n\ntemplate('));
  assert.strictEqual((allHead.match(/span\.board-header-btn-label/g) || []).length, 2,
    'the All Boards menu names both of its views');
  assert.ok(/board-view-table/.test(allHead) && /'lists'/.test(allHead),
    'by their own translation keys');

  // Multi-Selection too - its icon is the one here that says nothing on its
  // own. Sort, Search and Archive stay icons: those glyphs are well known.
  const buttons = allJade.slice(allJade.indexOf('template(name="allBoardsHeaderButtons")'));
  const btnHead = buttons.slice(0, buttons.indexOf('\n\ntemplate('));
  // All four of All Boards' controls are named, each by the key its own tooltip
  // uses. They were icon-only; a tooltip is the one place a name cannot be read
  // without hovering, and they lose the label below 1100px like every other.
  for (const [cls, key] of [
    ['js-open-boards-sort', 'sort-boards'],
    ['js-all-boards-sidebar-search', 'search-boards'],
  ]) {
    const btnAt = btnHead.indexOf(cls);
    assert.notStrictEqual(btnAt, -1, `${cls} must be an All Boards header button`);
    const btn = btnHead.slice(btnAt, btnAt + 260);
    assert.ok(btn.includes(`board-header-btn-label {{_ '${key}'}}`),
      `${cls} carries its name, from ${key}`);
    assert.ok(btn.includes(`title="{{_ '${key}'}}"`),
      `${cls}: and its tooltip uses the same key`);
  }

  // Multi-Selection's name and tooltip change with its STATE, so they are a
  // conditional rather than one key - the same pair the board's own has.
  const msAt = btnHead.indexOf('js-all-boards-sidebar-multiselection');
  assert.notStrictEqual(msAt, -1, 'Multi-Selection must be an All Boards header button');
  const ms = btnHead.slice(msAt, msAt + 700);
  for (const key of ['multi-selection-on', 'multi-selection']) {
    assert.ok(ms.includes(`'${key}'`), `Multi-Selection names its state with ${key}`);
  }
  assert.ok(/class="\{\{#if BoardMultiSelection\.isActive\}\}emphasis/.test(ms),
    'and is emphasised while it is on');
  assert.ok(/board-header-btn-label \{\{#if BoardMultiSelection\.isActive\}\}/.test(ms),
    'the visible label says the state too, not only the tooltip');
  // The way OFF, beside the button that turned it on.
  assert.ok(/js-multiselection-reset/.test(ms), 'with an X to turn it off');
  assert.ok(/\{\{_ 'multi-selection-off'\}\}/.test(ms), 'named by its own key');
  assert.ok(/if BoardMultiSelection\.isActive\n/.test(ms),
    'drawn only while it is on');
  // ...and both are wired in the template that draws them.
  const listJs = read('client/components/boards/boardsList.js');
  const mapAt = listJs.indexOf('Template.allBoardsHeaderButtons.events({');
  const map = listJs.slice(mapAt, listJs.indexOf('\n});', mapAt));
  assert.ok(map.includes("'click .js-multiselection-reset'"), 'the X is handled here');
  assert.ok(/evt\.stopPropagation\(\)/.test(map.slice(map.indexOf('js-multiselection-reset'))),
    'and stops there - a click reaching the button beside it would turn it back on');
  // The helper it reads has to be registered on THIS template: a Blaze template
  // cannot see a sibling's helpers, and the failure is a hard render error.
  const helpersAt = listJs.indexOf('Template.allBoardsHeaderButtons.helpers({');
  const helpers = listJs.slice(helpersAt, listJs.indexOf('\n});', helpersAt));
  assert.ok(/BoardMultiSelection\(\) \{/.test(helpers),
    'BoardMultiSelection is registered on the template that uses it');
  // ...and so does the BOARD's own, which is a different button in a different
  // file and was left unnamed when the All Boards one was done.
  const boardButtons = boardJade.slice(boardJade.indexOf('js-multiselection-activate'));
  assert.ok(/board-header-btn-label \{\{_ 'multi-selection'\}\}/
    .test(boardButtons.slice(0, 500)), "the board's Multi-Selection carries its name too");

  // Sort Cards, Filter, Search and Show Dependencies are named too, each by the
  // key its own tooltip uses - so the button and its tooltip cannot say
  // different things, and a button whose name changes with its state says the
  // state in both places.
  const controls = boardJade.slice(boardJade.indexOf('template(name="boardHeaderButtons")'),
    boardJade.indexOf('template(name="boardVisibilityList")'));
  for (const [cls, keys] of [
    ['js-sort-cards', ['sort-is-on', 'sort-cards']],
    ['js-open-filter-view', ['filter-on-desc', 'filter']],
    ['js-open-search-view', ['search']],
    ['js-toggle-dependencies', ['hide-dependencies', 'show-dependencies']],
  ]) {
    const btnAt = controls.indexOf(cls);
    assert.notStrictEqual(btnAt, -1, `${cls} must be in this bar`);
    const btn = controls.slice(btnAt, btnAt + 420);
    assert.ok(/span\.board-header-btn-label/.test(btn), `${cls} carries its name`);
    const label = btn.slice(btn.indexOf('span.board-header-btn-label'));
    for (const key of keys) {
      assert.ok(label.includes(`'${key}'`), `${cls}: the label uses ${key}, as its tooltip does`);
    }
  }

  // Visibility and Watch name themselves from a DYNAMIC key - the board's own
  // permission, and which watch level is set - so one expression covers Private
  // and Public, Watching, Tracking and Muted. Written out twice it would be two
  // lists of words to keep in step; it is the same expression the tooltip uses.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const [cls, expression, values] of [
    ['js-change-visibility', '{{_ currentBoard.permission}}', ['public', 'private']],
    ['js-watch-board', '{{_ watchLevel }}', ['watching', 'tracking', 'muted']],
  ]) {
    const btnAt = controls.indexOf(cls);
    assert.notStrictEqual(btnAt, -1, `${cls} must be in this bar`);
    const btn = controls.slice(btnAt, btnAt + 600);
    assert.ok(btn.includes(`span.board-header-btn-label ${expression}`),
      `${cls} names itself from the same expression its tooltip uses`);
    assert.ok(btn.includes(`title="${expression}"`), `${cls} keeps that tooltip`);
    for (const value of values) {
      assert.ok(value in en, `${value} is not a translation key`);
    }
  }

  // A label must not wrap mid-button: two lines inside a one-line button is
  // worse than the tooltip was.
  const css = read('client/components/main/header.css');
  const at = css.indexOf('#header-quick-access .board-header-btn-label {');
  assert.notStrictEqual(at, -1, 'the label is styled');
  assert.ok(/white-space:\s*nowrap/.test(css.slice(at, css.indexOf('}', at))),
    'and does not wrap mid-word');

  // ...and where the bar has no room, EVERY label goes and the buttons are
  // icons again. A label is worth several icons' width, so on a narrow window
  // keeping them costs more buttons off the first row than the names are worth.
  // All of them together, not some: half the buttons named and half not reads
  // as a bar half finished, and which half you got would depend on which words
  // happen to be short in your language.
  // Shown on EVERY page at EVERY width. They were dropped when the bar wrapped,
  // measured from the layout - and then xet7 asked for them everywhere, which
  // makes the measurement dead weight rather than a feature nobody triggers.
  // It is deleted, not left inert: a mechanism that no longer decides anything
  // still reads as one that does.
  assert.ok(!/header-labels-hidden/.test(css),
    'nothing hides a label any more');
  const utils = read('client/lib/utils.js');
  for (const gone of ['fitHeaderLabels', 'barHasWrapped', 'flexItemsOf',
    'LABELS_HIDDEN', 'fittedAtWidth', 'scheduleFitHeaderLabels']) {
    assert.ok(!utils.includes(gone), `${gone} is gone with the feature it served`);
  }
  // The bar still wraps, which is what makes keeping the names affordable.
  assert.ok(/#header-quick-access \{[^}]*flex-wrap: wrap/s.test(css),
    'the bar wraps rather than clipping - a wrapped row beats an unreadable one');

  // The bell is named too, from the key its own tooltip uses, and carries the
  // same label class as every other named button - so it appears and vanishes
  // with them rather than needing a rule of its own.
  const bell = read('client/components/notifications/notifications.jade');
  assert.ok(/span\.board-header-btn-label \{\{_ 'notifications'\}\}/.test(bell),
    'the bell carries its name');
  assert.ok(/title="\{\{_ 'notifications'\}\}"/.test(bell),
    'from the key its tooltip already used');
  // Its own stylesheet makes it a fixed 28px square, which clips a word.
  const bellCss = read('client/components/notifications/notifications.css');
  assert.ok(/\.notifications-drawer-toggle \{[^}]*width:\s*28px/s.test(bellCss),
    'the square it is elsewhere');
  // By its declaration as well as its selector: this selector also appears in a
  // phone override that only sets a margin, and an indexOf found that one.
  const bellFit = ruleWith(css,
    '#header-quick-access #notifications .notifications-drawer-toggle', 'width: auto');
  assert.ok(/display:\s*inline-flex/.test(bellFit) && /gap:\s*4px/.test(bellFit),
    'laid out like the other named buttons, so the name is not cut off');

  // The username is NOT collapsed at any width now, and the class that exempted
  // All Boards and the Admin Panel from the collapse went with it: the bar
  // wraps, so a name that does not fit costs a row rather than an avatar shoved
  // off the edge, and with nothing left to exempt from the class decided
  // nothing.
  const nameRules = [...css.matchAll(/([^{}]*\.header-user-bar-name[^{}]*)\{([^{}]*)\}/g)];
  assert.ok(nameRules.length > 0, 'the username is styled');
  assert.ok(!nameRules.some(r => /font-size:\s*0\b/.test(r[2])),
    'nothing collapses the username');
  assert.ok(!/header-keeps-text/.test(css), 'and the exemption is gone with it');
  for (const file of ['client/components/main/header.jade',
    'client/components/main/header.js']) {
    assert.ok(!/header-keeps-text|keepsText/.test(read(file)),
      `${file}: the class and its helper are gone, not left inert`);
  }

  // The avatar is centred by LAYOUT. It was floated and nudged up 5px with
  // `position: relative`, which takes it out of the flex alignment - so it was
  // being lined up by hand against a row whose height changes with the buttons
  // in it, and it sat low.
  const avatar = ruleWith(css,
    '#header-quick-access #header-user-bar .header-user-bar-avatar', 'align-items: center');
  assert.ok(!/float:/.test(avatar) && !/top:\s*-?\d/.test(avatar),
    'no float and no nudge - its parent centres it');
  // ...and it keeps a gap to the name at EVERY width. That gap was zeroed on
  // narrow screens back when the name was hidden there, so nothing followed the
  // avatar; the name is shown at every width now and the avatar touched it.
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = rule[1].replace(/\/\*[\s\S]*?\*\//g, '');
    if (!/header-user-bar-avatar/.test(sels)) continue;
    assert.ok(!/margin-inline-end:\s*0/.test(rule[2].replace(/\/\*[\s\S]*?\*\//g, '')),
      'nothing closes the gap between the avatar and the name');
  }

  // The username's own space is SPLIT, not stacked on one side: all 8px sat
  // after the name and none before the avatar, so the divider on its left
  // touched it while a gap twice the bar's own sat on its right.
  const nameSpacing = ruleWith(css,
    '#header-quick-access #header-user-bar .header-user-bar-name', 'align-items: center');
  const nameMargin = /margin:\s*0 (\d+)px/.exec(nameSpacing);
  assert.ok(nameMargin, 'the username states one margin for both sides');
  // Read here: `buttonMargin` belongs to the spacing test, not this one.
  const btnSpacing = ruleWith(css, '#header-quick-access .board-header-btn', 'border-radius');
  const btnMargin = /margin:\s*0 (\d+)px/.exec(btnSpacing);
  assert.ok(btnMargin, 'a button states its margin');
  assert.strictEqual(Number(nameMargin[1]), Number(btnMargin[1]),
    'and it is the same each side as every other item of the bar');

  // The rename pencil is an anchor in the SAME box as the home link, so the
  // rules that collapse that link's label matched it too and reduced its icon
  // to nothing. They name the link itself now.
  assert.ok(!/\.home-icon a\b/.test(css),
    'no rule targets every anchor in the title box');
  assert.ok(/\.home-icon \.header-home-link/.test(css), 'they name the home link');
  assert.ok(/a\.header-home-link\(/.test(jade), 'which carries that class');

  // The name is still reachable: every one of these buttons has a tooltip.
  for (const cls of ['js-sort-cards', 'js-open-filter-view', 'js-open-search-view',
    'js-toggle-dependencies', 'js-multiselection-activate']) {
    const btnAt = controls.indexOf(cls);
    assert.ok(/title="/.test(controls.slice(btnAt - 120, btnAt + 300)),
      `${cls} names itself in a tooltip as well as beside its icon`);
  }
});

test('and both view menus open the same titled popup', () => {
  // xet7: "All Boards page Lists/Table dropdown at 1st top header should have
  // popup title Board View and close X button, same like at Swimlanes/Lists
  // dropdown Board View with same existing translation."
  //
  // A popup with NO title renders no header background and no heading - so the
  // All Boards one opened as a bare list of two links while the board's, which
  // asks the same question, opened with "Board View" above it.
  const listJs = read('client/components/boards/boardsList.js');
  const at = listJs.indexOf("'click .js-open-all-boards-view'");
  assert.notStrictEqual(at, -1, 'the All Boards view menu opens a popup');
  const handler = listJs.slice(at, at + 220);
  assert.ok(/Popup\.open\('allBoardsView'/.test(handler), 'its own popup');
  // The BOARD's key, not a second one saying the same words: the convention key
  // `allBoardsViewPopup-title` would start as English in all 142 language files,
  // so most languages would show English for a phrase they have translated.
  assert.ok(/titleKey: 'boardChangeViewPopup-title'/.test(handler),
    'titled with the phrase the app already has');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['boardChangeViewPopup-title'], 'Board View',
    'which is the board view menu\'s own title');
  assert.ok(!('allBoardsViewPopup-title' in en),
    'and no second key was added for the same words');
  // Sampled: the key is really translated, so the popup is titled in a language
  // that is not English.
  for (const lang of ['fi', 'de', 'fr']) {
    const j = JSON.parse(read(`imports/i18n/data/${lang}.i18n.json`));
    assert.ok(j['boardChangeViewPopup-title']
      && j['boardChangeViewPopup-title'] !== en['boardChangeViewPopup-title'],
      `${lang} has its own words for it`);
  }

  // The header - title, back arrow and close X - is one template for every
  // popup, so a titled popup gets the X by being titled.
  const tpl = read('client/components/main/popup.tpl.jade');
  assert.ok(/a\.close-btn\.js-close-pop-over/.test(tpl), 'the popup header carries the close X');
  assert.ok(/span\.header-title= title/.test(tpl), 'and the title beside it');
  assert.ok(/class="\{\{#unless title\}\}no-title\{\{\/unless\}\}"/.test(tpl),
    'an untitled popup is marked as such, which is what dropped the header');

  // Popup.open must actually honour the option, or the key above is decoration.
  const popup = read('client/lib/popup.js');
  assert.ok(/_getTitle\(popupName, openOptions\.titleKey\)/.test(popup),
    'the opener passes the key through');
  assert.ok(/titleKey \|\| `\$\{popupName\}-title`/.test(popup),
    'and an explicit key wins over the convention');
});

test('and Filter and Search shut the panel they opened', () => {
  const { sidebarViewButtonAction, SIDEBAR_VIEW_OPEN, SIDEBAR_VIEW_CLOSE } =
    require('../models/lib/sidebarViewButton');
  // Every combination, because the interesting one is the exception.
  assert.strictEqual(sidebarViewButtonAction(false, false), SIDEBAR_VIEW_OPEN,
    'closed -> open');
  assert.strictEqual(sidebarViewButtonAction(false, true), SIDEBAR_VIEW_OPEN,
    'closed, must stay open -> open, so you can see what it is doing');
  assert.strictEqual(sidebarViewButtonAction(true, false), SIDEBAR_VIEW_CLOSE,
    'showing, free to close -> the same button shuts it');
  // The exception is Filter's: with a filter ON the sidebar is the one place
  // that says what is being hidden from the board, and closing it would leave a
  // board showing a subset of its cards with nothing on screen to say so.
  assert.strictEqual(sidebarViewButtonAction(true, true), SIDEBAR_VIEW_OPEN,
    'showing and must stay open -> stays');

  const js = read('client/components/boards/boardHeader.js');
  // One helper, both buttons: two copies of "which way does this click go"
  // would eventually be two answers.
  const at = js.indexOf('function toggleSidebarView(view, mustStayOpen) {');
  assert.notStrictEqual(at, -1, 'one helper does the toggling');
  const body = js.slice(at, js.indexOf('\n}', at));
  // "Showing this view" is open AND on it: a sidebar open on Activities is
  // showing neither, and clicking either button there must switch to it rather
  // than close the panel.
  assert.ok(/sidebar\.isOpen\(\) && sidebar\.getView\(\) === view/.test(body),
    'open AND on this view, not merely open');
  assert.ok(/sidebarViewButtonAction\(isShowingView, mustStayOpen\)/.test(body),
    'the rule is asked, not re-derived here');
  assert.ok(/sidebar\.hide\(\)/.test(body) && /sidebar\.setView\(view\)/.test(body),
    'and both ways are taken');

  // Filter passes its exception; Search has none - its results are inside the
  // panel, so closing it hides nothing from the board.
  assert.ok(/toggleSidebarView\('filter', Filter\.isActive\(\)\)/.test(js),
    'Filter stays open while a filter is on');
  assert.ok(/toggleSidebarView\('search', false\)/.test(js),
    'Search always toggles');

  // The X that clears the filter is a different control and stays.
  assert.ok(/'click \.js-filter-reset'/.test(js), 'clearing is still its own button');
});

test('and the path is the tooltip, root and all, in order', () => {
  // The tooltip is the whole path - the root is IN it, not implied by it.
  const js = read('client/components/main/header.js');
  assert.ok(js.includes('headerTitleFullPath() {'), 'the tooltip helper exists');
  // Built in `headerFullPath()`, which the browser tab reads too.
  const at = js.indexOf('function headerFullPath() {');
  assert.notStrictEqual(at, -1, 'the path is built in one place');
  const body = js.slice(at, js.indexOf('\n}', at));
  assert.ok(/\[root\]\.concat\(/.test(body), 'the root comes first, then the trail');
  assert.ok(/title\.key \? TAPi18n\.__\(title\.key\) : title\.title/.test(body),
    'the root is translated only when it IS a key - a board title is text');
  assert.ok(/filter\(Boolean\)/.test(body),
    'and a page with no path gets just its name, not a trailing slash');

  // It resolves the SAME source the bar's visible name does, so the two cannot
  // disagree about where you are.
  assert.ok(/headerTitle\(route, board && board\.title, customPageTitle\(route\)\)/.test(body),
    'from the same headerTitle() the visible name uses');
  assert.ok(/headerTitleTrailOf\(\)/.test(body), 'and the same trail');

  // The visible name is the root ALONE now.
  const jade = read('client/components/main/header.jade');
  const titleAt = jade.indexOf('span.header-page-title');
  const block = jade.slice(titleAt, jade.indexOf('//- The pencil', titleAt));
  assert.ok(/\{\{_ headerTitleKey\}\}/.test(block), 'the root is drawn');
  assert.ok(!/header-page-subtitle/.test(block), 'and nothing after it');
});

test('the bar starts where the left menus start - one indent down the page', () => {
  // xet7: "where is left x position of Remaining icon, there should be left x of
  // 1st top header bar home icon and below rows of 1st top header bar".
  //
  // Both left menus indent a row the same way, and the header bar has to reach
  // the same x with its own three-part sum. The numbers are read out of the
  // three stylesheets and ADDED UP here rather than asserted one at a time: a
  // guard that pins "18px" passes while the alignment is broken by a change to
  // one of the other two.
  const header = read('client/components/main/header.css');
  const allBoards = read('client/components/boards/boardsList.css');
  const admin = read('client/components/settings/settingBody.css');
  // The FIRST rule with this selector that declares this property: the base
  // rule, before any media query. Both menus turn horizontal at narrow widths
  // and reset their row margin to 0 there, so `ruleWith` finds two - and the
  // alignment this is about is the one at the widths where the menu is a
  // column down the side.
  const baseRule = (css, selector, prop) => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const rule of code.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!rule[1].split(',').some(x => x.trim() === selector)) continue;
      if (!new RegExp(`${prop}:`).test(rule[2])) continue;
      return rule[2];
    }
    assert.fail(`no \`${selector}\` rule declaring \`${prop}\``);
  };
  const px = (rule, prop) => {
    const m = new RegExp(`${prop}:\\s*(-?[0-9.]+)px`).exec(rule);
    assert.ok(m, `no ${prop} in \`${rule.trim()}\``);
    return parseFloat(m[1]);
  };

  // All Boards: `margin: 2px 4px` on the row, `padding-inline-start` on its link.
  const abRow = baseRule(allBoards, '.boards-left-menu .menu-item', 'margin');
  const abLink = baseRule(allBoards, '.boards-left-menu .menu-item a', 'padding-inline-start');
  const abMargin = parseFloat(/margin:\s*[0-9.]+px\s+([0-9.]+)px/.exec(abRow)[1]);
  const allBoardsIconX = abMargin + px(abLink, 'padding-inline-start');

  // The Admin Panel indents its rows the same way, and the two menus must not
  // drift apart either - they are meant to look like one kind of menu.
  const apRow = baseRule(admin, '.setting-content .content-body .side-menu ul li', 'margin');
  const apLink = baseRule(admin, '.setting-content .content-body .side-menu ul li a', 'padding-inline-start');
  const apMargin = parseFloat(/margin:\s*[0-9.]+px\s+([0-9.]+)px/.exec(apRow)[1]);
  assert.strictEqual(apMargin + px(apLink, 'padding-inline-start'), allBoardsIconX,
    'the two left menus indent their rows by the same amount');

  // The bar: its own gutter, plus the first item's margin, plus that item's
  // padding. The gutter is a variable so the number has one home.
  const gutter = px(ruleWith(header, ':root', '--wekan-header-gutter'),
    '--wekan-header-gutter');
  const homeIcon = baseRule(header, '#header-quick-access .home-icon', 'margin-inline-start');
  const homeLink = baseRule(header, '#header-quick-access .home-icon .header-home-link', 'padding');
  // `padding: 4px 4px 4px 6px` - the fourth value is the start in LTR.
  const linkStart = parseFloat(
    /padding:\s*[0-9.]+px\s+[0-9.]+px\s+[0-9.]+px\s+([0-9.]+)px/.exec(homeLink)[1]);
  const headerIconX = gutter + px(homeIcon, 'margin-inline-start') + linkStart;

  assert.strictEqual(headerIconX, allBoardsIconX,
    `the house sits at ${headerIconX}px and the menu rows at ${allBoardsIconX}px`);

  // On the BAR, not on its first item. The bar wraps, and padding applies to
  // every row it wraps onto while a margin on the first item would indent the
  // first row only - which is the "and below rows" half of the request.
  const bar = ruleWith(header, '#header-quick-access', 'padding: 10px');
  assert.ok(/padding:\s*10px var\(--wekan-header-gutter\)/.test(bar),
    'the gutter is the bar\'s own padding');
  assert.ok(/flex-wrap/.test(bar), 'and the bar is what wraps');
  // No phone override may put it back to zero and leave the icons hanging off
  // the edge on the width where the alignment matters most.
  const code = header.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const rule of code.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[1].split(',').some(x => x.trim() === '#header-quick-access')) continue;
    const pad = /padding:\s*[0-9.]+px\s+([^;!]+)/.exec(rule[2]);
    if (!pad) continue;
    assert.ok(/var\(--wekan-header-gutter\)/.test(pad[1]),
      `an override sets the bar's inline padding to \`${pad[1].trim()}\``);
  }
});

test('...and nothing else insets it at some widths only', () => {
  // xet7: "small width has correct All Boards icon X position at left top
  // corner. bigger width are too much at right. they should be moved to same X
  // icon position like small width."
  //
  // The guard above adds up the three terms it knew about and got the right
  // answer - while the house still moved with the window, because two MORE
  // terms were added to that sum at some widths and not others: `#header`'s own
  // side padding (8px on a phone, 16px on a tablet, none between, 8px on a
  // large display) and `.allBoards`' side padding (15px on a desktop against
  // 6px on a phone). `.allBoards` is the SAME element as `.home-icon`, so its
  // padding lands between the icon's margin and the link.
  //
  // So this pins the other side of it: no rule at any width may add a side inset
  // of its own, which is what makes the sum above the whole story.
  const header = read('client/components/main/header.css');
  const layouts = read('client/components/main/layouts.css');
  const strip = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = css => strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g);
  const shorthandInline = body => {
    const m = /(?:^|;)\s*padding:\s*([^;!]+)/.exec(body);
    if (!m) return null;
    const parts = m[1].trim().split(/\s+/);
    return parts.length === 1 ? parts[0] : parts[1];
  };

  // 1. `#header` wraps the bar; a side padding here is added to the bar's own
  //    gutter, and it was a different number at three of the four widths.
  for (const [file, css] of [['header.css', header], ['layouts.css', layouts]]) {
    for (const rule of rules(css)) {
      if (!rule[1].split(',').some(x => x.trim() === '#header')) continue;
      const inline = shorthandInline(rule[2]);
      if (inline !== null) {
        assert.ok(/^0(px)?$/.test(inline),
          `${file}: #header adds ${inline} of side padding, so the bar starts elsewhere at that width`);
      }
      assert.ok(!/padding-(inline|left|right)/.test(rule[2]),
        `${file}: #header adds a side padding of its own`);
    }
  }

  // 2. `.allBoards` is the same element as `.home-icon` - it may space itself
  //    vertically, never horizontally.
  for (const [file, css] of [['header.css', header], ['layouts.css', layouts]]) {
    for (const rule of rules(css)) {
      if (!/\.allBoards(?![-\w])/.test(rule[1])) continue;
      if (/padding:\s*0\s*!important/.test(rule[2])) continue; // @media print
      const inline = shorthandInline(rule[2]);
      assert.strictEqual(inline, null,
        `${file}: .allBoards uses the padding shorthand (${inline}) - padding-block only`);
      const explicit = /padding-inline:\s*([^;!]+)/.exec(rule[2]);
      if (explicit) {
        assert.ok(/^0(px)?$/.test(explicit[1].trim()),
          `${file}: .allBoards insets the house by ${explicit[1].trim()}`);
      }
    }
  }

  // 3. Every rule for the link itself starts it at the same 6px, so a phone
  //    cannot begin the house 2px further in than a desktop does.
  for (const [file, css] of [['header.css', header], ['layouts.css', layouts]]) {
    for (const rule of rules(css)) {
      // The link ITSELF, so a rule for the house GLYPH inside it - whose own
      // `padding: 0` is right and means nothing here - is not mistaken for one.
      const isLink = rule[1].split(',').map(x => x.trim()).filter(Boolean)
        .every(sel => /(\.header-home-link|\.home-icon a)$/.test(sel));
      if (!isLink) continue;
      const m = /(?:^|;)\s*padding:\s*([^;!]+)/.exec(rule[2]);
      if (!m) continue;
      const parts = m[1].trim().split(/\s+/);
      const startPad = parts.length === 4 ? parts[3] : parts.length === 1 ? parts[0] : parts[1];
      assert.strictEqual(startPad, '6px',
        `${file}: the home link starts at ${startPad} in \`${rule[1].trim()}\``);
    }
  }
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nheaderBars: ${passed} tests passed`);
