import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Papa from 'papaparse';

const RULES_FORMAT = 'wekan-rules-1.0.0';
const STRIP_FIELDS = ['_id', 'boardId', 'createdAt', 'modifiedAt', 'updatedAt'];

function stripDoc(doc) {
  const out = {};
  Object.keys(doc || {}).forEach(key => {
    if (!STRIP_FIELDS.includes(key)) out[key] = doc[key];
  });
  return out;
}

// Build a portable, board-independent list of rules from the CURRENT board.
function collectBoardRules(boardId) {
  let rules = ReactiveCache.getRules({ boardId });
  const selected = Session.get('selectedRuleIds') || [];
  if (selected.length) {
    rules = rules.filter(r => selected.includes(r._id));
  }
  return rules
    .map(rule => {
      const trigger = ReactiveCache.getTrigger(rule.triggerId);
      const action = ReactiveCache.getAction(rule.actionId);
      if (!trigger || !action) return null;
      return { title: rule.title, trigger: stripDoc(trigger), action: stripDoc(action) };
    })
    .filter(Boolean);
}

// #6472: the trigger matcher (server/rulesHelper.js buildMatchingFieldsMap)
// queries every matching field of the trigger type with {$in: [value, '*']} —
// a trigger DOCUMENT that lacks one of those fields can never match. Hand-
// written or third-party JSON often omits fields like userId, so default every
// known matching field to the '*' wildcard when absent. Extra fields on
// trigger types that do not use them are harmless (never queried).
const TRIGGER_MATCHING_FIELDS = [
  'userId', 'username', 'cardTitle', 'listName', 'oldListName',
  'swimlaneName', 'checklistName', 'checklistItemName', 'labelId',
  'attachmentName',
];

function normalizeTrigger(trigger) {
  const out = { ...trigger };
  TRIGGER_MATCHING_FIELDS.forEach(f => {
    if (out[f] === undefined || out[f] === null || out[f] === '') out[f] = '*';
  });
  return out;
}

// Insert an array of {title, trigger, action} onto the given target board.
function importRules(rulesArray, boardId) {
  let count = 0;
  (rulesArray || []).forEach(entry => {
    if (!entry || !entry.trigger || !entry.action) return;
    // #6472: create via the rules.createRule server method (like the rules
    // wizard since #5536) instead of three optimistic client inserts — those
    // are rejected by the board-admin-only allow() rules for non-admins and
    // land in minimongo limbo: the imported rule LOOKS created but never
    // exists on the server, so it silently does nothing until it vanishes.
    Meteor.call(
      'rules.createRule',
      boardId,
      entry.title || 'Imported rule',
      normalizeTrigger(stripDoc(entry.trigger)),
      stripDoc(entry.action),
    );
    count += 1;
  });
  return count;
}

function download(filename, text, mime) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- CSV (round-trippable) --------------------------------------------------
function rulesToCsv(rulesArray) {
  const rows = rulesArray.map(entry => {
    const { activityType, ...triggerFields } = entry.trigger || {};
    const { actionType, ...actionFields } = entry.action || {};
    return {
      title: entry.title || '',
      triggerType: activityType || '',
      triggerFields: JSON.stringify(triggerFields),
      actionType: actionType || '',
      actionFields: JSON.stringify(actionFields),
    };
  });
  return Papa.unparse(rows, {
    columns: ['title', 'triggerType', 'triggerFields', 'actionType', 'actionFields'],
  });
}

function csvToRules(text) {
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  return (parsed.data || [])
    .map(row => {
      let triggerFields = {};
      let actionFields = {};
      try { triggerFields = row.triggerFields ? JSON.parse(row.triggerFields) : {}; } catch (e) { triggerFields = {}; }
      try { actionFields = row.actionFields ? JSON.parse(row.actionFields) : {}; } catch (e) { actionFields = {}; }
      if (!row.triggerType || !row.actionType) return null;
      return {
        title: row.title,
        trigger: { activityType: row.triggerType, ...triggerFields },
        action: { actionType: row.actionType, ...actionFields },
      };
    })
    .filter(Boolean);
}

