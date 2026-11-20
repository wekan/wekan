'use strict';
// Microsoft Project's XML (MSPDI): a plan read as a board, and a board
// written as a plan Project opens (models/lib/msProjectXmlFormat.js).
// Run: node --test tests/msProjectXml.test.cjs
const test = require('node:test');
const assert = require('node:assert');

let mpp;
test.before(async () => { mpp = await import('../models/lib/msProjectXmlFormat.js'); });

// As Project 2019 saves "XML Format": the project's summary row UID 0, a
// summary task per phase, tasks under them, resources and assignments.
const PLAN = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <SaveVersion>14</SaveVersion>
  <Name>Office move.xml</Name>
  <Title>Office move</Title>
  <Calendars><Calendar><UID>1</UID><Name>Standard</Name></Calendar></Calendars>
  <Tasks>
    <Task><UID>0</UID><ID>0</ID><Name>Office move</Name><OutlineLevel>0</OutlineLevel><Summary>1</Summary></Task>
    <Task><UID>1</UID><ID>1</ID><Name>Planning</Name><OutlineNumber>1</OutlineNumber><OutlineLevel>1</OutlineLevel><Summary>1</Summary></Task>
    <Task><UID>2</UID><ID>2</ID><Name>Choose the site</Name><WBS>1.1</WBS><OutlineLevel>2</OutlineLevel>
      <Priority>700</Priority><Start>2026-11-23T08:00:00</Start><Finish>2026-11-25T17:00:00</Finish>
      <Duration>PT24H0M0S</Duration><PercentComplete>100</PercentComplete><ActualFinish>2026-11-25T12:00:00</ActualFinish>
      <Summary>0</Summary><Milestone>0</Milestone><Notes>Two offers &amp; a visit.</Notes></Task>
    <Task><UID>3</UID><ID>3</ID><Name>Sign the lease</Name><OutlineLevel>2</OutlineLevel>
      <Start>2026-11-26T08:00:00</Start><Finish>2026-11-26T08:00:00</Finish><Duration>PT0H0M0S</Duration>
      <PercentComplete>0</PercentComplete><Milestone>1</Milestone><Summary>0</Summary>
      <PredecessorLink><PredecessorUID>2</PredecessorUID><Type>1</Type><LinkLag>0</LinkLag></PredecessorLink></Task>
    <Task><UID>4</UID><ID>4</ID><Name>Moving</Name><OutlineLevel>1</OutlineLevel><Summary>1</Summary></Task>
    <Task><UID>5</UID><ID>5</ID><Name>Pack</Name><OutlineLevel>2</OutlineLevel><Summary>1</Summary><PercentComplete>40</PercentComplete></Task>
    <Task><UID>6</UID><ID>6</ID><Name>Pack the kitchen</Name><OutlineLevel>3</OutlineLevel><PercentComplete>40</PercentComplete>
      <PredecessorLink><PredecessorUID>3</PredecessorUID><Type>3</Type><LinkLag>4800</LinkLag></PredecessorLink></Task>
  </Tasks>
  <Resources>
    <Resource><UID>0</UID><ID>0</ID></Resource>
    <Resource><UID>1</UID><ID>1</ID><Name>Megan Bowen</Name></Resource>
    <Resource><UID>2</UID><ID>2</ID><Name>Alex Wilber</Name></Resource>
  </Resources>
  <Assignments>
    <Assignment><UID>1</UID><TaskUID>2</TaskUID><ResourceUID>1</ResourceUID></Assignment>
    <Assignment><UID>2</UID><TaskUID>2</TaskUID><ResourceUID>2</ResourceUID></Assignment>
    <Assignment><UID>3</UID><TaskUID>6</TaskUID><ResourceUID>-65535</ResourceUID></Assignment>
  </Assignments>
