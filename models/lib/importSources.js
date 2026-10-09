// Every import source, described once: what the import page offers for it,
// what its file is sent as, and which importer creates the board. The import
// page, "Import many boards" (models/lib/importManyFiles.js) and the server
// read this instead of each keeping a list of its own.
//
//   key       - the source's name everywhere: the page's address
//               (/import/<key>), importBoard's source and the REST route
//               POST /api/boards/import/<key>
//   name      - shown on the page; `product: true` shows this WeKan's own
//               product name instead
//   files     - the file extensions the page's file chooser accepts; none
//               means the source is pasted only
//   paste     - whether its text can be pasted into the page's text box
//   send      - what a chosen file is sent as:
//                 'text'  its text (TEXT_SOURCES of importManyFiles)
//                 'json'  its parsed JSON
//                 'excel' { excelBase64 } (Plane's workbook: { xlsxBase64 })
//                 'zip'   { zipBase64 } - the .zip is ONE export of the tool
//                 'rows'  CSV/TSV rows
//                 'own'   the source's own upload route (WeKan .zip, Trello .zip)
//   creator   - 'generalized' for models/kanboardCreator.js through
//               models/lib/externalParsers.js, else the source's own creator;
//               only the generalized importer can make one board per project
//   package   - a .zip of many boards with their files, uploaded to a route
//               of its own (Trello's)

const JSON_FILE = ['.json'];
const TEXT = { paste: true, send: 'text', creator: 'generalized' };
const JSON_SOURCE = { paste: true, files: JSON_FILE, send: 'json', creator: 'generalized' };
const EXCEL = { files: ['.xlsx'], send: 'excel', creator: 'generalized' };

export const IMPORT_SOURCES = [
  { key: 'wekan', product: true, paste: true, files: ['.json', '.zip'], send: 'json', zipSend: 'own', creator: 'wekan' },
  { key: 'trello', name: 'Trello', paste: true, files: JSON_FILE, send: 'json', creator: 'trello', package: true },
  { key: 'csv', name: 'CSV / TSV', paste: true, files: ['.csv', '.tsv', '.txt'], send: 'rows', creator: 'csv' },
  { key: 'excel', name: 'Excel', files: ['.xlsx'], send: 'excel', creator: 'csv' },
  { key: 'jira', name: 'Jira', paste: true, files: JSON_FILE, send: 'json', creator: 'jira' },
  { key: 'kanboard', name: 'Kanboard', ...JSON_SOURCE },
  { key: 'deck', name: 'NextCloud Deck', ...JSON_SOURCE },
  { key: 'openproject', name: 'OpenProject', ...JSON_SOURCE },
  { key: 'github', name: 'GitHub', ...JSON_SOURCE },
  { key: 'gitlab', name: 'GitLab', ...JSON_SOURCE },
  { key: 'gitea', name: 'Gitea', ...JSON_SOURCE },
  { key: 'forgejo', name: 'Forgejo', ...JSON_SOURCE },
  { key: 'asana', name: 'Asana', ...JSON_SOURCE },
  { key: 'zenkit', name: 'Zenkit', ...JSON_SOURCE },
  { key: 'markdown', name: 'Markdown', ...TEXT, files: ['.md', '.markdown', '.txt'] },
  { key: 'leo', name: 'Leo', ...TEXT, files: ['.leo'] },
  { key: 'opml', name: 'OPML', ...TEXT, files: ['.opml', '.xml'] },
  { key: 'orgmode', name: 'Org mode', ...TEXT, files: ['.org'] },
  { key: 'todotxt', name: 'todo.txt', ...TEXT, files: ['.txt'] },
  { key: 'taskwarrior', name: 'Taskwarrior', ...TEXT, files: ['.json'] },
  { key: 'focalboard', name: 'Focalboard', ...TEXT, files: ['.jsonl', '.json'] },
  { key: 'todoist', name: 'Todoist', ...TEXT, files: ['.csv'] },
  { key: 'planner', name: 'Microsoft Planner', ...EXCEL },
  { key: 'meistertask', name: 'MeisterTask', ...TEXT, files: ['.csv'] },
  { key: 'obsidian', name: 'Obsidian Kanban', ...TEXT, files: ['.md'] },
  { key: 'linear', name: 'Linear', ...TEXT, files: ['.csv'] },
  { key: 'ticktick', name: 'TickTick', ...TEXT, files: ['.csv'] },
  { key: 'clickup', name: 'ClickUp', ...TEXT, files: ['.csv'] },
  { key: 'nullboard', name: 'Nullboard', ...TEXT, files: ['.nbx', '.json'] },
  { key: 'kanri', name: 'Kanri', ...JSON_SOURCE },
  { key: 'pivotal', name: 'Pivotal Tracker', ...TEXT, files: ['.csv'] },
  { key: 'redmine', name: 'Redmine', ...TEXT, files: ['.csv'] },
  { key: 'tasksorg', name: 'Tasks.org', ...JSON_SOURCE },
  { key: 'monday', name: 'monday.com', ...EXCEL },
  { key: 'superproductivity', name: 'Super Productivity', ...TEXT, files: ['.json'] },
  { key: 'taiga', name: 'Taiga', ...JSON_SOURCE },
  { key: 'vikunja', name: 'Vikunja', ...TEXT, files: ['.zip', '.json'], zipSend: 'zip' },
  { key: 'wrike', name: 'Wrike', ...EXCEL },
  { key: 'teamwork', name: 'Teamwork.com', ...EXCEL },
  { key: 'businessmap', name: 'Businessmap (Kanbanize)', ...EXCEL },
  { key: 'quire', name: 'Quire', ...TEXT, files: ['.csv'] },
  { key: 'notion', name: 'Notion', ...TEXT, files: ['.zip', '.csv'], zipSend: 'zip' },
  { key: 'plane', name: 'Plane', ...TEXT, files: ['.zip', '.json', '.csv', '.xlsx'], zipSend: 'zip' },
];

export const importSource = key => IMPORT_SOURCES.find(source => source.key === key) || null;
export const isGeneralized = key => (importSource(key) || {}).creator === 'generalized';
// The file chooser's accept attribute for a source.
export const acceptFor = key => ((importSource(key) || {}).files || []).join(',');
// A .zip that is one export of the tool, not a container of many files.
export const zipIsOneExport = key => Boolean((importSource(key) || {}).zipSend);
export const instructionKey = key => `import-board-instruction-${key}`;
