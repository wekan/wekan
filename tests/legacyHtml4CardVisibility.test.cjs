'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..',
  'server/lib/legacyHtml4Pages.js'), 'utf8');

for (const [name, setting] of Object.entries({
  labels: 'allowsLabels', members: 'allowsMembers', assignees: 'allowsAssignee',
  creator: 'allowsCreator', requestedBy: 'allowsRequestedBy', assignedBy: 'allowsAssignedBy',
  list: 'allowsShowLists', sort: 'allowsCardSortingByNumber',
  receivedAt: 'allowsReceivedDate', startAt: 'allowsStartDate',
  dueAt: 'allowsDueDate', endAt: 'allowsEndDate',
  description: 'allowsDescriptionText', checklists: 'allowsChecklists',
  subtasks: 'allowsSubtasks', attachments: 'allowsAttachments', comments: 'allowsComments',
})) {
  assert.match(source, new RegExp(`${name}: board\\.${setting} === true`),
    `${setting} must be in the shared HTML4 visibility map`);
}
assert.match(source, /for \(const label of visible\.labels \?/);
assert.match(source, /if \(visible\.description\) rows\.push/);
assert.match(source, /if \(visible\.list\) rows\.push/);
assert.match(source, /if \(visible\.sort\) rows\.push/);
assert.match(source, /if \(visible\.dates\) rows\.push/);
assert.match(source, /if \(!isVisible\) continue/);
assert.match(source, /for \(const checklist of visible\.checklists \?/);
assert.match(source, /for \(const subtask of visible\.subtasks \?/);
assert.match(source, /visible\.attachments \? \[\.\.\.attachments\] : \[\]/);
assert.match(source, /for \(const comment of visible\.comments \?/);
assert.match(source, /showCardActivities = board\.allowsActivities === true/);

console.log('legacyHtml4CardVisibility: Jade Card Settings gates are shared');
