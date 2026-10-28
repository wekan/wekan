'use strict';

// #6830: with Board Settings / Card's "Show empty fields" on (#6806), every
// opened card showed the "Scrum settings" heading and its sections although
// Board Settings / Scrum had none of its fields turned on. The Scrum fields
// are the card's only sections with no board flag in the template to read, so
// cardDetails.js orderedSectionsOf decides them alone - and it asked only
// whether the card shows the field, which Show empty fields answers yes for
// every field. Like Members or Vote, a Scrum field is shown only when the
// board allows it first (boardAllows: scrum.visibility).
// docs/Features/Cards/Card-Fields.md
// Run: node tests/scrumSectionsShowEmpty6830.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const f = require('../models/lib/cardShownFields.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('scrumSectionsShowEmpty6830:');

const SCRUM = f.FIELD_KEYS.filter(k => /^scrum[A-Z]/.test(k));
const emptyCard = { _id: 'c1', boardId: 'b1' };
// The rule orderedSectionsOf applies to a Scrum section.
const shownScrum = (board, card = emptyCard) =>
  SCRUM.filter(k => f.boardAllows(board, k) && f.isShown(k, card, {}, board));

test('all six Scrum fields are per-card fields', () => {
  assert.deepStrictEqual(SCRUM, ['scrumSprint', 'scrumPastSprints', 'scrumRelease',
    'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank']);
});

test('the report: Show empty fields on, Scrum all off - no Scrum section', () => {
  const board = { _id: 'b1', showEmptyCardFields: true };
  // What the card alone says - the cause: every Scrum field "shown".
  assert.deepStrictEqual(SCRUM.filter(k => f.isShown(k, emptyCard, {}, board)), SCRUM);
  assert.deepStrictEqual(shownScrum(board), []);
  assert.deepStrictEqual(shownScrum({ ...board, scrum: { visibility: {} } }), []);
});

test('Show empty (cardFieldsAlwaysShown) does not show a Scrum field the board has off', () => {
  const board = { _id: 'b1', cardFieldsAlwaysShown: SCRUM, scrum: { visibility: { cardSprint: false } } };
  assert.deepStrictEqual(shownScrum(board), []);
});

test('"On this card" does not show a Scrum field the board has off', () => {
  const card = { ...emptyCard, shownFields: ['scrumSprint', 'scrumRelease'] };
  assert.deepStrictEqual(shownScrum({ _id: 'b1' }, card), []);
});

test('a Scrum field the board turned on is still shown empty by Show empty fields', () => {
  const board = { _id: 'b1', showEmptyCardFields: true, scrum: { visibility: { cardSprint: true, cardIssueType: true } } };
  assert.deepStrictEqual(shownScrum(board), ['scrumSprint', 'scrumIssueType']);
});

test('negative: a turned-on Scrum field that is empty stays hidden without Show empty fields', () => {
  const board = { _id: 'b1', scrum: { visibility: { cardSprint: true } } };
  assert.deepStrictEqual(shownScrum(board), []);
  assert.deepStrictEqual(shownScrum(board, { ...emptyCard, scrum: { sprintId: 's1' } }), ['scrumSprint']);
});

test('orderedSectionsOf asks boardAllows before the card, for every Scrum section', () => {
  const js = read('client/components/cards/cardDetails.js');
  const body = js.slice(js.indexOf('function orderedSectionsOf(card)'));
  const fn = body.slice(0, body.indexOf('\n}\n'));
  assert.match(fn, /boardAllows\(board, s\) && cardShowsField\(card, s\)/);
  assert.match(fn, /require\('\/models\/lib\/cardShownFields'\)/);
});

test('negative: nothing else in the client decides a Scrum section by the card alone', () => {
  const dir = path.join(root, 'client');
  const offenders = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    if (!/\.js$/.test(e.name)) return;
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (/\^scrum\[A-Z\]/.test(line) && /cardShowsField|isShown\(/.test(line) && !/boardAllows/.test(line)) {
        offenders.push(`${path.relative(root, p)}:${i + 1}`);
      }
    });
  });
  walk(dir);
  assert.deepStrictEqual(offenders, []);
});

console.log(`scrumSectionsShowEmpty6830: ${passed} passed`);
