import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
import { ruleVariableTokens, insertRuleVariable } from '/models/lib/ruleVariablePicker';

const TEXT_FIELD = 'input[type="text"], input:not([type]), textarea';

Template.ruleVariablePicker.onRendered(function () {
  // The select takes focus when it is opened, so remember the text field the
  // user was in before that, anywhere in this editor body.
  this.editor = this.firstNode.closest('.triggers-main-body') || this.firstNode.parentElement;
  this.lastField = null;
  this.onFocusIn = event => {
    if (event.target.matches && event.target.matches(TEXT_FIELD)) this.lastField = event.target;
  };
  this.editor.addEventListener('focusin', this.onFocusIn);
});

Template.ruleVariablePicker.onDestroyed(function () {
  if (this.editor) this.editor.removeEventListener('focusin', this.onFocusIn);
});

Template.ruleVariablePicker.helpers({
  tokens() {
    const boardId = Utils.getCurrentBoardId();
    return ruleVariableTokens(boardId ? ReactiveCache.getCustomFields({ boardIds: { $in: [boardId] } }) : []);
  },
});

Template.ruleVariablePicker.events({
  'change .js-rule-variable-picker'(event, tpl) {
    const select = event.currentTarget;
    const token = select.value;
    select.value = '';
    if (!token) return;
    // A field that has left the page (another tab of the editor) is not a target.
    let field = tpl.lastField && tpl.editor.contains(tpl.lastField) ? tpl.lastField : null;
    if (!field) field = tpl.editor.querySelector(TEXT_FIELD);
    if (!field) return;
    const { value, caret } = insertRuleVariable(field.value, field.selectionStart, field.selectionEnd, token);
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
    field.setSelectionRange(caret, caret);
  },
});
