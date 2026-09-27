const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('real Blockly round trip preserves rule fields and edits only supported parameters', async () => {
  const Blockly = require('blockly/core');
  const { registerRulesBlocks } = await import('../models/lib/rulesBlocksDefinition.js');
  const { ruleWorkspace, workspaceRule } = await import('../models/lib/rulesBlocks.js');
  registerRulesBlocks(Blockly);
  const workspace = new Blockly.Workspace();
  const trigger = { activityType: 'moveCard', listName: 'Done', userId: '*', advanced: { nested: ['preserve'] } };
  const action = { actionType: 'archive', boardId: 'destination', unknownOption: true };
  try {
    Blockly.serialization.workspaces.load(ruleWorkspace(trigger, action), workspace);
    assert.deepEqual(workspaceRule(workspace), { trigger, action });
    workspace.getTopBlocks()[0].setFieldValue('In progress', 'listName');
    const changed = workspaceRule(workspace);
    assert.equal(changed.trigger.listName, 'In progress');
    assert.deepEqual(changed.trigger.advanced, trigger.advanced);
    assert.deepEqual(changed.action, action);
    assert.equal(trigger.listName, 'Done');
    const saved = Blockly.serialization.workspaces.save(workspace);
    workspace.clear(); Blockly.serialization.workspaces.load(saved, workspace);
    assert.deepEqual(workspaceRule(workspace), changed);
    workspace.newBlock('wekan_action');
    assert.throws(() => workspaceRule(workspace), /exactly one/);
    workspace.clear();
    assert.throws(() => workspaceRule(workspace), /exactly one/);
    assert.throws(() => ruleWorkspace(null, action), /unavailable/);
  } finally { workspace.dispose(); }
});

test('Blockly loads only from the dynamic editor and never generates executable code', () => {
  const root = path.join(__dirname, '..');
  const client = fs.readFileSync(path.join(root, 'client/components/rules/rulesBlocks.js'), 'utf8');
  const editor = fs.readFileSync(path.join(root, 'client/components/rules/blocks/editor.js'), 'utf8');
  assert.match(client, /await import\('\.\/blocks\/editor'\)/);
  assert.doesNotMatch(client, /from ['"]blockly/);
  assert.match(client, /rules\.createRule/); assert.match(client, /rules\.updateRule/);
  assert.doesNotMatch(editor, /javascriptGenerator|eval\(|new Function/);
  assert.match(editor, /observer\.disconnect\(\); workspace\.dispose\(\)/);
  assert.match(editor, /\/blockly-media\//);
});
