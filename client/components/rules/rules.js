
BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allTriggers');
  },

  triggers() {
    return Triggers.find({});
  },
  events() {
    return [{'click .js-add-trigger'(event) {

          event.preventDefault();
          const toName = this.find('#toName').value;
          const fromName = this.find('#fromName').value;
          const toId = Triggers.findOne().findList(toName)._id;
          const fromId = Triggers.findOne().findList(fromName)._id;
          console.log(toId);
          console.log(fromId);
          Triggers.insert({group: "cards", activityType: "moveCard","fromId":fromId,"toId":toId });

          
      },}];
  },
}).register('rules');
