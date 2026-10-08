'use strict';
// Scrum planning data from importers other than Jira
// (docs/Features/Right-Sidebar/Board-Settings/Board-View/Scrum-Design.md:
// "External adapters must report unavailable historical data rather than
// fabricating native commitment or completion snapshots").
//
// Each source maps only what its export really carries:
//
//   * GitLab (Issues API v4): an issue's `iteration` becomes a sprint (start
//     and due dates; state 1/"upcoming", 2/"current", 3/"closed") and its
//     `milestone` a release (start and due dates; state "active"/"closed").
//   * OpenProject (API v3): a work package's `version` link becomes a release
//     (startDate/endDate, status open/locked/closed), its `sprint` link a
//     sprint (startDate/finishDate, status URN in_planning/active/completed),
//     `position` the backlog rank and `storyPoints` the estimate. The full
//     version and sprint resources are read when the export embeds them, on
//     the work package (`_embedded.version`, `_embedded.sprint`) or beside the
//     collection (`_embedded.versions`, `_embedded.sprints`); a link alone has
//     only a title, and the missing dates and status are reported.
//   * Asana (Tasks API): a milestone task (`resource_subtype: "milestone"`)
//     becomes a release, carried by the milestone's own card and by the tasks
//     it depends on. Asana has no sprint record.
//   * Trello has no sprints or releases at all; Power-Up data, which is the
//     only place a Scrum Power-Up keeps its state, has no published schema
//     and is reported (trelloScrumLosses).
//
// As for Jira (models/lib/jiraScrumPlanning.js): a sprint that has started is
// imported as planned and reported, because the export has no commitment
// snapshot; a finished one is reported and not imported, because it has no
// close snapshot either. A card has one sprint and one release; any further
// one is reported.
//
// The result is a native Scrum transfer (models/lib/scrumTransfer.js) whose
// cards are named `task-<index>` after the parser's task order. The Kanboard
// creator maps those to the cards it made and writes the transfer through the
// same journaled Scrum import stage as Jira and WeKan JSON
// (server/lib/scrumTransferImport.js), so an interrupted import is recovered
// by server/lib/scrumImportRecovery.js like any other. Pure: tested by
// tests/externalScrumPlanning.test.cjs.

const taskCardId = index => `task-${index}`;
const STORY_POINTS_FIELD = 'Story points';

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const shown = value => JSON.stringify(String(value).slice(0, 40));

// A calendar date (YYYY-MM-DD, as GitLab, OpenProject and Asana write them) or
// an ISO timestamp. undefined when absent, null when present but not a date.
function sourceDate(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return null;
  if (/^\d{4}-\d\d-\d\d$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  }
  if (/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:?\d\d)$/.test(value)) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  return null;
}

