import { ReactiveCache } from '/imports/reactiveCache';
import { formatMarkdownKanban } from './markdownKanbanFormat';
const { jiraTimeTrackingExport } = require('./jiraTimeTracking');
const { jiraScrumMetadataExport } = require('./jiraScrumMetadata');
const { jiraEstimateExportMapping, jiraEstimateExportValue } = require('./jiraEstimateMapping');

// Generalized export: collect a WeKan board into a neutral intermediate, then a
// per-format formatter emits the target platform's JSON shape. This mirrors the
// generalized import (externalParsers.js): one collector + a map of formatters.

// #1173: what the export selection can reach in these formats.
//
// A Trello, Jira or GitHub export is a card's title, description, due date and
// labels; Jira also carries time tracking, gated during collection by Dates
// and Custom Fields. These formats have no comments, checklists or attachments.
// Selection gates the parts that ARE here and nothing else, which is the
// honest answer: a format drops what it has.
function gateItem(item, wanted) {
  if (!wanted) return item;
  const out = { ...item };
  if (!wanted.has('description')) out.description = '';
  if (!wanted.has('labels')) { out.labelIds = []; out.labels = []; }
  if (!wanted.has('dates')) delete out.dueAt;
  return out;
}

async function collect(boardId, fields, format) {
  const board = await ReactiveCache.getBoard(boardId);
  const lists = await ReactiveCache.getLists({ boardId, archived: false }, { sort: { sort: 1 } });
  const swimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: false }, { sort: { sort: 1 } });
  const cards = await ReactiveCache.getCards({ boardId, archived: false }, { sort: { sort: 1 } });
  const listById = {};
  const listRecords = new Map(lists.map(list => [list._id, list]));
  lists.forEach(l => { listById[l._id] = l.title; });
  const swById = {};
  swimlanes.forEach(s => { swById[s._id] = s.title; });
  const labelById = {};
  (board.labels || []).forEach(l => { labelById[l._id] = l.name; });
  const wanted = fields && fields.length ? new Set(fields) : null;
  const timeFields = format === 'jira' && (!wanted || wanted.has('custom-fields'))
    ? await ReactiveCache.getCustomFields({ boardIds: boardId, type: 'number' }) : [];
  const estimateMapping = format === 'jira' ? jiraEstimateExportMapping(timeFields, wanted) : null;
  const items = cards.map(c => ({
    ...(format === 'jira' ? { jiraEstimate: jiraEstimateExportValue(c, estimateMapping) } : {}),
    ...(format === 'jira' ? { timetracking: jiraTimeTrackingExport(c, timeFields, wanted) } : {}),
    ...(format === 'jira' ? { jiraScrum: jiraScrumMetadataExport(c, listRecords.get(c.listId), wanted) } : {}),
    cardId: c._id,
    listId: c.listId,
    title: c.title,
    description: c.description || '',
    listTitle: listById[c.listId] || '',
    swimlaneTitle: swById[c.swimlaneId] || 'Default',
    dueAt: c.dueAt ? new Date(c.dueAt).toISOString() : undefined,
    labelIds: c.labelIds || [],
    labels: (c.labelIds || []).map(id => labelById[id]).filter(Boolean),
  }));
  return { board, lists, swimlanes, jiraEstimateMapping: estimateMapping,
    items: items.map(item => gateItem(item, wanted)) };
}

// A WeKan list maps to a "closed" issue state when its name looks terminal.
function isClosed(listTitle) {
  return /done|closed|complete|archiv|finished/i.test(listTitle || '');
}

const githubLike = ({ items }) =>
  items.map(i => ({
    title: i.title,
    body: i.description,
    state: isClosed(i.listTitle) ? 'closed' : 'open',
    labels: i.labels.map(name => ({ name })),
    due_date: i.dueAt,
  }));

const formatters = {
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
        })),
    })),
  }),
  // OpenProject: a work-packages collection.
  openproject: ({ items }) => ({
    _embedded: {
      elements: items.map(i => ({
        subject: i.title,
        description: { raw: i.description },
        dueDate: i.dueAt,
        _links: { status: { title: i.listTitle } },
      })),
    },
  }),
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
  jira: ({ board, items, jiraEstimateMapping }) => ({
    board: { name: board.title },
    ...(jiraEstimateMapping ? {
      wekanScrumMapping: { estimateFieldId: jiraEstimateMapping.estimateFieldId, estimateUnit: jiraEstimateMapping.estimateUnit },
      schema: { [jiraEstimateMapping.estimateFieldId]: { type: 'number' } },
    } : {}),
    issues: items.map((i, idx) => ({
      key: `WEKAN-${idx + 1}`,
      fields: {
        summary: i.title,
        description: i.description,
        status: { name: i.listTitle, ...(i.jiraScrum?.statusCategory ? { statusCategory: i.jiraScrum.statusCategory } : {}) },
        ...(i.jiraScrum?.issuetype ? { issuetype: i.jiraScrum.issuetype } : {}),
        ...(i.jiraEstimate || {}),
        labels: i.labels,
        duedate: i.dueAt,
        ...(Object.keys(i.timetracking || {}).length ? { timetracking: i.timetracking } : {}),
      },
    })),
  }),
  // Asana tasks (sections become the board columns).
  asana: ({ items }) => ({
    data: items.map(i => ({
      name: i.title,
      notes: i.description,
      completed: isClosed(i.listTitle),
      due_on: i.dueAt,
      memberships: [{ section: { name: i.listTitle } }],
      tags: i.labels.map(name => ({ name })),
    })),
  }),
  // ZenKit-style export (stages + items).
  zenkit: ({ board, lists, items }) => ({
    title: board.title,
    stages: lists.map(l => ({ name: l.title })),
    items: items.map(i => ({
      title: i.title,
      description: i.description,
      stage_name: i.listTitle,
      due: i.dueAt,
      tags: i.labels,
    })),
  }),
  // Markdown "task list" kanban - the convention several markdown-kanban tools
  // use (Obsidian Kanban and similar): `## List name` headings, `- [ ]`/`- [x]`
  // items underneath, indented continuation lines as the item's description.
  // Round-trips with parseMarkdownKanban in externalParsers.js. Returns a
  // plain string, not an object - the one formatter here that does.
  markdown: formatMarkdownKanban,
};

export const EXTERNAL_EXPORT_FORMATS = Object.keys(formatters);

export async function buildExternalExport(boardId, format, fields) {
  const formatter = formatters[format];
  if (!formatter) return null;
  const formatted = formatter(await collect(boardId, fields, format));
  return require('/server/lib/secureTransfer').secureTransfer(formatted, {
    direction: 'export', source: `export:${format}`,
  });
}
