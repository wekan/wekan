// Super Productivity backup (sp-backup_*.json), read and written in plain
// JavaScript so tests/superProductivityFormat.test.cjs runs the round trip in
// Node.
//
// Settings > Sync & Backup > Import/Export > "Export Data" writes
//   { timestamp, lastUpdate, crossModelVersion, data }
// where `data` holds one slice per model (project, task, tag, note, boards,
// archiveYoung, archiveOld, globalConfig, ...). Entity slices are NgRx entity
// states: { ids: [...], entities: { id: object } }. "Import from File" reads
// the same file back and REPLACES all Super Productivity data with it.
//
// Super Productivity has no columns. Its Kanban boards are saved filters
// (panels select tasks by done state, tags, project and backlog), not
// containers, so a task's place on a WeKan board is decided the way its
// default Kanban board decides it:
//   done                                -> list Done
//   undone, tag KANBAN_IN_PROGRESS      -> list In Progress
//   undone, in the project's backlog    -> list Backlog
//   any other task                      -> list To Do
// and the rest maps as:
//   project                             -> a swimlane (every project of the
//                                          backup, so none is dropped; the
//                                          board takes the title of the only
//                                          project when there is one)
//   task / sub-task (parentId)          -> card / sub-task card (parent_ref)
//   tags (not Today, not in-progress)   -> labels
//   notes + http(s) link attachments    -> description
//   dueWithTime / dueDay                -> due date (start date when a
//                                          deadline is the due date)
//   deadlineWithTime / deadlineDay      -> due date
//   isDone + doneOn                     -> end date
//   created                             -> created date
//   timeSpent (ms)                      -> spent hours
//   timeEstimate (ms)                   -> custom field Time estimate (hours)
//   priority 1/2/3 (or low/medium/high) -> custom field Priority
//   archiveYoung / archiveOld tasks     -> archived cards
//   id                                  -> the card's source reference
// Reported, not imported: repeat configurations, reminders, issue-provider
// links, project notes, file/command/note attachments, the per-day time
// breakdown and the saved Kanban boards.
//
// Export writes a backup "Import from File" accepts: the slices it requires
// (project and task) plus tag, note, boards, archiveYoung and archiveOld; the
// app fills every slice a backup leaves out (globalConfig, planner, ...) with
// its default. Swimlanes become projects (one project named after the board
// when there is one swimlane), lists become a board of the same name with one
// panel per list, and a list other than To Do, In Progress, Backlog and Done
// becomes a tag its panel filters on.

import { markdownLink } from './markdownLink.js';

export const SP_CROSS_MODEL_VERSION = 4.5;
export const SP_IN_PROGRESS_TAG_ID = 'KANBAN_IN_PROGRESS';
export const SP_TODAY_TAG_ID = 'TODAY';
export const SP_ESTIMATE_FIELD = 'Time estimate (hours)';
export const SP_PRIORITY_FIELD = 'Priority';
const LIST = { backlog: 'Backlog', todo: 'To Do', progress: 'In Progress', done: 'Done' };
const NO_PROJECT = 'No project';
const HOUR = 3600000;
const PRIORITY_NAMES = { 1: 'Low', 2: 'Medium', 3: 'High', low: 'Low', medium: 'Medium', high: 'High' };

const hasOwn = (object, key) => object !== null && typeof object === 'object' && Object.prototype.hasOwnProperty.call(object, key);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

// The entities of an NgRx entity state, in `ids` order; entities missing from
// `ids` follow. Lookups go through hasOwnProperty, so an id such as
// "__proto__" is never read from the prototype.
function entitiesOf(state) {
  if (!isObject(state) || !isObject(state.entities)) return [];
  const all = state.entities;
  const ids = (Array.isArray(state.ids) ? state.ids : []).concat(Object.keys(all));
  const seen = new Set();
  const out = [];
  for (const raw of ids) {
    if (typeof raw !== 'string' && typeof raw !== 'number') continue;
    const id = String(raw);
    if (seen.has(id) || !hasOwn(all, id) || !isObject(all[id])) continue;
    seen.add(id);
    out.push(all[id]);
  }
  return out;
}

