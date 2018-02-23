BlazeComponent.extendComponent({
  onCreated() {
    this.term = new ReactiveVar('');
  },

  results() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.searchCards(this.term.get());
  },

  events() {
    return [{
      'submit .js-search-term-form'(evt) {
        evt.preventDefault();
        this.term.set(evt.target.searchTerm.value);
      },
    }];
  },
}).register('searchSidebar');
