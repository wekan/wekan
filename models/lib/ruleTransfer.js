import Papa from 'papaparse';
import {
  neutralizeSpreadsheetFormula,
  sanitizeTransferValue,
} from '/models/lib/importExportBoundary';

const RULES_FORMAT = 'wekan-rules-1.0.0';
const STRIP_FIELDS = new Set(['_id', 'boardId', 'createdAt', 'modifiedAt', 'updatedAt']);

function stripRuleTransferDoc(doc) {
  const out = {};
  for (const [key, value] of Object.entries(doc || {})) {
    if (!STRIP_FIELDS.has(key)) out[key] = value;
  }
  return sanitizeTransferValue(out, {
    direction: 'export', maxDepth: 20, maxNodes: 5000, maxArray: 1000,
    maxString: 256 * 1024,
  }).value;
}

function collectRuleTransferEntries(rules, resolveTrigger, resolveAction, selectedIds = []) {
  const selected = new Set(Array.isArray(selectedIds) ? selectedIds.map(String) : []);
  return (Array.isArray(rules) ? rules : [])
    .filter(rule => rule && (!selected.size || selected.has(String(rule._id))))
    .map(rule => {
      const trigger = resolveTrigger(rule.triggerId);
      const action = resolveAction(rule.actionId);
      if (!trigger || !action) return null;
      return sanitizeTransferValue({
        title: String(rule.title || ''),
        trigger: stripRuleTransferDoc(trigger),
        action: stripRuleTransferDoc(action),
      }, {
        direction: 'export', maxDepth: 20, maxNodes: 10000, maxArray: 1000,
        maxString: 256 * 1024,
      }).value;
    })
    .filter(Boolean);
}

function ruleTransferDocument(boardId, entries) {
  return sanitizeTransferValue({
    _format: RULES_FORMAT,
    boardId: String(boardId || ''),
    rules: Array.isArray(entries) ? entries : [],
  }, { direction: 'export', maxDepth: 25, maxNodes: 100000,
    maxArray: 10000, maxString: 256 * 1024 }).value;
}

function rulesToCsv(rulesArray) {
  const rows = (Array.isArray(rulesArray) ? rulesArray : []).map(entry => {
    const { activityType, ...triggerFields } = entry.trigger || {};
    const { actionType, ...actionFields } = entry.action || {};
    return {
      title: neutralizeSpreadsheetFormula(String(entry.title || '')),
      triggerType: neutralizeSpreadsheetFormula(String(activityType || '')),
      triggerFields: neutralizeSpreadsheetFormula(JSON.stringify(triggerFields)),
      actionType: neutralizeSpreadsheetFormula(String(actionType || '')),
      actionFields: neutralizeSpreadsheetFormula(JSON.stringify(actionFields)),
    };
  });
  return Papa.unparse(rows, {
    columns: ['title', 'triggerType', 'triggerFields', 'actionType', 'actionFields'],
  });
}

export {
  RULES_FORMAT,
  collectRuleTransferEntries,
  ruleTransferDocument,
  rulesToCsv,
  stripRuleTransferDoc,
};
