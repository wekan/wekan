import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import {
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

function reportImport(tpl, count, unmappedCount = 0) {
  let msg = TAPi18n.__('r-import-done', { count });
  if (unmappedCount) {
    msg += ` — ${TAPi18n.__('r-import-unmapped', { count: unmappedCount })}`;
  }
  tpl.message.set(msg);
}

function submitRulesImport(tpl, boardId, format, text) {
  Meteor.call('rules.importRules', boardId, format, text, (error, result) => {
    if (error) {
      tpl.message.set(String(error.reason || error.message || error));
      return;
    }
    reportImport(tpl, result?.count || 0, result?.unmappedCount || 0);
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
    submitRulesImport(tpl, targetBoardId(tpl), 'trello',
      tpl.find('.js-rules-import-text').value);
  },
  'click .js-rules-import-workflow'(event, tpl) {
    const format = tpl.find('.js-workflow-format').value;
    submitRulesImport(tpl, targetBoardId(tpl),
      format === 'auto' ? 'workflow-auto' : format,
      tpl.find('.js-rules-import-text').value);
  },
});
