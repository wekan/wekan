'use strict';

// Guard: GitHub Actions workflows as WeKan Rules (models/lib/githubActionsRules.js).
// Run: node tests/githubActionsRules.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { workflowToRules, ghActions } = require('../models/lib/githubActionsRules.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }

test('issue triage maps to an enabled rule', () => {
  const { rules, unmapped } = workflowToRules('triage.yml', `
name: Triage
on:
  issues:
    types: [opened]
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions-ecosystem/action-add-labels@v1
        with:
          labels: |
            needs triage
            bug
      - uses: peter-evans/create-or-update-comment@v4
        with:
          body: Thanks for the report!
`);
  assert.deepStrictEqual(unmapped, []);
  assert.strictEqual(rules.length, 1);
  const [r] = rules;
  assert.strictEqual(r.enabled, true);
  assert.strictEqual(r.trigger.activityType, 'createCard');
  assert.deepStrictEqual(r.actions, [
    { actionType: 'addLabel', labelName: 'needs triage' },
    { actionType: 'addLabel', labelName: 'bug' },
    { actionType: 'addComment', commentText: 'Thanks for the report!' },
  ]);
  assert.match(r.description, /```yaml\nname: Triage/);
});

test('gh issue commands, schedules, comments and dispatch', () => {
  const { rules } = workflowToRules('nightly.yml', `
on:
  schedule:
    - cron: '0 3 * * 1-5'
  issue_comment:
    types: [created]
  workflow_dispatch:
jobs:
  close:
    steps:
      - run: |
          gh issue edit "$N" --add-label "wontfix,stale" --add-assignee @alice
          gh issue comment "$N" --body "Closing"
          gh issue close "$N"
`);
  const [r] = rules;
  // negative: a schedule's card actions would reach every card - not enabled
  assert.strictEqual(r.enabled, false);
  assert.deepStrictEqual([r.trigger, ...r.extraTriggers].map(t => t.activityType), ['scheduledTrigger', 'addComment', 'button']);
  assert.strictEqual(r.trigger.cron, '0 3 * * 1-5');
  assert.deepStrictEqual(r.actions.map(a => a.actionType), ['addLabel', 'addLabel', 'addAssignee', 'addComment', 'moveCardToBottom']);
  assert.strictEqual(r.actions[2].username, 'alice');
});

test('actions/stale is an aging rule', () => {
  const { rules } = workflowToRules('stale.yml', `
on:
  schedule:
    - cron: '30 1 * * *'
jobs:
  stale:
    steps:
      - uses: actions/stale@v9
        with:
          days-before-stale: 30
          stale-issue-label: inactive
`);
  assert.deepStrictEqual(rules[0].trigger, { activityType: 'scheduledTrigger', scheduleKind: 'aging', days: 30, listName: '*' });
  assert.deepStrictEqual(rules[0].actions, [{ actionType: 'addLabel', labelName: 'inactive' }]);
});

test('negative: code is never mapped - a build is a DISABLED rule with its YAML', () => {
  const { rules, unmapped } = workflowToRules('ci.yml', `
on: [push, pull_request]
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
      - run: npm test
      - uses: actions/github-script@v7
        with:
          script: console.log(1)
`);
  assert.strictEqual(rules[0].enabled, false);
  assert.match(rules[0].description, /npm test/);
  assert.deepStrictEqual(unmapped, ['ci.yml: on push', 'ci.yml: on pull_request', 'ci.yml: test: npm test', 'ci.yml: test: actions/github-script@v7']);
  // nothing in the rule runs a command
  assert.doesNotMatch(JSON.stringify([rules[0].trigger, rules[0].actions]), /npm|script|run/);
});

test('negative: a mixed script is not half-enabled', () => {
  assert.deepStrictEqual(ghActions('gh issue close 1\ncurl https://x').unknown, ['curl https://x']);
  const { rules } = workflowToRules('m.yml', 'on: issues\njobs:\n  a:\n    steps:\n      - run: |\n          gh issue close 1\n          rm -rf /\n');
  assert.strictEqual(rules[0].enabled, false);
});

test('every workflow file here becomes rules without throwing', () => {
  const dirs = ['.github/workflows', '.tools/gitea/.github/workflows', '.tools/git-bug/.github/workflows'];
  let n = 0;
  for (const dir of dirs) {
    const abs = path.join(__dirname, '..', dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter(x => /\.ya?ml$/.test(x))) {
      const { rules } = workflowToRules(f, fs.readFileSync(path.join(abs, f), 'utf8'));
      rules.forEach(r => assert.ok(r.title && r.trigger && r.actions.length && typeof r.enabled === 'boolean', f));
      n += 1;
    }
  }
  assert.ok(n >= 10);
});

test('a comment trigger, and a schedule that only creates cards, are enabled', () => {
  const { rules } = workflowToRules('w.yml', `
on:
  issue_comment:
    types: [created]
jobs:
  a:
    steps:
      - run: gh issue edit "$N" --add-label commented
`);
  assert.strictEqual(rules[0].enabled, true);
  assert.deepStrictEqual(rules[0].trigger, { activityType: 'addComment', cardTitle: '*', userId: '*' });
  const weekly = workflowToRules('weekly.yml', "on:\n  schedule:\n    - cron: '0 8 * * 1'\njobs:\n  a:\n    steps:\n      - run: gh issue create --title 'Weekly report'\n");
  assert.strictEqual(weekly.rules[0].enabled, true);
});

console.log(`# ${passed} passed`);
