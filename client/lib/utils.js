Utils = {
  // XXX We should remove these two methods
  goBoardId: function(_id) {
    var board = Boards.findOne(_id);
    return board && Router.go('Board', {
      _id: board._id,
      slug: board.slug
    });
  },

  goCardId: function(_id) {
    var card = Cards.findOne(_id);
    var board = Boards.findOne(card.boardId);
    return board && Router.go('Card', {
      cardId: card._id,
      boardId: board._id,
      slug: board.slug
    });
  },

  capitalize: function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  getLabelIndex: function(boardId, labelId) {
    var board = Boards.findOne(boardId);
    var labels = {};
    _.each(board.labels, function(a, b) {
      labels[a._id] = b;
    });
    return {
      index: labels[labelId],
      key: function(key) {
        return 'labels.' + labels[labelId] + '.' + key;
      }
    };
  },

  // Determine the new sort index
  getSortIndex: function(prevCardDomElement, nextCardDomElement) {
    // If we drop the card to an empty column
    if (! prevCardDomElement && ! nextCardDomElement) {
      return 0;
    // If we drop the card in the first position
    } else if (! prevCardDomElement) {
      return Blaze.getData(nextCardDomElement).sort - 1;
    // If we drop the card in the last position
    } else if (! nextCardDomElement) {
      return Blaze.getData(prevCardDomElement).sort + 1;
    }
    // In the general case take the average of the previous and next element
    // sort indexes.
    else {
      var prevSortIndex = Blaze.getData(prevCardDomElement).sort;
      var nextSortIndex = Blaze.getData(nextCardDomElement).sort;
      return (prevSortIndex + nextSortIndex) / 2;
    }
  }
};
