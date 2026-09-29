import { jiraTimeTracking } from './jiraTimeTracking.js';
import { parseTodoTxt } from './todoTxtFormat.js';
// Jira Cloud v3 descriptions use Atlassian Document Format, not strings.
// Preserve readable text and block boundaries; rich source formatting is not
// treated as trusted HTML. Input has already passed the import security boundary.
export function adfPlainText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const walk = node => {
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'text') return typeof node.text === 'string' ? node.text : '';
    if (node.type === 'hardBreak') return '\n';
    if (node.type === 'mention' || node.type === 'emoji') return node.attrs?.text || '';
    if (node.type === 'inlineCard') return node.attrs?.url || '';
    const text = (Array.isArray(node.content) ? node.content : []).map(walk).join('');
    return ['paragraph', 'heading', 'listItem', 'codeBlock', 'tableRow'].includes(node.type)
      ? text.replace(/\n+$/, '') + '\n' : text;
  };
  return walk(value).replace(/\n+$/, '');
}

// Parsers that normalize exports/API responses from other tools into the common
// "Kanboard shape" { board, columns, swimlanes, tasks } that KanboardCreator
// consumes. Each is best-effort and tolerant of missing fields.
//
// A normalized task: { title, description, column_name, swimlane_name,
//   date_due, owner_username, tags: [string] }.

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// --- Kanboard ---------------------------------------------------------------
// Kanboard has no single-file export; its JSON-RPC API is assembled into
// { board, columns, swimlanes, categories, tasks }, each task carrying what
// getAllSubtasks / getAllComments / getTaskTags / getAllTaskFiles /
// getAllTaskLinks returned for it. Ids resolve through the sibling arrays so
// a task with only column_id/swimlane_id/category_id still lands correctly.
const KANBOARD_COLORS = {
  yellow: 'yellow', blue: 'blue', green: 'green', purple: 'purple', red: 'red',
  orange: 'orange', grey: 'gray', brown: 'saddlebrown', deep_orange: 'crimson',
  dark_grey: 'black', pink: 'pink', teal: 'paleturquoise', cyan: 'sky',
  lime: 'lime', light_green: 'darkgreen', amber: 'gold',
};

function byId(items, nameKeys) {
  const map = {};
  (Array.isArray(items) ? items : []).forEach(item => {
    if (!item || item.id === undefined || item.id === null) return;
    const name = nameKeys.map(k => item[k]).find(v => typeof v === 'string' && v);
    if (name) map[String(item.id)] = name;
  });
  return map;
}

function kanboardTags(tags) {
  if (Array.isArray(tags)) return tags.map(t => (typeof t === 'string' ? t : t && t.name)).filter(Boolean);
  // getTaskTags returns { "<tag id>": "<name>" }.
  if (tags && typeof tags === 'object') return Object.values(tags).filter(t => typeof t === 'string' && t);
  return [];
}

