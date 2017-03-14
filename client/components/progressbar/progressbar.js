class ProgressBar extends BlazeComponent {
  template() {
    return 'progressBarTemplate';
  }

  onCreated() {
    super.onCreated();
    const self = this;
    self.ready = new ReactiveVar(false);
    self.determinate = new ReactiveVar(false);
    self.boardId = new ReactiveVar();
  }

  progressValue() {
    return ((this.completedItems() / this.totalItems()) * 100).toFixed(2);
  }

  progressCSS() {
    return "width:"+ this.progressValue() +"%";
  }
}

(class BoardProgressBar extends ProgressBar {
  onCreated() {
    super.onCreated();
    this.autorun(() => {
      const currentBoardId = this.data()["board"];
      if (!Match.test(currentBoardId, String))
        return;

      const listsHandle = Meteor.subscribe('boardLists', currentBoardId);
      const cardsHandle = Meteor.subscribe('boardCards', currentBoardId);
      
      //waiting for subscriptions to be ready
      const subsReady = (listsHandle.ready() && cardsHandle.ready());
      this.ready.set(subsReady);

      Tracker.autorun((c) => {
        if(true == this.ready.get()) {
          const lists = Lists.find({boardId: currentBoardId}).count();
          const cards = Cards.find({boardId: currentBoardId}).count();
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

      this.boardId.set(currentBoardId);
    });
  }

  totalItems() {
    return Cards.find({"boardId": this.boardId.get()}).count();
  }

  completedItems() {
    const completedList = Lists.findOne({"boardId": this.boardId.get()}, {sort: {sort: -1}});
    return Cards.find({listId: completedList["_id"]}).count();
  }
}).register('boardProgressBar');