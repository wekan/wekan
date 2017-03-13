const ProgressSubs = new SubsManager();

class ProgressBar extends BlazeComponent {
  template() {
    return 'progressBarTemplate';
  }

  onCreated() {
    super.onCreated();
    const self = this;
    self.state = new ReactiveDict('progressBarState');
    self.state.set('ready', false);
  }

  progressValue() {
    const completed = this.completedItems();
    const total = this.totalItems();
    if(total > 0)
      return (completed / total) * 100;
    else
      return;
  }

  progressCSS() {
    return "width:"+ this.progressValue() +"%";
  }

  ready() {
    return this.state.get('ready');
  }
}

(class BoardProgressBar extends ProgressBar {
  onCreated() {
    super.onCreated();
    this.autorun(() => {
      const currentBoardId = Session.get('currentBoard');
      if (!currentBoardId)
        return;
      const listsHandle = ProgressSubs.subscribe('boardLists', currentBoardId);
      const cardsHandle = ProgressSubs.subscribe('boardCards', currentBoardId);

      const subsReady = (listsHandle.ready() && cardsHandle.ready());
      this.state.set('ready', subsReady);
    });
  }

  totalItems() {
    return Cards.find({}).count();
  }

  completedItems() {
    const completedList = Lists.findOne({}, {sort: {sort: -1}});
    return Cards.find({listId: completedList["_id"]}).count();
  }
}).register('boardProgressBar');