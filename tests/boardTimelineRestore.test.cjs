'use strict';

// Regression coverage for Board View / Timeline's "restore this card to this
// point in time" action (client/components/boards/timelineView.js), Step 2
// of the maintainer's spec:
//
//   "have possibility to restore from any historical status to copy it to
//   newest status. have checks that all data stays at undo history, so that
//   this does not delete any data."
//
// Deliberately NOT covered here (explicitly deferred, per the task's scope
// discipline): "selective per-member change removal within a time period" -
// that is a separate, higher-risk mutation feature left for a dedicated
// future pass.
//
// Run: node tests/boardTimelineRestore.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const timelineJs = read('client/components/boards/timelineView.js');
const timelineJade = read('client/components/boards/timelineView.jade');

test('restoreCardFromTimeline only calls the card\'s OWN existing setters', () => {
  // Every field write goes through a method already used elsewhere in the
  // codebase (setTitle, setDescription, move, addLabel/removeLabel,
  // assignMember/unassignMember, setDue) - never a bulk update.
  const fnStart = timelineJs.indexOf('export async function restoreCardFromTimeline');
  assert.ok(fnStart !== -1, 'restoreCardFromTimeline is exported');
  const fnEnd = timelineJs.indexOf('\n}', fnStart);
  const body = timelineJs.slice(fnStart, fnEnd);

  ['card.setTitle(', 'card.setDescription(', 'card.move(', 'card.addLabel(',
    'card.removeLabel(', 'card.assignMember(', 'card.unassignMember(', 'card.setDue(']
    .forEach(call => assert.ok(body.includes(call), `calls ${call}`));
});

test('negative: the restore function never bypasses the setters with a direct Cards update', () => {
  // Search the WHOLE file (not just the function) for the shape of a bypass -
  // a direct write to the Cards collection - so the guarantee holds even if
  // the function is refactored or another helper is added beside it later.
  assert.doesNotMatch(timelineJs, /Cards\.update(Async)?\s*\(/,
    'timelineView.js never calls Cards.update/updateAsync directly (negative)');
  assert.doesNotMatch(timelineJs, /\$set\s*:/,
    'timelineView.js never builds a raw $set bulk-update document (negative)');
});

test('restoreCardFromTimeline looks up the CURRENT card by id before writing anything', () => {
  const fnStart = timelineJs.indexOf('export async function restoreCardFromTimeline');
  const fnEnd = timelineJs.indexOf('\n}', fnStart);
  const body = timelineJs.slice(fnStart, fnEnd);
  assert.match(body, /ReactiveCache\.getCard\(cardId\)/,
    'reads the live card via ReactiveCache, not a snapshot');
});

test('the restore button is only offered while viewing a historical timestamp', () => {
  // Step 1 (live board) must stay read-only-by-default: the button only
  // renders inside the "if selectedTimestamp" branch, not unconditionally.
  const idx = timelineJade.indexOf('js-restore-card-timeline');
  assert.ok(idx !== -1, 'the restore button exists in the template');
  const before = timelineJade.slice(0, idx);
  assert.ok(before.lastIndexOf('if selectedTimestamp') > before.lastIndexOf('each this.cards'),
    'the restore button is gated behind "if selectedTimestamp"');
});

test('a confirmation step is required before restoring - the click goes through Popup.afterConfirm', () => {
  assert.match(timelineJs, /'click \.js-restore-card-timeline':\s*Popup\.afterConfirm\(\s*'cardRestoreToTimeline'/,
    'the restore click handler is wrapped in Popup.afterConfirm');
  // And the matching confirmation popup template exists with a real confirm
  // button (client/components/main/popup.js's "click .js-confirm" pattern).
  assert.match(timelineJade, /template\(name="cardRestoreToTimelinePopup"\)/,
    'the cardRestoreToTimelinePopup template exists');
  const popupStart = timelineJade.indexOf('template(name="cardRestoreToTimelinePopup")');
  const popupBlock = timelineJade.slice(popupStart, popupStart + 400);
  assert.match(popupBlock, /button\.js-confirm/, 'the popup has a .js-confirm button');
});

test('restoring reuses the exact reconstructed field values, not the live card\'s', () => {
  // The click handler must pass the reconstructed `fields` object captured on
  // the per-card data context, not re-derive values from the live card.
  const idx = timelineJs.indexOf("Popup.afterConfirm('cardRestoreToTimeline'");
  assert.ok(idx !== -1);
  const block = timelineJs.slice(idx, idx + 300);
  assert.match(block, /restoreCardFromTimeline\(cardContext\.cardId, cardContext\.fields\)/);
});

test('the view calls the pure reconstructBoardStateAt() from boardTimeline.js rather than reimplementing it', () => {
  assert.match(timelineJs, /import \{ reconstructBoardStateAt \} from '\/models\/lib\/boardTimeline'/);
  assert.match(timelineJs, /reconstructBoardStateAt\(cards, activities, selected\)/);
});
