'use strict';

// One ordered source registry for the HTML5 picker and the progressively
// enhanced HTML4 baseline. A source key is also the final /import/:source path
// segment, so keep keys URL-safe and stable for bookmarks.
const IMPORT_SOURCES = Object.freeze([
  { key: 'wekan', product: true },
  { key: 'trello', name: 'Trello' },
  { key: 'csv', name: 'CSV / TSV' },
  { key: 'excel', name: 'Excel' },
  { key: 'jira', name: 'Jira' },
  { key: 'kanboard', name: 'Kanboard' },
  { key: 'deck', name: 'NextCloud Deck' },
  { key: 'openproject', name: 'OpenProject' },
  { key: 'github', name: 'GitHub' },
  { key: 'gitlab', name: 'GitLab' },
  { key: 'gitea', name: 'Gitea' },
  { key: 'forgejo', name: 'Forgejo' },
  { key: 'asana', name: 'Asana' },
  { key: 'zenkit', name: 'Zenkit' },
]);

function importSourceByKey(key) {
  return IMPORT_SOURCES.find(source => source.key === key) || null;
}

function importSourceName(source, productName = 'WeKan') {
  if (!source) return '';
  return source.product ? `${productName || 'WeKan'} (JSON, .zip)` : source.name;
}

module.exports = { IMPORT_SOURCES, importSourceByKey, importSourceName };
