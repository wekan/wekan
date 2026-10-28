'use strict';

// Card Settings on the opened card (docs/Features/Cards/Card-Settings-On-Card.md):
// the card's "Card Settings" button - it was "+ Add" - replaces itself and
// everything below it with Card Settings: its title and X, "Show" with Show
// on Minicard / Show on Card, and the sections as checklists whose items are
// the rows, the checkbox the chosen side's board-wide setting. Sections and
// rows drag and collapse like checklists; the rest is in their hamburgers.
// Run: node tests/cardSettingsOnCard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const s = require('../models/lib/cardSettingsSections.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardSettingsOnCard:');

const ids = s.SECTIONS.map(x => x.id);
const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const cardJade = read('client/components/cards/cardDetails.jade');
const addFieldsJs = read('client/components/cards/cardAddFields.js');
const css = read('client/components/cards/cardAddFields.css');
const boardsModel = read('models/boards.js');
const templateOf = (jade, name) => jade.slice(jade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];
const inline = templateOf(sidebarJade, 'cardSettingsInline');
const section = templateOf(sidebarJade, 'cardSettingsInlineSection');
const sectionMenu = templateOf(sidebarJade, 'cardSettingsSectionPopup');
const itemMenu = templateOf(sidebarJade, 'cardSettingsItemPopup');

// ── the section order ───────────────────────────────────────────────────────

test('a board that never dragged a section has the table\'s order', () => {
  assert.deepStrictEqual(s.sectionOrder(undefined), ids);
  assert.deepStrictEqual(s.sectionOrder([]), ids);
  assert.deepStrictEqual(s.orderedSections(s.SECTIONS, undefined).map(x => x.id), ids);
});

test('a stored order comes first, every section it does not name follows in the table\'s order', () => {
  const order = s.sectionOrder(['comments', 'date']);
  assert.deepStrictEqual(order.slice(0, 2), ['comments', 'date']);
  assert.deepStrictEqual(order.slice(2), ids.filter(id => id !== 'comments' && id !== 'date'));
  assert.deepStrictEqual(s.orderedSections(s.SECTIONS.filter(x => ['card', 'date', 'comments'].includes(x.id)), ['comments', 'date'])
    .map(x => x.id), ['comments', 'date', 'card']);
});

test('negative: an unknown, repeated or non-string id is never stored or shown', () => {
  const order = s.sectionOrder(['date', 'nope', 'date', 42, null, { id: 'card' }, '__proto__']);
  assert.deepStrictEqual(order, ['date', ...ids.filter(id => id !== 'date')]);
  assert.strictEqual(new Set(order).size, ids.length);
  assert.deepStrictEqual(s.sectionOrder('date'), ids, 'a string is not a list');
});

test('a drop: the shown sections take their new order, the others keep their places', () => {
  // All shown: Members dragged above Date.
  const moved = ['card', 'members', ...ids.filter(id => id !== 'card' && id !== 'members')];
  assert.deepStrictEqual(s.sectionOrderAfterDrop(undefined, moved), moved);
  // Only some shown (Time hidden on this side): Time stays where it was.
  const shown = ids.filter(id => id !== 'time');
  const dropped = [shown[3], ...shown.slice(0, 3), ...shown.slice(4)];
  const order = s.sectionOrderAfterDrop(undefined, dropped);
  assert.strictEqual(order.indexOf('time'), ids.indexOf('time'), 'a hidden section keeps its place');
  assert.deepStrictEqual(order.filter(id => id !== 'time'), dropped);
  // Negative: garbage in the drop changes nothing.
  assert.deepStrictEqual(s.sectionOrderAfterDrop(['date'], ['nope', 'date', 'date']), s.sectionOrder(['date']));
  assert.deepStrictEqual(s.sectionOrderAfterDrop(['date'], null), s.sectionOrder(['date']));
});

