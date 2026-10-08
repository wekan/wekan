// A Taiga project dump, read and written. Taiga's exporter (Admin > Project >
// Export, or `manage.py dump_project`) writes the whole project as ONE JSON
// object, and its importer (`load_dump`, New project > Import > Taiga) reads
// the same object back. The keys and value shapes here follow taiga-back's
// export serializers and import validators (taiga/export_import/; see
// docs/Features/ImportExport/Format-Coverage.md for the links). Pure, so
// tests/taigaFormat.test.cjs runs import, export and the round trip in Node.
//
// In a dump, people are emails, statuses / swimlanes / sprints / roles are
// referred to by name, and a task names its user story by the story's `ref`.
//
// Import - a dump becomes the Kanboard-shaped board KanboardCreator writes:
//   us_statuses (by order)        -> lists
//   swimlanes (by order)          -> swimlanes (Default when there are none;
//                                    "Unclassified" for stories without one)
//   user_stories                  -> cards, by kanban_order: subject, description,
//                                    status, swimlane, tags, assigned_to and
//                                    assigned_users as owner and assignees,
//                                    owner as Requested by, watchers, created /
//                                    finish / due dates, comments, custom
//                                    attributes; an archived status archives it
//   tasks                         -> subtask cards of their user story (parent),
//                                    in the story's list and swimlane, with the
//                                    task status as the "Task status" field.
//                                    A Taiga task has its own status, people,
//                                    dates and comments; a checklist item would
//                                    keep only its title and done state.
//   epics                         -> cards in an "Epics" swimlane, in a list per
//                                    epic status, with the epic color; a story's
//                                    first epic is its parent, further epics are
//                                    related-to links
//   issues                        -> cards in an "Issues" swimlane, in a list per
//                                    issue status, with type:, priority: and
//                                    severity: labels
//   history entries with comment  -> comments (deleted comments are left out)
//   custom_attributes_values      -> custom fields, by attribute name
//   role_points                   -> "Story points" (the sum over computable
//                                    roles), the board's Scrum estimate
//   milestones                    -> Scrum sprints (models/lib/externalScrumPlanning.js)
//   tags_colors                   -> label colors, the nearest WeKan label color
//   is_blocked / blocked_note,
//   client_requirement,
//   team_requirement,
//   due_date_reason, is_iocaine   -> custom fields of those names
// Reported, not imported: attachments (the dump embeds the files as base64;
// the browser leaves the bytes out before sending, see slimTaigaDump), wiki
// pages and links, the activity timeline, issue votes, WIP limits, project
// memberships, and links to stories of another project.
//
// Export - the collected board (models/lib/externalExporters.js) becomes a
// dump with every key Taiga's own exporter writes and its importer requires:
// lists as user story statuses, swimlanes as swimlanes (none when the board
// has only Default), cards as user stories, subtask cards as tasks of their
// story, cards in the Epics / Issues swimlanes as epics / issues, a story's
// checklist items as further tasks (Taiga has no checklists; on other items
// they are appended to the description as a Markdown task list), labels as
// tags with their colors, comments as history entries, custom fields as
// custom attributes, and Scrum sprints with both dates as milestones. People
// are written as WeKan usernames; Taiga keeps the ones that are the email of
// one of its users.

import { taigaScrumPlanning, STORY_POINTS_FIELD } from './externalScrumPlanning.js';

export const TAIGA_EPICS_SWIMLANE = 'Epics';
export const TAIGA_ISSUES_SWIMLANE = 'Issues';
export const TAIGA_UNCLASSIFIED_SWIMLANE = 'Unclassified';
export const TAIGA_FIELDS = {
  points: STORY_POINTS_FIELD,
  taskStatus: 'Task status',
  blocked: 'Blocked',
  client: 'Client requirement',
  team: 'Team requirement',
  dueReason: 'Due date reason',
  iocaine: 'Iocaine',
};
export const MAX_TAIGA_ITEMS = 50000;

// WeKan's label palette (client/components/cards/labels.css), so a Taiga tag
// color finds its nearest label color and a label goes back with its hex.
export const WEKAN_LABEL_HEX = {
  white: '#ffffff', green: '#3cb500', yellow: '#fad900', orange: '#ff9f19', red: '#eb4646',
  purple: '#a632db', blue: '#0079bf', sky: '#00c2e0', lime: '#51e898', pink: '#ff78cb',
  black: '#4d4d4d', silver: '#c0c0c0', peachpuff: '#ffdab9', crimson: '#dc143c', plum: '#dda0dd',
  darkgreen: '#006400', slateblue: '#6a5acd', magenta: '#ff00ff', gold: '#ffd700', navy: '#000080',
  gray: '#808080', saddlebrown: '#8b4513', paleturquoise: '#afeeee', mistyrose: '#ffe4e1', indigo: '#4b0082',
};

const list = value => (Array.isArray(value) ? value : []);
const str = value => (typeof value === 'string' ? value : '');
const has = value => value !== undefined && value !== null && value !== '';
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
const person = value => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
const uniq = values => [...new Set(values.filter(Boolean))];
const byOrder = (a, b) => (num(a && a.order) ?? 0) - (num(b && b.order) ?? 0);

