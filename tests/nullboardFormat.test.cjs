'use strict';

// Nullboard .nbx import/export (models/lib/nullboardFormat.js). The shapes
// are Nullboard's own: function Board/List/Note, exportBoard() and
// checkImport() in apankrat/nullboard's nullboard.html.
// Run: node tests/nullboardFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// Nullboard's checkImport(), as it is in nullboard.html: what an export from
// WeKan has to pass before Nullboard imports it.
function nullboardCheckImport(foo) {
  const props = ['format', 'id', 'revision', 'title', 'lists'];
  for (let i = 0; i < props.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(foo, props[i])) return 'Required board properties are missing.';
  }
  if (!foo.id || !foo.revision || !Array.isArray(foo.lists)) return 'Required board properties are empty.';
  // eslint-disable-next-line eqeqeq
  if (foo.format != 20190412) return `Unsupported blob format "${foo.format}", expecting "20190412".`;
  return null;
}

// A board as "Export this board..." writes it, shaped like Nullboard's
// built-in welcome board: raw heading notes, multi-line notes, a collapsed one.
const SAMPLE = JSON.stringify({
  format: 20190412, id: 1791100000000, revision: 3, title: 'Website', lists: [
    { title: 'To do', notes: [
      { text: 'Backend', raw: true, min: false },
      { text: 'Login button misaligned\nOverlaps footer on mobile\n\nSee the screenshot', raw: false, min: false },
    ] },
    { title: 'Done', notes: [{ text: 'Responsive footer', raw: false, min: true }] },
  ],
});

