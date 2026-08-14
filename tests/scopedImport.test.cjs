'use strict';

// Where an imported thing lands, and what comes in with it.
// Run: node tests/scopedImport.test.cjs
//
// wekan/wekan#1173's other half: a swimlane's menu imports a swimlane BELOW that
// swimlane, a list's menu imports a list after it, a card's menu imports a card
// below it - into the board that is already open. The placement is arithmetic,
// so it is tested as arithmetic; the rest is read from the source, like the
// other export/import suites.
//
// The RTL rule is worth stating because it looks like a missing branch: a list
// imported from a list's menu goes to the RIGHT in English and to the LEFT in
// Arabic, and that is ONE rule, not two. The page carries `dir`
// (client/components/main/layouts.jade), so the board's row of lists mirrors
// itself - "after in sort order" is already "the other side". A separate RTL
// branch here would mirror it twice and put the list back where it started.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const { sortsAfter, gapIsExhausted } = require('../models/lib/insertPosition.js');
const importer = read('models/server/scopedImporter.js');
const importModel = read('models/import.js');
const scopeJs = read('client/components/boards/exportScope.js');
const scopeJade = read('client/components/boards/exportScope.jade');
const position = read('models/lib/insertPosition.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('scopedImport:');

// ── where it lands ──────────────────────────────────────────────────────────

test('one item lands between its target and the next', () => {
  assert.deepStrictEqual(sortsAfter([0, 1, 2], 1, 1), [1.5]);
  assert.deepStrictEqual(sortsAfter([0, 10], 0, 1), [5]);
});

test('several land spread through the gap, not on top of each other', () => {
  const sorts = sortsAfter([0, 1], 0, 3);
  assert.deepStrictEqual(sorts, [0.25, 0.5, 0.75]);
  assert.ok(!gapIsExhausted([0, ...sorts, 1]), 'and they are all distinct');
});

test('after the last one, it just counts on', () => {
  // No gap to divide: 2, 3, 4 rather than an ever-finer fraction.
  assert.deepStrictEqual(sortsAfter([0, 1], 1, 3), [2, 3, 4]);
});

test('no target means the top, and an empty board means zero', () => {
  assert.deepStrictEqual(sortsAfter([5, 6], undefined, 2), [3, 4]);
  assert.deepStrictEqual(sortsAfter([], undefined, 2), [0, 1]);
});

test('junk in does not put a card at NaN (negative)', () => {
  // A hand-edited document, a missing sort, a string where a number was: the
  // sorts of the siblings are filtered, and a bad count imports nothing rather
  // than looping.
  assert.deepStrictEqual(sortsAfter([0, null, 'x', 2], 0, 1), [1]);
  assert.deepStrictEqual(sortsAfter([0, 1], 0, 0), []);
  assert.deepStrictEqual(sortsAfter([0, 1], 0, -3), []);
  for (const value of sortsAfter([0, 1], 0, 2)) {
    assert.ok(Number.isFinite(value), `${value} is a number`);
  }
});

test('the sort is a fraction because renumbering is what does not scale', () => {
  assert.ok(/renumbering/.test(position),
    'the reason is written where the arithmetic is');
  assert.ok(!/updateMany|renumber\(/.test(position),
    'and no sibling is rewritten to make room');
});

test('RTL is one rule, and the reason is written down (negative)', () => {
  assert.ok(/right-to-left/.test(position) && /mirrors itself/.test(position),
    'the page mirrors, so "after" is already the other side');
  assert.ok(!/isRtl|rtl \?/.test(position),
    'a direction branch here would mirror it twice');
});

// ── what comes in ───────────────────────────────────────────────────────────

test('the same selection decides what an import brings in', () => {
  assert.ok(/hasField\('comments'\)/.test(importer)
    && /hasField\('checklists'\)/.test(importer)
    && /hasField\('custom-fields'\)/.test(importer),
    'the importer gates the same sections the exporters gate');
  assert.ok(/selectedFields\(\)/.test(scopeJs),
    'and the popup sends the same list it sends to an export');
  assert.ok(/WHAT TO BRING IN/.test(importer), 'which is what it means here');
});

test('an import creates, and never edits what is already there', () => {
  assert.ok(/never an edit of what is already there/.test(importer),
    'importing twice gives two copies, not a half-updated board');
  assert.ok(/_cardIdMap|_listIdMap|_swimlaneIdMap/.test(importer),
    'old ids are mapped to new ones, so nothing is inserted under a foreign id');
});

test('a comment comes back under the importing user, not a stranger', () => {
  assert.ok(/The importing user, not the original author/.test(importer),
    'the original author may not exist on this server');
});

test('a custom field is matched by NAME, not by id', () => {
  // A custom field belongs to a board, so an id from another board matches
  // nothing - matching by name is what makes a cross-board import work at all.
  assert.ok(/Matching by name rather than by id/.test(importer), 'says so');
  assert.ok(/byName\.get\(String\(field\.name/.test(importer), 'and does so');
});

// ── who may do it ───────────────────────────────────────────────────────────

test('importing is a WRITE, and is checked as one', () => {
  assert.ok(/isBoardMember\(\)/.test(importModel),
    'export asks "may you see it"; import asks "may you change it"');
  assert.ok(/assertImportEnabled/.test(importModel),
    'and the Admin Panel master switch still applies');
  assert.ok(/wekan-board-1\.0\.0/.test(importModel),
    'a file that is not a WeKan export is refused by format');
  assert.ok(/import-timeout/.test(importModel),
    'and a hung import ends, like the board import');
});

test('the popup offers import only to somebody who may write', () => {
  assert.ok(/function canImportIntoBoard\(\)/.test(scopeJs) && /isReadOnly/.test(scopeJs),
    'a read-only member sees the exports and not the import');
  assert.ok(/if canImport/.test(scopeJade), 'and the template asks');
  // The MENU rows ask the same question, from the same function registered as a
  // global helper - four copies of four permission checks is how one menu ends
  // up offering a row that then refuses to do anything.
  assert.ok(/Template\.registerHelper\('canImportIntoBoard', canImportIntoBoard\)/.test(scopeJs),
    'and the menus ask it too, from one place');
  for (const menu of ['client/components/lists/listHeader.jade',
    'client/components/swimlanes/swimlaneHeader.jade',
    'client/components/cards/cardDetails.jade',
    'client/components/sidebar/sidebar.jade']) {
    assert.ok(/if canImportIntoBoard/.test(read(menu)), `${menu} gates its Import row`);
  }
});

test('every menu offers Export and Import, named for what they do', () => {
  // A menu already says what it is about, so "Export list" inside the list menu
  // said "list" twice; the rows are "Export" and "Import".
  const menus = [
    ['client/components/lists/listHeader.jade', 'js-export-list', 'js-import-list'],
    ['client/components/swimlanes/swimlaneHeader.jade', 'js-export-swimlane', 'js-import-swimlane'],
    ['client/components/cards/cardDetails.jade', 'js-export-card', 'js-import-card'],
    ['client/components/sidebar/sidebar.jade', 'js-export-board', 'js-import-into-board'],
  ];
  for (const [file, exportClass, importClass] of menus) {
    const jade = read(file);
    for (const [cls, label] of [[exportClass, "{{_ 'export'}}"], [importClass, "{{_ 'import'}}"]]) {
      const at = jade.indexOf(cls);
      assert.ok(at !== -1, `${file} has ${cls}`);
      assert.ok(jade.slice(at, at + 200).includes(label),
        `${cls} is labelled ${label}, not with the noun its menu already carries`);
    }
  }

  // Each row opens the shared body - the import ones in its import MODE, which
  // is the only difference between the two popups.
  const opens = [
    ['client/components/lists/listHeader.js', "'click .js-import-list': Popup.open('importList')"],
    ['client/components/swimlanes/swimlaneHeader.js', "'click .js-import-swimlane': Popup.open('importSwimlane')"],
    ['client/components/cards/cardDetails.js', "'click .js-import-card': Popup.open('importCard')"],
    ['client/components/sidebar/sidebar.js', "'click .js-import-into-board': Popup.open('importBoardInto')"],
  ];
  for (const [file, open] of opens) {
    assert.ok(read(file).includes(open), `${file}: ${open}`);
  }
  for (const popup of ['importSwimlanePopup', 'importListPopup', 'importCardPopup']) {
    assert.ok(new RegExp(`template\\(name="${popup}"\\)[\\s\\S]{0,200}mode="import"`).test(scopeJade),
      `${popup} is the shared body in import mode`);
  }
  assert.ok(/template\(name="importBoardIntoPopup"\)[\s\S]{0,400}mode="import"/
    .test(read('client/components/sidebar/sidebar.jade')), 'and so is the board one');

  // Every one of them has a title, or a pop-over opens with no header and no X.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['importSwimlanePopup-title', 'importListPopup-title',
    'importCardPopup-title', 'importBoardIntoPopup-title']) {
    assert.ok(en[key], `${key} is translated`);
  }
});

test('the files come back too, from a .json and from a .zip', () => {
  // The round trip was half a round trip: the cards came back and their
  // attachments did not.
  assert.ok(/_importAttachments\(\)/.test(importer), 'the importer writes attachments');
  assert.ok(/Buffer\.from\(attachment\.file, 'base64'\)/.test(importer),
    'from the base64 a .json carries');
  assert.ok(/attachments\/<attachmentId>-<name>/.test(scopeJs)
    || /attachment\.file = await archived\.async\('base64'\)/.test(scopeJs),
    'and from the files a .zip carries, put back on the same field');
  assert.ok(/one import path rather than one per container/.test(scopeJs)
    || /one import path/.test(scopeJs),
    'so the server sees one shape either way');
});

test('an attachment lands where its card landed, not where it came from', () => {
  assert.ok(/_cardListId\[cardId\]/.test(importer) && /_cardSwimlaneId\[cardId\]/.test(importer),
    'the meta points at the list and swimlane the card is in now');
  assert.ok(/boardId: this\._target\.boardId/.test(importer),
    'and at the board it was imported into');
});

test('one unreadable attachment does not lose the rest (negative)', () => {
  assert.ok(/One unreadable attachment is not a reason to lose the rest/.test(importer),
    'the loop says so');
  assert.ok(/catch \(error\) \{[\s\S]{0,200}console\.warn/.test(importer),
    'and carries on after warning');
  assert.ok(/if \(!buffer \|\| !buffer\.length\) continue;/.test(importer),
    'an empty file is skipped rather than written as a zero-byte attachment');
});

test('a downloaded attachment is still validated at every hop (negative)', () => {
  // FollowBleed: a validated public URL can 302 to an internal address.
  assert.ok(/fetchImportedAttachment/.test(importer), 'the pinning downloader is used');
  assert.ok(/downloaded\.blocked/.test(importer), 'and a blocked download is skipped');
});

test('a .zip is UPLOADED, not unpacked in the browser', () => {
  // Unpacking here and sending base64 over DDP is what made a large archive
  // expensive: 2 GB of attachments became 2.7 GB in one message.
  assert.ok(/uploadZipImport\(file, target\)/.test(scopeJs), 'the archive goes as a file');
  assert.ok(/fetch\(`\/api\/import\/zip\?/.test(scopeJs), 'to the streaming route');
  assert.ok(/body: file/.test(scopeJs), 'as the body, so the browser holds no copy');
  assert.ok(/return JSON\.parse\(await file\.text\(\)\)/.test(scopeJs),
    'while a .json still travels as a document');
});

test('the upload route never holds the archive in memory', () => {
  const route = read('models/importZip.js');
  assert.ok(/req\.pipe\(out\)/.test(route), 'the body is streamed to a temp file');
  assert.ok(/unzipper\.Open\.file\(tempPath\)/.test(route),
    'and the archive is read through its central directory, entry by entry');
  assert.ok(/entry\.stream\(\)/.test(route), 'each attachment is opened as a stream');
  assert.ok(!/\.buffer\(\)[\s\S]{0,80}attachment/i.test(route),
    'attachments are never buffered whole - only the document is');
  assert.ok(/finally \{[\s\S]{0,120}unlink/.test(route), 'and the temp file always goes');
});

test('an oversized upload is refused as it arrives (negative)', () => {
  const route = read('models/importZip.js');
  assert.ok(/received > MAX_ZIP_BYTES/.test(route), 'the cap is checked per chunk');
  assert.ok(/WEKAN_IMPORT_ZIP_MAX_BYTES/.test(route), 'and is configurable');
  assert.ok(/import-zip-too-large/.test(route), 'with an answer that says which limit');
});

test('an entry name is data, never a path (negative)', () => {
  // ZipBleed: `attachments/../../etc/cron.d/x` must be an attachment with a
  // strange name, not a write outside the storage.
  const route = read('models/importZip.js');
  assert.ok(/ZipBleed/.test(route), 'the reason is written where the names are read');
  assert.ok(/base\.slice\(0, dash\)/.test(route),
    'only the id before the first dash is read from the entry name');
  const helper = read('models/lib/fileStoreStrategy.js');
  assert.ok(/sanitizeFilename\(fileName \|\| 'attachment'\)/.test(helper),
    'and the temp file is named by us, not by the archive');
});

test('an uploaded attachment lands in the Admin Panel default storage', () => {
  const helper = read('models/lib/fileStoreStrategy.js');
  assert.ok(/collection\.addFile\(/.test(helper),
    'addFile, not write - a path rather than a Buffer');
  assert.ok(/onAfterUpload/.test(read('models/server/scopedImporter.js')),
    'and the importer says why: addFile fires the hook that moves it there');
  const attachments = read('models/attachments.server.js');
  assert.ok(/getDefaultStorage\(\)/.test(attachments) && /moveToStorage/.test(attachments),
    'which is where the configured storage is applied');
});

console.log(`\nscopedImport: ${passed} tests passed`);
