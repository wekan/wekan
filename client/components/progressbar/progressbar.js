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
    console.log("done: " + completed + " total: " + total);
    return ((completed / total) * 100).toFixed(2);
  }

  progressCSS() {
    return "width:"+ this.progressValue() +"%";
  }

  ready() {
    console.log("checking ready")
    return this.ready.get();
  }

  determinate() {
    console.log("checking determinate")
    return this.determinate.get();
  }
}

(class BoardProgressBar extends ProgressBar {
  onCreated() {
    super.onCreated();
    this.autorun(() => {
      const currentBoardId = this.data()["context"];
      console.log('boardId: ' + currentBoardId);
      if (!Match.test(currentBoardId, String))
        return;

      const listsHandle = Meteor.subscribe('boardLists', currentBoardId);
      const cardsHandle = Meteor.subscribe('boardCards', currentBoardId);
      
      //waiting for subscriptions to be ready
      const subsReady = (listsHandle.ready() && cardsHandle.ready());
      this.ready.set(subsReady);

      Tracker.autorun((c) => {
        if(true == this.ready.get()) {
          const lists = Lists.find({}).count();
          const cards = Cards.find({}).count();
          console.log("lists: "+ lists+" cards: "+cards);
          if (lists > 0 && cards > 0) {
            console.log('board is determinate')
            this.determinate.set(true);
          }
          else {
            console.log('board is NOT determinate')
            this.determinate.set(false);
          }
        }
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