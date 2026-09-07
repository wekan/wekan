'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const catalog = require('../models/lib/ruleWorkflowCatalog');

test('workflow catalog is bounded and produces canonical descriptions', () => {
  assert.equal(catalog.workflowTrigger(-1), null);
  assert.equal(catalog.workflowTrigger('junk'), null);
  assert.equal(catalog.workflowAction(catalog.WORKFLOW_ACTIONS.length), null);
  assert.notEqual(catalog.workflowTrigger(0).doc, catalog.workflowTrigger(0).doc);
  assert.equal(catalog.workflowSourceLabel(catalog.workflowTrigger(10), {
    'r-w-every-day-at': 'Every day at __time__',
  }), 'Every day at 09:00');
});

test('workflow writes resolve catalog indices behind the common admin boundary', () => {
  const service = read('server/lib/accessibleRuleOperations.js');
  const methods = read('server/rulesButton.js');
  assert.match(service, /createAccessibleWorkflowRule[\s\S]*editableBoard\(userId, input\.boardId\)/);
  assert.match(service, /workflowTrigger\(input\.triggerIndex\)/);
  assert.match(service, /workflowAction\(input\.actionIndex\)/);
  assert.match(service, /throw new Meteor\.Error\('invalid-workflow-entry'\)/);
  assert.match(service, /replaceAccessibleWorkflowAction[\s\S]*editableRule\(userId, input\.ruleId, input\.boardId\)/);
  assert.match(methods, /'rules\.createWorkflowRule'[\s\S]*createAccessibleWorkflowRule\(this\.userId/);
  assert.match(methods, /'rules\.replaceWorkflowAction'[\s\S]*replaceAccessibleWorkflowAction\(this\.userId/);
});

test('HTML5 workflow localizes stored descriptions and performs no direct writes', () => {
  const workflow = read('client/components/rules/rulesWorkflow.js');
  assert.match(workflow, /require\('\/models\/lib\/ruleWorkflowCatalog'\)/);
  assert.match(workflow, /localizedStoredRuleDescription\(/);
  assert.match(workflow, /Meteor\.call\('rules\.createWorkflowRule'/);
  assert.match(workflow, /Meteor\.call\('rules\.replaceWorkflowAction'/);
  assert.doesNotMatch(workflow, /(?:Rules|Triggers|Actions)\.(?:insert|update|remove)\(/);
});
