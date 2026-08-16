'use strict';

// "Requested By" and "Assigned By" survive the whole way round.
// Run: node tests/requestedAssignedByRoundTrip.test.cjs
//
// They are two free-text fields on every card - who asked for the work, and who
// handed it out - with a checkbox each in Board Settings / Card Settings and a
// place in the card. They were exported and NOT imported, which is the worst
// shape for a bug like this to have: the export file looks complete, the import
// reports success, and the two fields are quietly empty on the other side.
//
// So this walks the round trip: the card shows them, every export carries them,
// and every importer puts them back - including from other trackers, where the
// same idea has another name. Jira calls it the REPORTER. GitHub, Gitea,
// Forgejo and GitLab call it the issue's author: whoever opened it asked for
// the work, as opposed to the assignee who does it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('requestedAssignedByRoundTrip:');

// ── the card ───────────────────────────────────────────────────────────────

test('the card sets them the way it sets Members and Assignee', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  for (const field of ['requester', 'assigner']) {
    const block = jade.slice(jade.indexOf(`js-card-details-${field}`),
      jade.indexOf(`js-card-details-${field}`) + 700);
    assert.ok(/a\.member\.add-member\.card-details-item-add-button/.test(block),
      `${field} has the round + button`);
  }
});

test('Board Settings can turn each of them off', () => {
  const sidebar = read('client/components/sidebar/sidebar.jade');
  for (const cls of ['js-field-has-requested-by', 'js-field-has-assigned-by']) {
    assert.ok(sidebar.includes(cls), `${cls} is in Card Settings`);
  }
});

// ── out ────────────────────────────────────────────────────────────────────

test('every export carries them', () => {
  const places = {
    // The card PDF draws the shared document now, so what it must do is MAP
    // them; models/lib/cardDocument.js is what puts them on the page.
    'the card PDF': ['models/server/ExporterCardPDF.js', /requestedBy: card\.requestedBy/],
    'the shared card document': ['models/lib/cardDocument.js', /add\('requested-by', data\.requestedBy\)/],
    'the card Excel': ['models/server/ExporterExcelCard.js', /\['requested-by', card\.requestedBy/],
    'the board CSV': ['models/exporter.js', /'requested-by','assigned-by'/],
    'the board Excel table': ['models/server/ExporterExcel.js', /jcard\.requestedBy/],
  };
  for (const [what, [file, pattern]] of Object.entries(places)) {
    assert.ok(pattern.test(read(file)), `${what} exports them`);
  }
});

test('the board Excel table carries both, header and row (negative)', () => {
  // It was the one export that had neither, so a board exported there lost who
  // asked for a card and who assigned it.
  const excel = read('models/server/ExporterExcel.js');
  assert.ok(/__\('requested-by'/.test(excel) && /__\('assigned-by'/.test(excel),
    'both column headers');
  assert.ok(/jcard\.requestedBy \|\| ''/.test(excel) && /jcard\.assignedBy \|\| ''/.test(excel),
    'and both values, so header and row still line up');
});

// ── and back in ────────────────────────────────────────────────────────────

test('the WeKan importer puts them back', () => {
  // The round trip was broken here: exported, never imported.
  const creator = read('models/wekanCreator.js');
  assert.ok(/requestedBy: card\.requestedBy \|\| ''/.test(creator), 'requestedBy');
  assert.ok(/assignedBy: card\.assignedBy \|\| ''/.test(creator), 'assignedBy');
  assert.ok(/A round trip that loses a field is worse/.test(creator),
    'with the reason, because an export that looks complete is the trap');
});

test('the per-menu scoped import puts them back too', () => {
  const importer = read('models/server/scopedImporter.js');
  assert.ok(/toCreate\.requestedBy = card\.requestedBy/.test(importer), 'requestedBy');
  assert.ok(/toCreate\.assignedBy = card\.assignedBy/.test(importer), 'assignedBy');
  assert.ok(/hasField\('people'\)/.test(importer),
    'under the People part, which is the section they belong to');
});

test("Jira's Reporter arrives as Requested By", () => {
  const jira = read('models/jiraCreator.js');
  assert.ok(/const reporter = fields\.reporter/.test(jira), 'the reporter is read');
  assert.ok(/cardToCreate\.requestedBy =/.test(jira), 'and lands in requestedBy');
  assert.ok(/displayName \|\| reporter\.name/.test(jira),
    'as a NAME - free text, so it survives a Jira nobody here has an account on');
});

test("an issue tracker's author arrives as Requested By", () => {
  const parsers = read('models/lib/externalParsers.js');
  const kanboard = read('models/kanboardCreator.js');
  assert.ok(/requested_by: \(issue\.user/.test(parsers),
    'GitHub, Gitea and Forgejo: whoever opened the issue');
  assert.ok(/requested_by: issue\.author/.test(parsers), 'GitLab: the same by another name');
  assert.ok(/task\.requested_by/.test(kanboard),
    'and the creator that every external parser feeds reads it');
});

test('a source without the field imports nothing for it (negative)', () => {
  // Trello and CSV have no such concept; they must not invent one.
  const kanboard = read('models/kanboardCreator.js');
  assert.ok(/if \(task\.requested_by\)/.test(kanboard),
    'the field is set only when the source had one');
  const trello = read('models/trelloCreator.js');
  assert.ok(!/requestedBy/.test(trello), 'Trello has none and gains none');
});

console.log(`\nrequestedAssignedByRoundTrip: ${passed} tests passed`);
