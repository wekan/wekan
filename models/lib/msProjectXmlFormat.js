// Microsoft Project's XML (MSPDI, the schema at
// http://schemas.microsoft.com/project): what Project desktop writes with
// File > Save As > "XML Format (*.xml)", opens with File > Open, and what
// ProjectLibre, GanttProject and MPXJ read and write too. Plain JavaScript
// without dependencies, so tests/msProjectXml.test.cjs runs the round trip
// in Node; the .mpp file itself is a closed binary format and is not read.
//
// <Project> holds Name and Title, <Tasks> (a <Task> per row of the Gantt
// chart: UID, ID, Name, OutlineLevel, OutlineNumber, Summary, Milestone,
// Start, Finish, ActualFinish, CreateDate, Duration as PT8H0M0S,
// PercentComplete, Priority 0-1000 (500 is normal), Notes and
// <PredecessorLink> with PredecessorUID, Type 0 FF, 1 FS, 2 SF, 3 SS and
// LinkLag in tenths of a minute), <Resources> (UID, Name, EmailAddress) and
// <Assignments> (TaskUID, ResourceUID). Task UID 0 at OutlineLevel 0 is the
// project's own summary row.
//
// A task maps to:
//   a summary task at outline level 1  -> a swimlane, its tasks in it
//   every other task                   -> a card; the task above it one level
//                                         up is its parent card
//   PercentComplete 0 / 1-99 / 100     -> the list Not started / In progress /
//                                         Completed
//   Start, Finish, ActualFinish,
//   CreateDate                         -> start, due, end and created dates
//   Notes                              -> description
//   Milestone                          -> the label Milestone
//   assigned resources                 -> owner and assignees (by name)
//   predecessors                       -> dependencies: the card is blocked
//                                         by its predecessor
//   UID                                -> the card's reference
//   Priority (not 500), Duration,
//   PercentComplete, WBS               -> custom fields
// Calendars, baselines, extended attributes, link types other than
// finish-to-start and link lags have no WeKan place and are reported.

import { pagingOf } from './exportPaging.js';

export const MAX_MS_PROJECT_LENGTH = 64 * 1024 * 1024;
export const MAX_MS_PROJECT_TASKS = 100000;
export const MS_PROJECT_LISTS = ['Not started', 'In progress', 'Completed'];
const MAX_DEPTH = 64;

// ----------------------------------------------------------------- reading ---

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = text => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
  if (code[0] === '#') {
    const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
  }
  return ENTITIES[code.toLowerCase()] ?? whole;
});

// A small XML reader: elements, text and CDATA. Comments, processing
// instructions and a DOCTYPE are skipped - a DTD's entities are never
// resolved, so nothing in the file can make it read another file. Namespace
// prefixes are dropped from element names.
export function readXml(source) {
  const root = { name: '#root', children: [], text: '' };
  const stack = [root];
  let i = 0;
  const text = String(source);
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    const chunk = lt < 0 ? text.slice(i) : text.slice(i, lt);
    if (chunk) stack[stack.length - 1].text += decode(chunk);
    if (lt < 0) break;
    if (text.startsWith('<!--', lt)) { const end = text.indexOf('-->', lt + 4); i = end < 0 ? text.length : end + 3; continue; }
    if (text.startsWith('<![CDATA[', lt)) {
      const end = text.indexOf(']]>', lt + 9);
      stack[stack.length - 1].text += text.slice(lt + 9, end < 0 ? text.length : end);
      i = end < 0 ? text.length : end + 3;
      continue;
    }
    if (text.startsWith('<?', lt)) { const end = text.indexOf('?>', lt + 2); i = end < 0 ? text.length : end + 2; continue; }
    if (text.startsWith('<!', lt)) {
      // <!DOCTYPE ...> with an internal subset in [...] - skipped whole.
      let depth = 0;
      let j = lt + 2;
      for (; j < text.length; j += 1) {
        if (text[j] === '[') depth += 1;
        else if (text[j] === ']') depth -= 1;
        else if (text[j] === '>' && depth <= 0) break;
      }
      i = j + 1;
      continue;
    }
    const gt = text.indexOf('>', lt);
    if (gt < 0) throw new Error('The XML ends inside a tag');
    const tag = text.slice(lt + 1, gt);
    i = gt + 1;
    if (tag[0] === '/') {
      const name = tag.slice(1).trim().replace(/^[^:]*:/, '');
      if (stack.length > 1 && stack[stack.length - 1].name === name) stack.pop();
      else throw new Error(`The XML closes <${name}> that is not open`);
      continue;
    }
    const selfClosing = tag.endsWith('/');
    const name = (/^[^\s/>]+/.exec(tag) || [''])[0].replace(/^[^:]*:/, '');
    const node = { name, children: [], text: '' };
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) {
      if (stack.length > MAX_DEPTH) throw new Error('The XML nests too deep');
      stack.push(node);
    }
  }
  if (stack.length > 1) throw new Error(`The XML ends before <${stack[stack.length - 1].name}> is closed`);
  return root;
}

