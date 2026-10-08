'use strict';

const { normalizeScrumMetadata, cardReleaseIds } = require('./scrum');
const categories = new Map([['new', 'todo'], ['indeterminate', 'doing'], ['done', 'done']]);
const jiraCategories = new Map([...categories].map(([key, value]) => [value, key]));

function jiraScrumMetadata(fields = {}) {
  const card = {};
  if (fields.issuetype?.name !== undefined && fields.issuetype.name !== null) {
    Object.assign(card, normalizeScrumMetadata('card', { issueType: fields.issuetype.name }));
  }
  const category = categories.get(fields.status?.statusCategory?.key);
  return { card, list: category ? { category } : {} };
}

// Jira statuses are grouped into lists by name by the existing importer.
// Check the whole file before writes so two categories cannot silently merge.
function jiraScrumListCategories(issues) {
  const result = new Map();
  for (const issue of issues) {
    const fields = issue.fields || {};
    const { list } = jiraScrumMetadata(fields);
    if (!list.category) continue;
    const name = fields.status?.name || 'Imported';
    if (result.has(name) && result.get(name) !== list.category) {
      throw new Error('Jira statuses with the same name have conflicting Scrum categories');
    }
    result.set(name, list.category);
  }
  return result;
}

// A release as the Jira fix version the importer reads back
// (models/lib/jiraScrumPlanning.js): its Jira id when it came from Jira, its
// WeKan id otherwise; released or not; its planned end as the release date.
function jiraFixVersion(release) {
  const jiraId = release.provenance?.system === 'jira' && release.provenance.recordId;
  const end = release.plannedEnd || release.releasedAt;
  const date = end && Number.isFinite(new Date(end).getTime()) ? new Date(end).toISOString().slice(0, 10) : null;
  return { id: String(jiraId || release._id), name: release.name, released: release.state === 'released',
    ...(date ? { releaseDate: date } : {}), ...(release.notes ? { description: release.notes } : {}) };
}

// `releases` is a Map of the board's releases by id: each of the card's
// releases on that board is one fix version, in the card's order. A release
// that is not the board's, or no longer exists, is left out.
function jiraScrumMetadataExport(card, list, wanted = null, releases = null) {
  if (wanted && !wanted.has('scrum')) return {};
  const issueType = card.scrum?.issueType;
  const category = jiraCategories.get(list?.scrum?.category);
  const fixVersions = releases ? cardReleaseIds(card.scrum).map(id => releases.get(id))
    .filter(release => release && release.boardId === card.boardId && typeof release.name === 'string' && release.name.trim())
    .map(jiraFixVersion) : [];
  return {
    ...(typeof issueType === 'string' && issueType ? { issuetype: { name: issueType } } : {}),
    ...(category ? { statusCategory: { key: category } } : {}),
    ...(fixVersions.length ? { fixVersions } : {}),
  };
}

module.exports = { jiraScrumMetadata, jiraScrumListCategories, jiraScrumMetadataExport };
