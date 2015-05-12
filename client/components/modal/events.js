Template.modal.events({
  'click .window-overlay': function(event) {
    // We only want to catch the event if the user click on the .window-overlay
    // div itself, not a child (ie, not the overlay window)
    if (event.target !== event.currentTarget)
      return;
    Utils.goBoardId(this.card.board()._id);
    event.preventDefault();
  },
  'click .js-close-window': function(event) {
    Utils.goBoardId(this.card.board()._id);
    event.preventDefault();
  }
});
