'use strict';
// The groups the Import page and the Export menu show the other tools under
// (2026-11-20: asked so a list of some sixty tools reads by kind, the way
// docs/Features/Board-Sidebar/Board-Settings/Import-Export/External-Tools.md
// groups them). One table for both sides, so a tool is in the same group
// whether it is read or written. Pure CommonJS: tests/toolGroups.test.cjs.
//
// A company with MORE than one product here gets a group of its own, headed
// by the company's name, and its products are shown without that name in
// front of them: under "Microsoft" it is Planner, To Do, Lists, Excel, ...,
// not "Microsoft Planner". A company with one product stays in the group of
// its kind. The heading is the company's name, so it is not translated.

const TOOL_GROUPS = [
  { group: 'wekan', labelKey: null }, // WeKan's own: headed by the product name
  { group: '37signals', label: '37signals' },
  { group: 'atlassian', label: 'Atlassian' },
  { group: 'google', label: 'Google' },
  { group: 'microsoft', label: 'Microsoft' },
  // Not a company, but the same: a platform whose apps are listed under it.
  { group: 'sandstorm', label: 'Sandstorm' },
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
  '37signals': ['basecamp', 'fizzy'],
  atlassian: ['trello', 'trello-api', 'trellozip', 'jira'],
  google: ['googletakeout', 'googletasks', 'googlekeep'],
  microsoft: ['planner', 'mstodo', 'azuredevops', 'mslists', 'msproject', 'outlook', 'teams', 'onenote', 'excel', 'github'],
  sandstorm: ['sandstormwekan', 'sandstormprioritize', 'sandstormyatl', 'sandstormmutodo', 'sandstormsandchat', 'sandstormethercalc', 'sandstormradicalecalendar', 'sandstormradicalecontacts', 'sandstormdavros', 'sandstormhackercms', 'sandstormgogs', 'sandstormwordpress'],
  kanban: ['kanboard', 'deck', 'openproject', 'asana', 'zenkit', 'monday', 'wrike',
    'wrikeworkflow', 'teamwork', 'businessmap', 'clickup', 'notion', 'plane', 'taiga', 'focalboard', 'nullboard', 'kanri',
    'obsidian', 'meistertask', 'quire'],
  issues: ['gitlab', 'gitea', 'forgejo', 'redmine', 'linear', 'pivotal'],
  tasks: ['todoist', 'ticktick', 'tasksorg', 'superproductivity', 'todotxt', 'taskwarrior', 'vikunja'],
  spreadsheets: ['csv'],
  text: ['markdown', 'leo', 'opml', 'orgmode'],
  messages: ['mail', 'mbox', 'ical', 'slack', 'mattermost', 'telegram', 'whatsapp', 'discord', 'rocketchat', 'evernote', 'enex'],
  api: ['planka', 'kanbanflow'],
};
const GROUP_OF = new Map(Object.entries(MEMBERS).flatMap(([group, keys]) => keys.map(key => [key, group])));
const INDEX = new Map(TOOL_GROUPS.map((g, i) => [g.group, i]));

// The group of a tool key; a key no group names is in Kanban and project tools.
const toolGroupOf = key => GROUP_OF.get(key) || 'kanban';

// A product's name without its company's name in front, under that company's
// heading: "Microsoft Planner" -> "Planner". Anything else is left as it is.
function withoutCompany(text, company) {
  if (typeof text !== 'string' || !company) return text;
  const prefix = `${company} `;
  return text.startsWith(prefix) && text.length > prefix.length ? text.slice(prefix.length) : text;
}

// items (each with `key`) grouped in TOOL_GROUPS order, their own order kept
// inside a group; the first of each group carries `groupStart: true` and its
// heading: `groupLabelKey` (a translation key) or `groupLabel` (a company's
// name), both null for WeKan's own, whose heading is the product name. Under
// a company's heading `name` and `label` drop the company's name.
function groupTools(items) {
  const sorted = (items || []).map((item, i) => ({ item, i, g: INDEX.get(toolGroupOf(item.key)) }))
    .sort((a, b) => (a.g - b.g) || (a.i - b.i));
  return sorted.map(({ item, g }, n) => {
    const start = n === 0 || sorted[n - 1].g !== g;
    const def = TOOL_GROUPS[g];
    const out = {
      ...item,
      group: def.group,
      groupStart: start,
      groupLabelKey: start ? def.labelKey || null : null,
      groupLabel: start ? def.label || null : null,
    };
    if (def.label) {
      if ('name' in out) out.name = withoutCompany(out.name, def.label);
      if ('label' in out) out.label = withoutCompany(out.label, def.label);
    }
    return out;
  });
}

module.exports = { TOOL_GROUPS, MEMBERS, toolGroupOf, groupTools, withoutCompany };
