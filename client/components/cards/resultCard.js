Template.resultCard.helpers({
  userId() {
    return Meteor.userId();
  },
});

BlazeComponent.extendComponent({
  events() {
    return [{}];
  },
}).register('resultCard');