// One planner per import: records keyed by their source id, each card's
// sprint, release and rank, and what could not be kept.
function createPlanner(system) {
  const sprints = new Map();
  const releases = new Map();
  const cards = new Map();
  const ranks = [];
  const losses = [];
  const lost = (path, reason) => losses.push({ path, reason });
  const recordId = key => `${system}-${key}`.slice(0, 200);

  function dates(path, label, start, end) {
    let from = sourceDate(start);
    let to = sourceDate(end);
    // The bad value itself stays out of the report (models/lib/importLossReport.js).
    if (from === null) { lost(`${path}/start`, `${label}: its start date is not a date and is left out`); from = undefined; }
    if (to === null) { lost(`${path}/end`, `${label}: its end date is not a date and is left out`); to = undefined; }
    if (from && to && from > to) {
      lost(`${path}/end`, `${label} ends before it starts: its end date is left out`);
      to = undefined;
    }
    return { ...(from ? { plannedStart: from } : {}), ...(to ? { plannedEnd: to } : {}) };
  }

  // `build` runs once per source record; it returns the record, or null for a
  // record that is reported and not imported.
  function record(map, kind, key, noun, build) {
    if (!map.has(key)) {
      const built = build();
      map.set(key, built ? { noun, value: { _id: recordId(`${kind}-${key}`), ...built,
        provenance: { system, recordId: String(key).slice(0, 500) } } } : null);
    }
    const entry = map.get(key);
    return entry ? entry.value._id : null;
  }

  function assign(index, field, id, path, label) {
    if (!id) return;
    const scrum = cards.get(index) || {};
    if (scrum[field] && scrum[field] !== id) {
      lost(path, `${label} is not the card's ${field === 'sprintId' ? 'sprint' : 'release'}: a card has one`);
      return;
    }
    scrum[field] = id;
    cards.set(index, scrum);
  }

  function finish({ estimate = null } = {}) {
    // Two source records with one name stay two records: they are different
    // in the source, and merging them would move cards between them.
    for (const [map, kind] of [[sprints, 'sprints'], [releases, 'releases']]) {
      const byName = new Map();
      for (const entry of map.values()) {
        if (!entry) continue;
        const name = entry.value.name.toLowerCase();
        byName.set(name, [...(byName.get(name) || []), entry]);
      }
      for (const same of byName.values()) {
        if (same.length < 2) continue;
        lost(`/${kind}/${same[0].value.provenance.recordId}`, `${same.length} ${same[0].noun}s are named ` +
          `"${same[0].value.name}": each is imported as its own ${kind === 'sprints' ? 'sprint' : 'release'}`);
      }
    }
    ranks.sort((a, b) => a.rank - b.rank || a.index - b.index)
      .forEach(({ index }, i) => { cards.set(index, { ...(cards.get(index) || {}), backlogRank: i + 1 }); });
    const plannedSprints = [...sprints.values()].filter(Boolean).map(entry => entry.value);
    const plannedReleases = [...releases.values()].filter(Boolean).map(entry => entry.value);
    const cardRows = [...cards.entries()].sort((a, b) => a[0] - b[0])
      .map(([index, scrum]) => ({ _id: taskCardId(index), scrum }));
    if (!plannedSprints.length && !plannedReleases.length && !cardRows.length && !estimate) {
      return { transfer: null, losses };
    }
    const settings = {
      ...(plannedSprints.length || plannedReleases.length ? { enabled: true } : {}),
      ...(estimate ? { estimateSource: 'customField', estimateCustomFieldId: estimate.field, estimateUnit: estimate.unit } : {}),
    };
    return { transfer: { format: 'wekan-scrum-2', settings, sprints: plannedSprints, releases: plannedReleases,
      events: [], cards: cardRows, lists: [], swimlanes: [] }, losses };
  }

  return { sprints, releases, lost, dates, record, assign, ranks, finish };
}

// --- GitLab -----------------------------------------------------------------

// GitLab's REST API gives an iteration's state as an integer (1 upcoming,
// 2 current, 3 closed); GraphQL and the iterations filter use the words.
const GITLAB_ITERATION_STATES = { 1: 'upcoming', 2: 'current', 3: 'closed',
  upcoming: 'upcoming', current: 'current', started: 'current', opened: 'upcoming', closed: 'closed' };

