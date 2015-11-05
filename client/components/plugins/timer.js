let cardClock = new ReactiveClock('cardClock');

BlazeComponent.extendComponent({
  template() {
    return 'cardTimer';
  },

  onCreated() {
    cardClock.start()
  },

  scrollParentContainer() {

  },

  onRendered() {

  },

  onDestroyed() {
    cardClock.stop();
  },

  events() {
    const events = {
      [`${CSSEvents.animationend} .js-card-timer`]() {
        this.isLoaded.set(true);
      },
    };

    return [{
      ...events,
      'click .js-toggle-card-timer'() {
        if (cardClock._stopped){
        cardClock.start();
        }
        else {
          cardClock.stop();
          const text = cardClock.elapsedTime({humanize: true});
          CardComments.insert({
            text,
            boardId: Session.get('currentBoard'),
            cardId: Session.get('currentCard'),
          });
        }
      },
    }];
  },

}).register('cardTimer');

Template.timer.helpers({
  elapsedTime: function () {
    let elapsedTimeHumanized = cardClock.elapsedTime({humanize: true});
    return elapsedTimeHumanized;
  },
  elapsedSeconds: function () {
    let elapsedSeconds = cardClock.elapsedTime();
    return elapsedSeconds;
  },
});
