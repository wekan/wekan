'use strict';

// Every format WeKan both exports and imports (in plain Node, no server): a
// card with every field set is exported, the file parsed back, and what comes
// back is held to KEEPS. It is the Playwright spec
// tests/playwright/specs/export-import-round-trip.e2e.js for the fields that
// spec does not look at - start and creation dates, spent time, the due
// date's done tick, recurrence, owner, requester, custom fields, color and
// the Blocked flow field with its reason -
// and it found exports that did not write what their own import reads
// (Kanboard, OpenProject, ClickUp, GitLab, Asana, Deck). A format that keeps
// less fails; one that keeps more fails too, so its line is raised with it.
// What a tool has no place for stays out of its line.
// Run: node tests/exportRoundTripFields.test.cjs

const assert = require('node:assert/strict');

const KEEPS = {
  // 2026-11-21: Microsoft's. Azure DevOps writes the owner and the fields it
  // came with (Priority ...), Lists every custom field and the start date,
  // Project the dates and percent complete; a Teams chat starts with its first
  // message.
  azuredevops: ['owner', 'customFields'],
  mslists: ['start', 'owner', 'customFields'],
  msproject: ['start', 'created', 'dueComplete', 'owner', 'customFields'],
  teams: ['created'],
  deck: ['created', 'dueComplete', 'owner', 'requester'],
  kanboard: ['start', 'created', 'spent', 'recurrence', 'owner', 'requester', 'color'],
  openproject: ['start', 'created', 'spent', 'owner', 'requester', 'customFields'],
  github: ['created', 'owner', 'requester'],
  gitea: ['created', 'owner', 'requester'],
  forgejo: ['created', 'owner', 'requester'],
  gitlab: ['created', 'spent', 'owner', 'requester'],
  jira: ['owner', 'requester'],
  asana: ['start', 'created', 'spent', 'owner', 'customFields'],
  zenkit: ['start', 'created', 'owner', 'customFields'],
  markdown: [],
  todotxt: ['start', 'created'],
  taskwarrior: ['start', 'created', 'recurrence'],
  focalboard: ['start', 'created', 'customFields'],
  todoist: ['start', 'owner'],
  meistertask: [],
  obsidian: ['start', 'recurrence', 'customFields'],
  linear: ['start', 'created', 'owner', 'requester', 'customFields'],
  ticktick: ['start', 'created', 'recurrence', 'customFields'],
  clickup: ['start', 'created', 'spent', 'owner', 'customFields'],
  nullboard: [],
  kanri: ['dueComplete', 'color'],
  pivotal: ['created', 'owner', 'requester'],
  redmine: ['start', 'created', 'spent', 'owner', 'requester', 'customFields'],
  tasksorg: ['start', 'created', 'spent', 'recurrence', 'customFields'],
  superproductivity: ['created', 'spent', 'recurrence', 'customFields'],
  taiga: ['created', 'owner', 'requester', 'customFields', 'blocked'],
  teamwork: ['start', 'dueComplete', 'owner', 'customFields'],
  quire: ['start', 'created', 'owner', 'requester', 'customFields'],
  notion: ['start', 'owner', 'customFields'],
  orgmode: ['start', 'created', 'recurrence', 'customFields'],
  mattermost: ['created'],
};

async function main() {
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const item = { cardId: 'c1', title: 'Alpha Card', description: 'Desc', listTitle: 'Doing', swimlaneTitle: 'Default', listId: 'l1',
    dueAt: '2026-12-24T12:00:00.000Z', startAt: '2026-12-01T09:00:00.000Z', createdAt: '2026-11-01T08:00:00.000Z',
    labels: ['Red'], labelIds: ['x'], owner: 'ann', assignees: ['bob'], creator: 'cid', requestedBy: 'dan',
    spentTime: 1.5, dueComplete: true, recurrence: 'weekly', color: 'red', customFields: { Priority: 'High', Points: 3 },
    blocked: true, blockedReason: 'Waiting for parts',
    comments: [{ text: 'A comment', author: 'ann', date: '2026-11-02T00:00:00.000Z' }],
    checklists: [{ title: 'CL', items: [{ title: 'Step', done: true }] }] };
  const collected = { board: { title: 'B' }, lists: [{ _id: 'l1', title: 'Doing' }], swimlanes: [{ title: 'Default' }], items: [item] };
  const checks = {
    start: t => Boolean(t.date_started), created: t => Boolean(t.date_creation), spent: t => Number(t.spent_hours) > 0,
    dueComplete: t => t.due_complete === true, recurrence: t => t.recurrence === 'weekly',
    owner: t => Boolean(t.owner_username || t.owner_id || t.owner_name), requester: t => Boolean(t.requested_by),
    customFields: t => Boolean(t.custom_fields) && Object.keys(t.custom_fields).length > 0, color: t => Boolean(t.color),
    blocked: t => t.blocked === true && t.blocked_reason === 'Waiting for parts',
  };
  const differ = [];
  for (const [format, keeps] of Object.entries(KEEPS)) {
    const out = formatters[format](JSON.parse(JSON.stringify(collected)));
    const parsed = EXTERNAL_PARSERS[format](typeof out === 'string' ? out : JSON.parse(JSON.stringify(out)));
    const card = (parsed.tasks || []).find(task => String(task.title || '').includes('Alpha'));
    assert.ok(card, `${format}: the card comes back`);
    const kept = Object.entries(checks).filter(([, check]) => check(card)).map(([name]) => name);
    if (JSON.stringify(kept) !== JSON.stringify(keeps)) differ.push(`${format}: keeps ${kept.join(', ') || 'nothing'} - KEEPS says ${keeps.join(', ') || 'nothing'}`);
  }
  assert.deepEqual(differ, [], 'each format keeps what KEEPS says, no less and no more');
  // Negative: every format with both a formatter and a parser is in the table,
  // except those whose file is a workbook or an archive (the Playwright spec
  // round-trips those through the server).
  // Fizzy's account export and Rocket.Chat's CSV importer zip are archives too;
  // tests/fizzyFormat.test.cjs and tests/chatExportFormats.test.cjs round-trip them.
  const BINARY = ['planner', 'monday', 'businessmap', 'vikunja', 'wrike', 'teamwork', 'fizzy', 'rocketchat', 'outlook', 'onenote',
    // Sandstorm grains: .zip files (tests/sandstormGrain.test.cjs round-trips each).
    'sandstormprioritize', 'sandstormyatl', 'sandstormmutodo', 'sandstormsandchat', 'sandstormethercalc', 'sandstormradicalecalendar', 'sandstormradicalecontacts', 'sandstormdavros', 'sandstormhackercms'];
  const both = Object.keys(formatters).filter(name => typeof formatters[name] === 'function' && EXTERNAL_PARSERS[name]);
  assert.deepEqual(both.filter(name => !(name in KEEPS) && !BINARY.includes(name)), [], 'a format missing from KEEPS');
  console.log(`  ok - ${Object.keys(KEEPS).length} formats keep what KEEPS says`);
}

main().catch(error => { console.error(error); process.exit(1); });
