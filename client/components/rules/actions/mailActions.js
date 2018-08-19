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
      const actionId = Actions.insert({actionType: "sendEmail","emailTo":emailTo,"emailSubject":emailSubject,"emailMsg":emailMsg});
      Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId});  
    },
  }];
},

}).register('mailActions');