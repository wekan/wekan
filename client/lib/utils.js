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

  // Determine the new sort index of new created cards
  // dont use calculateIndex 
  calculateSort(type, listId){
    var base = 0;
    var increment = 1;
    if( Cards.find({listId:listId}).count() === 0){
      base = 0;
    } 
    else if( type === "top" ){
      var topsort = Cards.find({listId:listId}).fetch()[0].sort;
      base = topsort - 1;
    }
    else if( type === "bottom" ){
      var topsort = Cards.find({listId:listId}).fetch()[Cards.find({listId:listId}).count()-1].sort;
      base = topsort + 1;    
    }
    return base;
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
    
    var starttime = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var starttimes = starttime.getTime();

    var lktime = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    var lktimes = lktime.getTime();

    if (starttimes === lktimes) {
      return 0;
    }
    else if (starttimes > lktimes) 
      return 1;
    else
      return -1;

  },
};
