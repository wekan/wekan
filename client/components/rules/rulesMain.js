import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Utils } from '/client/lib/utils';

Template.rulesMain.onCreated(function () {
  this.rulesCurrentTab = new ReactiveVar('rulesList');
  this.ruleName = new ReactiveVar('');
  this.triggerVar = new ReactiveVar();
  this.ruleId = new ReactiveVar();

  // The Rules page is now a standalone board-scoped route, so subscribe to the
  // board data (lists, swimlanes, labels, members) the trigger/action forms need,
  // in addition to the rules themselves.
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      this.subscribe('board', boardId, false);
      this.subscribe('boardRules', boardId);
    }
  });
});

Template.rulesMain.helpers({
  rulesCurrentTab() {
    return Template.instance().rulesCurrentTab;
  },
  ruleName() {
    return Template.instance().ruleName;
  },
  triggerVar() {
    return Template.instance().triggerVar;
  },
  ruleId() {
    return Template.instance().ruleId;
  },
  currentBoard() {
    return Utils.getCurrentBoard();
  },
  isWorkflowView() {
    return Session.get('rulesViewMode') === 'workflow';
  },
});

Template.rulesHeaderBar.helpers({
  currentBoard() {
    return Utils.getCurrentBoard();
  },
  isWorkflowView() {
    return Session.get('rulesViewMode') === 'workflow';
  },
});

Template.rulesHeaderBar.events({
  'click .js-rules-back-to-board'(event) {
    event.preventDefault();
    const currentBoard = Utils.getCurrentBoard();
    if (currentBoard) {
      FlowRouter.go('board', {
        id: currentBoard._id,
        slug: currentBoard.slug,
      });
    }
  },
  'click .js-rules-toggle-view'(event) {
    event.preventDefault();
    const mode = Session.get('rulesViewMode') === 'workflow' ? 'list' : 'workflow';
    Session.set('rulesViewMode', mode);
  },
  'click .js-rules-import-export': Popup.open('rulesImportExport'),
});

function sanitizeObject(obj) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === '' || obj[key] === undefined) {
      obj[key] = '*';
    }
  });
}

Template.rulesMain.events({
  'click .js-delete-rule'(event) {
    // #6490: the button lives in the rulesList child template's `each`, but this
    // handler is on the parent rulesMain, so Template.currentData() returned the
    // PARENT's data context (not the clicked rule) — the rule id resolved to null,
    // so delete failed server-side with "Match error: Expected string, got null".
    // Read the rule id from the button's explicit data-rule-id instead.
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    if (!ruleId) return;
    // Delete the rule + its trigger + action in one server call. Doing this
    // client-side as three separate Collection.remove() calls failed with 403
    // "Access denied" whenever a trigger/action document's boardId did not
    // resolve to a board in the allow() rule; the method authorizes once and
    // removes all three server-side.
    Meteor.call('rules.deleteRule', ruleId);
  },
  'click .js-goto-trigger'(event, tpl) {
    event.preventDefault();
    const ruleTitle = tpl.find('#ruleTitle').value;
    if (ruleTitle !== undefined && ruleTitle !== '') {
      tpl.find('#ruleTitle').value = '';
      tpl.ruleName.set(ruleTitle);
      tpl.rulesCurrentTab.set('trigger');
    }
  },
  'click .js-goto-action'(event, tpl) {
    event.preventDefault();
    // Add user to the trigger
    const username = $(event.currentTarget.offsetParent)
      .find('.user-name')
      .val();
    let trigger = tpl.triggerVar.get();
    trigger.userId = '*';
    if (username !== undefined) {
      const userFound = ReactiveCache.getUser({ username });
      if (userFound !== undefined) {
        trigger.userId = userFound._id;
        tpl.triggerVar.set(trigger);
      }
    }
    // Sanitize trigger
    trigger = tpl.triggerVar.get();
    sanitizeObject(trigger);
    tpl.triggerVar.set(trigger);
    tpl.rulesCurrentTab.set('action');
  },
  'click .js-show-user-field'(event) {
    event.preventDefault();
    $(event.currentTarget.offsetParent)
      .find('.user-details')
      .removeClass('hide-element');
  },
  'click .js-goto-rules'(event, tpl) {
    event.preventDefault();
    tpl.rulesCurrentTab.set('rulesList');
  },
  'click .js-goback'(event, tpl) {
    event.preventDefault();
    if (
      tpl.rulesCurrentTab.get() === 'trigger' ||
      tpl.rulesCurrentTab.get() === 'ruleDetails'
    ) {
      tpl.rulesCurrentTab.set('rulesList');
    }
    if (tpl.rulesCurrentTab.get() === 'action') {
      tpl.rulesCurrentTab.set('trigger');
    }
  },
  'click .js-goto-details'(event, tpl) {
    event.preventDefault();
    // #6490: same as delete — Template.currentData() returned the parent context
    // here, so "View rule" always opened the same (first) rule regardless of which
    // one was clicked. Read the clicked rule's id from its data-rule-id.
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    if (!ruleId) return;
    tpl.ruleId.set(ruleId);
    tpl.rulesCurrentTab.set('ruleDetails');
  },
});
