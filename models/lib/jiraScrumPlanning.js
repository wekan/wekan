'use strict';
// Jira sprints, fix versions, rank and epic links as WeKan Scrum planning data
// (docs/Features/Right-Sidebar/Board-Settings/Board-View/Scrum-Design.md:
// "Jira mappings use the supplied field schema and explicit user choices, not
// hard-coded customfield_* numbers ... report those gaps; do not claim
// complete Jira preservation").
//
// The planning fields are found by what the export says they are: the field
// schema (search with expand=schema: `schema[id].custom`) or, failing that,
// the field names (expand=names: `names[id]`). What the import makes:
//
//   * a FUTURE or ACTIVE Jira sprint becomes a planned WeKan sprint with its
//     goal and dates. An active sprint is reported as a loss: WeKan's started
//     sprint carries a commitment snapshot taken when it started, and issue
//     search JSON has none, so it is not invented. A CLOSED sprint is
//     reported and not imported, for the same reason (no close snapshot).
//   * a fix version becomes a release: released (with its date) or planned.
//     A card takes its first fix version; further ones are reported, since a
//     card has one release. Fix versions still become version: labels too, as
//     before.
//   * the card's sprint is its open (future or active) sprint, the last one
//     listed when there are several.
//   * the rank (Jira's LexoRank string) orders the backlog: backlogRank 1..n
//     in rank order.
//   * a legacy Epic Link names the card's epic: it becomes the card's parent
//     when the epic is imported too. Newer Jira uses `parent`, which the
//     importer already follows.
//
// The result is a native Scrum transfer (models/lib/scrumTransfer.js) keyed by
// Jira ids and issue keys, which the importer remaps and writes like a native
// import (server/lib/scrumTransferImport.js). Pure: tested by
// tests/jiraScrumPlanning.test.cjs.
const { jiraScrumMetadata } = require('./jiraScrumMetadata');

const SCHEMA = {
  sprint: 'com.pyxis.greenhopper.jira:gh-sprint',
  rank: 'com.pyxis.greenhopper.jira:gh-lexo-rank',
  epicLink: 'com.pyxis.greenhopper.jira:gh-epic-link',
};
const NAMES = { sprint: ['sprint'], rank: ['rank'], epicLink: ['epic link'] };

// The planning fields' ids: by schema first, by name otherwise.
function jiraPlanningFields(data) {
  const schema = (data && !Array.isArray(data) && data.schema) || {};
  const names = (data && !Array.isArray(data) && data.names) || {};
  const found = {};
  for (const kind of Object.keys(SCHEMA)) {
    const bySchema = Object.keys(schema).find(id => schema[id] && schema[id].custom === SCHEMA[kind]);
    const byName = Object.keys(names).find(id => typeof names[id] === 'string' &&
      NAMES[kind].includes(names[id].trim().toLowerCase()));
    const id = bySchema || byName;
    if (id && /^customfield_\d+$/.test(id)) found[kind] = id;
  }
  return found;
}

// A sprint as Jira gives it: an object (Cloud, Server 8+) or the legacy
// toString form "com.atlassian.greenhopper.service.sprint.Sprint@1a2b[id=7,
// rapidViewId=1,state=ACTIVE,name=Sprint 7,startDate=...,endDate=...,...]".
function parseJiraSprint(value) {
  let raw = value;
  if (typeof value === 'string') {
    const body = /\[(.*)\]\s*$/.exec(value);
    if (!body) return null;
    raw = {};
    // Values may contain commas (names, goals): split on ",key=" only.
    for (const part of body[1].split(/,(?=[a-zA-Z]+=)/)) {
      const at = part.indexOf('=');
      if (at > 0) raw[part.slice(0, at)] = part.slice(at + 1);
    }
  }
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id === undefined || raw.id === null ? '' : String(raw.id);
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const state = String(raw.state || '').toLowerCase();
  if (!/^\d+$/.test(id) || !name || !['future', 'active', 'closed'].includes(state)) return null;
  const when = text => {
    if (typeof text !== 'string' || !text || text === '<null>') return null;
    const date = new Date(text);
    return Number.isFinite(date.getTime()) ? date : null;
  };
  const goal = typeof raw.goal === 'string' && raw.goal !== '<null>' ? raw.goal : '';
  return { id, name: name.slice(0, 200), state, goal, startDate: when(raw.startDate), endDate: when(raw.endDate) };
}

const sprintId = id => `jira-sprint-${id}`;
const releaseId = id => `jira-version-${id}`;

