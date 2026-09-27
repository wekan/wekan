import { BLOCK_FIELDS, ruleDocument, readableRuleType } from './rulesBlocks.js';
import { TRIGGER_PALETTE, ACTION_PALETTE } from './rulesWorkflowPalette.js';

const FIELD_KEYS = { listName: 'r-list-name', oldListName: 'r-moved-from', swimlaneName: 'r-swimlane-name', oldSwimlaneName: 'r-moved-from', cardTitle: 'title', checklistName: 'r-checklist', itemName: 'r-item', username: 'username', atTime: 'time', text: 'text', comment: 'comment', emailTo: 'r-to', emailSubject: 'r-subject', emailMsg: 'r-d-send-email-message' };

export function registerRulesBlocks(Blockly, translate) {
const label = (key, fallback, params) => translate ? translate(key, params) : fallback;
const typeLabel = doc => {
  const entry = [...TRIGGER_PALETTE, ...ACTION_PALETTE].find(entry => doc.activityType ? entry.doc.activityType === doc.activityType : entry.doc.actionType === doc.actionType);
  return entry && translate ? translate(entry.labelKey, { ...entry.labelParams, time: doc.atTime }) : readableRuleType(doc.activityType || doc.actionType);
};
for (const kind of ['trigger', 'action']) {
  Blockly.Blocks[`wekan_${kind}`] = {
    init() {
      this.document = {};
      this.appendDummyInput('heading').appendField(label(kind === 'trigger' ? 'r-when' : 'r-action', kind === 'trigger' ? 'When' : 'Then'), 'heading');
      this.setColour(kind === 'trigger' ? 145 : 225);
      if (kind === 'trigger') this.setNextStatement(true, 'WEKAN_ACTION');
      else this.setPreviousStatement(true, 'WEKAN_ACTION');
    },
    saveExtraState() { return { document: this.ruleDocument() }; },
    loadExtraState(state) {
      this.document = ruleDocument(state.document);
      this.setFieldValue(`${label(kind === 'trigger' ? 'r-when' : 'r-action', kind === 'trigger' ? 'When' : 'Then')}: ${typeLabel(this.document)}`, 'heading');
      this.setTooltip(this.document.desc || label('r-edit-rule-trigger-action', 'Edit trigger/action'));
      for (const [key, fallback] of Object.entries(BLOCK_FIELDS)) {
        if (this.getInput(key)) this.removeInput(key);
        if (typeof this.document[key] === 'string') this.appendDummyInput(key).appendField(label(FIELD_KEYS[key], fallback)).appendField(new Blockly.FieldTextInput(this.document[key]), key);
      }
    },
    ruleDocument() {
      const document = ruleDocument(this.document);
      let changed = false;
      for (const key of Object.keys(BLOCK_FIELDS)) {
        if (!this.getField(key)) continue;
        const value = this.getFieldValue(key);
        if (value !== document[key]) changed = true;
        document[key] = value;
      }
      if (changed) document.desc = `${typeLabel(document)}: ${Object.keys(BLOCK_FIELDS).filter(key => typeof document[key] === 'string').map(key => `${label(FIELD_KEYS[key], BLOCK_FIELDS[key])} ${document[key]}`).join(', ')}`;
      return document;
    },
  };
}

}