// Milliseconds since the epoch, as ISO.
function msDate(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// A "YYYY-MM-DD" day, as midnight UTC.
function dayDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value).trim());
  if (!match) return undefined;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return date.getUTCMonth() === +match[2] - 1 && date.getUTCDate() === +match[3] ? date.toISOString() : undefined;
}

const hours = ms => Math.round((ms / HOUR) * 100) / 100;

export function parseSuperProductivity(input) {
  let doc = input;
  if (typeof input === 'string') {
    try {
      doc = JSON.parse(input.replace(/^﻿/, ''));
    } catch (error) {
      throw new Error('Super Productivity backup is not valid JSON');
    }
  }
  if (!isObject(doc)) throw new Error('Super Productivity backup must be a JSON object');
  // The importer takes the wrapper when it carries all three keys, and the
  // bare data object otherwise (BackupService.importCompleteBackup).
  const data = hasOwn(doc, 'crossModelVersion') && hasOwn(doc, 'timestamp') && hasOwn(doc, 'data') ? doc.data : doc;
  if (!isObject(data)) throw new Error('Super Productivity backup has no data object');
  if (hasOwn(data, 'taskArchive') || hasOwn(data, 'improvement') || hasOwn(data, 'obstruction')) {
    throw new Error('this is a Super Productivity backup from before version 14; import it into Super Productivity and export it again');
  }
  if (!isObject(data.task) || !isObject(data.project)) {
    throw new Error('Super Productivity backup needs the task and project models');
  }

  const unsupported = [];
  const report = (path, reason) => unsupported.push({ path, reason });

  const projects = entitiesOf(data.project);
  const projectById = new Map(projects.map(project => [String(project.id), project]));
  const backlogIds = new Set();
  projects.forEach(project => (Array.isArray(project.backlogTaskIds) ? project.backlogTaskIds : [])
    .forEach(id => backlogIds.add(String(id))));
  const tagTitle = new Map(entitiesOf(data.tag).map(tag => [String(tag.id), text(tag.title).trim()]));

  // Active tasks first, then the two archives.
  const sources = [
    { path: '/data/task', state: data.task, archived: false },
    { path: '/data/archiveYoung/task', state: isObject(data.archiveYoung) ? data.archiveYoung.task : null, archived: true },
    { path: '/data/archiveOld/task', state: isObject(data.archiveOld) ? data.archiveOld.task : null, archived: true },
  ];
  const all = [];
  const seenIds = new Set();
  for (const source of sources) {
    for (const task of entitiesOf(source.state)) {
      const id = text(task.id);
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      all.push({ task, id, path: `${source.path}/${id}`, archived: source.archived });
    }
  }
  const byId = new Map(all.map(entry => [entry.id, entry]));

  // Project titles as swimlane names; two projects of the same title stay
  // apart.
  const swimlaneOf = new Map();
  const swimlaneNames = [];
  const nameFor = projectId => {
    const key = projectById.has(projectId) ? projectId : '';
    if (swimlaneOf.has(key)) return swimlaneOf.get(key);
    const base = key ? text(projectById.get(key).title).trim() || 'Untitled project' : NO_PROJECT;
    let name = base;
    for (let n = 2; swimlaneNames.includes(name); n += 1) name = `${base} (${n})`;
    swimlaneOf.set(key, name);
    swimlaneNames.push(name);
    return name;
  };
  // Swimlanes follow the project order of the backup.
  const usedProjects = new Set(all.map(entry => text(entry.task.projectId)
    || text(byId.get(text(entry.task.parentId))?.task.projectId)));
  projects.forEach(project => { if (usedProjects.has(String(project.id))) nameFor(String(project.id)); });

  let breakdown = false;
  const used = new Set();
  const tasks = all.map(({ task, id, path, archived }) => {
    const parent = byId.get(text(task.parentId));
    const projectId = text(task.projectId) || text(parent?.task.projectId);
    const tagIds = (Array.isArray(task.tagIds) ? task.tagIds : []).map(String);
    const done = task.isDone === true || archived;
    let list = LIST.todo;
    if (done) list = LIST.done;
    else if (tagIds.includes(SP_IN_PROGRESS_TAG_ID)) list = LIST.progress;
    else if (backlogIds.has(id) || (parent && backlogIds.has(parent.id))) list = LIST.backlog;
    used.add(list);

    const tags = [];
    tagIds.forEach(tagId => {
      if (tagId === SP_TODAY_TAG_ID || tagId === SP_IN_PROGRESS_TAG_ID) return;
      const title = tagTitle.get(tagId);
      if (title) { if (!tags.includes(title)) tags.push(title); }
      else report(`${path}/tagIds`, `tag "${tagId}" is not in the backup's tag model`);
    });

    // Notes, then the attachments that are web links.
    let description = text(task.notes);
    const links = [];
    (Array.isArray(task.attachments) ? task.attachments : []).forEach((attachment, index) => {
      const target = text(attachment && attachment.path).trim();
      if (/^https?:\/\//i.test(target)) {
        const title = text(attachment.title).trim() || target;
        links.push(`- ${markdownLink(title, target)}`);
      } else {
        report(`${path}/attachments/${index}`, `a ${text(attachment && attachment.type) || 'local'} attachment is a path on the user's device, not a web link, and is not imported`);
      }
    });
    if (links.length) description = `${description ? `${description}\n\n` : ''}${links.join('\n')}`;

    const deadline = msDate(task.deadlineWithTime) || dayDate(task.deadlineDay);
    const scheduled = msDate(task.dueWithTime) || dayDate(task.dueDay);
    const due = deadline || scheduled;
    const started = deadline && scheduled ? scheduled : undefined;
    const ended = done ? msDate(task.doneOn) : undefined;
    const created = msDate(task.created);

    const customFields = {};
    const estimate = Number(task.timeEstimate);
    if (Number.isFinite(estimate) && estimate > 0) customFields[SP_ESTIMATE_FIELD] = hours(estimate);
    const priority = PRIORITY_NAMES[text(task.priority).toLowerCase()];
    if (priority) customFields[SP_PRIORITY_FIELD] = priority;
    const spent = Number(task.timeSpent);
    if (isObject(task.timeSpentOnDay) && Object.keys(task.timeSpentOnDay).length) breakdown = true;

    if (text(task.repeatCfgId)) report(`${path}/repeatCfgId`, 'Super Productivity repeat configurations are not imported; the task imports once');
    if (msDate(task.remindAt) || msDate(task.deadlineRemindAt)) report(`${path}/remindAt`, 'Super Productivity reminders are not imported');
    if (text(task.issueId) || text(task.issueType)) report(`${path}/issueId`, `the link to ${text(task.issueType) || 'an issue provider'} issue ${text(task.issueId)} is not imported`.replace(/ $/, ''));

    return {
      title: text(task.title).trim() || 'Untitled',
      description,
      column_name: list,
      swimlane_name: nameFor(projectId),
      tags,
      ref: id,
      ...(parent ? { parent_ref: parent.id } : text(task.parentId) ? { parent_ref: text(task.parentId) } : {}),
      ...(due ? { date_due: due } : {}),
      ...(started ? { date_started: started } : {}),
      ...(ended ? { date_end: ended } : {}),
      ...(created ? { date_creation: created } : {}),
      ...(Number.isFinite(spent) && spent > 0 ? { spent_hours: hours(spent) } : {}),
      ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
      ...(archived ? { archived: true } : {}),
    };
  });

  if (breakdown) report('/data/task/timeSpentOnDay', 'the per-day breakdown of tracked time is not imported; each card keeps the total as spent hours');
  const notes = entitiesOf(data.note).length;
  if (notes) report('/data/note', `${notes} Super Productivity note(s) belong to projects, not tasks, and are not imported`);
  if (isObject(data.boards) && Array.isArray(data.boards.boardCfgs) && data.boards.boardCfgs.length) {
    report('/data/boards', 'Super Productivity boards are saved filters, not containers; lists come from each task\'s done state, in-progress tag and backlog instead');
  }

  const columns = [LIST.backlog, LIST.todo, LIST.progress, LIST.done]
    .filter(title => used.has(title) || title === LIST.todo || title === LIST.done);
  const swimlanes = swimlaneNames.length ? swimlaneNames : [NO_PROJECT];
  return {
    board: { name: swimlaneNames.length === 1 && swimlaneNames[0] !== NO_PROJECT ? swimlaneNames[0] : 'Super Productivity' },
    columns: columns.map(title => ({ title })),
    swimlanes: swimlanes.map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// --- Export -------------------------------------------------------------------

// The defaults Super Productivity itself gives a project or tag
// (WORK_CONTEXT_DEFAULT_COMMON, WORKLOG_EXPORT_DEFAULTS): the import
// validates both objects as required.
const ADVANCED_CFG = () => ({
  worklogExportSettings: {
    cols: ['DATE', 'START', 'END', 'TIME_CLOCK', 'TITLES_INCLUDING_SUB'],
    roundWorkTimeTo: null,
    roundStartTimeTo: null,
    roundEndTimeTo: null,
    separateTasksBy: ' | ',
    groupBy: 'DATE',
  },
});
const THEME = primary => ({
  isAutoContrast: true,
  isDisableBackgroundTint: false,
  primary,
  huePrimary: '500',
  accent: '#ff4081',
  hueAccent: '500',
  warn: '#e11826',
  hueWarn: '500',
  backgroundImageDark: null,
  backgroundImageLight: null,
  backgroundOverlayOpacity: 20,
  backgroundImageBlur: 0,
});
const emptyArchive = () => ({ task: { ids: [], entities: {} }, timeTracking: { project: {}, tag: {} }, lastTimeTrackingFlush: 0 });

const msOf = value => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : undefined;
};
const dayOf = ms => new Date(ms).toISOString().slice(0, 10);
const listKind = title => {
  const name = String(title || '').trim().toLowerCase();
  if (name === 'done') return 'done';
  if (name === 'in progress') return 'progress';
  if (name === 'backlog') return 'backlog';
  if (name === 'to do' || name === 'todo') return 'todo';
  return 'other';
};
const PRIORITY_VALUES = { low: 1, medium: 2, high: 3, 1: 1, 2: 2, 3: 3 };

function checklistMarkdown(checklists) {
  return (Array.isArray(checklists) ? checklists : [])
    .filter(checklist => checklist && Array.isArray(checklist.items) && checklist.items.length)
    .map(checklist => [`### ${String(checklist.title || 'Checklist').trim()}`,
      ...checklist.items.map(item => `- [${item.done ? 'x' : ' '}] ${String(item.title || '').trim()}`)].join('\n'))
    .join('\n\n');
}

export function formatSuperProductivity({ board, lists, swimlanes, items } = {}, { now = Date.now() } = {}) {
  const boardTitle = String((board && board.title) || '').trim() || 'WeKan board';
  const cards = (Array.isArray(items) ? items : []).filter(Boolean);

  // Projects: one per swimlane in use, or one named after the board.
  const laneOrder = (Array.isArray(swimlanes) ? swimlanes : []).map(lane => String(lane.title || ''));
  cards.forEach(item => { const lane = String(item.swimlaneTitle || 'Default'); if (!laneOrder.includes(lane)) laneOrder.push(lane); });
  const lanesUsed = laneOrder.filter(lane => cards.some(item => String(item.swimlaneTitle || 'Default') === lane));
  const single = lanesUsed.length <= 1;
  const projectIds = new Map();
  const projectState = { ids: [], entities: {} };
  (single ? [boardTitle] : lanesUsed).forEach((title, index) => {
    const id = `wekan-project-${index + 1}`;
    projectIds.set(single ? '' : title, id);
    projectState.ids.push(id);
    projectState.entities[id] = {
      id, title, isHiddenFromMenu: false, isArchived: false, isEnableBacklog: false,
      taskIds: [], backlogTaskIds: [], noteIds: [], icon: null,
      theme: THEME('#29a1aa'), advancedCfg: ADVANCED_CFG(), created: now,
    };
  });
  const projectFor = item => projectIds.get(single ? '' : String(item.swimlaneTitle || 'Default'));

  // Tags: card labels, then one per list that has no state of its own.
  const tagState = { ids: [SP_TODAY_TAG_ID], entities: {} };
  const tag = (id, title, primary, icon = null) => ({ id, title, color: null, created: now, taskIds: [], icon, theme: THEME(primary), advancedCfg: ADVANCED_CFG() });
  tagState.entities[SP_TODAY_TAG_ID] = tag(SP_TODAY_TAG_ID, 'Today', '#6495ED', 'wb_sunny');
  const tagIdByTitle = new Map();
  const tagFor = title => {
    const name = String(title || '').trim();
    if (!name) return undefined;
    if (!tagIdByTitle.has(name)) {
      const id = `wekan-tag-${tagIdByTitle.size + 1}`;
      tagIdByTitle.set(name, id);
      tagState.ids.push(id);
      tagState.entities[id] = tag(id, name, '#a05db1');
    }
    return tagIdByTitle.get(name);
  };
  const inProgressTag = () => {
    if (!tagState.entities[SP_IN_PROGRESS_TAG_ID]) {
      tagState.ids.push(SP_IN_PROGRESS_TAG_ID);
      tagState.entities[SP_IN_PROGRESS_TAG_ID] = tag(SP_IN_PROGRESS_TAG_ID, 'in-progress', '#ffa726');
    }
    return SP_IN_PROGRESS_TAG_ID;
  };

  // Task ids: the card ids, kept unique.
  const taskIdOf = new Map();
  cards.forEach((item, index) => {
    let id = String(item.cardId || `wekan-task-${index + 1}`);
    while ([...taskIdOf.values()].includes(id)) id = `${id}-${index + 1}`;
    taskIdOf.set(item, id);
  });
  const itemByCardId = new Map(cards.filter(item => item.cardId).map(item => [String(item.cardId), item]));
  // Super Productivity nests one level: a sub-task of a sub-task hangs under
  // the top-level ancestor.
  const rootOf = item => {
    const seen = new Set([item]);
    let parent = itemByCardId.get(String(item.parentCardId || ''));
    let root;
    while (parent && !seen.has(parent)) {
      root = parent;
      seen.add(parent);
      parent = itemByCardId.get(String(parent.parentCardId || ''));
    }
    return parent ? undefined : root; // a cycle has no root
  };

  const taskState = { ids: [], entities: {}, currentTaskId: null, selectedTaskId: null, lastCurrentTaskId: null, isDataLoaded: false };
  const listTitles = [];
  (Array.isArray(lists) ? lists.map(list => list.title) : []).concat(cards.map(item => item.listTitle))
    .forEach(title => { const name = String(title || ''); if (!listTitles.includes(name)) listTitles.push(name); });
  const panelTasks = new Map(listTitles.map(title => [title, []]));
  let backlogUsed = false;

  cards.forEach(item => {
    const id = taskIdOf.get(item);
    const root = rootOf(item);
    const projectId = projectFor(root || item);
    const kind = listKind(item.listTitle);
    const ended = msOf(item.endAt);
    const isDone = kind === 'done' || ended !== undefined;
    const tagIds = (Array.isArray(item.labels) ? item.labels : []).map(tagFor).filter(Boolean);
    if (kind === 'progress' && !isDone) tagIds.push(inProgressTag());
    if (kind === 'other') tagIds.push(tagFor(item.listTitle));
    const notes = [String(item.description || '').trim(), checklistMarkdown(item.checklists)].filter(Boolean).join('\n\n');
    const created = msOf(item.createdAt) || now;
    const spent = Number(item.spentTime);
    const fields = item.customFields || {};
    const estimate = Number(fields[SP_ESTIMATE_FIELD]);
    const priority = PRIORITY_VALUES[String(fields[SP_PRIORITY_FIELD] || '').trim().toLowerCase()];
    const due = msOf(item.dueAt);
    const timeSpent = Number.isFinite(spent) && spent > 0 ? Math.round(spent * HOUR) : 0;
    const task = {
      id,
      title: String(item.title || '').trim() || 'Untitled',
      subTaskIds: [],
      // Super Productivity recomputes timeSpent from the per-day map, so the
      // total is booked on the day the card ended (or was created).
      timeSpentOnDay: timeSpent ? { [dayOf(ended || created)]: timeSpent } : {},
      timeSpent,
      timeEstimate: Number.isFinite(estimate) && estimate > 0 ? Math.round(estimate * HOUR) : 0,
      isDone,
      notes,
      tagIds: [...new Set(tagIds)],
      created,
      attachments: [],
      projectId,
      ...(root ? { parentId: taskIdOf.get(root) } : {}),
      ...(isDone ? { doneOn: ended || now } : {}),
      ...(due === undefined ? {} : new Date(due).toISOString().endsWith('T00:00:00.000Z')
        ? { dueDay: dayOf(due) } : { dueWithTime: due }),
      ...(priority ? { priority } : {}),
    };
    taskState.ids.push(id);
    taskState.entities[id] = task;
    task.tagIds.forEach(tagId => tagState.entities[tagId].taskIds.push(id));
    panelTasks.get(String(item.listTitle || '')).push(id);
    // A sub-task is listed in its parent's subTaskIds below, not in the project.
    if (root) return;
    if (kind === 'backlog' && !isDone) {
      projectState.entities[projectId].backlogTaskIds.push(id);
      projectState.entities[projectId].isEnableBacklog = true;
      backlogUsed = true;
    } else {
      projectState.entities[projectId].taskIds.push(id);
    }
  });
  // Sub-task lists, once every task exists.
  cards.forEach(item => {
    const root = rootOf(item);
    if (root) taskState.entities[taskIdOf.get(root)].subTaskIds.push(taskIdOf.get(item));
  });

  // One board, one panel per list, filtering the way the list decides.
  const otherTags = listTitles.filter(title => listKind(title) === 'other').map(tagFor);
  const panel = (title, index, filter) => ({
    id: `wekan-panel-${index + 1}`, title: title || 'Untitled', taskIds: panelTasks.get(title) || [],
    includedTagIds: [], excludedTagIds: [], projectIds: [''],
    taskDoneState: 3, scheduledState: 1, backlogState: 2, isParentTasksOnly: false, ...filter,
  });
  const panels = listTitles.map((title, index) => {
    switch (listKind(title)) {
      case 'done': return panel(title, index, { taskDoneState: 2, backlogState: 1 });
      case 'progress': return panel(title, index, { includedTagIds: [inProgressTag()] });
      case 'backlog': return panel(title, index, { backlogState: 3 });
      case 'todo': return panel(title, index, {
        excludedTagIds: [...(tagState.entities[SP_IN_PROGRESS_TAG_ID] ? [SP_IN_PROGRESS_TAG_ID] : []), ...otherTags],
        backlogState: backlogUsed ? 2 : 1,
      });
      default: return panel(title, index, { includedTagIds: [tagFor(title)] });
    }
  });

  const backup = {
    timestamp: now,
    lastUpdate: now,
    crossModelVersion: SP_CROSS_MODEL_VERSION,
    data: {
      project: projectState,
      task: taskState,
      tag: tagState,
      note: { ids: [], entities: {}, todayOrder: [] },
      boards: { boardCfgs: panels.length ? [{ id: 'wekan-board', title: boardTitle, cols: Math.min(panels.length, 4), panels }] : [] },
      archiveYoung: emptyArchive(),
      archiveOld: emptyArchive(),
    },
  };
  return JSON.stringify(backup);
}
