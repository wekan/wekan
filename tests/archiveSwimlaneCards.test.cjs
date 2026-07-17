'use strict';

// Plain-Node unit test (no Meteor) for the swimlane archive/restore card
// cascade. Run: node tests/archiveSwimlaneCards.test.cjs
//
// Regression guard for #2292 ("Archive a swimlane drives to deletion of all
// cards included"): archiving a swimlane used to flag only the swimlane
// document, leaving its cards `archived: false` under an archived swimlane —
// invisible in every board view AND in the Archive sidebar (which lists only
// `archived: true` documents), and reassigned to another swimlane by the
// startup rescue of #1959/#1971 (server/lib/schemaUpgradeSteps.js), so a
// later restore found the swimlane empty. The fix mirrors the card cascade
// of Lists.archive()/restore() (models/lists.js): Swimlanes.archive()
// archives the swimlane's still-unarchived cards, and Swimlanes.restore()
// restores exactly the cards that were archived WITH the swimlane.

const assert = require('assert');
const {
  cardsToArchiveWithSwimlane,
  cardsToRestoreWithSwimlane,
} = require('../models/lib/swimlaneArchive');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- tiny in-memory board: two swimlanes, cards in both ---------------------
// Simulates exactly what models/swimlanes.js archive()/restore() do with the
// helpers: archive() captures the swimlane's archivedAt FIRST, then archives
// each selected card with its own (later) archivedAt; restore() restores the
// cards selected by cardsToRestoreWithSwimlane(swimlane.archivedAt).

function makeCard(id, swimlaneId, extra = {}) {
  return { _id: id, swimlaneId, archived: false, archivedAt: null, ...extra };
}

function archiveSwimlane(swimlane, cards, now) {
  // model: const archivedAt = new Date(); cascade; then flag the swimlane
  const archivedAt = new Date(now);
  const swimlaneCards = cards.filter(c => c.swimlaneId === swimlane._id);
  for (const card of cardsToArchiveWithSwimlane(swimlaneCards)) {
    card.archived = true;
    card.archivedAt = new Date(now + 1); // card.archive() stamps AFTER capture
  }
  swimlane.archived = true;
  swimlane.archivedAt = archivedAt;
}

function restoreSwimlane(swimlane, cards) {
  const swimlaneCards = cards.filter(c => c.swimlaneId === swimlane._id);
  for (const card of cardsToRestoreWithSwimlane(swimlaneCards, swimlane.archivedAt)) {
    card.archived = false; // card.restore() clears the flag, keeps archivedAt
  }
  swimlane.archived = false;
}

const T0 = Date.parse('2026-07-17T10:00:00Z');

function makeFixture() {
  const laneA = { _id: 'laneA', archived: false, archivedAt: null };
  const laneB = { _id: 'laneB', archived: false, archivedAt: null };
  const cards = [
    makeCard('a1', 'laneA'),
    makeCard('a2', 'laneA'),
    // archived by the USER an hour before the swimlane is archived:
    makeCard('aPre', 'laneA', { archived: true, archivedAt: new Date(T0 - 3600000) }),
    makeCard('b1', 'laneB'),
  ];
  return { laneA, laneB, cards };
}

// --- cardsToArchiveWithSwimlane ---------------------------------------------

test('selects only unarchived cards for the archive cascade', () => {
  const { cards } = makeFixture();
  const laneACards = cards.filter(c => c.swimlaneId === 'laneA');
  const ids = cardsToArchiveWithSwimlane(laneACards).map(c => c._id);
  assert.deepStrictEqual(ids.sort(), ['a1', 'a2']);
});

test('negative: already-archived card is NOT selected (not double-touched)', () => {
  const { cards } = makeFixture();
  const laneACards = cards.filter(c => c.swimlaneId === 'laneA');
  assert.ok(!cardsToArchiveWithSwimlane(laneACards).some(c => c._id === 'aPre'));
});

test('tolerates empty/null input', () => {
  assert.deepStrictEqual(cardsToArchiveWithSwimlane([]), []);
  assert.deepStrictEqual(cardsToArchiveWithSwimlane(null), []);
  assert.deepStrictEqual(cardsToArchiveWithSwimlane([null]), []);
});

// --- cardsToRestoreWithSwimlane ---------------------------------------------

