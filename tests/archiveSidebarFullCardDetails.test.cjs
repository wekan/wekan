// #1504: clicking an archived card in the Archive sidebar used to have no
// click handler at all - the card only ever showed as a narrow minicard
// preview inside the sidebar's own width, with no way to see the rest of its
// fields. Clicking one now opens the SAME full card-detail popup a normal
// board card opens (cardDetailsPopup / Template.cardDetails), reusing the
// exact mechanism myCards.js and resultCard.js already use for their own
// minicards, rather than a parallel "archived card preview" component. And
// since the card is archived, the popup's own action menu gets a Restore
// entry it did not have before, so the card can be put back on its board
// without leaving the popup.
//
// Run: node tests/archiveSidebarFullCardDetails.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const sidebarJs = read('client/components/sidebar/sidebarArchives.js');
const sidebarJade = read('client/components/sidebar/sidebarArchives.jade');
const cardDetailsJs = read('client/components/cards/cardDetails.js');
const cardDetailsJade = read('client/components/cards/cardDetails.jade');

console.log('archiveSidebarFullCardDetails:');

test('the sidebar lists archived cards with the SHARED minicard, not a parallel preview', () => {
  // #3199's wrapper is still there: one archived-card-item per card, holding
  // the shared minicard and that card's own Restore/Delete links.
  assert.ok(/\.archived-card-item/.test(sidebarJade), 'the wrapper is unchanged');
  assert.ok(/\+minicard\(this\)/.test(sidebarJade),
    'the LIST still renders the shared minicard component - scope is click behaviour only');
  // No bespoke "archived card preview" template introduced anywhere in the sidebar.
  assert.ok(!/archivedCardPreview/i.test(sidebarJade) && !/archivedCardPreview/i.test(sidebarJs),
    'no parallel preview component was built');
});

test('clicking an archived card opens the SAME full card-detail popup as a normal card', () => {
  const at = sidebarJs.indexOf("'click .archived-card-item .js-minicard'");
  assert.notStrictEqual(at, -1, 'a click handler on the minicard now exists');
  const body = sidebarJs.slice(at, sidebarJs.indexOf('\n  },', at));

  // Same mechanism as myCards.js / resultCard.js's own `.js-minicard` handlers:
  // popupCardId/popupCardBoardId Session vars, then Popup.open('cardDetails') -
  // the identical `cardDetailsPopup` template (+cardDetails(popupCard)) a
  // normal board card renders through Utils.isMiniScreen()'s popup branch.
  assert.ok(/Session\.set\('popupCardId', card\._id\)/.test(body),
    'the same popupCardId session var other minicards use');
  assert.ok(/Session\.set\('popupCardBoardId', card\.boardId\)/.test(body),
    'and popupCardBoardId, so Utils.getPopupCard() can resolve it');
  assert.ok(/Popup\.open\('cardDetails'\)/.test(body),
    'and it opens the SAME cardDetails popup template - not a bespoke one');
});

test('the popup opened is the real cardDetails template, full size, not a narrow variant', () => {
  assert.ok(/template\(name="cardDetailsPopup"\)/.test(cardDetailsJade), 'the shared popup template exists');
  const at = cardDetailsJade.indexOf('template(name="cardDetailsPopup")');
  const body = cardDetailsJade.slice(at, cardDetailsJade.indexOf('\n\n', at));
  assert.ok(/\+cardDetails\(popupCard\)/.test(body),
    'cardDetailsPopup renders the full cardDetails template - same one a normal card uses');
});

test('opening an archived card no longer offers "Archive" - it offers "Restore" instead', () => {
  // Both action-menu copies (canModifyCard and the read-only one) hide the
  // Archive item while `archived` is true...
  const archiveBlocks = [...cardDetailsJade.matchAll(/unless archived\n\s+hr\n\s+ul\.pop-over-list\n\s+li\n\s+a\.js-archive/g)];
  assert.ok(archiveBlocks.length >= 2, 'both action-menu copies hide Archive while archived');

  // ...and now BOTH copies show a Restore item in exactly that place instead.
  const restoreBlocks = [...cardDetailsJade.matchAll(/if archived\n\s+hr\n\s+ul\.pop-over-list\n\s+li\n\s+a\.js-restore-archived-card/g)];
  assert.strictEqual(restoreBlocks.length, 2,
    'both the canModifyCard and read-only action-menu copies gained a Restore item');
  assert.ok(/\{\{_ 'restore'\}\}/.test(cardDetailsJade), 'labelled with the existing restore key - no new i18n key needed');
});

test('the Restore action calls the existing card.restore() un-archive mutation', () => {
  const at = cardDetailsJs.indexOf("'click .js-restore-archived-card'");
  assert.notStrictEqual(at, -1, 'the handler exists');
  const body = cardDetailsJs.slice(at, cardDetailsJs.indexOf('\n  },', at));
  assert.ok(/await card\.restore\(\)/.test(body), 'it calls the same Cards.restore() every other Restore link uses');
  // Same target-list fallback the Archive sidebar's own Restore link already
  // has (a card whose list was itself archived/deleted needs somewhere to
  // land) - reused rather than re-invented, and guarded so canBeRestored()
  // is never called against a missing list.
  assert.ok(/ReactiveCache\.getList\(card\.listId\)/.test(body),
    'checks the current list exists first, like sidebarArchives.js does');
  assert.ok(/Popup\.open\('restoreArchivedCardToList'\)/.test(body),
    'and falls back to the SAME restoreArchivedCardToList popup sidebarArchives.js opens');
  assert.ok(/canBeRestored/.test(body), 'canBeRestored() is still consulted before restoring');
});

test('sidebarArchives.js already defines the restoreArchivedCardToListPopup this handler reuses', () => {
  // Confirms the fallback popup name referenced above is real, not a typo -
  // it is defined once, in the sidebar, and both callers share it.
  assert.ok(/Template\.restoreArchivedCardToListPopup\.events/.test(sidebarJs),
    'the popup this card-detail Restore action falls back to is defined in sidebarArchives.js');
  assert.ok(/template\(name="restoreArchivedCardToListPopup"\)/.test(sidebarJade));
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\narchiveSidebarFullCardDetails: ${passed} tests passed`);
