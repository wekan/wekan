'use strict';

// docs/Features/ImportExport/External-Tools.md is the page the README links
// for "what can WeKan import and export". It went stale once (ten tools when
// WeKan read fifty), so every source on the import page and every format in
// the export menu has to be named on it. Run:
// node tests/importExportDocsCoverage.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const doc = read('docs/Features/ImportExport/External-Tools.md');
// The import page's sources are the one list it reads (models/lib/importSources.js).
const importPage = read('models/lib/importSources.js');
const exportMenu = read('client/components/boards/exportScope.js');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

// How a name in the code is written on the page, when it differs.
const ON_PAGE = { 'CSV / TSV': 'CSV / TSV', 'NextCloud Deck': 'Nextcloud Deck', '(,)': 'CSV', '(;)': 'CSV', 'Org mode': 'Org mode' };
const named = name => doc.includes(ON_PAGE[name] || name);

test('every import source is on the page', () => {
  const sources = [...importPage.matchAll(/\{ key: '([a-z]+)', name: '([^']+)'/g)].map(m => m[2]);
  assert.ok(sources.length >= 40, `the import sources are found (${sources.length})`);
  assert.deepEqual(sources.filter(name => !named(name)), []);
});

test('every export format is on the page', () => {
  const labels = [
    ...[...exportMenu.matchAll(/key: '[a-z-]+', icon: '[^']+', label: '([^']+)', path: 'export\//g)].map(m => m[1]),
    ...[...exportMenu.matchAll(/\['[a-z]+', '([^']+)'\]/g)].map(m => m[1]),
  ];
  assert.ok(labels.length >= 40, `the export formats are found (${labels.length})`);
  assert.deepEqual(labels.filter(label => !named(label)), []);
  assert.match(doc, /\| \[Wrike workflow\]\(\.\/Wrike\/Wrike\.md\) \|/, 'the Wrike workflow has its own row, linking its page');
});

test('the README links the page from its import and export lists', () => {
  const readme = read('README.md');
  assert.match(readme, /Add Board \/ Import \(\[all import and export formats\]\(docs\/Features\/ImportExport\/External-Tools\.md\)\):/);
  assert.match(readme, /Export to \(\[all formats\]\(docs\/Features\/ImportExport\/External-Tools\.md\)\):/);
});

// Each import source and export format has a directory of its own under
// docs/Features/ImportExport, with the steps and the details, linked from the
// coverage index (which used to hold every format's details in one table).
const DIRECTORY = {
  wekan: 'WeKan', json: 'WeKan', 'json-no-attachments': 'WeKan', zip: 'WeKan', trello: 'Trello', csv: 'CSV', scsv: 'CSV', tsv: 'CSV',
  excel: 'Excel', pdf: 'PDF', html: 'HTML', ical: 'iCalendar', 'dep-json': 'Dependencies', 'dep-svg': 'Dependencies', jira: 'Jira',
  kanboard: 'Kanboard', deck: 'Nextcloud-Deck', openproject: 'OpenProject', github: 'GitHub', gitlab: 'GitLab', gitea: 'Gitea',
  forgejo: 'Forgejo', asana: 'Asana', zenkit: 'ZenKit', markdown: 'Markdown', leo: 'Leo', opml: 'OPML', orgmode: 'Org-mode',
  todotxt: 'Todo-txt', taskwarrior: 'Taskwarrior', focalboard: 'Focalboard', todoist: 'Todoist', planner: 'Microsoft-Planner',
  meistertask: 'MeisterTask', obsidian: 'Obsidian-Kanban', linear: 'Linear', ticktick: 'TickTick', clickup: 'ClickUp',
  nullboard: 'Nullboard', kanri: 'Kanri', pivotal: 'Pivotal-Tracker', redmine: 'Redmine', tasksorg: 'Tasks-org',
  monday: 'monday-com', superproductivity: 'Super-Productivity', taiga: 'Taiga', vikunja: 'Vikunja', wrike: 'Wrike',
  wrikeworkflow: 'Wrike', teamwork: 'Teamwork', businessmap: 'Businessmap', quire: 'Quire', notion: 'Notion', plane: 'Plane',
};
const HEADINGS = ['How to import', 'How to import many boards at once', 'How to export', 'How to export all boards at once',
  'Format details', 'What is kept', 'What is not kept', 'REST API', 'How it is built and tested', 'Sources'];

test('every import source and export format has its own page, with the steps and details, linked from the index', () => {
  const keys = [
    ...[...importPage.matchAll(/\{ key: '([a-z]+)', (?:name: '[^']+'|product: true)/g)].map(m => m[1]),
    ...[...exportMenu.matchAll(/\{ key: '([a-z-]+)', icon: '[^']+'/g)].map(m => m[1]),
    ...[...exportMenu.matchAll(/\['([a-z]+)', '[^']+'\]/g)].map(m => m[1]),
    ...[...exportMenu.matchAll(/^\s+key: '([a-z-]+)',$/gm)].map(m => m[1]).filter(key => !['files', 'calendar', 'dependencies', 'csv', 'json', 'tools'].includes(key) || key === 'zip'),
  ];
  const unmapped = [...new Set(keys)].filter(key => !DIRECTORY[key] && !['files', 'calendar', 'dependencies', 'json', 'tools', 'other'].includes(key));
  assert.deepEqual(unmapped, [], 'a format with no directory page');
  const index = read('docs/Features/ImportExport/Format-Coverage.md');
  for (const dir of new Set(Object.values(DIRECTORY))) {
    const page = read(`docs/Features/ImportExport/${dir}/${dir}.md`);
    // A heading is matched as text: its characters are escaped, not read as
    // regular-expression syntax.
    const at = HEADINGS.map(h => page.search(new RegExp(`^## ${h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm')));
    assert.ok(at.every(i => i !== -1), `${dir}.md has every section: ${HEADINGS.filter((h, i) => at[i] === -1).join(', ')}`);
    assert.deepEqual([...at].sort((x, y) => x - y), at, `${dir}.md has them in order`);
    assert.ok(index.includes(`](./${dir}/${dir}.md)`), `the coverage index links ${dir}`);
    assert.doesNotMatch(page, /\/api\/boards\/export-all\//, `${dir}.md names the mass export route as it is`);
  }
});

test('the coverage index holds no format\'s details any more, only the index and the shared contract', () => {
  const index = read('docs/Features/ImportExport/Format-Coverage.md');
  assert.doesNotMatch(index, /^\| Format \| Current authoritative shape/m);
  assert.doesNotMatch(index, /^## Current external adapter checkpoint/m);
  assert.match(index, /^## Formats$/m);
  assert.match(index, /^## Many boards at once$/m);
  assert.match(index, /^## One validation and sanitization boundary$/m);
});

test('negative: a name missing from the page is caught', () => {
  assert.equal(named('Some Tool WeKan Does Not Know'), false);
});

console.log(`\nimportExportDocsCoverage: ${passed} checks passed`);
