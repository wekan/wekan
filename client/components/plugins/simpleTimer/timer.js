const cardClock = new ReactiveClock('cardClock');

BlazeComponent.extendComponent({
  template() {
    return 'cardTimer';
  },

  onCreated() {
    cardClock.start();
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
        }
      },
      'dblclick .js-toggle-card-timer'() {
        cardClock.stop();
        const text = `:watch: ${cardClock.elapsedTime({humanize: true})} (${cardClock.elapsedTime()})`;
        CardComments.insert({
          text,
          boardId: Session.get('currentBoard'),
          cardId: Session.get('currentCard'),
        });
        cardClock.setElapsedSeconds(0);
      },
    }];
  },

  showTimer() {
    return Session.get('showTimer');
  },

  elapsedTime() {
    const elapsedTimeHumanized = cardClock.elapsedTime({humanize: true});
    return elapsedTimeHumanized;
  },

  elapsedSeconds() {
    const elapsedSeconds = cardClock.elapsedTime();
    return elapsedSeconds;
  },

}).register('cardTimer');
