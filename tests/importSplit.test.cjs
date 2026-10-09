'use strict';

// "One board per project" (models/lib/importSplit.js): a document of the
// generalized importer split into one board per swimlane, as a Trello .zip of
// many boards imports many boards. Run: node tests/importSplit.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { splitBySwimlane, MAX_SPLIT_BOARDS } = await import('../models/lib/importSplit.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  const parsed = () => ({
    board: { name: 'Workspace' },
    columns: [{ title: 'To Do' }, { title: 'Done' }],
    swimlanes: [{ name: 'Web' }, { name: 'App' }],
    label_colors: { urgent: 'red' },
    tasks: [
      { title: 'Plan', ref: '1', column_name: 'To Do', swimlane_name: 'Web' },
      { title: 'Build', ref: '2', column_name: 'Done', swimlane_name: 'Web', parent_ref: '1' },
      { title: 'Ship', ref: '3', column_name: 'To Do', swimlane_name: 'App', parent_ref: '1',
        dependencies: [{ ref: '2', type: 'is-blocked-by' }, { ref: '4', type: 'related' }] },
      { title: 'Test', ref: '4', column_name: 'Done', swimlane_name: 'App' },
    ],
    warnings: ['a source warning'],
    unsupported: [{ path: '/x', reason: 'a source loss' }],
  });

  test('each swimlane becomes a board named after it, with the lists and board data', () => {
    const parts = splitBySwimlane(parsed());
    assert.deepEqual(parts.map(p => p.board.name), ['Web', 'App']);
    for (const part of parts) {
      assert.deepEqual(part.swimlanes, [{ name: 'Default' }]);
      assert.deepEqual(part.columns, parsed().columns, 'a project keeps its tool\'s workflow');
      assert.deepEqual(part.label_colors, { urgent: 'red' });
      assert.ok(part.tasks.every(task => task.swimlane_name === 'Default'));
    }
    assert.deepEqual(parts[0].tasks.map(t => t.title), ['Plan', 'Build']);
    assert.equal(parts[0].tasks[1].parent_ref, '1', 'a parent on the same board is kept');
  });

  test('links to a card on another board are reported, not kept; the source report is told once', () => {
    const [web, app] = splitBySwimlane(parsed());
    const ship = app.tasks.find(t => t.title === 'Ship');
    assert.equal(ship.parent_ref, undefined);
    assert.deepEqual(ship.dependencies, [{ ref: '4', type: 'related' }]);
    const reasons = app.unsupported.map(u => `${u.path} ${u.reason}`);
    assert.ok(reasons.includes('/App/3 its parent card "1" went to the board "Web"'));
    assert.ok(reasons.includes('/App/3 its dependency on "2" went to the board "Web"'));
    assert.deepEqual(web.unsupported, [{ path: '/x', reason: 'a source loss' }]);
    assert.deepEqual(web.warnings, ['a source warning']);
    assert.ok(!app.unsupported.some(u => u.reason === 'a source loss'));
    assert.deepEqual(app.warnings, []);
  });

  test('swimlane_columns gives each board its own lists', () => {
    const doc = { ...parsed(), swimlane_columns: { Web: ['To Do'], App: ['Done', 'Later'] } };
    const [web, app] = splitBySwimlane(doc);
    assert.deepEqual(web.columns, [{ title: 'To Do' }]);
    assert.deepEqual(app.columns, [{ title: 'Done' }, { title: 'Later' }]);
    assert.equal(web.swimlane_columns, undefined);
  });

  test('negative: one swimlane is one board, the Default lane keeps the board name, and too many are refused', () => {
    const one = { ...parsed(), tasks: parsed().tasks.map(t => ({ ...t, swimlane_name: 'Web' })) };
    assert.deepEqual(splitBySwimlane(one), [one], 'nothing to split is returned unchanged');
    const withDefault = parsed();
    withDefault.tasks[0].swimlane_name = undefined;
    assert.deepEqual(splitBySwimlane(withDefault).map(p => p.board.name), ['Workspace', 'Web', 'App']);
    const many = { board: { name: 'x' }, columns: [], tasks: Array.from({ length: MAX_SPLIT_BOARDS + 1 }, (_, i) => ({ title: `t${i}`, swimlane_name: `l${i}` })) };
    assert.throws(() => splitBySwimlane(many), /at most 200 boards/);
    assert.deepEqual(splitBySwimlane({ board: {}, tasks: [] }).length, 1);
  });

  test('the import method splits only the generalized importer, as tracked runs, and the REST route passes it', () => {
    const imp = read('models/import.js');
    assert.match(imp, /if \(Meteor\.isServer && data\.splitBy === 'swimlane' && creator instanceof KanboardCreator\) \{/);
    assert.match(imp, /for \(const part of parts\) \{\s*const partCreator = new KanboardCreator\(data, importSource\);\s*const tracked = require\('\/server\/importRuns'\)\.trackImport\(/);
    assert.match(read('server/models/boards.js'), /if \(body\.splitBy === 'swimlane'\) additionalData\.splitBy = 'swimlane';/);
    const page = read('client/components/import/import.js');
    assert.match(page, /\.\.\.\(splitByProject\(this\.importSource\) \? \{ splitBy: 'swimlane' \} : \{\}\)/);
    assert.match(read('client/components/import/import.jade'), /if isGeneralizedImport[\s\S]*?js-import-split-toggle/);
    assert.match(read('api.py'), /body\['splitBy'\] = 'swimlane'/);
  });

  console.log(`\nimportSplit: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
