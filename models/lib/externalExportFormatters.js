// Export to other tools: one formatter per format, each emitting the shape that
// WeKan's own importer for that tool reads (externalParsers.js, jiraCreator.js,
// jiraIssueExtras.js), so a board round-trips. Pure - the collection from the
// database is externalExporters.js - so tests/externalExportRoundTrip.test.cjs
// runs every export back through its parser in plain Node.
//
// Each exported item is what collect() gathered for one card, already gated by
// the export selection (#1173): title, description, listTitle, swimlaneTitle,
// labels, dueAt, and - when selected and the format has a place for them -
// startAt, endAt, createdAt, owner, assignees, creator, requestedBy, comments,
// checklists, parentCardId and customFields. A format drops what it has no
// field for; that is the honest answer, not a loss this module invents.
import { formatMarkdownKanban } from './markdownKanbanFormat.js';
import { formatLeo } from './leoOutlineFormat.js';
import { formatTodoTxt } from './todoTxtFormat.js';
import { formatTaskwarrior } from './taskwarriorFormat.js';
import { formatFocalboard } from './focalboardFormat.js';
import { formatTodoistCsv } from './todoistCsvFormat.js';
import { formatPlannerRows } from './plannerFormat.js';
import { formatMeisterTaskCsv } from './meistertaskCsvFormat.js';
import { formatObsidianKanban } from './obsidianKanbanFormat.js';
import { formatLinearCsv } from './linearCsvFormat.js';
import { formatTickTickCsv } from './ticktickCsvFormat.js';
import { formatClickUpCsv } from './clickupCsvFormat.js';
import { formatNullboard } from './nullboardFormat.js';
import { formatKanri } from './kanriFormat.js';
import { formatPivotalCsv } from './pivotalCsvFormat.js';
import { formatRedmineCsv } from './redmineCsvFormat.js';
import { formatTasksOrgBackup } from './tasksorgFormat.js';
import { formatMondaySheets } from './mondayFormat.js';
import { formatBusinessmapSheets } from './businessmapFormat.js';
import { formatSuperProductivity } from './superProductivityFormat.js';
import { formatTaiga } from './taigaFormat.js';
import { formatVikunja } from './vikunjaFormat.js';
import { formatWrikeRows } from './wrikeFormat.js';
import { formatWrikeWorkflow } from './wrikeWorkflow.js';
import { formatTeamworkSheet } from './teamworkFormat.js';
import { formatQuireCsv } from './quireCsvFormat.js';
import { formatNotionCsv } from './notionFormat.js';
import { formatOpml } from './opmlOutlineFormat.js';
import { formatOrgMode } from './orgModeFormat.js';

// A WeKan list maps to a "closed" issue state when its name looks terminal.
function isClosed(listTitle) {
  return /done|closed|complete|archiv|finished/i.test(listTitle || '');
}

const has = value => value !== undefined && value !== null && value !== '';
const list = value => (Array.isArray(value) ? value : []);
const checklistItems = item => list(item.checklists).flatMap(c => list(c.items));

const githubLike = ({ items }) =>
  items.map(i => ({
    title: i.title,
    body: i.description,
    state: isClosed(i.listTitle) ? 'closed' : 'open',
    labels: i.labels.map(name => ({ name })),
    due_date: i.dueAt,
  }));

// OpenProject reads ids from HAL hrefs ending in a number.
const numericIds = items => new Map(items.map((item, index) => [item.cardId, index + 1]));

// Sprints and releases, for the formats with a place for them (GitLab
// iterations and milestones, OpenProject sprints and versions), numbered as
// those APIs number theirs. What the importer reads back is
// models/lib/externalScrumPlanning.js. A cancelled sprint or release has no
// equivalent in either and is left out, with its cards unassigned.
const day = value => (value ? new Date(value).toISOString().slice(0, 10) : undefined);
function planningIndex({ scrumSprints, scrumReleases }) {
  const numbered = rows => new Map(list(rows).filter(row => row && row.state !== 'cancelled')
    .map((row, index) => [row._id, { ...row, number: index + 1 }]));
  return { sprints: numbered(scrumSprints), releases: numbered(scrumReleases) };
}
const GITLAB_ITERATION_STATE = { planned: 1, active: 2, closed: 3 };
const OPENPROJECT_SPRINT_STATUS = { planned: 'in_planning', active: 'active', closed: 'completed' };
const OPENPROJECT_SPRINT_TITLE = { planned: 'In planning', active: 'Active', closed: 'Completed' };
const sprintOf = (planning, item) => (item.scrum && planning.sprints.get(item.scrum.sprintId)) || null;
const releaseOf = (planning, item) => (item.scrum && planning.releases.get(item.scrum.firstReleaseId)) || null;
// Backlog rank as OpenProject's integer position: 1..n in rank order.
function positions(items) {
  const ranked = items.filter(i => i.scrum && typeof i.scrum.backlogRank === 'number')
    .sort((a, b) => a.scrum.backlogRank - b.scrum.backlogRank);
  return new Map(ranked.map((item, index) => [item.cardId, index + 1]));
}

