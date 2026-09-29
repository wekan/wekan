import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { closePageSidebar } from '/client/lib/pageSidebar';
import { triggerValueHasVars } from '/models/lib/ruleTriggerVars';

Template.rulesMain.onCreated(function () {
  this.rulesCurrentTab = new ReactiveVar('rulesList');
  this.ruleName = new ReactiveVar('');
  this.triggerVar = new ReactiveVar();
  this.ruleId = new ReactiveVar();
  // #2713: set while editing an EXISTING rule's trigger/action through the
  // rulesList "Edit" button, so the wizard's save buttons (routed through
  // rulesSaveHelper.saveRuleTriggerAction) update that rule instead of
  // creating a new one. null while creating a brand-new rule.
  this.editingRuleId = new ReactiveVar(null);

  // The Workflow view is the rulesList tab's alternative rendering, so it can
  // only show while that tab is current. The toggle lives in rulesControls -
  // a separate template in the page sidebar with no handle on this instance
  // - and it only flips Session 'rulesViewMode'; from the Add trigger / Add
  // action / rule details tabs that changed the button's label and nothing
  // else. Switching to the workflow view therefore brings the page back to
  // the list tab here, where the tab state lives.
  this.autorun(() => {
    Session.get('rulesViewRequest');
    if (['list', 'workflow', 'blocks', 'history'].includes(Session.get('rulesViewMode'))) {
      this.rulesCurrentTab.set('rulesList');
    }
  });

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
  editingRuleId() {
    return Template.instance().editingRuleId;
  },
  currentBoard() {
    return Utils.getCurrentBoard();
  },
  rulesBoardId() { return Session.get('currentBoard'); },
  isRulesHistoryView() { return Session.get('rulesViewMode') === 'history'; },
  isBlocksView() { return Session.get('rulesViewMode') === 'blocks'; },
  isWorkflowView() {
    return Session.get('rulesViewMode') === 'workflow';
  },
});

Template.rulesControls.helpers({
  currentBoard() {
    return Utils.getCurrentBoard();
  },
  isWorkflowView() {
    return Session.get('rulesViewMode') === 'workflow';
  },
});