// `estimate` is { sourceId, unit } when the import maps an estimate field
// (models/lib/jiraEstimateMapping.js), so the board's Scrum settings keep it.
function jiraScrumPlanning(data, { estimate = null } = {}) {
  const issues = (Array.isArray(data) ? data : (data && data.issues) || []).filter(issue => issue && issue.key);
  const fields = jiraPlanningFields(data);
  const keys = new Set(issues.map(issue => issue.key));
  const sprints = new Map(), releases = new Map(), losses = [], cards = [], epicParents = {};
  const lost = (path, reason) => losses.push({ path, reason });
  const ranks = [];
  issues.forEach((issue, index) => {
    const f = issue.fields || {};
    const at = `issues[${index}]`;
    const scrum = { ...jiraScrumMetadata(f).card };
    // Sprints.
    const listed = fields.sprint ? (Array.isArray(f[fields.sprint]) ? f[fields.sprint] : f[fields.sprint] ? [f[fields.sprint]] : []) : [];
    let open = null;
    for (const value of listed) {
      const sprint = parseJiraSprint(value);
      if (!sprint) { lost(`${at}/${fields.sprint}`, 'a sprint value Jira gave in an unknown form'); continue; }
      if (sprint.state === 'closed') {
        if (!sprints.has(sprint.id)) {
          sprints.set(sprint.id, null);
          lost(`sprint/${sprint.id}`, `closed sprint "${sprint.name}" is not imported: the export has no commitment or close snapshot`);
        }
        continue;
      }
      if (!sprints.get(sprint.id)) {
        sprints.set(sprint.id, sprint);
        if (sprint.state === 'active') {
          lost(`sprint/${sprint.id}`, `active sprint "${sprint.name}" is imported as planned: the export has no commitment snapshot; start it in WeKan to begin measuring`);
        }
      }
      open = sprint;
    }
    if (open) scrum.sprintId = sprintId(open.id);
    // Fix versions.
    const versions = (Array.isArray(f.fixVersions) ? f.fixVersions : [])
      .filter(version => version && version.id !== undefined && typeof version.name === 'string' && version.name.trim());
    versions.forEach((version, i) => {
      const id = String(version.id);
      if (!releases.has(id)) {
        const date = typeof version.releaseDate === 'string' && Number.isFinite(new Date(version.releaseDate).getTime())
          ? new Date(version.releaseDate) : null;
        releases.set(id, { _id: releaseId(id), name: version.name.trim().slice(0, 200),
          notes: typeof version.description === 'string' ? version.description : '',
          state: version.released === true ? 'released' : 'planned',
          ...(date ? { plannedEnd: date } : {}), ...(date && version.released === true ? { releasedAt: date } : {}),
          provenance: { system: 'jira', recordId: id } });
      }
      if (i === 0) scrum.releaseId = releaseId(id);
      else lost(`${at}/fixVersions/${i}`, `fix version "${version.name}" is not the card's release: a card has one release`);
    });
    // Rank.
    const rank = fields.rank ? f[fields.rank] : undefined;
    if (typeof rank === 'string' && rank) ranks.push({ index, rank });
    // Epic link.
    const epic = fields.epicLink ? f[fields.epicLink] : undefined;
    if (typeof epic === 'string' && epic) {
      if (keys.has(epic) && epic !== issue.key) epicParents[issue.key] = epic;
      else if (!keys.has(epic)) lost(`${at}/${fields.epicLink}`, `epic ${epic} is not part of this import`);
    }
    cards.push({ _id: issue.key, scrum });
  });
  // Rank: LexoRank strings order lexicographically.
  ranks.sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : a.index - b.index))
    .forEach(({ index }, i) => { cards[index].scrum.backlogRank = i + 1; });
  const planned = [...sprints.values()].filter(Boolean).map(sprint => ({ _id: sprintId(sprint.id), name: sprint.name,
    goal: sprint.goal, state: 'planned', ...(sprint.startDate ? { plannedStart: sprint.startDate } : {}),
    ...(sprint.endDate && (!sprint.startDate || sprint.endDate >= sprint.startDate) ? { plannedEnd: sprint.endDate } : {}),
    provenance: { system: 'jira', recordId: sprint.id } }));
  const any = planned.length > 0 || releases.size > 0 || ranks.length > 0;
  const settings = { ...(planned.length || releases.size ? { enabled: true } : {}),
    ...(estimate ? { estimateSource: 'customField', estimateCustomFieldId: estimate.sourceId, estimateUnit: estimate.unit } : {}) };
  const transfer = any ? { format: 'wekan-scrum-2', settings, sprints: planned, releases: [...releases.values()],
    events: [], cards: cards.filter(card => Object.keys(card.scrum).length), lists: [], swimlanes: [] } : null;
  return { fields, transfer, losses, epicParents,
    // The importer leaves these out of its generic custom fields: they are
    // planning data now.
    skipFields: [fields.sprint, fields.rank, fields.epicLink].filter(Boolean) };
}

module.exports = { jiraPlanningFields, parseJiraSprint, jiraScrumPlanning, JIRA_PLANNING_SCHEMA: SCHEMA };
