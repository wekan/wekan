'use strict';

// Pivotal Tracker stories CSV import/export (models/lib/pivotalCsvFormat.js).
// The samples follow the header Tracker's exports write (2017+ with Priority,
// Blocker, Pull Request and Git Branch; before about 2018 without them) and
// the value formats of Tracker's CSV help page.
// Run: node tests/pivotalCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { normalizeScrumTransfer } = require('../models/lib/scrumTransfer');

// A 2023 export: two Owned By, a Blocker pair, two Comments, two Task pairs,
// Pull Request and Git Branch, as the busiest story needs them.
const MODERN = [
  'Id,Title,Labels,Iteration,Iteration Start,Iteration End,Type,Estimate,Priority,Current State,Created at,Accepted at,Deadline,Requested By,Description,URL,Owned By,Owned By,Blocker,Blocker Status,Comment,Comment,Task,Task Status,Task,Task Status,Pull Request,Git Branch',
  '186456829,Reset Password,"customer, auth",4,"Nov 6, 2023","Nov 12, 2023",feature,2,p3 - Low,delivered,"Nov 11, 2023",,,Tony Xiang,Allow users to reset password,https://www.pivotaltracker.com/story/show/186456829,xkniu07,Tony Xiang,blocked by #186456826,blocked,"Looks good (Tony Xiang - Nov 11, 2023)","Ship it (with tests) (xkniu07 - Nov 12, 2023)",Create function,completed,Create webpages,not completed,https://github.com/o/r/pull/7,reset-password',
  '186456826,Login page,,4,"Nov 6, 2023","Nov 12, 2023",bug,-1,p0 - Critical,accepted,"Nov 1, 2023","Nov 9, 2023",,Tony Xiang,,https://www.pivotaltracker.com/story/show/186456826,Tony Xiang,,,,,,,,,,,',
  '186456900,Release 1.0,,,,,release,,none,unstarted,"Nov 2, 2023",,"Dec 1, 2023",Tony Xiang,"=SUM(A1)",https://www.pivotaltracker.com/story/show/186456900,,,,,,,,,,,,',
  '186456901,Icebox idea,,,,,chore,,,unscheduled,"Nov 3, 2023",,,Tony Xiang,"Line one\nline two, with ""quotes""",https://www.pivotaltracker.com/story/show/186456901,,,"waiting on design",resolved,,,,,,,,',
].join('\n');

// Before about 2018 there is no Priority column and nothing after Task Status.
const OLD = [
  'Id,Title,Labels,Iteration,Iteration Start,Iteration End,Type,Estimate,Current State,Created at,Accepted at,Deadline,Requested By,Description,URL,Owned By,Comment,Task,Task Status',
  '83126104,Set up CI,devops,1,"Nov 17, 2014","Nov 23, 2014",chore,,accepted,"Nov 17, 2014","Nov 22, 2014",,Ana Lee,,https://www.pivotaltracker.com/story/show/83126104,Ana Lee,"Done on Travis (Ana Lee - Nov 22, 2014)",Write config,completed',
  '83126105,Seat map,,2,"Nov 24, 2014","Nov 30, 2014",feature,3,started,"Nov 18, 2014",,,Ana Lee,,https://www.pivotaltracker.com/story/show/83126105,Bo Chen,,,',
].join('\r\n');

