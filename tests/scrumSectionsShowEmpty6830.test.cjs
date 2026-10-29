'use strict';

// #6830: with Board Settings / Card's "Show empty fields" on (#6806), every
// opened card showed the "Scrum settings" heading and its sections although
// Board Settings / Scrum had none of its fields turned on. The Scrum fields
// are the card's only sections with no board flag in the template to read, so
// cardDetails.js orderedSectionsOf decides them alone. Like Members or Vote, a
// Scrum field is shown only when the board allows it (boardAllows:
// scrum.visibility).
//
// Deliberate change (2026-10-28): "Show empty fields", "Show empty" and "On
// this card" are gone - every card shows every field the board allows, empty
// or not. That makes #6830's rule the whole rule, so this suite keeps it: a
// Scrum section exactly when the board allows it (and its Card Settings
// section is not hidden whole on Show on Card), whatever the card holds.
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
const shownScrum = board => SCRUM.filter(k => f.boardAllows(f.boardForCard(board), k));

test('all six Scrum fields are per-card fields', () => {
  assert.deepStrictEqual(SCRUM, ['scrumSprint', 'scrumPastSprints', 'scrumRelease',
    'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank']);
});

test('the report: Scrum all off - no Scrum section, whatever legacy settings remain', () => {
  assert.deepStrictEqual(shownScrum({ _id: 'b1', showEmptyCardFields: true }), []);
  assert.deepStrictEqual(shownScrum({ _id: 'b1', cardFieldsAlwaysShown: SCRUM, scrum: { visibility: {} } }), []);
});

test('a Scrum field the board turned on is shown, empty or not', () => {
  const board = { _id: 'b1', scrum: { visibility: { cardSprint: true, cardIssueType: true } } };
  assert.deepStrictEqual(shownScrum(board), ['scrumSprint', 'scrumIssueType']);
});

test('negative: the Scrum section hidden whole on Show on Card hides them all', () => {
  const board = { _id: 'b1', scrum: { visibility: { cardSprint: true } }, cardSettingsHiddenOnCard: ['scrum'] };
  assert.deepStrictEqual(shownScrum(board), []);
});

test('the opened card asks boardAllows, through the card view, for every Scrum field', () => {
  // 2026-10-28: Scrum is ONE section of the opened card (Card Settings'), drawn
  // when the board allows one of its fields, each field drawn when allowed.
  const js = read('client/components/cards/cardDetails.js');
  const body = js.slice(js.indexOf('function orderedSectionsOf(card'));
  const fn = body.slice(0, body.indexOf('\n}\n'));
  assert.match(fn, /const board = boardForCard\(raw\);/);
  assert.match(fn, /require\('\/models\/lib\/cardShownFields'\)/);
  assert.match(fn, /\.filter\(id => cardSectionHasContent\(card, board, id\)\)/);
  assert.match(js, /case 'scrum': return cardSectionFields\(card, 'scrum'\)\.some\(key => boardAllows\(board, key\)\);/);
  assert.match(js, /const board = boardForCard\(this\?\.board\?\.\(\)\);\n\s+return cardSectionFields\(this, 'scrum'\)\.filter\(key => boardAllows\(board, key\)\);/);
  assert.match(read('client/components/cards/cardDetails.jade'), /if isSectionOpen "scrum"\n\s+each field in orderedScrumFields/);
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
