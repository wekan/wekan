BlazeComponent.extendComponent({
  currentCardIsInThisList(listId, swimlaneId) {
    const currentCard = Cards.findOne(Session.get('currentCard'));
    const currentBoardId = Session.get('currentBoard');
    const board = Boards.findOne(currentBoardId);
    if (board.view === 'board-view-lists')
      return currentCard && currentCard.listId === listId;
    else if (board.view === 'board-view-swimlanes')
      return currentCard && currentCard.listId === listId && currentCard.swimlaneId === swimlaneId;
    else
      return false;
  },
}).register('listsGroup');