function rgb(hex) {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(hex || '').trim());
  if (!match) return null;
  const h = match[1].length === 3 ? match[1].split('').map(c => c + c).join('') : match[1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

// The WeKan label color nearest to a Taiga tag color, or undefined.
export function wekanLabelColor(hex) {
  const source = rgb(hex);
  if (!source) return undefined;
  let best;
  let bestDistance = Infinity;
  for (const [name, value] of Object.entries(WEKAN_LABEL_HEX)) {
    const target = rgb(value);
    const distance = target.reduce((sum, channel, i) => sum + (channel - source[i]) ** 2, 0);
    if (distance < bestDistance) { best = name; bestDistance = distance; }
  }
  return best;
}

// A Taiga datetime ("%Y-%m-%dT%H:%M:%S%z", e.g. 2024-03-01T10:15:00+0000), an
// ISO datetime with Z, or a date (2024-03-15) - as an ISO string. undefined
// when absent, null when present but not a date.
export function taigaDate(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  let iso = null;
  if (/^\d{4}-\d\d-\d\d$/.test(text)) iso = `${text}T00:00:00.000Z`;
  else if (/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:?\d\d)?$/.test(text)) {
    iso = text.replace(/([+-]\d\d)(\d\d)$/, '$1:$2');
    if (!/(?:Z|[+-]\d\d:\d\d)$/.test(iso)) iso += 'Z';
  }
  if (!iso) return null;
  // The calendar day must exist: Date would roll 2024-02-31 into March.
  const [year, month, day] = text.slice(0, 10).split('-').map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Taiga's own datetime format, in UTC.
export function taigaDateTimeText(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toISOString().slice(0, 19)}+0000`;
}

const dayText = value => {
  const text = taigaDateTimeText(value);
  return text ? text.slice(0, 10) : null;
};

const tagName = tag => (typeof tag === 'string' ? tag.trim()
  : Array.isArray(tag) && typeof tag[0] === 'string' ? tag[0].trim() : '');

// The dump without the file contents it embeds: attachments are not imported,
// and their base64 makes the dump many times larger than its text. The client
// sends this instead of the whole dump; the parser still counts them.
export function slimTaigaDump(dump) {
  if (!isObject(dump)) return dump;
  const out = { ...dump };
  const slim = items => list(items).map(item => (isObject(item) && Array.isArray(item.attachments)
    ? { ...item, attachments: item.attachments.map(a => (isObject(a) ? { ...a, attached_file: null } : a)) } : item));
  for (const key of ['epics', 'user_stories', 'tasks', 'issues', 'wiki_pages']) {
    if (Array.isArray(dump[key])) out[key] = slim(dump[key]);
  }
  if (isObject(dump.logo)) out.logo = { name: str(dump.logo.name), data: '' };
  return out;
}

// --- Import ------------------------------------------------------------------

export function parseTaiga(input) {
  let dump = input;
  if (typeof dump === 'string') {
    try { dump = JSON.parse(dump); } catch (error) { throw new Error('A Taiga project dump must be JSON'); }
  }
  if (!isObject(dump)) throw new Error('A Taiga project dump is one JSON object');
  if (!Array.isArray(dump.user_stories)) throw new Error('A Taiga project dump needs its user_stories array');
  const count = ['user_stories', 'tasks', 'issues', 'epics'].reduce((sum, key) => sum + list(dump[key]).length, 0);
  if (count > MAX_TAIGA_ITEMS) throw new Error(`A Taiga project dump with more than ${MAX_TAIGA_ITEMS} items is not imported`);

  const unsupported = [];
  const lost = (path, reason) => unsupported.push({ path, reason });
  const date = (value, path) => {
    const parsed = taigaDate(value);
    if (parsed === null) { lost(path, 'a date that is not a date is left out'); return undefined; }
    return parsed;
  };

  // Lists: the user story statuses, then any other status an item uses.
  const columns = [];
  const addColumn = name => { if (name && !columns.includes(name)) columns.push(name); return name; };
  const statuses = new Map();
  list(dump.us_statuses).filter(s => isObject(s) && str(s.name).trim()).sort(byOrder)
    .forEach(s => { statuses.set(s.name.trim(), s); addColumn(s.name.trim()); });
  const defaultStatus = str(dump.default_us_status).trim() || columns[0] || 'New';
  const wip = [...statuses.values()].filter(s => num(s.wip_limit) !== undefined && s.wip_limit > 0).length;
  if (wip) lost('/us_statuses', `the WIP limits of ${wip} status(es) are not imported; set them on the lists`);

  const taigaLanes = list(dump.swimlanes).filter(s => isObject(s) && str(s.name).trim()).sort(byOrder)
    .map(s => s.name.trim());
  const swimlanes = taigaLanes.length ? [...taigaLanes] : ['Default'];
  const addSwimlane = name => { if (!swimlanes.includes(name)) swimlanes.push(name); return name; };
  const storyLane = name => {
    const lane = str(name).trim();
    if (!taigaLanes.length) return 'Default';
    if (taigaLanes.includes(lane)) return lane;
    return addSwimlane(TAIGA_UNCLASSIFIED_SWIMLANE);
  };

  // Points: their numeric value, summed over the roles that compute points.
  const pointValue = new Map(list(dump.points).filter(isObject).map(p => [str(p.name), num(p.value)]));
  const computable = new Set(list(dump.roles).filter(r => isObject(r) && r.computable !== false).map(r => str(r.name)));
  const anyRoles = list(dump.roles).length > 0;
  let estimated = false;
  const storyPoints = story => {
    const values = list(story.role_points).filter(rp => isObject(rp) && (!anyRoles || computable.has(str(rp.role))))
      .map(rp => pointValue.get(str(rp.points))).filter(v => v !== undefined);
    if (!values.length) return undefined;
    estimated = true;
    return values.reduce((sum, v) => sum + v, 0);
  };

  const tagColors = new Map();
  const tagColorRows = Array.isArray(dump.tags_colors) ? dump.tags_colors
    : isObject(dump.tags_colors) ? Object.entries(dump.tags_colors) : [];
  tagColorRows.forEach(row => {
    if (Array.isArray(row) && typeof row[0] === 'string' && typeof row[1] === 'string') tagColors.set(row[0].trim(), row[1]);
  });
  const usedTags = new Set();
  const tags = item => {
    const names = uniq(list(item.tags).map(tag => {
      // Older Taiga versions stored tags as [name, color].
      if (Array.isArray(tag) && typeof tag[1] === 'string' && !tagColors.has(tagName(tag))) tagColors.set(tagName(tag), tag[1]);
      return tagName(tag);
    }));
    names.forEach(name => usedTags.add(name));
    return names;
  };

  const comments = (item, path) => list(item.history).filter(entry => isObject(entry)
    && str(entry.comment).trim() && !entry.delete_comment_date)
    .map(entry => {
      const user = Array.isArray(entry.user) ? entry.user : [];
      return { text: entry.comment, author: str(user[0]) || str(user[1]), authorName: str(user[1]),
        date: date(entry.created_at, `${path}/history`) };
    });

  let attachments = 0;
  const customFields = (item, extra = {}) => {
    attachments += list(item.attachments).length;
    const fields = {};
    if (isObject(item.custom_attributes_values)) {
      for (const [name, value] of Object.entries(item.custom_attributes_values)) {
        if (has(value)) fields[name] = value;
      }
    }
    if (item.is_blocked === true) fields[TAIGA_FIELDS.blocked] = str(item.blocked_note).trim() || 'Blocked';
    if (str(item.due_date_reason).trim()) fields[TAIGA_FIELDS.dueReason] = item.due_date_reason.trim();
    for (const [name, value] of Object.entries(extra)) if (has(value)) fields[name] = value;
    return fields;
  };
  const people = item => uniq([person(item.assigned_to), ...list(item.assigned_users).map(person)]);
  const owner = (item, out) => {
    const assigned = people(item);
    if (assigned.length) out.owner_username = assigned[0];
    if (assigned.length > 1) out.assignees = assigned.slice(1);
    if (person(item.owner)) out.requested_by = person(item.owner);
    const watchers = uniq(list(item.watchers).map(person));
    if (watchers.length) out.watchers = watchers;
    return out;
  };
  const refOf = value => (num(value) !== undefined || (typeof value === 'string' && value.trim()) ? String(value).trim() : '');

  // Which epics each user story belongs to, by the epics' order.
  const epics = list(dump.epics).filter(isObject).map((epic, position) => ({ epic, position }))
    .sort((a, b) => (num(a.epic.epics_order) ?? 0) - (num(b.epic.epics_order) ?? 0));
  const epicsOfStory = new Map();
  epics.forEach(({ epic, position }) => {
    if (!refOf(epic.ref)) return;
    list(epic.related_user_stories).forEach(link => {
      if (!isObject(link) || !refOf(link.user_story)) return;
      if (str(link.source_project_slug)) {
        lost(`/epics/${position}/related_user_stories`, `a story of project "${link.source_project_slug}" is not part of this import`);
        return;
      }
      const key = refOf(link.user_story);
      epicsOfStory.set(key, [...(epicsOfStory.get(key) || []), `epic-${refOf(epic.ref)}`]);
    });
  });

  const tasks = [];
  const planning = [];
  const push = (task, plan) => { planning[tasks.length] = plan; tasks.push(task); };

  // User stories, in kanban order.
  const storyByRef = new Map();
  list(dump.user_stories).map((story, position) => ({ story, position })).filter(({ story }) => isObject(story))
    .sort((a, b) => (num(a.story.kanban_order) ?? 0) - (num(b.story.kanban_order) ?? 0) || a.position - b.position)
    .forEach(({ story, position }) => {
      const at = `/user_stories/${position}`;
      const ref = refOf(story.ref);
      const status = addColumn(str(story.status).trim() || defaultStatus);
      const statusInfo = statuses.get(status) || {};
      const storyEpics = ref ? epicsOfStory.get(ref) || [] : [];
      const dependencies = storyEpics.slice(1).map(epicRef => ({ ref: epicRef, type: 'related-to' }));
      if (refOf(story.generated_from_issue)) dependencies.push({ ref: `issue-${refOf(story.generated_from_issue)}`, type: 'related-to' });
      if (refOf(story.generated_from_task)) dependencies.push({ ref: `task-${refOf(story.generated_from_task)}`, type: 'related-to' });
      const task = owner(story, {
        title: str(story.subject).trim() || (ref ? `#${ref}` : 'Imported user story'),
        description: str(story.description),
        column_name: status,
        swimlane_name: storyLane(story.swimlane),
        tags: tags(story),
        ...(ref ? { ref: `us-${ref}` } : {}),
        ...(storyEpics.length ? { parent_ref: storyEpics[0] } : {}),
        ...(dependencies.length ? { dependencies } : {}),
        ...(statusInfo.is_archived === true ? { archived: true } : {}),
        date_creation: date(story.created_date, `${at}/created_date`),
        date_end: date(story.finish_date, `${at}/finish_date`),
        date_due: date(story.due_date, `${at}/due_date`),
        comments: comments(story, at),
        custom_fields: customFields(story, {
          [TAIGA_FIELDS.points]: storyPoints(story),
          [TAIGA_FIELDS.client]: story.client_requirement === true ? true : undefined,
          [TAIGA_FIELDS.team]: story.team_requirement === true ? true : undefined,
        }),
      });
      if (ref) storyByRef.set(ref, task);
      push(task, { milestone: story.milestone, backlogOrder: num(story.backlog_order), path: at });
    });

  // Tasks, as subtask cards beside their story.
  list(dump.tasks).map((item, position) => ({ item, position })).filter(({ item }) => isObject(item))
    .sort((a, b) => (num(a.item.us_order) ?? 0) - (num(b.item.us_order) ?? 0) || a.position - b.position)
    .forEach(({ item, position }) => {
      const at = `/tasks/${position}`;
      const ref = refOf(item.ref);
      const storyRef = refOf(item.user_story);
      const story = storyRef ? storyByRef.get(storyRef) : undefined;
      push(owner(item, {
        title: str(item.subject).trim() || (ref ? `#${ref}` : 'Imported task'),
        description: str(item.description),
        column_name: story ? story.column_name : addColumn(defaultStatus),
        swimlane_name: story ? story.swimlane_name : swimlanes[0],
        tags: tags(item),
        ...(ref ? { ref: `task-${ref}` } : {}),
        ...(storyRef ? { parent_ref: `us-${storyRef}` } : {}),
        date_creation: date(item.created_date, `${at}/created_date`),
        date_end: date(item.finished_date, `${at}/finished_date`),
        date_due: date(item.due_date, `${at}/due_date`),
        comments: comments(item, at),
        custom_fields: customFields(item, {
          [TAIGA_FIELDS.taskStatus]: str(item.status).trim() || undefined,
          [TAIGA_FIELDS.iocaine]: item.is_iocaine === true ? true : undefined,
        }),
      }), { milestone: item.milestone, path: at });
    });

  // Epics and issues, each in a swimlane of their own.
  const defaultEpicStatus = str(dump.default_epic_status).trim()
    || (list(dump.epic_statuses).filter(isObject).sort(byOrder)[0] || {}).name || 'New';
  epics.forEach(({ epic, position }) => {
    const at = `/epics/${position}`;
    const ref = refOf(epic.ref);
    push(owner(epic, {
      title: str(epic.subject).trim() || (ref ? `#${ref}` : 'Imported epic'),
      description: str(epic.description),
      column_name: addColumn(str(epic.status).trim() || defaultEpicStatus),
      swimlane_name: addSwimlane(TAIGA_EPICS_SWIMLANE),
      tags: tags(epic),
      ...(ref ? { ref: `epic-${ref}` } : {}),
      ...(str(epic.color) ? { color: epic.color } : {}),
      date_creation: date(epic.created_date, `${at}/created_date`),
      comments: comments(epic, at),
      custom_fields: customFields(epic, {
        [TAIGA_FIELDS.client]: epic.client_requirement === true ? true : undefined,
        [TAIGA_FIELDS.team]: epic.team_requirement === true ? true : undefined,
      }),
    }), null);
  });
  let votes = 0;
  const defaultIssueStatus = str(dump.default_issue_status).trim() || 'New';
  list(dump.issues).forEach((issue, position) => {
    if (!isObject(issue)) return;
    const at = `/issues/${position}`;
    const ref = refOf(issue.ref);
    votes += list(issue.votes).length;
    const facets = [['type', issue.type], ['priority', issue.priority], ['severity', issue.severity]]
      .filter(([, value]) => str(value).trim()).map(([facet, value]) => `${facet}:${value.trim()}`);
    facets.forEach(name => usedTags.add(name));
    push(owner(issue, {
      title: str(issue.subject).trim() || (ref ? `#${ref}` : 'Imported issue'),
      description: str(issue.description),
      column_name: addColumn(str(issue.status).trim() || defaultIssueStatus),
      swimlane_name: addSwimlane(TAIGA_ISSUES_SWIMLANE),
      tags: uniq([...tags(issue), ...facets]),
      ...(ref ? { ref: `issue-${ref}` } : {}),
      date_creation: date(issue.created_date, `${at}/created_date`),
      date_end: date(issue.finished_date, `${at}/finished_date`),
      date_due: date(issue.due_date, `${at}/due_date`),
      comments: comments(issue, at),
      custom_fields: customFields(issue),
    }), { milestone: issue.milestone, path: at });
  });
  if (!columns.length) addColumn(defaultStatus);

  // What has no place on a WeKan board.
  if (attachments) lost('/attachments', `${attachments} attachment(s) are not imported: download them from Taiga and attach them to the cards`);
  if (isObject(dump.logo) && str(dump.logo.name)) lost('/logo', 'the project logo is not imported');
  const wikiPages = list(dump.wiki_pages).length;
  if (wikiPages) lost('/wiki_pages', `${wikiPages} wiki page(s) are not imported: a WeKan board has no wiki`);
  const wikiLinks = list(dump.wiki_links).length;
  if (wikiLinks) lost('/wiki_links', `${wikiLinks} wiki link(s) are not imported`);
  const timeline = list(dump.timeline).length;
  if (timeline) lost('/timeline', `the project timeline (${timeline} event(s)) is not imported; comments are`);
  if (votes) lost('/issues/votes', `${votes} issue vote(s) are not imported`);
  const members = list(dump.memberships).filter(isObject).length;
  if (members) {
    lost('/memberships', `${members} project member(s) are not added to the board; Taiga names people by email, and an item keeps them only where a WeKan user is mapped`);
  }

  const labelColors = {};
  for (const name of usedTags) {
    const color = wekanLabelColor(tagColors.get(name));
    if (color) labelColors[name] = color;
  }

  const scrum = taigaScrumPlanning(dump.milestones, planning, { estimate: estimated });
  return {
    board: { name: str(dump.name).trim() || 'Imported Taiga project' },
    columns: columns.map(title => ({ title })),
    swimlanes: swimlanes.map(name => ({ name })),
    tasks,
    ...(Object.keys(labelColors).length ? { label_colors: labelColors } : {}),
    warnings: [],
    unsupported,
    // Applied by the creator only when Scrum is part of the import selection.
    ...(scrum.transfer ? { scrumTransfer: scrum.transfer } : {}),
    ...(scrum.losses.length ? { scrumLosses: scrum.losses } : {}),
  };
}

