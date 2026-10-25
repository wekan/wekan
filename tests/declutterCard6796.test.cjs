'use strict';

// #6796 "Declutter Cards": an opened card gave most of its height to controls
// with nothing in them, and Board Settings / Card could not be read without
// scrolling.
//
// - A field's add button sits on its title's line (Labels, Stickers, Location,
//   the dates, Members, Assignee, Creator, Requested/Assigned By, Dependencies).
// - Requested By / Assigned By: the two buttons on one row, not stacked.
// - Checklists: the controls under the list share one line, and the bottom
//   "+" is drawn only once there is a checklist (before that it is the same as
//   the title line's).
// - Attachments: the upload rules are in the upload popup, not body text above
//   every list; "+" is a small button; a file with nothing to preview gets a
//   small file button instead of a 144x96 box with "txt" in it; and two new
//   Board Settings / Card / Show on Card rows, Attachments: Preview and
//   Attachments: Details (uploader and date), turn the rest off.
// - Board Settings / Card is a centred panel as wide (up to 1800px) and tall as
//   the window, and each list spreads into as many columns as fit, read top to
//   bottom, so on a 1920x1080 screen nothing is scrolled.
// Run: node tests/declutterCard6796.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { attachmentTileCompact, attachmentHasVisualPreview } = require('../models/lib/attachmentTile.cjs');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const cardJade = read('client/components/cards/cardDetails.jade');
const cardCss = read('client/components/cards/cardDetails.css');
const attJade = read('client/components/cards/attachments.jade');
const attJs = read('client/components/cards/attachments.js');
const attCss = read('client/components/cards/attachments.css');
const chkJade = read('client/components/cards/checklists.jade');
const chkJs = read('client/components/cards/checklists.js');
const sidebarCss = read('client/components/sidebar/sidebar.css');
const popupCss = read('client/components/main/popup.css');

function template(src, name) {
  const at = src.indexOf(`template(name="${name}")`);
  assert.ok(at !== -1, `template ${name}`);
  const next = src.indexOf('\ntemplate(name=', at + 1);
  return src.slice(at, next === -1 ? undefined : next);
}

// ── attachments ────────────────────────────────────────────────────────────

test('a tile is full size only when it shows something', () => {
  for (const file of [
    { isImage: true, extension: 'png', hasLink: true },
    { isImage: false, extension: 'SVG', hasLink: true },
    { isImage: false, extension: 'mp4', hasLink: true },
    { isImage: false, extension: 'mp3', hasLink: true },
  ]) {
    assert.strictEqual(attachmentHasVisualPreview(file), true, JSON.stringify(file));
    assert.strictEqual(attachmentTileCompact(file, undefined), false, 'unset means previews on');
    assert.strictEqual(attachmentTileCompact(file, true), false);
  }
});

test('negative: a file with nothing to preview, a missing link, or previews off, is the small button', () => {
  for (const file of [
    { isImage: false, extension: 'txt', hasLink: true },
    { isImage: false, extension: 'pdf', hasLink: true },
    { isImage: false, extension: 'docx', hasLink: true },
    { isImage: true, extension: 'png', hasLink: false },
    {},
  ]) assert.strictEqual(attachmentTileCompact(file, true), true, JSON.stringify(file));
  assert.strictEqual(attachmentTileCompact({ isImage: true, extension: 'png', hasLink: true }, false), true);
});

test('Attachments: Preview and Attachments: Details are Show on Card rows, on by default', () => {
  for (const [key, field, label] of [
    ['attachmentPreviews', 'allowsAttachmentPreviewsOnCard', 'preview'],
    ['attachmentDetails', 'allowsAttachmentDetailsOnCard', 'details'],
  ]) {
    const row = CARD_SETTINGS_ROWS.find(r => r.key === key);
    assert.ok(row && row.card, key);
    assert.deepStrictEqual(row.label, ['attachments', label]);
    assert.ok(row.label.every(k => en[k]), 'the label uses existing translations');
    assert.strictEqual(row.card.toggle, 'js-board-card-flag');
    assert.strictEqual(row.card.field, field);
    assert.strictEqual(row.card.default, true, 'nothing an existing board shows disappears');
    assert.strictEqual(row.card.after, 'attachments');
    assert.ok(!row.minicard, 'the minicard has no attachment tiles');
    assert.match(read('models/boards.js'), new RegExp(`${field}: \\{ type: Boolean, optional: true \\}`));
    assert.match(read('server/models/boards.js'), new RegExp(`'${field}',`), 'an API card-setting key');
  }
});

