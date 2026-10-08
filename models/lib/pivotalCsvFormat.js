// Pivotal Tracker stories CSV, read and written in plain JavaScript so
// tests/pivotalCsv.test.cjs runs the round trip in Node. Pivotal Tracker shut
// down on 2025-04-30; its CSV exports remain, and this is their way in.
//
// Tracker's export (MORE > Export CSV, or Bulk Actions > CSV) has a header row
// whose columns are matched here by NAME, never by position:
//
//   Id,Title,Labels,Iteration,Iteration Start,Iteration End,Type,Estimate,
//   Priority,Current State,Created at,Accepted at,Deadline,Requested By,
//   Description,URL,Owned By[,Owned By...],[Blocker,Blocker Status...],
//   [Comment...],[Task,Task Status...],[Pull Request...],[Git Branch...]
//
// Columns a story may need more than once are repeated as often as the
// busiest story needs them, and are collected in file order. Exports from
// before about 2018 have no Priority column; newer ones add Pull Request and
// Git Branch.
//
// A row (story) maps to:
//   Current State             -> a list; lists follow Tracker's workflow order
//                                (unscheduled, unstarted, planned, started,
//                                finished, delivered, accepted, rejected); an
//                                empty state is unscheduled, Tracker's icebox
//   Title / Description       -> the card's title / description
//   Type                      -> a label (feature, bug, chore, epic, release;
//                                empty is feature)
//   Labels ("a, b")           -> labels
//   Estimate                  -> the "Story points" number field, the board's
//                                Scrum estimate; -1 means unestimated
//   Priority                  -> the "Priority" custom field (p0 - Critical ...)
//   Iteration, its Start/End  -> a Scrum sprint "Iteration N" with those dates
//                                (models/lib/externalScrumPlanning.js); an
//                                iteration whose stories are all accepted is
//                                a finished one and is reported
//   Requested By              -> Requested by
//   Owned By (repeated)       -> the owner, then further assignees
//   Created at / Accepted at
//   / Deadline                -> created / end / due dates
//   Comment (repeated)        -> comments, "text (Author - Mon D, YYYY)" split
//                                into text, author and date
//   Task + Task Status        -> a "Tasks" checklist, completed items done
//   Blocker + Blocker Status  -> an unresolved "#id" blocker naming a story of
//                                this import is an is-blocked-by dependency;
//                                any other blocker is reported
//   Id                        -> the card's source reference
// Reported: Pull Request and Git Branch, unknown states, types and priorities,
// dates that are not "Mon D, YYYY" or "MM/DD/YYYY", comments without the
// "(Author - date)" tail (imported without author and date), and any column
// Tracker does not write. The story URL is not kept: it is the Id on a site
// that no longer exists.

import { readCsv } from './todoistCsvFormat.js';
import { pivotalScrumPlanning, STORY_POINTS_FIELD } from './externalScrumPlanning.js';

export const PIVOTAL_STATES = ['unscheduled', 'unstarted', 'planned', 'started', 'finished', 'delivered', 'accepted', 'rejected'];
export const PIVOTAL_TYPES = ['feature', 'bug', 'chore', 'epic', 'release'];
// The columns WeKan writes: Tracker's import reads them, and ignores
// Iteration, Iteration Start, Iteration End and URL, which are not written.
export const PIVOTAL_IMPORT_COLUMNS = ['Title', 'Labels', 'Type', 'Estimate', 'Priority', 'Current State',
  'Created at', 'Accepted at', 'Deadline', 'Requested By', 'Description'];
const KNOWN = new Set(['id', 'title', 'labels', 'iteration', 'iteration start', 'iteration end', 'type', 'estimate',
  'priority', 'current state', 'created at', 'accepted at', 'deadline', 'requested by', 'description', 'url',
  'owned by', 'blocker', 'blocker status', 'comment', 'task', 'task status', 'pull request', 'git branch']);
const PRIORITY = /^p[0-3] - \S.*$/i;
const MAX_OWNERS = 5;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const listTitle = state => state.charAt(0).toUpperCase() + state.slice(1);

