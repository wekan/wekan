'use strict';

// Repeating tasks of other tools as WeKan's card recurrence (daily, weekly,
// monthly - models/lib/cardRecurrenceSchedule.js), through
// models/lib/recurrenceMap.js. Every format below used to report a repeat as
// lost and import the task once, while WeKan cards could repeat all along.
// Run: node tests/recurrenceMap.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

async function main() {
  const map = await import('../models/lib/recurrenceMap.js');
  const { CARD_RECURRENCE_INTERVALS } = await import('../models/lib/cardRecurrenceSchedule.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  const { parseTaskwarrior, formatTaskwarrior } = await import('../models/lib/taskwarriorFormat.js');
  const { parseICalendar } = await import('../models/lib/icalendarFormat.js');
  const { cardsToIcs } = await import('../models/lib/icalExport.js');
  const { parseOrgMode, formatOrgMode } = await import('../models/lib/orgModeFormat.js');
  const { parseObsidianKanban, formatObsidianKanban } = await import('../models/lib/obsidianKanbanFormat.js');
  const { parseMicrosoftTodoApi } = await import('../models/lib/mstodoApiFormat.js');
  const { parseTodoistCsv } = await import('../models/lib/todoistCsvFormat.js');
  const { parseTickTickCsv, formatTickTickCsv } = await import('../models/lib/ticktickCsvFormat.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  const reasons = board => board.unsupported.map(u => u.reason).join(' | ');

  test('the three intervals are the card schema\'s, besides none', () => {
    assert.deepEqual(map.RECURRENCES, CARD_RECURRENCE_INTERVALS.filter(v => v !== 'none'));
  });

  test('RRULE: daily, weekly, monthly with interval 1, one weekday or one month day', () => {
    assert.equal(map.recurrenceFromRRule('FREQ=DAILY'), 'daily');
    assert.equal(map.recurrenceFromRRule('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO'), 'weekly');
    assert.equal(map.recurrenceFromRRule('freq=monthly;bymonthday=15'), 'monthly');
  });

  test('negative: a rule WeKan cannot keep is no recurrence', () => {
    for (const rule of ['FREQ=WEEKLY;INTERVAL=2', 'FREQ=YEARLY', 'FREQ=DAILY;COUNT=5', 'FREQ=DAILY;UNTIL=20261231T000000Z',
      'FREQ=WEEKLY;BYDAY=MO,WE', 'FREQ=DAILY;BYDAY=MO', 'FREQ=HOURLY', '', null, 42]) {
      assert.equal(map.recurrenceFromRRule(rule), null, String(rule));
    }
  });

  test('text: Taskwarrior recur, Org repeaters, "every ..."', () => {
    for (const [value, want] of [['daily', 'daily'], ['weekly', 'weekly'], ['monthly', 'monthly'], ['1w', 'weekly'],
      ['P1M', 'monthly'], ['+1d', 'daily'], ['++1w', 'weekly'], ['.+1m', 'monthly'], ['every day', 'daily'],
      ['Every week', 'weekly'], ['every month when done', 'monthly'], ['every 1 week', 'weekly']]) {
      assert.equal(map.recurrenceFromText(value), want, value);
    }
    for (const value of ['2w', '+2d', 'yearly', 'every monday', 'every 2 weeks', 'tomorrow', 'w', '', '+1y', 'biweekly']) {
      assert.equal(map.recurrenceFromText(value), null, value);
    }
  });

  test('Microsoft To Do: interval 1 with no end; negative: other patterns', () => {
    assert.equal(map.recurrenceFromMsTodo({ pattern: { type: 'daily', interval: 1 }, range: { type: 'noEnd' } }), 'daily');
    assert.equal(map.recurrenceFromMsTodo({ pattern: { type: 'weekly', interval: 1, daysOfWeek: ['friday'] } }), 'weekly');
    assert.equal(map.recurrenceFromMsTodo({ pattern: { type: 'absoluteMonthly', interval: 1 } }), 'monthly');
    assert.equal(map.recurrenceFromMsTodo({ pattern: { type: 'weekly', interval: 2 } }), null);
    assert.equal(map.recurrenceFromMsTodo({ pattern: { type: 'weekly', interval: 1, daysOfWeek: ['monday', 'friday'] } }), null);
    assert.equal(map.recurrenceFromMsTodo({ pattern: { type: 'absoluteYearly', interval: 1 } }), null);
    assert.equal(map.recurrenceFromMsTodo({ pattern: { type: 'daily', interval: 1 }, range: { type: 'numbered' } }), null);
  });

  test('the plan sets recurrenceInterval and counts the last occurrence from the import', () => {
    const now = new Date('2026-11-20T10:00:00Z');
    const { card } = planImportedTask({ title: 'Report', recurrence: 'weekly', date_creation: '2020-01-01T00:00:00Z' }, { now });
    assert.equal(card.recurrenceInterval, 'weekly');
    assert.equal(card.lastRecurrenceAt.toISOString(), now.toISOString(), 'not from 2020: no copy at once');
    for (const bad of ['yearly', 'none', '', 7, undefined]) {
      const plan = planImportedTask({ title: 'X', recurrence: bad });
      assert.equal(plan.card.recurrenceInterval, undefined, String(bad));
      assert.equal(plan.card.lastRecurrenceAt, undefined);
    }
  });

  test('Taskwarrior: the newest open instance repeats, once per template; other recurs are reported', () => {
    const board = parseTaskwarrior(JSON.stringify([
      { uuid: 't', status: 'recurring', recur: 'weekly', description: 'Report', due: '20261001T000000Z' },
      { uuid: 'a', status: 'pending', recur: 'weekly', parent: 't', description: 'Report', due: '20261008T000000Z' },
      { uuid: 'b', status: 'pending', recur: 'weekly', parent: 't', description: 'Report', due: '20261015T000000Z' },
      { uuid: 'c', status: 'pending', recur: 'monthly', description: 'Invoice' },
      { uuid: 'd', status: 'pending', recur: '2w', description: 'Sprint' },
      { uuid: 'e', status: 'completed', recur: 'daily', description: 'Old', end: '20261001T000000Z' },
    ]));
    const by = Object.fromEntries(board.tasks.map(t => [t.ref, t.recurrence]));
    assert.deepEqual(by, { a: undefined, b: 'weekly', c: 'monthly', d: undefined, e: undefined });
    assert.match(reasons(board), /recur 2w is not daily, weekly or monthly/);
    assert.doesNotMatch(reasons(board), /attribute (recur|parent) has no WeKan field/);
    const out = JSON.parse(formatTaskwarrior({ items: [
      { cardId: 'c1', title: 'Report', listTitle: 'To Do', recurrence: 'weekly' },
      { cardId: 'c2', title: 'Done one', listTitle: 'Done', recurrence: 'weekly' },
    ] }));
    assert.equal(out[0].recur, 'weekly');
    assert.equal(out[1].recur, undefined, 'a finished card does not repeat');
    assert.equal(parseTaskwarrior(JSON.stringify(out)).tasks[0].recurrence, 'weekly');
  });

  test('iCalendar: the feed writes RRULE on a repeating card, and the import reads it back', () => {
    const ics = cardsToIcs([{ _id: 'c1', title: 'Report', dueAt: new Date('2026-12-24T12:00:00Z'), recurrenceInterval: 'monthly' },
      { _id: 'c2', title: 'Once', dueAt: new Date('2026-12-24T12:00:00Z') }], { now: new Date('2026-11-20T00:00:00Z') });
    assert.equal((ics.match(/^RRULE:/gm) || []).length, 1);
    assert.match(ics, /^RRULE:FREQ=MONTHLY\r$/m);
    const board = parseICalendar(ics);
    assert.deepEqual(board.tasks.map(t => t.recurrence), ['monthly', undefined]);
    assert.deepEqual(board.unsupported, []);
    const other = parseICalendar('BEGIN:VCALENDAR\r\nBEGIN:VTODO\r\nUID:x\r\nSUMMARY:Fortnight\r\nRRULE:FREQ=WEEKLY;INTERVAL=2\r\nEND:VTODO\r\nEND:VCALENDAR\r\n');
    assert.equal(other.tasks[0].recurrence, undefined);
    assert.match(reasons(other), /1 item\(s\) repeat other than daily, weekly or monthly/);
  });

  test('Org mode: a +1w repeater repeats and is written back; a delay or +2w is reported', () => {
    const org = formatOrgMode({ board: { title: 'B' }, items: [
      { cardId: 'c1', title: 'Report', listTitle: 'Doing', dueAt: '2026-12-24T00:00:00.000Z', recurrence: 'weekly' }] });
    assert.match(org, /DEADLINE: <2026-12-24 Thu \+1w>/);
    const back = parseOrgMode(org);
    assert.equal(back.tasks[0].recurrence, 'weekly');
    assert.deepEqual(back.unsupported, []);
    const other = parseOrgMode('* L\n** TODO A\n   DEADLINE: <2026-12-24 Thu +2w>\n** TODO B\n   DEADLINE: <2026-12-24 Thu -2d>\n');
    assert.deepEqual(other.tasks.map(t => t.recurrence), [undefined, undefined]);
    assert.equal(other.unsupported.length, 2);
  });

  test('Obsidian Kanban: 🔁 every week repeats and is written back; 🔁 every monday is reported', () => {
    const md = formatObsidianKanban({ board: { title: 'B' }, items: [
      { cardId: 'c1', title: 'Report', listTitle: 'Doing', recurrence: 'weekly' }] });
    assert.match(md, /🔁 every week/);
    const back = parseObsidianKanban(md);
    assert.equal(back.tasks[0].recurrence, 'weekly');
    assert.equal(back.tasks[0].title, 'Report', 'the rule is not left in the title');
    const other = parseObsidianKanban(md.replace('every week', 'every monday'));
    assert.equal(other.tasks[0].recurrence, undefined);
    assert.match(reasons(other), /recurrence "🔁 every monday" is imported once/);
  });

  test('Microsoft To Do: a daily repeat repeats; an every-two-weeks one is still reported', () => {
    const board = parseMicrosoftTodoApi({ mstodo: true, lists: [{ displayName: 'Tasks', tasks: [
      { id: '1', title: 'Water', status: 'notStarted', recurrence: { pattern: { type: 'daily', interval: 1 }, range: { type: 'noEnd' } } },
      { id: '2', title: 'Sprint', status: 'notStarted', recurrence: { pattern: { type: 'weekly', interval: 2 } } },
    ] }] });
    assert.deepEqual(board.tasks.map(t => t.recurrence), ['daily', undefined]);
    assert.match(reasons(board), /repeat \(weekly\) of "Sprint" is not imported/);
    assert.doesNotMatch(reasons(board), /"Water"/);
  });

  test('Todoist: DATE "every week" repeats; "every monday" is still reported', () => {
    const header = 'TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE,DURATION,DURATION_UNIT,DEADLINE,DEADLINE_LANG';
    const board = parseTodoistCsv(`${header}\ntask,Report,,4,1,,,every week,en,UTC,,,,\ntask,Gym,,4,1,,,every monday,en,UTC,,,,\n`);
    assert.deepEqual(board.tasks.map(t => t.recurrence), ['weekly', undefined]);
    assert.match(reasons(board), /"every monday"/);
    assert.doesNotMatch(reasons(board), /"every week"/);
  });

  test('TickTick: Repeat RRULE round trip; negative: INTERVAL=2 stays reported', () => {
    const csv = formatTickTickCsv({ board: { title: 'B' }, items: [
      { cardId: 'c1', title: 'Report', listTitle: 'Doing', recurrence: 'daily' },
      { cardId: 'c2', title: 'Once', listTitle: 'Doing' }] });
    assert.match(csv, /RRULE:FREQ=DAILY;INTERVAL=1/);
    const back = parseTickTickCsv(csv);
    assert.deepEqual(back.tasks.map(t => t.recurrence), ['daily', undefined]);
    const other = parseTickTickCsv(csv.replace('INTERVAL=1', 'INTERVAL=2'));
    assert.equal(other.tasks[0].recurrence, undefined);
    assert.match(reasons(other), /repeating task "RRULE:FREQ=DAILY;INTERVAL=2" is imported once/);
  });

  test('WeKan JSON import keeps recurrenceInterval, counted from the import; exports carry it', () => {
    const creator = read('models/wekanCreator.js');
    assert.match(creator, /recurrenceInterval: card\.recurrenceInterval, lastRecurrenceAt: this\._now\(\)/);
    const exporters = read('models/lib/externalExporters.js');
    assert.match(exporters, /\{ recurrence: c\.recurrenceInterval \}/);
    assert.match(exporters, /delete out\.recurrence;/, 'unticking dates leaves the repeat out too');
    assert.match(read('models/export.js'), /recurrenceInterval: card\.recurrenceInterval,/);
  });

  test('negative: no import sets a recurrence that is not one of the three, nor without the mapper', () => {
    const dir = path.join(ROOT, 'models/lib');
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      // Every normalized `recurrence` comes from a variable the mapper filled.
      for (const match of source.matchAll(/\brecurrence\s*:\s*(['"`][^'"`]*['"`])/g)) {
        assert.ok(map.RECURRENCES.includes(match[1].slice(1, -1)), `${file}: recurrence ${match[1]}`);
      }
      if (/\.recurrence = |\{ recurrence \}/.test(source) && file !== 'recurrenceMap.js' && file !== 'importedTaskPlan.js') {
        assert.match(source, /from '\.\/recurrenceMap(\.js)?'/, `${file} sets a recurrence without models/lib/recurrenceMap.js`);
      }
    }
    // The plan is the one place a card's recurrenceInterval is written by an
    // external import, and it always sets lastRecurrenceAt with it.
    const plan = read('models/lib/importedTaskPlan.js');
    assert.match(plan, /card\.recurrenceInterval = task\.recurrence;\n\s*card\.lastRecurrenceAt = /);
  });

  console.log(`recurrenceMap: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
