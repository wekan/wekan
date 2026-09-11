'use strict';

// Regression guard: reported directly (with screenshots) - on Board Settings /
// Rules, clicking "Workflow view" in the page sidebar changed the button's
// label to "List view" but the page kept showing the "Add trigger" tab; the
// workflow builder never appeared.
//
// rulesMain.jade renders +rulesWorkflow only while its `rulesCurrentTab`
// ReactiveVar is 'rulesList'. The toggle lives in rulesControls, a separate
// template in the page sidebar with no handle on the rulesMain instance, so
// it only flips Session 'rulesViewMode'. From the trigger/action/details
// tabs that changed nothing visible. rulesMain now owns an autorun that
// brings the page back to the list tab whenever the workflow view is
// selected - the only place the tab state can be changed from.
//
// Source-read test (no Blaze/Session runtime).
//
// Run: node tests/rulesWorkflowViewToggle.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(ROOT, 'client/components/rules/rulesMain.js'), 'utf8');
const jade = fs.readFileSync(path.join(ROOT, 'client/components/rules/rulesMain.jade'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('rulesWorkflowViewToggle:');

test('the workflow view is the rulesList tab\'s alternative rendering', () => {
  assert.ok(/if\(\$eq rulesCurrentTab\.get 'rulesList'\)\s*\n\s*if isWorkflowView\s*\n\s*\+rulesWorkflow\s*\n\s*else\s*\n\s*\+rulesList/.test(jade));
});

test('the toggle only flips the Session view mode (it cannot reach the tab state)', () => {
  const at = js.indexOf("'click .js-rules-toggle-view'");
  assert.ok(at !== -1);
  const body = js.slice(at, js.indexOf('},', at));
  assert.ok(/Session\.set\('rulesViewMode', mode\)/.test(body));
  assert.ok(!/rulesCurrentTab/.test(body), 'rulesControls has no handle on rulesMain\'s instance');
});

test('rulesMain brings the page back to the list tab when the workflow view is selected', () => {
  const onCreated = js.slice(js.indexOf('Template.rulesMain.onCreated('), js.indexOf('Template.rulesMain.helpers('));
  assert.ok(/this\.autorun\(\(\) => \{\s*\n\s*if \(Session\.get\('rulesViewMode'\) === 'workflow'\) \{\s*\n\s*this\.rulesCurrentTab\.set\('rulesList'\);/.test(onCreated),
    'without this, toggling from the Add trigger tab changes only the button label');
});

console.log(`\nrulesWorkflowViewToggle: ${passed} tests passed`);
