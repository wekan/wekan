'use strict';

// Card Settings (docs/Features/Cards/Card-Settings.md): "Show" with Show on
// Minicard / Show on Card, and the sections as checklists whose items are the
// rows, the checkbox the chosen side's board-wide setting. Sections and rows
// drag and collapse like checklists; the rest is in their hamburgers.
//
// Deliberate change (2026-10-28): the file's name is from when Card Settings
// was drawn ON the opened card, behind its "Card Settings" button, replacing
// the card below it. The maintainer removed that: Card Settings is only Board
// Settings / Card now. The suite keeps the section-order, drag, collapse and
// shared-handler checks, and pins that the opened card has no Card Settings
// (no button, no cardSettingsInline, no open state).
//
// Deliberate change (2026-10-28, later): Card Settings shows BOTH sides at
// once, a Minicard pane and a Card pane - two instances of cardSettingsInline,
// each with its fixed side and its own section order - instead of a Show
// switch; and a hamburger opens its content in a panel under its line
// (cardSettingsInlinePanel) instead of the cardSettingsSectionPopup /
// cardSettingsItemPopup popups.
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
// Both hamburgers' content is the one panel template now.
const panel = templateOf(sidebarJade, 'cardSettingsInlinePanel');
const sectionMenu = panel;
const itemMenu = panel;

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
  // 2026-10-28: one setter for both sides' orders, the side as its second
  // argument; the one-argument call still writes the opened card's.
  assert.match(boardsModel, /minicardSettingsSectionOrder: \{[\s\S]*?type: Array,\s*optional: true/);
  assert.match(boardsModel, /async setCardSettingsSectionOrder\(order, side\) \{\s*const \{ sectionOrder, SECTION_ORDER_FIELD \} = require\('\/models\/lib\/cardSettingsSections'\);\s*const which = side === 'minicard' \? 'minicard' : 'card';\s*return await Boards\.updateAsync\(this\._id, \{ \$set: \{ \[SECTION_ORDER_FIELD\[which\]\]: sectionOrder\(order, which\) \} \}\);/);
  assert.deepStrictEqual(s.SECTION_ORDER_FIELD, { card: 'cardSettingsSectionOrder', minicard: 'minicardSettingsSectionOrder' });
  // Boards.update is a board admin's (server/permissions/boards.js), and the
  // drop is not even sent for anybody else.
  assert.match(read('server/permissions/boards.js'), /update: allowIsBoardAdminOrSiteAdmin/);
  const place = sidebarJs.slice(sidebarJs.indexOf('function placeSectionOrder('));
  assert.match(place.slice(0, 400), /if \(!board \|\| !\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;/);
});

// ── the opened card has no Card Settings ───────────────────────────────────

test('negative: the opened card has no Card Settings button and no Card Settings of its own', () => {
  for (const gone of ['cardSettingsInline', 'cardSettingsOpen', 'js-open-card-add-fields', 'card-details-add-fields']) {
    assert.ok(!cardJade.includes(gone), `cardDetails.jade: ${gone}`);
  }
  for (const gone of ['cardSettingsOpenOn', 'isCardSettingsOpen', 'closeCardSettings', "'click .js-open-card-add-fields'", 'onDestroyed']) {
    assert.ok(!addFieldsJs.includes(gone), `cardAddFields.js: ${gone}`);
  }
  // (`js-close-card-settings-panel`, since 2026-10-28, is a hamburger panel's
  // X inside Card Settings, not a way out of Card Settings on a card.)
  assert.ok(!/closeCardSettings(?!Panel)|js-close-card-settings(?!-panel)|settingsCard\(/.test(sidebarJs), 'sidebar.js: no card path');
  assert.ok(!css.includes('.card-details-add-fields'), 'negative: no CSS for the button');
  // The card's fields are drawn directly, not under an `else`: .card-details-left
  // is a direct child of the card's body.
  assert.match(cardJade, /\n {4}\.card-details-left\n/);
  // What stays: the card's own view of the board, for the hidden sections.
  assert.match(addFieldsJs, /export function cardBoardView\(/);
  assert.match(addFieldsJs, /CARD_FIELD_TEMPLATES\.forEach\(name => \{/);
});

test('top to bottom: each pane its header (caret, side title), then the sections - the popup\'s header is the title and X', () => {
  const head = inline.indexOf('.card-settings-pane-head');
  const caret = inline.indexOf('a.card-settings-pane-collapse.js-toggle-card-settings-pane');
  const title = inline.indexOf('h3.card-settings-pane-title {{paneTitle}}');
  const sections = inline.indexOf('each section in inlineSections');
  assert.ok(head > 0 && head < caret && caret < title && title < sections, 'the order');
  assert.match(sidebarJs, /paneTitle\(\) \{\n\s+return TAPi18n\.__\(Template\.instance\(\)\.showSide\.get\(\) === 'minicard' \? 'show-on-minicard' : 'show-on-card'\);/);
  // Negative: no title and X of its own, no inPopup distinction left.
  assert.ok(!/card-settings-inline-head|js-close-card-settings(?!-panel)|\binPopup\b|card-settings-in-popup/.test(sidebarJade + sidebarJs));
  assert.ok(!/\.card-settings-inline-head|\.card-settings-inline-close/.test(css), 'negative: their CSS too');
  // Negative: no Show radio - both sides are shown.
  assert.ok(!inline.includes('js-card-settings-show-side') && !sidebarJs.includes('js-card-settings-show-side'));
  assert.match(sidebarJs, /this\.showSide = new ReactiveVar\(side === 'minicard' \? 'minicard' : 'card'\);/);
});

// ── Board Settings / Card: the same template ────────────────────────────────

test('Board Settings / Card is Card Settings, in a popup', () => {
  // Deliberate change: it used to be its own layout - the Admin Panel's left
  // menu (`+leftMenu(settingsMenuItems)`) and a pane (`.card-settings-pane`)
  // of two lists with column heads and per-column Select all / none. Its body
  // is cardSettingsInline and nothing else.
  const popup = templateOf(sidebarJade, 'boardCardSettingsPopup');
  const lines = popup.split('\n').slice(1);
  const end = lines.findIndex(l => /^\/\/-/.test(l));
  const body = lines.slice(0, end === -1 ? undefined : end).join('\n');
  // 2026-10-28: two cardSettingsInline panes - Minicard first - and the
  // splitter between them, nothing else.
  assert.deepStrictEqual([...body.matchAll(/\+cardSettingsInline\(side="(\w+)"\)/g)].map(m => m[1]), ['minicard', 'card']);
  assert.ok(body.indexOf('.card-settings-splitter') > body.indexOf('side="minicard"')
    && body.indexOf('.card-settings-splitter') < body.indexOf('side="card"'), 'the splitter between the panes');
  // Negative: nothing of the old layout is left anywhere in sidebar.jade/js.
  // (`.card-settings-pane` is a name again since 2026-10-28 - one side's pane
  // of the new layout - so it is not in this list.)
  for (const gone of ['leftMenu(settingsMenuItems)', 'paneTitle(settingsPaneTitle)',
    'cardSettingsSelectButtons', 'js-card-settings-select(', 'card-settings-list-card', 'card-settings-list-minicard',
    'card-settings-side-head']) {
    assert.ok(!sidebarJade.includes(gone), `negative: ${gone} is gone from sidebar.jade`);
  }
  for (const gone of ['settingsMenuItems', 'settingsPaneTitle', 'openSettingsSectionOf', "'click .js-card-settings-menu'",
    "'click .js-card-settings-select'", 'personalOnly', 'leftMenuData']) {
    assert.ok(!sidebarJs.includes(gone), `negative: ${gone} is gone from sidebar.js`);
  }
  // Whoever opens it gets the same view. Who may not change the board sees
  // the board's rows disabled and may still set their own (Labels text).
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
  // (Custom Fields' items come first in that function, with the same rule.)
  assert.match(rows.slice(0, 1200), /reorderOnDrop\(this\.\$\(list\), \{\n\s+ownListOnly: true,/);
  assert.match(rows.slice(0, 1200), /reorderOnDrop\(this\.\$\(fields\), \{\n\s+ownListOnly: true,/);
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
  assert.match(inline, /\+cardSettingsInlineSection\(section=section side=showSide\)/);
  const head = section.indexOf('.card-settings-inline-section-head');
  const title = section.indexOf('h4.card-settings-inline-section-title');
  const count = section.indexOf('span.card-settings-inline-section-count {{section.checkedCount}}/{{section.total}}');
  const menu = section.indexOf('a.card-settings-inline-menu.js-open-card-settings-section-menu');
  const items = section.indexOf('each row in section.rows');
  assert.ok(head > 0 && head < title && title < count && count < menu && menu < items);
  // An item's checkbox is the chosen side's: the popup's own side cell,
  // under data-side = the side shown, so the popup's handlers set it.
  const item = section.slice(items);
  assert.match(item, /\.js-card-field-order-row\([^)]*data-key="\{\{row\.key\}\}" data-side="\{\{row\.side\}\}"\)\n\s+\+cardSettingsSideToggle\(row=row\)\n\s+\+cardSettingsRowLabel\(row=row\)\n\s+if row\.hasMenu\n\s+a\.card-settings-inline-menu\.js-open-card-settings-item-menu/);
  // (The checkbox just clicked is read once per redraw, for the rows and for the
  // section checkboxes alike.)
  assert.match(sidebarJs, /const animating = tpl\.animating\.get\(\);[\s\S]{0,600}const rows = sectionRowsOf\(section\.id, data, side, animating\)/);
  // Negative: On this card and Show empty are gone (2026-10-28).
  assert.ok(!/js-card-add-field|js-card-always-show/.test(section));
});

test('sections and rows drag like checklists and their items, also by keyboard', () => {
  assert.match(inline, /\.card-settings-inline-sections\.js-card-settings-sections-sortable/);
  assert.match(sidebarJs, /reorderOnDrop\(this\.\$\('\.js-card-settings-sections-sortable'\), \{\s*items: '> \.js-card-settings-section\.is-draggable', handle: '\.js-card-settings-section-handle',/);
  // Each pane writes its own side's section order (2026-10-28).
  assert.match(sidebarJs, /drop: \(id, ids\) => placeSectionOrder\(ids, this\.showSide\.get\(\)\),/);
  assert.match(sidebarJs, /placeSectionOrder\(ids, tpl\.showSide\.get\(\)\);/);
  assert.match(sidebarJs, /board\.setCardSettingsSectionOrder\(order, which\);/);
  // Rows: the popup's placing, within their section, a list per section.
  const rows = sidebarJs.slice(sidebarJs.indexOf('Template.cardSettingsInlineSection.onRendered('));
  assert.match(rows.slice(0, 1400), /items: '> \.js-card-field-order-row\.is-positioned', handle: '\.js-card-field-order-handle',[\s\S]*?drop: \(key, keys\) => placeInListOrder\(list\.dataset\.side, key, keys\),/);
  assert.match(section, /\.card-settings-inline-items\.js-card-field-order-sortable\(data-side="\{\{side\}\}"\)/);
  // Up and Down on a focused section title or handle.
  assert.match(sidebarJs, /'keydown \.js-card-settings-section-handle'\(evt, tpl\) \{\s*const direction = ARROW_KEYS\[evt\.key\];/);
  // Only a board admin drags: the handle and is-draggable only then.
  assert.match(sidebarJs, /draggable: mayBoard,/);
  assert.match(section, /class="\{\{#if section\.collapsed\}\}is-collapsed\{\{\/if\}\} \{\{#if section\.draggable\}\}is-draggable\{\{\/if\}\}/);
});

test('a section collapses like a checklist, kept per user, hidden rather than removed', () => {
  assert.match(section, /a\.card-settings-inline-collapse\.js-toggle-card-settings-section/);
  // Per pane (2026-10-28): the Card pane keeps the key the one list had.
  assert.match(sidebarJs, /await user\.setCollapsedCardSection\(boardId, inlineCollapseKey\(id, side\), !inlineSectionCollapsed\(id, side\)\);/);
  assert.match(sidebarJs, /const inlineCollapseKey = \(id, side\) => \(side === 'minicard' \? `card-settings-minicard-\$\{id\}` : `card-settings-\$\{id\}`\);/);
  assert.match(css, /\.card-settings-inline-section\.is-collapsed \.card-settings-inline-items,\n\.card-settings-inline-section\.is-collapsed \.card-settings-add-custom-field \{ display: none; \}/);
  // Negative: an `if`/`unless` around the rows would drop the drag bound to them.
  assert.ok(!/(if|unless) section\.collapsed\n\s+\.card-settings-inline-items/.test(section));
});

test('the hamburgers: a section\'s board actions and Card\'s options; a row\'s Labels text reset', () => {
  // Deliberate change (2026-10-28): the selects, On this card, Show empty and
  // Show empty fields are gone; a hamburger is drawn only when non-empty.
  assert.ok(!/js-card-settings-inline-select|js-show-empty-card-fields|js-card-add-field|js-card-always-show/.test(sectionMenu + itemMenu));
  // The action's settings themselves, in the panel (2026-10-28).
  assert.match(sectionMenu, /each action in sectionActions\n\s+\.card-settings-section-action\.js-card-settings-panel-own-handlers/);
  assert.match(sidebarJs, /sectionActions\(\) \{ return sectionCardActionsOf\(this\.sectionId\); \},/);
  assert.match(sectionMenu, /if sectionIsGeneral\n\s+\/\/- What is not a field\.\n\s+div\.check-div\.card-settings-board-option\.card-settings-ask-move-reason/);
  assert.match(sectionMenu, /if sectionIsGeneral\n\s+\+boardDragSettings\(section="card"\)/);
  assert.match(itemMenu, /if menu\.labelTextReset\n\s+div\.check-div\.card-settings-board-option\n\s+a\(class=labelTextResetClass\)/);
  assert.match(sidebarJs, /return row \? \{ \.\.\.row, menu: inlineRowMenu\(row\) \} : null;/);
  assert.match(sidebarJs, /function inlineRowMenu\(row\) \{\n\s+return \{\n\s+labelTextReset: Boolean\(row\.labelTextOverride && row\.labelTextOverridden\),\n\s+\};/);
  assert.match(sidebarJs, /return \{ \.\.\.row, _id: row\.key, menu, hasMenu: menu\.labelTextReset, menuOpen: open === `row:\$\{row\.key\}` \};/);
});

test('negative: one set of handlers - every Card Settings template uses the popup\'s', () => {
  assert.match(sidebarJs, /const cardSettingsEvents = \{/);
  // Deliberate change: boardCardSettingsPopup only renders the two
  // `+cardSettingsInline` panes, whose own registration carries the handlers.
  // Registering them on the popup as well would run every click twice (the
  // event bubbles from the pane to the popup), so the popup registers no
  // event map (negative). Since 2026-10-28 it has helpers and an onRendered
  // of its own - the splitter between the panes - but still no events.
  assert.ok(!/Template\.boardCardSettingsPopup\.events\(/.test(sidebarJs),
    'negative: boardCardSettingsPopup registers no events of its own');
  // The pane's events are cardSettingsEvents, each skipping what a panel's
  // own templates handle (paneEvents).
  assert.match(sidebarJs, /Template\.cardSettingsInline\.events\(\{\s*\.\.\.paneEvents,/);
  assert.match(sidebarJs, /const paneEvents = Object\.fromEntries\(Object\.entries\(cardSettingsEvents\)/);
  // The hamburgers' panel is inside the pane: an event map of its own would
  // run every click twice (negative).
  assert.ok(!/Template\.cardSettingsInlinePanel\.events\(/.test(sidebarJs), 'negative: the panel has no event map');
  for (const name of ['cardSettingsSectionPopup', 'cardSettingsItemPopup']) {
    assert.ok(!sidebarJs.includes(`Template.${name}.`), `negative: ${name} is gone`);
  }
  assert.match(sidebarJs, /function setUpCardSettingsInline\(\) \{\s*setUpCardSettings\.call\(this\);/);
  // No handler of a checkbox is written a second time for the card.
  for (const cls of ['js-ask-move-reason', 'js-card-settings-section-shown', 'js-card-settings-single-toggle']) {
    assert.strictEqual(sidebarJs.split(`'click .${cls}'`).length - 1, 1, `${cls} has one handler`);
  }
  for (const cls of ['js-card-add-field', 'js-card-always-show', 'js-show-empty-card-fields']) {
    assert.ok(!sidebarJs.includes(`'click .${cls}'`), `negative: ${cls} is gone`);
  }
});

// (The Show radio is gone since 2026-10-28, and so are the two hamburger
// popups; their strings stay translated in every language, as below, until a
// translation pass removes them - nothing reads them.)
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
  const doc = read('docs/Features/Cards/Card-Settings.md');
  for (const words of ['Show on Minicard', 'Show on Card', 'hamburger', 'collapse', 'drag', 'section\'s checkbox', 'one line', 'Custom Fields']) {
    assert.ok(doc.includes(words), words);
  }
  assert.ok(read('docs/Features/Cards/Card-Fields.md').includes('Card-Settings.md'));
  // Negative: the old page and every link to it are gone.
  assert.ok(!fs.existsSync(path.join(root, 'docs/Features/Cards/Card-Settings-On-Card.md')));
});

// A space's width between a checkbox and its label - on the rows and in the
// hamburgers' popups. Without it the box touched the field's icon.
test('a checkbox and its label are a space apart, on the rows and in the hamburgers', () => {
  const css = read('client/components/cards/cardAddFields.css');
  const rule = selector => {
    const at = css.indexOf(`${selector} {`);
    assert.ok(at >= 0, selector);
    return css.slice(at, css.indexOf('}', at));
  };
  assert.match(rule('.card-settings-inline .card-settings-line'), /column-gap: 0\.3em;/);
  assert.match(rule('.card-settings-section-menu .card-settings-board-option > a.flex'), /column-gap: 0\.3em;/);
  assert.match(css, /\.card-settings-item-menu \.card-settings-board-option > a\.flex,\n\.card-settings-section-menu \.card-settings-board-option > a\.flex \{/);
  // A tick reaches past its box: left to right it is drawn 3px further left,
  // so a ticked box keeps the space too; right to left it leans away.
  assert.match(css, /:root:not\(\[dir="rtl"\]\) \.card-settings-inline \.materialCheckBox\.is-checked,\n:root:not\(\[dir="rtl"\]\) \.card-settings-item-menu \.materialCheckBox\.is-checked,\n:root:not\(\[dir="rtl"\]\) \.card-settings-section-menu \.materialCheckBox\.is-checked \{\n  left: -6px;\n\}/);
  // Negative: the row's own grid has no zero gap overriding it.
  assert.doesNotMatch(rule('.card-settings-inline .card-settings-line'), /column-gap: 0;/);
});

console.log(`cardSettingsOnCard: ${passed} passed`);