</Project>`;

test('a plan becomes a board: phases are swimlanes, progress the lists, links dependencies', () => {
  const board = mpp.parseMsProjectXml(PLAN);
  assert.strictEqual(board.board.name, 'Office move');
  assert.deepStrictEqual(board.swimlanes.map(s => s.name), ['Planning', 'Moving']);
  assert.deepStrictEqual(board.columns.map(c => c.title), ['Not started', 'In progress', 'Completed']);
  const byTitle = Object.fromEntries(board.tasks.map(t => [t.title, t]));
  const site = byTitle['Choose the site'];
  assert.strictEqual(site.column_name, 'Completed');
  assert.strictEqual(site.description, 'Two offers & a visit.');
  assert.strictEqual(site.owner_username, 'Megan Bowen');
  assert.deepStrictEqual(site.assignees, ['Alex Wilber']);
  assert.strictEqual(site.date_started, '2026-11-23T08:00:00.000Z');
  assert.strictEqual(site.date_end, '2026-11-25T12:00:00.000Z');
  assert.deepStrictEqual(site.custom_fields, { Priority: 700, 'Duration (hours)': 24, '% Complete': 100, WBS: '1.1' });
  assert.deepStrictEqual(byTitle['Sign the lease'].tags, ['Milestone']);
  assert.deepStrictEqual(byTitle['Sign the lease'].dependencies, [{ ref: '2', type: 'is-blocked-by' }]);
  // A summary task below level 1 is a card, the parent of the tasks under it.
  assert.strictEqual(byTitle['Pack the kitchen'].parent_ref, '5');
  assert.strictEqual(byTitle['Pack the kitchen'].column_name, 'In progress');
  assert.ok(board.unsupported.some(u => /start-to-start/.test(u.reason)));
  assert.ok(board.unsupported.some(u => /lag/.test(u.reason)));
  assert.ok(board.unsupported.some(u => /calendars/.test(u.reason)));
});

test('durations: Project\'s PT forms in hours', () => {
  assert.strictEqual(mpp.projectHours('PT8H30M0S'), 8.5);
  assert.strictEqual(mpp.projectHours('P2DT4H'), 20);
  assert.strictEqual(mpp.projectHours('eight'), undefined);
});

test('round trip: the export is a plan the import reads back - lanes, parents, people, progress, links', () => {
  const items = [
    { cardId: 'a', title: 'Choose the site', listTitle: 'Done', swimlaneTitle: 'Planning', labels: [], owner: 'megan', assignees: ['alex'],
      startAt: '2026-11-23T08:00:00.000Z', dueAt: '2026-11-25T17:00:00.000Z', description: 'Two offers <and> a visit.' },
    { cardId: 'b', title: 'Sign the lease', listTitle: 'To do', swimlaneTitle: 'Planning', labels: ['Milestone'],
      dueAt: '2026-11-26T08:00:00.000Z', dependencies: [{ cardId: 'a', type: 'is-blocked-by' }] },
    { cardId: 'c', title: 'Pack', listTitle: 'Doing', swimlaneTitle: 'Default', labels: [], customFields: { '% Complete': 40 } },
    { cardId: 'd', title: 'Pack the kitchen', listTitle: 'Doing', swimlaneTitle: 'Default', labels: [], parentCardId: 'c' },
  ];
  const xml = mpp.formatMsProjectXml({ board: { title: 'Office move' }, items });
  assert.match(xml, /^<\?xml version="1.0"/);
  assert.ok(xml.includes('<Notes>Two offers &lt;and&gt; a visit.</Notes>'));
  const back = mpp.parseMsProjectXml(xml);
  assert.strictEqual(back.board.name, 'Office move');
  assert.deepStrictEqual(back.swimlanes.map(s => s.name), ['Planning', 'Default']);
  const t = Object.fromEntries(back.tasks.map(task => [task.title, task]));
  assert.deepStrictEqual(Object.keys(t), ['Choose the site', 'Sign the lease', 'Pack', 'Pack the kitchen']);
  assert.strictEqual(t['Choose the site'].column_name, 'Completed');
  assert.strictEqual(t['Choose the site'].description, 'Two offers <and> a visit.');
  assert.deepStrictEqual([t['Choose the site'].owner_username, t['Choose the site'].assignees], ['megan', ['alex']]);
  assert.strictEqual(t['Choose the site'].date_started, '2026-11-23T08:00:00.000Z');
  assert.strictEqual(t['Choose the site'].date_due, '2026-11-25T17:00:00.000Z');
  assert.deepStrictEqual(t['Sign the lease'].tags, ['Milestone']);
  assert.deepStrictEqual(t['Sign the lease'].dependencies, [{ ref: t['Choose the site'].ref, type: 'is-blocked-by' }]);
  assert.strictEqual(t.Pack.column_name, 'In progress');
  assert.strictEqual(t['Pack the kitchen'].parent_ref, t.Pack.ref);
});

test('negative: a DOCTYPE\'s entities are never expanded, and broken XML or no <Project> is refused', () => {
  const evil = `<?xml version="1.0"?><!DOCTYPE Project [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<Project><Tasks><Task><UID>1</UID><Name>&xxe;</Name><OutlineLevel>1</OutlineLevel></Task></Tasks></Project>`;
  const board = mpp.parseMsProjectXml(evil);
  assert.strictEqual(board.tasks[0].title, '&xxe;');
  assert.throws(() => mpp.parseMsProjectXml('<Project><Tasks>'), /ends before/);
  assert.throws(() => mpp.parseMsProjectXml('<Plan/>'), /no <Project>/);
  assert.throws(() => mpp.parseMsProjectXml('<Project><Tasks></Tasks></Project>'), /no tasks/);
  // Control characters XML 1.0 cannot hold are not written.
  assert.ok(!/\u0001/.test(mpp.formatMsProjectXml({ items: [{ cardId: 'x', title: 'a\u0001b', labels: [] }] })));
});
