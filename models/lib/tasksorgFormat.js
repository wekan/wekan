// Tasks.org (the Android task app) backup JSON, read and written in plain
// JavaScript so tests/tasksorgFormat.test.cjs runs the round trip in Node.
//
// Tasks.org writes a backup with Settings > Backups > Export tasks
// (user.<date>.json) and reads one back with Import backup. Its writer
// (org.tasks.backup.TasksJsonExporter) leaves out every property that equals
// its default, so a missing key means the default:
//
//   { version, timestamp, data: { tasks: [TaskBackup], tags: [TagData],
//     caldavAccounts, caldavCalendars, places, filters, taskListMetadata,
//     taskAttachments, intPrefs, longPrefs, stringPrefs, boolPrefs, setPrefs } }
//   TaskBackup = { task, tags, comments, alarms, geofences, attachments,
//                  caldavTasks, vtodo, ... }
//
// A task maps to:
//   caldavTasks[].calendar  -> the list: the caldavCalendars[] entry whose
//                              uuid it names (its name is the list title)
//   task.title / notes      -> the card's title / description
//   task.priority 0 / 1 / 2 -> custom field Priority = High / Medium / Low
//                              (3, the default, is no priority). A custom
//                              field, as for Microsoft Planner, so it does
//                              not mix with the task's own tags
//   tags[].name             -> labels
//   dueDate / hideUntil     -> due / start dates. Epoch ms; a date has a time
//                              only when ms % 60000 > 0 (Tasks.org sets the
//                              second to 1), otherwise it is all-day and is
//                              kept as that day at 12:00 UTC
//   completionDate          -> the end date (the card stays in its list)
//   creationDate            -> the created date
//   elapsedSeconds          -> time spent
//   estimatedSeconds        -> custom field Estimate (hours)
//   comments[]              -> comments (Tasks.org comments have no author)
//   caldavTasks[].remoteId  -> the card's source reference, and
//   caldavTasks[].remoteParent -> parent_ref: a subtask is a card of its own
//                              linked to its parent. Tasks.org has no
//                              checklists; its subtasks are full tasks with
//                              their own dates, notes and completion, which a
//                              checklist item could not keep
//   the account             -> the board title, when every list is in one
// Reported, not guessed: deleted tasks (deletionDate) are skipped, and a
// task's repeat rule, reminders (alarms), location reminders (geofences),
// a running timer, attachments (the backup has no file bytes), comment
// pictures and a list the backup does not define.
//
// Export writes a backup Tasks.org's importer accepts: one local account
// named after the board, one list (calendar) per WeKan list, tag
// definitions for the labels, and per task the caldavTasks row that puts it
// in its list. Checklist items become subtasks, the only place Tasks.org has
// for them; a subtask card is a subtask only when its parent is in the same
// list, because Tasks.org links parents within one list.

export const TASKSORG_BACKUP_VERSION = 151300;
export const TASKSORG_PRIORITY = ['High', 'Medium', 'Low'];
const PRIORITY_NONE = 3;
const LOCAL_ACCOUNT = 2;
const NO_LIST = 'No list';
const ESTIMATE_FIELD = 'Estimate (hours)';
const MINUTE = 60000;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const array = value => (Array.isArray(value) ? value : []);
const text = value => (typeof value === 'string' ? value : '');
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;

// A Tasks.org date (epoch ms, 0 = none) as ISO. A due or start date with no
// time (seconds 0) is the day itself, kept as that day at 12:00 UTC.
export function tasksorgDate(ms, { allDayAware = false } = {}) {
  if (!positive(ms)) return undefined;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return undefined;
  if (!allDayAware) return date.toISOString();
  if (ms % MINUTE > 0) return new Date(ms - (ms % MINUTE)).toISOString();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)).toISOString();
}