// --- Best-effort Trello Butler parser ---------------------------------------
export function parseTrelloButler(text) {
  const rules = [];
  const unmapped = [];
  (text || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const added = line.toLowerCase().match(/when a card is added to list ["“](.+?)["”].*move the card to the (top|bottom)/);
    if (added) {
      rules.push({
        title: line,
        trigger: { activityType: 'createCard', listName: added[1], swimlaneName: '*', cardTitle: '*', userId: '*' },
        action: { actionType: added[2] === 'top' ? 'moveCardToTop' : 'moveCardToBottom', listName: '*', swimlaneName: '*' },
      });
      return;
    }
    unmapped.push(line);
  });
  return { rules, unmapped };
}

// --- Best-effort visual-workflow parsers (n8n, Node-RED) --------------------
// These map a workflow graph's trigger→action edges to WeKan rules by keyword.
// n8n and Node-RED nodes are arbitrary integrations, so only recognized
// trigger/action node types are mapped; unmapped edges are reported.
function mapTriggerType(type = '', name = '') {
  const s = `${type} ${name}`.toLowerCase();
  if (/schedule|cron|interval|inject/.test(s)) {
    return { activityType: 'scheduledTrigger', scheduleKind: 'calendar', scheduleType: 'daily', atTime: '09:00', listName: '*', swimlaneName: '*' };
  }
  if (/trigger|webhook|http in|http-in|start/.test(s)) {
    return { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' };
  }
  return null;
}

function mapActionType(type = '', name = '') {
  const s = `${type} ${name}`.toLowerCase();
  if (/archive/.test(s)) return { actionType: 'archive' };
  if (/move.*top|to top/.test(s)) return { actionType: 'moveCardToTop', listName: '*', swimlaneName: '*' };
  if (/move.*bottom/.test(s)) return { actionType: 'moveCardToBottom', listName: '*', swimlaneName: '*' };
  if (/complete|done/.test(s)) return { actionType: 'markCardComplete' };
  if (/email|mail|smtp|gmail/.test(s)) return { actionType: 'sendEmail', emailTo: '', emailSubject: 'Imported workflow', emailMsg: '' };
  if (/create.*card|wekan|card/.test(s)) return { actionType: 'createCard', cardName: name || 'Imported card', listName: '*', swimlaneName: '*' };
  return null;
}

export function parseN8n(data) {
  const nodes = data.nodes || [];
  const byName = {};
  nodes.forEach(n => { byName[n.name] = n; });
  const rules = [];
  const unmapped = [];
  const conns = data.connections || {};
  Object.keys(conns).forEach(srcName => {
    const src = byName[srcName];
    if (!src) return;
    const trig = mapTriggerType(src.type, srcName);
    const outs = (conns[srcName].main || []).flat();
    outs.forEach(o => {
      const tgt = o && byName[o.node];
      if (!tgt) return;
      const act = mapActionType(tgt.type, tgt.name);
      if (trig && act) {
        rules.push({ title: `${srcName} → ${tgt.name || o.node}`, trigger: trig, action: act });
      } else {
        unmapped.push(`${srcName} → ${o.node}`);
      }
    });
  });
  return { rules, unmapped };
}

export function parseNodeRed(data) {
  const nodes = Array.isArray(data) ? data : (data.flows || []);
  const byId = {};
  nodes.forEach(n => { byId[n.id] = n; });
  const rules = [];
  const unmapped = [];
  nodes.forEach(n => {
    const trig = mapTriggerType(n.type, n.name);
    if (!trig) return;
    ((n.wires || []).flat()).forEach(tid => {
      const tgt = byId[tid];
      if (!tgt) return;
      const act = mapActionType(tgt.type, tgt.name);
      const label = `${n.name || n.type} → ${tgt.name || tgt.type}`;
      if (act) rules.push({ title: label, trigger: trig, action: act });
      else unmapped.push(label);
    });
  });
  return { rules, unmapped };
}

function parseWorkflow(text, format) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return { rules: [], unmapped: [], error: 'invalid JSON' }; }
  let fmt = format;
  if (!fmt || fmt === 'auto') {
    if (data && data.nodes && data.connections) fmt = 'n8n';
    else if (Array.isArray(data) || data.flows) fmt = 'nodered';
  }
  if (fmt === 'n8n') return parseN8n(data);
  if (fmt === 'nodered') return parseNodeRed(data);
  return { rules: [], unmapped: [], error: 'unknown format' };
}

