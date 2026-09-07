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

function restoreSpreadsheetText(value) {
  const text = String(value || '');
  return /^'[=+\-@\t\r\n]/.test(text) ? text.slice(1) : text;
}

const RULE_TRIGGER_MATCHING_FIELDS = [
  'userId', 'username', 'cardTitle', 'listName', 'oldListName',
  'swimlaneName', 'checklistName', 'checklistItemName', 'labelId',
  'attachmentName',
];

function normalizeRuleTrigger(trigger) {
  const normalized = { ...trigger };
  for (const field of RULE_TRIGGER_MATCHING_FIELDS) {
    if (normalized[field] === undefined || normalized[field] === null
      || normalized[field] === '') normalized[field] = '*';
  }
  return normalized;
}

function csvToRules(text) {
  const parsed = Papa.parse(String(text || '').trim(), {
    header: true, skipEmptyLines: true,
  });
  if (parsed.errors?.length) throw new Error(`Invalid Rules CSV: ${parsed.errors[0].message}`);
  return (parsed.data || []).map((row, index) => {
    if (!row.triggerType || !row.actionType) {
      throw new Error(`Invalid Rules CSV row ${index + 2}`);
    }
    let triggerFields;
    let actionFields;
    try {
      triggerFields = row.triggerFields ? JSON.parse(row.triggerFields) : {};
      actionFields = row.actionFields ? JSON.parse(row.actionFields) : {};
    } catch (_) {
      throw new Error(`Invalid Rules CSV fields at row ${index + 2}`);
    }
    return {
      title: restoreSpreadsheetText(row.title),
      trigger: { activityType: restoreSpreadsheetText(row.triggerType), ...triggerFields },
      action: { actionType: restoreSpreadsheetText(row.actionType), ...actionFields },
    };
  });
}

function parseRuleTransferText(text, format) {
  if (format === 'csv') return csvToRules(text);
  if (format !== 'json') throw new Error('Unknown Rules import format');
  const parsed = JSON.parse(String(text || ''));
  if (parsed && !Array.isArray(parsed) && parsed._format
    && parsed._format !== RULES_FORMAT) {
    throw new Error('Unsupported Rules JSON format');
  }
  const rules = Array.isArray(parsed) ? parsed : parsed?.rules;
  if (!Array.isArray(rules)) throw new Error('Rules JSON must contain a rules array');
  return rules;
}

export {
  RULES_FORMAT,
  collectRuleTransferEntries,
  csvToRules,
  normalizeRuleTrigger,
  parseRuleTransferText,
  ruleTransferDocument,
  restoreSpreadsheetText,
  rulesToCsv,
  stripRuleTransferDoc,
  RULE_TRIGGER_MATCHING_FIELDS,
};