test('selects cards archived at/after the swimlane archivedAt', () => {
  const swimlaneArchivedAt = new Date(T0);
  const cards = [
    { _id: 'with', archived: true, archivedAt: new Date(T0 + 1) },
    { _id: 'same', archived: true, archivedAt: new Date(T0) },
    { _id: 'before', archived: true, archivedAt: new Date(T0 - 1) },
    { _id: 'unarchived', archived: false, archivedAt: null },
    { _id: 'noStamp', archived: true, archivedAt: null },
  ];
  const ids = cardsToRestoreWithSwimlane(cards, swimlaneArchivedAt).map(c => c._id);
  assert.deepStrictEqual(ids.sort(), ['same', 'with']);
});

test('negative: legacy swimlane without archivedAt restores no cards', () => {
  const cards = [{ _id: 'x', archived: true, archivedAt: new Date(T0) }];
  assert.deepStrictEqual(cardsToRestoreWithSwimlane(cards, null), []);
  assert.deepStrictEqual(cardsToRestoreWithSwimlane(cards, undefined), []);
});

test('negative: invalid swimlane archivedAt restores no cards', () => {
  const cards = [{ _id: 'x', archived: true, archivedAt: new Date(T0) }];
  assert.deepStrictEqual(cardsToRestoreWithSwimlane(cards, 'not a date'), []);
});

// --- end-to-end simulation of the model flow --------------------------------

test('archiving a swimlane archives its unarchived cards (the #2292 fix)', () => {
  const { laneA, cards } = makeFixture();
  archiveSwimlane(laneA, cards, T0);

  assert.strictEqual(laneA.archived, true);
  const a1 = cards.find(c => c._id === 'a1');
  const a2 = cards.find(c => c._id === 'a2');
  assert.strictEqual(a1.archived, true, 'card a1 must be archived with the lane');
  assert.strictEqual(a2.archived, true, 'card a2 must be archived with the lane');
  // no unarchived card may remain under the archived swimlane — the broken
  // state #2292 reported and the startup rescue has to repair
  assert.ok(
    !cards.some(c => c.swimlaneId === 'laneA' && c.archived === false),
    'no unarchived card may remain under an archived swimlane',
  );
});

test('restoring the swimlane brings back the cards archived with it', () => {
  const { laneA, cards } = makeFixture();
  archiveSwimlane(laneA, cards, T0);
  restoreSwimlane(laneA, cards);

  assert.strictEqual(laneA.archived, false);
  assert.strictEqual(cards.find(c => c._id === 'a1').archived, false);
  assert.strictEqual(cards.find(c => c._id === 'a2').archived, false);
});

test('negative: individually pre-archived card stays archived through the round-trip', () => {
  const { laneA, cards } = makeFixture();
  const before = cards.find(c => c._id === 'aPre').archivedAt;
  archiveSwimlane(laneA, cards, T0);

  const aPre = cards.find(c => c._id === 'aPre');
  assert.strictEqual(aPre.archived, true, 'stays archived while lane is archived');
  assert.strictEqual(aPre.archivedAt, before, 'archivedAt not overwritten by the cascade');

  restoreSwimlane(laneA, cards);
  assert.strictEqual(aPre.archived, true, 'restore must not resurrect it');
});

test("negative: other swimlanes' cards are untouched by archive AND restore", () => {
  const { laneA, laneB, cards } = makeFixture();
  archiveSwimlane(laneA, cards, T0);

  const b1 = cards.find(c => c._id === 'b1');
  assert.strictEqual(b1.archived, false, 'laneB card not archived');
  assert.strictEqual(b1.archivedAt, null, 'laneB card not stamped');
  assert.strictEqual(laneB.archived, false, 'laneB itself untouched');

  restoreSwimlane(laneA, cards);
  assert.strictEqual(b1.archived, false, 'laneB card still untouched after restore');
});

test('re-archiving after restore archives the restored cards again', () => {
  const { laneA, cards } = makeFixture();
  archiveSwimlane(laneA, cards, T0);
  restoreSwimlane(laneA, cards);
  archiveSwimlane(laneA, cards, T0 + 60000);
  restoreSwimlane(laneA, cards);

  assert.strictEqual(cards.find(c => c._id === 'a1').archived, false);
  assert.strictEqual(cards.find(c => c._id === 'aPre').archived, true);
});

console.log(`\n${passed} tests passed`);