// --- Workspace + board selection helpers ------------------------------------
function flattenWorkspaces(nodes, depth, out) {
  (nodes || []).forEach(node => {
    out.push({ id: node.id, label: `${'  '.repeat(depth)}${node.name}` });
    if (node.children && node.children.length) flattenWorkspaces(node.children, depth + 1, out);
  });
  return out;
}

Template.rulesImportExportPopup.onCreated(function () {
  this.message = new ReactiveVar('');
  this.selectedWorkspace = new ReactiveVar('');
  this.selectedBoard = new ReactiveVar(Session.get('currentBoard'));
  this.subscribe('boards'); // the user's boards (also subscribed globally)
});

Template.rulesImportExportPopup.helpers({
  message() {
    return Template.instance().message;
  },
  workspaces() {
    const user = ReactiveCache.getCurrentUser();
    const tree = (user && user.profile && user.profile.boardWorkspacesTree) || [];
    return flattenWorkspaces(tree, 0, []);
  },
  boardsForImport() {
    const tpl = Template.instance();
    const userId = Meteor.userId();
    const ws = tpl.selectedWorkspace.get();
    const user = ReactiveCache.getCurrentUser();
    const assignments = (user && user.profile && user.profile.boardWorkspaceAssignments) || {};
    let boards = ReactiveCache.getBoards(
      { archived: false, 'members.userId': userId },
      { sort: { title: 1 } },
    );
    if (ws) boards = boards.filter(b => assignments[b._id] === ws);
    const selectedBoard = tpl.selectedBoard.get();
    return boards.map(b => ({ _id: b._id, title: b.title, selected: b._id === selectedBoard }));
  },
});

function targetBoardId(tpl) {
  return tpl.selectedBoard.get() || Session.get('currentBoard');
}

function reportImport(tpl, count, unmapped) {
  let msg = TAPi18n.__('r-import-done', { count });
  if (unmapped && unmapped.length) {
    msg += ` — ${TAPi18n.__('r-import-unmapped', { count: unmapped.length })}`;
  }
  tpl.message.set(msg);
}

Template.rulesImportExportPopup.events({
  'change .js-import-workspace'(event, tpl) {
    tpl.selectedWorkspace.set(event.currentTarget.value);
  },
  'change .js-import-board'(event, tpl) {
    tpl.selectedBoard.set(event.currentTarget.value);
  },
  'click .js-rules-export-json'() {
    const boardId = Session.get('currentBoard');
    const data = { _format: RULES_FORMAT, boardId, rules: collectBoardRules(boardId) };
    download('wekan-rules.json', JSON.stringify(data, null, 2), 'application/json');
  },
  'click .js-rules-export-csv'() {
    const boardId = Session.get('currentBoard');
    download('wekan-rules.csv', rulesToCsv(collectBoardRules(boardId)), 'text/csv');
  },
  'click .js-rules-import-json'(event, tpl) {
    const text = tpl.find('.js-rules-import-text').value;
    try {
      const parsed = JSON.parse(text);
      const rulesArray = Array.isArray(parsed) ? parsed : parsed.rules;
      reportImport(tpl, importRules(rulesArray, targetBoardId(tpl)));
    } catch (e) {
      tpl.message.set(String(e.message || e));
    }
  },
  'click .js-rules-import-csv'(event, tpl) {
    const text = tpl.find('.js-rules-import-text').value;
    try {
      reportImport(tpl, importRules(csvToRules(text), targetBoardId(tpl)));
    } catch (e) {
      tpl.message.set(String(e.message || e));
    }
  },
  'click .js-rules-import-trello'(event, tpl) {
    const { rules, unmapped } = parseTrelloButler(tpl.find('.js-rules-import-text').value);
    reportImport(tpl, importRules(rules, targetBoardId(tpl)), unmapped);
  },
  'click .js-rules-import-workflow'(event, tpl) {
    const format = tpl.find('.js-workflow-format').value;
    const { rules, unmapped, error } = parseWorkflow(tpl.find('.js-rules-import-text').value, format);
    if (error) {
      tpl.message.set(error);
      return;
    }
    reportImport(tpl, importRules(rules, targetBoardId(tpl)), unmapped);
  },
});
