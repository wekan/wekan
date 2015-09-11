Utils = {
  // XXX We should remove these two methods
  goBoardId(_id) {
    const board = Boards.findOne(_id);
    return board && FlowRouter.go('board', {
      id: board._id,
      slug: board.slug,
    });
  },

  goCardId(_id) {
    const card = Cards.findOne(_id);
    const board = Boards.findOne(card.boardId);
    return board && FlowRouter.go('card', {
      cardId: card._id,
      boardId: board._id,
      slug: board.slug,
    });
  },

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  getLabelIndex(boardId, labelId) {
    const board = Boards.findOne(boardId);
    const labels = {};
    _.each(board.labels, (a, b) => {
      labels[a._id] = b;
    });
    return {
      index: labels[labelId],
      key(key) {
        return `labels.${labels[labelId]}.${key}`;
      },
    };
  },

  // Determine the new sort index
  calculateIndex(prevCardDomElement, nextCardDomElement, nCards = 1) {
    let base, increment;
    // If we drop the card to an empty column
    if (!prevCardDomElement && !nextCardDomElement) {
      base = 0;
      increment = 1;
    // If we drop the card in the first position
    } else if (!prevCardDomElement) {
      base = Blaze.getData(nextCardDomElement).sort - 1;
      increment = -1;
    // If we drop the card in the last position
    } else if (!nextCardDomElement) {
      base = Blaze.getData(prevCardDomElement).sort + 1;
      increment = 1;
    }
    // In the general case take the average of the previous and next element
    // sort indexes.
    else {
      const prevSortIndex = Blaze.getData(prevCardDomElement).sort;
      const nextSortIndex = Blaze.getData(nextCardDomElement).sort;
      increment = (nextSortIndex - prevSortIndex) / (nCards + 1);
      base = prevSortIndex + increment;
    }
    // XXX Return a generator that yield values instead of a base with a
    // increment number.
    return {
      base,
      increment,
    };
  },
  compareDay: function(start, end) {
    var arr = start.toString().split("-");
    var starttime = new Date(arr[0], arr[1], arr[2]);
    var starttimes = starttime.getTime();

    var arrs = end.toString().split("-");
    var lktime = new Date(arrs[0], arrs[1], arrs[2]);
    var lktimes = lktime.getTime();

    if (starttimes >= lktimes) {
        return true;
    }
    else
        return false;

  },
};