async function main() {
  const { parseNullboard, formatNullboard, splitNoteText, NULLBOARD_FORMAT } =
    await import('../models/lib/nullboardFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a Nullboard board maps to lists, cards, descriptions and the raw label', () => {
    const board = parseNullboard(SAMPLE);
    assert.equal(board.board.name, 'Website');
    assert.deepEqual(board.columns.map(c => c.title), ['To do', 'Done']);
    assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
    assert.equal(board.tasks.length, 3);
    const [heading, bug, footer] = board.tasks;
    assert.equal(heading.title, 'Backend');
    assert.deepEqual(heading.tags, ['raw'], 'a raw note keeps its look as the raw label');
    assert.equal(bug.title, 'Login button misaligned');
    assert.equal(bug.description, 'Overlaps footer on mobile\n\nSee the screenshot');
    assert.deepEqual(bug.tags, []);
    assert.equal(bug.column_name, 'To do');
    assert.equal(footer.column_name, 'Done');
    assert.equal(planImportedTask(bug).card.description, 'Overlaps footer on mobile\n\nSee the screenshot');
    assert.deepEqual(board.unsupported.map(u => u.path), ['/lists/notes/min'], 'the collapsed note is reported once');
    assert.match(board.unsupported[0].reason, /1 collapsed Nullboard note/);
  });

  test('a note: the first non-blank line is the title, the rest the description', () => {
    assert.deepEqual(splitNoteText('\n  Title  \nline 2\r\nline 3\n\n'), { title: 'Title', description: 'line 2\nline 3' });
    assert.deepEqual(splitNoteText('Only'), { title: 'Only', description: '' });
    assert.deepEqual(splitNoteText(' \n '), { title: '', description: '' });
  });

  test('"Export all boards": an array imports its first board and reports the rest', () => {
    const second = { format: 20190412, id: 2, revision: 1, title: 'Home', lists: [] };
    const board = parseNullboard(JSON.stringify([JSON.parse(SAMPLE), second]));
    assert.equal(board.board.name, 'Website');
    assert.match(board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n'), /^\/1 Nullboard board "Home" is not imported/m);
  });

  test('negative: Nullboard\'s own import checks refuse the file, never guess', () => {
    const base = JSON.parse(SAMPLE);
    assert.throws(() => parseNullboard('{not json'), /Nullboard file is not valid JSON/);
    assert.throws(() => parseNullboard(JSON.stringify({ ...base, format: 20180101 })), /unsupported blob format "20180101", expecting "20190412"/);
    const { revision, ...noRevision } = base;
    assert.equal(revision, 3);
    assert.throws(() => parseNullboard(JSON.stringify(noRevision)), /required board properties are missing \(revision\)/);
    assert.throws(() => parseNullboard(JSON.stringify({ ...base, id: 0 })), /required board properties are empty/);
    assert.throws(() => parseNullboard(JSON.stringify({ ...base, lists: {} })), /required board properties are empty/);
    assert.throws(() => parseNullboard('[]'), /holds no board/);
    assert.throws(() => parseNullboard('"text"'), /a board must be a JSON object/);
    assert.throws(() => parseNullboard(JSON.stringify([base, { ...base, format: 1 }])), /board 2: unsupported blob format/,
      'every board of an array is checked, as Nullboard checks them');
    assert.throws(() => validateImportSourceShape('nullboard', '  '), /Invalid nullboard/);
  });

  test('negative: odd notes and lists are reported, not invented', () => {
    const board = parseNullboard(JSON.stringify({ format: '20190412', id: 1, revision: 1, title: '', lists: [
      { title: 'A', notes: [{ text: '' }, { raw: true }, { text: 'Kept' }] },
      { title: 'A', notes: 'nope' },
      { title: '', notes: [] },
    ] }));
    assert.equal(board.board.name, 'Imported Nullboard');
    assert.deepEqual(board.columns.map(c => c.title), ['A', 'A (2)', 'Untitled list']);
    assert.deepEqual(board.tasks.map(t => t.title), ['Kept']);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/lists\/0\/notes\/0 an empty Nullboard note/);
    assert.match(reasons, /\/lists\/0\/notes\/1 a Nullboard note without text/);
    assert.match(reasons, /\/lists\/1\/title a second Nullboard list "A" is imported as "A \(2\)"/);
    assert.match(reasons, /\/lists\/1\/notes Nullboard list notes are not an array/);
  });

  test('export is accepted by Nullboard\'s checkImport and imports back', () => {
    const text = formatters.nullboard({
      board: { title: 'Launch', createdAt: new Date('2026-10-01T10:00:00.000Z') },
      lists: [{ _id: 'l1', title: 'To do' }, { _id: 'l2', title: 'To do' }, { _id: 'l3', title: 'Empty' }],
      items: [
        { listId: 'l1', listTitle: 'To do', title: 'Order valves', description: 'Two "big" ones\nDN50', labels: ['Purchasing'],
          dueAt: '2026-10-20T08:30:00.000Z',
          checklists: [{ title: 'Steps', items: [{ title: 'Quote', done: true }, { title: 'Pay', done: false }] }] },
        { listId: 'l1', listTitle: 'To do', title: 'Hardware', labels: ['raw'] },
        { listId: 'l2', listTitle: 'To do', title: 'Line\nbreak in title' },
        { listId: 'gone', listTitle: 'Elsewhere', title: 'Orphan' },
      ],
    });
    const blob = JSON.parse(text);
    assert.equal(nullboardCheckImport(blob), null);
    assert.equal(blob.format, NULLBOARD_FORMAT);
    assert.equal(blob.id, Date.parse('2026-10-01T10:00:00.000Z'), 'the id is the board\'s creation time in ms');
    assert.equal(blob.revision, 1);
    assert.deepEqual(blob.lists.map(l => l.title), ['To do', 'To do', 'Empty', 'Elsewhere']);
    assert.deepEqual(blob.lists[0].notes[0], { text: 'Order valves\nTwo "big" ones\nDN50\n\nSteps\n[x] Quote\n[ ] Pay', raw: false, min: false });
    assert.deepEqual(blob.lists[0].notes[1], { text: 'Hardware', raw: true, min: false });
    assert.equal(blob.lists[1].notes[0].text, 'Line break in title', 'a title stays one line');
    assert.ok(!text.includes('Purchasing') && !text.includes('2026-10-20'), 'labels and dates have no place in a note');
    const back = parseNullboard(text);
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'To do (2)', 'Empty', 'Elsewhere']);
    assert.equal(back.tasks[0].title, 'Order valves');
    assert.equal(back.tasks[0].description, 'Two "big" ones\nDN50\n\nSteps\n[x] Quote\n[ ] Pay');
    assert.deepEqual(back.tasks[1].tags, ['raw']);
    assert.equal(back.tasks[3].column_name, 'Elsewhere');
    // An export without a creation date still gets an id Nullboard accepts.
    assert.equal(nullboardCheckImport(JSON.parse(formatNullboard({ board: {}, items: [] }))), null);
  });

  test('the format is wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.nullboard, parseNullboard);
    assert.equal(formatters.nullboard, formatNullboard);
    assert.match(read('models/import.js'), /case 'nullboard':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.nullboard\(importedBoard\);/);
    assert.match(read('models/import.js'), /new KanboardCreator\(data, 'nullboard'\)/);
    assert.match(read('server/lib/renderExternalExport.js'), /nullboard: 'application\/json'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'nullboard', name: 'Nullboard'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'nullboard', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'nullboard'[^}]*path: 'export\/nullboard', ext: 'nbx'/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Nullboard/Nullboard.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Nullboard\/Nullboard\.md\)/);
  });

  console.log(`\nnullboardFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