function gitlabScrumPlanning(issues) {
  const p = createPlanner('gitlab');
  (Array.isArray(issues) ? issues : []).forEach((issue, index) => {
    if (!issue || typeof issue !== 'object') return;
    const at = `/${index}`;
    const iteration = issue.iteration;
    if (iteration !== undefined && iteration !== null) {
      if (typeof iteration !== 'object' || Array.isArray(iteration)) {
        p.lost(`${at}/iteration`, 'an iteration in an unknown form is not imported; the issue stays in the backlog');
      } else {
        const title = text(iteration.title, 200);
        const id = iteration.id !== undefined && iteration.id !== null && String(iteration.id) ? String(iteration.id) : null;
        const key = id || (title ? `title:${title}` : null);
        if (!key) {
          p.lost(`${at}/iteration`, 'an iteration with neither an id nor a title is not imported; the issue stays in the backlog');
        } else {
          const sprintId = p.record(p.sprints, 'sprint', key, 'iteration', () => {
            const state = iteration.state === undefined || iteration.state === null ? 'missing'
              : GITLAB_ITERATION_STATES[iteration.state] || 'unknown';
            // An untitled iteration (the norm with iteration cadences) is
            // shown by GitLab as its dates; so is it here.
            const start = typeof iteration.start_date === 'string' ? iteration.start_date : '';
            const due = typeof iteration.due_date === 'string' ? iteration.due_date : '';
            const name = title || (start && due ? `${start} – ${due}` : '') ||
              `Iteration ${iteration.iid !== undefined && iteration.iid !== null ? iteration.iid : id}`;
            const label = `iteration "${name}"`;
            if (state === 'closed') {
              p.lost(`/iterations/${key}`, `closed ${label} is not imported: the export has no commitment or close snapshot`);
              return null;
            }
            if (state === 'unknown') {
              p.lost(`/iterations/${key}`, `${label} has an unknown state and is not imported`);
              return null;
            }
            if (state === 'current') {
              p.lost(`/iterations/${key}`, `current ${label} is imported as planned: the export has no commitment snapshot; start it in WeKan to begin measuring`);
            } else if (state === 'missing') {
              p.lost(`/iterations/${key}`, `${label} has no state in the export and is imported as planned`);
            }
            return { name, goal: text(iteration.description, 10000), state: 'planned',
              ...p.dates(`/iterations/${key}`, label, iteration.start_date, iteration.due_date) };
          });
          p.assign(index, 'sprintId', sprintId, `${at}/iteration`, `iteration ${shown(title || key)}`);
        }
      }
    }
    const milestone = issue.milestone;
    if (milestone !== undefined && milestone !== null) {
      const title = milestone && typeof milestone === 'object' ? text(milestone.title, 200) : '';
      if (!title) {
        p.lost(`${at}/milestone`, 'a milestone without a title is not imported');
      } else {
        const key = milestone.id !== undefined && milestone.id !== null && String(milestone.id) ? String(milestone.id) : `title:${title}`;
        const releaseId = p.record(p.releases, 'release', key, 'milestone', () => {
          const label = `milestone "${title}"`;
          let state = 'planned';
          if (milestone.state === 'closed') {
            state = 'released';
            p.lost(`/milestones/${key}`, `closed ${label} is imported as released without a release date: GitLab does not export when it was closed`);
          } else if (milestone.state !== 'active') {
            p.lost(`/milestones/${key}`, `${label} has ${milestone.state === undefined ? 'no state' : 'an unknown state'} in the export and is imported as planned`);
          }
          return { name: title, notes: text(milestone.description, 10000), state,
            ...p.dates(`/milestones/${key}`, label, milestone.start_date, milestone.due_date) };
        });
        p.assign(index, 'releaseId', releaseId, `${at}/milestone`, `milestone ${shown(title)}`);
      }
    }
  });
  return p.finish();
}

// --- OpenProject ------------------------------------------------------------

function hrefId(link) {
  const href = link && typeof link === 'object' ? link.href : undefined;
  const match = typeof href === 'string' && /\/(\d+)\/?$/.exec(href);
  return match ? match[1] : undefined;
}
function embeddedList(owner, key) {
  const value = owner && owner._embedded && owner._embedded[key];
  if (Array.isArray(value)) return value;
  return (value && Array.isArray(value.elements) && value.elements) || [];
}
const OPENPROJECT_SPRINT_STATES = { in_planning: 'planned', active: 'active', completed: 'completed' };