async function main() {
  const { parsePivotalCsv, formatPivotalCsv, pivotalDate, pivotalComment, PIVOTAL_IMPORT_COLUMNS } =
    await import('../models/lib/pivotalCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  const { pivotalScrumPlanning, STORY_POINTS_FIELD } = require('../models/lib/externalScrumPlanning.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('a 2023 export: states as lists in workflow order, type and labels, owners, dates', () => {
    const board = parsePivotalCsv(MODERN);
    assert.deepEqual(board.columns.map(c => c.title), ['Unscheduled', 'Unstarted', 'Delivered', 'Accepted'],
      'only the states present, in Tracker\'s workflow order, not file order');
    const [reset, login, release, idea] = board.tasks;
    assert.equal(reset.title, 'Reset Password');
    assert.equal(reset.column_name, 'Delivered');
    assert.equal(reset.ref, '186456829');
    assert.deepEqual(reset.tags, ['feature', 'customer', 'auth']);
    assert.equal(reset.owner_username, 'xkniu07');
    assert.deepEqual(reset.assignees, ['Tony Xiang'], 'repeated Owned By, in column order');
    assert.equal(reset.requested_by, 'Tony Xiang');
    assert.equal(reset.date_creation, '2023-11-11T00:00:00.000Z');
    assert.deepEqual(reset.custom_fields, { [STORY_POINTS_FIELD]: 2, Priority: 'p3 - Low' });
    assert.equal(login.date_end, '2023-11-09T00:00:00.000Z', 'Accepted at is the end date');
    assert.equal(login.custom_fields[STORY_POINTS_FIELD], undefined, '-1 is unestimated');
    assert.equal(login.custom_fields.Priority, 'p0 - Critical');
    assert.equal(release.date_due, '2023-12-01T00:00:00.000Z', 'Deadline is the due date');
    assert.equal(release.custom_fields, undefined, 'priority none is no priority');
    assert.equal(release.description, '=SUM(A1)');
    assert.equal(idea.column_name, 'Unscheduled');
    assert.equal(idea.description, 'Line one\nline two, with "quotes"');
  });

  await test('repeated Comment, Task and Blocker columns are collected in order', () => {
    const [reset, login] = parsePivotalCsv(MODERN).tasks;
    assert.deepEqual(reset.comments, [
      { text: 'Looks good', author: 'Tony Xiang', date: '2023-11-11T00:00:00.000Z' },
      { text: 'Ship it (with tests)', author: 'xkniu07', date: '2023-11-12T00:00:00.000Z' },
    ]);
    assert.deepEqual(reset.checklists, [{ title: 'Tasks', items: [
      { title: 'Create function', done: true }, { title: 'Create webpages', done: false }] }]);
    assert.deepEqual(reset.dependencies, [{ ref: '186456826', type: 'is-blocked-by' }]);
    const plan = planImportedTask(reset);
    assert.equal(plan.card.requestedBy, 'Tony Xiang');
    assert.deepEqual(plan.comments.map(c => c.text), ['Tony Xiang: Looks good', 'xkniu07: Ship it (with tests)'],
      'an unmapped author leads the comment text');
    assert.equal(plan.checklists[0].items[0].isFinished, true);
    const links = planImportedLinks(parsePivotalCsv(MODERN).tasks);
    assert.deepEqual(links.dependencies, [{ index: 0, deps: [{ target: 1, type: 'is-blocked-by' }] }]);
    assert.equal(login.comments, undefined);
    const fields = planImportedCustomFields(parsePivotalCsv(MODERN).tasks).fields;
    assert.deepEqual(fields.find(f => f.name === STORY_POINTS_FIELD), { name: STORY_POINTS_FIELD, type: 'number' });
  });

  await test('iterations become Scrum sprints; a finished one and the losses are reported', () => {
    const board = parsePivotalCsv(MODERN);
    const transfer = board.scrumTransfer;
    assert.doesNotThrow(() => normalizeScrumTransfer(transfer));
    assert.equal(transfer.sprints.length, 1);
    assert.equal(transfer.sprints[0].name, 'Iteration 4');
    assert.equal(transfer.sprints[0].state, 'planned');
    assert.equal(transfer.sprints[0].plannedStart.toISOString(), '2023-11-06T00:00:00.000Z');
    assert.equal(transfer.sprints[0].plannedEnd.toISOString(), '2023-11-12T00:00:00.000Z');
    assert.deepEqual(transfer.cards.map(c => c._id), ['task-0', 'task-1']);
    assert.deepEqual(transfer.settings, { enabled: true, estimateSource: 'customField',
      estimateCustomFieldId: STORY_POINTS_FIELD, estimateUnit: 'points' });
    assert.match(board.scrumLosses.map(l => l.reason).join('\n'), /iteration "4" has no state in the export/);
    const old = parsePivotalCsv(OLD);
    assert.equal(old.scrumTransfer.sprints.length, 1, 'iteration 1 holds only accepted stories');
    assert.equal(old.scrumTransfer.sprints[0].name, 'Iteration 2');
    assert.match(old.scrumLosses.map(l => l.reason).join('\n'), /iteration "1" holds only accepted stories, so it is finished/);
    assert.deepEqual(pivotalScrumPlanning([]), { transfer: null, losses: [] });
  });

  await test('a pre-2018 export without Priority, Blocker, Pull Request or Git Branch', () => {
    const board = parsePivotalCsv(OLD);
    assert.deepEqual(board.unsupported, []);
    assert.deepEqual(board.columns.map(c => c.title), ['Started', 'Accepted']);
    const [ci, seats] = board.tasks;
    assert.deepEqual(ci.tags, ['chore', 'devops']);
    assert.equal(ci.date_end, '2014-11-22T00:00:00.000Z');
    assert.deepEqual(ci.comments, [{ text: 'Done on Travis', author: 'Ana Lee', date: '2014-11-22T00:00:00.000Z' }]);
    assert.equal(ci.custom_fields, undefined);
    assert.deepEqual(seats.custom_fields, { [STORY_POINTS_FIELD]: 3 });
    assert.equal(seats.owner_username, 'Bo Chen');
  });

  await test('negative: what has no place is reported, never guessed', () => {
    const reasons = parsePivotalCsv(MODERN).unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/2\/pull request 1 Pivotal Tracker pull request/);
    assert.match(reasons, /\/row\/2\/git branch 1 Pivotal Tracker git branch/);
    assert.match(reasons, /\/row\/5\/Blocker\/1 a resolved Pivotal Tracker blocker/);
    const odd = parsePivotalCsv([
      'Title,Current State,Type,Estimate,Priority,Created at,Comment,Blocker,Blocker Status,Story Color',
      'A,frozen,epicc,two,urgent,22.11.2014,no tail here,needs #1 and #2,blocked,red',
      ',started,,,,,,,,',
    ].join('\n'));
    const text = odd.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(text, /\/columns\/story color /);
    assert.match(text, /\/row\/2\/Current State Pivotal Tracker state "frozen"/);
    assert.match(text, /\/row\/2\/Type Pivotal Tracker type "epicc"/);
    assert.match(text, /\/row\/2\/Estimate Pivotal Tracker estimate "two"/);
    assert.match(text, /\/row\/2\/Priority Pivotal Tracker priority "urgent"/);
    assert.match(text, /\/row\/2\/created at Pivotal Tracker date "22\.11\.2014"/);
    assert.match(text, /\/row\/2\/Comment\/1 .*without its author and date/);
    assert.match(text, /\/row\/2\/Blocker\/1 .*names no single story/);
    assert.match(text, /\/row\/3 a Pivotal Tracker story without a title/);
    const [only] = odd.tasks;
    assert.equal(odd.tasks.length, 1);
    assert.equal(only.column_name, 'Unstarted');
    assert.deepEqual(only.tags, ['feature']);
    assert.equal(only.custom_fields, undefined);
    assert.equal(only.date_creation, undefined);
    assert.deepEqual(only.comments, [{ text: 'no tail here' }]);
    assert.equal(only.dependencies, undefined);
    assert.equal(odd.scrumTransfer, undefined);
    assert.equal(pivotalDate('Feb 30, 2024'), undefined, 'an impossible day is refused');
    assert.equal(pivotalDate('11/22/2014'), '2014-11-22T00:00:00.000Z');
    assert.equal(pivotalDate('13/01/2014'), undefined);
    assert.deepEqual(pivotalComment('Hi (not a tail)'), { text: 'Hi (not a tail)' });
    assert.throws(() => parsePivotalCsv(''), /empty/);
    assert.throws(() => parsePivotalCsv('name,section\nA,B'), /Title and Current State/);
    assert.throws(() => parsePivotalCsv('Title,Current State\n"A,B'), /Pivotal Tracker CSV has an unclosed quote/);
    assert.throws(() => validateImportSourceShape('pivotal', '  '), /Invalid pivotal/);
  });

  await test('export writes the columns Tracker imports, and it imports back', () => {
    const csv = formatters.pivotal({
      board: { title: 'Launch' },
      items: [
        { title: 'Order, valves', listTitle: 'Started', description: '=1+1 "big"', labels: ['bug', 'shop, east'],
          owner: 'ana', assignees: ['bo'], requestedBy: 'cy', createdAt: '2026-10-01T09:00:00.000Z',
          customFields: { [STORY_POINTS_FIELD]: 3, Priority: 'p1 - High' },
          comments: [{ text: 'On it', author: 'ana', date: '2026-10-02T10:00:00.000Z' }],
          checklists: [{ title: 'A', items: [{ title: 'Call', done: true }] }, { title: 'B', items: [{ title: 'Pay', done: false }] }] },
        { title: 'Ship it', listTitle: 'Done', endAt: '2026-10-07T00:00:00.000Z', dueAt: '2026-10-09T00:00:00.000Z',
          labels: ['release'] },
        { title: 'Plain', listTitle: 'Doing', dueAt: '2026-10-09T00:00:00.000Z' },
      ],
    });
    const header = csv.split('\r\n')[0].split(',');
    assert.deepEqual(header.slice(0, PIVOTAL_IMPORT_COLUMNS.length), PIVOTAL_IMPORT_COLUMNS);
    assert.deepEqual(header.slice(PIVOTAL_IMPORT_COLUMNS.length),
      ['Owned By', 'Owned By', 'Comment', 'Task', 'Task Status', 'Task', 'Task Status']);
    for (const ignored of ['Id', 'Iteration', 'URL']) assert.ok(!header.includes(ignored), `${ignored} is not written`);
    assert.ok(csv.includes('"\'=1+1 ""big"""'), 'a leading = is guarded as Tracker does');
    const back = parsePivotalCsv(csv);
    assert.deepEqual(back.unsupported, []);
    const [order, ship, plain] = back.tasks;
    assert.equal(order.title, 'Order, valves');
    assert.equal(order.description, '=1+1 "big"');
    assert.equal(order.column_name, 'Started');
    assert.deepEqual(order.tags, ['bug', 'shop east'], 'the first type label is the Type; a comma cannot split a label');
    assert.equal(order.owner_username, 'ana');
    assert.deepEqual(order.assignees, ['bo']);
    assert.equal(order.requested_by, 'cy');
    assert.equal(order.date_creation, '2026-10-01T00:00:00.000Z', 'Tracker dates have no time of day');
    assert.deepEqual(order.custom_fields, { [STORY_POINTS_FIELD]: 3, Priority: 'p1 - High' });
    assert.deepEqual(order.comments, [{ text: 'On it', author: 'ana', date: '2026-10-02T00:00:00.000Z' }]);
    assert.deepEqual(order.checklists[0].items, [{ title: 'Call', done: true }, { title: 'Pay', done: false }]);
    assert.equal(ship.column_name, 'Accepted', 'a card with an end date in another list is accepted');
    assert.equal(ship.date_end, '2026-10-07T00:00:00.000Z');
    assert.equal(ship.date_due, '2026-10-09T00:00:00.000Z', 'a release keeps its deadline');
    assert.equal(plain.column_name, 'Unstarted');
    assert.equal(plain.date_due, undefined, 'only a release has a Deadline in Tracker');
  });

  await test('the format is wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.pivotal, parsePivotalCsv);
    assert.equal(formatters.pivotal, formatPivotalCsv);
    assert.match(read('models/import.js'), /case 'pivotal':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.pivotal\(importedBoard\);[\s\S]*?new KanboardCreator\(data, 'pivotal'\)/);
    assert.match(read('server/lib/renderExternalExport.js'), /pivotal: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'pivotal', name: 'Pivotal Tracker'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'pivotal', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'pivotal'[^}]*path: 'export\/pivotal', ext: 'csv'/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Pivotal-Tracker/Pivotal-Tracker.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Pivotal\-Tracker\/Pivotal\-Tracker\.md\)/);
  });

  console.log(`\npivotalCsv: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
