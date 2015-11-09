BlazeComponent.extendComponent({
  template() {
    return 'toolbar';
  },

  onCreated() {

  },

  onDestroyed() {

  },

  events() {
    const events = {
      [`${CSSEvents.animationend} .js-toolbar`]() {
        this.isLoaded.set(true);
      },
    };

    return [{
      ...events,
      'click .js-toggle-card-timer'() {
        if (!Session.get('showTimer')) {
          Session.set('showTimer', true);
        }
        else {
          Session.set('showTimer', false);
        }
      },
      'click .js-toggle-card-clone'() {
        if (!Session.get('showBoards')) {
          Session.set('showBoards', true);
        }
        else {
          Session.set('showBoards', false);
          Session.set('showLists', false);
        }
      },
    }];
  },

}).register('toolbar');
