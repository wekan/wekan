import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import Actions from '/models/actions';
import Rules from '/models/rules';
import Triggers from '/models/triggers';

// A drag-and-drop visual workflow editor for board rules. Triggers and actions
// are draggable chips; drag one of each into the builder (When → Then) and add
// the rule, or drag an action onto an existing rule to change what it does.
//
// The palette offers the parameter-free / wildcard ("any") variants so a rule
// can be built entirely by dragging. Parameterized rules (specific list, label,
// member, schedule time, …) are still created with the form builder on the
// List view.
// Each palette entry carries an i18n `labelKey` (translated at render time via
// TAPi18n.__) instead of a hardcoded English string, so the whole workflow view
// follows the UI language. `labelParams` is passed to TAPi18n.__ for labels that
// need a placeholder (e.g. the scheduled time). Existing rule keys are reused
// where they fit; workflow-only labels use new `r-w-*` keys (see en.i18n.json).
const TRIGGER_PALETTE = [
  { labelKey: 'r-w-card-created', doc: { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' } },
  { labelKey: 'r-when-a-card-is-moved', doc: { activityType: 'moveCard', listName: '*', oldListName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' } },
  { labelKey: 'r-w-card-archived', doc: { activityType: 'archivedCard', userId: '*' } },
  { labelKey: 'r-w-card-unarchived', doc: { activityType: 'restoredCard', userId: '*' } },
  { labelKey: 'r-w-label-added', doc: { activityType: 'addedLabel', labelId: '*', userId: '*' } },
  { labelKey: 'r-w-label-removed', doc: { activityType: 'removedLabel', labelId: '*', userId: '*' } },
  { labelKey: 'r-w-member-added', doc: { activityType: 'joinMember', username: '*', userId: '*' } },
  { labelKey: 'r-w-member-removed', doc: { activityType: 'unjoinMember', username: '*', userId: '*' } },
  { labelKey: 'r-w-checklist-added', doc: { activityType: 'addChecklist', checklistName: '*', userId: '*' } },
  { labelKey: 'r-w-attachment-added', doc: { activityType: 'addAttachment', userId: '*' } },
  { labelKey: 'r-w-every-day-at', labelParams: { time: '09:00' }, doc: { activityType: 'scheduledTrigger', scheduleKind: 'calendar', scheduleType: 'daily', atTime: '09:00', listName: '*', swimlaneName: '*' } },
];

const ACTION_PALETTE = [
  { labelKey: 'r-d-move-to-top-gen', doc: { actionType: 'moveCardToTop', listName: '*', swimlaneName: '*' } },
  { labelKey: 'r-d-move-to-bottom-gen', doc: { actionType: 'moveCardToBottom', listName: '*', swimlaneName: '*' } },
  { labelKey: 'r-d-archive', doc: { actionType: 'archive' } },
  { labelKey: 'r-d-unarchive', doc: { actionType: 'unarchive' } },
  { labelKey: 'r-mark-complete', doc: { actionType: 'markCardComplete' } },
  { labelKey: 'r-mark-incomplete', doc: { actionType: 'markCardIncomplete' } },
  { labelKey: 'r-remove-all', doc: { actionType: 'removeMember', username: '*' } },
  { labelKey: 'r-w-set-received-now', doc: { actionType: 'setDate', dateField: 'receivedAt' } },
];

// Translate a palette entry's label for display / storage in the current UI
// language (matches the classic Rules view, which also stores already-translated
// description text at creation time).
function paletteLabel(entry) {
  if (!entry) return '';
  return TAPi18n.__(entry.labelKey, entry.labelParams);
}

Template.rulesWorkflow.onCreated(function () {
  this.builderTrigger = new ReactiveVar(null);
  this.builderAction = new ReactiveVar(null);
  this.dragItem = null; // {type:'trigger'|'action', idx}
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) this.subscribe('boardRules', boardId);
  });
});

Template.rulesWorkflow.helpers({
  currentBoard() {
    return Utils.getCurrentBoard();
  },
  triggerPalette() {
    return TRIGGER_PALETTE.map((t, idx) => ({ idx, label: paletteLabel(t) }));
  },
  actionPalette() {
    return ACTION_PALETTE.map((a, idx) => ({ idx, label: paletteLabel(a) }));
  },
  builderTrigger() {
    return Template.instance().builderTrigger.get();
  },
  builderTriggerLabel() {
    return paletteLabel(Template.instance().builderTrigger.get());
  },
  builderAction() {
    return Template.instance().builderAction.get();
  },
  builderActionLabel() {
    return paletteLabel(Template.instance().builderAction.get());
  },
  createDisabled() {
    const tpl = Template.instance();
    return tpl.builderTrigger.get() && tpl.builderAction.get() ? false : true;
  },
  rules() {
    const boardId = Session.get('currentBoard');
    const rules = ReactiveCache.getRules({ boardId });
    return rules.map(rule => {
      const trigger = ReactiveCache.getTrigger(rule.triggerId);
      const action = ReactiveCache.getAction(rule.actionId);
      return {
        ruleId: rule._id,
        whenText: (trigger && trigger.desc) || (trigger && trigger.activityType) || '',
        thenText: (action && action.desc) || (action && action.actionType) || '',
      };
    });
  },
});

function persistRule(tpl) {
  const t = tpl.builderTrigger.get();
  const a = tpl.builderAction.get();
  if (!t || !a) return;
  const boardId = Session.get('currentBoard');
  const titleField = tpl.find('.js-workflow-rule-title');
  const tLabel = paletteLabel(t);
  const aLabel = paletteLabel(a);
  const title = (titleField.value || '').trim() || `${tLabel} → ${aLabel}`;
  const triggerId = Triggers.insert({ ...t.doc, boardId, desc: tLabel });
  const actionId = Actions.insert({ ...a.doc, boardId, desc: aLabel });
  Rules.insert({ title, triggerId, actionId, boardId });
  tpl.builderTrigger.set(null);
  tpl.builderAction.set(null);
  titleField.value = '';
}

Template.rulesWorkflow.events({
  'dragstart .js-trigger-chip'(event, tpl) {
    tpl.dragItem = { type: 'trigger', idx: Number(event.currentTarget.dataset.idx) };
  },
  'dragstart .js-action-chip'(event, tpl) {
    tpl.dragItem = { type: 'action', idx: Number(event.currentTarget.dataset.idx) };
  },
  // Allow dropping by preventing the default (which disables drop) on dragover.
  'dragover .js-when-slot, dragover .js-then-slot, dragover .js-rule-node'(event) {
    event.preventDefault();
  },
  'drop .js-when-slot'(event, tpl) {
    event.preventDefault();
    if (tpl.dragItem && tpl.dragItem.type === 'trigger') {
      tpl.builderTrigger.set(TRIGGER_PALETTE[tpl.dragItem.idx]);
    }
    tpl.dragItem = null;
  },
  'drop .js-then-slot'(event, tpl) {
    event.preventDefault();
    if (tpl.dragItem && tpl.dragItem.type === 'action') {
      tpl.builderAction.set(ACTION_PALETTE[tpl.dragItem.idx]);
    }
    tpl.dragItem = null;
  },
  // Drop an action onto an existing rule to replace what it does.
  'drop .js-rule-node'(event, tpl) {
    event.preventDefault();
    if (!tpl.dragItem || tpl.dragItem.type !== 'action') return;
    const ruleId = event.currentTarget.dataset.ruleId;
    const rule = ReactiveCache.getRule(ruleId);
    if (!rule) return;
    const a = ACTION_PALETTE[tpl.dragItem.idx];
    const boardId = Session.get('currentBoard');
    const oldActionId = rule.actionId;
    const newActionId = Actions.insert({ ...a.doc, boardId, desc: paletteLabel(a) });
    Rules.update(ruleId, { $set: { actionId: newActionId } });
    if (oldActionId) Actions.remove(oldActionId);
    tpl.dragItem = null;
  },
  'click .js-clear-when'(event, tpl) {
    event.preventDefault();
    tpl.builderTrigger.set(null);
  },
  'click .js-clear-then'(event, tpl) {
    event.preventDefault();
    tpl.builderAction.set(null);
  },
  'click .js-create-workflow-rule'(event, tpl) {
    event.preventDefault();
    persistRule(tpl);
  },
  'click .js-delete-workflow-rule'(event, tpl) {
    event.preventDefault();
    const node = event.currentTarget.closest('.js-rule-node');
    const ruleId = node && node.dataset.ruleId;
    const rule = ReactiveCache.getRule(ruleId);
    if (!rule) return;
    // Delete the rule + its trigger + action server-side (see
    // server/rulesButton.js `rules.deleteRule`): three client-side
    // Collection.remove() calls were rejected with 403 "Access denied".
    Meteor.call('rules.deleteRule', rule._id);
  },
});
