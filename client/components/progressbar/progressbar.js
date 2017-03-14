const ProgressSubs = new SubsManager();

class ProgressBar extends BlazeComponent {
  template() {
    return 'progressBarTemplate';
  }

  onCreated() {
    super.onCreated();
    const self = this;
    self.ready = new ReactiveVar(false);
    self.determinate = new ReactiveVar(false);
  }

  progressValue() {
    const completed = this.completedItems();
    const total = this.totalItems();
    console.log(completed + " " + total);
    return ((completed / total) * 100).toFixed(2);
  }

  progressCSS() {
    return "width:"+ this.progressValue() +"%";
  }

  ready() {
    return this.ready.get();
  }

  determinate() {
    return this.determinate.get();
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

      Tracker.nonreactive(() => {
        Tracker.autorun((c) => {
          const subsReady = (listsHandle.ready() && cardsHandle.ready());
          this.ready.set(subsReady);
          if (subsReady)
            c.stop();
        });
      });

      Tracker.nonreactive(() => {
        Tracker.autorun((c) => {
          if(true == this.ready.get()) {
            const lists = Lists.find({}).count();
            const cards = Cards.find({}).count();
            if (lists > 0 && cards > 0) {
              this.determinate.set(true);
              c.stop();
            }
          }
        });
      });
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