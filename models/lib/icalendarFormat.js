// iCalendar (RFC 5545) on the Import page: the tasks (VTODO) and events
// (VEVENT) of an .ics file - Google Calendar and Google Takeout, Apple
// Reminders and Calendar, Thunderbird, Nextcloud Tasks, Outlook - as a board
// whose cards show in Calendar and Gantt. Plain JavaScript:
// tests/icalendarFormat.test.cjs runs it in Node. (The Calendar view's own
// .ics import, server/lib/icsImport.js, puts events into one chosen list.)
//
//   VTODO STATUS NEEDS-ACTION / none -> list "To Do"
//                IN-PROCESS          -> list "In Progress"
//                COMPLETED           -> list "Done", COMPLETED the end date
//                CANCELLED           -> list "Cancelled"
//   VEVENT                           -> list "Events" (DTSTART-DTEND; a
//                                       cancelled event goes to "Cancelled")
//   SUMMARY / DESCRIPTION            -> title / description
//   DTSTART, DUE (or DTEND)          -> start / due date
//   CREATED                          -> creation date
//   CATEGORIES                       -> labels
//   PRIORITY 1-4 / 5 / 6-9           -> label priority:high / medium / low
//   LOCATION, URL                    -> appended to the description
//   RELATED-TO (VTODO)               -> the parent card (a subtask)
//   X-WR-CALNAME                     -> the board title
// A time with TZID is read as written, in UTC: an .ics carries the zone's
// rules in VTIMEZONE, which is not interpreted. RRULE repeats are not
// expanded; each is reported.

export const MAX_ICS_LENGTH = 64 * 1024 * 1024;
export const MAX_ICS_COMPONENTS = 50000;
export const ICAL_LISTS = ['To Do', 'In Progress', 'Done', 'Cancelled', 'Events'];

// Logical lines: a line starting with a space or a tab continues the last.
function unfold(text) {
  const out = [];
  for (const line of String(text).replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    if (/^[ \t]/.test(line) && out.length) out[out.length - 1] += line.slice(1);
    else if (line) out.push(line);
  }
  return out;
}

// NAME;PARAM=a;PARAM2="b:c":value -> { name, params, value }
function contentLine(line) {
  let i = 0;
  let quoted = false;
  for (; i < line.length; i++) {
    if (line[i] === '"') quoted = !quoted;
    else if (line[i] === ':' && !quoted) break;
  }
  const head = line.slice(0, i);
  const value = line.slice(i + 1);
  const [name, ...rawParams] = head.split(';');
  const params = {};
  for (const param of rawParams) {
    const eq = param.indexOf('=');
    if (eq > 0) params[param.slice(0, eq).toUpperCase()] = param.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value };
}

const unescape = text => String(text || '').replace(/\\([\\;,nN])/g, (m, c) => (c === 'n' || c === 'N' ? '\n' : c));
// TEXT lists (CATEGORIES) split on unescaped commas.
const textList = value => String(value || '').split(/(?<!\\),/).map(unescape).map(s => s.trim()).filter(Boolean);

// 20261110, 20261110T090000, 20261110T090000Z -> ISO (UTC).
export function icalDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?Z?)?$/.exec(String(value || '').trim());
  if (!m) return undefined;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)));
  return Number.isNaN(d.getTime()) || d.getUTCMonth() !== +m[2] - 1 ? undefined : d.toISOString();
}

const priorityLabel = value => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 9) return null;
  return n <= 4 ? 'priority:high' : n === 5 ? 'priority:medium' : 'priority:low';
};

