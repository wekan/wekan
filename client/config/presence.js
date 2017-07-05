Presence.configure({
  state() {
    return {
      currentBoardId: Session.get('currentBoard'),
    };
  },
});
