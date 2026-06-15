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
// Accepts an array of issues (GET /repos/{o}/{r}/issues). Pull requests are
// skipped. Issues are grouped into Open / Closed lists.
function parseIssuesArray(data, system) {
  const issues = Array.isArray(data) ? data : data.issues || [];
  const tasks = issues
    .filter(issue => !issue.pull_request)
    .map(issue => ({
      title: issue.title || 'Imported issue',
      description: issue.body || issue.description || '',
      column_name: issue.state === 'closed' ? 'Closed' : 'Open',
      swimlane_name: 'Default',
      date_due: (issue.milestone && (issue.milestone.due_on || issue.milestone.due_date)) || issue.due_date,
      owner_username:
        (issue.assignee && (issue.assignee.login || issue.assignee.username)) || undefined,
      tags: (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name)),
    }));
  return {
    board: { name: `Imported ${system} issues` },
    columns: [{ title: 'Open' }, { title: 'Closed' }],
    swimlanes: [{ name: 'Default' }],
    tasks,
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
    title: issue.title || 'Imported issue',
    description: issue.description || '',
    column_name: issue.state === 'closed' ? 'Closed' : 'Open',
    swimlane_name: 'Default',
    date_due: issue.due_date || (issue.milestone && issue.milestone.due_date),
    owner_username: issue.assignee && issue.assignee.username,
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
};
