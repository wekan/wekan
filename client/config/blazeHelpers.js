Blaze.registerHelper('currentBoard', function() {
  var boardId = Session.get('currentBoard');
  if (boardId) {
    return Boards.findOne(boardId);
  }
});

Blaze.registerHelper('currentCard', function() {
  var cardId = Session.get('currentCard');
  if (cardId) {
    return Cards.findOne(cardId);
  }
});

Blaze.registerHelper('currentOrganization', function() {
  var orgShortName = Session.get('currentOrganizationShortName');
  if (orgShortName) {
    return Organizations.findOne({shortName: orgShortName});
  }
});