// Kanboard task links, as getAllTaskLinks returns them for each task: `task_id`
// is the OTHER task and `label` the link type read from this task. Kanboard
// keeps every link from both ends, so each parent card and each dependency is
// written twice, the second time with the opposite label; the importer
// (parseKanboard) folds the two back into one. A link to a card that is not in
// the export has no task to point at and is left out.
const KANBOARD_LINK_LABEL = {
  'related-to': 'relates to', blocks: 'blocks', 'is-blocked-by': 'is blocked by',
  duplicates: 'duplicates', 'is-duplicated-by': 'is duplicated by',
  fixes: 'fixes', 'is-fixed-by': 'is fixed by',
};
const KANBOARD_OPPOSITE_LABEL = {
  'relates to': 'relates to', blocks: 'is blocked by', 'is blocked by': 'blocks',
  duplicates: 'is duplicated by', 'is duplicated by': 'duplicates',
  fixes: 'is fixed by', 'is fixed by': 'fixes',
  'is a child of': 'is a parent of', 'is a parent of': 'is a child of',
};
function kanboardTaskLinks(items) {
  const number = new Map(items.map((item, index) => [item.cardId, index + 1]));
  const links = items.map(() => []);
  const written = new Set();
  let id = 0;
  const add = (from, to, label) => {
    const key = `${from}>${to}:${label}`;
    if (from === to || written.has(key)) return;
    written.add(key);
    written.add(`${to}>${from}:${KANBOARD_OPPOSITE_LABEL[label]}`);
    links[from - 1].push({ id: id += 1, task_id: to, label });
    links[to - 1].push({ id: id += 1, task_id: from, label: KANBOARD_OPPOSITE_LABEL[label] });
  };
  items.forEach((item, index) => {
    const self = index + 1;
    const parent = number.get(item.parentCardId);
    if (parent) add(self, parent, 'is a child of');
    list(item.dependencies).forEach(dep => {
      const other = dep && number.get(dep.cardId);
      if (other) add(self, other, KANBOARD_LINK_LABEL[dep.type] || 'relates to');
    });
  });
  return links;
}

