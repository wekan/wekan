'use strict';

// Wrike workflows (models/lib/wrikeWorkflow.js): a board's lists and its
// move-and-complete rules as the JSON of Wrike's GET /workflows, that JSON read
// back as statuses and the rules that do what their status groups do, the
// Rules popup and server method that apply it, and the "Wrike workflow" board
// export. Run: node tests/wrikeWorkflow.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const wf = await import('../models/lib/wrikeWorkflow.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  const move = (listName, actionType) => ({ trigger: { activityType: 'moveCard', listName }, action: { actionType } });

  test('a board becomes one workflow named after it, a custom status per list in order', () => {
    const { workflow, statusOf } = wf.wrikeWorkflowFromBoard({
      boardTitle: 'Launch',
      lists: [{ title: 'Backlog', color: 'navy' }, { title: 'Doing', color: '#123456' }, { title: 'Done' }, { title: 'Doing' }],
      rules: [],
    });
    assert.equal(workflow.kind, 'workflows');
    assert.equal(workflow.data.length, 1);
    const [only] = workflow.data;
    assert.deepEqual({ name: only.name, standard: only.standard, hidden: only.hidden }, { name: 'Launch', standard: false, hidden: false });
    assert.deepEqual(only.customStatuses.map(s => [s.name, s.group, s.color]),
      [['Backlog', 'Active', 'DarkBlue'], ['Doing', 'Active', 'Blue'], ['Done', 'Completed', 'Green']],
      'a list title is one status; a hex color takes its group\'s color');
    for (const status of only.customStatuses) {
      assert.ok(wf.WRIKE_STATUS_COLORS.includes(status.color), status.color);
      assert.ok(wf.WRIKE_STATUS_GROUPS.includes(status.group), status.group);
      assert.deepEqual(Object.keys(status), ['name', 'standardName', 'color', 'standard', 'group', 'hidden'], 'the CustomStatus fields of Wrike\'s API');
    }
    assert.deepEqual(statusOf('Done'), { name: 'Done', group: 'Completed' });
    assert.deepEqual(statusOf('Gone'), { name: 'Backlog', group: 'Active' }, 'an unknown list is the first Active status');
  });

  test('a move rule decides the group, and the name refines it', () => {
    const lists = ['Review', 'Rejected', 'Parked', 'Reopened', 'Done'].map(title => ({ title }));
    const rules = [
      move('Review', 'markCardComplete'),
      move('Rejected', 'markCardComplete'),
      move('Parked', 'markCardIncomplete'),
      move('Done', 'markCardComplete'),
      move('Done', 'markCardIncomplete'), // the later rule runs last, and wins
      move('*', 'markCardComplete'), // any list: says nothing about one
      { trigger: { activityType: 'createCard', listName: 'Reopened' }, action: { actionType: 'markCardComplete' } },
    ];
    const { workflow } = wf.wrikeWorkflowFromBoard({ boardTitle: 'B', lists, rules });
    assert.deepEqual(workflow.data[0].customStatuses.map(s => [s.name, s.group]), [
      ['Review', 'Completed'], ['Rejected', 'Cancelled'], ['Parked', 'Deferred'], ['Reopened', 'Active'], ['Done', 'Active'],
    ]);
  });

  test('names alone: Wrike\'s groups and common English names', () => {
    for (const [name, group] of [['Active', 'Active'], ['completed', 'Completed'], ['Deferred', 'Deferred'], ['CANCELLED', 'Cancelled'],
      ['Closed', 'Completed'], ['Resolved', 'Completed'], ['On hold', 'Deferred'], ['Icebox', 'Deferred'], ["Won't do", 'Cancelled'],
      ['Canceled', 'Cancelled'], ['In progress', 'Active'], ['', 'Active'], ['Done soon', 'Active']]) {
      assert.equal(wf.wrikeGroupForName(name), group, name);
    }
  });

  test('Wrike needs an Active and a Completed status; long names are cut to 128 and kept apart', () => {
    const { workflow } = wf.wrikeWorkflowFromBoard({ boardTitle: '', lists: [{ title: 'Ideas' }], rules: [] });
    assert.deepEqual(workflow.data[0].customStatuses.map(s => [s.name, s.group]), [['Ideas', 'Active'], ['Completed', 'Completed']]);
    assert.equal(workflow.data[0].name, 'WeKan board');
    const allDone = wf.wrikeWorkflowFromBoard({ boardTitle: 'x', lists: [{ title: 'Done' }, { title: 'Active' }], rules: [move('Active', 'markCardComplete')] });
    assert.deepEqual(allDone.workflow.data[0].customStatuses.map(s => [s.name, s.group]),
      [['Active (2)', 'Active'], ['Done', 'Completed'], ['Active', 'Completed']], 'an added status never takes a list\'s name');
    const long = 'L'.repeat(130);
    const cut = wf.wrikeWorkflowFromBoard({ boardTitle: 'T'.repeat(200), lists: [{ title: `${long}a` }, { title: `${long}b` }], rules: [] });
    const names = cut.workflow.data[0].customStatuses.map(s => s.name);
    assert.equal(cut.workflow.data[0].name.length, 128);
    assert.ok(names.every(name => name.length <= 128));
    assert.equal(new Set(names).size, names.length);
    assert.equal(cut.statusOf(`${long}b`).name, names[1]);
  });

  test('GET /workflows JSON is read: a custom workflow before the standard one, hidden statuses reported', () => {
    const text = JSON.stringify({ kind: 'workflows', data: [
      { id: 'W1', name: 'Default Workflow', standard: true, hidden: false, customStatuses: [{ id: 'S1', name: 'Active', group: 'Active', color: 'Blue' }] },
      { id: 'W2', name: 'Old', standard: false, hidden: true, customStatuses: [{ name: 'Gone', group: 'Active' }] },
      { id: 'W3', name: 'Delivery', standard: false, hidden: false, customStatuses: [
        { id: 'S2', name: 'Queued', standardName: false, color: 'Turquoise', standard: false, group: 'Active', hidden: false },
        { id: 'S3', name: 'Shipped', color: 'Green', group: 'Completed' },
        { name: 'Retired', color: 'Gray', group: 'Active', hidden: true },
        { name: 'Shipped', color: 'Red', group: 'Cancelled' },
        { name: 'Paused', color: 'Plaid', group: 'Sleeping' },
        { name: '' },
      ] },
    ] });
    const read = wf.readWrikeWorkflow(text);
    assert.equal(read.name, 'Delivery');
    assert.deepEqual(read.statuses, [
      { name: 'Queued', group: 'Active', color: 'paleturquoise' },
      { name: 'Shipped', group: 'Completed', color: 'green' },
      { name: 'Paused', group: 'Deferred', color: '' },
    ]);
    const reasons = read.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/data\/0 the Wrike workflow "Default Workflow" is not read/);
    assert.match(reasons, /\/data\/1 the Wrike workflow "Old" is not read/);
    assert.match(reasons, /\/data\/2\/customStatuses\/2 the hidden Wrike status "Retired" is not read/);
    assert.match(reasons, /customStatuses\/3 a second Wrike status named "Shipped" is read once/);
    assert.match(reasons, /customStatuses\/4 Wrike status group "Sleeping" is not Active, Completed, Deferred or Cancelled; "Deferred" is used/);
    assert.match(reasons, /customStatuses\/5 a Wrike status without a name is not read/);
    // A bare workflow object, an array, and the standard workflow alone.
    assert.equal(wf.readWrikeWorkflow({ name: 'One', customStatuses: [{ name: 'A', group: 'Active' }] }).name, 'One');
    assert.equal(wf.readWrikeWorkflow([{ name: 'Std', standard: true, customStatuses: [{ name: 'A', group: 'Active' }] }]).name, 'Std');
  });

  test('negative: what is not a Wrike workflow is refused', () => {
    assert.throws(() => wf.readWrikeWorkflow('{ nope'), /not JSON/);
    assert.throws(() => wf.readWrikeWorkflow('{}'), /no workflow/);
    assert.throws(() => wf.readWrikeWorkflow({ kind: 'workflows', data: [] }), /no workflow/);
    assert.throws(() => wf.readWrikeWorkflow({ data: [{ name: 'x' }] }), /no workflow with customStatuses/);
    assert.throws(() => wf.readWrikeWorkflow({ name: 'Empty', customStatuses: [{ name: 'H', hidden: true }] }), /"Empty" has no status to read/);
  });

  test('each status gets the rule its group implies, and the board export reads those rules back', () => {
    const statuses = [{ name: 'Queued', group: 'Active' }, { name: 'Parked', group: 'Deferred' }, { name: 'Shipped', group: 'Completed' }, { name: 'Dropped', group: 'Cancelled' }];
    const rules = wf.wrikeWorkflowRules(statuses);
    assert.deepEqual(rules.map(rule => [rule.trigger.listName, rule.action.actionType]), [
      ['Queued', 'markCardIncomplete'], ['Parked', 'markCardIncomplete'], ['Shipped', 'markCardComplete'], ['Dropped', 'markCardComplete'],
    ]);
    for (const rule of rules) {
      // Every matching field is set, so the trigger matcher can find it (#6472).
      assert.deepEqual(rule.trigger, { activityType: 'moveCard', listName: rule.trigger.listName, oldListName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' });
    }
    // Round trip: statuses -> lists and rules -> the same statuses.
    const { workflow } = wf.wrikeWorkflowFromBoard({ boardTitle: 'Delivery', lists: statuses.map(s => ({ title: s.name })), rules });
    assert.deepEqual(workflow.data[0].customStatuses.map(s => [s.name, s.group]), statuses.map(s => [s.name, s.group]));
    assert.deepEqual(wf.readWrikeWorkflow(workflow).statuses.map(s => [s.name, s.group]), statuses.map(s => [s.name, s.group]));
    // Colors survive both ways for every Wrike color.
    for (const color of wf.WRIKE_STATUS_COLORS) assert.equal(wf.wrikeColorForList(wf.wekanColorForWrike(color), 'Active'), color);
  });

  test('the board export, the Excel export and the Rules popup use this module', () => {
    assert.equal(formatters.wrikeworkflow, wf.formatWrikeWorkflow);
    const built = formatters.wrikeworkflow({ board: { title: 'Launch' }, lists: [{ title: 'Doing' }], workflowRules: [move('Doing', 'markCardComplete')] });
    assert.deepEqual(built.data[0].customStatuses.map(s => [s.name, s.group]), [['Active', 'Active'], ['Doing', 'Completed']]);
    const exporters = read('models/lib/externalExporters.js');
    assert.match(exporters, /const WRIKE_FORMATS = new Set\(\['wrike', 'wrikeworkflow'\]\);/);
    assert.match(exporters, /\.\.\.\(workflowRules \? \{ workflowRules \} : \{\}\)/);
    assert.match(read('models/lib/wrikeFormat.js'), /import \{ wrikeGroupForName, wrikeWorkflowFromBoard \} from '\.\/wrikeWorkflow\.js';/);
    assert.match(read('client/components/boards/exportScope.js'), /key: 'wrikeworkflow'[^}]*path: 'export\/wrikeworkflow', ext: 'json'/);
    const popup = read('client/components/rules/rulesImportExport.js');
    assert.match(popup, /import \{ wrikeWorkflowFromBoard \} from '\/models\/lib\/wrikeWorkflow';/);
    assert.match(popup, /Meteor\.callAsync\('rules\.importWrikeWorkflow', targetBoardId\(tpl\)/);
    const jade = read('client/components/rules/rulesImportExport.jade');
    assert.match(jade, /js-rules-export-wrike/);
    assert.match(jade, /js-rules-import-wrike/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    for (const key of ['r-wrike-workflow', 'r-wrike-workflow-note', 'r-export-wrike-workflow', 'r-import-wrike-workflow']) assert.ok(en[key], key);
    for (const token of ['__name__', '__lists__', '__rules__', '__skipped__']) assert.ok(en['r-import-wrike-workflow-done'].includes(token), token);
  });

  test('the server method checks before it writes, and adds nothing twice', () => {
    const src = read('server/rulesButton.js');
    const body = src.slice(src.indexOf("async 'rules.importWrikeWorkflow'"), src.indexOf("async 'rules.updateRule'"));
    assert.ok(body.length > 100, 'rules.importWrikeWorkflow is defined');
    const firstWrite = Math.min(...['callAsync(', 'insertAsync(', 'updateAsync('].map(call => body.indexOf(call)).filter(at => at !== -1));
    for (const guard of ['check(boardId, String)', 'check(text, String)', 'if (!this.userId)', '1024 * 1024', 'board.hasAdmin(this.userId)']) {
      const at = body.indexOf(guard);
      assert.ok(at !== -1 && at < firstWrite, `${guard} comes before the first write`);
    }
    assert.match(body, /if \(listIdByTitle\.has\(status\.name\)\) \{ previousId = listIdByTitle\.get\(status\.name\); continue; \}/, 'an existing list is reused');
    assert.match(body, /if \(governed\.has\(rule\.trigger\.listName\)\) continue;/, 'a list with a complete rule keeps it');
    assert.match(body, /Meteor\.callAsync\('createListAfter', \{ title: status\.name, boardId, afterListId: previousId, type: 'list' \}\)/);
    assert.match(body, /throw new Meteor\.Error\('invalid-import-format', error\.message\)/);
  });

  test('negative: no exporter writes the old WeKan list column, and no rule is sent to Wrike', () => {
    const roots = ['models', 'server', 'client'];
    const offenders = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
        const rel = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(rel);
        else if (/\.js$/.test(entry.name) && /WRIKE_LIST_COLUMN|'WeKan list'/.test(read(rel))) offenders.push(rel);
      }
    };
    roots.forEach(walk);
    assert.deepEqual(offenders, []);
    // The workflow JSON carries statuses only: Wrike's API has no rule fields.
    const { workflow } = wf.wrikeWorkflowFromBoard({ boardTitle: 'B', lists: [{ title: 'A' }], rules: [move('A', 'markCardComplete')] });
    assert.deepEqual(Object.keys(workflow), ['kind', 'data']);
    assert.deepEqual(Object.keys(workflow.data[0]), ['name', 'standard', 'hidden', 'customStatuses']);
  });

  console.log(`\nwrikeWorkflow: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