function openProjectScrumPlanning(data, elements) {
  const p = createPlanner('openproject');
  const resources = { version: new Map(), sprint: new Map() };
  const keep = (kind, resource) => {
    if (resource && typeof resource === 'object' && resource.id !== undefined && resource.id !== null) {
      resources[kind].set(String(resource.id), resource);
    }
  };
  embeddedList(data, 'versions').forEach(resource => keep('version', resource));
  embeddedList(data, 'sprints').forEach(resource => keep('sprint', resource));
  const items = Array.isArray(elements) ? elements : [];
  items.forEach(wp => {
    if (!wp || !wp._embedded) return;
    keep('version', wp._embedded.version);
    keep('sprint', wp._embedded.sprint);
  });
  let estimate = false;
  items.forEach((wp, index) => {
    if (!wp || typeof wp !== 'object') return;
    const at = `/_embedded/elements/${index}`;
    const links = wp._links || {};
    for (const kind of ['version', 'sprint']) {
      const link = links[kind];
      if (!link || typeof link !== 'object' || (!link.href && !link.title)) continue;
      const id = hrefId(link);
      const resource = id ? resources[kind].get(id) : undefined;
      const name = text((resource && resource.name) || link.title, 200);
      if (!name) {
        p.lost(`${at}/_links/${kind}`, `a ${kind} that is neither embedded nor titled is not imported; the work package stays in the backlog`);
        continue;
      }
      const key = id || `title:${name}`;
      const label = `${kind} "${name}"`;
      const path = `/${kind}s/${key}`;
      const description = resource && resource.description;
      const notes = text(description && typeof description === 'object' ? description.raw : description, 10000);
      if (kind === 'version') {
        const releaseId = p.record(p.releases, 'release', key, 'version', () => {
          if (!resource) {
            p.lost(path, `${label}: only its title is in the export (embed the version for its dates and status); imported as planned`);
            return { name, state: 'planned' };
          }
          let state = 'planned';
          if (resource.status === 'closed') {
            state = 'released';
            p.lost(path, `closed ${label} is imported as released without a release date: OpenProject does not export when it was closed`);
          } else if (!['open', 'locked'].includes(resource.status)) {
            p.lost(path, `${label} has ${resource.status === undefined ? 'no status' : 'an unknown status'} and is imported as planned`);
          }
          return { name, notes, state, ...p.dates(path, label, resource.startDate, resource.endDate) };
        });
        p.assign(index, 'releaseId', releaseId, `${at}/_links/version`, `version ${shown(name)}`);
      } else {
        const sprintId = p.record(p.sprints, 'sprint', key, 'sprint', () => {
          if (!resource) {
            p.lost(path, `${label}: only its title is in the export (embed the sprint for its dates and status); imported as planned`);
            return { name, state: 'planned' };
          }
          const statusLink = resource._links && resource._links.status;
          const urn = statusLink && typeof statusLink.href === 'string' ? statusLink.href : '';
          const state = OPENPROJECT_SPRINT_STATES[urn.replace(/^urn:openproject-org:api:v3:sprints:status:/, '')];
          if (state === 'completed') {
            p.lost(path, `completed ${label} is not imported: the export has no commitment or close snapshot`);
            return null;
          }
          if (state === 'active') {
            p.lost(path, `active ${label} is imported as planned: the export has no commitment snapshot; start it in WeKan to begin measuring`);
          } else if (!state) {
            p.lost(path, `${label} has ${urn ? 'an unknown status' : 'no status'} and is imported as planned`);
          }
          return { name, goal: notes, state: 'planned', ...p.dates(path, label, resource.startDate, resource.finishDate) };
        });
        p.assign(index, 'sprintId', sprintId, `${at}/_links/sprint`, `sprint ${shown(name)}`);
      }
    }
    // Backlogs: the rank in a sprint or product backlog, and story points.
    if (typeof wp.position === 'number' && Number.isFinite(wp.position)) p.ranks.push({ index, rank: wp.position });
    if (typeof wp.storyPoints === 'number' && Number.isFinite(wp.storyPoints) && wp.storyPoints >= 0) estimate = true;
  });
  return p.finish({ estimate: estimate ? { field: STORY_POINTS_FIELD, unit: 'points' } : null });
}