// --- Export ------------------------------------------------------------------

const TASK_STATUSES = [['New', false], ['In progress', false], ['Ready for test', true], ['Closed', true], ['Needs Info', false]];
const ISSUE_STATUSES = [['New', false], ['In progress', false], ['Ready for test', true], ['Closed', true],
  ['Needs Info', false], ['Rejected', true], ['Postponed', false]];
const EPIC_STATUSES = [['New', false], ['Ready', false], ['In progress', false], ['Ready for test', false], ['Done', true]];
const ISSUE_TYPES = ['Bug', 'Question', 'Enhancement'];
const PRIORITIES = ['Low', 'Normal', 'High'];
const SEVERITIES = ['Wishlist', 'Minor', 'Normal', 'Important', 'Critical'];
const ROLE = 'Team';
const ROLE_PERMISSIONS = ['view_project', 'view_milestones', 'add_milestone', 'modify_milestone', 'delete_milestone',
  'view_epics', 'add_epic', 'modify_epic', 'comment_epic', 'delete_epic',
  'view_us', 'add_us', 'modify_us', 'comment_us', 'delete_us',
  'view_tasks', 'add_task', 'modify_task', 'comment_task', 'delete_task',
  'view_issues', 'add_issue', 'modify_issue', 'comment_issue', 'delete_issue',
  'view_wiki_pages', 'add_wiki_page', 'modify_wiki_page', 'comment_wiki_page', 'delete_wiki_page',
  'view_wiki_links', 'add_wiki_link', 'modify_wiki_link', 'delete_wiki_link'];
