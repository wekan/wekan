// Plane's issue export (Workspace Settings > Exports), read in plain
// JavaScript so tests/planeFormat.test.cjs runs it in Node. Plane writes a
// .zip with one file per project, or one for the workspace, as CSV, JSON or
// XLSX (apps/api/plane/bgtasks/export_task.py); server/lib/planeArchive.js
// opens the zip and the workbook, and this module reads what is inside.
//
// Every variant carries the fields of Plane's IssueExportSerializer
// (apps/api/plane/utils/porters/serializers/issue.py), in this order:
//
//   project_name, project_identifier, parent, identifier, sequence_id, name,
//   state_name, priority, assignees, subscribers, created_by_name,
//   start_date, target_date, completed_at, created_at, updated_at,
//   archived_at, estimate, labels, cycles, modules, links, relations,
//   comments, sub_issues_count, link_count, attachment_count, is_draft
//
// - JSON is the list of those objects (json.dumps with default=str).
// - CSV has the keys as headers prettified ("state_name" -> "State Name"),
//   lists written as JSON text, and a ' before any text that starts with
//   = + - @ or a tab or line break (plane/utils/csv_utils.py).
// - XLSX has the same headers and guard, but lists are joined with ", " and
//   their items written with Python's str(): names come back, while the
//   links, relations and comments (lists of dicts) are Python text, not JSON,
//   and are reported rather than guessed at.
//
// An issue maps to:
//   state_name                   -> a list, in the order states first appear
//   project_name                 -> a swimlane when the export has several
//                                   projects; with one, the board's name
//   identifier / parent          -> the card's reference / its parent card
//   name                         -> title
//   assignees                    -> owner, then further assignees
//   created_by_name              -> Requested by
//   subscribers                  -> watchers (when mapped to members)
//   labels                       -> labels
//   start_date, target_date,
//   completed_at, created_at     -> start, due, end and created dates
//   archived_at (any date)       -> an archived card
//   priority, estimate,
//   cycles, modules              -> the custom fields Priority, Estimate,
//                                   Cycle and Module ("none" is left out)
//   links                        -> a Links section in the description
//   relations                    -> card dependencies: blocked_by,
//                                   relates_to and duplicate
//   comments                     -> comments
// The export has no description (the serializer leaves it out), no
// attachments (only attachment_count) and no state order or colors; those are
// reported, as are updated_at, draft issues, the start_before,
// finish_before and implemented_by relations, and unknown fields.

import { readCsv } from './todoistCsvFormat.js';
import { markdownLink } from './markdownLink.js';

export const PLANE_FIELDS = ['project_name', 'project_identifier', 'parent', 'identifier', 'sequence_id', 'name',
  'state_name', 'priority', 'assignees', 'subscribers', 'created_by_name', 'start_date', 'target_date',
  'completed_at', 'created_at', 'updated_at', 'archived_at', 'estimate', 'labels', 'cycles', 'modules', 'links',
  'relations', 'comments', 'sub_issues_count', 'link_count', 'attachment_count', 'is_draft'];
// Plane's Issue.PRIORITY_CHOICES, without "none".
export const PLANE_PRIORITIES = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
// IssueRelation.relation_type as WeKan dependency types, from the side of the
// issue the relation is stored on (outgoing) and of the other one (incoming).
// Plane stores "A blocking B" as B blocked_by A (app/views/issue/relation.py).
export const PLANE_RELATIONS = {
  blocked_by: { outgoing: 'is-blocked-by', incoming: 'blocks' },
  relates_to: { outgoing: 'related-to', incoming: 'related-to' },
  duplicate: { outgoing: 'duplicates', incoming: 'is-duplicated-by' },
};
const INVERSE = { 'is-blocked-by': 'blocks', blocks: 'is-blocked-by', 'related-to': 'related-to',
  duplicates: 'is-duplicated-by', 'is-duplicated-by': 'duplicates' };