test('the board stores the order normalised, as a board admin\'s setting', () => {
  assert.match(boardsModel, /cardSettingsSectionOrder: \{[\s\S]*?type: Array,\s*optional: true/);
  assert.match(boardsModel, /'cardSettingsSectionOrder\.\$': \{\s*type: String/);
  assert.match(boardsModel, /async setCardSettingsSectionOrder\(order\) \{\s*const \{ sectionOrder \} = require\('\/models\/lib\/cardSettingsSections'\);\s*return await Boards\.updateAsync\(this\._id, \{ \$set: \{ cardSettingsSectionOrder: sectionOrder\(order\) \} \}\);/);
  // Boards.update is a board admin's (server/permissions/boards.js), and the
  // drop is not even sent for anybody else.
  assert.match(read('server/permissions/boards.js'), /update: allowIsBoardAdminOrSiteAdmin/);
  const place = sidebarJs.slice(sidebarJs.indexOf('function placeSectionOrder('));
  assert.match(place.slice(0, 400), /if \(!board \|\| !\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;/);
});

// ── the opened card ─────────────────────────────────────────────────────────

test('the button is "Card Settings", and opened it replaces itself and everything below it', () => {
  const at = cardJade.indexOf('if cardSettingsOpen');
  const body = cardJade.slice(at, cardJade.indexOf('\ntemplate(', at));
  assert.match(body, /^if cardSettingsOpen\n {6}\+cardSettingsInline\(card=this\)\n {4}else\n/);
  // Everything after it in the card - the button, both columns - is in the else.
  const elseBody = body.slice(body.indexOf('    else\n') + 9);
  for (const part of ['.card-details-add-fields', '.card-details-left', '.card-details-right']) {
    const line = elseBody.split('\n').find(l => l.trim().startsWith(part));
    assert.ok(line && /^ {6,}\S/.test(line), `${part} is inside the else`);
  }
  assert.ok(!elseBody.split('\n').some(l => /^ {4}\S/.test(l)), 'negative: nothing below the button is left outside it');
  assert.match(elseBody, /a\.card-details-add-fields-button\.js-open-card-add-fields\([^)]*title="\{\{_ 'card-settings'\}\}"[^)]*\)\n\s+i\.fa\.fa-cog\(aria-hidden="true"\)\n\s+\| {2}\{\{_ 'card-settings'\}\}/);
  assert.ok(!/js-open-card-add-fields\([^)]*\{\{_ 'add'\}\}/.test(cardJade), 'negative: no "+ Add" left');
  assert.match(addFieldsJs, /cardSettingsOpenOn\.set\(card\._id\);/);
  assert.match(addFieldsJs, /export function closeCardSettings\(\) \{\s*cardSettingsOpenOn\.set\(null\);/);
  // Another card opened next has it closed: open is per card id, and reset
  // when the card closes.
  assert.match(addFieldsJs, /return Boolean\(cardId\) && cardSettingsOpenOn\.get\(\) === cardId;/);
  assert.match(addFieldsJs, /Template\.cardDetails\.onDestroyed\(function \(\) \{\s*if \(isCardSettingsOpen\(this\.data && this\.data\._id\)\) closeCardSettings\(\);/);
});

test('top to bottom: Card Settings with its X at the end, Show and its two choices, the sections', () => {
  const title = inline.indexOf("h3.card-settings-inline-title {{_ 'card-settings'}}");
  const close = inline.indexOf('a.card-settings-inline-close.js-close-card-settings');
  const show = inline.indexOf("span.card-settings-inline-show-label {{_ 'card-settings-show'}}");
  const minicard = inline.indexOf('value="minicard"');
  const card = inline.indexOf('value="card"');
  const sections = inline.indexOf('each section in inlineSections');
  assert.ok(title > 0 && title < close && close < show && show < minicard && minicard < card && card < sections, 'the order');
  // The X is at the end of the title's line: one flex line, the title growing.
  assert.match(css, /\.card-settings-inline-head \{\s*display: flex;/);
  assert.match(css, /\.card-settings-inline-title \{ flex: 1 1 auto;/);
  // Radio buttons, one group, Show on Card chosen by default.
  // Each Card Settings its own radio group: the opened card's and Board
  // Settings / Card may be open together, and one name made them one group.
  assert.equal((inline.match(/input\.js-card-settings-show-side\(type="radio" name="card-settings-show-side-\{\{#if inPopup\}\}popup\{\{else\}\}card\{\{\/if\}\}"/g) || []).length, 2);
  assert.doesNotMatch(inline, /name="card-settings-show-side"/, 'negative: no name shared by both');
  assert.match(sidebarJs, /this\.showSide = new ReactiveVar\('card'\);/);
  assert.match(sidebarJs, /tpl\.showSide\.set\(evt\.currentTarget\.value === 'minicard' \? 'minicard' : 'card'\);/);
  assert.match(sidebarJs, /'click \.js-close-card-settings'\(evt\) \{\s*evt\.preventDefault\(\);\s*closeCardSettings\(\);/);
});

// ── Board Settings / Card: the same template ────────────────────────────────

test('Board Settings / Card is the opened card\'s Card Settings, in a popup', () => {
  // Deliberate change: it used to be its own layout - the Admin Panel's left
  // menu (`+leftMenu(settingsMenuItems)`) and a pane (`.card-settings-pane`)
  // of two lists with column heads and per-column Select all / none. Now the
  // popup's body is the opened card's template and nothing else, so the two
  // cannot drift apart.
  const popup = templateOf(sidebarJade, 'boardCardSettingsPopup');
  // Its body: up to the next top-level comment (the next template's), its
  // own `//-` comment and that comment's continuation lines left out.
  const lines = popup.split('\n').slice(1);
  const end = lines.findIndex(l => /^\/\/-/.test(l));
  const body = lines.slice(0, end === -1 ? undefined : end)
    .filter(l => l.trim() && !/^\s*\/\/-/.test(l) && !/^ {4}/.test(l));
  assert.deepStrictEqual(body, ['  +cardSettingsInline(inPopup=true)'], 'the popup is only cardSettingsInline');
  assert.match(cardJade, /\+cardSettingsInline\(card=this\)/, 'the same template as the opened card');
  // With inPopup the popup's own header is the title and the X: no second.
  assert.match(inline, /unless inPopup\n\s+\.card-settings-inline-head\n\s+h3\.card-settings-inline-title/);
  // Negative: nothing of the old layout is left anywhere in sidebar.jade/js.
  for (const gone of ['leftMenu(settingsMenuItems)', '.card-settings-pane', 'paneTitle(settingsPaneTitle)',
    'cardSettingsSelectButtons', 'js-card-settings-select(', 'card-settings-list-card', 'card-settings-list-minicard',
    'card-settings-side-head']) {
    assert.ok(!sidebarJade.includes(gone), `negative: ${gone} is gone from sidebar.jade`);
  }
  for (const gone of ['settingsMenuItems', 'settingsPaneTitle', 'openSettingsSectionOf', "'click .js-card-settings-menu'",
    "'click .js-card-settings-select'", 'personalOnly', 'leftMenuData']) {
    assert.ok(!sidebarJs.includes(gone), `negative: ${gone} is gone from sidebar.js`);
  }
  // Whoever opens it gets the same view: no personal-only mode. Who may not
  // change the board sees the board's rows disabled and may still set their
  // own (Labels text, List title) - a row's `writable`.
  assert.match(sidebarJs, /'click \.js-open-board-card-settings'\(event\) \{\n\s+Popup\.open\('boardCardSettings'\)\.call\(\{ currentData: \(\) => \(\{\}\) \}, event\);/);
  assert.match(sidebarJs, /writable: writable \|\| Boolean\(built\.personal\),/);
  assert.match(templateOf(sidebarJade, 'cardSettingsSideToggle'), /class="\{\{#if row\.writable\}\}\{\{row\.toggle\}\}\{\{else\}\}is-disabled\{\{\/if\}\}/);
});

test('with drag handles on only the handle drags; a row stays in its own section', () => {
  // Deliberate change (user request): with drag handles on, the label and
  // the section title are not drag handles - only the arrows handle is, so
  // the rest of a row scrolls on a touch screen. With them off, the label
  // and the title drag.
  const label = templateOf(sidebarJade, 'cardSettingsRowLabel');
  assert.match(label, /span\.card-settings-line-label\(class="\{\{#if row\.draggable\}\}\{\{#unless row\.showDragHandles\}\}js-card-field-order-handle card-field-order-drag-label\{\{\/unless\}\}\{\{\/if\}\}"/);
  assert.match(label, /if row\.showDragHandles\n\s+a\.flex\.card-field-order-move\.card-field-order-handle\.js-card-field-order-handle/);
  assert.match(section, /h4\.card-settings-inline-section-title\(class="\{\{#if section\.draggable\}\}\{\{#unless section\.showDragHandles\}\}js-card-settings-section-handle\{\{\/unless\}\}\{\{\/if\}\}"/);
  // Negative: the handle class is never outside `unless showDragHandles` on
  // the label or the title.
  const labelClass = label.match(/span\.card-settings-line-label\(class="([^"]*)"/)[1];
  assert.ok(!labelClass.replace(/\{\{#unless row\.showDragHandles\}\}[\s\S]*?\{\{\/unless\}\}/g, '').includes('js-card-field-order-handle'),
    'negative: the label is a handle only without drag handles');
  const titleClass = section.match(/h4\.card-settings-inline-section-title\(class="([^"]*)"/)[1];
  assert.ok(!titleClass.replace(/\{\{#unless section\.showDragHandles\}\}[\s\S]*?\{\{\/unless\}\}/g, '').includes('js-card-settings-section-handle'),
    'negative: the title is a handle only without drag handles');
  // A row dropped on another section goes back and nothing is written.
  const rows = sidebarJs.slice(sidebarJs.indexOf('Template.cardSettingsInlineSection.onRendered('));
  assert.match(rows.slice(0, 400), /reorderOnDrop\(this\.\$\(list\), \{\n\s+ownListOnly: true,/);
  const fn = sidebarJs.slice(sidebarJs.indexOf('function reorderOnDrop('));
  assert.match(fn.slice(0, 200), /function reorderOnDrop\(\$list, \{ items, handle, keyOf, drop, axis = 'y', ownListOnly = false \}\)/);
  // Driven, not read: reorderOnDrop from sidebar.js against a stand-in
  // sortable that fires jQuery UI 1.14's events in its real order. On release
  // jQuery UI's _clear() runs "beforeStop", then the delayed "out" of the list
  // the item was over, then "stop" (node_modules/jquery-ui/ui/widgets/sortable.js)
  // - so a flag read in stop always says "outside" and every drop in its own
  // list would be thrown away. The decision must be taken before that "out".
  const src = fn.slice(0, fn.indexOf('\n}\n') + 2);
  const reorderOnDrop = new Function(`${src}\nreturn reorderOnDrop;`)();
  const run = (events, ownListOnly) => {
    let opts;
    const dropped = [];
    const $list = { length: 1, sortable(o) { if (typeof o === 'object') opts = o; }, find: () => ({ toArray: () => [{ k: 'b' }, { k: 'a' }] }) };
    reorderOnDrop($list, { items: '> .x', handle: '.h', keyOf: el => el.k, drop: (key, keys) => dropped.push([key, keys]), ownListOnly });
    for (const e of events) opts[e]({}, { item: [{ k: 'a' }] });
    return dropped;
  };
  // Dropped in its own list: over, release -> beforeStop, delayed out, stop.
  assert.deepStrictEqual(run(['start', 'over', 'beforeStop', 'out', 'stop'], true), [['a', ['b', 'a']]], 'a drop in its own list is written');
  // Negative: dragged out onto another section and released there.
  assert.deepStrictEqual(run(['start', 'over', 'out', 'beforeStop', 'stop'], true), [], 'negative: a drop outside its list writes nothing');
  // Without ownListOnly (the sections' list) a drop is always written.
  assert.deepStrictEqual(run(['start', 'over', 'out', 'beforeStop', 'stop'], false).length, 1);
  // Negative: the sections' own sortable is not limited (it is one list).
  const sectionsSort = sidebarJs.slice(sidebarJs.indexOf("reorderOnDrop(this.$('.js-card-settings-sections-sortable')"));
  assert.ok(!/^[^}]*ownListOnly/.test(sectionsSort), 'negative: the section list does not pass ownListOnly');
});

test('a section is a checklist: a title, its count, its hamburger, its rows as items', () => {
  assert.match(inline, /\+cardSettingsInlineSection\(section=section card=card side=showSide\)/);
  const head = section.indexOf('.card-settings-inline-section-head');
  const title = section.indexOf('h4.card-settings-inline-section-title');
  const count = section.indexOf('span.card-settings-inline-section-count {{section.checkedCount}}/{{section.rows.length}}');
  const menu = section.indexOf('a.card-settings-inline-menu.js-open-card-settings-section-menu');
  const items = section.indexOf('each row in section.rows');
  assert.ok(head > 0 && head < title && title < count && count < menu && menu < items);
  // An item's checkbox is the chosen side's: the popup's own side cell,
  // under data-side = the side shown, so the popup's handlers set it.
  const item = section.slice(items);
  assert.match(item, /\.js-card-field-order-row\([^)]*data-key="\{\{row\.key\}\}" data-side="\{\{row\.side\}\}"\)\n\s+\+cardSettingsSideToggle\(row=row\)\n\s+\+cardSettingsRowLabel\(row=row\)\n\s+if row\.hasMenu\n\s+a\.card-settings-inline-menu\.js-open-card-settings-item-menu/);
  assert.match(sidebarJs, /const rows = sectionRowsOf\(section\.id, data, side, tpl\.animating\.get\(\)\)/);
  // Negative: On this card and Show empty are not the item's checkbox.
  assert.ok(!/js-card-add-field|js-card-always-show/.test(section), 'On this card and Show empty are in the hamburger');
});

test('sections and rows drag like checklists and their items, also by keyboard', () => {
  assert.match(inline, /\.card-settings-inline-sections\.js-card-settings-sections-sortable/);
  assert.match(sidebarJs, /reorderOnDrop\(this\.\$\('\.js-card-settings-sections-sortable'\), \{\s*items: '> \.js-card-settings-section\.is-draggable', handle: '\.js-card-settings-section-handle',/);
  assert.match(sidebarJs, /drop: \(id, ids\) => placeSectionOrder\(ids\),/);
  // Rows: the popup's placing, within their section, a list per section.
  const rows = sidebarJs.slice(sidebarJs.indexOf('Template.cardSettingsInlineSection.onRendered('));
  assert.match(rows.slice(0, 600), /items: '> \.js-card-field-order-row\.is-positioned', handle: '\.js-card-field-order-handle',[\s\S]*?drop: \(key, keys\) => placeInListOrder\(list\.dataset\.side, key, keys\),/);
  assert.match(section, /\.card-settings-inline-items\.js-card-field-order-sortable\(data-side="\{\{side\}\}"\)/);
  // Up and Down on a focused section title or handle.
  assert.match(sidebarJs, /'keydown \.js-card-settings-section-handle'\(evt\) \{\s*const direction = ARROW_KEYS\[evt\.key\];/);
  // Only a board admin drags: the handle and is-draggable only then.
  assert.match(sidebarJs, /draggable: mayBoard,/);
  assert.match(section, /class="\{\{#if section\.collapsed\}\}is-collapsed\{\{\/if\}\} \{\{#if section\.draggable\}\}is-draggable\{\{\/if\}\}"/);
});

test('a section collapses like a checklist, kept per user, hidden rather than removed', () => {
  assert.match(section, /a\.card-settings-inline-collapse\.js-toggle-card-settings-section/);
  assert.match(sidebarJs, /await user\.setCollapsedCardSection\(boardId, inlineCollapseKey\(id\), !inlineSectionCollapsed\(id\)\);/);
  assert.match(css, /\.card-settings-inline-section\.is-collapsed \.card-settings-inline-items \{ display: none; \}/);
  // Negative: an `if`/`unless` around the rows would drop the drag bound to them.
  assert.ok(!/(if|unless) section\.collapsed\n\s+\.card-settings-inline-items/.test(section));
});

test('the hamburgers: a section\'s selects, actions and Card\'s board options; a row\'s On this card and Show empty', () => {
  for (const column of ['{{side}}', 'this', 'always']) {
    assert.ok(sectionMenu.includes(`button.js-card-settings-inline-select(type="button" data-column="${column}" data-value="all")`), column);
    assert.ok(sectionMenu.includes(`button.js-card-settings-inline-select(type="button" data-column="${column}" data-value="none")`), column);
  }
  assert.match(sectionMenu, /each action in sectionActions\n\s+li\n\s+a\.js-card-settings-action/);
  assert.match(sidebarJs, /sectionActions\(\) \{ return sectionCardActionsOf\(this\.sectionId\); \},/);
  // Card: what the popup's Card pane has under its title.
  const general = sectionMenu.slice(0, sectionMenu.indexOf('ul.pop-over-list'));
  assert.match(general, /if sectionIsGeneral[\s\S]*js-show-empty-card-fields[\s\S]*js-ask-move-reason/);
  assert.match(sectionMenu, /if sectionIsGeneral\n\s+\+boardDragSettings\(section="card"\)/);
  // The selects run the popup's own Select all / Select none.
  assert.match(sidebarJs, /await selectCardSettingsColumn\(tpl, inlineSectionEl\(data\.sectionId, data\.inPopup\), column, value === 'all', keys\);/);
  // The opened card's Card Settings and Board Settings / Card may both be
  // open: Select all acts on the one its hamburger was opened from.
  assert.match(sidebarJs, /inPopup: Boolean\(tpl\.data && tpl\.data\.inPopup\)/);
  assert.match(sidebarJs, /const which = inPopup \? '\.card-settings-in-popup' : ':not\(\.card-settings-in-popup\)';/);
  assert.doesNotMatch(sidebarJs, /document\.querySelector\(`\.js-card-settings-inline \.js-card-settings-section/, 'negative: no lookup that takes whichever Card Settings comes first');
  // A row's: On this card and Show empty, as the popup's cells.
  assert.match(itemMenu, /if menu\.thisCard[\s\S]*a\.flex\.card-add-field\.js-card-add-field\(data-key="\{\{key\}\}"/);
  assert.match(itemMenu, /if menu\.always[\s\S]*a\.flex\.card-always-show\.js-card-always-show\(data-key="\{\{key\}\}"/);
  assert.match(sidebarJs, /return row \? \{ \.\.\.row, menu: inlineRowMenu\(row\), card: this\.card \} : null;/);
  // Negative: Show empty is offered only while Show empty fields is off, as in the popup.
  assert.match(sidebarJs, /always: Boolean\(row\.alwaysShowable && mayBoard && !cardShownFields\.boardShowsEmptyFields\(board\)\),/);
});

test('negative: one set of handlers - every Card Settings template uses the popup\'s', () => {
  assert.match(sidebarJs, /const cardSettingsEvents = \{/);
  // Deliberate change: Board Settings / Card is now the SAME template as the
  // opened card's Card Settings - boardCardSettingsPopup only renders
  // `+cardSettingsInline(inPopup=true)`, whose own registration below carries
  // the handlers. Registering them on the popup as well would run every click
  // twice (the event bubbles from the inline to the popup), so the popup must
  // register none (negative).
  assert.ok(!/Template\.boardCardSettingsPopup\.(events|helpers|onCreated|onRendered)\(/.test(sidebarJs),
    'negative: boardCardSettingsPopup registers no events/helpers of its own');
  assert.match(sidebarJs, /Template\.cardSettingsInline\.events\(\{\s*\.\.\.cardSettingsEvents,/);
  assert.match(sidebarJs, /Template\.cardSettingsSectionPopup\.events\(\{\s*\.\.\.cardSettingsEvents,/);
  assert.match(sidebarJs, /Template\.cardSettingsItemPopup\.events\(cardSettingsEvents\);/);
  for (const name of ['cardSettingsSectionPopup', 'cardSettingsItemPopup']) {
    assert.ok(sidebarJs.includes(`Template.${name}.onCreated(setUpCardSettings);`), name);
  }
  assert.match(sidebarJs, /function setUpCardSettingsInline\(\) \{\s*setUpCardSettings\.call\(this\);/);
  // No handler of a checkbox is written a second time for the card.
  for (const cls of ['js-card-add-field', 'js-card-always-show', 'js-show-empty-card-fields', 'js-ask-move-reason', 'js-card-settings-action']) {
    assert.strictEqual(sidebarJs.split(`'click .${cls}'`).length - 1, 1, `${cls} has one handler`);
  }
});

test('"Show" is translated in every language, its placeholders none', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json'), 'utf8'));
  assert.strictEqual(en['card-settings-show'], 'Show');
  const keys = Object.keys(en);
  assert.strictEqual(keys.indexOf('card-settings-show'), keys.indexOf('card-settings') + 1, 'after Card Settings');
  for (const file of fs.readdirSync(dir)) {
    const lang = file.replace('.i18n.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    assert.ok(typeof data['card-settings-show'] === 'string' && data['card-settings-show'].trim(), file);
    if (!/^en([-_]|$)/.test(lang)) assert.notStrictEqual(data['card-settings-show'], 'Show', `${file} is translated`);
    // The hamburgers' titles: "Actions", as each language already says it.
    for (const key of ['cardSettingsSectionPopup-title', 'cardSettingsItemPopup-title']) {
      assert.strictEqual(data[key], data.actions, `${file}: ${key} is that language's Actions`);
    }
  }
});

test('the design is documented, and Card Fields points to it', () => {
  const doc = read('docs/Features/Cards/Card-Settings-On-Card.md');
  for (const words of ['Show on Minicard', 'Show on Card', 'hamburger', 'collapse', 'drag']) assert.ok(doc.includes(words), words);
  assert.ok(read('docs/Features/Cards/Card-Fields.md').includes('Card-Settings-On-Card.md'));
});

console.log(`cardSettingsOnCard: ${passed} passed`);
