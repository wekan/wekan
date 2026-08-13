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

// ── the selection reaches every format ─────────────────────────────────────

test('every board export link is built by the one url helper', () => {
  // The four that took the selection used to be the only ones; CSV, TSV,
  // Kanboard and the eleven dialects built their own query strings and could
  // not carry it.
  for (const helper of ['exportUrlPDF', 'exportUrlExcel', 'exportUrlJsonSelected',
    'exportUrlZip', 'exportUrlKanboard', 'exportUrlExternal', 'exportCsvUrl',
    'exportScsvUrl', 'exportTsvUrl']) {
    const at = js.indexOf(`${helper}(`);
    assert.ok(at !== -1, `${helper} exists`);
    const body = js.slice(at, js.indexOf('},', at) + 2);
    assert.ok(/boardScopeUrl\(/.test(body), `${helper} goes through boardScopeUrl`);
  }
  assert.ok(/exportUrlFor\(`\/api\/boards\/:boardId\/\$\{pathSuffix\}`/.test(js),
    'which is the shared builder, so `fields` rides along with all of them');
});

test('a CSV honours the selection as COLUMNS', () => {
  // A CSV has no comments to leave out; what it has is columns, and unticking
  // People removes five of them.
  const fields = read('models/lib/exportFields.js');
  assert.ok(/CSV_COLUMN_PARTS/.test(fields), 'each column knows which part it belongs to');
  assert.ok(/csvColumnMask/.test(fields), 'and a mask is built from the selection');
  const exporter = read('models/exporter.js');
  assert.ok(/applyMask\(columnHeaders, columnMask\)/.test(exporter), 'the header is filtered');
  assert.ok(/applyMask\(buildCsvCardRow\([^)]*\), columnMask\)/.test(exporter),
    'and every row is filtered by the SAME mask, so the two cannot drift');
});

test('a format only drops what it actually has (negative)', () => {
  // A Trello or Jira export carries a title, a description, a due date and
  // labels. Pretending the selection removes comments from it would be a lie in
  // the UI; gating what is there is the honest half.
  const external = read('models/lib/externalExporters.js');
  assert.ok(/a format drops what it has/.test(external), 'the reason is written down');
  assert.ok(/wanted\.has\('description'\)/.test(external)
    && /wanted\.has\('labels'\)/.test(external)
    && /wanted\.has\('dates'\)/.test(external),
    'the three parts these formats carry are gated');
  assert.ok(!/comments|checklists|attachments/.test(
    external.slice(external.indexOf('function gateItem'), external.indexOf('async function collect'))),
    'and nothing pretends to gate what is not there');
});

// ── the popup is big when there is room ────────────────────────────────────

test('a wide window lays the menu out in columns', () => {
  const popupCss = read('client/components/main/popup.css');
  const rule = popupCss.slice(popupCss.indexOf("data-popup='exportBoardPopup'"));
  assert.ok(/width: min\(90vw, 760px\)/.test(rule.slice(0, 400)),
    'wide enough for several columns');
  assert.ok(/grid-template-columns: repeat\(auto-fill, minmax\(210px, 1fr\)\)/.test(rule),
    'and the lists fill it with as many columns as fit');
  assert.ok(/min-width: 801px/.test(popupCss.slice(popupCss.lastIndexOf('@media', popupCss.indexOf("data-popup='exportBoardPopup'")))),
    'desktop only - below 800px every popup is a full-screen sheet already');
});

test('the width is mirrored where the clamp reads it (negative)', () => {
  // popupOffset.js places a popup using its width. Left at the default 380,
  // a 760px popup opened near the right edge lands half off the screen.
  const offset = read('client/lib/popupOffset.js');
  assert.ok(/exportBoardPopup: 760/.test(offset),
    'the clamp knows the real width');
  assert.ok(/Same number as popup.css/.test(offset),
    'and says where the other copy is');
});

console.log(`\nexportBoardPopupOrder: ${passed} tests passed`);
