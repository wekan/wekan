'use strict';

const { normalizeScrumMetadata } = require('./scrum');
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

function jiraScrumMetadataExport(card, list, wanted = null) {
  if (wanted && !wanted.has('scrum')) return {};
  const issueType = card.scrum?.issueType;
  const category = jiraCategories.get(list?.scrum?.category);
  return {
    ...(typeof issueType === 'string' && issueType ? { issuetype: { name: issueType } } : {}),
    ...(category ? { statusCategory: { key: category } } : {}),
  };
}

module.exports = { jiraScrumMetadata, jiraScrumListCategories, jiraScrumMetadataExport };