// Each VTODO / VEVENT as { kind, props: { NAME: [{ params, value }] } }, and
// the calendar's own properties.
function components(lines) {
  const out = [];
  const calendar = {};
  const stack = [];
  for (const line of lines) {
    const { name, params, value } = contentLine(line);
    if (name === 'BEGIN') { stack.push({ kind: value.toUpperCase(), props: {} }); continue; }
    if (name === 'END') {
      const done = stack.pop();
      if (done && (done.kind === 'VTODO' || done.kind === 'VEVENT') && out.length < MAX_ICS_COMPONENTS) out.push(done);
      continue;
    }
    const top = stack[stack.length - 1];
    if (!top) continue;
    if (top.kind === 'VCALENDAR') calendar[name] = value;
    // A VALARM inside a task belongs to the alarm, not the task.
    if (top.kind !== 'VTODO' && top.kind !== 'VEVENT') continue;
    (top.props[name] = top.props[name] || []).push({ params, value });
  }
  return { items: out, calendar };
}

export function parseICalendar(text, { name } = {}) {
  const source = String(text == null ? '' : text);
  if (source.length > MAX_ICS_LENGTH) throw new Error('iCalendar file is too large');
  if (!/BEGIN:VCALENDAR/i.test(source)) throw new Error('Not an iCalendar file: no BEGIN:VCALENDAR');
  const { items, calendar } = components(unfold(source));
  const unsupported = [];
  const tasks = [];
  const byUid = new Map();
  let repeats = 0;
  for (const [index, item] of items.entries()) {
    const one = key => (item.props[key] && item.props[key][0]) || null;
    const value = key => (one(key) ? one(key).value : '');
    const status = value('STATUS').toUpperCase();
    const isTodo = item.kind === 'VTODO';
    let column = 'Events';
    if (isTodo) {
      column = { 'IN-PROCESS': 'In Progress', COMPLETED: 'Done', CANCELLED: 'Cancelled' }[status] || 'To Do';
    } else if (status === 'CANCELLED') column = 'Cancelled';
    if (one('RRULE')) repeats += 1;
    const tags = (item.props.CATEGORIES || []).flatMap(p => textList(p.value));
    const priority = priorityLabel(value('PRIORITY'));
    if (priority) tags.push(priority);
    const extra = [value('LOCATION') && `Location: ${unescape(value('LOCATION'))}`, value('URL') && unescape(value('URL'))]
      .filter(Boolean);
    const description = [unescape(value('DESCRIPTION')).trim(), ...extra].filter(Boolean).join('\n\n');
    const uid = value('UID');
    const task = {
      ref: uid || `ics-${index}`,
      title: unescape(value('SUMMARY')).trim() || (isTodo ? 'Untitled task' : 'Untitled event'),
      description,
      column_name: column,
      swimlane_name: 'Default',
      date_started: icalDate(value('DTSTART')),
      date_due: icalDate(value(isTodo ? 'DUE' : 'DTEND')) || (isTodo ? undefined : icalDate(value('DTSTART'))),
      date_end: isTodo && status === 'COMPLETED' ? icalDate(value('COMPLETED')) || icalDate(value('LAST-MODIFIED')) : undefined,
      date_creation: icalDate(value('CREATED')) || icalDate(value('DTSTAMP')),
      due_complete: isTodo && status === 'COMPLETED' ? true : undefined,
      tags: [...new Set(tags)],
    };
    const related = one('RELATED-TO');
    if (isTodo && related && (!related.params.RELTYPE || related.params.RELTYPE.toUpperCase() === 'PARENT')) {
      task.parent_ref = related.value;
    }
    if (uid) byUid.set(uid, task);
    tasks.push(task);
  }
  if (items.length >= MAX_ICS_COMPONENTS) {
    unsupported.push({ path: '/VCALENDAR', reason: `only the first ${MAX_ICS_COMPONENTS} tasks and events are imported` });
  }
  if (repeats) {
    unsupported.push({ path: '/VCALENDAR/RRULE', reason: `${repeats} repeating item(s) are imported once, at their first date` });
  }
  // A parent that is not in the file is no parent.
  for (const task of tasks) if (task.parent_ref && !byUid.has(task.parent_ref)) delete task.parent_ref;
  const used = new Set(tasks.map(t => t.column_name));
  return {
    board: { name: name || unescape(calendar['X-WR-CALNAME'] || '').trim() || 'Imported calendar' },
    columns: ICAL_LISTS.filter(list => used.has(list) || list === 'To Do').map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}