export const formatters = {
  // NextCloud Deck: board with stacks, each stack carrying its cards.
  deck: ({ board, lists, items }) => ({
    title: board.title,
    stacks: lists.map(l => ({
      title: l.title,
      cards: items
        .filter(i => i.listTitle === l.title)
        .map(i => ({
          title: i.title,
          description: i.description,
          duedate: i.dueAt,
          ...(Object.keys(i.timetracking || {}).length ? { timetracking: i.timetracking } : {}),
          labels: i.labels.map(name => ({ title: name })),
          ...(has(i.createdAt) ? { createdAt: i.createdAt } : {}),
          ...(has(i.endAt) ? { done: i.endAt } : {}),
          ...(has(i.owner) || list(i.assignees).length
            ? { assignedUsers: [i.owner, ...list(i.assignees)].filter(has).map(uid => ({ participant: { uid } })) } : {}),
          ...(has(i.creator) ? { owner: { uid: i.creator } } : {}),
          ...(list(i.comments).length ? { comments: i.comments.map(c => ({
            message: c.text, actorId: c.author, creationDateTime: c.date })) } : {}),
        })),
    })),
  }),
  // Kanboard: columns, swimlanes and tasks, the shape the Kanboard importer reads.
  // Tasks are numbered 1..n; parent cards and dependencies become task links.
  kanboard: ({ board, lists, swimlanes, items }) => {
    const links = kanboardTaskLinks(items);
    return {
      board: { name: board.title },
      columns: lists.map(l => ({ title: l.title })),
      swimlanes: swimlanes.map(s => ({ name: s.title })),
      tasks: items.map((i, index) => ({
        id: index + 1,
        title: i.title,
        description: i.description,
        column_name: i.listTitle,
        swimlane_name: i.swimlaneTitle,
        date_due: i.dueAt,
        ...(has(i.startAt) ? { date_started: i.startAt } : {}),
        ...(has(i.endAt) ? { date_completed: i.endAt } : {}),
        ...(has(i.createdAt) ? { date_creation: i.createdAt } : {}),
        ...(has(i.owner) ? { owner_username: i.owner } : {}),
        ...(has(i.creator) ? { creator_username: i.creator } : {}),
        tags: i.labels,
        ...(checklistItems(i).length ? { subtasks: checklistItems(i).map(x => ({ title: x.title, status: x.done ? 2 : 0 })) } : {}),
        ...(list(i.comments).length ? { comments: i.comments.map(c => ({
          comment: c.text, username: c.author, date_creation: c.date })) } : {}),
        ...(links[index].length ? { links: links[index] } : {}),
      })),
    };
  },
  // OpenProject: a work-packages collection with HAL links.
  openproject: collected => {
    const { items } = collected;
    const ids = numericIds(items);
    const planning = planningIndex(collected);
    const ranks = positions(items);
    const versions = [...planning.releases.values()].map(r => ({ _type: 'Version', id: r.number, name: r.name,
      ...(has(r.notes) ? { description: { raw: r.notes } } : {}),
      ...(r.plannedStart ? { startDate: day(r.plannedStart) } : {}), ...(r.plannedEnd ? { endDate: day(r.plannedEnd) } : {}),
      status: r.state === 'released' ? 'closed' : 'open' }));
    const sprints = [...planning.sprints.values()].map(sp => ({ _type: 'Sprint', id: sp.number, name: sp.name,
      ...(has(sp.goal) ? { description: { raw: sp.goal } } : {}),
      ...(sp.plannedStart ? { startDate: day(sp.plannedStart) } : {}), ...(sp.plannedEnd ? { finishDate: day(sp.plannedEnd) } : {}),
      _links: { self: { href: `/api/v3/sprints/${sp.number}`, title: sp.name },
        status: { href: `urn:openproject-org:api:v3:sprints:status:${OPENPROJECT_SPRINT_STATUS[sp.state] || 'in_planning'}`,
          title: OPENPROJECT_SPRINT_TITLE[sp.state] || 'In planning' } } }));
    const fieldNames = [...new Set(items.flatMap(i => Object.keys(i.customFields || {})))];
    const fieldKey = name => `customField${fieldNames.indexOf(name) + 1}`;
    return {
      _embedded: {
        ...(fieldNames.length ? { schemas: [Object.fromEntries(fieldNames.map(name => [fieldKey(name), { name }]))] } : {}),
        ...(versions.length ? { versions } : {}),
        ...(sprints.length ? { sprints } : {}),
        elements: items.map(i => ({
          id: ids.get(i.cardId),
          subject: i.title,
          description: { raw: i.description },
          dueDate: i.dueAt,
          ...(has(i.startAt) ? { startDate: i.startAt } : {}),
          ...(has(i.createdAt) ? { createdAt: i.createdAt } : {}),
          ...(ranks.has(i.cardId) ? { position: ranks.get(i.cardId) } : {}),
          ...Object.fromEntries(Object.entries(i.customFields || {}).map(([name, value]) => [fieldKey(name), value])),
          _links: {
            status: { title: i.listTitle },
            ...(releaseOf(planning, i) ? { version: { href: `/api/v3/versions/${releaseOf(planning, i).number}`,
              title: releaseOf(planning, i).name } } : {}),
            ...(sprintOf(planning, i) ? { sprint: { href: `/api/v3/sprints/${sprintOf(planning, i).number}`,
              title: sprintOf(planning, i).name } } : {}),
            ...(has(i.owner) ? { assignee: { title: i.owner } } : {}),
            ...(list(i.assignees).length ? { responsible: { title: i.assignees[0] } } : {}),
            ...(has(i.creator) ? { author: { title: i.creator } } : {}),
            ...(ids.has(i.parentCardId) ? { parent: { href: `/api/v3/work_packages/${ids.get(i.parentCardId)}` } } : {}),
          },
          ...(list(i.comments).length ? { _embedded: { activities: i.comments.map(c => ({
            _type: 'Activity::Comment', comment: { raw: c.text }, createdAt: c.date,
            _links: { user: { title: c.author } } })) } } : {}),
        })),
      },
    };
  },
  // GitHub / Gitea / Forgejo: an issues array.
  github: githubLike,
  gitea: githubLike,
  forgejo: githubLike,
  // GitLab: an Issues API v4 array, carrying what parseGitlab reads (#2698):
  // every assignee, the author, creation and close dates and comments as
  // notes. No iid: a re-import would then add a second "Source:" line.
  // Sprints and releases go out as each issue's iteration and milestone.
  gitlab: collected => {
    const planning = planningIndex(collected);
    return collected.items.map(i => ({
      title: i.title,
      description: i.description,
      state: isClosed(i.listTitle) ? 'closed' : 'opened',
      labels: i.labels,
      due_date: i.dueAt,
      ...(has(i.owner) ? { assignees: [i.owner, ...list(i.assignees)].map(username => ({ username })) } : {}),
      ...(has(i.creator) ? { author: { username: i.creator } } : {}),
      ...(has(i.createdAt) ? { created_at: i.createdAt } : {}),
      ...(isClosed(i.listTitle) && has(i.endAt) ? { closed_at: i.endAt } : {}),
      ...(list(i.comments).length ? { notes: i.comments.map(c => ({ body: c.text,
        author: { username: c.author }, created_at: c.date, system: false })) } : {}),
      ...(sprintOf(planning, i) ? { iteration: (sp => ({ id: sp.number, iid: sp.number, title: sp.name,
        description: sp.goal || '', state: GITLAB_ITERATION_STATE[sp.state] || 1,
        start_date: day(sp.plannedStart), due_date: day(sp.plannedEnd) }))(sprintOf(planning, i)) } : {}),
      ...(releaseOf(planning, i) ? { milestone: (r => ({ id: r.number, iid: r.number, title: r.name,
        description: r.notes || '', state: r.state === 'released' ? 'closed' : 'active',
        start_date: day(r.plannedStart), due_date: day(r.plannedEnd) }))(releaseOf(planning, i)) } : {}),
    }));
  },
  // Trello board JSON (round-trips with WeKan's Trello import).
  trello: ({ board, lists, items }) => ({
    name: board.title,
    prefs: { background: 'blue', permissionLevel: 'private' },
    labels: (board.labels || []).map(l => ({ id: l._id, name: l.name, color: l.color })),
    lists: lists.map(l => ({ id: l._id, name: l.title, closed: false })),
    cards: items.map(i => ({
      id: i.cardId,
      name: i.title,
      desc: i.description,
      idList: i.listId,
      due: i.dueAt || null,
      closed: false,
      idLabels: i.labelIds,
      idMembers: [],
      idChecklists: [],
    })),
    checklists: [],
    actions: [],
  }),
  // Jira issues collection (round-trips with WeKan's Jira import).
  jira: ({ board, items, jiraEstimateMapping }) => {
    const keys = new Map(items.map((item, idx) => [item.cardId, `WEKAN-${idx + 1}`]));
    const fieldNames = [...new Set(items.flatMap(i => Object.keys(i.customFields || {})))];
    const fieldKey = name => `customfield_${90000 + fieldNames.indexOf(name) + 1}`;
    return {
      board: { name: board.title },
      ...(jiraEstimateMapping ? {
        wekanScrumMapping: { estimateFieldId: jiraEstimateMapping.estimateFieldId, estimateUnit: jiraEstimateMapping.estimateUnit },
        schema: { [jiraEstimateMapping.estimateFieldId]: { type: 'number' } },
      } : {}),
      ...(fieldNames.length ? { names: Object.fromEntries(fieldNames.map(name => [fieldKey(name), name])) } : {}),
      issues: items.map(i => ({
        key: keys.get(i.cardId),
        fields: {
          summary: i.title,
          description: i.description,
          status: { name: i.listTitle, ...(i.jiraScrum?.statusCategory ? { statusCategory: i.jiraScrum.statusCategory } : {}) },
          ...(i.jiraScrum?.issuetype ? { issuetype: i.jiraScrum.issuetype } : {}),
          ...(i.jiraScrum?.fixVersions ? { fixVersions: i.jiraScrum.fixVersions } : {}),
          ...(i.jiraEstimate || {}),
          labels: i.labels,
          duedate: i.dueAt,
          ...(Object.keys(i.timetracking || {}).length ? { timetracking: i.timetracking } : {}),
          ...(has(i.createdAt) ? { created: i.createdAt } : {}),
          ...(has(i.owner) ? { assignee: { name: i.owner } } : {}),
          ...(has(i.requestedBy || i.creator) ? { reporter: { displayName: i.requestedBy || i.creator } } : {}),
          ...(keys.has(i.parentCardId) ? { parent: { key: keys.get(i.parentCardId) } } : {}),
          ...(checklistItems(i).length ? { subtasks: checklistItems(i).map(x => ({
            fields: { summary: x.title, status: { statusCategory: { key: x.done ? 'done' : 'new' } } } })) } : {}),
          ...(list(i.comments).length ? { comment: { comments: i.comments.map(c => ({
            body: c.text, author: { name: c.author }, created: c.date })) } } : {}),
          ...Object.fromEntries(Object.entries(i.customFields || {}).map(([name, value]) => [fieldKey(name), value])),
        },
      })),
    };
  },
  // Asana tasks (sections become the board columns).
  asana: ({ items }) => ({
    data: items.map(i => ({
      gid: i.cardId,
      name: i.title,
      notes: i.description,
      completed: isClosed(i.listTitle),
      ...(isClosed(i.listTitle) && has(i.endAt) ? { completed_at: i.endAt } : {}),
      due_on: i.dueAt,
      ...(has(i.startAt) ? { start_on: i.startAt } : {}),
      ...(has(i.createdAt) ? { created_at: i.createdAt } : {}),
      ...(has(i.owner) ? { assignee: { name: i.owner } } : {}),
      ...(has(i.parentCardId) ? { parent: { gid: i.parentCardId } } : {}),
      memberships: [{ section: { name: i.listTitle } }],
      tags: i.labels.map(name => ({ name })),
      ...(Object.keys(i.customFields || {}).length ? { custom_fields: Object.entries(i.customFields).map(([name, value]) =>
        (typeof value === 'number' ? { name, number_value: value } : { name, text_value: Array.isArray(value) ? value.join(', ') : String(value) })) } : {}),
      ...(checklistItems(i).length ? { subtasks: checklistItems(i).map(x => ({ name: x.title, completed: Boolean(x.done) })) } : {}),
      ...(list(i.comments).length ? { stories: i.comments.map(c => ({
        resource_subtype: 'comment_added', text: c.text, created_by: { name: c.author }, created_at: c.date })) } : {}),
    })),
  }),
  // ZenKit-style export (stages + items), the adapter shape the importer reads.
  zenkit: ({ board, lists, items }) => ({
    title: board.title,
    stages: lists.map(l => ({ name: l.title })),
    items: items.map(i => ({
      id: i.cardId,
      title: i.title,
      description: i.description,
      stage_name: i.listTitle,
      due: i.dueAt,
      tags: i.labels,
      ...(has(i.startAt) ? { start: i.startAt } : {}),
      ...(has(i.createdAt) ? { created_at: i.createdAt } : {}),
      ...(has(i.parentCardId) ? { parent_id: i.parentCardId } : {}),
      ...(has(i.owner) || list(i.assignees).length ? { assignees: [i.owner, ...list(i.assignees)].filter(has) } : {}),
      ...(Object.keys(i.customFields || {}).length ? { fields: i.customFields } : {}),
      ...(list(i.checklists).length ? { checklists: i.checklists.map(c => ({
        name: c.title, items: list(c.items).map(x => ({ text: x.title, checked: Boolean(x.done) })) })) } : {}),
      ...(list(i.comments).length ? { comments: i.comments.map(c => ({ text: c.text, author: c.author, date: c.date })) } : {}),
    })),
  }),
  // Markdown "task list" kanban - the convention several markdown-kanban tools
  // use (Obsidian Kanban and similar): `## List name` headings, `- [ ]`/`- [x]`
  // items underneath, indented continuation lines as the item's description.
  // Round-trips with parseMarkdownKanban in externalParsers.js. Returns a
  // plain string, not an object - the one formatter here that does.
  markdown: formatMarkdownKanban,
  // The Leo literate editor's .leo outline (XML): lists, cards and checklists
  // as nested nodes. Round-trips with parseLeo in leoOutline.js.
  leo: formatLeo,
  // todo.txt: one task per line; round-trips with parseTodoTxt (todoTxtFormat.js).
  todotxt: formatTodoTxt,
  // Taskwarrior's `task import` JSON; round-trips with parseTaskwarrior (taskwarriorFormat.js).
  taskwarrior: formatTaskwarrior,
  // Focalboard's archive text (header line and board.jsonl); round-trips with
  // parseFocalboard (focalboardFormat.js).
  focalboard: data => formatFocalboard(data),
  // A Todoist project template (CSV); round-trips with parseTodoistCsv (todoistCsvFormat.js).
  todoist: formatTodoistCsv,
  // Microsoft Planner's Excel export: rows that models/export.js writes as .xlsx
  // (server/lib/plannerWorkbook.js); round-trips with parsePlannerRows.
  planner: formatPlannerRows,
  // MeisterTask's CSV import shape; round-trips with parseMeisterTaskCsv.
  meistertask: formatMeisterTaskCsv,
  // The Obsidian Kanban plugin's board file; round-trips with parseObsidianKanban.
  obsidian: formatObsidianKanban,
  // Linear's CSV export columns; round-trips with parseLinearCsv.
  linear: formatLinearCsv,
  // TickTick's backup CSV; round-trips with parseTickTickCsv.
  ticktick: formatTickTickCsv,
  // ClickUp's workspace export columns; round-trips with parseClickUpCsv.
  clickup: formatClickUpCsv,
  // A Nullboard .nbx board file; round-trips with parseNullboard.
  nullboard: formatNullboard,
  // Kanri's single-board JSON export; round-trips with parseKanri (kanriFormat.js).
  kanri: formatKanri,
  // The stories CSV Pivotal Tracker's import reads; round-trips with parsePivotalCsv.
  pivotal: formatPivotalCsv,
  // The English CSV Redmine's issue import maps; round-trips with parseRedmineCsv.
  redmine: formatRedmineCsv,
  // A Tasks.org backup that its Import backup reads; round-trips with parseTasksOrgBackup.
  tasksorg: formatTasksOrgBackup,
  // monday.com's Excel import table: sheets models/export.js writes as .xlsx
  // (server/lib/mondayWorkbook.js); round-trips with parseMondaySheets.
  monday: formatMondaySheets,
  // Businessmap's Excel import columns: sheets models/export.js writes as .xlsx
  // (server/lib/businessmapWorkbook.js); round-trips with parseBusinessmapSheets.
  businessmap: formatBusinessmapSheets,
  // A Super Productivity backup its "Import from File" reads; round-trips
  // with parseSuperProductivity.
  superproductivity: collected => formatSuperProductivity(collected),
  // A Taiga project dump that Taiga's load_dump reads; round-trips with parseTaiga (taigaFormat.js).
  taiga: data => formatTaiga(data),
  // Vikunja's data export: projects that models/export.js writes as the .zip
  // (vikunjaArchiveFiles, server/lib/vikunjaArchive.js); round-trips with parseVikunjaExport.
  vikunja: data => formatVikunja(data),
  // Wrike's Excel import template: rows models/export.js writes as .xlsx
  // (server/lib/wrikeWorkbook.js); round-trips with parseWrikeRows.
  wrike: formatWrikeRows,
  // The board's lists as a Wrike workflow, in the JSON Wrike's GET /workflows
  // returns (models/lib/wrikeWorkflow.js): the workflow the wrike export's
  // Workflow and Custom Status cells name.
  wrikeworkflow: formatWrikeWorkflow,
  // Teamwork.com's Excel task import template: rows models/export.js writes as
  // .xlsx (server/lib/teamworkWorkbook.js); round-trips with parseTeamworkSheet.
  teamwork: formatTeamworkSheet,
  // The CSV Quire's Import CSV reads; round-trips with parseQuireCsv (quireCsvFormat.js).
  quire: formatQuireCsv,
  // The CSV Notion's CSV import reads; round-trips with parseNotionExport (notionFormat.js).
  notion: formatNotionCsv,
  // An OPML outline; round-trips with parseOpml (opmlOutline.js, server-only).
  opml: formatOpml,
  // An Org mode outline; round-trips with parseOrgMode (orgModeFormat.js).
  orgmode: formatOrgMode,
};

export const EXTERNAL_EXPORT_FORMATS = Object.keys(formatters);
