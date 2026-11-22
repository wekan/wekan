'use strict';

// Admin Panel / Settings / Security / "Disable all import" says "the server
// rejects any import request". The board import menu was hidden, and most
// import paths asked assertImportEnabled(), but the Trello API import
// (trelloStartImport / trelloResumeImport), the iCalendar import (DDP and
// REST) and the Scrum transfer import into a board did not
// (docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
//
// This holds the shape tree-wide: every server Meteor method or REST route
// whose name says it imports must ask assertImportEnabled() - directly, or
// by handing the request to the importBoard method, which asks it - or be
// listed below with the reason it is not an import of board data.
// Run: node tests/importDisabledEverywhere.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const NOT_AN_IMPORT = {
  'reconcileImportedUsers': 'maps placeholder users of an import already made',
  'mergeImportedUser': 'maps placeholder users of an import already made',
  'mapImportedBoardMember': 'maps placeholder users of an import already made',
  'importRunsInterrupted': 'lists interrupted imports for Admin Panel / Problems',
  'importRunDiscard': 'repairs an interrupted import: removes what it left',
  'importRunKeep': 'repairs an interrupted import: keeps what it left',
  'scrum.resumeImport': 'repairs an interrupted Scrum import',
  'scrum.discardImport': 'repairs an interrupted Scrum import',
  'githubOrgCancelImport': 'stops a running import',
  'githubOrgClearImport': 'clears a finished import job',
  'trelloCancelImport': 'stops a running import',
  'trelloClearImportJob': 'clears a finished import job',
  'importReportForBoard': 'reads the report of an import already made',
  'csvImportGuessMapping': 'guesses CSV columns; asks assertImportEnabled anyway',
  'excelImportPreview': 'previews a file; asks assertImportEnabled anyway',
  'rules.importWrikeWorkflow': 'adds rules to an existing board from Rules / Import; a board admin\'s rules, not board data',
  'importBoardDependencies': 'adds dependency lines between cards that already exist',
  'importMyDependencies': 'adds the member\'s own dependency lines between cards that already exist',
  'cloudPanelImportDomain': 'the Cloud Panel\'s own customer import, outside this WeKan\'s settings',
  'cloudPanelImportChat': 'the Cloud Panel\'s own customer import, outside this WeKan\'s settings',
};

function blockAt(src, from) {
  const open = src.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      for (i += 1; i < src.length && src[i] !== c; i += 1) if (src[i] === '\\') i += 1;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  // A regular-expression literal with a quote in it can defeat this scanner;
  // the next 4000 characters are then the body, which over-reads rather than
  // missing a call.
  return src.slice(open, open + 4000);
}

function sources() {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['tests', 'node_modules', 'lib'].includes(entry.name) && dir === 'models') continue;
        if (['tests', 'node_modules'].includes(entry.name)) continue;
        walk(rel);
      } else if (entry.name.endsWith('.js') && !/Creator\.js$/.test(entry.name)) {
        out.push(rel);
      }
    }
  };
  ['server', 'models'].forEach(walk);
  return out;
}

const ASKS = /assertImportEnabled\(|refuseDisabledImport\(|callAsync\('importBoard'/;

test('every import method and route asks assertImportEnabled, or says why it is no import (negative, tree-wide)', () => {
  const missing = [];
  const seen = new Set();
  for (const rel of sources()) {
    const src = read(rel);
    // File-local helpers that ask it (server/apiImport.js prepare()).
    const helpers = [...src.matchAll(/^(?:async )?function (\w+)\s*\(/gm)]
      .filter(h => ASKS.test(blockAt(src, src.indexOf(')', h.index)))).map(h => h[1]);
    const asks = body => ASKS.test(body) || helpers.some(name => new RegExp(`\\b${name}\\(`).test(body));
    for (const m of src.matchAll(/^\s*async '?([A-Za-z.]*[iI]mport[A-Za-z.]*)'?\s*\(/gm)) {
      const name = m[1];
      seen.add(name);
      if (NOT_AN_IMPORT[name]) continue;
      if (!asks(blockAt(src, src.indexOf(')', m.index)))) missing.push(`${rel} ${name}`);
    }
    for (const m of src.matchAll(/WebApp\.handlers\.(?:post|put)\(\s*'([^']*import[^']*|[^']*\/ics)'/gi)) {
      seen.add(m[1]);
      if (!ASKS.test(blockAt(src, m.index + m[0].length))) missing.push(`${rel} ${m[1]}`);
    }
  }
  assert.deepStrictEqual(missing, [], 'these import without asking whether import is disabled');
  const stale = Object.keys(NOT_AN_IMPORT).filter(name => !seen.has(name));
  assert.deepStrictEqual(stale, [], 'listed as no import, but there is no such method any more');
});

test('the three that did not ask, ask now, after their argument checks', () => {
  const trello = read('server/trelloApiImport.js');
  for (const name of ['trelloStartImport', 'trelloResumeImport']) {
    const body = blockAt(trello, trello.indexOf(')', trello.indexOf(`  async ${name}(`)));
    const at = body.indexOf('assertImportEnabled()');
    assert.ok(at > 0, name);
    assert.doesNotMatch(body.slice(at), /\bcheck\(/, `${name}: audit-argument-checks counts only checks before the first await`);
  }
  const ics = read('server/methods/icsImport.js');
  assert.match(blockAt(ics, ics.indexOf(')', ics.indexOf('  async importIcsToBoard('))), /assertImportEnabled\(\)/);
  assert.match(ics, /res\.end\(JSON\.stringify\(\{ error: 'import-disabled' \}\)\);/);
  const scrum = read('server/scrum.js');
  assert.match(blockAt(scrum, scrum.indexOf(')', scrum.indexOf("  async 'scrum.importIntoBoard'("))), /assertImportEnabled\(\)/);
});

console.log(`\nimportDisabledEverywhere: ${passed} passed`);
