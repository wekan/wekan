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
  kanboard: ({ board, lists, swimlanes, items }) => ({
    board: { name: board.title },
    columns: lists.map(l => ({ title: l.title })),
    swimlanes: swimlanes.map(s => ({ name: s.title })),
    tasks: items.map(i => ({
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
    })),
  }),
  // OpenProject: a work-packages collection with HAL links.
  openproject: ({ items }) => {
    const ids = numericIds(items);
    const fieldNames = [...new Set(items.flatMap(i => Object.keys(i.customFields || {})))];
    const fieldKey = name => `customField${fieldNames.indexOf(name) + 1}`;
    return {
      _embedded: {
        ...(fieldNames.length ? { schemas: [Object.fromEntries(fieldNames.map(name => [fieldKey(name), { name }]))] } : {}),
        elements: items.map(i => ({
          id: ids.get(i.cardId),
          subject: i.title,
          description: { raw: i.description },
          dueDate: i.dueAt,
          ...(has(i.startAt) ? { startDate: i.startAt } : {}),
          ...(has(i.createdAt) ? { createdAt: i.createdAt } : {}),
          ...Object.fromEntries(Object.entries(i.customFields || {}).map(([name, value]) => [fieldKey(name), value])),
          _links: {
            status: { title: i.listTitle },
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
  // GitLab: issues array (state "opened"/"closed", string labels).
  gitlab: ({ items }) =>
    items.map(i => ({
      title: i.title,
      description: i.description,
      state: isClosed(i.listTitle) ? 'closed' : 'opened',
      labels: i.labels,
      due_date: i.dueAt,
    })),
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
};

export const EXTERNAL_EXPORT_FORMATS = Object.keys(formatters);
