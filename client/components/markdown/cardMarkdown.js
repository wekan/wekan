BlazeComponent.extendComponent({
  template() {
    return 'cardMarkdown';
  },

  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  calculateNextPeak() {
    const altitude = this.find('.js-card-markdown').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak() {
    const activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onCreated() {
    this.isLoaded = new ReactiveVar(false);
    this.componentParent().showOverlay1.set(true);
    this.componentParent().mouseHasEnterCardMarkdown = false;
  },

  scrollParentContainer() {
    const cardPanelWidth = 1020;
    const bodyBoardComponent = this.componentParent();

    const $cardContainer = bodyBoardComponent.$('.js-lists');
    const $cardView = this.$(this.firstNode());
    const cardContainerScroll = $cardContainer.scrollLeft();
    const cardContainerWidth = $cardContainer.width();
    // const cardContainerHeight = $cardContainer.height();

    const cardViewStart = $cardView.offset().left;
    const cardViewEnd = cardViewStart + cardPanelWidth;

    let offset = false;
    if (cardViewStart < 0) {
      offset = cardViewStart;
    } else if(cardViewEnd > cardContainerWidth) {
      offset = cardViewEnd - cardContainerWidth;
    }

    if (offset) {
      bodyBoardComponent.scrollLeft(cardContainerScroll + offset);
    }
  },

  onRendered() {
    this.scrollParentContainer();
    let currcardmd = this.data().cardMarkdown;
    if (!currcardmd) {
      currcardmd = '';
    }
    const opts = {
      preloadText: currcardmd,
      clientSideStorage: false,
      autogrow: true,
    };
    Epic.create('mdeditorcontainer', opts);
  },

  onDestroyed() {
    this.componentParent().showOverlay1.set(false);
  },

  events() {
    const events = {
      [`${CSSEvents.animationend} .js-card-markdown`]() {
        this.isLoaded.set(true);
      },
    };

    return [_.extend(events, {
      'click .js-close-card-markdown'() {
        const newmd =  document.getElementById('epicareamdeditorcontainer').value;
        Cards.update({_id: Session.get('currentCard')}, { $set: {cardMarkdown: newmd}});
        Session.set('cardMarkdown', false);
      },
      'mouseenter .js-card-markdown'() {
        this.componentParent().showOverlay1.set(true);
        this.componentParent().mouseHasEnterCardMarkdown = true;
      },
    })];
  },

}).register('cardMarkdown');

// Close the card details pane by pressing escape
EscapeActions.register('detailsPane',
  () => { Utils.goBoardId(Session.get('currentBoard')); },
  () => { return !Session.equals('currentCard', null); }, {
    noClickEscapeOn: '.js-card-markdown,.board-sidebar,#header',
  }
);
