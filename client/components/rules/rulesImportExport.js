import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import {
  RULES_FORMAT,
  collectRuleTransferEntries,
  ruleTransferDocument,
  rulesToCsv,
} from '/models/lib/ruleTransfer';

// Build a portable, board-independent list of rules from the CURRENT board.
function collectBoardRules(boardId) {
  const selected = Session.get('selectedRuleIds') || [];
  return collectRuleTransferEntries(
    ReactiveCache.getRules({ boardId }),
    triggerId => ReactiveCache.getTrigger(triggerId),
    actionId => ReactiveCache.getAction(actionId),
    selected,
  );
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

function submitRulesImport(tpl, boardId, format, text, unmapped = []) {
  Meteor.call('rules.importRules', boardId, format, text, (error, result) => {
    if (error) {
      tpl.message.set(String(error.reason || error.message || error));
      return;
    }
    reportImport(tpl, result?.count || 0, unmapped);
  });
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
    const data = ruleTransferDocument(boardId, collectBoardRules(boardId));
    download('wekan-rules.json', JSON.stringify(data, null, 2), 'application/json');
  },
  'click .js-rules-export-csv'() {
    const boardId = Session.get('currentBoard');
    download('wekan-rules.csv', rulesToCsv(collectBoardRules(boardId)), 'text/csv');
  },
  'click .js-rules-import-json'(event, tpl) {
    const text = tpl.find('.js-rules-import-text').value;
    submitRulesImport(tpl, targetBoardId(tpl), 'json', text);
  },
  'click .js-rules-import-csv'(event, tpl) {
    const text = tpl.find('.js-rules-import-text').value;
    submitRulesImport(tpl, targetBoardId(tpl), 'csv', text);
  },
  'click .js-rules-import-trello'(event, tpl) {
    const { rules, unmapped } = parseTrelloButler(tpl.find('.js-rules-import-text').value);
    submitRulesImport(tpl, targetBoardId(tpl), 'json',
      JSON.stringify({ _format: RULES_FORMAT, rules }), unmapped);
  },
  'click .js-rules-import-workflow'(event, tpl) {
    const format = tpl.find('.js-workflow-format').value;
    const { rules, unmapped, error } = parseWorkflow(tpl.find('.js-rules-import-text').value, format);
    if (error) {
      tpl.message.set(error);
      return;
    }
    submitRulesImport(tpl, targetBoardId(tpl), 'json',
      JSON.stringify({ _format: RULES_FORMAT, rules }), unmapped);
  },
});
