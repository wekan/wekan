'use strict';
// iCalendar (RFC 5545) on the Import page: VTODO tasks by STATUS and VEVENT
// events, with dates for Calendar and Gantt (models/lib/icalendarFormat.js).
// Run: node --test tests/icalendarFormat.test.cjs
const test = require('node:test');
const assert = require('node:assert');

// As Nextcloud Tasks and Google Calendar write them: a folded line, escaped
// text, a VALARM inside a task, a subtask, a repeating event.
const ICS = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nextcloud Tasks', 'X-WR-CALNAME:Kotityöt',
  'BEGIN:VTODO', 'UID:t1', 'SUMMARY:Order valves\\, two', 'DESCRIPTION:Line one\\nLine two',
  'DUE:20261120T150000Z', 'DTSTART;VALUE=DATE:20261110', 'CATEGORIES:shop,urgent', 'PRIORITY:1',
  'CREATED:20261101T080000Z',
  'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Alarm text is not the task', 'END:VALARM',
  'END:VTODO',
  'BEGIN:VTODO', 'UID:t2', 'SUMMARY:Measure', 'STATUS:COMPLETED', 'COMPLETED:20261105T120000Z',
  'DUE:20261106T120000Z', 'RELATED-TO:t1', 'END:VTODO',
  'BEGIN:VTODO', 'UID:t3', 'SUMMARY:Fit', 'STATUS:IN-PROCESS', 'END:VTODO',
  'BEGIN:VEVENT', 'UID:e1', 'SUMMARY:Weekly meeting', 'DTSTART;TZID=Europe/Helsinki:20261116T100000',
  'DTEND;TZID=Europe/Helsinki:20261116T110000', 'RRULE:FREQ=WEEKLY', 'LOCATION:Room 2',
  'DESCRIPTION:A long description that goes on an',
  ' d on.', 'END:VEVENT',
  'END:VCALENDAR', '',
].join('\r\n');

let ical;
test.before(async () => { ical = await import('../models/lib/icalendarFormat.js'); });

test('tasks go to their status list, events to Events, with their dates', () => {
  const board = ical.parseICalendar(ICS);
  assert.strictEqual(board.board.name, 'Kotityöt');
  assert.deepStrictEqual(board.columns.map(c => c.title), ['To Do', 'In Progress', 'Done', 'Events']);
  const [order, measure, fit, meeting] = board.tasks;
  assert.strictEqual(order.title, 'Order valves, two');
  assert.strictEqual(order.description, 'Line one\nLine two');
  assert.strictEqual(order.date_due, '2026-11-20T15:00:00.000Z');
  assert.strictEqual(order.date_started, '2026-11-10T00:00:00.000Z');
  assert.deepStrictEqual(order.tags, ['shop', 'urgent', 'priority:high']);
  assert.strictEqual(measure.column_name, 'Done');
  assert.strictEqual(measure.date_end, '2026-11-05T12:00:00.000Z');
  assert.strictEqual(measure.due_complete, true);
  assert.strictEqual(measure.parent_ref, 't1');
  assert.strictEqual(fit.column_name, 'In Progress');
  assert.strictEqual(meeting.column_name, 'Events');
  assert.strictEqual(meeting.date_started, '2026-11-16T10:00:00.000Z');
  assert.strictEqual(meeting.date_due, '2026-11-16T11:00:00.000Z');
  assert.match(meeting.description, /goes on and on\.\n\nLocation: Room 2$/);
  assert.ok(board.unsupported.some(u => /1 repeating item/.test(u.reason)));
});

test('negative: not a calendar, bad dates, an alarm and an unknown parent', () => {
  assert.throws(() => ical.parseICalendar('SUMMARY:x'), /no BEGIN:VCALENDAR/);
  assert.strictEqual(ical.icalDate('20261340'), undefined);
  assert.strictEqual(ical.icalDate('nonsense'), undefined);
  const board = ical.parseICalendar(ICS);
  assert.ok(!board.tasks.some(t => /Alarm text/.test(t.description)), 'a VALARM is not the task');
  const orphan = ical.parseICalendar('BEGIN:VCALENDAR\nBEGIN:VTODO\nUID:a\nSUMMARY:x\nRELATED-TO:missing\nEND:VTODO\nEND:VCALENDAR');
  assert.strictEqual(orphan.tasks[0].parent_ref, undefined);
  assert.strictEqual(orphan.board.name, 'Imported calendar');
});
