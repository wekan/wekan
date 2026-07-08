import { ReactiveCache } from '/imports/reactiveCache';
import Rules from '/models/rules';

function boardRuleIds() {
  const boardId = Session.get('currentBoard');
  return ReactiveCache.getRules({ boardId }).map(r => r._id);
}

function getSelected() {
  return Session.get('selectedRuleIds') || [];
}

function setSelected(ids) {
  Session.set('selectedRuleIds', ids);
}

Template.rulesList.onCreated(function () {
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) this.subscribe('boardRules', boardId);
  });
  this.editingRuleId = new ReactiveVar(null);
});

Template.rulesList.helpers({
  rules() {
    const boardId = Session.get('currentBoard');
    return ReactiveCache.getRules({ boardId });
  },
  canAdmin() {
    const user = ReactiveCache.getCurrentUser();
    return user && (user.isAdmin || user.isBoardAdmin);
  },
  isSelected() {
    return getSelected().includes(this._id);
  },
  isEditing() {
    return Template.instance().editingRuleId.get() === this._id;
  },
});

Template.rulesList.events({
  'change .js-rule-select'(event) {
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    const selected = new Set(getSelected());
    if (event.currentTarget.checked) {
      selected.add(ruleId);
    } else {
      selected.delete(ruleId);
    }
    setSelected([...selected]);
  },
  'click .js-rules-select-all'() {
    setSelected(boardRuleIds());
  },
  'click .js-rules-select-none'() {
    setSelected([]);
  },
  'click .js-rules-delete-selected'() {
    getSelected().forEach(ruleId => {
      const rule = ReactiveCache.getRule(ruleId);
      if (rule) {
        // Delete the rule + its trigger + action server-side (see
        // server/rulesButton.js `rules.deleteRule`): three client-side
        // Collection.remove() calls were rejected with 403 "Access denied".
        Meteor.call('rules.deleteRule', rule._id);
      }
    });
    setSelected([]);
  },
  'click .js-rules-export-selected': Popup.open('rulesImportExport'),
  // Inline rename of a rule.
  'click .js-edit-rule'(event, tpl) {
    tpl.editingRuleId.set(this._id);
  },
  'keydown .js-edit-rule-input'(event, tpl) {
    if (event.key === 'Enter') {
      const title = event.currentTarget.value.trim();
      if (title) Rules.update(this._id, { $set: { title } });
      tpl.editingRuleId.set(null);
    } else if (event.key === 'Escape') {
      tpl.editingRuleId.set(null);
    }
  },
  'blur .js-edit-rule-input'(event, tpl) {
    const title = event.currentTarget.value.trim();
    if (title) Rules.update(this._id, { $set: { title } });
    tpl.editingRuleId.set(null);
  },
});