// --- Asana ------------------------------------------------------------------

function asanaScrumPlanning(items) {
  const p = createPlanner('asana');
  const tasks = Array.isArray(items) ? items : [];
  const indexByGid = new Map();
  tasks.forEach((t, index) => { if (t && t.gid !== undefined && t.gid !== null) indexByGid.set(String(t.gid), index); });
  const gids = list => (Array.isArray(list) ? list : []).map(d => d && d.gid).filter(g => g !== undefined && g !== null).map(String);
  // Milestones first, so a task's release does not depend on the task order.
  const milestones = [];
  tasks.forEach((t, index) => {
    if (!t || t.resource_subtype !== 'milestone') return;
    const name = text(t.name, 200);
    const gid = t.gid !== undefined && t.gid !== null ? String(t.gid) : '';
    if (!name || !gid) { p.lost(`/data/${index}`, 'a milestone without a name or gid is not imported as a release'); return; }
    const label = `milestone "${name}"`;
    const path = `/milestones/${gid}`;
    const releaseId = p.record(p.releases, 'release', gid, 'milestone', () => {
      let releasedAt;
      if (t.completed === true) {
        releasedAt = sourceDate(t.completed_at);
        if (!releasedAt) {
          p.lost(path, `completed ${label} has ${releasedAt === null ? 'a completion date that is not a date' : 'no completion date'}: imported as released without one`);
          releasedAt = undefined;
        }
      }
      return { name, notes: text(t.notes, 10000), state: t.completed === true ? 'released' : 'planned',
        ...(releasedAt ? { releasedAt } : {}), ...p.dates(path, label, t.start_on || t.start_at, t.due_on || t.due_at) };
    });
    milestones.push({ index, gid, name, releaseId });
  });
  for (const { index, gid, name, releaseId } of milestones) {
    p.assign(index, 'releaseId', releaseId, `/data/${index}`, `milestone ${shown(name)}`);
    // What the milestone waits for is what it releases.
    const blockers = new Set(gids(tasks[index].dependencies));
    tasks.forEach((t, other) => {
      if (other !== index && t && gids(t.dependents).includes(gid)) blockers.add(String(t.gid));
    });
    for (const blocker of blockers) {
      if (!indexByGid.has(blocker)) {
        p.lost(`/data/${index}/dependencies`, `task ${blocker} of milestone ${shown(name)} is not part of this import`);
        continue;
      }
      const other = indexByGid.get(blocker);
      if (tasks[other].resource_subtype === 'milestone') continue;
      p.assign(other, 'releaseId', releaseId, `/data/${other}/dependents`, `milestone ${shown(name)}`);
    }
  }
  return p.finish();
}

// --- Trello -----------------------------------------------------------------

// Trello has no native sprint or release records. Scrum Power-Ups keep their
// state in pluginData, whose `value` is private to each Power-Up and has no
// published schema: it is counted and reported, never guessed at.
function trelloScrumLosses(board) {
  const losses = [];
  if (!board || typeof board !== 'object') return losses;
  const count = value => (Array.isArray(value) ? value.length : 0);
  const onBoard = count(board.pluginData);
  if (onBoard) {
    losses.push({ path: '/pluginData', reason: `${onBoard} Power-Up data record(s) on the board are not imported: ` +
      'Trello has no native sprints or releases, and Power-Up data has no published schema' });
  }
  const cards = (Array.isArray(board.cards) ? board.cards : []).filter(card => card && count(card.pluginData));
  if (cards.length) {
    losses.push({ path: '/cards/pluginData', reason: `Power-Up data on ${cards.length} card(s) is not imported: ` +
      'Trello has no native sprints or releases, and Power-Up data has no published schema' });
  }
  return losses;
}

module.exports = { taskCardId, sourceDate, gitlabScrumPlanning, openProjectScrumPlanning, asanaScrumPlanning,
  trelloScrumLosses, STORY_POINTS_FIELD, GITLAB_ITERATION_STATES };