const LISTS = ['assignees', 'subscribers', 'labels', 'cycles', 'modules', 'links', 'relations', 'comments'];
const NAME_LISTS = ['assignees', 'subscribers', 'labels', 'cycles', 'modules'];
// Derived counts and the sequence number already in the identifier.
const DERIVED = new Set(['sequence_id', 'sub_issues_count', 'link_count']);
export const MAX_PLANE_ISSUES = 20000;
const MAX_PLANE_TEXT = 64 * 1024 * 1024;
const NO_STATE = 'No state';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = value => (value === undefined || value === null ? '' : String(value));
// Plane's csv_utils guard: a ' before = + - @ or a tab or line break.
const unformula = value => (typeof value === 'string' ? value.replace(/^'(?=[=+\-@\t\r\n])/, '') : value);

// "Created By Name" -> created_by_name, as Plane's own CSVFormatter.decode reads it.
const headerKey = header => unformula(str(header)).trim().toLowerCase().replace(/ /g, '_');

// A start_date / target_date (YYYY-MM-DD) is a calendar day in UTC; the *_at
// fields are ISO 8601, and a comment's created_at is "%Y-%m-%d %H:%M:%S" in UTC.
export function planeDate(value) {
  const text = str(value).trim();
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? undefined : date.toISOString();
  }
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(Z|[+-]\d{2}:?\d{2})?$/.exec(text);
  if (!match) return undefined;
  const date = new Date(`${match[1]}T${match[2]}${match[3] || 'Z'}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// One file's issues as objects with Plane's snake_case keys.
function jsonIssues(text, at) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Plane export ${at} is not valid JSON`);
  }
  if (!Array.isArray(parsed)) throw new Error(`Plane export ${at} is not a list of issues`);
  return parsed;
}

function tableIssues(rows, format, at, unsupported) {
  const cells = rows.filter(row => Array.isArray(row) && row.some(cell => str(cell).trim() !== ''));
  if (!cells.length) return [];
  const header = cells[0].map(headerKey);
  if (!header.includes('name') || !header.includes('state_name')) {
    throw new Error(`Plane export ${at} needs the Name and State Name columns`);
  }
  return cells.slice(1).map((row, index) => {
    const issue = { __format: format, __row: index + 2 };
    header.forEach((key, column) => {
      if (!key) return;
      let value = row[column];
      if (typeof value === 'string') value = unformula(value);
      if (LISTS.includes(key)) {
        const text = str(value).trim();
        if (format === 'csv') {
          // CSVFormatter writes every list as json.dumps text.
          try {
            const list = text ? JSON.parse(text) : [];
            value = Array.isArray(list) ? list : [];
          } catch (error) {
            unsupported.push({ path: `${at}/row/${index + 2}/${key}`, reason: `Plane ${key} "${text.slice(0, 80)}" is not a JSON list` });
            value = [];
          }
        } else if (NAME_LISTS.includes(key)) {
          // XLSXFormatter joins the names with ", ".
          value = text ? text.split(', ').map(name => name.trim()).filter(Boolean) : [];
        } else {
          if (text) unsupported.push({ path: `${at}/row/${index + 2}/${key}`, reason: `Plane's XLSX export writes ${key} as Python text, not JSON; it is not imported (use the JSON or CSV export)` });
          value = [];
        }
      }
      issue[key] = value;
    });
    return issue;
  });
}

// What reached the parser: the text of one JSON or CSV file, a parsed JSON
// list, or { files: [{ name, format, content | rows }] } from planeArchive.js.
function issuesOf(input, unsupported) {
  if (Array.isArray(input)) return input.map(issue => issue);
  if (typeof input === 'string') {
    if (input.length > MAX_PLANE_TEXT) throw new Error('Plane export is too large');
    const text = input.replace(/^\uFEFF/, '').trim();
    if (!text) throw new Error('Plane export is empty');
    if (text.startsWith('[')) return jsonIssues(text, 'text');
    return tableIssues(readCsv(text, 'Plane'), 'csv', '/csv', unsupported);
  }
  if (isObject(input) && Array.isArray(input.files)) {
    if (!input.files.length) throw new Error('Plane export has no .json, .csv or .xlsx file');
    return input.files.flatMap(file => {
      const at = `/${str(file && file.name) || 'file'}`;
      if (file.format === 'json') return jsonIssues(str(file.content).replace(/^\uFEFF/, ''), at);
      if (file.format === 'csv') return tableIssues(readCsv(str(file.content), 'Plane'), 'csv', at, unsupported);
      if (file.format === 'xlsx') return tableIssues(Array.isArray(file.rows) ? file.rows : [], 'xlsx', at, unsupported);
      throw new Error(`Plane export file ${at} is not JSON, CSV or XLSX`);
    });
  }
  throw new Error('Plane export is not a JSON list, a CSV table or an export .zip');
}

