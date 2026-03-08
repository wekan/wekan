Template.mailActions.events({
  'click .js-mail-action'(event, tpl) {
    const emailTo = tpl.find('#email-to').value;
    const emailSubject = tpl.find('#email-subject').value;
    const emailMsg = tpl.find('#email-msg').value;
    const data = Template.currentData();
    const trigger = data.triggerVar.get();
    const ruleName = data.ruleName.get();
    const triggerId = Triggers.insert(trigger);
    const boardId = Session.get('currentBoard');
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const actionId = Actions.insert({
      actionType: 'sendEmail',
      emailTo,
      emailSubject,
      emailMsg,
      boardId,
      desc,
    });
    Rules.insert({
      title: ruleName,
      triggerId,
      actionId,
      boardId,
    });
  },
});