const kids = (node, name) => (node ? node.children.filter(child => child.name === name) : []);
const kid = (node, name) => kids(node, name)[0];
const value = (node, name) => { const k = kid(node, name); return k ? k.text.trim() : ''; };

// "PT8H30M0S" -> hours; Project writes durations of work time this way.
export function projectHours(duration) {
  const match = /^-?P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(String(duration || '').trim());
  if (!match) return undefined;
  const [, d, h, m, s] = match.map(x => Number(x || 0));
  return d * 8 + h + m / 60 + s / 3600;
}

// Project writes local times without a zone ("2026-11-23T08:00:00"); they
// are read as UTC, as Project shows them.
const projectDate = text => {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const date = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(raw) ? raw : `${raw}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export function listForPercent(percent) {
  const n = Number(percent) || 0;
  return n >= 100 ? MS_PROJECT_LISTS[2] : n > 0 ? MS_PROJECT_LISTS[1] : MS_PROJECT_LISTS[0];
}

export function parseMsProjectXml(input) {
  const source = String(input == null ? '' : input).replace(/^﻿/, '');
  if (source.length > MAX_MS_PROJECT_LENGTH) throw new Error('Microsoft Project XML is too large');
  const doc = readXml(source);
  const project = kid(doc, 'Project');
  if (!project) throw new Error('Not a Microsoft Project XML file: no <Project>');
  const taskNodes = kids(kid(project, 'Tasks'), 'Task');
  if (taskNodes.length > MAX_MS_PROJECT_TASKS) throw new Error(`Microsoft Project XML has more than ${MAX_MS_PROJECT_TASKS} tasks`);
  const unsupported = [];
  for (const [name, label] of [['Calendars', 'calendars'], ['ExtendedAttributes', 'extended attributes']]) {
    const count = kid(project, name) ? kid(project, name).children.length : 0;
    if (count) unsupported.push({ path: `/${name}`, reason: `${count} Microsoft Project ${label} are not imported` });
  }
  const resources = new Map(kids(kid(project, 'Resources'), 'Resource')
    .map(r => [value(r, 'UID'), value(r, 'Name') || value(r, 'EmailAddress')]).filter(([uid, name]) => uid && name));
  const assigned = new Map();
  for (const a of kids(kid(project, 'Assignments'), 'Assignment')) {
    const name = resources.get(value(a, 'ResourceUID'));
    if (!name) continue;
    const task = value(a, 'TaskUID');
    if (!assigned.has(task)) assigned.set(task, []);
    if (!assigned.get(task).includes(name)) assigned.get(task).push(name);
  }

  const swimlanes = [];
  const tasks = [];
  const above = []; // the ref of the last card at each outline level
  let swimlane = 'Default';
  let baselines = 0;
  taskNodes.forEach((node, n) => {
    const at = `/Tasks/${n}`;
    const level = Number(value(node, 'OutlineLevel') || 1);
    const uid = value(node, 'UID');
    if (level <= 0 || value(node, 'IsNull') === '1') return;
    const name = value(node, 'Name');
    const summary = value(node, 'Summary') === '1';
    baselines += kids(node, 'Baseline').length;
    if (level === 1 && summary) {
      swimlane = name || `Summary ${uid}`;
      if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
      above.length = 0;
      return;
    }
    if (level === 1) swimlane = 'Default';
    if (!name) { unsupported.push({ path: at, reason: 'a Microsoft Project task without a name is not imported' }); return; }
    if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
    const ref = uid || `row-${n + 1}`;
    let parent = '';
    for (let l = level - 1; l >= 1 && !parent; l -= 1) parent = above[l] || '';
    above[level] = ref;
    above.length = level + 1;
    const date = field => {
      const iso = projectDate(value(node, field));
      if (iso === undefined) unsupported.push({ path: `${at}/${field}`, reason: `Microsoft Project ${field} "${value(node, field)}" is not a date` });
      return iso || '';
    };
    const percent = Number(value(node, 'PercentComplete') || 0);
    const fields = {};
    const priority = value(node, 'Priority');
    if (priority && priority !== '500') fields.Priority = Number(priority);
    const hours = projectHours(value(node, 'Duration'));
    if (hours !== undefined && hours > 0) fields['Duration (hours)'] = Math.round(hours * 100) / 100;
    if (percent) fields['% Complete'] = percent;
    if (value(node, 'WBS')) fields.WBS = value(node, 'WBS');
    const dependencies = [];
    for (const link of kids(node, 'PredecessorLink')) {
      const pred = value(link, 'PredecessorUID');
      if (!pred) continue;
      const type = value(link, 'Type') || '1';
      if (type !== '1') unsupported.push({ path: `${at}/PredecessorLink`, reason: `a Microsoft Project link of type ${({ 0: 'finish-to-finish', 2: 'start-to-finish', 3: 'start-to-start' })[type] || type} is imported as blocked-by` });
      if (Number(value(link, 'LinkLag') || 0)) unsupported.push({ path: `${at}/PredecessorLink`, reason: 'the lag of a Microsoft Project link is not imported' });
      dependencies.push({ ref: pred, type: 'is-blocked-by' });
    }
    const people = assigned.get(uid) || [];
    tasks.push({
      title: name,
      description: value(node, 'Notes'),
      column_name: listForPercent(percent),
      swimlane_name: swimlane,
      tags: value(node, 'Milestone') === '1' ? ['Milestone'] : [],
      ref,
      ...(parent ? { parent_ref: parent } : {}),
      ...(people.length ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
      ...(date('CreateDate') ? { date_creation: date('CreateDate') } : {}),
      ...(date('Start') ? { date_started: date('Start') } : {}),
      ...(date('Finish') ? { date_due: date('Finish') } : {}),
      ...(date('ActualFinish') ? { date_end: date('ActualFinish') } : {}),
      ...(percent >= 100 && date('Finish') ? { due_complete: true } : {}),
      ...(dependencies.length ? { dependencies } : {}),
      ...(Object.keys(fields).length ? { custom_fields: fields } : {}),
    });
  });
  if (baselines) unsupported.push({ path: '/Tasks/Baseline', reason: `${baselines} Microsoft Project baseline(s) are not imported` });
  if (!tasks.length) throw new Error('Microsoft Project XML has no tasks');
  const title = value(project, 'Title') || value(project, 'Name').replace(/\.(xml|mpp)$/i, '');
  return {
    board: { name: title || 'Imported Microsoft Project plan' },
    columns: MS_PROJECT_LISTS.filter(list => tasks.some(task => task.column_name === list)).map(t => ({ title: t })),
    swimlanes: swimlanes.map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// ----------------------------------------------------------------- writing ---

const esc = text => String(text == null ? '' : text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // XML 1.0 has no place for the other control characters.
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const el = (name, text) => `<${name}>${esc(text)}</${name}>`;
const isDone = listTitle => /done|closed|complete|archiv|finished|valmis/i.test(listTitle || '');
const DAY = 24 * 3600 * 1000;
// Project's dates: local time without a zone, to the second.
const stamp = ms => new Date(ms).toISOString().slice(0, 19);
const valid = text => { const t = Date.parse(text || ''); return Number.isNaN(t) ? null : t; };
const hoursText = hours => {
  const minutes = Math.max(0, Math.round(hours * 60));
  return `PT${Math.floor(minutes / 60)}H${minutes % 60}M0S`;
};

// The board as a plan Project opens: the project's summary row, a summary
// task per swimlane,
// under it the cards with their subtasks one level down, each task from its
// start to its due date (one day when it has only one of them, and from its
// creation when it has neither), 100 % done in a list named done/complete,
// its people as resources, and what blocks it as finish-to-start links.
export function formatMsProjectXml(collected) {
  const { board } = collected;
  const { items } = pagingOf(collected);
  const now = Date.now();
  const lanes = [...new Set(items.map(i => i.swimlaneTitle || 'Default'))];
  // Always a summary row per swimlane: a card at outline level 1 that has
  // subtasks would be a summary task there, which the import reads as a swimlane.
  const laneRows = true;
  const ids = new Set(items.map(i => i.cardId).filter(Boolean));
  const children = new Map();
  const roots = [];
  for (const item of items) {
    const parent = item.parentCardId && ids.has(item.parentCardId) && item.parentCardId !== item.cardId ? item.parentCardId : null;
    if (parent) { if (!children.has(parent)) children.set(parent, []); children.get(parent).push(item); } else roots.push(item);
  }
  const rows = []; // { item | lane, level }
  const seen = new Set();
  const walk = (item, level) => {
    if (seen.has(item.cardId) || level > 20) return;
    seen.add(item.cardId);
    rows.push({ item, level });
    for (const child of children.get(item.cardId) || []) walk(child, level + 1);
  };
  for (const lane of lanes) {
    if (laneRows) rows.push({ lane, level: 1 });
    for (const item of roots.filter(i => (i.swimlaneTitle || 'Default') === lane)) walk(item, laneRows ? 2 : 1);
  }
  // Subtasks whose parent is in a cycle or too deep: at the top.
  for (const item of items) if (!seen.has(item.cardId)) walk(item, laneRows ? 2 : 1);

  const people = [];
  for (const item of items) for (const name of [item.owner, ...(item.assignees || [])]) if (name && !people.includes(name)) people.push(name);
  const uidOf = new Map();
  rows.forEach((row, n) => { if (row.item) uidOf.set(row.item.cardId, n + 1); });
  const span = item => {
    let start = valid(item.startAt);
    let finish = valid(item.dueAt);
    if (start === null && finish === null) start = valid(item.createdAt) ?? now;
    if (start === null) start = finish - DAY;
    if (finish === null || finish < start) finish = start + DAY;
    return { start, finish };
  };
  const spans = rows.map(row => (row.item ? span(row.item) : null));
  const outline = [];
  const numbers = rows.map(row => {
    outline[row.level - 1] = (outline[row.level - 1] || 0) + 1;
    outline.length = row.level;
    return outline.join('.');
  });
  const summaryAt = index => index + 1 < rows.length && rows[index + 1].level > rows[index].level;
  // A summary row runs from its first task's start to its last task's finish.
  const extent = index => {
    let start = Infinity; let finish = -Infinity;
    for (let j = index + 1; j < rows.length && rows[j].level > rows[index].level; j += 1) {
      if (spans[j]) { start = Math.min(start, spans[j].start); finish = Math.max(finish, spans[j].finish); }
    }
    return start === Infinity ? spans[index] || { start: now, finish: now + DAY } : { start, finish };
  };
  const all = rows.map((row, i) => (summaryAt(i) || row.lane ? extent(i) : spans[i]));
  const projectStart = Math.min(...all.map(s => s.start), now);
  const projectFinish = Math.max(...all.map(s => s.finish), projectStart + DAY);

  const task = (uid, fields) => `    <Task>\n${fields.filter(Boolean).map(line => `      ${line}`).join('\n')}\n    </Task>`;
  const lines = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Project xmlns="http://schemas.microsoft.com/project">',
    `  ${el('SaveVersion', 14)}`,
    `  ${el('Name', `${(board && board.title) || 'WeKan board'}.xml`)}`,
    `  ${el('Title', (board && board.title) || 'WeKan board')}`,
    `  ${el('CreationDate', stamp(now))}`,
    `  ${el('StartDate', stamp(projectStart))}`,
    `  ${el('FinishDate', stamp(projectFinish))}`,
    `  ${el('ScheduleFromStart', 1)}`,
    `  ${el('MinutesPerDay', 480)}`,
    `  ${el('MinutesPerWeek', 2400)}`,
    `  ${el('DaysPerMonth', 20)}`,
    '  <Tasks>',
    task(0, [el('UID', 0), el('ID', 0), el('Name', (board && board.title) || 'WeKan board'), el('Type', 1), el('IsNull', 0),
      el('OutlineNumber', 0), el('OutlineLevel', 0), el('Start', stamp(projectStart)), el('Finish', stamp(projectFinish)),
      el('Summary', 1), el('Milestone', 0)]),
  ];
  rows.forEach((row, n) => {
    const uid = n + 1;
    const { start, finish } = all[n];
    const summary = Boolean(row.lane) || summaryAt(n);
    const item = row.item || {};
    const labels = Array.isArray(item.labels) ? item.labels : [];
    const done = !row.lane && (isDone(item.listTitle) || Boolean(item.dueComplete));
    const fields = item.customFields || {};
    const percent = done ? 100 : Number.isFinite(Number(fields['% Complete'])) ? Math.max(0, Math.min(100, Math.round(Number(fields['% Complete'])))) : 0;
    const milestone = labels.some(l => /^milestone$/i.test(String(l)));
    const hours = milestone ? 0 : Math.max(1, ((finish - start) / DAY) * 8);
    const priority = Number.isFinite(Number(fields.Priority)) && fields.Priority !== '' && fields.Priority !== undefined
      ? Math.max(0, Math.min(1000, Math.round(Number(fields.Priority)))) : 500;
    const links = (Array.isArray(item.dependencies) ? item.dependencies : [])
      .filter(dep => dep && dep.type === 'is-blocked-by' && uidOf.has(dep.cardId))
      .map(dep => `<PredecessorLink><PredecessorUID>${uidOf.get(dep.cardId)}</PredecessorUID><Type>1</Type><CrossProject>0</CrossProject><LinkLag>0</LinkLag><LagFormat>7</LagFormat></PredecessorLink>`);
    // What blocks another card: that card's predecessor is this one.
    for (const other of items) {
      for (const dep of other.dependencies || []) {
        if (dep && dep.type === 'blocks' && dep.cardId === item.cardId && uidOf.has(other.cardId)) {
          links.push(`<PredecessorLink><PredecessorUID>${uidOf.get(other.cardId)}</PredecessorUID><Type>1</Type><CrossProject>0</CrossProject><LinkLag>0</LinkLag><LagFormat>7</LagFormat></PredecessorLink>`);
        }
      }
    }
    lines.push(task(uid, [
      el('UID', uid), el('ID', uid), el('Name', row.lane || String(item.title || '').trim() || 'Untitled'),
      el('Type', 0), el('IsNull', 0),
      item.createdAt && valid(item.createdAt) !== null ? el('CreateDate', stamp(valid(item.createdAt))) : '',
      el('WBS', numbers[n]), el('OutlineNumber', numbers[n]), el('OutlineLevel', row.level),
      el('Priority', priority), el('Start', stamp(start)), el('Finish', stamp(finish)),
      el('Duration', hoursText(hours)), el('DurationFormat', 7),
      el('Milestone', milestone ? 1 : 0), el('Summary', summary ? 1 : 0),
      el('PercentComplete', percent),
      done && !summary ? el('ActualFinish', stamp(valid(item.endAt) ?? finish)) : '',
      item.description ? el('Notes', item.description) : '',
      ...links,
    ]));
  });
  lines.push('  </Tasks>', '  <Resources>');
  lines.push(`    <Resource><UID>0</UID><ID>0</ID><Type>1</Type><IsNull>0</IsNull></Resource>`);
  people.forEach((name, n) => lines.push(`    <Resource><UID>${n + 1}</UID><ID>${n + 1}</ID>${el('Name', name)}<Type>1</Type><IsNull>0</IsNull></Resource>`));
  lines.push('  </Resources>', '  <Assignments>');
  let assignment = 0;
  rows.forEach((row, n) => {
    if (!row.item) return;
    for (const name of [row.item.owner, ...(row.item.assignees || [])].filter(Boolean)) {
      assignment += 1;
      lines.push(`    <Assignment><UID>${assignment}</UID><TaskUID>${n + 1}</TaskUID><ResourceUID>${people.indexOf(name) + 1}</ResourceUID><Units>1</Units></Assignment>`);
    }
  });
  lines.push('  </Assignments>', '</Project>', '');
  return lines.join('\n');
}