// The reverse: midnight or noon UTC is a date without a time; any other
// moment keeps its minute and gets second 1, Tasks.org's "has a time" mark.
export function tasksorgMillis(iso, { allDayAware = false } = {}) {
  if (!iso) return 0;
  const date = new Date(iso);
  const ms = date.getTime();
  if (Number.isNaN(ms) || ms <= 0) return 0;
  if (!allDayAware) return ms;
  const dayPart = ms % (24 * 3600000);
  if (dayPart === 0 || dayPart === 12 * 3600000) {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12);
  }
  return ms - (ms % MINUTE) + 1000;
}

export function parseTasksOrgBackup(input) {
  let doc = input;
  if (typeof doc === 'string') {
    try { doc = JSON.parse(doc); } catch (error) { throw new Error('Tasks.org backup is not JSON'); }
  }
  if (!isObject(doc) || !isObject(doc.data) || !Array.isArray(doc.data.tasks)) {
    throw new Error('Tasks.org backup needs data.tasks (Settings > Backups > Export tasks)');
  }
  const data = doc.data;
  const unsupported = [];
  const calendars = array(data.caldavCalendars).filter(isObject);
  const accounts = array(data.caldavAccounts).filter(isObject);
  // Lists in Tasks.org's own order; those without one keep the file's order.
  const ordered = calendars
    .map((calendar, index) => ({ calendar, index }))
    .sort((a, b) => {
      const ao = Number.isInteger(a.calendar.order) && a.calendar.order >= 0 ? a.calendar.order : Infinity;
      const bo = Number.isInteger(b.calendar.order) && b.calendar.order >= 0 ? b.calendar.order : Infinity;
      return ao === bo ? a.index - b.index : ao - bo;
    })
    .map(entry => entry.calendar);
  const listByUuid = new Map();
  const columns = [];
  const useTitle = (title) => {
    if (!columns.includes(title)) columns.push(title);
    return title;
  };
  ordered.forEach(calendar => {
    const uuid = text(calendar.uuid);
    if (!uuid || listByUuid.has(uuid)) return;
    listByUuid.set(uuid, useTitle(text(calendar.name).trim() || 'Untitled list'));
  });

  const tasks = [];
  const usedAccounts = new Set();
  data.tasks.forEach((backup, index) => {
    const at = `/data/tasks/${index}`;
    if (!isObject(backup) || !isObject(backup.task)) {
      unsupported.push({ path: at, reason: 'a Tasks.org backup entry without a task is not imported' });
      return;
    }
    const task = backup.task;
    const title = text(task.title).trim();
    const named = title ? `"${title}"` : 'an untitled task';
    if (positive(task.deletionDate)) {
      unsupported.push({ path: `${at}/task/deletionDate`, reason: `Tasks.org task ${named} is deleted and is not imported` });
      return;
    }
    const caldav = array(backup.caldavTasks).filter(row => isObject(row) && !positive(row.deleted))[0];
    let column = NO_LIST;
    if (caldav && text(caldav.calendar)) {
      const list = listByUuid.get(caldav.calendar);
      if (list) {
        column = list;
        const calendar = calendars.find(c => c.uuid === caldav.calendar);
        if (calendar && text(calendar.account)) usedAccounts.add(calendar.account);
      } else {
        unsupported.push({ path: `${at}/caldavTasks/0/calendar`, reason: `Tasks.org list "${caldav.calendar}" is not in the backup's caldavCalendars; the task is put in ${NO_LIST}` });
      }
    }
    useTitle(column);
    const customFields = {};
    const priority = task.priority === undefined ? PRIORITY_NONE : task.priority;
    if (TASKSORG_PRIORITY[priority]) customFields.Priority = TASKSORG_PRIORITY[priority];
    else if (priority !== PRIORITY_NONE) {
      unsupported.push({ path: `${at}/task/priority`, reason: `Tasks.org priority ${JSON.stringify(priority)} is not 0, 1, 2 or 3` });
    }
    if (positive(task.estimatedSeconds)) customFields[ESTIMATE_FIELD] = Math.round(task.estimatedSeconds / 36) / 100;
    if (text(task.recurrence)) {
      unsupported.push({ path: `${at}/task/recurrence`, reason: `Tasks.org repeat rule "${task.recurrence}" has no WeKan equivalent` });
    }
    const alarms = array(backup.alarms).length;
    if (alarms) unsupported.push({ path: `${at}/alarms`, reason: `${alarms} Tasks.org reminder(s) of ${named} are not imported` });
    const geofences = array(backup.geofences).length;
    if (geofences) unsupported.push({ path: `${at}/geofences`, reason: `${geofences} Tasks.org location reminder(s) of ${named} are not imported` });
    const attachments = array(backup.attachments).length;
    if (attachments) unsupported.push({ path: `${at}/attachments`, reason: `${attachments} Tasks.org attachment(s) of ${named}: the backup has no file contents` });
    if (positive(task.timerStart)) unsupported.push({ path: `${at}/task/timerStart`, reason: `the running Tasks.org timer of ${named} is not imported` });
    const comments = [];
    array(backup.comments).forEach((comment, c) => {
      if (!isObject(comment)) return;
      if (text(comment.picture)) unsupported.push({ path: `${at}/comments/${c}/picture`, reason: 'a Tasks.org comment picture is not in the backup' });
      if (!text(comment.message).trim()) return;
      comments.push({ text: comment.message, ...(positive(comment.created) ? { date: tasksorgDate(comment.created) } : {}) });
    });
    const tags = [...new Set(array(backup.tags).map(tag => (isObject(tag) ? text(tag.name).trim() : '')).filter(Boolean))];
    const ref = (caldav && text(caldav.remoteId)) || text(task.remoteId);
    const due = tasksorgDate(task.dueDate, { allDayAware: true });
    const start = tasksorgDate(task.hideUntil, { allDayAware: true });
    const ended = tasksorgDate(task.completionDate);
    const created = tasksorgDate(task.creationDate);
    tasks.push({
      title,
      description: text(task.notes),
      column_name: column,
      swimlane_name: 'Default',
      tags,
      ...(ref ? { ref } : {}),
      ...(caldav && text(caldav.remoteParent) ? { parent_ref: caldav.remoteParent } : {}),
      ...(due ? { date_due: due } : {}),
      ...(start ? { date_started: start } : {}),
      ...(ended ? { date_end: ended } : {}),
      ...(created ? { date_creation: created } : {}),
      ...(positive(task.elapsedSeconds) ? { spent_hours: Math.round(task.elapsedSeconds / 36) / 100 } : {}),
      ...(comments.length ? { comments } : {}),
      ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
    });
  });
  const account = usedAccounts.size === 1 ? accounts.find(a => a.uuid === [...usedAccounts][0]) : undefined;
  return {
    board: { name: (account && text(account.name).trim()) || 'Imported Tasks.org' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// Stable ids, so a second import of the same export into Tasks.org finds the
// tasks it already has and skips them instead of duplicating them.
const id = (kind, value) => `wekan-${kind}-${String(value || '').replace(/[^A-Za-z0-9_-]/g, '_')}`;

export function formatTasksOrgBackup({ board, lists, items }, now = new Date()) {
  const timestamp = now.getTime();
  const account = id('board', (board && board._id) || 'export');
  const calendars = [];
  const calendarByList = new Map();
  const calendarFor = (listId, title) => {
    const key = listId || `title:${title || NO_LIST}`;
    if (!calendarByList.has(key)) {
      const uuid = id('list', listId || title || 'none');
      calendarByList.set(key, uuid);
      calendars.push({ account, uuid, name: title || NO_LIST, order: calendars.length });
    }
    return calendarByList.get(key);
  };
  array(lists).forEach(list => list && calendarFor(list._id, list.title));
  const tagDefs = new Map();
  const tagFor = name => {
    if (!tagDefs.has(name)) tagDefs.set(name, { remoteId: id('tag', name), name });
    return tagDefs.get(name);
  };
  const all = array(items);
  const byCard = new Map(all.map(item => [item.cardId, item]));
  const tasks = [];
  const backupOf = ({ remoteId, calendar, parent, task, tags = [], comments = [] }) => {
    const caldavTask = { calendar, remoteId, object: `${remoteId}.ics`, ...(parent ? { remoteParent: parent } : {}) };
    return {
      task: { ...task, remoteId },
      ...(tags.length ? { tags: tags.map(name => ({ name, tagUid: tagFor(name).remoteId })) } : {}),
      ...(comments.length ? { comments } : {}),
      caldavTasks: [caldavTask],
    };
  };
  for (const item of all) {
    const remoteId = id('card', item.cardId || tasks.length);
    const calendar = calendarFor(item.listId, item.listTitle);
    const parentItem = item.parentCardId ? byCard.get(item.parentCardId) : undefined;
    const parent = parentItem && calendarFor(parentItem.listId, parentItem.listTitle) === calendar
      ? id('card', parentItem.cardId) : undefined;
    const fields = item.customFields || {};
    const priority = TASKSORG_PRIORITY.indexOf(fields.Priority);
    const estimate = Number(fields[ESTIMATE_FIELD]);
    const created = tasksorgMillis(item.createdAt) || timestamp;
    const task = {
      title: String(item.title || '').trim() || 'Untitled',
      ...(priority >= 0 ? { priority } : {}),
      ...(tasksorgMillis(item.dueAt, { allDayAware: true }) ? { dueDate: tasksorgMillis(item.dueAt, { allDayAware: true }) } : {}),
      ...(tasksorgMillis(item.startAt, { allDayAware: true }) ? { hideUntil: tasksorgMillis(item.startAt, { allDayAware: true }) } : {}),
      creationDate: created,
      modificationDate: timestamp,
      ...(tasksorgMillis(item.endAt) ? { completionDate: tasksorgMillis(item.endAt) } : {}),
      ...(item.description ? { notes: item.description } : {}),
      ...(Number.isFinite(estimate) && estimate > 0 ? { estimatedSeconds: Math.round(estimate * 3600) } : {}),
      // Time spent goes back as Tasks.org keeps it, so it survives the round trip.
      ...(Number(item.spentTime) > 0 ? { elapsedSeconds: Math.round(Number(item.spentTime) * 3600) } : {}),
    };
    const comments = array(item.comments)
      .filter(comment => comment && String(comment.text || '').trim())
      .map((comment, index) => ({
        remoteId: id('comment', `${item.cardId}-${index}`),
        message: String(comment.text),
        created: tasksorgMillis(comment.date) || timestamp,
      }));
    const tags = [...new Set(array(item.labels).map(name => String(name).trim()).filter(Boolean))];
    tasks.push(backupOf({ remoteId, calendar, parent, task, tags, comments }));
    // Checklist items: subtasks of the card, in its list.
    array(item.checklists).forEach((checklist, c) => {
      array(checklist && checklist.items).forEach((entry, e) => {
        const title = String((entry && entry.title) || '').trim();
        if (!title) return;
        tasks.push(backupOf({
          remoteId: id('item', `${item.cardId}-${c}-${e}`),
          calendar,
          parent: remoteId,
          task: { title, creationDate: created, modificationDate: timestamp,
            ...(entry.done ? { completionDate: tasksorgMillis(item.endAt) || timestamp } : {}) },
        }));
      });
    });
  }
  return {
    version: TASKSORG_BACKUP_VERSION,
    timestamp,
    data: {
      tasks,
      places: [],
      tags: [...tagDefs.values()],
      filters: [],
      caldavAccounts: [{ uuid: account, name: (board && board.title) || 'WeKan board', accountType: LOCAL_ACCOUNT }],
      caldavCalendars: calendars,
      taskListMetadata: [],
      taskAttachments: [],
      intPrefs: {},
      longPrefs: {},
      stringPrefs: {},
      boolPrefs: {},
      setPrefs: {},
    },
  };
}
