'use strict';

// The board's Export menu, grouped and in order.
// Run: node tests/exportBoardPopupOrder.test.cjs
//
// It was one flat list of nineteen entries, each of them spelling out its whole
// family: "Export / CSV (,)", "Export / CSV (;)", "Export / TSV", then eleven
// lines beginning "Export / JSON /". The part that differed - the only part
// worth reading - started two thirds of the way along every line.
//
// It is grouped now. A subheading names the family once, and the entries under
// it say only what they are:
//
//   PDF
//   Excel
//   Dependencies:  JSON, SVG
//   HTML
//   CSV:           (,), (;), TSV
//   JSON:          JSON, JSON (without attachments), .zip, Kanboard, Trello,
//                  Jira, NextCloud Deck, OpenProject, GitHub, GitLab, Gitea,
//                  Forgejo, Asana, Zenkit
//
// The parts checkboxes stay at the top, from the shared body - the board popup
// passes `hideFormats` because it lays the formats out itself, and borrows the
// selection rather than growing a second copy of it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/sidebar/sidebar.jade');
const js = read('client/components/sidebar/sidebar.js');
const scopeJade = read('client/components/boards/exportScope.jade');
const css = read('client/components/sidebar/sidebar.css');

const popup = jade.slice(jade.indexOf('template(name="exportBoardPopup")'),
  jade.indexOf('template(name="labelsWidget")'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('exportBoardPopupOrder:');

test('the formats appear in the order asked for', () => {
  const order = [
    'exportUrlPDF', 'exportUrlExcel',
    'js-export-dependencies-json', 'js-export-dependencies-svg',
    'html-export-board',
    'exportCsvUrl', 'exportScsvUrl', 'exportTsvUrl',
    'exportUrlJsonSelected', 'exportUrlJsonNoAttachments', 'exportUrlZip',
    'exportUrlKanboard', "'trello'", "'jira'", "'deck'", "'openproject'",
    "'github'", "'gitlab'", "'gitea'", "'forgejo'", "'asana'", "'zenkit'",
  ];
  let previous = -1;
  for (const entry of order) {
    const at = popup.indexOf(entry);
    assert.ok(at !== -1, `${entry} is in the menu`);
    assert.ok(at > previous, `${entry} comes after the one before it`);
    previous = at;
  }
});

test('three subheadings name the three families', () => {
  const headings = [...popup.matchAll(/h4\.pop-over-list-subheading (.+)/g)].map(m => m[1].trim());
  assert.deepStrictEqual(headings, ["{{_ 'card-dependencies'}}", 'CSV', 'JSON'],
    'Dependencies, CSV and JSON - in that order');
  assert.ok(/\.pop-over-list-subheading \{/.test(css), 'and they are styled as headings');
});

test('an entry under a subheading says only what it is', () => {
  // "Export / CSV (,)" under a "CSV" heading says CSV twice and Export once
  // more than the menu it is already in.
  for (const noise of ["| {{_ 'export'}} / CSV", "| {{_ 'export'}} / JSON / Trello",
    "| {{_ 'export'}} / TSV"]) {
    assert.ok(!popup.includes(noise), `${noise} is not repeated under its heading`);
  }
  assert.ok(/\| \(,\)/.test(popup) && /\| \(;\)/.test(popup) && /\| TSV/.test(popup),
    'the CSV entries are just their separators');
  assert.ok(/\| Trello/.test(popup) && /\| Zenkit/.test(popup),
    'and the JSON dialects are just their names');
});

test('the parts checkboxes are still there, and are not duplicated', () => {
  assert.ok(/\+exportScopeBody\(title=boardTitle hideFormats=true\)/.test(popup),
    'the shared body provides the selection');
  assert.ok(/unless hideFormats/.test(scopeJade),
    'and its own format list is what `hideFormats` turns off');
  // The board popup builds its URLs with the SAME helper the shared body uses,
  // so a menu cannot send a different selection than the one on screen.
  assert.ok(/exportUrlFor/.test(js), 'one url builder');
  assert.ok(/boardScopeUrl\('exportPDF'\)/.test(js), 'used for every board format');
});

test('the .zip sits with the JSON it is a container for', () => {
  const jsonHeading = popup.indexOf('h4.pop-over-list-subheading JSON');
  const zip = popup.indexOf('exportUrlZip');
  const kanboard = popup.indexOf('exportUrlKanboard');
  assert.ok(jsonHeading < zip && zip < kanboard,
    'after the two JSON entries and before the dialects');
});

test('every format that existed before is still offered (negative)', () => {
  // A reordering must not lose an entry. These are the ones that were in the
  // flat list.
  for (const kept of ['exportCsvUrl', 'exportScsvUrl', 'exportTsvUrl',
    'exportUrlKanboard', 'html-export-board', 'js-export-dependencies-json',
    'js-export-dependencies-svg', 'exportUrlExternal']) {
    assert.ok(popup.includes(kept), `${kept} survived the regrouping`);
  }
  const dialects = ['trello', 'jira', 'deck', 'openproject', 'github', 'gitlab',
    'gitea', 'forgejo', 'asana', 'zenkit'];
  for (const dialect of dialects) {
    assert.ok(popup.includes(`'${dialect}'`), `${dialect} is still exported`);
  }
});

console.log(`\nexportBoardPopupOrder: ${passed} tests passed`);
