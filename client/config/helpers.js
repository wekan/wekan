Blaze.registerHelper('currentCard', function() {
  var cardId = Session.get('currentCard');
  if (cardId) {
    return Cards.findOne(cardId);
  }
});