export function parseKanboard(data) {
  const columnNames = byId(data.columns, ['title', 'name']);
  const swimlaneNames = byId(data.swimlanes, ['name', 'title']);
  const categoryNames = byId(data.categories, ['name']);
  const unsupported = [];
  const rawTasks = Array.isArray(data) ? data : Array.isArray(data.tasks) ? data.tasks : [];
  const tasks = rawTasks.map((task, index) => {
    const at = `/tasks/${index}`;
    const tags = kanboardTags(task.tags);
    const category = task.category_name || categoryNames[String(task.category_id)];
    if (category) tags.push(category);
    const priority = Number(task.priority);
    if (Number.isFinite(priority) && priority > 0) tags.push(`priority:${priority}`);
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const estimated = Number(task.time_estimated);
    if (Number.isFinite(estimated) && estimated > 0) {
      unsupported.push({ path: `${at}/time_estimated`, reason: 'WeKan cards have no estimate field; map it to a custom field by hand' });
    }
    for (const key of ['files', 'links', 'external_links']) {
      if (Array.isArray(task[key]) && task[key].length) {
        unsupported.push({
          path: `${at}/${key}`,
          reason: key === 'files'
            ? `${task[key].length} file(s): the API export carries metadata, not file contents`
            : `${task[key].length} task link(s) are not imported`,
        });
      }
    }
    const footer = task.url ? `Source: ${task.url}` : '';
    return {
      title: task.title || 'Imported task',
      description: [task.description || '', footer].filter(Boolean).join('\n\n'),
      column_name: task.column_name || task.column_title || columnNames[String(task.column_id)],
      swimlane_name: task.swimlane_name || swimlaneNames[String(task.swimlane_id)],
      date_due: task.date_due,
      date_started: task.date_started,
      date_end: task.date_completed,
      date_creation: task.date_creation,
      archived: task.is_active === '0' || task.is_active === 0 || task.is_active === false,
      color: KANBOARD_COLORS[task.color_id] || undefined,
      spent_hours: task.time_spent,
      owner_id: task.owner_id,
      owner_username: task.owner_username || task.assignee_username,
      owner_name: task.owner_name || task.assignee_name,
      requested_by: task.creator_username || task.creator_name || undefined,
      tags: uniq(tags),
      checklists: subtasks.length ? [{
        title: 'Subtasks',
        items: subtasks.map(sub => ({ title: sub && sub.title, done: String(sub && sub.status) === '2' })),
      }] : [],
      comments: (Array.isArray(task.comments) ? task.comments : []).map(comment => ({
        text: comment && comment.comment,
        author: comment && (comment.username || comment.name),
        date: comment && comment.date_creation,
      })),
    };
  });
  return {
    board: { name: (data.board && (data.board.name || data.board.title)) || data.name || 'Imported Kanboard project' },
    columns: Array.isArray(data.columns) && data.columns.length
      ? data.columns.map(c => ({ title: c.title || c.name })).filter(c => c.title)
      : uniq(tasks.map(t => t.column_name)).map(title => ({ title })),
    swimlanes: Array.isArray(data.swimlanes) && data.swimlanes.length
      ? data.swimlanes.map(s => ({ name: s.name || s.title })).filter(s => s.name)
      : [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// --- NextCloud Deck ---------------------------------------------------------
// Accepts a Deck board with stacks (each stack carrying its cards), the shape
// of GET /boards/{id} plus /stacks in the Deck REST API. Comments come from
// the separate OCS comments API and are read from `card.comments` when the
// export embedded them. Trashed stacks and cards (a non-zero `deletedAt`) are
// skipped; sharing (acl) is never imported, because naming a user in a file
// must not grant them access to the new board.
function deckUser(user) {
  if (!user) return undefined;
  if (typeof user === 'string') return user;
  const who = user.participant || user;
  return who.uid || who.primaryKey || who.displayname || undefined;
}

function deckLive(item) {
  return item && !(Number(item.deletedAt) > 0);
}

function byOrder(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

export function parseNextcloudDeck(data) {
  const board = data.board || data;
  const allStacks = Array.isArray(board.stacks) ? board.stacks : Array.isArray(data.stacks) ? data.stacks : [];
  const stacks = allStacks.filter(deckLive).sort(byOrder);
  const unsupported = [];
  const warnings = [];
  const trashed = allStacks.length - stacks.length;
  if (trashed) warnings.push({ path: '/stacks', reason: `${trashed} deleted stack(s) skipped` });
  if (Array.isArray(board.acl) && board.acl.length) {
    unsupported.push({ path: '/acl', reason: `${board.acl.length} sharing rule(s): board access is granted in WeKan, not by an import` });
  }
  const tasks = [];
  stacks.forEach(stack => {
    const stackIndex = allStacks.indexOf(stack);
    const cards = (Array.isArray(stack.cards) ? stack.cards : []);
    const live = cards.filter(deckLive).sort(byOrder);
    if (cards.length !== live.length) {
      warnings.push({ path: `/stacks/${stackIndex}/cards`, reason: `${cards.length - live.length} deleted card(s) skipped` });
    }
    live.forEach(card => {
      const at = `/stacks/${stackIndex}/cards/${cards.indexOf(card)}`;
      const people = (Array.isArray(card.assignedUsers) ? card.assignedUsers : []).map(deckUser).filter(Boolean);
      const attachments = Array.isArray(card.attachments) ? card.attachments.length : Number(card.attachmentCount) || 0;
      if (attachments) {
        unsupported.push({ path: `${at}/attachments`, reason: `${attachments} attachment(s) are Nextcloud files, not part of the export` });
      }
      tasks.push({
        title: card.title || 'Imported card',
        description: card.description || '',
        column_name: stack.title,
        swimlane_name: 'Default',
        date_due: card.duedate || card.dueDate,
        date_creation: card.createdAt,
        // Deck 1.13+ marks a card done with a timestamp.
        date_end: card.done || undefined,
        archived: card.archived === true,
        owner_username: people[0] || deckUser(card.owner),
        assignees: people.slice(1),
        requested_by: deckUser(card.owner),
        tags: (card.labels || []).map(l => (typeof l === 'string' ? l : l && l.title)).filter(Boolean),
        comments: (Array.isArray(card.comments) ? card.comments : []).map(comment => ({
          text: comment && comment.message,
          author: comment && (comment.actorId || comment.actorDisplayName),
          date: comment && comment.creationDateTime,
        })),
      });
    });
  });
  return {
    board: { name: board.title || 'Imported NextCloud Deck board' },
    columns: stacks.map(s => ({ title: s.title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings,
    unsupported,
  };
}

// --- OpenProject ------------------------------------------------------------
// Accepts a work-packages collection (GET /api/v3/work_packages), i.e.
// { _embedded: { elements: [ { id, subject, description:{raw}, startDate,
//   dueDate, spentTime:"PT1H30M", _links:{ status, type, priority, assignee,
//   responsible, author, parent, category, version, customFieldN } } ] } }.
// Custom-field names come from embedded schemas when the export carries them
// (_embedded.schemas, per the API's resource-schema concept); comments,
// relations, watchers and attachments are read when embedded on a work
// package, since the collection itself only links to them.
// ISO 8601 duration as hours; OpenProject uses PT..H..M and P..D for days.
export function isoDurationHours(value) {
  if (typeof value !== 'string') return undefined;
  const m = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  if (!m || value === 'P' || value === 'PT') return undefined;
  const [, d = 0, h = 0, min = 0, sec = 0] = m;
  return Math.round((Number(d) * 24 + Number(h) + Number(min) / 60 + Number(sec) / 3600) * 100) / 100;
}

function halTitle(link) {
  if (Array.isArray(link)) return link.map(halTitle).filter(Boolean).join(', ') || undefined;
  return (link && typeof link === 'object' && typeof link.title === 'string' && link.title) || undefined;
}

function halId(link) {
  const href = link && typeof link === 'object' ? link.href : undefined;
  const m = typeof href === 'string' && /\/(\d+)\/?$/.exec(href);
  return m ? m[1] : undefined;
}

function embeddedElements(owner, key) {
  const value = owner && owner._embedded && owner._embedded[key];
  if (Array.isArray(value)) return value;
  return (value && Array.isArray(value.elements) && value.elements) || [];
}

const OPENPROJECT_RELATIONS = {
  blocks: 'blocks', blocked: 'is-blocked-by', duplicates: 'duplicates', duplicated: 'is-duplicated-by',
};

export function parseOpenProject(data) {
  const elements =
    (data._embedded && data._embedded.elements) ||
    data.elements ||
    (Array.isArray(data) ? data : []);
  // customFieldN -> its name, from any embedded schema.
  const fieldNames = {};
  const schemas = embeddedElements(data, 'schemas');
  elements.forEach(wp => { if (wp && wp._embedded && wp._embedded.schema) schemas.push(wp._embedded.schema); });
  schemas.forEach(schema => {
    Object.keys(schema || {}).filter(k => /^customField\d+$/.test(k)).forEach(key => {
      if (schema[key] && typeof schema[key].name === 'string') fieldNames[key] = schema[key].name;
    });
  });
  const unsupported = [];
  const tasks = elements.map((wp, index) => {
    const at = `/_embedded/elements/${index}`;
    const links = wp._links || {};
    const custom = {};
    const addField = (key, value) => {
      if (value === undefined || value === null || value === '') return;
      custom[fieldNames[key] || key] = value;
    };
    Object.keys(wp).filter(k => /^customField\d+$/.test(k)).forEach(key => {
      const value = wp[key];
      addField(key, value && typeof value === 'object' && !Array.isArray(value) ? value.raw : value);
    });
    Object.keys(links).filter(k => /^customField\d+$/.test(k)).forEach(key => addField(key, halTitle(links[key])));
    const estimated = isoDurationHours(wp.estimatedTime);
    if (estimated !== undefined) custom['Estimated time (hours)'] = estimated;
    if (typeof wp.percentageDone === 'number') custom['Progress (%)'] = wp.percentageDone;

    const id = wp.id !== undefined && wp.id !== null ? String(wp.id) : undefined;
    const dependencies = [];
    embeddedElements(wp, 'relations').forEach(rel => {
      const relLinks = (rel && rel._links) || {};
      const from = halId(relLinks.from);
      const to = halId(relLinks.to);
      // Each relation is listed on both work packages; keep the "from" side.
      if (!id || from !== id || !to) return;
      dependencies.push({ ref: to, type: OPENPROJECT_RELATIONS[rel.type] || 'related-to' });
    });
    // Watchers become card watchers when mapped to a board member (the
    // importer decides, models/lib/importedTaskPlan.js); others are reported.
    const watchers = embeddedElements(wp, 'watchers').map(w => w && (w.name || w.login)).filter(Boolean);
    const attachments = embeddedElements(wp, 'attachments').length;
    if (attachments) unsupported.push({ path: `${at}/attachments`, reason: `${attachments} attachment(s): the API export carries metadata, not file contents` });

    const tags = [
      halTitle(links.type),
      links.priority && halTitle(links.priority) && `priority:${halTitle(links.priority)}`,
      halTitle(links.category),
      links.version && halTitle(links.version) && `version:${halTitle(links.version)}`,
    ].filter(Boolean);
    return {
      ref: id,
      parent_ref: halId(links.parent),
      dependencies,
      title: wp.subject || wp.name || 'Imported work package',
      description: (wp.description && (wp.description.raw || wp.description.html)) || '',
      column_name: halTitle(links.status) || wp.status || 'Imported',
      swimlane_name: 'Default',
      date_due: wp.dueDate || wp.due_date || wp.date,
      date_started: wp.startDate,
      date_creation: wp.createdAt,
      spent_hours: isoDurationHours(wp.spentTime),
      owner_username: halTitle(links.assignee),
      assignees: [halTitle(links.responsible)].filter(Boolean),
      requested_by: halTitle(links.author),
      tags,
      custom_fields: custom,
      ...(watchers.length ? { watchers } : {}),
      comments: embeddedElements(wp, 'activities')
        .filter(a => a && a._type === 'Activity::Comment' && a.comment && a.comment.raw)
        .map(a => ({ text: a.comment.raw, author: halTitle(a._links && a._links.user), date: a.createdAt })),
    };
  });
  const project = elements[0] && elements[0]._links && halTitle(elements[0]._links.project);
  return {
    board: { name: (data._links && data._links.self && data._links.self.title) || project || 'Imported OpenProject' },
    columns: uniq(tasks.map(t => t.column_name)).map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// --- Shared issue-tracker mapping (GitHub / Gitea / Forgejo) -----------------
// Accepts an array of issues (GET /repos/{o}/{r}/issues) - or several such
// pages concatenated into one array, since completing pagination is the API
// client's job, not this parser's (it only ever sees whatever JSON it was
// handed). Pull requests are skipped. Issues are grouped into Open / Closed
// lists.
//
// The Kanboard shape this returns (board/columns/swimlanes/tasks) has no
// field for what does not fit a task - a second assignee, a state reason, an
// issue number. Rather than silently drop it, `warnings`/`unsupported` are
// attached as extra top-level keys alongside the normalized shape (the
// `{ normalized, warnings, unsupported }` contract from
// docs/Features/ImportExport/Format-Coverage.md, flattened here so the
// existing KanboardCreator call site in models/import.js keeps working
// unchanged): every caller that only reads board/columns/swimlanes/tasks is
// unaffected, and Problems -> Recovery can still show what a full audit of
// this parser would otherwise lose silently.
function parseIssuesArray(data, system) {
  const issues = Array.isArray(data) ? data : data.issues || [];
  const unsupported = [];
  const tasks = issues
    .filter(issue => !issue.pull_request)
    .map((issue, index) => {
      const path = `/${index}`;
      const milestoneTitle = issue.milestone && (issue.milestone.title || issue.milestone.name);
      const extraAssignees = Array.isArray(issue.assignees) ? issue.assignees.slice(1) : [];
      const tags = (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name));
      if (milestoneTitle) tags.push(`milestone:${milestoneTitle}`);
      extraAssignees.forEach(a => {
        const login = a && (a.login || a.username || a.name);
        if (login) tags.push(`assignee:${login}`);
      });
      if (extraAssignees.length) {
        unsupported.push({
          path: `${path}/assignees`,
          reason: 'only the first assignee becomes the task Owner; the rest are kept as tags',
        });
      }
      if (issue.state_reason && issue.state_reason !== 'completed') {
        tags.push(`state_reason:${issue.state_reason}`);
      }
      const footer = [
        issue.number != null ? `Source: #${issue.number}` : null,
        issue.html_url || issue.url || null,
      ].filter(Boolean).join(' ');
      const commentsSection = Array.isArray(issue.comments_data) && issue.comments_data.length
        ? `\n\nComments:\n${issue.comments_data
            .map(c => `- ${(c.user && (c.user.login || c.user.name)) || 'unknown'}: ${c.body || ''}`)
            .join('\n')}`
        : '';
      if (issue.comments && !Array.isArray(issue.comments_data) && issue.comments > 0) {
        unsupported.push({
          path: `${path}/comments`,
          reason: `${issue.comments} comment(s) exist upstream but were not embedded in this export`,
        });
      }
      const description = [issue.body || issue.description || '', commentsSection, footer]
        .filter(Boolean).join('\n\n').trim();
      return {
        // Sync match key (models/lib/listSyncReconcile.js): the issue number
        // alone can collide across repos synced into different lists on the
        // same board, but is unique WITHIN one list's sync source, which is
        // all reconcile ever compares against.
        externalId: issue.number != null ? String(issue.number) : issue.id != null ? String(issue.id) : undefined,
        title: issue.title || 'Imported issue',
        description,
        column_name: issue.state === 'closed' ? 'Closed' : 'Open',
        swimlane_name: 'Default',
        date_due: (issue.milestone && (issue.milestone.due_on || issue.milestone.due_date)) || issue.due_date,
        owner_username:
          (issue.assignee && (issue.assignee.login || issue.assignee.username)) || undefined,
        // Who OPENED the issue is who asked for the work - WeKan's "Requested
        // By", as opposed to the assignee who does it. Free text, so it survives
        // an import from a tracker nobody on this board has an account on.
        requested_by: (issue.user && (issue.user.login || issue.user.name))
          || (issue.author && (issue.author.login || issue.author.username || issue.author.name))
          || undefined,
        tags,
      };
    });
  return {
    board: { name: `Imported ${system} issues` },
    columns: [{ title: 'Open' }, { title: 'Closed' }],
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

export function parseGithub(data) {
  return parseIssuesArray(data, 'GitHub');
}

// Gitea and Forgejo share the same issue API shape.
export function parseGitea(data) {
  return parseIssuesArray(data, 'Gitea/Forgejo');
}

// --- GitLab -----------------------------------------------------------------
// Accepts an array of issues (GET /projects/{id}/issues, Issues API v4) or
// { issues }. Brought to the Format-Coverage contract (#2698) the way the
// GitHub/Gitea adapter was: state, labels (strings or with_labels_details
// objects), every assignee, author, milestone, iteration, weight, due date,
// time stats, task completion, links and URL, plus embedded `notes` and
// `links` when the exporting client fetched them. Anything with no place in
// a card is kept as a tag or reported in `unsupported`, never dropped.
const GITLAB_LINK_TYPES = { relates_to: 'related-to', blocks: 'blocks', is_blocked_by: 'is-blocked-by' };
function gitlabUser(user) {
  return (user && (user.username || user.name)) || undefined;
}
export function parseGitlab(data) {
  const issues = Array.isArray(data) ? data : data.issues || [];
  const unsupported = [];
  const warnings = [];
  const tasks = issues.map((issue, index) => {
    const path = `/${index}`;
    const tags = (issue.labels || []).map(l => (typeof l === 'string' ? l : l && l.name)).filter(Boolean);
    const milestoneTitle = issue.milestone && issue.milestone.title;
    if (milestoneTitle) tags.push(`milestone:${milestoneTitle}`);
    if (issue.iteration && issue.iteration.title) tags.push(`iteration:${issue.iteration.title}`);
    if (issue.issue_type && issue.issue_type !== 'issue') tags.push(`type:${issue.issue_type}`);
    if (issue.confidential) {
      tags.push('confidential');
      warnings.push(`${path}: confidential in GitLab; on the board, the board's visibility decides who can read it`);
    }
    const assignees = (Array.isArray(issue.assignees) && issue.assignees.length ? issue.assignees
      : (issue.assignee ? [issue.assignee] : [])).map(gitlabUser).filter(Boolean);
    const custom = {};
    if (typeof issue.weight === 'number') custom.Weight = issue.weight;
    const stats = issue.time_stats || {};
    if (Number(stats.time_estimate) > 0) custom['Time estimate (hours)'] = Math.round(Number(stats.time_estimate) / 36) / 100;
    const completion = issue.task_completion_status;
    if (completion && Number(completion.count) > 0) {
      custom.Tasks = `${Number(completion.completed_count) || 0}/${Number(completion.count)}`;
    }
    const notes = Array.isArray(issue.notes) ? issue.notes : null;
    const comments = (notes || [])
      .filter(note => note && !note.system && typeof note.body === 'string' && note.body.trim())
      .map(note => ({ text: note.body, author: gitlabUser(note.author), authorName: note.author && note.author.name,
        date: note.created_at }));
    if (!notes && Number(issue.user_notes_count) > 0) {
      unsupported.push({ path: `${path}/user_notes_count`,
        reason: `${issue.user_notes_count} comment(s) exist upstream but were not embedded in this export` });
    }
    const dependencies = (Array.isArray(issue.links) ? issue.links : [])
      .filter(link => link && link.iid != null)
      .map(link => ({ ref: String(link.iid), type: GITLAB_LINK_TYPES[link.link_type] || 'related-to' }));
    if (issue.epic || issue.epic_iid) {
      unsupported.push({ path: `${path}/epic`, reason: 'epics are group-level in GitLab; the parent epic is not imported' });
    }
    const reference = (issue.references && issue.references.full)
      || (issue.iid != null ? `#${issue.iid}` : null);
    const footer = [reference ? `Source: ${reference}` : null, issue.web_url || null].filter(Boolean).join(' ');
    const description = [issue.description || '', footer].filter(Boolean).join('\n\n').trim();
    const spent = Number(stats.total_time_spent);
    return {
      // Sync match key: the project-scoped iid, unique within one list's source.
      externalId: issue.iid != null ? String(issue.iid) : issue.id != null ? String(issue.id) : undefined,
      ref: issue.iid != null ? String(issue.iid) : undefined,
      title: issue.title || 'Imported issue',
      description,
      column_name: issue.state === 'closed' ? 'Closed' : 'Open',
      swimlane_name: 'Default',
      date_due: issue.due_date || (issue.milestone && issue.milestone.due_date) || undefined,
      date_creation: issue.created_at || undefined,
      date_end: issue.state === 'closed' ? (issue.closed_at || undefined) : undefined,
      owner_username: assignees[0],
      assignees: assignees.slice(1),
      requested_by: gitlabUser(issue.author),
      spent_hours: spent > 0 ? Math.round(spent / 36) / 100 : undefined,
      tags,
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
      ...(comments.length ? { comments } : {}),
      ...(dependencies.length ? { dependencies } : {}),
    };
  });
  return {
    board: { name: 'Imported GitLab issues' },
    columns: [{ title: 'Open' }, { title: 'Closed' }],
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings,
    unsupported,
  };
}

// --- Asana ----------------------------------------------------------------
// Accepts an Asana tasks response { data: [ task ] } (GET /tasks with
// opt_fields). A task: { gid, name, notes, completed, completed_at,
// created_at, start_on|start_at, due_on|due_at, assignee, followers,
// memberships:[{section:{name}}], tags, parent:{gid}, subtasks,
// dependencies:[{gid}], custom_fields, stories, attachments, permalink_url }.
// Subtasks fetched as tasks of their own link to their parent card; compact
// subtasks embedded on a task (not listed separately) become a checklist.
// Comments are the `comment_added` stories, when the export embedded them.
function asanaCustomValue(field) {
  if (!field || typeof field !== 'object') return undefined;
  if (typeof field.number_value === 'number') return field.number_value;
  if (typeof field.text_value === 'string' && field.text_value) return field.text_value;
  if (field.enum_value && field.enum_value.name) return field.enum_value.name;
  if (Array.isArray(field.multi_enum_values) && field.multi_enum_values.length) {
    return field.multi_enum_values.map(v => v && v.name).filter(Boolean);
  }
  if (field.date_value && (field.date_value.date_time || field.date_value.date)) {
    return field.date_value.date_time || field.date_value.date;
  }
  if (Array.isArray(field.people_value) && field.people_value.length) {
    return field.people_value.map(p => p && (p.name || p.email)).filter(Boolean);
  }
  return typeof field.display_value === 'string' && field.display_value ? field.display_value : undefined;
}

function asanaUser(user) {
  return user && (user.email || user.name || user.gid) || undefined;
}

export function parseAsana(data) {
  const items = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
  const listed = new Set(items.map(t => t && t.gid).filter(Boolean).map(String));
  const unsupported = [];
  const tasks = items.map((t, index) => {
    const at = `/data/${index}`;
    const section =
      (t.memberships && t.memberships[0] && t.memberships[0].section &&
        t.memberships[0].section.name) ||
      (t.completed ? 'Done' : 'In Progress');
    const custom = {};
    (Array.isArray(t.custom_fields) ? t.custom_fields : []).forEach(field => {
      const value = asanaCustomValue(field);
      if (field && field.name && value !== undefined) custom[field.name] = value;
    });
    const embedded = (Array.isArray(t.subtasks) ? t.subtasks : []).filter(sub => !(sub && sub.gid && listed.has(String(sub.gid))));
    const followers = (Array.isArray(t.followers) ? t.followers : []).map(asanaUser).filter(Boolean);
    const attachments = Array.isArray(t.attachments) ? t.attachments.length : 0;
    if (attachments) unsupported.push({ path: `${at}/attachments`, reason: `${attachments} attachment(s): the API export carries metadata, not file contents` });
    const footer = t.permalink_url ? `Source: ${t.permalink_url}` : '';
    return {
      ref: t.gid !== undefined && t.gid !== null ? String(t.gid) : undefined,
      parent_ref: t.parent && t.parent.gid !== undefined ? String(t.parent.gid) : undefined,
      // Each dependency is also listed on the other task as a dependent; keep
      // one side: this task is blocked by what it depends on.
      dependencies: (Array.isArray(t.dependencies) ? t.dependencies : [])
        .filter(d => d && d.gid !== undefined)
        .map(d => ({ ref: String(d.gid), type: 'is-blocked-by' })),
      title: t.name || 'Imported task',
      description: [t.notes || '', footer].filter(Boolean).join('\n\n'),
      column_name: section,
      swimlane_name: 'Default',
      date_due: t.due_at || t.due_on,
      date_started: t.start_at || t.start_on,
      date_end: t.completed ? t.completed_at : undefined,
      date_creation: t.created_at,
      owner_username: asanaUser(t.assignee),
      tags: (t.tags || []).map(tag => (typeof tag === 'string' ? tag : tag && tag.name)).filter(Boolean),
      custom_fields: custom,
      ...(followers.length ? { watchers: followers } : {}),
      checklists: embedded.length ? [{
        title: 'Subtasks',
        items: embedded.map(sub => ({ title: sub && sub.name, done: Boolean(sub && sub.completed) })),
      }] : [],
      comments: (Array.isArray(t.stories) ? t.stories : [])
        .filter(story => story && story.resource_subtype === 'comment_added')
        .map(story => ({ text: story.text, author: asanaUser(story.created_by), date: story.created_at })),
    };
  });
  return {
    board: { name: (data.project && data.project.name)
      || (items[0] && items[0].memberships && items[0].memberships[0] && items[0].memberships[0].project
        && items[0].memberships[0].project.name)
      || 'Imported Asana project' },
    columns: uniq(tasks.map(t => t.column_name)).map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// --- ZenKit ----------------------------------------------------------------
// Two shapes are accepted.
//
// The Zenkit API: { list:{name}, elements:[{uuid, name, elementcategory,
// isPrimary}], entries:[entry] } where an entry is { uuid, displayString,
// sortOrder, created_at, deprecated_at, comment_count, checklists:[{name,
// items:[{text, checked}]}] } plus one key per field value, named after the
// element: `<uuid>_text`, `_number`, `_date`, `_categories_sort`,
// `_persons_sort` or `_references_sort` (as the zenkit Rust client
// deserializes them). Zenkit documents no single-file JSON export schema, so
// element kinds whose value key is not documented are reported, not guessed.
//
// The adapter shape: { title, stages:[{name}], items:[{title, description,
// stage_name, due, tags, id, parent_id, assignees, fields:{name: value},
// comments, checklists}] }. Keys it does not know are reported too, because
// Zenkit products differ.
const ZENKIT = { text: 1, number: 2, url: 3, date: 4, checkbox: 5, categories: 6, formula: 7,
  persons: 14, files: 15, references: 16, hierarchy: 17, subEntries: 18, dependencies: 19 };
const ZENKIT_ADAPTER_KEYS = new Set(['title', 'name', 'description', 'notes', 'stage_name', 'stageName', 'list',
  'due', 'dueDate', 'due_date', 'tags', 'assignee', 'assignees', 'id', 'uuid', 'parent_id', 'parentId',
  'fields', 'comments', 'checklists', 'created_at', 'start']);

function zenkitNames(list, key) {
  return (Array.isArray(list) ? list : []).map(v => v && v[key]).filter(v => typeof v === 'string' && v);
}

function zenkitChecklists(checklists) {
  return (Array.isArray(checklists) ? checklists : []).map(c => ({
    title: c && c.name,
    items: (Array.isArray(c && c.items) ? c.items : []).map(i => ({ title: i && (i.text || i.title), done: Boolean(i && (i.checked || i.done)) })),
  }));
}

function parseZenkitApi(data) {
  const elements = data.elements.filter(e => e && typeof e.uuid === 'string');
  const kind = e => Number(e.elementcategory);
  const named = (category, pattern) => elements.find(e => kind(e) === category && pattern.test(e.name || ''));
  const categories = elements.filter(e => kind(e) === ZENKIT.categories);
  const stage = named(ZENKIT.categories, /stage|status|state|column/i) || categories[0];
  const descriptionField = elements.find(e => kind(e) === ZENKIT.text && !e.isPrimary && /description|notes?|details/i.test(e.name || ''));
  const due = named(ZENKIT.date, /due|deadline|end/i);
  const start = named(ZENKIT.date, /start|begin/i);
  const people = elements.filter(e => kind(e) === ZENKIT.persons);
  const hierarchy = elements.find(e => kind(e) === ZENKIT.hierarchy);
  const dependencies = elements.filter(e => kind(e) === ZENKIT.dependencies);
  const unsupported = [];
  const warnings = [];
  const entries = (data.entries || data.listEntries).filter(Boolean);
  const live = entries.filter(e => !e.deprecated_at);
  if (live.length !== entries.length) warnings.push({ path: '/entries', reason: `${entries.length - live.length} deleted entr(ies) skipped` });
  live.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  const reported = new Set();
  const report = (element, reason) => {
    if (reported.has(element.uuid)) return;
    reported.add(element.uuid);
    unsupported.push({ path: `/elements/${elements.indexOf(element)}`, reason: `${element.name || element.uuid}: ${reason}` });
  };
  const tasks = live.map((entry, index) => {
    const value = (element, suffix) => entry[`${element.uuid}_${suffix}`];
    const custom = {};
    const tags = [];
    elements.forEach(element => {
      if (element.isPrimary || [stage, descriptionField, due, start, hierarchy].includes(element)) return;
      switch (kind(element)) {
        case ZENKIT.text: case ZENKIT.url: {
          const v = value(element, 'text');
          if (typeof v === 'string' && v) custom[element.name] = v;
          break;
        }
        case ZENKIT.number: {
          const v = value(element, 'number');
          if (typeof v === 'number' && Number.isFinite(v)) custom[element.name] = v;
          break;
        }
        case ZENKIT.date: {
          const v = value(element, 'date');
          if (typeof v === 'string' && v) custom[element.name] = v;
          break;
        }
        case ZENKIT.categories:
          tags.push(...zenkitNames(value(element, 'categories_sort'), 'name'));
          break;
        case ZENKIT.persons: case ZENKIT.dependencies: case ZENKIT.subEntries:
          break;
        case ZENKIT.files:
          report(element, 'files are not part of the export');
          break;
        case ZENKIT.references:
          report(element, 'references to other lists are not imported');
          break;
        case ZENKIT.formula:
          report(element, 'formula results are computed by Zenkit and not imported');
          break;
        default:
          if ([8, 9, 10, 11, 12, 13].includes(kind(element))) break; // entry metadata, read below
          report(element, 'this field type has no documented value format');
      }
    });
    const persons = people.flatMap(p => zenkitNames(value(p, 'persons_sort'), 'displayname'));
    const parent = hierarchy && zenkitNames(value(hierarchy, 'references_sort'), 'uuid')[0];
    const comments = Number(entry.comment_count) || 0;
    if (comments) unsupported.push({ path: `/entries/${index}/comment_count`, reason: `${comments} comment(s) are fetched separately from Zenkit` });
    return {
      ref: entry.uuid,
      parent_ref: parent,
      dependencies: dependencies.flatMap(d => zenkitNames(value(d, 'references_sort'), 'uuid'))
        .map(ref => ({ ref, type: 'related-to' })),
      title: entry.displayString || 'Imported item',
      description: (descriptionField && value(descriptionField, 'text')) || '',
      column_name: (stage && zenkitNames(value(stage, 'categories_sort'), 'name')[0]) || 'Inbox',
      swimlane_name: 'Default',
      date_due: due && value(due, 'date'),
      date_started: start && value(start, 'date'),
      date_creation: entry.created_at,
      owner_username: persons[0],
      assignees: persons.slice(1),
      requested_by: entry.created_by_displayname || undefined,
      tags: uniq(tags),
      custom_fields: custom,
      checklists: zenkitChecklists(entry.checklists),
    };
  });
  const stageNames = stage && stage.elementData && Array.isArray(stage.elementData.predefinedCategories)
    ? zenkitNames(stage.elementData.predefinedCategories, 'name') : [];
  const columns = uniq(stageNames.concat(tasks.map(t => t.column_name)));
  return {
    board: { name: (data.list && data.list.name) || data.title || data.name || 'Imported ZenKit list' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings,
    unsupported,
  };
}

export function parseZenkit(data) {
  if (data && !Array.isArray(data) && Array.isArray(data.elements)
    && (Array.isArray(data.entries) || Array.isArray(data.listEntries))) {
    return parseZenkitApi(data);
  }
  const items = Array.isArray(data) ? data : (data.items || []);
  const stages = data.stages || [];
  const unsupported = [];
  const tasks = items.map((t, index) => {
    const unknown = Object.keys(t || {}).filter(key => !ZENKIT_ADAPTER_KEYS.has(key));
    if (unknown.length) {
      unsupported.push({ path: `/items/${index}`, reason: `unrecognized field(s): ${unknown.slice(0, 10).join(', ')}` });
    }
    const people = (Array.isArray(t.assignees) ? t.assignees : [t.assignee])
      .map(a => (typeof a === 'string' ? a : a && (a.email || a.name))).filter(Boolean);
    const id = t.id !== undefined && t.id !== null ? t.id : t.uuid;
    const parent = t.parent_id !== undefined && t.parent_id !== null ? t.parent_id : t.parentId;
    return {
      ref: id !== undefined && id !== null ? String(id) : undefined,
      parent_ref: parent !== undefined && parent !== null ? String(parent) : undefined,
      title: t.title || t.name || 'Imported item',
      description: t.description || t.notes || '',
      column_name: t.stage_name || t.stageName || t.list || 'Inbox',
      swimlane_name: 'Default',
      date_due: t.due || t.dueDate || t.due_date,
      date_started: t.start,
      date_creation: t.created_at,
      owner_username: people[0],
      assignees: people.slice(1),
      tags: Array.isArray(t.tags) ? t.tags.map(tag => (typeof tag === 'string' ? tag : tag && tag.name)).filter(Boolean) : [],
      custom_fields: t.fields && typeof t.fields === 'object' && !Array.isArray(t.fields) ? t.fields : {},
      checklists: zenkitChecklists(t.checklists),
      comments: (Array.isArray(t.comments) ? t.comments : []).map(c => ({
        text: typeof c === 'string' ? c : c && (c.text || c.message),
        author: c && typeof c === 'object' ? (c.author || c.user) : undefined,
        date: c && typeof c === 'object' ? (c.date || c.created_at) : undefined,
      })),
    };
  });
  const derivedColumns = uniq(tasks.map(t => t.column_name)).map(title => ({ title }));
  return {
    board: { name: data.title || data.name || 'Imported ZenKit list' },
    columns: stages.length ? stages.map(s => ({ title: s.name || s.title })) : derivedColumns,
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// --- Markdown "task list" kanban --------------------------------------------
// The convention several markdown-kanban tools use (Obsidian Kanban and
// similar, and it degrades gracefully for a plain GitHub-flavored-Markdown
// task list too): a `## List name` heading starts a list, `- [ ]`/`- [x]`
// items underneath are its cards, and further-indented lines under an item
// are its description. A `- ` bullet with no checkbox is still accepted as an
// open (unchecked) card, so an ordinary bulleted to-do list imports too, not
// only one written specifically for a kanban tool. Round-trips with the
// `markdown` formatter in externalExporters.js.
export function parseMarkdownKanban(text) {
  const lines = String(text == null ? '' : text).split(/\r\n|\r|\n/);
  const tasks = [];
  const unsupported = [];
  let boardName = 'Imported Markdown board';
  let sawTitle = false;
  let currentList = 'Imported';
  let currentTask = null;

  lines.forEach((line, index) => {
    const titleMatch = /^#\s+(.+?)\s*$/.exec(line);
    const listMatch = /^##\s+(.+?)\s*$/.exec(line);
    const taskMatch = /^[-*]\s*(?:\[([ xX])\]\s*)?(.+?)\s*$/.exec(line);

    if (titleMatch && !sawTitle) {
      boardName = titleMatch[1];
      sawTitle = true;
      currentTask = null;
      return;
    }
    if (listMatch) {
      currentList = listMatch[1];
      currentTask = null;
      return;
    }
    if (taskMatch) {
      const done = (taskMatch[1] || '').toLowerCase() === 'x';
      currentTask = {
        title: taskMatch[2],
        description: '',
        column_name: currentList,
        swimlane_name: 'Default',
        tags: done ? ['done'] : [],
      };
      tasks.push(currentTask);
      return;
    }
    if (currentTask && /^\s+\S/.test(line)) {
      currentTask.description = currentTask.description
        ? `${currentTask.description}\n${line.trim()}`
        : line.trim();
      return;
    }
    if (line.trim() && !/^#{1,6}\s/.test(line)) {
      unsupported.push({ path: `/${index}`, reason: 'line matched no known markdown-kanban construct' });
    }
  });

  const columns = [...new Set(tasks.map(t => t.column_name))];
  return {
    board: { name: boardName },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// --- Jira -------------------------------------------------------------------
// Accepts the same shape models/jiraCreator.js consumes for a one-time board
// import (the Jira Cloud REST search API's `{ issues: [...] }`, or a bare
// array of issues): { key, fields: { summary, description, status:{name},
// labels, assignee, duedate, reporter } }. Used by BOTH the one-time import
// (via JiraCreator, which maps this shape directly) and the periodic sync job
// (server/listSync.js), which is why `externalId` (the issue key, e.g.
// "PROJ-1") is included here - JiraCreator does not need it, sync does, to
// match a re-fetched issue back to the card it already created.
export function parseJira(data) {
  const issues = Array.isArray(data) ? data : data.issues || [];
  const tasks = issues.map(issue => {
    const fields = issue.fields || {};
    const reporter = fields.reporter;
    const time = jiraTimeTracking(fields);
    return {
      ...(time.spent !== undefined ? { spentTime: time.spent } : {}),
      externalId: issue.key,
      title: [issue.key ? `[${issue.key}]` : null, fields.summary]
        .filter(Boolean).join(' ') || 'Imported issue',
      description: adfPlainText(fields.description),
      column_name: (fields.status && fields.status.name) || 'Imported',
      swimlane_name: 'Default',
      date_due: fields.duedate,
      owner_username:
        fields.assignee &&
        (fields.assignee.accountId || fields.assignee.name || fields.assignee.emailAddress),
      requested_by: reporter && (reporter.displayName || reporter.name || reporter.emailAddress),
      tags: fields.labels || [],
    };
  });
  return {
    board: { name: (data.board && data.board.name) || 'Imported Jira Board' },
    columns: uniq(tasks.map(t => t.column_name)).map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
  };
}

// Map an import source name to its parser (forgejo reuses the Gitea parser).
export const EXTERNAL_PARSERS = {
  kanboard: parseKanboard,
  deck: parseNextcloudDeck,
  openproject: parseOpenProject,
  github: parseGithub,
  gitlab: parseGitlab,
  gitea: parseGitea,
  forgejo: parseGitea,
  asana: parseAsana,
  zenkit: parseZenkit,
  markdown: parseMarkdownKanban,
  todotxt: parseTodoTxt,
  jira: parseJira,
};

// Sync-capable sources: sources whose normalized tasks carry `externalId`, so
// models/lib/listSyncReconcile.js can match a re-fetched item back to the
// card it already created. Deliberately a SUBSET of EXTERNAL_PARSERS -
// deck/openproject/asana/zenkit/markdown parsers do not emit externalId yet,
// so listing them here would silently recreate every card on every sync run.
export const SYNC_CAPABLE_SOURCES = ['jira', 'github', 'gitlab', 'gitea', 'forgejo'];
