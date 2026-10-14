import { Utils } from '/client/lib/utils';
import { saveRuleTriggerAction } from '/client/components/rules/rulesSaveHelper';
import { ReactiveCache } from '/imports/reactiveCache';
const { memberChoices, addRecipient } = require('/models/lib/ruleEmailMembers');

Template.mailActions.onCreated(function () {
  this.memberQuery = new ReactiveVar('');
});

// #2435: the board's active members, for the To field's member picker.
Template.mailActions.helpers({
  memberChoices() {
    const board = Utils.getCurrentBoard();
    const ids = ((board && board.members) || []).filter(m => m && m.isActive !== false).map(m => m.userId);
    const members = ReactiveCache.getUsers({ _id: { $in: ids } })
      .map(u => ({ username: u.username, fullname: (u.profile || {}).fullname }));
    return memberChoices(members, Template.instance().memberQuery.get());
  },
});

Template.mailActions.events({
  'input .js-email-to-member'(event, tpl) {
    tpl.memberQuery.set(event.currentTarget.value);
  },
  // A choice from the list (or a typed @username) goes into To, once.
  'change .js-email-to-member'(event, tpl) {
    const value = String(event.currentTarget.value || '').trim();
    if (!/^@[A-Za-z0-9._-]+$/.test(value)) return;
    const to = tpl.find('#email-to');
    to.value = addRecipient(to.value, value);
    event.currentTarget.value = '';
    tpl.memberQuery.set('');
  },
  'click .js-mail-action'(event, tpl) {
    const emailTo = tpl.find('#email-to').value;
    const emailSubject = tpl.find('#email-subject').value;
    const emailMsg = tpl.find('#email-msg').value;
    const data = Template.currentData();
    const trigger = data.triggerVar.get();
    const ruleName = data.ruleName.get();
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    saveRuleTriggerAction(boardId, data.ruleId, ruleName, trigger, {
      actionType: 'sendEmail',
      emailTo,
      emailSubject,
      emailMsg,
      includeCardDetails: tpl.find('#email-card-details').checked,
      includeChecklistsAndComments: tpl.find('#email-discussion').checked,
      includeAttachments: tpl.find('#email-attachments').checked,
      boardId,
      desc,
    });
  },
});
