// Microsoft To Do, as models/lib/apiImport/mstodo.js fetches it from
// Microsoft Graph, read into WeKan's normalized board. Plain JavaScript
// without Meteor, so tests/mstodoApiImport.test.cjs runs it in Node.
//
//   { mstodo: true, lists: [{ id, displayName, wellknownListName, tasks: [todoTask] }] }
//
// todoTask (Graph v1.0): id, title, body { content, contentType }, status,
// importance, isReminderOn, reminderDateTime, dueDateTime, startDateTime,
// completedDateTime ({ dateTime, timeZone }), createdDateTime,
// lastModifiedDateTime, categories[], checklistItems[{ displayName, isChecked }],
// recurrence, linkedResources[{ webUrl, displayName, applicationName }],
// hasAttachments.
//
// A list maps to a WeKan list (a repeated name gets " (2)"), a task to a card:
// the HTML body as plain text, checklistItems as a "Steps" checklist,
// categories as labels, high importance as a red "High importance" label, a
// status other than notStarted/completed as a label, and a completed task as
// an archived card ended when it was completed. Reminders, repeats and
// attachments have no WeKan place and are reported.

export const MAX_MSTODO_CARDS = 50000;
const STEPS_CHECKLIST = 'Steps';
const DEFAULT_SWIMLANE = 'Default';
const STATUS_TAGS = {
  inProgress: { name: 'In progress', color: 'blue' },
  waitingOnOthers: { name: 'Waiting on others', color: 'orange' },
  deferred: { name: 'Deferred', color: 'gray' },
};
const HIGH_IMPORTANCE = { name: 'High importance', color: 'red' };

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : '');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// A To Do body as plain text: Outlook writes HTML, with line breaks as <br>
// and paragraphs or divs.
export function mstodoBodyText(body) {
  if (!isObject(body)) return '';
  const content = text(body.content);
  if (text(body.contentType).toLowerCase() !== 'html') return content.trim();
  // Each removal until nothing changes: removing one element or tag can
  // splice the text around it into another ("<<b>b>").
  let out = content;
  let prev;
  do {
    prev = out;
    out = out.replace(/<(head|style|script)\b[\s\S]*?<\/\1\s*>/gi, '');
  } while (out !== prev);
  out = out
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)\s*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ');
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return out
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
      }
      return ENTITIES[code.toLowerCase()] ?? whole;
    })
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// A Graph dateTimeTimeZone ({ dateTime: '2026-10-14T00:00:00.0000000',
// timeZone: 'UTC' }) or an ISO string, as an ISO string; null for none,
// undefined when it is not a date. Graph answers in UTC unless asked
// otherwise; a dateTime without an offset is read as UTC.
export function mstodoDate(value) {
  if (value === undefined || value === null || value === '') return null;
  let raw = value;
  if (isObject(value)) raw = value.dateTime;
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  raw = raw.trim();
  if (/T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(raw)) raw += 'Z';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function readInput(input) {
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (error) { throw new Error('Microsoft To Do data is not valid JSON'); }
  }
  return input;
}

