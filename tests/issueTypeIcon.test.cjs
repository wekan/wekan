'use strict';

// Jira issue types as a first-class minicard badge (models/lib/issueTypeIcon.js).
// Run: node tests/issueTypeIcon.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { issueTypeBadge } = require('../models/lib/issueTypeIcon.js');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

assert.deepEqual(issueTypeBadge('Bug'), { name: 'Bug', icon: 'fa-bug', tone: 'red' });
assert.equal(issueTypeBadge('Sub-task').icon, 'fa-level-down', 'hyphen and case do not matter');
assert.equal(issueTypeBadge('SUB TASK').icon, 'fa-level-down');
assert.equal(issueTypeBadge('User Story').icon, 'fa-bookmark');
assert.equal(issueTypeBadge('New Feature').icon, 'fa-plus-square');
assert.equal(issueTypeBadge('Epic').tone, 'purple');
// A site's own type keeps its name with a neutral icon.
assert.deepEqual(issueTypeBadge('  Customer Escalation '), { name: 'Customer Escalation', icon: 'fa-circle-o', tone: 'grey' });
// Negative: nothing to show.
for (const none of [undefined, null, '', '   ', 5, {}]) assert.equal(issueTypeBadge(none), null, String(none));
assert.equal(issueTypeBadge('x'.repeat(300)).name.length, 100, 'bounded like the stored value');
console.log('  ok - issue types map to icons, and anything else keeps its name');

// Wiring: shown from the stored Jira value on every board, and no longer also
// as a Scrum minicard text field.
assert.match(read('client/components/cards/minicard.js'), /issueTypeBadge\(\) \{\s*return issueTypeBadge\(this\.scrum && this\.scrum\.issueType\);/);
const jade = read('client/components/cards/minicard.jade');
assert.match(jade, /\.badges\n[\s\S]{0,300}if issueTypeBadge\n\s*\.badge\.minicard-issue-type\(class="issue-type-\{\{issueTypeBadge\.tone\}\}" title="\{\{issueTypeBadge\.name\}\}"\)/);
assert.doesNotMatch(jade.slice(jade.indexOf('if issueTypeBadge') - 400, jade.indexOf('if issueTypeBadge')), /scrum\.enabled/,
  'not gated on the board using Scrum');
const scrumFields = read('client/components/boards/scrum/scrumFields.js');
const minicardDefs = scrumFields.slice(scrumFields.indexOf('  minicard: ['), scrumFields.indexOf('\n', scrumFields.indexOf('  minicard: [')));
assert.doesNotMatch(minicardDefs, /IssueType/, 'no second, text-only copy on the minicard');
assert.match(read('models/lib/jiraScrumMetadata.js'), /normalizeScrumMetadata\('card', \{ issueType: fields\.issuetype\.name \}\)/,
  'Jira imports still store the type where the badge reads it');
// The minicard module still parses: a source check alone missed an import
// line placed inside a multi-line import, which broke the whole client.
execFileSync(process.execPath, ['--input-type=module', '--check'], { input: read('client/components/cards/minicard.js') });
console.log('  ok - the minicard shows the stored Jira type once, on every board');