const CLOSED_LIST = /done|closed|complete|archiv|finished/i;
const STATUS_COLOR = '#70728F';
const FACETS = ['type', 'priority', 'severity'];

export function taigaSlug(text, used = new Set()) {
  const base = String(text || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'item';
  let slug = base;
  for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;
  used.add(slug);
  return slug;
}

function uniqueName(name, used) {
  const base = String(name || '').trim() || 'Untitled';
  let out = base;
  for (let n = 2; used.has(out); n += 1) out = `${base} (${n})`;
  used.add(out);
  return out;
}

const hexColor = color => {
  if (typeof color !== 'string') return null;
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  return WEKAN_LABEL_HEX[color.toLowerCase()] || null;
};

const attributeValue = value => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'string') return value;
  return undefined;
};

function checklistMarkdown(checklists) {
  return list(checklists).filter(c => list(c.items).length).map(c => [
    `### ${str(c.title).trim() || 'Checklist'}`,
    ...list(c.items).map(item => `- [${item.done ? 'x' : ' '}] ${str(item.title)}`),
  ].join('\n')).join('\n\n');
}

function history(comments, now) {
  return list(comments).filter(c => str(c.text).trim()).map(c => ({
    user: c.author ? [c.author, c.author] : [],
    diff: {}, snapshot: null, values: {},
    comment: c.text,
    delete_comment_date: null, delete_comment_user: [], comment_versions: null,
    created_at: taigaDateTimeText(c.date) || taigaDateTimeText(now),
    edit_comment_date: null, is_hidden: false, is_snapshot: false, type: 1,
  }));
}

