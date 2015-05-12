Meteor.publish('card', function(cardId) {
  check(cardId, String);
  return Cards.find({ _id: cardId });
});
