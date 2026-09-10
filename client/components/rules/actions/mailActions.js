import { Utils } from '/client/lib/utils';
import { saveRuleTriggerAction } from '/client/components/rules/rulesSaveHelper';

Template.mailActions.events({
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
      boardId,
      desc,
    });
  },
});
