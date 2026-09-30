'use strict';

// Regression guard: reported directly (with screenshots) - on Board Settings /
// Rules, clicking "Workflow view" in the page sidebar changed the button's
// label to "List view" but the page kept showing the "Add trigger" tab; the
// workflow builder never appeared.
//
// rulesMain.jade renders +rulesWorkflow only while its `rulesCurrentTab`
// ReactiveVar is 'rulesList'. The toggle lives in Board Settings (it was in
// the Rules page's own sidebar), with no handle on the rulesMain instance, so
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
  assert.ok(/if\(\$eq rulesCurrentTab\.get 'rulesList'\)\s*\n\s*if isWorkflowView\s*\n\s*\+rulesWorkflow\s*\n\s*else if isBlocksView\s*\n\s*\+rulesBlocks\s*\n\s*else if isRulesHistoryView\s*\n\s*\+historyTable\([^\n]+\)\s*\n\s*else\s*\n\s*\+rulesList/.test(jade));
});

test('the toggle only flips the Session view mode (it cannot reach the tab state)', () => {
  // The toggle is in Board Settings under Rules (it was in the Rules page's
  // own sidebar, which is gone); it is still outside rulesMain.
  const sidebar = fs.readFileSync(path.join(ROOT, 'client/components/sidebar/sidebar.js'), 'utf8');
  const body = sidebar.slice(sidebar.indexOf('function openRulesViewFromBoardMenu'), sidebar.indexOf('Template.boardMenuPopup.events('));
  assert.ok(/Session\.set\('rulesViewMode', mode\)/.test(body));
  assert.ok(/Session\.set\('rulesViewRequest'/.test(body), 'and asks rulesMain to return to the list tab');
  assert.ok(!/rulesCurrentTab/.test(body), 'Board Settings has no handle on rulesMain\'s instance');
  assert.match(sidebar, /'click \.js-open-rules-workflow-view'\(event\) \{ event\.preventDefault\(\); openRulesViewFromBoardMenu\('workflow'\); \}/);
});

test('rulesMain brings the page back to the list tab when the workflow view is selected', () => {
  const onCreated = js.slice(js.indexOf('Template.rulesMain.onCreated('), js.indexOf('Template.rulesMain.helpers('));
  assert.ok(/this\.autorun\(\(\) => \{\s*\n\s*Session\.get\('rulesViewRequest'\);\s*\n\s*if \(\['list', 'workflow', 'blocks', 'history'\]\.includes\(Session\.get\('rulesViewMode'\)\)\) \{\s*\n\s*this\.rulesCurrentTab\.set\('rulesList'\);/.test(onCreated),
    'without this, toggling from the Add trigger tab changes only the button label');
});

console.log(`\nrulesWorkflowViewToggle: ${passed} tests passed`);