function statusRows(rows) {
  const slugs = new Set();
  return rows.map(([name, closed], index) => ({ name, slug: taigaSlug(name, slugs), order: index + 1,
    is_closed: closed, color: STATUS_COLOR }));
}

function addStatus(rows, name, closed = CLOSED_LIST.test(name)) {
  if (name && !rows.some(row => row[0] === name)) rows.push([name, closed]);
}

// The dump for a collected board ({ board, lists, swimlanes, items,
// scrumSprints }, models/lib/externalExporters.js).
export function formatTaiga({ board, lists, swimlanes, items, scrumSprints } = {}, now = new Date()) {
  const all = list(items);
  const nowText = taigaDateTimeText(now);
  const byCard = new Map(all.map(item => [item.cardId, item]));

  // What each card is: epic and issue by swimlane, task by its parent.
  const kinds = new Map();
  const kindOf = (item, seen = new Set()) => {
    if (kinds.has(item.cardId)) return kinds.get(item.cardId);
    let kind = 'story';
    if (item.swimlaneTitle === TAIGA_EPICS_SWIMLANE) kind = 'epic';
    else if (item.swimlaneTitle === TAIGA_ISSUES_SWIMLANE) kind = 'issue';
    else {
      const parent = item.parentCardId && byCard.get(item.parentCardId);
      seen.add(item.cardId);
      if (parent && !seen.has(parent.cardId) && ['story', 'task'].includes(kindOf(parent, seen))) kind = 'task';
    }
    kinds.set(item.cardId, kind);
    return kind;
  };
  all.forEach(item => kindOf(item));
  const storyOf = item => {
    let current = item;
    const seen = new Set();
    while (current && kinds.get(current.cardId) === 'task' && !seen.has(current.cardId)) {
      seen.add(current.cardId);
      current = byCard.get(current.parentCardId);
    }
    return current && kinds.get(current.cardId) === 'story' ? current : null;
  };

  // Refs: one sequence for the whole project, as Taiga numbers them.
  const refs = new Map();
  let nextRef = 1;
  for (const kind of ['epic', 'story', 'task', 'issue']) {
    all.filter(item => kinds.get(item.cardId) === kind).forEach(item => { refs.set(item.cardId, nextRef); nextRef += 1; });
  }

  // Statuses: lists for stories; Taiga's defaults plus what is used for the rest.
  const usedStatusNames = new Set();
  const usStatusByList = new Map();
  const usStatuses = list(lists).map((l, index) => {
    const name = uniqueName(l.title, usedStatusNames);
    usStatusByList.set(l._id, name);
    const wip = l.wipLimit && l.wipLimit.enabled && num(l.wipLimit.value) > 0 ? l.wipLimit.value : null;
    return { name, slug: '', order: index + 1, is_closed: CLOSED_LIST.test(name), is_archived: false,
      color: hexColor(l.color) || STATUS_COLOR, wip_limit: wip };
  });
  if (!usStatuses.length) usStatuses.push({ name: 'New', slug: '', order: 1, is_closed: false, is_archived: false, color: STATUS_COLOR, wip_limit: null });
  const statusSlugs = new Set();
  usStatuses.forEach(s => { s.slug = taigaSlug(s.name, statusSlugs); });
  const storyStatus = item => usStatusByList.get(item.listId)
    || usStatuses.find(s => s.name === item.listTitle)?.name || usStatuses[0].name;
  const closedStatus = new Set(usStatuses.filter(s => s.is_closed).map(s => s.name));

  const taskStatuses = TASK_STATUSES.map(row => [...row]);
  const issueStatuses = ISSUE_STATUSES.map(row => [...row]);
  const epicStatuses = EPIC_STATUSES.map(row => [...row]);
  const issueTypes = [...ISSUE_TYPES];
  const priorities = [...PRIORITIES];
  const severities = [...SEVERITIES];

  // Swimlanes: none when the board has only its Default one.
  const laneTitles = uniq(list(swimlanes).map(s => s.title))
    .filter(title => title !== TAIGA_EPICS_SWIMLANE && title !== TAIGA_ISSUES_SWIMLANE);
  const taigaLanes = laneTitles.length === 1 && laneTitles[0] === 'Default' ? [] : laneTitles;

  // Sprints: Taiga needs both dates of a milestone.
  const sprintNames = new Map();
  const usedSprintNames = new Set();
  const milestoneSlugs = new Set();
  const milestones = list(scrumSprints).filter(s => s && s.state !== 'cancelled' && s.plannedStart && s.plannedEnd)
    .map((sprint, index) => {
      const name = uniqueName(sprint.name, usedSprintNames);
      sprintNames.set(sprint._id, name);
      return { name, owner: null, created_date: nowText, modified_date: nowText,
        estimated_start: dayText(sprint.plannedStart), estimated_finish: dayText(sprint.plannedEnd),
        slug: taigaSlug(name, milestoneSlugs), closed: sprint.state === 'closed', disponibility: 0.0,
        order: index + 1, watchers: [] };
    });
  const sprintOf = item => (item.scrum && sprintNames.get(item.scrum.sprintId)) || null;

  // Points: "?" plus every story point value used.
  const points = [{ name: '?', order: 1, value: null }];
  const pointName = value => {
    if (num(value) === undefined || value < 0) return '?';
    const name = String(value);
    if (!points.some(p => p.name === name)) points.push({ name, order: points.length + 1, value });
    return name;
  };

  const attributeDefs = { epic: new Map(), story: new Map(), task: new Map(), issue: new Map() };
  const CONSUMED = {
    story: [TAIGA_FIELDS.points, TAIGA_FIELDS.blocked, TAIGA_FIELDS.client, TAIGA_FIELDS.team, TAIGA_FIELDS.dueReason],
    task: [TAIGA_FIELDS.taskStatus, TAIGA_FIELDS.blocked, TAIGA_FIELDS.dueReason, TAIGA_FIELDS.iocaine],
    issue: [TAIGA_FIELDS.blocked, TAIGA_FIELDS.dueReason],
    epic: [TAIGA_FIELDS.blocked, TAIGA_FIELDS.client, TAIGA_FIELDS.team],
  };
  const attributes = (item, kind) => {
    const out = {};
    for (const [name, raw] of Object.entries(isObject(item.customFields) ? item.customFields : {})) {
      if (CONSUMED[kind].includes(name)) continue;
      const value = attributeValue(raw);
      if (value === undefined || value === '') continue;
      out[name] = value;
      const type = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'checkbox' : 'text';
      const known = attributeDefs[kind].get(name);
      attributeDefs[kind].set(name, known && known !== type ? 'text' : type);
    }
    return out;
  };
  const fieldText = (item, name) => {
    const value = isObject(item.customFields) ? item.customFields[name] : undefined;
    return has(value) && typeof value !== 'object' ? String(value) : '';
  };
  const blocked = item => {
    const note = fieldText(item, TAIGA_FIELDS.blocked);
    return { blocked_note: note && note !== 'Blocked' && note !== 'true' ? note : '', is_blocked: Boolean(note) && note !== 'false' };
  };
  const flag = (item, name) => ['true', 'yes', '1'].includes(fieldText(item, name).toLowerCase());
  const peopleOf = item => uniq([item.owner, ...list(item.assignees)].map(person));
  const common = (item, kind) => {
    const assigned = peopleOf(item);
    return {
      owner: person(item.creator) || person(item.requestedBy) || null,
      assigned_to: assigned[0] || null,
      modified_date: taigaDateTimeText(item.createdAt) || nowText,
      created_date: taigaDateTimeText(item.createdAt) || nowText,
      ref: refs.get(item.cardId),
      subject: String(item.title || '').trim() || 'Untitled',
      description: kind === 'story' ? str(item.description)
        : [str(item.description), checklistMarkdown(item.checklists)].filter(Boolean).join('\n\n'),
      version: 1,
      ...blocked(item),
      attachments: [],
      history: history(item.comments, now),
      watchers: [],
      custom_attributes_values: attributes(item, kind),
    };
  };
  const plainTags = item => uniq(list(item.labels).map(name => String(name).trim()));

  const epicsOut = [];
  const storiesOut = [];
  const tasksOut = [];
  const issuesOut = [];
  const kanbanOrder = new Map();
  all.forEach(item => {
    const kind = kinds.get(item.cardId);
    if (kind === 'epic') {
      addStatus(epicStatuses, item.listTitle);
      epicsOut.push({
        ...common(item, 'epic'),
        status: item.listTitle || 'New',
        epics_order: epicsOut.length + 1,
        color: hexColor(item.color) || STATUS_COLOR,
        client_requirement: flag(item, TAIGA_FIELDS.client),
        team_requirement: flag(item, TAIGA_FIELDS.team),
        tags: plainTags(item),
        related_user_stories: all.filter(child => child.parentCardId === item.cardId && kinds.get(child.cardId) === 'story')
          .map((child, index) => ({ user_story: refs.get(child.cardId), order: index + 1, source_project_slug: null })),
      });
    } else if (kind === 'story') {
      const status = storyStatus(item);
      const order = (kanbanOrder.get(status) || 0) + 1;
      kanbanOrder.set(status, order);
      const lane = taigaLanes.includes(item.swimlaneTitle) ? item.swimlaneTitle : (taigaLanes[0] || null);
      const storyPoints = isObject(item.customFields) ? item.customFields[TAIGA_FIELDS.points] : undefined;
      const assigned = peopleOf(item);
      const { created_date: created, ...rest } = common(item, 'story');
      storiesOut.push({
        watchers: rest.watchers,
        role_points: [{ role: ROLE, points: pointName(typeof storyPoints === 'string' ? Number(storyPoints) : storyPoints) }],
        owner: rest.owner,
        assigned_to: rest.assigned_to,
        assigned_users: assigned,
        status,
        swimlane: lane,
        milestone: sprintOf(item),
        modified_date: rest.modified_date,
        created_date: created,
        finish_date: closedStatus.has(status) ? taigaDateTimeText(item.endAt) || nowText : null,
        generated_from_issue: null,
        generated_from_task: null,
        from_task_ref: null,
        ref: rest.ref,
        is_closed: closedStatus.has(status),
        backlog_order: (item.scrum && num(item.scrum.backlogRank)) ?? rest.ref,
        sprint_order: rest.ref,
        kanban_order: order,
        subject: rest.subject,
        description: rest.description,
        client_requirement: flag(item, TAIGA_FIELDS.client),
        team_requirement: flag(item, TAIGA_FIELDS.team),
        external_reference: null,
        tribe_gig: null,
        version: 1,
        blocked_note: rest.blocked_note,
        is_blocked: rest.is_blocked,
        tags: plainTags(item),
        due_date: taigaDateTimeText(item.dueAt),
        due_date_reason: fieldText(item, TAIGA_FIELDS.dueReason),
        attachments: [],
        history: rest.history,
        custom_attributes_values: rest.custom_attributes_values,
      });
    } else if (kind === 'issue') {
      const facet = name => {
        const label = list(item.labels).find(l => String(l).startsWith(`${name}:`));
        return label ? String(label).slice(name.length + 1).trim() : '';
      };
      const type = facet('type') || 'Bug';
      const priority = facet('priority') || 'Normal';
      const severity = facet('severity') || 'Normal';
      if (!issueTypes.includes(type)) issueTypes.push(type);
      if (!priorities.includes(priority)) priorities.push(priority);
      if (!severities.includes(severity)) severities.push(severity);
      const status = item.listTitle || 'New';
      addStatus(issueStatuses, status);
      issuesOut.push({
        ...common(item, 'issue'),
        status,
        priority,
        severity,
        type,
        milestone: sprintOf(item),
        votes: [],
        finished_date: issueStatuses.find(row => row[0] === status)[1] ? taigaDateTimeText(item.endAt) || nowText : null,
        external_reference: null,
        tags: plainTags(item).filter(name => !FACETS.some(f => name.startsWith(`${f}:`))),
        due_date: taigaDateTimeText(item.dueAt),
        due_date_reason: fieldText(item, TAIGA_FIELDS.dueReason),
      });
    }
  });

  // Tasks: subtask cards, then a story's checklist items.
  const storyMilestone = new Map(storiesOut.map(s => [s.ref, s.milestone]));
  const taskOrder = new Map();
  const nextTaskOrder = storyRef => { const n = (taskOrder.get(storyRef) || 0) + 1; taskOrder.set(storyRef, n); return n; };
  const pushTask = fields => {
    addStatus(taskStatuses, fields.status);
    const closed = taskStatuses.find(row => row[0] === fields.status)[1];
    tasksOut.push({ ...fields, finished_date: closed ? fields.finished_date || nowText : null });
  };
  all.filter(item => kinds.get(item.cardId) === 'task').forEach(item => {
    const story = storyOf(item);
    const storyRef = story ? refs.get(story.cardId) : null;
    const { assigned_to: assignedTo, ...rest } = common(item, 'task');
    const order = nextTaskOrder(storyRef);
    pushTask({
      owner: rest.owner,
      status: fieldText(item, TAIGA_FIELDS.taskStatus) || (item.endAt ? 'Closed' : 'New'),
      user_story: storyRef,
      milestone: storyRef ? storyMilestone.get(storyRef) || null : sprintOf(item),
      assigned_to: assignedTo,
      modified_date: rest.modified_date,
      created_date: rest.created_date,
      finished_date: taigaDateTimeText(item.endAt),
      ref: rest.ref,
      subject: rest.subject,
      us_order: order,
      taskboard_order: order,
      description: rest.description,
      is_iocaine: flag(item, TAIGA_FIELDS.iocaine),
      external_reference: null,
      version: 1,
      blocked_note: rest.blocked_note,
      is_blocked: rest.is_blocked,
      tags: plainTags(item),
      due_date: taigaDateTimeText(item.dueAt),
      due_date_reason: fieldText(item, TAIGA_FIELDS.dueReason),
      attachments: [],
      history: rest.history,
      watchers: [],
      custom_attributes_values: rest.custom_attributes_values,
    });
  });
  all.filter(item => kinds.get(item.cardId) === 'story').forEach(item => {
    const storyRef = refs.get(item.cardId);
    list(item.checklists).forEach(checklist => list(checklist.items).forEach(entry => {
      if (!str(entry.title).trim()) return;
      const ref = nextRef;
      nextRef += 1;
      const order = nextTaskOrder(storyRef);
      pushTask({
        owner: null, status: entry.done ? 'Closed' : 'New', user_story: storyRef,
        milestone: storyMilestone.get(storyRef) || null, assigned_to: null,
        modified_date: nowText, created_date: taigaDateTimeText(item.createdAt) || nowText, finished_date: null,
        ref, subject: entry.title.trim(), us_order: order, taskboard_order: order, description: '',
        is_iocaine: false, external_reference: null, version: 1, blocked_note: '', is_blocked: false,
        tags: [], due_date: null, due_date_reason: '', attachments: [], history: [], watchers: [],
        custom_attributes_values: {},
      });
    }));
  });

  // Tags with their colors: every board label but the issue facets.
  const tagsColors = list(board && board.labels).filter(l => l && str(l.name).trim()
    && !FACETS.some(f => l.name.startsWith(`${f}:`)))
    .map(l => [l.name.trim(), hexColor(l.color)]);

  const attributeRows = kind => [...attributeDefs[kind].entries()].map(([name, type], index) => ({
    name, description: '', type, order: index + 1, created_date: nowText, modified_date: nowText,
  }));
  const title = String((board && board.title) || '').trim() || 'WeKan board';
  const facetRows = names => names.map((name, index) => ({ name, order: index + 1, color: STATUS_COLOR }));
  const dueDates = () => [
    { name: 'Default', order: 1, by_default: true, color: '#9dce0a', days_to_due: null },
    { name: 'Due soon', order: 2, by_default: false, color: '#ff9900', days_to_due: 14 },
    { name: 'Past due', order: 3, by_default: false, color: '#ff8a84', days_to_due: 0 },
  ];

  // Every key ProjectExportSerializer writes, in its order.
  return {
    watchers: [],
    name: title,
    slug: taigaSlug(title),
    description: str(board && board.description).trim() || title,
    created_date: taigaDateTimeText(board && board.createdAt) || nowText,
    logo: null,
    total_milestones: milestones.length || null,
    total_story_points: null,
    is_epics_activated: epicsOut.length > 0,
    is_backlog_activated: milestones.length > 0,
    is_kanban_activated: true,
    is_wiki_activated: false,
    is_issues_activated: issuesOut.length > 0,
    videoconferences: null,
    videoconferences_extra_data: null,
    creation_template: null,
    is_private: true,
    is_featured: false,
    is_looking_for_people: false,
    looking_for_people_note: '',
    epics_csv_uuid: null,
    userstories_csv_uuid: null,
    tasks_csv_uuid: null,
    issues_csv_uuid: null,
    transfer_token: null,
    blocked_code: null,
    totals_updated_datetime: nowText,
    total_fans: 0,
    total_fans_last_week: 0,
    total_fans_last_month: 0,
    total_fans_last_year: 0,
    total_activity: 0,
    total_activity_last_week: 0,
    total_activity_last_month: 0,
    total_activity_last_year: 0,
    anon_permissions: [],
    public_permissions: [],
    modified_date: nowText,
    roles: [{ name: ROLE, slug: taigaSlug(ROLE), order: 10, computable: true, permissions: ROLE_PERMISSIONS }],
    // The importing user becomes the owner and an admin member (load_dump).
    owner: null,
    memberships: [],
    points,
    epic_statuses: statusRows(epicStatuses),
    us_statuses: usStatuses,
    us_duedates: dueDates(),
    task_statuses: statusRows(taskStatuses),
    task_duedates: dueDates(),
    issue_types: facetRows(issueTypes),
    issue_statuses: statusRows(issueStatuses),
    issue_duedates: dueDates(),
    priorities: facetRows(priorities),
    severities: facetRows(severities),
    swimlanes: taigaLanes.map((name, index) => ({ name, order: index + 1,
      statuses: usStatuses.map(s => ({ status: s.name, wip_limit: s.wip_limit })) })),
    tags_colors: tagsColors,
    default_points: '?',
    default_epic_status: 'New',
    default_us_status: usStatuses[0].name,
    default_task_status: 'New',
    default_priority: 'Normal',
    default_severity: 'Normal',
    default_issue_status: 'New',
    default_issue_type: 'Bug',
    default_swimlane: taigaLanes[0] || null,
    epiccustomattributes: attributeRows('epic'),
    userstorycustomattributes: attributeRows('story'),
    taskcustomattributes: attributeRows('task'),
    issuecustomattributes: attributeRows('issue'),
    epics: epicsOut,
    user_stories: storiesOut,
    tasks: tasksOut,
    milestones,
    issues: issuesOut,
    wiki_links: [],
    wiki_pages: [],
    tags: [],
    timeline: [],
  };
}
