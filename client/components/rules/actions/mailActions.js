BlazeComponent.extendComponent({
  onCreated() {

  },

  events() {
    return [
    {'click .js-mail-action'(event) {
      const emailTo = this.find('#email-to').value;
      const emailSubject = this.find('#email-subject').value;
      const emailMsg = this.find('#email-msg').value;
      const trigger = this.data().triggerVar.get();
      const ruleName = this.data().ruleName.get();
      const triggerId = Triggers.insert(trigger);
      const boardId = Session.get('currentBoard');
      const desc = Utils.getTriggerActionDesc(event,this);
      const actionId = Actions.insert({actionType: "sendEmail","emailTo":emailTo,"emailSubject":emailSubject,"emailMsg":emailMsg,"boardId":boardId,"desc":desc});
      Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
    },
  }];
},

}).register('mailActions');