export function parseMicrosoftTodoApi(input) {
  const data = readInput(input);
  if (!isObject(data) || data.mstodo !== true || !Array.isArray(data.lists)) {
    throw new Error('Microsoft To Do data must be what the Microsoft To Do import fetched: { mstodo: true, lists: [...] }');
  }
  const total = data.lists.reduce((sum, list) => sum + (isObject(list) && Array.isArray(list.tasks) ? list.tasks.length : 0), 0);
  if (total > MAX_MSTODO_CARDS) throw new Error(`Microsoft To Do data has more than ${MAX_MSTODO_CARDS} tasks`);
  const unsupported = [];
  const columns = [];
  const tasks = [];
  data.lists.forEach((list, listIndex) => {
    const listAt = `/lists/${listIndex}`;
    if (!isObject(list)) { unsupported.push({ path: listAt, reason: 'a Microsoft To Do list that is not an object is not imported' }); return; }
    const base = text(list.displayName).trim() || 'Tasks';
    let title = base;
    for (let n = 2; columns.includes(title); n += 1) title = `${base} (${n})`;
    if (title !== base) unsupported.push({ path: `${listAt}/displayName`, reason: `Microsoft To Do has two lists named "${base}"; this one is imported as "${title}"` });
    columns.push(title);
    (Array.isArray(list.tasks) ? list.tasks : []).forEach((item, taskIndex) => {
      const at = `${listAt}/tasks/${taskIndex}`;
      if (!isObject(item)) { unsupported.push({ path: at, reason: 'a Microsoft To Do task that is not an object is not imported' }); return; }
      tasks.push(parseTask(item, at, title, unsupported));
    });
  });
  if (!columns.length) throw new Error('Microsoft To Do data has no lists');
  return {
    board: { name: columns.length === 1 ? columns[0] : 'Microsoft To Do' },
    columns: columns.map(name => ({ title: name })),
    swimlanes: [{ name: DEFAULT_SWIMLANE }],
    tasks,
    warnings: [],
    unsupported,
  };
}

function parseTask(item, at, column, unsupported) {
  const title = text(item.title).trim();
  const task = { title, description: mstodoBodyText(item.body), column_name: column, swimlane_name: DEFAULT_SWIMLANE, tags: [] };
  if (text(item.id)) task.ref = text(item.id);
  const date = (field, target) => {
    const value = mstodoDate(item[field]);
    if (value) task[target] = value;
    else if (value === undefined) unsupported.push({ path: `${at}/${field}`, reason: `Microsoft To Do ${field} of "${title}" is not a date` });
    return value;
  };
  date('dueDateTime', 'date_due');
  date('startDateTime', 'date_started');
  date('createdDateTime', 'date_creation');

  const links = (Array.isArray(item.linkedResources) ? item.linkedResources : [])
    .filter(link => isObject(link) && /^https?:\/\//i.test(text(link.webUrl)))
    .map(link => `- ${text(link.displayName).trim() || text(link.applicationName).trim() || 'Link'}: ${text(link.webUrl)}`);
  if (links.length) task.description = [task.description, `Linked:\n${links.join('\n')}`].filter(Boolean).join('\n\n');

  for (const category of Array.isArray(item.categories) ? item.categories : []) {
    const name = text(category).trim();
    if (name && !task.tags.some(tag => tag.name === name)) task.tags.push({ name });
  }
  if (item.importance === 'high') task.tags.push({ ...HIGH_IMPORTANCE });
  if (STATUS_TAGS[item.status]) task.tags.push({ ...STATUS_TAGS[item.status] });
  if (item.status === 'completed') {
    task.archived = true;
    date('completedDateTime', 'date_end');
    if (task.date_due) task.due_complete = true;
  }

  const items = (Array.isArray(item.checklistItems) ? item.checklistItems : [])
    .filter(step => isObject(step) && text(step.displayName).trim())
    .map(step => ({ title: text(step.displayName).trim(), done: step.isChecked === true }));
  if (items.length) task.checklists = [{ title: STEPS_CHECKLIST, items }];

  if (item.isReminderOn === true) {
    const when = mstodoDate(item.reminderDateTime);
    unsupported.push({ path: `${at}/reminderDateTime`,
      reason: `Microsoft To Do reminder of "${title}"${when ? ` at ${when}` : ''} is not imported; WeKan has no reminders` });
  }
  if (isObject(item.recurrence)) {
    const type = isObject(item.recurrence.pattern) ? text(item.recurrence.pattern.type) : '';
    unsupported.push({ path: `${at}/recurrence`,
      reason: `Microsoft To Do repeat${type ? ` (${type})` : ''} of "${title}" is not imported; the card is imported once` });
  }
  if (item.hasAttachments === true) {
    unsupported.push({ path: `${at}/attachments`, reason: `Microsoft To Do attachments of "${title}" are not imported` });
  }
  return task;
}