test('the gallery reads both rows (negative: no dead toggle)', () => {
  const gallery = template(attJade, 'attachmentGallery');
  assert.match(gallery, /unless \$eq currentBoard\.allowsAttachmentDetailsOnCard false\n\s+if uploaderName/);
  assert.match(gallery, /if attachmentTileCompact this\n\s+i\.fa\.fa-file-o/);
  assert.match(attJs, /attachmentTileCompact\(\{[\s\S]*?\}, board\?\.allowsAttachmentPreviewsOnCard\)/);
  assert.match(gallery, /a\.card-label\.add-label\.add-attachment\.js-add-attachment/, 'a small "+"');
  // The name is first and on a line of its own, so a long one is not hidden.
  assert.match(attCss, /\.attachment-details > div:first-child \{\s*flex: 1 1 100%;/);
});

test('negative: the upload rules are in the upload popup, not above the opened card\'s list', () => {
  const section = cardJade.slice(cardJade.indexOf('if currentBoard.allowsAttachments'), cardJade.indexOf('+attachmentGallery'));
  for (const key of ['invalid-file', 'max-upload-filesize', 'allowed-upload-filetypes']) {
    assert.ok(!section.includes(key), `${key} is not body text of the opened card`);
    assert.ok(template(attJade, 'cardAttachmentsPopup').includes(`{{_ '${key}'}}`), `${key} is in the upload popup`);
  }
});

// ── the add buttons ────────────────────────────────────────────────────────

const ITEMS = ['labels', 'stickers', 'location', 'received', 'start', 'due', 'end', 'members',
  'assignees', 'creator', 'name', 'dependencies'];

test('each field\'s add button sits on its title\'s line', () => {
  const rule = cardCss.match(/\.card-details \.card-details-group-body > \.card-details-item:is\(([\s\S]*?)\) \{\s*display: flex;\s*flex-wrap: wrap;/);
  assert.ok(rule, 'the items are wrapping flex rows');
  for (const item of ITEMS) assert.ok(rule[1].includes(`.card-details-item-${item}`), item);
  // ...and the title is only as wide as its words: two rules make it 100%.
  const title = cardCss.match(/\.card-details \.card-details-group-body > \.card-details-item:is\(([\s\S]*?)\)\s*> \.card-details-item-title \{\s*width: auto;/);
  assert.ok(title, 'the title gives up its 100% width');
  for (const item of ITEMS) assert.ok(title[1].includes(`.card-details-item-${item}`), item);
});

test('Requested By and Assigned By: pick a user and type a name side by side, on one line', () => {
  // Both buttons stay what they were (a "+" picks a user; the other adds or,
  // with a name there, edits it - tests/cardDetailsAddIcons.test.cjs), but
  // they sit in a row instead of a column under the title.
  for (const cls of ['js-select-requester', 'js-select-assigner']) {
    const at = cardJade.indexOf(cls);
    assert.ok(at > 0 && cardJade.lastIndexOf('.card-details-person-controls', at) > at - 200, cls);
  }
  assert.match(cardCss, /\.card-details \.card-details-person-controls \{\s*align-items: center;\s*display: flex;\s*flex-direction: row;/);
});

test('Checklists: the bottom controls share a line, and the bottom "+" waits for a checklist', () => {
  const list = template(chkJade, 'checklists');
  assert.match(list, /\.checklists-bottom-actions\n\s+if hasChecklists\n\s+\+inlinedForm/);
  assert.match(chkJs, /hasChecklists\(\) \{/);
  assert.match(read('client/components/cards/checklists.css'), /\.checklists-bottom-actions \{\s*display: flex;/);
});

// ── Board Settings / Card ──────────────────────────────────────────────────

const offsetSrc = read('client/lib/popupOffset.js');
const offset = vm.runInNewContext(`(() => { ${offsetSrc.replace(/^export \{[^}]*\};?\s*$/m, '')}\n return { computePopupOffset, CARD_SETTINGS_MAX_WIDTH }; })()`);

test('the popup is a centred panel as wide (up to 900px) and tall as the window', () => {
  // 1800px fitted two long lists side by side; the Admin Panel's menu and pane
  // (docs/Features/Cards/Card-Fields.md) need a row's label and its two sides.
  const base = { popupName: 'boardCardSettingsPopup', viewportHeight: 1080, openerTopVp: 40, openerBottomVp: 60,
    openerLeftVp: 1700, scrollTop: 0, scrollLeft: 0 };
  const wide = offset.computePopupOffset({ ...base, viewportWidth: 1920 });
  assert.strictEqual(offset.CARD_SETTINGS_MAX_WIDTH, 900);
  assert.strictEqual(wide.left, 510);
  assert.strictEqual(wide.top, 12);
  assert.strictEqual(wide.maxHeight, 1056);
  const narrow = offset.computePopupOffset({ ...base, viewportWidth: 900, viewportHeight: 768 });
  assert.ok(Math.abs(narrow.left - (900 - 900 * 0.96) / 2) < 0.01);
  // A phone is still the full-screen sheet.
  assert.deepStrictEqual({ ...offset.computePopupOffset({ ...base, viewportWidth: 600 }) }, { left: 0, top: 0 });
  // The CSS says the same width.
  assert.match(popupCss, /\.pop-over\[data-popup='boardCardSettingsPopup'\] \{[^}]*width: min\(96vw, 900px\) !important;[^}]*max-height: calc\(100dvh - 24px\) !important;/);
});

test('each row is one line: its label, then the minicard cell and the card cell', () => {
  assert.match(sidebarCss, /\.card-settings-pane-head,\n\.card-settings-line \{\n\s+display: grid;/);
  assert.ok(!sidebarCss.includes('.card-field-order-column-minicard'), 'the column layout is gone (negative)');
});

console.log(`\n${passed} passed`);