const truthy = value => value === true || /^true$/i.test(str(value).trim());
const names = value => (Array.isArray(value) ? value : []).map(item => str(item).trim()).filter(Boolean);

function relationKey(from, to, type) {
  if (type === 'related-to') return `related:${[from, to].sort().join(':')}`;
  return `${from}:${type}:${to}`;
}

// A Markdown list of the issue's links (Plane's export has no description, so
// the links are the only text that goes there).
function linksText(links, at, unsupported) {
  const lines = [];
  (Array.isArray(links) ? links : []).forEach((link, index) => {
    const url = str(isObject(link) ? link.url : link).trim();
    if (!/^(https?:|mailto:)/i.test(url)) {
      if (url) unsupported.push({ path: `${at}/links/${index}`, reason: `Plane link "${url.slice(0, 80)}" is not an http(s) or mailto link and is not imported` });
      return;
    }
    const title = str(isObject(link) ? link.title : '').trim() || url;
    lines.push(`- ${markdownLink(title, url)}`);
  });
  return lines.length ? `Links:\n${lines.join('\n')}` : '';
}

export function parsePlaneExport(input) {
  const unsupported = [];
  const issues = issuesOf(input, unsupported);
  if (issues.length > MAX_PLANE_ISSUES) throw new Error(`Plane export has more than ${MAX_PLANE_ISSUES} issues`);
  if (!issues.length) throw new Error('Plane export has no issues');
  // The serializer has no description: say so once rather than per issue.
  unsupported.push({ path: '/description', reason: 'Plane\'s export does not include issue descriptions; cards are imported without them' });

  const projectsByKey = new Map();
  const unknown = new Set();
  const columns = [];
  const tasks = [];
  const relations = new Set();
  let updated = false;

  issues.forEach((raw, index) => {
    const at = raw && raw.__row ? `/row/${raw.__row}` : `/issues/${index}`;
    if (!isObject(raw)) { unsupported.push({ path: at, reason: 'a Plane issue that is not an object is not imported' }); return; }
    Object.keys(raw).forEach(key => { if (!key.startsWith('__') && !PLANE_FIELDS.includes(key)) unknown.add(key); });
    const title = str(unformula(raw.name)).trim();
    if (!title) { unsupported.push({ path: at, reason: 'a Plane issue without a name is not imported' }); return; }
    const text = key => str(unformula(raw[key])).trim();

    const identifierKey = text('project_identifier');
    const projectName = text('project_name') || identifierKey || 'Default';
    const projectKey = identifierKey || projectName;
    if (!projectsByKey.has(projectKey)) projectsByKey.set(projectKey, projectName);
    const state = text('state_name') || NO_STATE;
    if (!columns.includes(state)) columns.push(state);

    const sequence = text('sequence_id');
    const ref = text('identifier') || (identifierKey && sequence ? `${identifierKey}-${sequence}` : '');
    const date = key => {
      const value = text(key);
      const iso = planeDate(value);
      if (value && !iso) unsupported.push({ path: `${at}/${key}`, reason: `Plane date "${value.slice(0, 40)}" is not an ISO 8601 date` });
      return iso;
    };

    const custom = {};
    const priority = text('priority').toLowerCase();
    if (PLANE_PRIORITIES[priority]) custom.Priority = PLANE_PRIORITIES[priority];
    else if (priority && priority !== 'none') unsupported.push({ path: `${at}/priority`, reason: `Plane priority "${priority}" is not one of urgent, high, medium, low or none` });
    const estimate = text('estimate');
    if (estimate) custom.Estimate = Number.isFinite(Number(estimate)) ? Number(estimate) : estimate;
    const cycles = names(raw.cycles);
    if (cycles.length) custom.Cycle = cycles.join(', ');
    const modules = names(raw.modules);
    if (modules.length) custom.Module = modules.join(', ');

    const people = [...new Set(names(raw.assignees))];
    const watchers = [...new Set(names(raw.subscribers))];
    const archived = text('archived_at');
    if (archived) date('archived_at');
    if (text('updated_at')) updated = true;
    if (truthy(raw.is_draft)) unsupported.push({ path: `${at}/is_draft`, reason: 'a Plane draft issue is imported as an ordinary card' });
    const attachments = Number(text('attachment_count'));
    if (Number.isFinite(attachments) && attachments > 0) {
      unsupported.push({ path: `${at}/attachment_count`, reason: `${attachments} attachment(s) are not in Plane's export and are not imported` });
    }

    const description = linksText(raw.links, at, unsupported);
    const comments = (Array.isArray(raw.comments) ? raw.comments : []).filter(isObject).map(comment => {
      const author = str(comment.created_by).trim();
      const when = planeDate(comment.created_at);
      return { text: str(comment.comment), ...(author ? { author } : {}), ...(when ? { date: when } : {}) };
    }).filter(comment => comment.text.trim());

    const dependencies = [];
    (Array.isArray(raw.relations) ? raw.relations : []).filter(isObject).forEach(relation => {
      const kind = str(relation.type).trim();
      const other = str(relation.issue).trim();
      const direction = relation.direction === 'incoming' ? 'incoming' : 'outgoing';
      const mapped = PLANE_RELATIONS[kind];
      if (!mapped) {
        unsupported.push({ path: `${at}/relations`, reason: `Plane "${kind}" relations have no WeKan dependency type and are not imported` });
        return;
      }
      const type = mapped[direction];
      if (!ref || !other) return;
      // Plane lists a relation on both issues; it is kept once.
      if (relations.has(relationKey(ref, other, type)) || relations.has(relationKey(other, ref, INVERSE[type]))) return;
      relations.add(relationKey(ref, other, type));
      dependencies.push({ ref: other, type });
    });

    const parent = text('parent');
    const created = date('created_at');
    const started = date('start_date');
    const due = date('target_date');
    const ended = date('completed_at');
    tasks.push({
      title,
      description,
      column_name: state,
      swimlane_key: projectKey,
      tags: [...new Set(names(raw.labels))],
      ...(ref ? { ref } : {}),
      ...(parent ? { parent_ref: parent } : {}),
      ...(people.length ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
      ...(watchers.length ? { watchers } : {}),
      ...(text('created_by_name') ? { requested_by: text('created_by_name') } : {}),
      ...(created ? { date_creation: created } : {}),
      ...(started ? { date_started: started } : {}),
      ...(due ? { date_due: due } : {}),
      ...(ended ? { date_end: ended } : {}),
      ...(archived ? { archived: true } : {}),
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
      ...(comments.length ? { comments } : {}),
      ...(dependencies.length ? { dependencies } : {}),
    });
  });

  if (updated) unsupported.push({ path: '/updated_at', reason: 'Plane\'s updated_at has no WeKan place and is not imported' });
  [...unknown].filter(key => !DERIVED.has(key)).sort().forEach(key => {
    unsupported.push({ path: `/fields/${key}`, reason: `Plane field "${key}" has no WeKan place and is not imported` });
  });

  // Swimlanes: one per project when there are several; a project name that
  // two identifiers share is told apart by the identifier.
  const projectNames = [...projectsByKey.values()];
  const swimlaneOf = new Map([...projectsByKey.entries()].map(([key, name]) => [key,
    projectsByKey.size === 1 ? 'Default'
      : projectNames.filter(other => other === name).length > 1 ? `${name} (${key})` : name]));
  tasks.forEach(task => {
    task.swimlane_name = swimlaneOf.get(task.swimlane_key);
    delete task.swimlane_key;
  });
  return {
    board: { name: projectsByKey.size === 1 ? projectNames[0] : 'Imported Plane issues' },
    columns: (columns.length ? columns : [NO_STATE]).map(title => ({ title })),
    swimlanes: [...new Set(swimlaneOf.values())].map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}
