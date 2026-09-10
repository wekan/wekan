// Parsers that normalize exports/API responses from other tools into the common
// "Kanboard shape" { board, columns, swimlanes, tasks } that KanboardCreator
// consumes. Each is best-effort and tolerant of missing fields.
//
// A normalized task: { title, description, column_name, swimlane_name,
//   date_due, owner_username, tags: [string] }.

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// --- NextCloud Deck ---------------------------------------------------------
// Accepts a Deck board with stacks (each stack carries its cards), e.g. the
// shape returned by the Deck REST API (GET /boards/{id} + /stacks).
export function parseNextcloudDeck(data) {
  const board = data.board || data;
  const stacks = board.stacks || data.stacks || [];
  const tasks = [];
  stacks.forEach(stack => {
    (stack.cards || []).forEach(card => {
      tasks.push({
        title: card.title || 'Imported card',
        description: card.description || '',
        column_name: stack.title,
        swimlane_name: 'Default',
        date_due: card.duedate || card.dueDate,
        owner_username:
          (card.assignedUsers &&
            card.assignedUsers[0] &&
            (card.assignedUsers[0].participant
              ? card.assignedUsers[0].participant.uid
              : card.assignedUsers[0].uid)) ||
          card.owner,
        tags: (card.labels || []).map(l => (typeof l === 'string' ? l : l.title)),
      });
    });
  });
  return {
    board: { name: board.title || 'Imported NextCloud Deck board' },
    columns: stacks.map(s => ({ title: s.title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
  };
}

// --- OpenProject ------------------------------------------------------------
// Accepts a work-packages collection (GET /api/v3/work_packages), i.e.
// { _embedded: { elements: [ { subject, description:{raw}, dueDate,
//   _links:{ status:{title}, assignee:{title}, type:{title} } } ] } }.
export function parseOpenProject(data) {
  const elements =
    (data._embedded && data._embedded.elements) ||
    data.elements ||
    (Array.isArray(data) ? data : []);
  const tasks = elements.map(wp => {
    const links = wp._links || {};
    return {
      title: wp.subject || wp.name || 'Imported work package',
      description: (wp.description && (wp.description.raw || wp.description.html)) || '',
      column_name: (links.status && links.status.title) || wp.status || 'Imported',
      swimlane_name: 'Default',
      date_due: wp.dueDate || wp.due_date,
      owner_username: links.assignee && links.assignee.title,
      tags: [links.type && links.type.title].filter(Boolean),
    };
  });
  return {
    board: { name: (data._links && data._links.self && data._links.self.title) || 'Imported OpenProject' },
    columns: uniq(tasks.map(t => t.column_name)).map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
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
// Accepts an array of issues (GET /projects/{id}/issues). GitLab uses
// state "opened"/"closed", string labels, and assignee.username.
export function parseGitlab(data) {
  const issues = Array.isArray(data) ? data : data.issues || [];
  const tasks = issues.map(issue => ({
    externalId: issue.iid != null ? String(issue.iid) : issue.id != null ? String(issue.id) : undefined,
    title: issue.title || 'Imported issue',
    description: issue.description || '',
    column_name: issue.state === 'closed' ? 'Closed' : 'Open',
    swimlane_name: 'Default',
    date_due: issue.due_date || (issue.milestone && issue.milestone.due_date),
    owner_username: issue.assignee && issue.assignee.username,
    requested_by: issue.author && (issue.author.username || issue.author.name),
    tags: (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name)),
  }));
  return {
    board: { name: 'Imported GitLab issues' },
    columns: [{ title: 'Open' }, { title: 'Closed' }],
    swimlanes: [{ name: 'Default' }],
    tasks,
  };
}

// --- Asana ----------------------------------------------------------------
// Accepts an Asana tasks export { data: [ { name, notes, completed, due_on,
//   memberships:[{section:{name}}], tags:[{name}], assignee:{name} } ] }.
export function parseAsana(data) {
  const items = Array.isArray(data) ? data : (data.data || []);
  const tasks = items.map(t => {
    const section =
      (t.memberships && t.memberships[0] && t.memberships[0].section &&
        t.memberships[0].section.name) ||
      (t.completed ? 'Done' : 'In Progress');
    return {
      title: t.name || 'Imported task',
      description: t.notes || '',
      column_name: section,
      swimlane_name: 'Default',
      date_due: t.due_on || t.due_at,
      owner_username: t.assignee && (t.assignee.email || t.assignee.name),
      tags: (t.tags || []).map(tag => (typeof tag === 'string' ? tag : tag.name)),
    };
  });
  return {
    board: { name: (data.project && data.project.name) || 'Imported Asana project' },
    columns: uniq(tasks.map(t => t.column_name)).map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
  };
}

// --- ZenKit ----------------------------------------------------------------
// Accepts a ZenKit-style export { title, stages:[{name}],
//   items:[{title, description, stage_name, due, tags:[string]}] }.
export function parseZenkit(data) {
  const items = Array.isArray(data) ? data : (data.items || []);
  const stages = data.stages || [];
  const tasks = items.map(t => ({
    title: t.title || t.name || 'Imported item',
    description: t.description || t.notes || '',
    column_name: t.stage_name || t.stageName || t.list || 'Inbox',
    swimlane_name: 'Default',
    date_due: t.due || t.dueDate || t.due_date,
    owner_username: t.assignee && (t.assignee.email || t.assignee.name),
    tags: Array.isArray(t.tags) ? t.tags.map(tag => (typeof tag === 'string' ? tag : tag.name)) : [],
  }));
  const derivedColumns = uniq(tasks.map(t => t.column_name)).map(title => ({ title }));
  return {
    board: { name: data.title || data.name || 'Imported ZenKit list' },
    columns: stages.length ? stages.map(s => ({ title: s.name || s.title })) : derivedColumns,
    swimlanes: [{ name: 'Default' }],
    tasks,
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
    return {
      externalId: issue.key,
      title: [issue.key ? `[${issue.key}]` : null, fields.summary]
        .filter(Boolean).join(' ') || 'Imported issue',
      description: typeof fields.description === 'string' ? fields.description : '',
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
  deck: parseNextcloudDeck,
  openproject: parseOpenProject,
  github: parseGithub,
  gitlab: parseGitlab,
  gitea: parseGitea,
  forgejo: parseGitea,
  asana: parseAsana,
  zenkit: parseZenkit,
  markdown: parseMarkdownKanban,
  jira: parseJira,
};

// Sync-capable sources: sources whose normalized tasks carry `externalId`, so
// models/lib/listSyncReconcile.js can match a re-fetched item back to the
// card it already created. Deliberately a SUBSET of EXTERNAL_PARSERS -
// deck/openproject/asana/zenkit/markdown parsers do not emit externalId yet,
// so listing them here would silently recreate every card on every sync run.
export const SYNC_CAPABLE_SOURCES = ['jira', 'github', 'gitlab', 'gitea', 'forgejo'];