Template.rulesControls.events({
  'click .js-rules-list-view'(event) {
    event.preventDefault();
    if (Session.get('rulesBlocksDirty') && !confirm(TAPi18n.__('r-blocks-discard'))) return;
    Session.set('rulesViewMode', 'list');
    Session.set('rulesViewRequest', (Session.get('rulesViewRequest') || 0) + 1);
    closePageSidebar();
  },
  'click .js-rules-history'(event) {
    event.preventDefault();
    if (Session.get('rulesBlocksDirty') && !confirm(TAPi18n.__('r-blocks-discard'))) return;
    Session.set('rulesViewMode', 'history');
    Session.set('rulesViewRequest', (Session.get('rulesViewRequest') || 0) + 1);
    closePageSidebar();
  },
  'click .js-rules-blocks-view'(event) {
    event.preventDefault();
    Session.set('rulesViewMode', 'blocks');
    Session.set('rulesViewRequest', (Session.get('rulesViewRequest') || 0) + 1);
    closePageSidebar();
  },
  'click .js-rules-back-to-board'(event) {
    event.preventDefault();
    if (Session.get('rulesBlocksDirty') && !confirm(TAPi18n.__('r-blocks-discard'))) return;
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
    if (Session.get('rulesBlocksDirty') && !confirm(TAPi18n.__('r-blocks-discard'))) return;
    const mode = 'workflow';
    Session.set('rulesViewMode', mode);
    Session.set('rulesViewRequest', (Session.get('rulesViewRequest') || 0) + 1);
    closePageSidebar();
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
    const input = tpl.find('#ruleTitle');
    const ruleTitle = (input.value || '').trim();
    // #4294: clicking "Add Rule" with an empty title used to just do
    // nothing — no error, no explanation, and the button visibly reacted to
    // the click. Show a validation message and highlight the field instead
    // of the silent no-op.
    if (ruleTitle === '') {
      input.classList.add('rules-field-error');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      $(input)
        .closest('.rules-add')
        .find('.js-rule-title-error')
        .removeClass('hide-element');
      return;
    }
    input.classList.remove('rules-field-error');
    input.removeAttribute('aria-invalid');
    $(input)
      .closest('.rules-add')
      .find('.js-rule-title-error')
      .addClass('hide-element');
    input.value = '';
    tpl.ruleName.set(ruleTitle);
    // A fresh "Add Rule" always creates - clear any leftover edit target.
    tpl.editingRuleId.set(null);
    tpl.rulesCurrentTab.set('trigger');
  },
  'click .js-edit-rule-full, click .js-blocks-form'(event, tpl) {
    event.preventDefault();
    // #2713: "Edit" on an existing rule - open the same trigger/action wizard
    // used to create a rule, but remember which rule this is so the wizard's
    // save buttons update it in place (see rulesSaveHelper.js) instead of
    // creating a new rule alongside it.
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    if (!ruleId) return;
    const rule = ReactiveCache.getRule(ruleId);
    if (!rule) return;
    tpl.ruleName.set(rule.title || '');
    tpl.editingRuleId.set(ruleId);
    tpl.rulesCurrentTab.set('trigger');
  },
  'click .js-goto-action'(event, tpl) {
    event.preventDefault();
    // Add user to the trigger
    const username = $(event.currentTarget.offsetParent)
      .find('.user-name')
      .val();
    let trigger = tpl.triggerVar.get();
    trigger.userId = '*';
    if (triggerValueHasVars(username)) {
      // #4294: "by {assignees}" - a person named by a variable, resolved for
      // the card when the rule is checked (models/lib/ruleTriggerVars.js).
      trigger.userId = username.trim();
      tpl.triggerVar.set(trigger);
    } else if (username !== undefined) {
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
    // #4294: "Add another trigger" adds this trigger to the rule and returns
    // to its details; no action step.
    const adding = Session.get('rulesAddingPart');
    if (adding && adding.kind === 'trigger') {
      Session.set('rulesAddingPart', null);
      Meteor.call('rules.addPart', adding.ruleId, 'trigger', trigger);
      tpl.ruleId.set(adding.ruleId);
      tpl.rulesCurrentTab.set('ruleDetails');
      return;
    }
    tpl.rulesCurrentTab.set('action');
  },
  // #4294 / #2953: a rule with several triggers or actions.
  'click .js-add-rule-part'(event, tpl) {
    event.preventDefault();
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    const kind = event.currentTarget.getAttribute('data-kind');
    if (!ruleId || !['trigger', 'action'].includes(kind)) return;
    const rule = ReactiveCache.getRule(ruleId);
    if (!rule) return;
    Session.set('rulesAddingPart', { ruleId, kind });
    tpl.ruleName.set(rule.title || '');
    tpl.editingRuleId.set(null);
    tpl.rulesCurrentTab.set(kind);
  },
  'click .js-remove-rule-part'(event) {
    event.preventDefault();
    const target = event.currentTarget;
    Meteor.call('rules.removePart', target.getAttribute('data-rule-id'),
      target.getAttribute('data-kind'), target.getAttribute('data-part-id'));
  },
  'click .js-show-user-field'(event) {
    event.preventDefault();
    $(event.currentTarget.offsetParent)
      .find('.user-details')
      .removeClass('hide-element');
  },
  'click .js-goto-rules'(event, tpl) {
    event.preventDefault();
    Session.set('rulesAddingPart', null);
    tpl.rulesCurrentTab.set('rulesList');
    // Whether this was "cancel" or "save", the wizard is done with whichever
    // rule it was editing.
    tpl.editingRuleId.set(null);
  },
  'click .js-goback'(event, tpl) {
    event.preventDefault();
    Session.set('rulesAddingPart', null);
    if (
      tpl.rulesCurrentTab.get() === 'trigger' ||
      tpl.rulesCurrentTab.get() === 'ruleDetails'
    ) {
      tpl.rulesCurrentTab.set('rulesList');
      tpl.editingRuleId.set(null);
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
