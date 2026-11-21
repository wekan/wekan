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
//                 'binary' its bytes (see binaryFiles): an Outlook .msg
//                 'zip'   only ever a .zip, sent as { zipBase64 } (a Sandstorm grain)
//   creator   - 'generalized' for models/kanboardCreator.js through
//               models/lib/externalParsers.js, else the source's own creator;
//               only the generalized importer can make one board per project
//   instruction - the instruction key's name when sources share one (Sandstorm's
//               apps: import-board-instruction-sandstorm, with the app's name)
//   package   - a .zip of many boards with their files, uploaded to a route
//               of its own (Trello's)
//   binaryFiles - extensions of a file that is neither text nor a .zip, sent
//               as { binaryFile } from an upload or { binaryBase64 } (an
//               Outlook .msg, the Teams export's .tar)

const JSON_FILE = ['.json'];
const TEXT = { paste: true, send: 'text', creator: 'generalized' };
const JSON_SOURCE = { paste: true, files: JSON_FILE, send: 'json', creator: 'generalized' };
const EXCEL = { files: ['.xlsx'], send: 'excel', creator: 'generalized' };
const GRAIN = { paste: false, files: ['.zip'], send: 'zip', zipSend: 'zip', creator: 'generalized', instruction: 'sandstorm' };

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
  // Azure DevOps Boards' "Export to CSV" of a query, and Microsoft Lists'
  // "Export to CSV" of a list.
  { key: 'azuredevops', name: 'Azure DevOps Boards', ...TEXT, files: ['.csv'] },
  { key: 'mslists', name: 'Microsoft Lists', ...TEXT, files: ['.csv'] },
  // Microsoft Project's "XML Format (*.xml)" (MSPDI); the .mpp is not read.
  { key: 'msproject', name: 'Microsoft Project (XML)', ...TEXT, files: ['.xml'] },
  // Outlook's .msg files - binary, read on the server - or a .zip of .msg
  // and .eml files.
  { key: 'outlook', name: 'Microsoft Outlook (.msg)', paste: false, files: ['.msg', '.zip'], send: 'binary', zipSend: 'zip',
    binaryFiles: ['.msg'], creator: 'generalized' },
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
  // Fizzy's account export or personal data export (.zip), or one card's .json.
  { key: 'fizzy', name: 'Fizzy', ...TEXT, files: ['.zip', '.json'], zipSend: 'zip' },
  { key: 'plane', name: 'Plane', ...TEXT, files: ['.zip', '.json', '.csv', '.xlsx'], zipSend: 'zip' },
  // Mail (Board View / Email), calendars (Calendar, Gantt), chats (Board View
  // / Chat) and notes. A .zip of these is one export of the tool.
  { key: 'mail', name: 'Mail (mbox, .eml)', ...TEXT, files: ['.mbox', '.eml', '.txt'] },
  { key: 'ical', name: 'iCalendar (.ics)', ...TEXT, files: ['.ics', '.ical'] },
  { key: 'googletakeout', name: 'Google Takeout', paste: false, files: ['.zip'], send: 'text', zipSend: 'zip', creator: 'generalized' },
  { key: 'slack', name: 'Slack', paste: false, files: ['.zip'], send: 'text', zipSend: 'zip', creator: 'generalized' },
  { key: 'mattermost', name: 'Mattermost', ...TEXT, files: ['.jsonl', '.json'] },
  // Its JSON, or the export folder zipped with the message files beside it.
  { key: 'telegram', name: 'Telegram', ...JSON_SOURCE, files: ['.json', '.zip'], zipSend: 'zip' },
  { key: 'whatsapp', name: 'WhatsApp', ...TEXT, files: ['.txt'] },
  // Its JSON, or the export folder zipped with the message files beside it.
  { key: 'discord', name: 'Discord (DiscordChatExporter)', ...JSON_SOURCE, files: ['.json', '.zip'], zipSend: 'zip' },
  // "Download my data" as JSON (a .zip), one room's .json, or the .zip
  // Rocket.Chat's CSV importer reads.
  { key: 'rocketchat', name: 'Rocket.Chat', ...TEXT, files: ['.zip', '.json'], zipSend: 'zip' },
  { key: 'evernote', name: 'Evernote (.enex)', ...TEXT, files: ['.enex', '.xml'] },
  // Sandstorm (sandstorm.org): an app's grain backup .zip (Download backup),
  // read on the server (server/lib/sandstormGrain.js, models/lib/sandstorm/).
  // One instruction for all of them, naming the app.
  { key: 'sandstormwekan', name: 'Sandstorm WeKan', ...GRAIN },
  { key: 'sandstormprioritize', name: 'Sandstorm Prioritize', ...GRAIN },
  { key: 'sandstormyatl', name: 'Sandstorm Yet Another TODO list', ...GRAIN },
  { key: 'sandstormmutodo', name: 'Sandstorm μTodo', ...GRAIN },
  { key: 'sandstormsandchat', name: 'Sandstorm SandChat', ...GRAIN },
  { key: 'sandstormethercalc', name: 'Sandstorm EtherCalc', ...GRAIN },
  { key: 'sandstormradicalecalendar', name: 'Sandstorm Radicale calendar', ...GRAIN },
  { key: 'sandstormradicalecontacts', name: 'Sandstorm Radicale address book', ...GRAIN },
  { key: 'sandstormdavros', name: 'Sandstorm Davros', ...GRAIN },
  { key: 'sandstormhackercms', name: 'Sandstorm Hacker CMS', ...GRAIN },
  { key: 'sandstormgogs', name: 'Sandstorm Gogs', ...GRAIN },
  { key: 'sandstormwordpress', name: 'Sandstorm WordPress', ...GRAIN },
  // Fetched from the service's API with the member's credentials
  // (models/lib/apiImportServices.js, server/apiImport.js), or pasted as the
  // JSON such a fetch returns.
  { key: 'planka', name: 'Planka', ...JSON_SOURCE, api: true },
  { key: 'mstodo', name: 'Microsoft To Do', ...JSON_SOURCE, api: true },
  // Fetched from Microsoft Graph, or a file: OneNote the .zip WeKan exports,
  // Teams its personal export (.tar), Graph's chat messages (.json) or the
  // .zip WeKan exports.
  { key: 'onenote', name: 'Microsoft OneNote', ...JSON_SOURCE, files: ['.json', '.zip'], zipSend: 'zip', api: true },
  { key: 'teams', name: 'Microsoft Teams', ...JSON_SOURCE, files: ['.json', '.tar', '.zip'], zipSend: 'zip', binaryFiles: ['.tar'], api: true },
  { key: 'kanbanflow', name: 'KanbanFlow', ...JSON_SOURCE, api: true },
  { key: 'basecamp', name: 'Basecamp', ...JSON_SOURCE, api: true },
  { key: 'googletasks', name: 'Google Tasks', ...JSON_SOURCE, api: true },
  { key: 'googlekeep', name: 'Google Keep', ...JSON_SOURCE, api: true },
];

export const importSource = key => IMPORT_SOURCES.find(source => source.key === key) || null;
export const isGeneralized = key => (importSource(key) || {}).creator === 'generalized';
// The file chooser's accept attribute for a source.
export const acceptFor = key => ((importSource(key) || {}).files || []).join(',');
// A .zip that is one export of the tool, not a container of many files.
export const zipIsOneExport = key => Boolean((importSource(key) || {}).zipSend);
export const instructionKey = key => `import-board-instruction-${(importSource(key) || {}).instruction || key}`;
// Whether the import page offers to fetch it from the service's API.
export const isApiImport = key => Boolean((importSource(key) || {}).api);
// Whether a file of this name is sent as bytes for this source.
export const isBinaryFile = (key, name) => ((importSource(key) || {}).binaryFiles || [])
  .some(ext => String(name || '').toLowerCase().endsWith(ext));
