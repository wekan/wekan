// Blockly is only a presentation/editor layer. Documents remain WeKan rules.
export const BLOCK_FIELDS = {
  listName: 'List', oldListName: 'Previous list', swimlaneName: 'Swimlane',
  oldSwimlaneName: 'Previous swimlane', cardTitle: 'Card title',
  checklistName: 'Checklist', itemName: 'Checklist item', username: 'Username',
  atTime: 'Time', text: 'Text', comment: 'Comment', emailTo: 'Email recipient',
  emailSubject: 'Email subject', emailMsg: 'Email message',
};
export function ruleDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('Rule data is unavailable. Open the form editor to review this rule.');
  const { _id, createdAt, modifiedAt, updatedAt, ...data } = document;
  return structuredClone(data);
}
export function blockState(kind, document) {
  const doc = ruleDocument(document);
  const key = kind === 'trigger' ? 'activityType' : 'actionType';
  if (typeof doc[key] !== 'string' || !doc[key]) throw new Error('The rule has no valid trigger or action.');
  return { type: `wekan_${kind}`, extraState: { document: doc } };
}
export function ruleWorkspace(trigger, action) {
  const block = blockState('trigger', trigger);
  block.x = 35; block.y = 35;
  block.next = { block: blockState('action', action) };
  return { blocks: { languageVersion: 0, blocks: [block] } };
}
export function workspaceRule(workspace) {
  const roots = workspace.getTopBlocks(false);
  const trigger = roots[0], action = trigger?.getNextBlock();
  if (roots.length !== 1 || trigger?.type !== 'wekan_trigger' || action?.type !== 'wekan_action' || action.getNextBlock() || workspace.getAllBlocks(false).length !== 2) {
    throw new Error('Connect exactly one trigger to one action. Remove disconnected or extra blocks before saving.');
  }
  return { trigger: trigger.ruleDocument(), action: action.ruleDocument() };
}
export function readableRuleType(value) {
  return String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
}
