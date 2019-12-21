if (process.env.LINKED_CARDS_ENABLED === 'false') {
  Meteor.settings.public.linkedCardsEnabled = 'false';
  //Meteor.publish('card', cardId => {
  //  check(cardId, String);
  //  // TODO: test
  //  return Cards.find({
  //    _id: cardId,
  //    linkedId: { $ne: [null, ''] },
  //  });
  //});
} else {
  Meteor.settings.public.linkedCardsEnabled = 'true';
  Meteor.publish('card', cardId => {
    check(cardId, String);
    return Cards.find({ _id: cardId });
  });
}
