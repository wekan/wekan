Meteor.publish('card', cardId => {
  check(cardId, String);
  if (process.env.LINKED_CARDS_ENABLED === 'true') {
    return Cards.find({ _id: cardId });
  } else {
    // TODO: test
    return Cards.find({
      _id: cardId,
      linkedId: {$ne: [
        null,
        ''
      ]}
    });
  }
});
