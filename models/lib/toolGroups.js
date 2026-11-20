'use strict';
// The groups the Import page and the Export menu show the other tools under
// (2026-11-20: asked so a list of some sixty tools reads by kind, the way
// docs/Features/Board-Sidebar/Board-Settings/Import-Export/External-Tools.md
// groups them). One table for both sides, so a tool is in the same group
// whether it is read or written. Pure CommonJS: tests/toolGroups.test.cjs.

const TOOL_GROUPS = [
  { group: 'wekan', labelKey: null }, // WeKan's own: headed by the product name
  { group: 'kanban', labelKey: 'tool-group-kanban' },
  { group: 'issues', labelKey: 'tool-group-issues' },
  { group: 'tasks', labelKey: 'tool-group-tasks' },
  { group: 'spreadsheets', labelKey: 'tool-group-spreadsheets' },
  { group: 'text', labelKey: 'tool-group-text' },
  { group: 'messages', labelKey: 'tool-group-messages' },
  { group: 'api', labelKey: 'tool-group-api' },
];

const MEMBERS = {
  wekan: ['wekan', 'json', 'json-no-attachments', 'zip'],
  kanban: ['trello', 'trello-api', 'trellozip', 'kanboard', 'deck', 'openproject', 'asana', 'zenkit', 'planner', 'monday', 'wrike',
    'wrikeworkflow', 'teamwork', 'businessmap', 'clickup', 'notion', 'plane', 'taiga', 'focalboard', 'nullboard', 'kanri',
    'obsidian', 'meistertask', 'quire'],
  issues: ['jira', 'github', 'gitlab', 'gitea', 'forgejo', 'redmine', 'linear', 'pivotal'],
  tasks: ['todoist', 'ticktick', 'tasksorg', 'superproductivity', 'todotxt', 'taskwarrior', 'vikunja'],
  spreadsheets: ['csv', 'excel'],
  text: ['markdown', 'leo', 'opml', 'orgmode'],
  messages: ['mail', 'mbox', 'ical', 'googletakeout', 'slack', 'mattermost', 'telegram', 'whatsapp', 'discord', 'evernote', 'enex'],
  api: ['planka', 'mstodo', 'kanbanflow', 'basecamp', 'googletasks', 'googlekeep'],
};
const GROUP_OF = new Map(Object.entries(MEMBERS).flatMap(([group, keys]) => keys.map(key => [key, group])));
const INDEX = new Map(TOOL_GROUPS.map((g, i) => [g.group, i]));

// The group of a tool key; a key no group names is in Kanban and project tools.
const toolGroupOf = key => GROUP_OF.get(key) || 'kanban';

// items (each with `key`) grouped in TOOL_GROUPS order, their own order kept
// inside a group; the first of each group carries `groupLabelKey` (null for
// WeKan's own, whose heading is the product name) and `groupStart: true`.
function groupTools(items) {
  const sorted = (items || []).map((item, i) => ({ item, i, g: INDEX.get(toolGroupOf(item.key)) }))
    .sort((a, b) => (a.g - b.g) || (a.i - b.i));
  return sorted.map(({ item, g }, n) => {
    const start = n === 0 || sorted[n - 1].g !== g;
    return { ...item, group: TOOL_GROUPS[g].group, groupStart: start, groupLabelKey: start ? TOOL_GROUPS[g].labelKey : null };
  });
}

module.exports = { TOOL_GROUPS, MEMBERS, toolGroupOf, groupTools };