// "Nov 22, 2014" (the export) or "11/22/2014" (the help page), as ISO at UTC
// midnight; undefined for anything else, or for a day that does not exist.
const WORDS_DATE = /^([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})$/;
const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
export function pivotalDate(value) {
  const text = String(value || '').trim();
  let year; let month; let day;
  const words = WORDS_DATE.exec(text);
  const us = US_DATE.exec(text);
  if (words) {
    month = MONTHS.findIndex(name => name.toLowerCase() === words[1].toLowerCase()) + 1;
    day = +words[2]; year = +words[3];
  } else if (us) {
    month = +us[1]; day = +us[2]; year = +us[3];
  } else return undefined;
  if (month < 1 || month > 12) return undefined;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.toISOString() : undefined;
}

export function pivotalDateText(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// "Looks good (Tony Xiang - Nov 11, 2023)": the last parenthesis is who and
// when. A comment without it keeps its whole text.
const COMMENT_TAIL = /^([\s\S]*?)\s*\(([^()]+?) - ([A-Za-z]{3}[a-z]*\.? \d{1,2}, \d{4})\)\s*$/;
export function pivotalComment(value) {
  const text = String(value || '').trim();
  const match = COMMENT_TAIL.exec(text);
  if (!match || !pivotalDate(match[3])) return { text };
  return { text: match[1], author: match[2].trim(), date: pivotalDate(match[3]) };
}

// Tracker writes a ' before a field that starts with =, so a spreadsheet does
// not run it; the ' is not part of the value.
const unguard = text => (/^'=/.test(text) ? text.slice(1) : text);
const guard = text => (/^=/.test(text) ? `'${text}` : text);

export function parsePivotalCsv(text) {
  const rows = readCsv(text, 'Pivotal Tracker');
  if (!rows.length) throw new Error('Pivotal Tracker CSV is empty');
  const header = rows[0].map(cell => cell.trim().toLowerCase());
  if (!header.includes('title') || !header.includes('current state')) {
    throw new Error('Pivotal Tracker CSV needs the Title and Current State columns');
  }
  // Every position of each name, in file order: repeated columns stay
  // together whatever their position.
  const positions = new Map();
  header.forEach((name, index) => { positions.set(name, [...(positions.get(name) || []), index]); });
  const cell = (cells, index) => unguard(String(cells[index] === undefined ? '' : cells[index]).trim());
  const all = (cells, name) => (positions.get(name) || []).map(index => cell(cells, index));
  const get = (cells, name) => all(cells, name)[0] || '';
  // A pair is the nth of each name: the nth Task with the nth Task Status.
  const pairs = (cells, name, status) => {
    const values = all(cells, name);
    const statuses = all(cells, status);
    return values.map((value, index) => ({ value, status: (statuses[index] || '').toLowerCase() }))
      .filter(pair => pair.value);
  };

  const unsupported = [...new Set(header)]
    .filter(name => name && !KNOWN.has(name))
    .map(name => ({ path: `/columns/${name}`, reason: `Pivotal Tracker does not write a "${name}" column; it is not imported` }));
  const tasks = [];
  const planning = [];
  const states = new Set();
  rows.slice(1).forEach((cells, index) => {
    const row = index + 2;
    const at = `/row/${row}`;
    const title = get(cells, 'title');
    if (!title) { unsupported.push({ path: at, reason: 'a Pivotal Tracker story without a title is not imported' }); return; }
    const date = name => {
      const value = get(cells, name);
      const iso = pivotalDate(value);
      if (value && !iso) unsupported.push({ path: `${at}/${name}`, reason: `Pivotal Tracker date "${value}" is not "Mon D, YYYY" or "MM/DD/YYYY"` });
      return iso;
    };

    const stateText = get(cells, 'current state').toLowerCase();
    let state = stateText || 'unscheduled';
    if (!PIVOTAL_STATES.includes(state)) {
      unsupported.push({ path: `${at}/Current State`, reason: `Pivotal Tracker state "${stateText}" is not one of ${PIVOTAL_STATES.join(', ')}; imported as unstarted` });
      state = 'unstarted';
    }
    states.add(state);

    const typeText = get(cells, 'type').toLowerCase();
    let type = typeText || 'feature';
    if (!PIVOTAL_TYPES.includes(type)) {
      unsupported.push({ path: `${at}/Type`, reason: `Pivotal Tracker type "${typeText}" is not one of ${PIVOTAL_TYPES.join(', ')}; imported as feature` });
      type = 'feature';
    }
    const labels = get(cells, 'labels').split(',').map(label => label.trim()).filter(Boolean);
    const tags = [...new Set([type, ...labels])];

    const customFields = {};
    const estimateText = get(cells, 'estimate');
    let estimate;
    if (estimateText && estimateText !== '-1') {
      estimate = Number(estimateText);
      if (Number.isFinite(estimate) && estimate >= 0) customFields[STORY_POINTS_FIELD] = estimate;
      else {
        unsupported.push({ path: `${at}/Estimate`, reason: `Pivotal Tracker estimate "${estimateText}" is not a number of points` });
        estimate = undefined;
      }
    }
    const priority = get(cells, 'priority');
    if (priority && priority.toLowerCase() !== 'none') {
      if (PRIORITY.test(priority)) customFields.Priority = priority;
      else unsupported.push({ path: `${at}/Priority`, reason: `Pivotal Tracker priority "${priority}" is not p0 to p3` });
    }

    const owners = [...new Set(all(cells, 'owned by').filter(Boolean))];
    const comments = all(cells, 'comment').filter(Boolean).map((value, n) => {
      const comment = pivotalComment(value);
      if (!comment.author) unsupported.push({ path: `${at}/Comment/${n + 1}`, reason: 'a Pivotal Tracker comment without "(Author - Mon D, YYYY)" is imported without its author and date' });
      return comment;
    });
    const items = pairs(cells, 'task', 'task status').map(({ value, status }) => ({ title: value, done: status === 'completed' }));
    const dependencies = [];
    pairs(cells, 'blocker', 'blocker status').forEach(({ value, status }, n) => {
      const refs = value.match(/#\d+/g) || [];
      if (status !== 'resolved' && refs.length === 1) dependencies.push({ ref: refs[0].slice(1), type: 'is-blocked-by' });
      else {
        unsupported.push({ path: `${at}/Blocker/${n + 1}`, reason: status === 'resolved'
          ? 'a resolved Pivotal Tracker blocker is not imported'
          : 'a Pivotal Tracker blocker that names no single story (#id) is not imported' });
      }
    });
    for (const name of ['pull request', 'git branch']) {
      const count = all(cells, name).filter(Boolean).length;
      if (count) unsupported.push({ path: `${at}/${name}`, reason: `${count} Pivotal Tracker ${name}(s) of this story are not imported` });
    }

    const due = date('deadline');
    const created = date('created at');
    const accepted = date('accepted at');
    const iteration = get(cells, 'iteration');
    planning.push({ index: tasks.length, row, iteration, accepted: state === 'accepted', estimate,
      start: pivotalDate(get(cells, 'iteration start')), end: pivotalDate(get(cells, 'iteration end')) });
    const id = get(cells, 'id');
    tasks.push({
      title,
      description: get(cells, 'description'),
      column_name: listTitle(state),
      swimlane_name: 'Default',
      tags,
      ...(id ? { ref: id } : {}),
      ...(owners.length ? { owner_username: owners[0] } : {}),
      ...(owners.length > 1 ? { assignees: owners.slice(1) } : {}),
      ...(get(cells, 'requested by') ? { requested_by: get(cells, 'requested by') } : {}),
      ...(due ? { date_due: due } : {}),
      ...(created ? { date_creation: created } : {}),
      ...(accepted ? { date_end: accepted } : {}),
      ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
      ...(items.length ? { checklists: [{ title: 'Tasks', items }] } : {}),
      ...(comments.length ? { comments } : {}),
      ...(dependencies.length ? { dependencies } : {}),
    });
  });
  const scrum = pivotalScrumPlanning(planning);
  return {
    board: { name: 'Imported Pivotal Tracker' },
    columns: PIVOTAL_STATES.filter(state => states.has(state)).map(state => ({ title: listTitle(state) })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
    // Applied by the creator only when Scrum is part of the import selection.
    ...(scrum.transfer ? { scrumTransfer: scrum.transfer } : {}),
    ...(scrum.losses.length ? { scrumLosses: scrum.losses } : {}),
  };
}

const field = value => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const repeat = (name, count) => Array.from({ length: count }, () => name);

// The collected board (models/lib/externalExporters.js) as the CSV Tracker's
// import reads: no Id, so every row is a new story, and no Iteration or URL,
// which Tracker ignores. A list named after a state is that state; any other
// list is accepted for a card with an end date, unstarted otherwise. The first
// label naming a type is the Type; the due date is the Deadline only of a
// release, the one type Tracker gives a deadline.
export function formatPivotalCsv({ items }) {
  const list = items || [];
  const people = item => [...new Set([item.owner, ...(Array.isArray(item.assignees) ? item.assignees : [])].filter(Boolean))]
    .slice(0, MAX_OWNERS);
  const tasks = item => (Array.isArray(item.checklists) ? item.checklists : [])
    .flatMap(checklist => (Array.isArray(checklist.items) ? checklist.items : []))
    .filter(entry => String(entry.title || '').trim());
  const comments = item => (Array.isArray(item.comments) ? item.comments : []).filter(c => String(c.text || '').trim());
  const owners = Math.max(1, ...list.map(item => people(item).length));
  const commentCount = Math.max(0, ...list.map(item => comments(item).length));
  const taskCount = Math.max(0, ...list.map(item => tasks(item).length));
  const header = [...PIVOTAL_IMPORT_COLUMNS, ...repeat('Owned By', owners), ...repeat('Comment', commentCount),
    ...Array.from({ length: taskCount }, () => ['Task', 'Task Status']).flat()];
  const rows = [header];
  for (const item of list) {
    const labels = (Array.isArray(item.labels) ? item.labels : []).map(label => String(label).trim()).filter(Boolean);
    const typeLabel = labels.find(label => PIVOTAL_TYPES.includes(label.toLowerCase()));
    const type = typeLabel ? typeLabel.toLowerCase() : 'feature';
    const rest = labels.filter(label => label !== typeLabel).map(label => label.replace(/\s*,\s*/g, ' '));
    const named = String(item.listTitle || '').trim().toLowerCase();
    const state = PIVOTAL_STATES.includes(named) ? named : item.endAt ? 'accepted' : 'unstarted';
    const fields = item.customFields || {};
    const points = Number(fields[STORY_POINTS_FIELD] ?? fields.Estimate);
    const priority = PRIORITY.test(String(fields.Priority || '')) ? fields.Priority : '';
    const owned = people(item);
    const said = comments(item).map(c => {
      const when = pivotalDateText(c.date);
      return c.author && when ? `${c.text} (${c.author} - ${when})` : String(c.text);
    });
    const done = tasks(item);
    rows.push([
      String(item.title || '').trim() || 'Untitled',
      rest.join(', '),
      type,
      fields[STORY_POINTS_FIELD] !== undefined || fields.Estimate !== undefined ? (Number.isFinite(points) ? String(points) : '') : '',
      priority,
      state,
      pivotalDateText(item.createdAt),
      state === 'accepted' ? pivotalDateText(item.endAt) : '',
      type === 'release' ? pivotalDateText(item.dueAt) : '',
      item.requestedBy || item.creator || '',
      item.description || '',
      ...owned, ...repeat('', owners - owned.length),
      ...said, ...repeat('', commentCount - said.length),
      ...done.flatMap(entry => [String(entry.title).trim(), entry.done ? 'completed' : 'not completed']),
      ...repeat('', (taskCount - done.length) * 2),
    ].map(guard));
  }
  return `${rows.map(cells => cells.map(field).join(',')).join('\r\n')}\r\n`;
}
