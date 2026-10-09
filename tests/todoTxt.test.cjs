'use strict';

// todo.txt import/export (models/lib/todoTxtFormat.js), following
// https://github.com/todotxt/todo.txt. Run: node tests/todoTxt.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { parseTodoTxt, formatTodoTxt, MAX_TODO_TXT_LINES } = await import('../models/lib/todoTxtFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('the todo.txt spec examples map to cards', () => {
    const { tasks, columns, unsupported } = parseTodoTxt([
      '(A) Thank Mom for the meatballs @phone',
      '(B) Schedule Goodwill pickup +GarageSale @phone',
      'Post signs around the neighborhood +GarageSale',
      '@GroceryStore Eskimo pies',
      'x 2011-03-03 2011-03-01 Review Tim\'s pull request +TodoTxtTouch @github',
      '',
      '2011-03-02 Document +TodoTxt task format due:2011-03-10 t:2011-03-05',
    ].join('\n'));
    assert.equal(tasks.length, 6, 'the blank line is not a task');
    assert.deepEqual(tasks[0], { title: 'Thank Mom for the meatballs', description: '', column_name: 'To Do',
      swimlane_name: 'Default', tags: ['priority:A', '@phone'] });
    assert.deepEqual(tasks[1].tags, ['priority:B', 'GarageSale', '@phone']);
    assert.equal(tasks[3].title, 'Eskimo pies');
    assert.deepEqual([tasks[4].column_name, tasks[4].date_end, tasks[4].date_creation, tasks[4].title],
      ['Done', '2011-03-03', '2011-03-01', 'Review Tim\'s pull request']);
    assert.deepEqual([tasks[5].date_creation, tasks[5].date_due, tasks[5].date_started], ['2011-03-02', '2011-03-10', '2011-03-05']);
    assert.deepEqual(columns.map(c => c.title), ['To Do', 'Done']);
    assert.deepEqual(unsupported, []);
  });

  test('a board exports to todo.txt and imports back with lists, dates, labels and priority', () => {
    const collected = { board: { title: 'Plant' }, lists: [{ title: 'Doing' }, { title: 'Done' }],
      items: [
        { title: 'Order valves', listTitle: 'Doing', labels: ['priority:A', 'plant', '@shop floor', 'high risk'],
          dueAt: '2026-10-10T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
        { title: 'Replace   pump', listTitle: 'Done', labels: ['priority:B'], createdAt: '2026-09-02T00:00:00.000Z',
          endAt: '2026-10-09T12:00:00.000Z' },
      ] };
    const text = formatters.todotxt(collected);
    assert.equal(formatters.todotxt, formatTodoTxt);
    assert.equal(text, '(A) 2026-09-01 Order valves +plant @shop_floor +high_risk due:2026-10-10 t:2026-10-01 list:Doing\n'
      + 'x 2026-10-09 2026-09-02 Replace pump pri:B list:Done\n');
    const [a, b] = EXTERNAL_PARSERS.todotxt(text).tasks;
    assert.deepEqual([a.title, a.column_name, a.tags, a.date_due, a.date_started, a.date_creation],
      ['Order valves', 'Doing', ['priority:A', 'plant', '@shop floor', 'high risk'], '2026-10-10', '2026-10-01', '2026-09-01']);
    assert.deepEqual([b.title, b.column_name, b.tags, b.date_end, b.date_creation],
      ['Replace pump', 'Done', ['priority:B'], '2026-10-09', '2026-09-02']);
    const card = planImportedTask(b).card;
    assert.equal(card.endAt.toISOString(), '2026-10-09T00:00:00.000Z');
    assert.equal(card.createdAt.toISOString(), '2026-09-02T00:00:00.000Z');
  });

  test('unknown key:value pairs stay in the title; bad dates are reported, not guessed (negative)', () => {
    const { tasks, unsupported } = parseTodoTxt('Call about https://example.org/x id:42 due:tomorrow');
    assert.equal(tasks[0].title, 'Call about https://example.org/x id:42');
    assert.equal(tasks[0].date_due, undefined);
    assert.deepEqual(unsupported, [{ path: '/0/due', reason: 'due: is not a YYYY-MM-DD date' }]);
    assert.equal(parseTodoTxt('x').tasks[0].title, 'Imported task');
    assert.equal(parseTodoTxt('(a) lowercase is not a priority').tasks[0].title, '(a) lowercase is not a priority');
    assert.equal(parseTodoTxt('2026-13-45x not a date').tasks[0].date_creation, undefined);
    assert.throws(() => parseTodoTxt('a\n'.repeat(MAX_TODO_TXT_LINES + 1)), /more than/);
  });

  test('a completion date is written only together with a creation date, as the format requires', () => {
    assert.equal(formatTodoTxt({ items: [{ title: 'Done', listTitle: 'Done', labels: [], endAt: '2026-10-09' }] }),
      'x Done list:Done\n');
    assert.equal(formatTodoTxt({ items: [] }), '');
  });

  test('it is wired into import, export, the shape check and both menus', () => {
    validateImportSourceShape('todotxt', 'x done');
    assert.throws(() => validateImportSourceShape('todotxt', '  \n '), /Invalid todotxt/);
    assert.throws(() => validateImportSourceShape('todotxt', { tasks: [] }), /Invalid todotxt/);
    assert.match(read('models/import.js'), /case 'todotxt':[\s\S]*?check\(board, String\);[\s\S]*?EXTERNAL_PARSERS\.todotxt\(importedBoard\)/);
    assert.match(read('server/lib/renderExternalExport.js'), /todotxt: 'text\/plain'/);
    assert.match(read('models/lib/importSources.js'), /\{ key: 'todotxt', name: 'todo\.txt'[,}]/); // the one list of sources
    assert.match(read('client/components/boards/exportScope.js'), /key: 'todotxt'[^}]*path: 'export\/todotxt', ext: 'txt'/);
    assert.ok(JSON.parse(read('imports/i18n/data/en.i18n.json'))['import-board-instruction-todotxt']);
  });

  console.log(`\ntodoTxt: ${passed} tests passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
